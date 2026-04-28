<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	type CaptureMode = 'manual' | 'auto';

	let {
		onCaptured,
		autoStart = false
	}: { onCaptured: (file: File, mode: CaptureMode) => void | Promise<void>; autoStart?: boolean } =
		$props();

	let videoRef = $state<HTMLVideoElement | null>(null);
	let stream = $state<MediaStream | null>(null);
	let error = $state('');
	let status = $state('Align your business card inside the frame.');
	let qualityReady = $state(false);
	let autoCaptureLocked = $state(false);
	let stableFrames = $state(0);
	let analyzing = $state(false);
	let captureBusy = $state(false);

	let analysisCanvas: HTMLCanvasElement | null = null;
	let analysisContext: CanvasRenderingContext2D | null = null;
	let analyzeInterval: number | null = null;
	let previousSampleFrame: Uint8ClampedArray | null = null;

	const CARD_RATIO = 1.586;
	const ANALYSIS_INTERVAL_MS = 220;
	const REQUIRED_STABLE_FRAMES = 5;
	const ANALYSIS_WIDTH = 320;
	const ANALYSIS_HEIGHT = 240;
	const CAPTURE_BURST_FRAMES = 3;
	const CAPTURE_BURST_DELAY_MS = 90;
	const LIVE_BLUR_THRESHOLD = 22;
	const ENABLE_BLUR_BLOCKING = false;
	const CARD_MARGIN_MIN_RATIO = 0.015;
	const CARD_MARGIN_MAX_RATIO = 0.11;

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
					width: { ideal: 1920, min: 1280 },
					height: { ideal: 1080, min: 720 }
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
				await videoRef.play();
				startAutoAnalysis();
				status = 'Searching for a stable card...';
			}
		} catch {
			error = 'Camera access failed. Use file upload instead.';
		}
	}

	function stopCamera() {
		stopAutoAnalysis();
		stream?.getTracks().forEach((track) => track.stop());
		stream = null;
		qualityReady = false;
		autoCaptureLocked = false;
		stableFrames = 0;
		previousSampleFrame = null;
		status = 'Align your business card inside the frame.';
	}

	function resetAutoCapture() {
		autoCaptureLocked = false;
		captureBusy = false;
		stableFrames = 0;
	}

	function stopAutoAnalysis() {
		if (analyzeInterval !== null) {
			clearInterval(analyzeInterval);
			analyzeInterval = null;
		}
		analyzing = false;
	}

	function startAutoAnalysis() {
		stopAutoAnalysis();
		if (typeof document === 'undefined') return;
		if (!analysisCanvas) {
			analysisCanvas = document.createElement('canvas');
			analysisContext = analysisCanvas.getContext('2d', { willReadFrequently: true });
		}
		if (!videoRef || !analysisCanvas || !analysisContext) return;
		analyzing = true;
		analyzeInterval = window.setInterval(analyzeFrame, ANALYSIS_INTERVAL_MS);
	}

	function getOverlayRect(width: number, height: number) {
		const targetWidth = width * 0.84;
		const targetHeight = targetWidth / CARD_RATIO;
		if (targetHeight <= height * 0.84) {
			const x = (width - targetWidth) / 2;
			const y = (height - targetHeight) / 2;
			return { x, y, width: targetWidth, height: targetHeight };
		}

		const resizedHeight = height * 0.84;
		const resizedWidth = resizedHeight * CARD_RATIO;
		const x = (width - resizedWidth) / 2;
		const y = (height - resizedHeight) / 2;
		return { x, y, width: resizedWidth, height: resizedHeight };
	}

	function analyzeFrame() {
		if (
			!videoRef ||
			!analysisCanvas ||
			!analysisContext ||
			!stream ||
			autoCaptureLocked ||
			captureBusy
		) {
			return;
		}
		if (videoRef.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
		if (videoRef.videoWidth === 0 || videoRef.videoHeight === 0) return;

		analysisCanvas.width = ANALYSIS_WIDTH;
		analysisCanvas.height = ANALYSIS_HEIGHT;
		analysisContext.drawImage(videoRef, 0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);

		const overlayRect = getOverlayRect(ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
		const imageData = analysisContext.getImageData(
			Math.round(overlayRect.x),
			Math.round(overlayRect.y),
			Math.round(overlayRect.width),
			Math.round(overlayRect.height)
		);
		const data = imageData.data;

		let totalBrightness = 0;
		let edgeHits = 0;
		let totalGradient = 0;
		let pixelCount = 0;

		for (let i = 0; i < data.length; i += 4) {
			const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
			totalBrightness += brightness;
			pixelCount++;
		}

		const width = imageData.width;
		const height = imageData.height;
		const edgeThreshold = 28;
		const edgeMap = new Uint8Array(width * height);
		for (let y = 0; y < height - 1; y++) {
			for (let x = 0; x < width - 1; x++) {
				const index = (y * width + x) * 4;
				const right = index + 4;
				const down = ((y + 1) * width + x) * 4;
				const brightnessA = (data[index] + data[index + 1] + data[index + 2]) / 3;
				const brightnessRight = (data[right] + data[right + 1] + data[right + 2]) / 3;
				const brightnessDown = (data[down] + data[down + 1] + data[down + 2]) / 3;
				const gradient =
					Math.abs(brightnessA - brightnessRight) + Math.abs(brightnessA - brightnessDown);
				totalGradient += gradient;
				if (gradient > edgeThreshold) {
					edgeHits++;
					edgeMap[y * width + x] = 1;
				}
			}
		}

		const avgBrightness = totalBrightness / Math.max(pixelCount, 1);
		const edgeDensity = edgeHits / Math.max(width * height, 1);
		const blurScore = totalGradient / Math.max((width - 1) * (height - 1), 1);

		const sample = sampleFrame(data, 8);
		const motionScore = previousSampleFrame ? computeDiff(previousSampleFrame, sample) : 0;
		previousSampleFrame = sample;

		const brightnessOk = avgBrightness > 68 && avgBrightness < 210;
		const edgeOk = edgeDensity > 0.06 && edgeDensity < 0.3;
		const stableOk = motionScore < 14;
		const blurOk = blurScore > LIVE_BLUR_THRESHOLD;
		const cardFit = estimateCardFit(edgeMap, width, height);
		const marginLeft = cardFit.left / Math.max(width, 1);
		const marginRight = (width - cardFit.right - 1) / Math.max(width, 1);
		const marginTop = cardFit.top / Math.max(height, 1);
		const marginBottom = (height - cardFit.bottom - 1) / Math.max(height, 1);
		const sizeOk =
			cardFit.found &&
			marginLeft >= CARD_MARGIN_MIN_RATIO &&
			marginLeft <= CARD_MARGIN_MAX_RATIO &&
			marginRight >= CARD_MARGIN_MIN_RATIO &&
			marginRight <= CARD_MARGIN_MAX_RATIO &&
			marginTop >= CARD_MARGIN_MIN_RATIO &&
			marginTop <= CARD_MARGIN_MAX_RATIO &&
			marginBottom >= CARD_MARGIN_MIN_RATIO &&
			marginBottom <= CARD_MARGIN_MAX_RATIO;
		const ready = brightnessOk && edgeOk && stableOk && sizeOk;

		qualityReady = ready;
		if (ready) {
			stableFrames += 1;
			status =
				stableFrames >= REQUIRED_STABLE_FRAMES
					? 'Card stable. Capturing...'
					: `Hold still... ${REQUIRED_STABLE_FRAMES - stableFrames}`;
		} else {
			stableFrames = 0;
			if (!brightnessOk) {
				status = avgBrightness <= 68 ? 'Too dark. Add more light.' : 'Too bright. Reduce glare.';
			} else if (!blurOk) {
				status = 'Image is blurry. Hold still or move closer.';
			} else if (!stableOk) {
				status = 'Hold steady.';
			} else if (!sizeOk) {
				status = 'Move card closer and keep all edges inside the guide band.';
			} else {
				status = 'Place card fully inside the frame.';
			}
		}

		if (stableFrames >= REQUIRED_STABLE_FRAMES) {
			takeSnapshot('auto');
		}
	}

	function sampleFrame(data: Uint8ClampedArray, step: number): Uint8ClampedArray {
		const sampled = new Uint8ClampedArray(Math.ceil(data.length / (4 * step)));
		let cursor = 0;
		for (let i = 0; i < data.length; i += 4 * step) {
			sampled[cursor++] = (data[i] + data[i + 1] + data[i + 2]) / 3;
		}
		return sampled;
	}

	function estimateCardFit(
		edgeMap: Uint8Array,
		width: number,
		height: number
	): { found: boolean; left: number; right: number; top: number; bottom: number } {
		const minHitsPerRow = Math.max(8, Math.floor(width * 0.04));
		const minHitsPerCol = Math.max(8, Math.floor(height * 0.04));
		let top = -1;
		let bottom = -1;
		let left = -1;
		let right = -1;

		for (let y = 0; y < height; y++) {
			let hits = 0;
			for (let x = 0; x < width; x++) {
				hits += edgeMap[y * width + x];
			}
			if (hits >= minHitsPerRow) {
				top = y;
				break;
			}
		}
		for (let y = height - 1; y >= 0; y--) {
			let hits = 0;
			for (let x = 0; x < width; x++) {
				hits += edgeMap[y * width + x];
			}
			if (hits >= minHitsPerRow) {
				bottom = y;
				break;
			}
		}
		for (let x = 0; x < width; x++) {
			let hits = 0;
			for (let y = 0; y < height; y++) {
				hits += edgeMap[y * width + x];
			}
			if (hits >= minHitsPerCol) {
				left = x;
				break;
			}
		}
		for (let x = width - 1; x >= 0; x--) {
			let hits = 0;
			for (let y = 0; y < height; y++) {
				hits += edgeMap[y * width + x];
			}
			if (hits >= minHitsPerCol) {
				right = x;
				break;
			}
		}

		if (top < 0 || bottom < 0 || left < 0 || right < 0 || bottom <= top || right <= left) {
			return { found: false, left: 0, right: width - 1, top: 0, bottom: height - 1 };
		}
		return { found: true, left, right, top, bottom };
	}

	function computeDiff(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
		const length = Math.min(a.length, b.length);
		if (length === 0) return 0;
		let total = 0;
		for (let i = 0; i < length; i++) {
			total += Math.abs(a[i] - b[i]);
		}
		return total / length;
	}

	async function takeSnapshot(mode: CaptureMode) {
		if (!videoRef || captureBusy) return;
		captureBusy = true;
		if (mode === 'auto') {
			autoCaptureLocked = true;
		}
		try {
			status =
				mode === 'auto' ? 'Capturing best frame...' : 'Capturing burst and selecting sharpest frame...';
			const file = await captureBestBurstFrame();
			status = mode === 'auto' ? 'Uploading card for OCR...' : 'Captured.';
			await onCaptured(file, mode);
		} catch {
			error = 'Capture failed. Please try again.';
			resetAutoCapture();
		} finally {
			if (mode === 'manual') {
				captureBusy = false;
			}
		}
	}

	async function captureBestBurstFrame(): Promise<File> {
		if (!videoRef) {
			throw new Error('No active video stream');
		}
		const canvas = document.createElement('canvas');
		const cropRect = getOverlayRect(videoRef.videoWidth, videoRef.videoHeight);
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
				videoRef,
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
			void startCamera();
		}
	});
</script>

<div class="camera-panel">
	<h2>Camera capture</h2>
	{#if supportsCamera}
		<div class="video-shell">
			<video bind:this={videoRef} playsinline muted></video>
			<div class="card-overlay" class:ready={qualityReady}>
				<div class="card-window">
					<div class="card-window-inner"></div>
				</div>
			</div>
			<div class="status-overlay" role="status" aria-live="polite">
				{status}
			</div>
		</div>
		<p class="guide-note">
			Place the card as large as possible: fully inside the frame, with the card edge inside the
			band between the inner dashed line and the outer border.
		</p>
		<div class="actions">
			<button type="button" onclick={startCamera}>Start camera</button>
			<button
				type="button"
				onclick={() => takeSnapshot('manual')}
				disabled={!stream || captureBusy}
			>
				Capture manually
			</button>
			<button type="button" onclick={stopCamera} disabled={!stream}>Stop</button>
		</div>
	{:else}
		<p>{cameraUnavailableReason || 'Camera API is not available in this browser.'}</p>
	{/if}
	{#if error}
		<p class="error">{error}</p>
	{/if}
</div>

<style>
	.camera-panel {
		display: grid;
		gap: 0.75rem;
	}
	.video-shell {
		position: relative;
	}
	video {
		width: 100%;
		border-radius: 0.75rem;
		background: #111;
		aspect-ratio: 4 / 3;
		object-fit: cover;
	}
	.card-overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		pointer-events: none;
	}
	.card-window {
		position: relative;
		width: 84%;
		aspect-ratio: 1.586;
		max-height: 84%;
		border: 2px solid #f4f4f5;
		border-radius: 0.85rem;
		box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.34);
		background: transparent;
	}
	.card-window-inner {
		position: absolute;
		inset: 5%;
		border: 2px dashed #f4f4f5;
		border-radius: 0.7rem;
	}
	.ready .card-window {
		border-color: #22c55e;
		box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.2);
	}
	.ready .card-window-inner {
		border-color: #22c55e;
	}
	.status-overlay {
		position: absolute;
		left: 50%;
		bottom: 0.9rem;
		transform: translateX(-50%);
		max-width: calc(100% - 1.5rem);
		padding: 0.45rem 0.7rem;
		border-radius: 0.65rem;
		background: rgba(17, 17, 17, 0.72);
		color: #fafafa;
		font-size: 0.9rem;
		line-height: 1.25;
		text-align: center;
		pointer-events: none;
		backdrop-filter: blur(2px);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.error {
		color: #b91c1c;
		font-size: 0.9rem;
	}
	.guide-note {
		margin: 0;
		font-size: 0.9rem;
		color: #3f3f46;
	}
</style>
