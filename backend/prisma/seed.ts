import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Radio Ninada Seed Process...');

  // 0. Cleanup existing seed data for idempotency
  await prisma.auditLog.deleteMany({});
  await prisma.galleryItem.deleteMany({});
  await prisma.eventParticipant.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.news.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.podcast.deleteMany({});
  await prisma.program.deleteMany({});
  await prisma.rJProfile.deleteMany({});

  // 1. Seed Users & Roles
  const passwordHashAdmin = await bcrypt.hash('Admin@123', 10);
  const passwordHashEditor = await bcrypt.hash('Editor@123', 10);
  const passwordHashRJ = await bcrypt.hash('RJ@123', 10);
  const passwordHashMod = await bcrypt.hash('Mod@123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'radioninada@gmail.com' },
    update: { role: 'SUPER_ADMIN', status: 'ACTIVE', password: passwordHashAdmin },
    create: {
      email: 'radioninada@gmail.com',
      password: passwordHashAdmin,
      name: 'Radio Ninada Admin',
      role: 'SUPER_ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      bio: 'Platform System Administrator & Executive Director',
      status: 'ACTIVE',
    },
  });

  const legacyAdmin = await prisma.user.upsert({
    where: { email: 'admin@radioninada.local' },
    update: {},
    create: {
      email: 'admin@radioninada.local',
      password: passwordHashAdmin,
      name: 'Legacy Dev Admin',
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      bio: 'Local development admin account',
      status: 'ACTIVE',
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: 'editor@radioninada.local' },
    update: {},
    create: {
      email: 'editor@radioninada.local',
      password: passwordHashEditor,
      name: 'Content Editor',
      role: 'EDITOR',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      bio: 'Managing news editorial and blog publishing',
      status: 'ACTIVE',
    },
  });

  const rjUser = await prisma.user.upsert({
    where: { email: 'rj@radioninada.local' },
    update: {},
    create: {
      email: 'rj@radioninada.local',
      password: passwordHashRJ,
      name: 'RJ Ananya',
      role: 'RJ',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      bio: 'Lead Morning Show Host & Folk Music Enthusiast',
      status: 'ACTIVE',
    },
  });

  const moderator = await prisma.user.upsert({
    where: { email: 'mod@radioninada.local' },
    update: {},
    create: {
      email: 'mod@radioninada.local',
      password: passwordHashMod,
      name: 'Community Moderator',
      role: 'MODERATOR',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      bio: 'Moderating community comments and registrations',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Users seeded with credentials:');
  console.log('   - SUPER_ADMIN: radioninada@gmail.com (Firebase sign-in)');
  console.log('   - DEV ADMIN:   admin@radioninada.local (Admin@123)');
  console.log('   - EDITOR:      editor@radioninada.local (Editor@123)');
  console.log('   - RJ:          rj@radioninada.local (RJ@123)');
  console.log('   - MODERATOR:   mod@radioninada.local (Mod@123)');

  // 2. Live Radio State Initializer
  await prisma.liveRadioState.upsert({
    where: { id: 'live-config' },
    update: {},
    create: {
      id: 'live-config',
      isLive: true,
      streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
      title: 'Morning Ninada Super Hits Live',
      currentProgram: 'Ninada Morning Buzz',
      currentRJ: 'RJ Ananya',
      currentSong: 'Bengaluru Beat - Acoustic Sunrise',
      bitrate: 320,
      quality: 'Ultra HD 320 kbps',
      status: 'LIVE',
      liveListeners: 142,
    },
  });

  // 3. RJ Profiles
  const rjProfile1 = await prisma.rJProfile.create({
    data: {
      userId: rjUser.id,
      name: 'RJ Ananya',
      designation: 'Senior Prime-Time Host',
      bio: 'Waking up the city with good vibes, classic tunes, and local stories for over 5 years.',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      socialMedia: JSON.stringify({ instagram: '@rjananya', twitter: '@ananya_radio', facebook: 'ananyaofficial' }),
      achievements: 'Best Community RJ 2025, Golden Mic Award',
      status: 'ACTIVE',
      followers: 12400,
      episodeCount: 320,
    },
  });

  const rjProfile2 = await prisma.rJProfile.create({
    data: {
      name: 'RJ Vikram',
      designation: 'Evening Rock & Tech Host',
      bio: 'Bringing you indie rock, startup stories, and tech trends every evening.',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      socialMedia: JSON.stringify({ instagram: '@rjvikram_live', twitter: '@vikram_ninada' }),
      achievements: 'Youth Choice Host 2024',
      status: 'ACTIVE',
      followers: 8900,
      episodeCount: 195,
    },
  });

  // 4. Programs
  const prog1 = await prisma.program.create({
    data: {
      name: 'Ninada Morning Buzz',
      slug: 'ninada-morning-buzz',
      description: 'Start your morning with energetic Kannada pop, inspiring community interviews, and traffic updates.',
      hostId: rjProfile1.id,
      hostName: 'RJ Ananya',
      category: 'Morning Show',
      thumbnail: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
      duration: '120 min',
      language: 'Kannada / English',
      tags: 'morning,hits,interview',
      schedule: 'Mon - Fri @ 7:00 AM - 9:00 AM',
      featured: true,
      status: 'PUBLISHED',
    },
  });

  const prog2 = await prisma.program.create({
    data: {
      name: 'Campus Beats & Tech Byte',
      slug: 'campus-beats-tech-byte',
      description: 'Spotlight on youth talent, college fest news, startup founders, and fresh indie beats.',
      hostId: rjProfile2.id,
      hostName: 'RJ Vikram',
      category: 'Youth & Tech',
      thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      duration: '90 min',
      language: 'Kannada / English',
      tags: 'tech,youth,college,music',
      schedule: 'Mon, Wed, Fri @ 5:00 PM - 6:30 PM',
      featured: true,
      status: 'PUBLISHED',
    },
  });

  // 5. Schedules
  await prisma.schedule.createMany({
    data: [
      { programId: prog1.id, dayOfWeek: 1, startTime: '07:00', endTime: '09:00', isRecurring: true },
      { programId: prog1.id, dayOfWeek: 2, startTime: '07:00', endTime: '09:00', isRecurring: true },
      { programId: prog1.id, dayOfWeek: 3, startTime: '07:00', endTime: '09:00', isRecurring: true },
      { programId: prog1.id, dayOfWeek: 4, startTime: '07:00', endTime: '09:00', isRecurring: true },
      { programId: prog1.id, dayOfWeek: 5, startTime: '07:00', endTime: '09:00', isRecurring: true },
      { programId: prog2.id, dayOfWeek: 1, startTime: '17:00', endTime: '18:30', isRecurring: true },
      { programId: prog2.id, dayOfWeek: 3, startTime: '17:00', endTime: '18:30', isRecurring: true },
      { programId: prog2.id, dayOfWeek: 5, startTime: '17:00', endTime: '18:30', isRecurring: true },
    ],
  });

  // 6. Podcasts
  await prisma.podcast.createMany({
    data: [
      {
        title: 'Folk Rhythms of Karnataka - Ep 1',
        slug: 'folk-rhythms-karnataka-ep1',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
        category: 'Culture & Heritage',
        episodeNumber: 1,
        season: 1,
        description: 'Exploring traditional Janapada Geethegalu and local instrumental legends.',
        duration: '28:45',
        downloads: 1420,
        featured: true,
        visibility: 'PUBLIC',
      },
      {
        title: 'Startup Ninada: Building AI in Namma Bengaluru',
        slug: 'startup-ninada-building-ai-bengaluru',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80',
        category: 'Business & Tech',
        episodeNumber: 4,
        season: 2,
        description: 'Interview with local tech pioneers building next-generation AI agents.',
        duration: '42:10',
        downloads: 3200,
        featured: true,
        visibility: 'PUBLIC',
      },
    ],
  });

  // 7. News
  await prisma.news.createMany({
    data: [
      {
        title: 'Radio Ninada Launches Digital Audio Archiving for College Talent',
        slug: 'radio-ninada-launches-digital-audio-archiving',
        content: 'Radio Ninada is proud to announce a new student audio initiative aiming to record and preserve regional talent across 50+ local colleges.',
        category: 'College',
        featuredImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      {
        title: 'Annual Community Cultural Fest Announced for Next Month',
        slug: 'annual-community-cultural-fest-announced',
        content: 'Get ready for three days of live music, food stalls, art exhibitions, and open-mic radio performances.',
        category: 'Local',
        featuredImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    ],
  });

  // 8. Events
  const event1 = await prisma.event.create({
    data: {
      title: 'Radio Ninada Live Acoustic Night 2026',
      slug: 'radio-ninada-live-acoustic-night-2026',
      description: 'An intimate musical evening with top indie artists, live streaming directly from our main studio.',
      banner: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      location: 'Radio Ninada Main Studio Auditorium',
      registrationRequired: true,
      participantsCount: 48,
    },
  });

  await prisma.eventParticipant.create({
    data: {
      eventId: event1.id,
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      phone: '+91 9876543210',
      qrCode: 'NINADA-EVT-2026-PARTICIPANT-001',
      attendance: 'REGISTERED',
      status: 'APPROVED',
    },
  });

  // 9. Gallery Items
  await prisma.galleryItem.createMany({
    data: [
      {
        title: 'Studio A Recording Deck',
        type: 'PHOTO',
        mediaUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
        album: 'Studio Tour',
        category: 'Studio',
      },
      {
        title: 'Annual Listener Meet 2025',
        type: 'PHOTO',
        mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
        album: 'Community Events',
        category: 'Events',
      },
    ],
  });

  // 10. Banners & Sponsors
  await prisma.banner.create({
    data: {
      title: 'Tune into Ninada Morning Buzz Live Daily',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
      targetUrl: '/live_radio_and_schedule.html',
      type: 'HOMEPAGE',
      priority: 1,
      status: 'ACTIVE',
    },
  });

  await prisma.sponsor.create({
    data: {
      name: 'Bengaluru Tech & Audio Labs',
      logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
      website: 'https://example.com',
      campaign: 'Title Partner 2026',
      clicks: 340,
      views: 12500,
      status: 'ACTIVE',
    },
  });

  // 11. Analytics Initial Data
  await prisma.analyticsEvent.createMany({
    data: [
      { eventType: 'PAGE_VIEW', path: '/', country: 'India', device: 'Mobile', browser: 'Chrome' },
      { eventType: 'PAGE_VIEW', path: '/live', country: 'India', device: 'Desktop', browser: 'Edge' },
      { eventType: 'PODCAST_LISTEN', path: '/podcasts/1', country: 'India', device: 'Mobile', browser: 'Safari' },
      { eventType: 'LIVE_LISTEN', path: '/live', country: 'India', device: 'Mobile', browser: 'Chrome' },
    ],
  });

  console.log('🎉 Radio Ninada Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
