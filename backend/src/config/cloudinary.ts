import { v2 as cloudinary } from 'cloudinary';
import { config } from './index';

const isConfigured = Boolean(
  (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) ||
  config.cloudinary.url
);

if (isConfigured) {
  if (config.cloudinary.url) {
    cloudinary.config({
      cloudinary_url: config.cloudinary.url,
      secure: true,
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

export function isCloudinaryConfigured(): boolean {
  return isConfigured;
}

export { cloudinary };
