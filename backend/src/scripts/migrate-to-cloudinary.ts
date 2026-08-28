import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma';
import { isCloudinaryReady, uploadFileToCloudinary } from '../services/cloudinary.service';
import { config } from '../config/index';

async function runMigration() {
  console.log('\n======================================================');
  console.log('  RADIO NINADA - LOCAL TO CLOUDINARY MEDIA MIGRATION');
  console.log('======================================================\n');

  if (!isCloudinaryReady()) {
    console.error('❌ Error: Cloudinary credentials missing in .env!');
    console.error('Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET first.\n');
    process.exit(1);
  }

  const uploadDir = config.uploadDir;
  console.log(`📁 Scanning local uploads directory: ${uploadDir}`);

  let totalMigrated = 0;
  let totalErrors = 0;

  // Helper to resolve local path from relative URL
  const resolveLocalPath = (url: string | null): string | null => {
    if (!url || typeof url !== 'string' || url.startsWith('http://') || url.startsWith('https://')) {
      return null;
    }
    const cleanPath = url.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
    const fullPath = path.join(uploadDir, cleanPath);
    return fs.existsSync(fullPath) ? fullPath : null;
  };

  // 1. Migrate Podcasts
  console.log('\n🎙️  Checking Podcast media...');
  const podcasts = await prisma.podcast.findMany({ where: { deletedAt: null } });
  for (const podcast of podcasts) {
    let updatedData: any = {};

    // Audio
    const localAudio = resolveLocalPath(podcast.audioUrl);
    if (localAudio) {
      try {
        console.log(` -> Uploading audio for Podcast "${podcast.title}"...`);
        const res = await uploadFileToCloudinary(localAudio, 'radio-ninada/audio', 'video');
        updatedData.audioUrl = res.secure_url;
        updatedData.audioPublicId = res.public_id;
        totalMigrated++;
      } catch (err: any) {
        console.error(` ❌ Error uploading audio for "${podcast.title}":`, err.message);
        totalErrors++;
      }
    }

    // Cover Image
    const localCover = resolveLocalPath(podcast.coverUrl);
    if (localCover) {
      try {
        console.log(` -> Uploading cover for Podcast "${podcast.title}"...`);
        const res = await uploadFileToCloudinary(localCover, 'radio-ninada/images', 'image');
        updatedData.coverUrl = res.secure_url;
        updatedData.coverPublicId = res.public_id;
        totalMigrated++;
      } catch (err: any) {
        console.error(` ❌ Error uploading cover for "${podcast.title}":`, err.message);
        totalErrors++;
      }
    }

    if (Object.keys(updatedData).length > 0) {
      await prisma.podcast.update({ where: { id: podcast.id }, data: updatedData });
    }
  }

  // 2. Migrate Gallery Items
  console.log('\n🖼️  Checking Gallery media...');
  const galleryItems = await prisma.galleryItem.findMany({ where: { deletedAt: null } });
  for (const item of galleryItems) {
    let updatedData: any = {};
    const localMedia = resolveLocalPath(item.mediaUrl);
    if (localMedia) {
      try {
        console.log(` -> Uploading gallery item "${item.title}"...`);
        const resType = item.type === 'VIDEO' ? 'video' : 'image';
        const folder = item.type === 'VIDEO' ? 'radio-ninada/video' : 'radio-ninada/images';
        const res = await uploadFileToCloudinary(localMedia, folder, resType);
        updatedData.mediaUrl = res.secure_url;
        updatedData.publicId = res.public_id;
        totalMigrated++;
      } catch (err: any) {
        console.error(` ❌ Error uploading gallery item "${item.title}":`, err.message);
        totalErrors++;
      }
    }

    if (Object.keys(updatedData).length > 0) {
      await prisma.galleryItem.update({ where: { id: item.id }, data: updatedData });
    }
  }

  // 3. Migrate Banners
  console.log('\n🎯 Checking Banner images...');
  const banners = await prisma.banner.findMany();
  for (const banner of banners) {
    const localBanner = resolveLocalPath(banner.imageUrl);
    if (localBanner) {
      try {
        console.log(` -> Uploading banner "${banner.title}"...`);
        const res = await uploadFileToCloudinary(localBanner, 'radio-ninada/images', 'image');
        await prisma.banner.update({
          where: { id: banner.id },
          data: { imageUrl: res.secure_url, publicId: res.public_id },
        });
        totalMigrated++;
      } catch (err: any) {
        console.error(` ❌ Error uploading banner "${banner.title}":`, err.message);
        totalErrors++;
      }
    }
  }

  // 4. Migrate Sponsors
  console.log('\n🤝 Checking Sponsor logos...');
  const sponsors = await prisma.sponsor.findMany();
  for (const sponsor of sponsors) {
    const localLogo = resolveLocalPath(sponsor.logoUrl);
    if (localLogo) {
      try {
        console.log(` -> Uploading sponsor logo "${sponsor.name}"...`);
        const res = await uploadFileToCloudinary(localLogo, 'radio-ninada/images', 'image');
        await prisma.sponsor.update({
          where: { id: sponsor.id },
          data: { logoUrl: res.secure_url, publicId: res.public_id },
        });
        totalMigrated++;
      } catch (err: any) {
        console.error(` ❌ Error uploading sponsor logo "${sponsor.name}":`, err.message);
        totalErrors++;
      }
    }
  }

  console.log('\n======================================================');
  console.log(`✅ Migration complete!`);
  console.log(`   - Successfully migrated assets to Cloudinary: ${totalMigrated}`);
  console.log(`   - Errors encountered: ${totalErrors}`);
  console.log('======================================================\n');

  process.exit(0);
}

runMigration().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
