import { UploadApiResponse } from 'cloudinary';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import fs from 'fs';

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  resourceType: string;
  duration?: number;
  width?: number;
  height?: number;
}

export const CLOUDINARY_FOLDERS = {
  PODCAST_COVERS: 'radio-ninada/podcasts/covers',
  PODCAST_EPISODES: 'radio-ninada/podcasts/episodes',
  PROGRAMS: 'radio-ninada/programs',
  HOSTS: 'radio-ninada/hosts',
  BANNERS: 'radio-ninada/banners',
  GALLERY: 'radio-ninada/gallery',
  USERS: 'radio-ninada/users',
  LIVE: 'radio-ninada/live',
  MEDIA: 'radio-ninada/media',
} as const;

/**
 * Upload local file to Cloudinary with designated folder and publicId prefix.
 * Automatically cleans up the temporary local file after upload attempt.
 */
export async function uploadFileToCloudinary(
  filePath: string,
  folder: string = CLOUDINARY_FOLDERS.MEDIA,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  customPublicId?: string
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  try {
    const uploadOptions: any = {
      folder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };

    if (customPublicId) {
      uploadOptions.public_id = customPublicId;
    }

    const result: UploadApiResponse = await cloudinary.uploader.upload(filePath, uploadOptions);

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format || '',
      bytes: result.bytes || 0,
      resourceType: result.resource_type || resourceType,
      duration: result.duration,
      width: result.width,
      height: result.height,
    };
  } finally {
    // Always clean up local temporary upload file
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        console.warn(`[Cloudinary Service] Could not remove temp file ${filePath}:`, cleanupErr);
      }
    }
  }
}

/**
 * Safely delete an asset from Cloudinary by public ID.
 * Audio and video assets use resource_type: 'video'.
 */
export async function deleteFileFromCloudinary(
  publicId?: string | null,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<{ success: boolean; result?: string; error?: string }> {
  if (!publicId) {
    return { success: false, error: 'No public ID provided' };
  }

  if (!isCloudinaryConfigured()) {
    console.warn(`[Cloudinary Service] Cannot delete '${publicId}': Cloudinary not configured.`);
    return { success: false, error: 'Cloudinary not configured' };
  }

  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    return {
      success: res.result === 'ok' || res.result === 'not_found',
      result: res.result,
    };
  } catch (err: any) {
    console.error(`[Cloudinary Service] Failed to destroy asset '${publicId}':`, err?.message || err);
    return { success: false, error: err?.message || 'Cloudinary asset deletion failed' };
  }
}

/**
 * Extract Cloudinary public ID from a URL
 */
export function extractPublicIdFromUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return null;
  }
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const pathAfterUpload = parts[1].replace(/^v\d+\//, '');
    const lastDotIndex = pathAfterUpload.lastIndexOf('.');
    return lastDotIndex === -1 ? pathAfterUpload : pathAfterUpload.substring(0, lastDotIndex);
  } catch {
    return null;
  }
}

export const isCloudinaryReady = isCloudinaryConfigured;
export { cloudinary, isCloudinaryConfigured };
