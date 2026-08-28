import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from '../config/index';

const isConfigured = Boolean(
  (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) ||
  config.cloudinary.url
);

if (isConfigured) {
  if (config.cloudinary.url) {
    cloudinary.config({
      cloudinary_url: config.cloudinary.url,
    });
  } else {
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
      secure: true,
    });
  }
}

export function isCloudinaryReady(): boolean {
  return isConfigured;
}

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  resource_type: string;
}

/**
 * Upload a local file path to Cloudinary under a specific folder (e.g., 'radio-ninada/audio' or 'radio-ninada/images')
 */
export async function uploadFileToCloudinary(
  filePath: string,
  folder: string = 'radio-ninada/media',
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<CloudinaryUploadResult> {
  if (!isConfigured) {
    throw new Error('Cloudinary credentials missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables.');
  }

  const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
  });

  return {
    url: result.url,
    secure_url: result.secure_url,
    public_id: result.public_id,
    format: result.format || '',
    bytes: result.bytes || 0,
    resource_type: result.resource_type || resourceType,
  };
}

/**
 * Safely delete an asset from Cloudinary using its public_id.
 * Audio and video files use resource_type: 'video' in Cloudinary.
 */
export async function deleteFileFromCloudinary(
  publicId?: string | null,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<{ success: boolean; result?: string; error?: string }> {
  if (!publicId) {
    return { success: false, error: 'No public_id provided' };
  }

  if (!isConfigured) {
    console.warn(`[Cloudinary Service Warning] Cannot delete asset '${publicId}': Cloudinary credentials missing.`);
    return { success: false, error: 'Cloudinary not configured' };
  }

  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });

    console.log(`[Cloudinary Service] Deleted asset '${publicId}' (${resourceType}):`, res.result);
    return { success: res.result === 'ok' || res.result === 'not_found', result: res.result };
  } catch (err: any) {
    console.error(`[Cloudinary Deletion Error] Failed to delete public_id '${publicId}':`, err?.message || err);
    return { success: false, error: err?.message || 'Deletion failed' };
  }
}

/**
 * Helper to extract Cloudinary public_id from a Cloudinary secure_url if public_id was not explicitly stored
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    // Get everything after /upload/ (v1234567/folder/file.ext)
    const pathAfterUpload = parts[1];
    // Remove version tag (v12345678/) if present
    const pathWithoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
    // Remove file extension
    const lastDotIndex = pathWithoutVersion.lastIndexOf('.');
    if (lastDotIndex === -1) return pathWithoutVersion;

    return pathWithoutVersion.substring(0, lastDotIndex);
  } catch {
    return null;
  }
}

export { cloudinary };
