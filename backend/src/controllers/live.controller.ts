import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { getIO } from '../socket/index';

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

export async function getLiveState(req: Request, res: Response, next: NextFunction) {
  try {
    let liveState = await prisma.liveRadioState.findUnique({ where: { id: 'live-config' } });
    if (!liveState) {
      try {
        liveState = await prisma.liveRadioState.create({
          data: { id: 'live-config' },
        });
      } catch (_) {
        liveState = defaultLiveState as any;
      }
    }
    return res.json({ success: true, data: liveState });
  } catch (error) {
    console.warn('[LiveAPI Warning]:', (error as Error)?.message);
    return res.json({ success: true, data: defaultLiveState });
  }
}

export async function updateLiveState(req: Request, res: Response, next: NextFunction) {
  try {
    const { isLive, streamUrl, title, currentProgram, currentRJ, currentSong, bitrate, quality, status } = req.body;

    const updated = await prisma.liveRadioState.upsert({
      where: { id: 'live-config' },
      update: {
        ...(isLive !== undefined && { isLive }),
        ...(streamUrl && { streamUrl }),
        ...(title && { title }),
        ...(currentProgram && { currentProgram }),
        ...(currentRJ && { currentRJ }),
        ...(currentSong && { currentSong }),
        ...(bitrate && { bitrate }),
        ...(quality && { quality }),
        ...(status && { status }),
      },
      create: {
        id: 'live-config',
        isLive: isLive ?? true,
        streamUrl: streamUrl || 'https://stream.zeno.fm/f3wvbbqmdg8uv',
        title: title || 'Radio Ninada 90.4 FM Live',
        currentProgram: currentProgram || 'Ninada Morning Buzz (SDM Ujire)',
        currentRJ: currentRJ || 'RJ Ananya',
        currentSong: currentSong || 'Community Melodies - Live Broadcast',
        bitrate: bitrate || 320,
        quality: quality || 'Ultra HD 320 kbps',
        status: status || 'LIVE',
      },
    });

    // Broadcast live status update via Socket.IO
    try {
      getIO().emit('live-status-changed', updated);
    } catch (err) {
      // Socket emission fallback
    }

    return res.json({ success: true, message: 'Live radio state updated', data: updated });
  } catch (error) {
    next(error);
  }
}

export async function toggleLive(req: Request, res: Response, next: NextFunction) {
  try {
    const currentState = await prisma.liveRadioState.findUnique({ where: { id: 'live-config' } });
    const newIsLive = !currentState?.isLive;

    const updated = await prisma.liveRadioState.update({
      where: { id: 'live-config' },
      data: {
        isLive: newIsLive,
        status: newIsLive ? 'LIVE' : 'OFFLINE',
      },
    });

    try {
      getIO().emit('live-status-changed', updated);
    } catch (err) {}

    return res.json({
      success: true,
      message: `Live radio broadcast is now ${newIsLive ? 'ON AIR' : 'OFF AIR'}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
