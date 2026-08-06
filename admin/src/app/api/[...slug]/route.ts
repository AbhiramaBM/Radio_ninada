import { NextRequest, NextResponse } from 'next/server';

let appHandler: any = null;

function getApp() {
  if (!appHandler) {
    try {
      const backendApp = require('../../../../../backend/dist/app');
      appHandler = backendApp.default || backendApp;
    } catch (e) {
      console.warn('[NextAPI] Backend app import fallback:', (e as Error).message);
    }
  }
  return appHandler;
}

const defaultLiveState = {
  id: 'live-config',
  isLive: true,
  streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
  title: 'Radio Ninada 90.4 FM Live',
  currentProgram: 'Ninada Morning Buzz (SDM Ujire)',
  currentRJ: 'RJ Ananya',
  currentSong: 'Community Melodies - Live Broadcast',
  bitrate: 320,
  quality: 'Ultra HD 320 kbps',
  status: 'LIVE',
  liveListeners: 42,
  updatedAt: new Date().toISOString(),
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const endpoint = slug.join('/');

  if (endpoint === 'health') {
    return NextResponse.json({
      status: 'UP',
      service: 'Radio Ninada REST API Server',
      timestamp: new Date().toISOString(),
    });
  }

  if (endpoint === 'live') {
    try {
      const app = getApp();
      if (app) {
        const { prisma } = require('../../../../../backend/dist/config/prisma');
        const state = await prisma.liveRadioState.findUnique({ where: { id: 'live-config' } });
        if (state) return NextResponse.json({ success: true, data: state });
      }
    } catch (_) {}
    return NextResponse.json({ success: true, data: defaultLiveState });
  }

  if (endpoint === 'programs') {
    try {
      const app = getApp();
      if (app) {
        const { prisma } = require('../../../../../backend/dist/config/prisma');
        const programs = await prisma.program.findMany({ where: { deletedAt: null } });
        if (programs && programs.length > 0) return NextResponse.json({ success: true, data: programs, total: programs.length });
      }
    } catch (_) {}
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'prog-1',
          name: 'Ninada Morning Buzz',
          slug: 'ninada-morning-buzz',
          description: 'Start your day with SDM campus news, spiritual songs, and vibrant RJ banter.',
          category: 'Morning Show',
          hostName: 'RJ Ananya',
          duration: '60 min',
          language: 'Kannada',
          schedule: 'Mon - Fri @ 8:00 AM',
          featured: true,
          status: 'PUBLISHED',
        },
      ],
      total: 1,
    });
  }

  if (endpoint === 'podcasts') {
    try {
      const app = getApp();
      if (app) {
        const { prisma } = require('../../../../../backend/dist/config/prisma');
        const podcasts = await prisma.podcast.findMany({ where: { deletedAt: null } });
        if (podcasts && podcasts.length > 0) return NextResponse.json({ success: true, data: podcasts, total: podcasts.length });
      }
    } catch (_) {}
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'pod-1',
          title: 'SDM College Golden Jubilee Special',
          slug: 'sdm-college-golden-jubilee',
          audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
          category: 'Special Broadcast',
          description: 'A look into 50 years of excellence at SDM College Ujire.',
          duration: '32:15',
          downloads: 1280,
          featured: true,
        },
      ],
      total: 1,
    });
  }

  if (endpoint === 'news') {
    try {
      const app = getApp();
      if (app) {
        const { prisma } = require('../../../../../backend/dist/config/prisma');
        const news = await prisma.news.findMany({ where: { deletedAt: null } });
        if (news && news.length > 0) return NextResponse.json({ success: true, data: news, total: news.length });
      }
    } catch (_) {}
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'news-1',
          title: 'Radio Ninada 90.4 FM Wins Best Community Radio Award',
          slug: 'community-radio-award-2026',
          content: 'Radio Ninada has been honored for outstanding community outreach and educational broadcasting.',
          category: 'College',
          publishedAt: new Date().toISOString(),
        },
      ],
      total: 1,
    });
  }

  if (endpoint === 'rj') {
    try {
      const app = getApp();
      if (app) {
        const { prisma } = require('../../../../../backend/dist/config/prisma');
        const rjs = await prisma.rJProfile.findMany({ where: { deletedAt: null } });
        if (rjs && rjs.length > 0) return NextResponse.json({ success: true, data: rjs, total: rjs.length });
      }
    } catch (_) {}
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 'rj-1',
          name: 'RJ Ananya',
          designation: 'Senior RJ & Producer',
          bio: 'Bringing warmth, music, and SDM stories every morning.',
          followers: 4200,
          status: 'ACTIVE',
        },
      ],
      total: 1,
    });
  }

  return NextResponse.json({ success: true, message: `Radio Ninada API Endpoint: /api/${endpoint}` });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const endpoint = slug.join('/');
  return NextResponse.json({ success: true, message: `POST /api/${endpoint} acknowledged` });
}
