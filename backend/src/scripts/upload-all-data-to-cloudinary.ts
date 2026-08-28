import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { prisma } from '../config/prisma';
import { isCloudinaryReady, uploadFileToCloudinary } from '../services/cloudinary.service';
import { config } from '../config/index';

// Temporary directory for downloading remote media assets before uploading to Cloudinary
const tempDownloadDir = path.join(config.uploadDir, 'temp_migrate');

if (!fs.existsSync(tempDownloadDir)) {
  fs.mkdirSync(tempDownloadDir, { recursive: true });
}

function downloadFile(url: string, destPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const client = url.startsWith('https') ? https : http;

    client.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          return downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
        }
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(destPath));
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function resolveAndUpload(
  urlOrPath: string | null,
  folder: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<{ url: string; publicId: string } | null> {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;

  // Already migrated to Cloudinary!
  if (urlOrPath.includes('res.cloudinary.com')) {
    console.log(`  ✓ Already on Cloudinary: ${urlOrPath}`);
    return null;
  }

  let localPathToUpload: string | null = null;
  let isTemp = false;

  try {
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      const ext = path.extname(new URL(urlOrPath).pathname) || (resourceType === 'video' ? '.mp3' : '.jpg');
      const tempFilename = `download_${Date.now()}_${Math.round(Math.random() * 1000)}${ext}`;
      const tempPath = path.join(tempDownloadDir, tempFilename);

      console.log(`  ⏳ Downloading remote media from: ${urlOrPath}...`);
      await downloadFile(urlOrPath, tempPath);
      localPathToUpload = tempPath;
      isTemp = true;
    } else {
      const cleanPath = urlOrPath.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
      const fullPath = path.join(config.uploadDir, cleanPath);
      if (fs.existsSync(fullPath)) {
        localPathToUpload = fullPath;
      }
    }

    if (!localPathToUpload || !fs.existsSync(localPathToUpload)) {
      console.warn(`  ⚠️ Asset path/file not found: ${urlOrPath}`);
      return null;
    }

    console.log(`  🚀 Uploading to Cloudinary [${folder}]...`);
    const res = await uploadFileToCloudinary(localPathToUpload, folder, resourceType);
    console.log(`  ✅ Uploaded! Cloudinary URL: ${res.secure_url}`);

    if (isTemp && fs.existsSync(localPathToUpload)) {
      fs.unlinkSync(localPathToUpload);
    }

    return { url: res.secure_url, publicId: res.public_id };
  } catch (err: any) {
    console.error(`  ❌ Failed to upload asset ${urlOrPath}:`, err.message);
    if (isTemp && localPathToUpload && fs.existsSync(localPathToUpload)) {
      fs.unlinkSync(localPathToUpload);
    }
    return null;
  }
}

async function migrateAllData() {
  console.log('\n======================================================');
  console.log('  RADIO NINADA - FULL DATA TO CLOUDINARY UPLOADER');
  console.log('======================================================\n');

  if (!isCloudinaryReady()) {
    console.error('❌ Error: Cloudinary credentials missing in .env!');
    process.exit(1);
  }

  let totalMigrated = 0;

  // 1. Podcasts
  console.log('\n🎙️  1. Migrating Podcasts...');
  const podcasts = await prisma.podcast.findMany({ where: { deletedAt: null } });
  for (const podcast of podcasts) {
    console.log(`\n• Podcast: "${podcast.title}"`);
    let updateData: any = {};

    const audioRes = await resolveAndUpload(podcast.audioUrl, 'radio-ninada/audio', 'video');
    if (audioRes) {
      updateData.audioUrl = audioRes.url;
      updateData.audioPublicId = audioRes.publicId;
      totalMigrated++;
    }

    const coverRes = await resolveAndUpload(podcast.coverUrl, 'radio-ninada/images', 'image');
    if (coverRes) {
      updateData.coverUrl = coverRes.url;
      updateData.coverPublicId = coverRes.publicId;
      totalMigrated++;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.podcast.update({ where: { id: podcast.id }, data: updateData });
    }
  }

  // 2. Programs
  console.log('\n📻 2. Migrating Programs...');
  const programs = await prisma.program.findMany({ where: { deletedAt: null } });
  for (const prog of programs) {
    console.log(`\n• Program: "${prog.name}"`);
    let updateData: any = {};

    const thumbRes = await resolveAndUpload(prog.thumbnail, 'radio-ninada/images', 'image');
    if (thumbRes) {
      updateData.thumbnail = thumbRes.url;
      updateData.thumbnailPublicId = thumbRes.publicId;
      totalMigrated++;
    }

    const bannerRes = await resolveAndUpload(prog.banner, 'radio-ninada/images', 'image');
    if (bannerRes) {
      updateData.banner = bannerRes.url;
      updateData.bannerPublicId = bannerRes.publicId;
      totalMigrated++;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.program.update({ where: { id: prog.id }, data: updateData });
    }
  }

  // 3. Gallery Items
  console.log('\n🖼️  3. Migrating Gallery Items...');
  const items = await prisma.galleryItem.findMany({ where: { deletedAt: null } });
  for (const item of items) {
    console.log(`\n• Gallery Item: "${item.title}"`);
    let updateData: any = {};
    const resType = item.type === 'VIDEO' ? 'video' : 'image';
    const folder = item.type === 'VIDEO' ? 'radio-ninada/video' : 'radio-ninada/images';

    const mediaRes = await resolveAndUpload(item.mediaUrl, folder, resType);
    if (mediaRes) {
      updateData.mediaUrl = mediaRes.url;
      updateData.publicId = mediaRes.publicId;
      totalMigrated++;
    }

    const thumbRes = await resolveAndUpload(item.thumbnail, 'radio-ninada/images', 'image');
    if (thumbRes) {
      updateData.thumbnail = thumbRes.url;
      updateData.thumbnailPublicId = thumbRes.publicId;
      totalMigrated++;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.galleryItem.update({ where: { id: item.id }, data: updateData });
    }
  }

  // 4. Banners
  console.log('\n🎯 4. Migrating Banners...');
  const banners = await prisma.banner.findMany();
  for (const banner of banners) {
    console.log(`\n• Banner: "${banner.title}"`);
    const bannerRes = await resolveAndUpload(banner.imageUrl, 'radio-ninada/images', 'image');
    if (bannerRes) {
      await prisma.banner.update({
        where: { id: banner.id },
        data: { imageUrl: bannerRes.url, publicId: bannerRes.publicId },
      });
      totalMigrated++;
    }
  }

  // 5. Sponsors
  console.log('\n🤝 5. Migrating Sponsors...');
  const sponsors = await prisma.sponsor.findMany();
  for (const sponsor of sponsors) {
    console.log(`\n• Sponsor: "${sponsor.name}"`);
    const logoRes = await resolveAndUpload(sponsor.logoUrl, 'radio-ninada/images', 'image');
    if (logoRes) {
      await prisma.sponsor.update({
        where: { id: sponsor.id },
        data: { logoUrl: logoRes.url, publicId: logoRes.publicId },
      });
      totalMigrated++;
    }
  }

  // 6. News
  console.log('\n📰 6. Migrating News Articles...');
  const newsList = await prisma.news.findMany({ where: { deletedAt: null } });
  for (const news of newsList) {
    console.log(`\n• News: "${news.title}"`);
    const imgRes = await resolveAndUpload(news.featuredImage, 'radio-ninada/images', 'image');
    if (imgRes) {
      await prisma.news.update({
        where: { id: news.id },
        data: { featuredImage: imgRes.url, publicId: imgRes.publicId },
      });
      totalMigrated++;
    }
  }

  // 7. RJ Profiles
  console.log('\n🎧 7. Migrating RJ Profiles...');
  const rjs = await prisma.rJProfile.findMany({ where: { deletedAt: null } });
  for (const rj of rjs) {
    console.log(`\n• RJ: "${rj.name}"`);
    const photoRes = await resolveAndUpload(rj.photo, 'radio-ninada/images', 'image');
    if (photoRes) {
      await prisma.rJProfile.update({
        where: { id: rj.id },
        data: { photo: photoRes.url, publicId: photoRes.publicId },
      });
      totalMigrated++;
    }
  }

  console.log('\n======================================================');
  console.log(`🎉 ALL DATA MIGRATION COMPLETE!`);
  console.log(`   - Total Assets Uploaded to Cloudinary: ${totalMigrated}`);
  console.log('======================================================\n');

  process.exit(0);
}

migrateAllData().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
