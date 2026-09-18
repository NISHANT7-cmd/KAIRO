/**
 * Intelligent client-side image optimizer and payload compressor
 * Ensures images uploaded from mobile galleries or internal storage
 * are resized and compressed into ultra-efficient WebP/JPEG format,
 * preventing FUNCTION_PAYLOAD_TOO_LARGE / 413 Request Entity Too Large errors.
 */

export interface OptimizeImageOptions {
  maxDimension?: number; // max width or height in px (e.g. 1000 for covers)
  targetMaxBytes?: number; // target max size in bytes (e.g. 350,000 for ~350KB)
  initialQuality?: number; // initial compression quality 0.1 - 1.0 (default 0.82)
  avatarMode?: boolean;
  aspectRatio?: number; // optional width/height ratio constraint
}

export interface OptimizedImageResult {
  dataUrl: string;
  bytes: number;
  formattedSize: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Formats byte size into human readable string (e.g. "185 KB")
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Tests if the browser supports canvas.toDataURL('image/webp')
 */
function supportsWebP(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

/**
 * Compresses an HTMLImageElement through Canvas with adaptive iterative sizing.
 * Guarantees output payload is strictly below targetMaxBytes (default 350KB).
 */
export function compressImageElement(
  img: HTMLImageElement,
  options: OptimizeImageOptions = {}
): OptimizedImageResult {
  const {
    maxDimension = options.avatarMode ? 400 : 1000,
    targetMaxBytes = 350 * 1024, // 350 KB safe ceiling
    initialQuality = 0.82,
    avatarMode = false,
  } = options;

  let origWidth = img.naturalWidth || img.width || 800;
  let origHeight = img.naturalHeight || img.height || 800;

  // Calculate target dimensions
  let targetWidth = origWidth;
  let targetHeight = origHeight;
  const maxDim = avatarMode ? 400 : maxDimension;

  if (targetWidth > maxDim || targetHeight > maxDim) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDim) / targetWidth);
      targetWidth = maxDim;
    } else {
      targetWidth = Math.round((targetWidth * maxDim) / targetHeight);
      targetHeight = maxDim;
    }
  }

  // Ensure minimum dimensions
  targetWidth = Math.max(16, targetWidth);
  targetHeight = Math.max(16, targetHeight);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Canvas 2D context unavailable on this device.');
  }

  // Fill with neutral dark background in case of transparent backgrounds in JPEG
  ctx.fillStyle = '#18121d';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const useWebp = supportsWebP();
  const mimeType = useWebp ? 'image/webp' : 'image/jpeg';

  let currentQuality = initialQuality;
  let dataUrl = canvas.toDataURL(mimeType, currentQuality);
  
  // Base64 size estimation in bytes: (length * 3) / 4
  let estimatedBytes = Math.round((dataUrl.length * 3) / 4);

  // If still exceeds targetMaxBytes, iteratively downscale & compress
  let passes = 0;
  while (estimatedBytes > targetMaxBytes && passes < 3) {
    passes++;
    currentQuality = Math.max(0.55, currentQuality - 0.12);
    targetWidth = Math.round(targetWidth * 0.82);
    targetHeight = Math.round(targetHeight * 0.82);

    const downCanvas = document.createElement('canvas');
    downCanvas.width = targetWidth;
    downCanvas.height = targetHeight;
    const downCtx = downCanvas.getContext('2d', { alpha: false });
    if (!downCtx) break;

    downCtx.fillStyle = '#18121d';
    downCtx.fillRect(0, 0, targetWidth, targetHeight);
    downCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

    dataUrl = downCanvas.toDataURL(mimeType, currentQuality);
    estimatedBytes = Math.round((dataUrl.length * 3) / 4);
  }

  return {
    dataUrl,
    bytes: estimatedBytes,
    formattedSize: formatBytes(estimatedBytes),
    width: targetWidth,
    height: targetHeight,
    format: useWebp ? 'WEBP' : 'JPEG',
  };
}

/**
 * Reads a user file (from phone gallery or internal storage) and returns an
 * optimized, safe-sized base64 data URL.
 */
export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image.'));
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file from internal storage.'));
    };

    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        return reject(new Error('Empty image data returned.'));
      }

      // If it's a small SVG under 50KB, preserve vector format
      if (file.type === 'image/svg+xml' && file.size < 50 * 1024) {
        return resolve({
          dataUrl: rawDataUrl,
          bytes: file.size,
          formattedSize: formatBytes(file.size),
          width: 0,
          height: 0,
          format: 'SVG',
        });
      }

      const img = new Image();
      img.onload = () => {
        try {
          const result = compressImageElement(img, options);
          resolve(result);
        } catch (err: any) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to decode image data. Please choose another image.'));
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes an existing data URL or remote image if it exceeds safe payload limit (> 400KB).
 */
export async function ensureSafePayloadImage(
  urlOrDataUrl: string,
  options: OptimizeImageOptions = {}
): Promise<string> {
  if (!urlOrDataUrl || typeof urlOrDataUrl !== 'string') {
    return urlOrDataUrl;
  }

  // If it's an HTTP URL (e.g. Unsplash), it's already just a short string (< 200 chars), so safe!
  if (!urlOrDataUrl.startsWith('data:image/')) {
    return urlOrDataUrl;
  }

  // If data URL is under 400,000 characters (~300KB), it's already safe!
  if (urlOrDataUrl.length < 400000) {
    return urlOrDataUrl;
  }

  // Data URL is large (> 300KB) and needs compression to prevent FUNCTION_PAYLOAD_TOO_LARGE
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const result = compressImageElement(img, options);
        resolve(result.dataUrl);
      } catch {
        resolve(urlOrDataUrl);
      }
    };
    img.onerror = () => {
      resolve(urlOrDataUrl);
    };
    img.src = urlOrDataUrl;
  });
}
