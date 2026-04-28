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

	const supportsCamera =
		typeof navigator !== 'undefined' &&
		!!navigator.mediaDevices &&
		typeof navigator.mediaDevices.getUserMedia === 'function';

	async function startCamera() {
		if (!supportsCamera || stream) return;

		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment' },
				audio: false
			});
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
		let pixelCount = 0;

		for (let i = 0; i < data.length; i += 4) {
			const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
			totalBrightness += brightness;
			pixelCount++;
		}

		const width = imageData.width;
		const height = imageData.height;
		const edgeThreshold = 28;
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
				if (gradient > edgeThreshold) edgeHits++;
			}
		}

		const avgBrightness = totalBrightness / Math.max(pixelCount, 1);
		const edgeDensity = edgeHits / Math.max(width * height, 1);

		const sample = sampleFrame(data, 8);
		const motionScore = previousSampleFrame ? computeDiff(previousSampleFrame, sample) : 0;
		previousSampleFrame = sample;

		const brightnessOk = avgBrightness > 68 && avgBrightness < 210;
		const edgeOk = edgeDensity > 0.06 && edgeDensity < 0.3;
		const stableOk = motionScore < 14;
		const ready = brightnessOk && edgeOk && stableOk;

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
			} else if (!stableOk) {
				status = 'Hold steady.';
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
		const canvas = document.createElement('canvas');
		canvas.width = videoRef.videoWidth;
		canvas.height = videoRef.videoHeight;
		const context = canvas.getContext('2d');
		if (!context) {
			resetAutoCapture();
			return;
		}
		context.drawImage(videoRef, 0, 0);
		canvas.toBlob(
			async (blob) => {
				if (!blob) {
					resetAutoCapture();
					return;
				}
				try {
					status = mode === 'auto' ? 'Uploading card for OCR...' : 'Captured.';
					await onCaptured(new File([blob], 'business-card.jpg', { type: 'image/jpeg' }), mode);
				} catch {
					error = 'Capture failed. Please try again.';
					resetAutoCapture();
				} finally {
					if (mode === 'manual') {
						captureBusy = false;
					}
				}
			},
			'image/jpeg',
			0.92
		);
	}

	onDestroy(() => stopCamera());
	onMount(() => {
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
				<div class="card-window"></div>
			</div>
			<div class="status-overlay" role="status" aria-live="polite">
				{status}
			</div>
		</div>
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
		<p>Camera API is not available in this browser.</p>
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
		width: 84%;
		aspect-ratio: 1.586;
		max-height: 84%;
		border: 2px dashed #f4f4f5;
		border-radius: 0.85rem;
		box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.34);
		background: transparent;
	}
	.ready .card-window {
		border-color: #22c55e;
		box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.2);
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
</style>
