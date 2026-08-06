"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLiveState = getLiveState;
exports.updateLiveState = updateLiveState;
exports.toggleLive = toggleLive;
const prisma_1 = require("../config/prisma");
const index_1 = require("../socket/index");
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
async function getLiveState(req, res, next) {
    try {
        let liveState = await prisma_1.prisma.liveRadioState.findUnique({ where: { id: 'live-config' } });
        if (!liveState) {
            try {
                liveState = await prisma_1.prisma.liveRadioState.create({
                    data: { id: 'live-config' },
                });
            }
            catch (_) {
                liveState = defaultLiveState;
            }
        }
        return res.json({ success: true, data: liveState });
    }
    catch (error) {
        console.warn('[LiveAPI Warning]:', error?.message);
        return res.json({ success: true, data: defaultLiveState });
    }
}
async function updateLiveState(req, res, next) {
    try {
        const { isLive, streamUrl, title, currentProgram, currentRJ, currentSong, bitrate, quality, status } = req.body;
        const updated = await prisma_1.prisma.liveRadioState.upsert({
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
            (0, index_1.getIO)().emit('live-status-changed', updated);
        }
        catch (err) {
            // Socket emission fallback
        }
        return res.json({ success: true, message: 'Live radio state updated', data: updated });
    }
    catch (error) {
        next(error);
    }
}
async function toggleLive(req, res, next) {
    try {
        const currentState = await prisma_1.prisma.liveRadioState.findUnique({ where: { id: 'live-config' } });
        const newIsLive = !currentState?.isLive;
        const updated = await prisma_1.prisma.liveRadioState.update({
            where: { id: 'live-config' },
            data: {
                isLive: newIsLive,
                status: newIsLive ? 'LIVE' : 'OFFLINE',
            },
        });
        try {
            (0, index_1.getIO)().emit('live-status-changed', updated);
        }
        catch (err) { }
        return res.json({
            success: true,
            message: `Live radio broadcast is now ${newIsLive ? 'ON AIR' : 'OFF AIR'}`,
            data: updated,
        });
    }
    catch (error) {
        next(error);
    }
}
