/**
 * Heuristic gate: is there a portrait business-card-like rectangle fully inside the overlay crop?
 * Uses Sobel magnitude, adaptive threshold, edge-mass bounding box + inset / aspect / clutter checks.
 */

export type OverlayCardGateDetail = 'pass' | 'weak_scene' | 'not_framed';

export type OverlayCardGateResult = {
	pass: boolean;
	detail: OverlayCardGateDetail;
};

const MIN_INSET_RATIO = 0.026;
const EDGE_TRIM = 0.045;
const MIN_ASPECT = 1.08;
const MAX_ASPECT = 2.42;
const MIN_AREA_FRAC = 0.11;
const MAX_AREA_FRAC = 0.84;
const MIN_WIDTH_SPAN_FRAC = 0.2;
const MIN_HEIGHT_SPAN_FRAC = 0.2;
/** If many strong edges sit on the image rim, the card is likely clipped or there is no clear card. */
const MAX_BORDER_EDGE_FRAC = 0.34;
const MIN_EDGE_PIXEL_FRAC = 0.012;

function trimBounds(
	hist: Uint32Array,
	len: number,
	totalMass: number,
	trimFraction: number
): [number, number] | null {
	if (totalMass < 16) return null;
	const cut = Math.max(1, totalMass * trimFraction);
	let acc = 0;
	let left = 0;
	for (let i = 0; i < len; i++) {
		acc += hist[i];
		if (acc >= cut) {
			left = i;
			break;
		}
	}
	acc = 0;
	let right = len - 1;
	for (let i = len - 1; i >= 0; i--) {
		acc += hist[i];
		if (acc >= cut) {
			right = i;
			break;
		}
	}
	if (right - left < 4) return null;
	return [left, right];
}

/**
 * RGBA ImageData from the overlay crop only (same pixels that will be captured).
 */
export function overlayBusinessCardGate(imageData: ImageData): OverlayCardGateResult {
	const { data, width, height } = imageData;
	if (width < 40 || height < 40) {
		return { pass: false, detail: 'weak_scene' };
	}

	const n = width * height;
	const gray = new Float32Array(n);
	for (let i = 0, p = 0; p < data.length; i++, p += 4) {
		gray[i] = data[p] * 0.299 + data[p + 1] * 0.587 + data[p + 2] * 0.114;
	}

	const mag = new Float32Array(n);
	let sum = 0;
	let sumSq = 0;
	let interior = 0;
	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const o = y * width + x;
			const g00 = gray[o - width - 1];
			const g01 = gray[o - width];
			const g02 = gray[o - width + 1];
			const g10 = gray[o - 1];
			const g12 = gray[o + 1];
			const g20 = gray[o + width - 1];
			const g21 = gray[o + width];
			const g22 = gray[o + width + 1];
			const gx = -g00 + g02 - 2 * g10 + 2 * g12 - g20 + g22;
			const gy = -g00 - 2 * g01 - g02 + g20 + 2 * g21 + g22;
			const m = Math.hypot(gx, gy);
			mag[o] = m;
			sum += m;
			sumSq += m * m;
			interior++;
		}
	}

	const mean = sum / Math.max(interior, 1);
	const variance = Math.max(0, sumSq / Math.max(interior, 1) - mean * mean);
	const std = Math.sqrt(variance);
	const thresh = Math.max(10, Math.min(mean + 0.52 * std, mean * 1.9));

	const xHist = new Uint32Array(width);
	const yHist = new Uint32Array(height);
	let edgeCount = 0;
	let borderEdge = 0;
	const rimX0 = width * 0.018;
	const rimX1 = width * (1 - 0.018);
	const rimY0 = height * 0.018;
	const rimY1 = height * (1 - 0.018);

	for (let y = 1; y < height - 1; y++) {
		for (let x = 1; x < width - 1; x++) {
			const v = mag[y * width + x];
			if (v < thresh) continue;
			xHist[x]++;
			yHist[y]++;
			edgeCount++;
			if (x < rimX0 || x > rimX1 || y < rimY0 || y > rimY1) {
				borderEdge++;
			}
		}
	}

	const minEdges = width * height * MIN_EDGE_PIXEL_FRAC;
	if (edgeCount < minEdges) {
		return { pass: false, detail: 'weak_scene' };
	}

	if (borderEdge / edgeCount > MAX_BORDER_EDGE_FRAC) {
		return { pass: false, detail: 'not_framed' };
	}

	const xb = trimBounds(xHist, width, edgeCount, EDGE_TRIM);
	const yb = trimBounds(yHist, height, edgeCount, EDGE_TRIM);
	if (!xb || !yb) {
		return { pass: false, detail: 'not_framed' };
	}

	const [left, right] = xb;
	const [top, bottom] = yb;
	const wSpan = right - left + 1;
	const hSpan = bottom - top + 1;

	if (left / width < MIN_INSET_RATIO) return { pass: false, detail: 'not_framed' };
	if ((width - 1 - right) / width < MIN_INSET_RATIO) return { pass: false, detail: 'not_framed' };
	if (top / height < MIN_INSET_RATIO) return { pass: false, detail: 'not_framed' };
	if ((height - 1 - bottom) / height < MIN_INSET_RATIO) return { pass: false, detail: 'not_framed' };

	const aspect = hSpan / Math.max(wSpan, 1);
	if (aspect < MIN_ASPECT || aspect > MAX_ASPECT) {
		return { pass: false, detail: 'not_framed' };
	}

	const areaFrac = (wSpan * hSpan) / (width * height);
	if (areaFrac < MIN_AREA_FRAC || areaFrac > MAX_AREA_FRAC) {
		return { pass: false, detail: 'not_framed' };
	}

	if (wSpan < width * MIN_WIDTH_SPAN_FRAC || hSpan < height * MIN_HEIGHT_SPAN_FRAC) {
		return { pass: false, detail: 'not_framed' };
	}

	return { pass: true, detail: 'pass' };
}
