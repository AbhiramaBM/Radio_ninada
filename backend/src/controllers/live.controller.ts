import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { liveStreamSchema } from '../validation/index';
import { getIO } from '../socket/index';

const defaultLiveState = {
  id: 'live-config',
  isLive: true,
  streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
  title: 'Radio Ninada 90.4 FM Live',
  currentProgram: 'Ninada Morning Buzz (SDM Ujire)',
  currentHost: 'RJ Ananya',
  currentSong: 'Community Melodies - Special Broadcast',
  bitrate: 320,
  quality: 'HD Stereo 44.1kHz',
  status: 'LIVE',
  liveListeners: 48,
  updatedAt: new Date().toISOString(),
};

export async function getLiveState(req: Request, res: Response, next: NextFunction) {
  try {
    let live = await prisma.liveStream.findUnique({
      where: { id: 'live-config' },
      include: { media: true },
    });

    if (!live) {
      try {
        live = await prisma.liveStream.create({
          data: { id: 'live-config' },
          include: { media: true },
        });
      } catch {
        live = defaultLiveState as any;
      }
    }

    return res.json({ success: true, data: live });
  } catch (error) {
    console.warn('[LiveAPI Warning]:', (error as Error)?.message);
    return res.json({ success: true, data: defaultLiveState });
  }
}

export async function updateLiveState(req: Request, res: Response, next: NextFunction) {
  try {
    const data = liveStreamSchema.parse(req.body);

    const updated = await prisma.liveStream.upsert({
      where: { id: 'live-config' },
      update: {
        ...(data.isLive !== undefined && { isLive: data.isLive }),
        ...(data.streamUrl && { streamUrl: data.streamUrl }),
        ...(data.title && { title: data.title }),
        ...(data.currentProgram && { currentProgram: data.currentProgram }),
        ...(data.currentHost && { currentHost: data.currentHost }),
        ...(data.currentSong && { currentSong: data.currentSong }),
        ...(data.bitrate && { bitrate: data.bitrate }),
        ...(data.quality && { quality: data.quality }),
        ...(data.status && { status: data.status as any }),
        ...(data.liveListeners !== undefined && { liveListeners: data.liveListeners }),
      },
      create: {
        id: 'live-config',
        isLive: data.isLive ?? true,
        streamUrl: data.streamUrl || 'https://stream.zeno.fm/f3wvbbqmdg8uv',
        title: data.title || 'Radio Ninada 90.4 FM Live',
        currentProgram: data.currentProgram || 'Ninada Morning Buzz (SDM Ujire)',
        currentHost: data.currentHost || 'RJ Ananya',
        currentSong: data.currentSong || 'Community Melodies - Special Broadcast',
        bitrate: data.bitrate || 320,
        quality: data.quality || 'HD Stereo 44.1kHz',
        status: (data.status as any) || 'LIVE',
        liveListeners: data.liveListeners || 48,
      },
    });

    // Broadcast to connected listeners via Socket.IO
    try {
      const io = getIO();
      if (io) io.emit('live-state-changed', updated);
    } catch (_) {}

    return res.json({ success: true, message: 'Live radio state updated', data: updated });
  } catch (error) {
    next(error);
  }
}

export async function toggleBroadcast(req: Request, res: Response, next: NextFunction) {
  try {
    const current = await prisma.liveStream.findUnique({ where: { id: 'live-config' } });
    const isLive = !(current?.isLive ?? true);
    const updated = await prisma.liveStream.upsert({
      where: { id: 'live-config' },
      update: { isLive, status: isLive ? 'LIVE' : 'OFFLINE' },
      create: { id: 'live-config', isLive, status: isLive ? 'LIVE' : 'OFFLINE' },
    });

    try {
      const io = getIO();
      if (io) io.emit('broadcast-toggled', { isLive });
    } catch (_) {}

    return res.json({ success: true, isLive: updated.isLive, status: updated.status });
  } catch (error) {
    next(error);
  }
}

export const toggleLive = toggleBroadcast;
