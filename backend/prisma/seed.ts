import { PrismaClient, Role, UserStatus, ContentStatus, LiveStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Radio Ninada database seeding (PostgreSQL)...');

  // 1. Seed Users (Super Admin & Editor)
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const editorPassword = await bcrypt.hash('Editor@123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'radioninada@gmail.com' },
    update: {
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: 'Radio Ninada Super Admin',
      email: 'radioninada@gmail.com',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      phone: '+91 98765 43210',
      status: UserStatus.ACTIVE,
      bio: 'Station Management & Broadcast Operations Administrator',
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: 'editor@radioninada.com' },
    update: {
      password: editorPassword,
      role: Role.EDITOR,
      status: UserStatus.ACTIVE,
    },
    create: {
      name: 'Content Editor',
      email: 'editor@radioninada.com',
      password: editorPassword,
      role: Role.EDITOR,
      status: UserStatus.ACTIVE,
      bio: 'Programming & Podcast Publishing Team',
    },
  });

  console.log(`✅ Admin Accounts: ${superAdmin.email}, ${editor.email}`);

  // 2. Seed Categories
  const categoriesData = [
    { name: 'Music & Melodies', slug: 'music-melodies', description: 'Classical, folk, and contemporary Indian and Kannada melodies', type: 'PROGRAM' },
    { name: 'Community & Culture', slug: 'community-culture', description: 'Dakshina Kannada heritage, traditions, Yakshagana, and local arts', type: 'GENERAL' },
    { name: 'Youth & Campus Buzz', slug: 'youth-campus-buzz', description: 'SDM College student discussions, campus achievements, and career guidance', type: 'PODCAST' },
    { name: 'Talk Shows & Interviews', slug: 'talk-shows', description: 'Inspirational conversations with local heroes, scholars, and achievers', type: 'PODCAST' },
    { name: 'Agriculture & Wellness', slug: 'agriculture-wellness', description: 'Organic farming tips, rural livelihoods, and health awareness', type: 'GENERAL' },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories.push(created);
  }
  console.log(`✅ Categories seeded (${categories.length})`);

  // 3. Seed Hosts / RJs
  const hostsData = [
    {
      name: 'RJ Ananya',
      designation: 'Lead RJ & Producer',
      bio: 'Enthusiastic morning radio jockey waking up Ujire with vibrant melodies, SDM campus updates, and lively smiles.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      socialMedia: JSON.stringify({ instagram: '@ananya_ninada', twitter: '@ananya_radio' }),
    },
    {
      name: 'RJ Rahul',
      designation: 'Senior RJ & Podcast Host',
      bio: 'Host of Dakshina Darshana and Coastal Pulse, exploring heritage, music analysis, and youth dialogues.',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      socialMedia: JSON.stringify({ instagram: '@rahul_ninada' }),
    },
  ];

  const hosts = [];
  for (const h of hostsData) {
    const existing = await prisma.host.findFirst({ where: { name: h.name } });
    if (existing) {
      hosts.push(existing);
    } else {
      const created = await prisma.host.create({ data: h });
      hosts.push(created);
    }
  }
  console.log(`✅ Hosts seeded (${hosts.length})`);

  // 4. Seed LiveStream Configuration
  await prisma.liveStream.upsert({
    where: { id: 'live-config' },
    update: {},
    create: {
      id: 'live-config',
      isLive: true,
      streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
      title: 'Radio Ninada 90.4 FM Live',
      currentProgram: 'Ninada Morning Buzz (SDM Ujire)',
      currentHost: 'RJ Ananya',
      currentSong: 'Community Melodies - Special Broadcast',
      bitrate: 320,
      quality: 'HD Stereo 44.1kHz',
      status: LiveStatus.LIVE,
      liveListeners: 48,
    },
  });
  console.log('✅ LiveStream configuration seeded');

  // 5. Seed Programs
  const programsData = [
    {
      name: 'Ninada Morning Buzz',
      slug: 'ninada-morning-buzz',
      description: 'Start your morning with spiritual chants, local headlines, weather updates, and inspiring campus thoughts.',
      hostId: hosts[0]?.id,
      hostName: hosts[0]?.name || 'RJ Ananya',
      categoryId: categories[0]?.id,
      categoryName: categories[0]?.name || 'Music',
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
      duration: '60 min',
      schedule: 'Mon - Fri @ 8:00 AM',
      featured: true,
      status: ContentStatus.PUBLISHED,
    },
    {
      name: 'Dakshina Darshana',
      slug: 'dakshina-darshana',
      description: 'Journey across the heritage, Yakshagana lore, folk tales, and coastal culture of Karnataka.',
      hostId: hosts[1]?.id,
      hostName: hosts[1]?.name || 'RJ Rahul',
      categoryId: categories[1]?.id,
      categoryName: categories[1]?.name || 'Community & Culture',
      thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
      duration: '45 min',
      schedule: 'Daily @ 4:00 PM',
      featured: true,
      status: ContentStatus.PUBLISHED,
    },
  ];

  for (const prog of programsData) {
    await prisma.program.upsert({
      where: { slug: prog.slug },
      update: {},
      create: prog,
    });
  }
  console.log('✅ Programs seeded');

  // 6. Seed Sample Podcasts & Episodes
  const samplePodcast = await prisma.podcast.upsert({
    where: { slug: 'coastal-conversations' },
    update: {},
    create: {
      title: 'Coastal Conversations',
      slug: 'coastal-conversations',
      description: 'Weekly dialogues featuring professors, entrepreneurs, artists, and changemakers from Dakshina Kannada.',
      coverUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80',
      coverPublicId: 'radio-ninada/podcasts/covers/coastal_conv_sample',
      categoryId: categories[3]?.id,
      hostId: hosts[1]?.id,
      featured: true,
      status: ContentStatus.PUBLISHED,
    },
  });

  await prisma.podcastEpisode.upsert({
    where: { id: 'sample-ep-1' },
    update: {},
    create: {
      id: 'sample-ep-1',
      podcastId: samplePodcast.id,
      title: 'Episode 1: The Evolution of Community Radio in Western Ghats',
      description: 'An insightful retrospective with senior SDM educators on community empowerment through 90.4 FM waves.',
      episodeNumber: 1,
      season: 1,
      audioUrl: 'https://res.cloudinary.com/demo/video/upload/sample_audio.mp3',
      audioPublicId: 'radio-ninada/podcasts/episodes/ep1_audio',
      coverUrl: samplePodcast.coverUrl,
      duration: '28:45',
      status: ContentStatus.PUBLISHED,
    },
  });
  console.log('✅ Podcasts & Episodes seeded');

  // 7. Seed Banners
  await prisma.banner.createMany({
    data: [
      {
        title: 'SDM College Golden Jubilee Broadcast',
        imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        type: 'HOMEPAGE',
        priority: 1,
        status: 'ACTIVE',
      },
    ],
    skipDuplicates: true,
  });

  // 8. Seed Announcements
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Welcome to Radio Ninada 90.4 FM Web Experience',
        message: 'Stream uninterrupted community radio broadcasting live from SDM College, Ujire.',
        audience: 'ALL',
        status: 'PUBLISHED',
      },
    ],
    skipDuplicates: true,
  });

  console.log('🎉 Radio Ninada seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
