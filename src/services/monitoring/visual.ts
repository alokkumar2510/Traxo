import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { logger } from "@/utils/logger";

export interface VisualDiffResult {
  changesDetected: boolean;
  diffBuffer?: Buffer;
  diffPixels?: number;
  mismatchPercentage?: number;
  width?: number;
  height?: number;
}

/**
 * Creates a blank white PNG image of the specified size
 */
function createWhitePNG(width: number, height: number): PNG {
  const png = new PNG({ width, height });
  const data = png.data;
  const len = data.length;
  // Initialize with solid white pixels (255, 255, 255, 255)
  for (let i = 0; i < len; i += 4) {
    data[i] = 255;     // Red
    data[i + 1] = 255; // Green
    data[i + 2] = 255; // Blue
    data[i + 3] = 255; // Alpha
  }
  return png;
}

/**
 * Copies source image pixels onto a target destination image
 */
function blitImage(src: PNG, dest: PNG): void {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const srcIdx = (src.width * y + x) << 2;
      const destIdx = (dest.width * y + x) << 2;
      dest.data[destIdx] = src.data[srcIdx];
      dest.data[destIdx + 1] = src.data[srcIdx + 1];
      dest.data[destIdx + 2] = src.data[srcIdx + 2];
      dest.data[destIdx + 3] = src.data[srcIdx + 3];
    }
  }
}

/**
 * Decodes and compares two screenshots, generating red/violet diff highlights
 */
export function generateVisualDiff(
  img1Buffer: Buffer,
  img2Buffer: Buffer
): VisualDiffResult {
  logger.info({
    service: "monitoring",
    event: "visual_comparison_started",
    metadata: { img1Size: img1Buffer.length, img2Size: img2Buffer.length },
  });

  try {
    const rawImg1 = PNG.sync.read(img1Buffer);
    const rawImg2 = PNG.sync.read(img2Buffer);

    const maxWidth = Math.max(rawImg1.width, rawImg2.width);
    const maxHeight = Math.max(rawImg1.height, rawImg2.height);

    // Align images to the maximum width/height to prevent pixelmatch crashes
    const img1 = createWhitePNG(maxWidth, maxHeight);
    blitImage(rawImg1, img1);

    const img2 = createWhitePNG(maxWidth, maxHeight);
    blitImage(rawImg2, img2);

    const diff = new PNG({ width: maxWidth, height: maxHeight });

    // Compare pixels using pixelmatch
    const diffPixels = pixelmatch(
      img1.data,
      img2.data,
      diff.data,
      maxWidth,
      maxHeight,
      {
        threshold: 0.1, // standard sensitivity
        includeAA: true, // ignore anti-aliasing subpixel differences
      }
    );

    const totalPixels = maxWidth * maxHeight;
    const mismatchPercentage = (diffPixels / totalPixels) * 100;

    logger.info({
      service: "monitoring",
      event: "visual_comparison_completed",
      metadata: { diffPixels, mismatchPercentage, width: maxWidth, height: maxHeight },
    });

    // We consider it a change if more than 50 pixels differ (filters out single-pixel rendering noise)
    if (diffPixels > 50) {
      const diffBuffer = PNG.sync.write(diff);
      return {
        changesDetected: true,
        diffBuffer,
        diffPixels,
        mismatchPercentage,
        width: maxWidth,
        height: maxHeight,
      };
    }

    return {
      changesDetected: false,
    };
  } catch (error: any) {
    logger.error({
      service: "monitoring",
      event: "visual_comparison_failed",
      error: error.message || error,
    });
    throw error;
  }
}
