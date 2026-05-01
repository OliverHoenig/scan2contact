<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount, tick, untrack } from 'svelte';

	let { autoStart = false, fullBleed = false }: { autoStart?: boolean; fullBleed?: boolean } =
		$props();

	let videoRef = $state<HTMLVideoElement | null>(null);
	let videoShellRef = $state<HTMLDivElement | null>(null);
	/** Pixel box aligned to visible video (object-fit: cover) + getOverlayRect; empty until layout runs. */
	let guideBoxStyle = $state('');
	let stream = $state<MediaStream | null>(null);
	let error = $state('');
	let status = $state('');
	let captureBusy = $state(false);
	let lightSupported = $state(false);
	let lightEnabled = $state(false);

	/** Physical card width ÷ height (landscape). Scan frame is portrait: frame height ÷ frame width = this. */
	const CARD_RATIO = 1.586;
	const CAPTURE_BURST_FRAMES = 3;
	const CAPTURE_BURST_DELAY_MS = 90;
	/** Only used if ENABLE_BLUR_BLOCKING is true; burst capture already picks the sharpest frame. */
	const LIVE_BLUR_THRESHOLD = 8;
	const ENABLE_BLUR_BLOCKING = false;
	/** Guide frame: use almost full width of the visible crop; cap height if the card would not fit. */
	const OVERLAY_WIDTH_FRAC = 0.94;
	const OVERLAY_HEIGHT_FRAC = 0.94;
	/** Media Capture constraint key for the device light (browser API name). */
	const MEDIA_CAPTURE_LIGHT_KEY = 'torch' as const;

	let supportsCamera = $state(false);
	let cameraUnavailableReason = $state('');
	const dispatch = createEventDispatcher<{
		lightstate: { supported: boolean; enabled: boolean };
	}>();

	function emitLightState() {
		dispatch('lightstate', { supported: lightSupported, enabled: lightEnabled });
	}

	function detectCameraSupport() {
		if (typeof window === 'undefined' || typeof navigator === 'undefined') {
			supportsCamera = false;
			cameraUnavailableReason = '';
			return;
		}

		const isSecure = window.isSecureContext;
		const hasMediaDevices = !!navigator.mediaDevices;
		const hasGetUserMedia = typeof navigator.mediaDevices?.getUserMedia === 'function';
		supportsCamera = isSecure && hasMediaDevices && hasGetUserMedia;

		if (supportsCamera) {
			cameraUnavailableReason = '';
			return;
		}

		if (!isSecure) {
			cameraUnavailableReason = 'Camera access requires HTTPS (or localhost).';
		} else if (!hasMediaDevices || !hasGetUserMedia) {
			cameraUnavailableReason = 'This browser does not support camera capture.';
		} else {
			cameraUnavailableReason = 'Camera is unavailable on this device/browser.';
		}
	}

	function messageForGetUserMediaFailure(err: unknown): string {
		if (err instanceof DOMException) {
			if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
				return 'Camera permission was denied. Allow camera access for this site in your browser or device privacy settings.';
			}
			if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
				return 'No camera was found.';
			}
			if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
				return 'This camera cannot use the requested resolution.';
			}
			if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
				return 'Camera is busy or unavailable (another app may be using it).';
			}
		}
		return 'Camera access failed.';
	}

	async function startCamera() {
		if (!supportsCamera || stream) return;

		/** Strict mins can trigger OverconstrainedError on devices that only expose 720p (e.g. some iPhones). */
		const attempts: MediaStreamConstraints[] = [
			{
				video: {
					facingMode: { ideal: 'environment' },
					width: { ideal: 1080, min: 720 },
					height: { ideal: 1920, min: 1280 }
				},
				audio: false
			},
			{
				video: { facingMode: { ideal: 'environment' } },
				audio: false
			},
			{ video: true, audio: false }
		];

		let lastError: unknown;
		for (const constraints of attempts) {
			try {
				stream = await navigator.mediaDevices.getUserMedia(constraints);
				break;
			} catch (e) {
				lastError = e;
			}
		}

		if (!stream) {
			error = messageForGetUserMediaFailure(lastError);
			return;
		}

		try {
			const videoTrack = stream.getVideoTracks()[0];
			if (videoTrack?.applyConstraints) {
				try {
					await videoTrack.applyConstraints({
						advanced: [{ focusMode: 'continuous' } as unknown as MediaTrackConstraintSet]
					});
				} catch {
					// Ignore unsupported focus mode constraints.
				}
			}
			await detectLightSupport();
			// Stream → <video> binding runs in $effect when videoRef exists (avoids getUserMedia vs bind:this race).
		} catch {
			stopCamera();
			error = 'Camera access failed.';
		}
	}

	function stopCamera() {
		stream?.getTracks().forEach((track) => track.stop());
		stream = null;
		lightSupported = false;
		lightEnabled = false;
		emitLightState();
		guideBoxStyle = '';
		if (videoRef) {
			videoRef.onloadedmetadata = null;
			videoRef.onresize = null;
			videoRef.srcObject = null;
		}
		captureBusy = false;
		status = 'Camera stopped.';
	}

	async function detectLightSupport() {
		const track = stream?.getVideoTracks()[0];
		if (!track) {
			lightSupported = false;
			lightEnabled = false;
			return;
		}
		const capabilities = track.getCapabilities?.() as Record<string, unknown> | undefined;
		lightSupported = !!capabilities?.[MEDIA_CAPTURE_LIGHT_KEY];
		if (!lightSupported) {
			lightEnabled = false;
		}
		emitLightState();
	}

	async function setLight(enabled: boolean) {
		if (!lightSupported) return;
		const track = stream?.getVideoTracks()[0];
		if (!track?.applyConstraints) return;
		try {
			await track.applyConstraints({
				advanced: [{ [MEDIA_CAPTURE_LIGHT_KEY]: enabled } as unknown as MediaTrackConstraintSet]
			});
			lightEnabled = enabled;
			emitLightState();
		} catch {
			error = 'Light could not be changed on this device.';
		}
	}

	export async function toggleLight() {
		await setLight(!lightEnabled);
	}

	/** Card in portrait: narrow edge left–right, long edge top–bottom (fits phone held upright). */
	function getOverlayRect(width: number, height: number, originX = 0, originY = 0) {
		const maxW = width * OVERLAY_WIDTH_FRAC;
		const maxH = height * OVERLAY_HEIGHT_FRAC;
		let targetWidth = maxW;
		let targetHeight = targetWidth * CARD_RATIO;
		if (targetHeight > maxH) {
			targetHeight = maxH;
			targetWidth = targetHeight / CARD_RATIO;
		}
		const x = originX + (width - targetWidth) / 2;
		const y = originY + (height - targetHeight) / 2;
		return { x, y, width: targetWidth, height: targetHeight };
	}

	/** Maps intrinsic video coords to the on-screen box when the video uses object-fit: cover. */
	function videoCoverMapping(
		vw: number,
		vh: number,
		cw: number,
		ch: number
	): { scale: number; dx: number; dy: number } {
		const scale = Math.max(cw / vw, ch / vh);
		const dispW = vw * scale;
		const dispH = vh * scale;
		const dx = (cw - dispW) / 2;
		const dy = (ch - dispH) / 2;
		return { scale, dx, dy };
	}

	function getVisibleVideoRect(vw: number, vh: number, cw: number, ch: number) {
		const { scale, dx, dy } = videoCoverMapping(vw, vh, cw, ch);
		const x = Math.max(0, -dx / scale);
		const y = Math.max(0, -dy / scale);
		const width = Math.min(vw, cw / scale);
		const height = Math.min(vh, ch / scale);
		return { x, y, width, height, scale, dx, dy };
	}

	function getGuideCropRect(v: HTMLVideoElement, shell: HTMLDivElement) {
		const vw = v.videoWidth;
		const vh = v.videoHeight;
		const cr = shell.getBoundingClientRect();
		const cw = cr.width;
		const ch = cr.height;
		if (vw === 0 || vh === 0 || cw === 0 || ch === 0) {
			return null;
		}
		const visible = getVisibleVideoRect(vw, vh, cw, ch);
		const overlay = getOverlayRect(visible.width, visible.height, visible.x, visible.y);
		return { overlay, visible };
	}

	function updateGuideLayout() {
		const v = videoRef;
		const shell = videoShellRef;
		if (!v || !shell) {
			guideBoxStyle = '';
			return;
		}
		const guide = getGuideCropRect(v, shell);
		if (!guide) {
			guideBoxStyle = '';
			return;
		}
		const { overlay: r, visible } = guide;
		const { scale, dx, dy } = visible;
		const left = dx + r.x * scale;
		const top = dy + r.y * scale;
		const w = r.width * scale;
		const h = r.height * scale;
		guideBoxStyle = `left:${Math.round(left)}px;top:${Math.round(top)}px;width:${Math.round(w)}px;height:${Math.round(h)}px`;
	}

	/** Called from parent when the user presses Scan: capture frame and return image file. */
	export async function captureFrame(): Promise<File> {
		if (!supportsCamera) {
			throw new Error(cameraUnavailableReason || 'Camera is not available');
		}
		if (!stream) {
			throw new Error('Camera is still starting — try again in a moment.');
		}
		if (!videoRef || captureBusy) {
			throw new Error('Capture is busy.');
		}
		if (videoRef.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
			throw new Error('Video is not ready yet.');
		}
		captureBusy = true;
		error = '';
		try {
			status = 'Capturing…';
			const file = await captureBestBurstFrame();
			return file;
		} catch (unknownError) {
			const msg =
				unknownError instanceof Error ? unknownError.message : 'Capture failed. Please try again.';
			throw new Error(msg);
		} finally {
			captureBusy = false;
			if (stream) {
				status = 'Position the card, then press Scan.';
			}
		}
	}

	async function captureBestBurstFrame(): Promise<File> {
		const v = videoRef;
		const shell = videoShellRef;
		if (!v || !shell) {
			throw new Error('No active video stream');
		}
		const guide = getGuideCropRect(v, shell);
		if (!guide) {
			throw new Error('Video layout is not ready yet');
		}
		const { overlay: cropRect } = guide;
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(cropRect.width);
		canvas.height = Math.round(cropRect.height);
		const context = canvas.getContext('2d', { willReadFrequently: true });
		if (!context) {
			throw new Error('Failed to initialize snapshot context');
		}

		let bestBlob: Blob | null = null;
		let bestSharpness = -Infinity;
		for (let frame = 0; frame < CAPTURE_BURST_FRAMES; frame += 1) {
			context.drawImage(
				v,
				Math.round(cropRect.x),
				Math.round(cropRect.y),
				Math.round(cropRect.width),
				Math.round(cropRect.height),
				0,
				0,
				canvas.width,
				canvas.height
			);
			const frameData = context.getImageData(0, 0, canvas.width, canvas.height);
			const sharpness = calculateSharpness(frameData.data, frameData.width, frameData.height);
			const blob = await canvasToJpegBlob(canvas);
			if (sharpness > bestSharpness) {
				bestSharpness = sharpness;
				bestBlob = blob;
			}
			if (frame < CAPTURE_BURST_FRAMES - 1) {
				await delay(CAPTURE_BURST_DELAY_MS);
			}
		}

		if (!bestBlob) {
			throw new Error('Image too blurry');
		}
		if (ENABLE_BLUR_BLOCKING && bestSharpness < LIVE_BLUR_THRESHOLD) {
			throw new Error('Image too blurry');
		}

		return new File([bestBlob], 'business-card.jpg', { type: 'image/jpeg' });
	}

	function calculateSharpness(data: Uint8ClampedArray, width: number, height: number): number {
		let totalGradient = 0;
		let samples = 0;
		for (let y = 0; y < height - 1; y += 2) {
			for (let x = 0; x < width - 1; x += 2) {
				const index = (y * width + x) * 4;
				const right = index + 4;
				const down = ((y + 1) * width + x) * 4;
				const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
				const brightnessRight = (data[right] + data[right + 1] + data[right + 2]) / 3;
				const brightnessDown = (data[down] + data[down + 1] + data[down + 2]) / 3;
				totalGradient +=
					Math.abs(brightness - brightnessRight) + Math.abs(brightness - brightnessDown);
				samples += 1;
			}
		}
		return totalGradient / Math.max(samples, 1);
	}

	function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
		return new Promise((resolve, reject) => {
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						reject(new Error('No blob from canvas'));
						return;
					}
					resolve(blob);
				},
				'image/jpeg',
				0.94
			);
		});
	}

	function delay(ms: number): Promise<void> {
		return new Promise((resolve) => {
			window.setTimeout(resolve, ms);
		});
	}

	onDestroy(() => stopCamera());
	onMount(() => {
		detectCameraSupport();
		if (autoStart) {
			status = 'Starting camera…';
			void tick().then(() => startCamera());
		} else {
			status = 'Press Start camera to begin.';
		}
	});

	/** Keep deps to video + stream (+ busy for status); untrack layout/status writes to avoid effect feedback loops. */
	$effect(() => {
		const v = videoRef;
		const s = stream;
		const busy = captureBusy;
		if (!v || !s) return;

		untrack(() => {
			if (v.srcObject !== s) {
				v.srcObject = s;
			}
			v.onloadedmetadata = () => updateGuideLayout();
			v.onresize = () => updateGuideLayout();
			void v
				.play()
				.then(() => updateGuideLayout())
				.catch(() => {});
			updateGuideLayout();
			if (!busy) {
				status = 'Position the card, then press Scan.';
			}
		});
	});

	$effect(() => {
		const shell = videoShellRef;
		if (typeof ResizeObserver === 'undefined' || !shell) return;
		const ro = new ResizeObserver(() => updateGuideLayout());
		ro.observe(shell);
		const onWinResize = () => updateGuideLayout();
		window.addEventListener('resize', onWinResize);
		queueMicrotask(() => updateGuideLayout());
		return () => {
			ro.disconnect();
			window.removeEventListener('resize', onWinResize);
		};
	});
</script>

<div class={`grid gap-3 ${fullBleed ? 'flex h-full min-h-0 w-full flex-col gap-0' : ''}`}>
	{#if !fullBleed}
		<h2>Camera capture</h2>
	{/if}
	{#if supportsCamera}
		<div
			class={`relative overflow-hidden ${fullBleed ? 'min-h-0 w-full flex-1 rounded-none border-0 shadow-none' : 'rounded-[var(--radius-md)] border border-[var(--border)] shadow-[0_20px_50px_rgba(0,0,0,0.35)]'}`}
			bind:this={videoShellRef}
		>
			<video
				class={`pointer-events-none w-full bg-[var(--bg-base)] object-cover ${fullBleed ? 'absolute inset-0 [aspect-ratio:unset] h-full min-h-0 rounded-none' : '[aspect-ratio:3/4] min-h-[min(70vh,34rem)] rounded-[var(--radius-md)] sm:[aspect-ratio:4/3] sm:min-h-[22rem]'}`}
				bind:this={videoRef}
				playsinline
				muted
			></video>
			<div class="pointer-events-none absolute inset-0">
				{#if guideBoxStyle}
					<div
						class="absolute box-border rounded-2xl border-2 border-[rgba(94,234,212,0.85)] bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.42),0_0_28px_rgba(94,234,212,0.2)]"
						style={guideBoxStyle}
					>
						<div
							class="absolute inset-[5%] rounded-[0.8rem] border-2 border-dashed border-[rgba(244,244,245,0.45)]"
						></div>
					</div>
				{/if}
			</div>
			<div
				class={`pointer-events-none absolute left-1/2 max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-[var(--radius-pill)] border border-[var(--border)] bg-[rgba(12,12,15,0.82)] px-[0.85rem] py-2 text-center text-[0.8125rem] leading-[1.35] text-[var(--text-muted)] backdrop-blur-[12px] ${fullBleed ? 'bottom-[calc(var(--capture-bottom-toolbar,4.25rem)+env(safe-area-inset-bottom,0px)+0.35rem)]' : 'bottom-[0.9rem]'}`}
				role="status"
				aria-live="polite"
			>
				{status}
			</div>
		</div>
		{#if !fullBleed}
			<p class="m-0 text-[0.9rem] leading-[1.5] text-[var(--text-muted)]">
				Hold the card <strong class="font-semibold text-[var(--text)]">upright</strong> (narrow
				edges top/bottom, long edges left/right). Fill the frame; keep the card inside the band
				between the dashed line and the outer border. Press
				<strong class="font-semibold text-[var(--text)]">Scan</strong> in the app to capture and run OCR.
			</p>
			<div class="flex flex-wrap gap-2">
				<button
					class="min-h-12 flex-[1_1_100%] cursor-pointer rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] font-semibold text-[var(--text)] hover:not-disabled:border-[rgba(255,255,255,0.22)] sm:flex-none"
					type="button"
					onclick={startCamera}>Start camera</button
				>
				<button
					class="min-h-12 flex-[1_1_100%] cursor-pointer rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] font-semibold text-[var(--text)] hover:not-disabled:border-[rgba(255,255,255,0.22)] disabled:cursor-not-allowed sm:flex-none"
					type="button"
					onclick={stopCamera}
					disabled={!stream}>Stop</button
				>
			</div>
		{/if}
	{:else}
		<p
			class={fullBleed
				? 'absolute right-3 bottom-[calc(var(--capture-bottom-toolbar,4.25rem)+env(safe-area-inset-bottom,0px)+0.5rem)] left-3 z-[5] m-0 rounded-lg bg-[rgba(24,24,27,0.88)] p-[0.6rem] text-[0.88rem] text-[#fafafa]'
				: ''}
		>
			{cameraUnavailableReason || 'Camera API is not available in this browser.'}
		</p>
	{/if}
	{#if error}
		<p
			class={`text-[0.9rem] text-[var(--danger)] ${fullBleed ? 'absolute top-[calc(env(safe-area-inset-top,0px)+3.25rem)] right-3 left-3 z-[15] m-0 rounded-lg bg-[rgba(127,29,29,0.92)] px-[0.6rem] py-2 text-[0.85rem] text-white' : ''}`}
		>
			{error}
		</p>
	{/if}
</div>
