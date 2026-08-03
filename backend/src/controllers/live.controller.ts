import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { getIO } from '../socket/index';

export async function getLiveState(req: Request, res: Response, next: NextFunction) {
  try {
    let liveState = await prisma.liveRadioState.findUnique({ where: { id: 'live-config' } });
    if (!liveState) {
      liveState = await prisma.liveRadioState.create({
        data: { id: 'live-config' },
      });
    }
    return res.json({ success: true, data: liveState });
  } catch (error) {
    next(error);
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
        streamUrl: streamUrl || 'https://stream.radioninada.com/live',
        title: title || 'Radio Ninada Live',
        currentProgram: currentProgram || 'Morning Beats',
        currentRJ: currentRJ || 'RJ Ananya',
        currentSong: currentSong || 'Radio Theme',
        bitrate: bitrate || 320,
        quality: quality || 'HD Stereo',
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
