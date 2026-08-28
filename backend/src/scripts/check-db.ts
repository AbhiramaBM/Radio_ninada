import { prisma } from '../config/prisma';

async function check() {
  console.log('--- DATABASE INSPECTION REPORT ---');

  const podcasts = await prisma.podcast.findMany();
  console.log(`Podcasts count: ${podcasts.length}`);
  podcasts.forEach((p) => console.log(`  - Podcast [${p.id}]: ${p.title} | Audio: ${p.audioUrl} | Cover: ${p.coverUrl}`));

  const programs = await prisma.program.findMany();
  console.log(`Programs count: ${programs.length}`);

  const gallery = await prisma.galleryItem.findMany();
  console.log(`Gallery items count: ${gallery.length}`);

  const news = await prisma.news.findMany();
  console.log(`News items count: ${news.length}`);

  const banners = await prisma.banner.findMany();
  console.log(`Banners count: ${banners.length}`);

  const sponsors = await prisma.sponsor.findMany();
  console.log(`Sponsors count: ${sponsors.length}`);

  const users = await prisma.user.findMany();
  console.log(`Users count: ${users.length}`);

  process.exit(0);
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
