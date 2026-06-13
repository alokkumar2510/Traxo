import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/services/firebase";
import { logger } from "@/utils/logger";

/**
 * Uploads a raw image buffer (e.g. screenshot or visual diff) to Firebase Storage
 * and returns the public download URL.
 */
export async function uploadImageBuffer(
  storagePath: string,
  buffer: Buffer
): Promise<string> {
  logger.info({
    service: "storage",
    event: "upload_image_started",
    metadata: { path: storagePath, size: buffer.length },
  });

  try {
    const storageRef = ref(storage, storagePath);
    
    // Upload bytes with PNG contentType metadata
    const snapshot = await uploadBytes(storageRef, buffer, {
      contentType: "image/png",
    });

    // Retrieve public download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);

    logger.info({
      service: "storage",
      event: "upload_image_success",
      metadata: { path: storagePath, downloadUrlLength: downloadUrl.length },
    });

    return downloadUrl;
  } catch (error: any) {
    logger.error({
      service: "storage",
      event: "upload_image_failed",
      metadata: { path: storagePath },
      error: error.message || error,
    });
    throw error;
  }
}
