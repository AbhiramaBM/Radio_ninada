"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = require("../config/prisma");
const cloudinary_service_1 = require("../services/cloudinary.service");
const index_1 = require("../config/index");
async function runMigration() {
    console.log('\n======================================================');
    console.log('  RADIO NINADA - LOCAL TO CLOUDINARY MEDIA MIGRATION');
    console.log('======================================================\n');
    if (!(0, cloudinary_service_1.isCloudinaryReady)()) {
        console.error('❌ Error: Cloudinary credentials missing in .env!');
        console.error('Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET first.\n');
        process.exit(1);
    }
    const uploadDir = index_1.config.uploadDir;
    console.log(`📁 Scanning local uploads directory: ${uploadDir}`);
    let totalMigrated = 0;
    let totalErrors = 0;
    // Helper to resolve local path from relative URL
    const resolveLocalPath = (url) => {
        if (!url || typeof url !== 'string' || url.startsWith('http://') || url.startsWith('https://')) {
            return null;
        }
        const cleanPath = url.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
        const fullPath = path_1.default.join(uploadDir, cleanPath);
        return fs_1.default.existsSync(fullPath) ? fullPath : null;
    };
    // 1. Migrate Podcasts
    console.log('\n🎙️  Checking Podcast media...');
    const podcasts = await prisma_1.prisma.podcast.findMany({ where: { deletedAt: null } });
    for (const podcast of podcasts) {
        let updatedData = {};
        // Audio
        const localAudio = resolveLocalPath(podcast.audioUrl);
        if (localAudio) {
            try {
                console.log(` -> Uploading audio for Podcast "${podcast.title}"...`);
                const res = await (0, cloudinary_service_1.uploadFileToCloudinary)(localAudio, 'radio-ninada/audio', 'video');
                updatedData.audioUrl = res.secure_url;
                updatedData.audioPublicId = res.public_id;
                totalMigrated++;
            }
            catch (err) {
                console.error(` ❌ Error uploading audio for "${podcast.title}":`, err.message);
                totalErrors++;
            }
        }
        // Cover Image
        const localCover = resolveLocalPath(podcast.coverUrl);
        if (localCover) {
            try {
                console.log(` -> Uploading cover for Podcast "${podcast.title}"...`);
                const res = await (0, cloudinary_service_1.uploadFileToCloudinary)(localCover, 'radio-ninada/images', 'image');
                updatedData.coverUrl = res.secure_url;
                updatedData.coverPublicId = res.public_id;
                totalMigrated++;
            }
            catch (err) {
                console.error(` ❌ Error uploading cover for "${podcast.title}":`, err.message);
                totalErrors++;
            }
        }
        if (Object.keys(updatedData).length > 0) {
            await prisma_1.prisma.podcast.update({ where: { id: podcast.id }, data: updatedData });
        }
    }
    // 2. Migrate Gallery Items
    console.log('\n🖼️  Checking Gallery media...');
    const galleryItems = await prisma_1.prisma.galleryItem.findMany({ where: { deletedAt: null } });
    for (const item of galleryItems) {
        let updatedData = {};
        const localMedia = resolveLocalPath(item.mediaUrl);
        if (localMedia) {
            try {
                console.log(` -> Uploading gallery item "${item.title}"...`);
                const resType = item.type === 'VIDEO' ? 'video' : 'image';
                const folder = item.type === 'VIDEO' ? 'radio-ninada/video' : 'radio-ninada/images';
                const res = await (0, cloudinary_service_1.uploadFileToCloudinary)(localMedia, folder, resType);
                updatedData.mediaUrl = res.secure_url;
                updatedData.publicId = res.public_id;
                totalMigrated++;
            }
            catch (err) {
                console.error(` ❌ Error uploading gallery item "${item.title}":`, err.message);
                totalErrors++;
            }
        }
        if (Object.keys(updatedData).length > 0) {
            await prisma_1.prisma.galleryItem.update({ where: { id: item.id }, data: updatedData });
        }
    }
    // 3. Migrate Banners
    console.log('\n🎯 Checking Banner images...');
    const banners = await prisma_1.prisma.banner.findMany();
    for (const banner of banners) {
        const localBanner = resolveLocalPath(banner.imageUrl);
        if (localBanner) {
            try {
                console.log(` -> Uploading banner "${banner.title}"...`);
                const res = await (0, cloudinary_service_1.uploadFileToCloudinary)(localBanner, 'radio-ninada/images', 'image');
                await prisma_1.prisma.banner.update({
                    where: { id: banner.id },
                    data: { imageUrl: res.secure_url, publicId: res.public_id },
                });
                totalMigrated++;
            }
            catch (err) {
                console.error(` ❌ Error uploading banner "${banner.title}":`, err.message);
                totalErrors++;
            }
        }
    }
    // 4. Migrate Sponsors
    console.log('\n🤝 Checking Sponsor logos...');
    const sponsors = await prisma_1.prisma.sponsor.findMany();
    for (const sponsor of sponsors) {
        const localLogo = resolveLocalPath(sponsor.logoUrl);
        if (localLogo) {
            try {
                console.log(` -> Uploading sponsor logo "${sponsor.name}"...`);
                const res = await (0, cloudinary_service_1.uploadFileToCloudinary)(localLogo, 'radio-ninada/images', 'image');
                await prisma_1.prisma.sponsor.update({
                    where: { id: sponsor.id },
                    data: { logoUrl: res.secure_url, publicId: res.public_id },
                });
                totalMigrated++;
            }
            catch (err) {
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
