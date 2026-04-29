<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

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

	let supportsCamera = $state(false);
	let cameraUnavailableReason = $state('');

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

	async function startCamera() {
		if (!supportsCamera || stream) return;

		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: { ideal: 'environment' },
					width: { ideal: 1080, min: 720 },
					height: { ideal: 1920, min: 1280 }
				},
				audio: false
			});
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
			if (videoRef) {
				videoRef.srcObject = stream;
				videoRef.onloadedmetadata = () => updateGuideLayout();
				videoRef.onresize = () => updateGuideLayout();
				await videoRef.play();
				updateGuideLayout();
				status = 'Position the card, then press Scan.';
			}
		} catch {
			error = 'Camera access failed.';
		}
	}

	function stopCamera() {
		stream?.getTracks().forEach((track) => track.stop());
		stream = null;
		guideBoxStyle = '';
		if (videoRef) {
			videoRef.onloadedmetadata = null;
			videoRef.onresize = null;
			videoRef.srcObject = null;
		}
		captureBusy = false;
		status = 'Camera stopped.';
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
			void startCamera();
		} else {
			status = 'Press Start camera to begin.';
		}
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

<div class="camera-panel" class:full-bleed={fullBleed}>
	{#if !fullBleed}
		<h2>Camera capture</h2>
	{/if}
	{#if supportsCamera}
		<div class="video-shell" class:full-bleed={fullBleed} bind:this={videoShellRef}>
			<video bind:this={videoRef} playsinline muted></video>
			<div class="card-overlay">
				{#if guideBoxStyle}
					<div class="card-window" style={guideBoxStyle}>
						<div class="card-window-inner"></div>
					</div>
				{/if}
			</div>
			<div class="status-overlay" class:full-bleed={fullBleed} role="status" aria-live="polite">
				{status}
			</div>
		</div>
		{#if !fullBleed}
			<p class="guide-note">
				Hold the card <strong>upright</strong> (narrow edges top/bottom, long edges left/right).
				Fill the frame; keep the card inside the band between the dashed line and the outer border.
				Press
				<strong>Scan</strong> in the app to capture and run OCR.
			</p>
			<div class="actions">
				<button type="button" onclick={startCamera}>Start camera</button>
				<button type="button" onclick={stopCamera} disabled={!stream}>Stop</button>
			</div>
		{/if}
	{:else}
		<p class:fallback-msg={fullBleed}>
			{cameraUnavailableReason || 'Camera API is not available in this browser.'}
		</p>
	{/if}
	{#if error}
		<p class="error" class:error--bleed={fullBleed}>{error}</p>
	{/if}
</div>

<style>
	.camera-panel {
		display: grid;
		gap: 0.75rem;
	}
	.camera-panel.full-bleed {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		min-height: 0;
		gap: 0;
	}
	.video-shell {
		position: relative;
		overflow: hidden;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
	}
	.video-shell.full-bleed {
		flex: 1;
		min-height: 0;
		width: 100%;
		border-radius: 0;
		border: none;
		box-shadow: none;
	}
	video {
		width: 100%;
		border-radius: var(--radius-md);
		background: var(--bg-base);
		aspect-ratio: 3 / 4;
		min-height: min(70vh, 34rem);
		object-fit: cover;
		pointer-events: none;
	}
	.video-shell.full-bleed video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		min-height: 0;
		aspect-ratio: unset;
		border-radius: 0;
	}
	.card-overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.card-window {
		position: absolute;
		box-sizing: border-box;
		border: 2px solid rgba(94, 234, 212, 0.85);
		border-radius: 1rem;
		box-shadow:
			0 0 0 9999px rgba(0, 0, 0, 0.42),
			0 0 28px rgba(94, 234, 212, 0.2);
		background: transparent;
	}
	.card-window-inner {
		position: absolute;
		inset: 5%;
		border: 2px dashed rgba(244, 244, 245, 0.45);
		border-radius: 0.8rem;
	}
	.status-overlay {
		position: absolute;
		left: 50%;
		bottom: 0.9rem;
		transform: translateX(-50%);
		max-width: calc(100% - 1.5rem);
		padding: 0.5rem 0.85rem;
		border-radius: var(--radius-pill);
		background: rgba(12, 12, 15, 0.82);
		border: 1px solid var(--border);
		color: var(--text-muted);
		font-size: 0.8125rem;
		line-height: 1.35;
		text-align: center;
		pointer-events: none;
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}
	.status-overlay.full-bleed {
		bottom: calc(
			var(--capture-bottom-toolbar, 4.25rem) + env(safe-area-inset-bottom, 0px) + 0.35rem
		);
	}
	.fallback-msg {
		position: absolute;
		left: 0.75rem;
		right: 0.75rem;
		bottom: calc(
			var(--capture-bottom-toolbar, 4.25rem) + env(safe-area-inset-bottom, 0px) + 0.5rem
		);
		margin: 0;
		padding: 0.6rem;
		border-radius: 0.5rem;
		background: rgba(24, 24, 27, 0.88);
		color: #fafafa;
		font-size: 0.88rem;
		z-index: 5;
	}
	.error--bleed {
		position: absolute;
		left: 0.75rem;
		right: 0.75rem;
		top: calc(env(safe-area-inset-top, 0px) + 3.25rem);
		margin: 0;
		padding: 0.5rem 0.6rem;
		border-radius: 0.5rem;
		background: rgba(127, 29, 29, 0.92);
		color: #fff;
		z-index: 15;
		font-size: 0.85rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.actions button {
		flex: 1 1 100%;
		min-height: 3rem;
		font-family: inherit;
		font-weight: 600;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-strong);
		background: var(--bg-surface);
		color: var(--text);
		cursor: pointer;
	}
	.actions button:hover:not(:disabled) {
		border-color: rgba(255, 255, 255, 0.22);
	}
	.error {
		color: var(--danger);
		font-size: 0.9rem;
	}
	.guide-note {
		margin: 0;
		font-size: 0.9rem;
		color: var(--text-muted);
		line-height: 1.5;
	}
	.guide-note strong {
		color: var(--text);
		font-weight: 600;
	}
	@media (min-width: 640px) {
		video {
			aspect-ratio: 4 / 3;
			min-height: 22rem;
		}
		.video-shell.full-bleed video {
			aspect-ratio: unset;
			min-height: 0;
		}
		.actions button {
			flex: 0 0 auto;
		}
	}
</style>
