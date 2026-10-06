"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../config/prisma");
async function check() {
    console.log('--- DATABASE INSPECTION REPORT ---');
    const podcasts = await prisma_1.prisma.podcast.findMany();
    console.log(`Podcasts count: ${podcasts.length}`);
    podcasts.forEach((p) => console.log(`  - Podcast [${p.id}]: ${p.title} | Audio: ${p.audioUrl} | Cover: ${p.coverUrl}`));
    const programs = await prisma_1.prisma.program.findMany();
    console.log(`Programs count: ${programs.length}`);
    const gallery = await prisma_1.prisma.galleryItem.findMany();
    console.log(`Gallery items count: ${gallery.length}`);
    const news = await prisma_1.prisma.news.findMany();
    console.log(`News items count: ${news.length}`);
    const banners = await prisma_1.prisma.banner.findMany();
    console.log(`Banners count: ${banners.length}`);
    const sponsors = await prisma_1.prisma.sponsor.findMany();
    console.log(`Sponsors count: ${sponsors.length}`);
    const users = await prisma_1.prisma.user.findMany();
    console.log(`Users count: ${users.length}`);
    process.exit(0);
}
check().catch((e) => {
    console.error(e);
    process.exit(1);
});
