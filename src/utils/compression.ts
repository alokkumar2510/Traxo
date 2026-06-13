import zlib from "zlib";

/**
 * Compresses a text string using Node.js zlib gzip and returns a Base64 encoded string.
 */
export function compressText(text: string): string {
  if (!text) return "";
  try {
    const buffer = Buffer.from(text, "utf-8");
    const compressed = zlib.gzipSync(buffer);
    return compressed.toString("base64");
  } catch (error) {
    // Fallback to original text if compression fails
    return text;
  }
}

/**
 * Decompresses a Base64 encoded gzip string and returns the original text.
 */
export function decompressText(compressedBase64: string): string {
  if (!compressedBase64) return "";
  try {
    const buffer = Buffer.from(compressedBase64, "base64");
    const decompressed = zlib.gunzipSync(buffer);
    return decompressed.toString("utf-8");
  } catch (error) {
    // Return original string if decompression fails
    return compressedBase64;
  }
}
