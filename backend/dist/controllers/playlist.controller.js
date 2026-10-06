"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlaylists = getPlaylists;
exports.getPlaylistById = getPlaylistById;
exports.createPlaylist = createPlaylist;
exports.updatePlaylist = updatePlaylist;
exports.deletePlaylist = deletePlaylist;
exports.addPlaylistItem = addPlaylistItem;
exports.removePlaylistItem = removePlaylistItem;
const prisma_1 = require("../config/prisma");
async function getPlaylists(req, res, next) {
    try {
        const sessionId = req.query.sessionId || 'default-session';
        let playlists = await prisma_1.prisma.playlist.findMany({
            where: { sessionId },
            include: {
                items: {
                    orderBy: { position: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        // If no playlists exist for default-session, create a default sample playlist
        if (playlists.length === 0) {
            const defaultPlaylist = await prisma_1.prisma.playlist.create({
                data: {
                    name: 'Radio Ninada Favorites',
                    description: 'Curated mix of station highlights, podcasts, and popular shows.',
                    sessionId,
                    items: {
                        create: [
                            {
                                title: 'College Campus Buzz Special',
                                artist: 'RJ Ananya',
                                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                                coverUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80',
                                duration: '45:00',
                                position: 0,
                            },
                            {
                                title: 'Yakshagana & Heritage Melodies',
                                artist: 'RJ Vikram',
                                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                                coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
                                duration: '32:15',
                                position: 1,
                            },
                        ],
                    },
                },
                include: {
                    items: {
                        orderBy: { position: 'asc' },
                    },
                },
            });
            playlists = [defaultPlaylist];
        }
        return res.json({ success: true, data: playlists });
    }
    catch (error) {
        next(error);
    }
}
async function getPlaylistById(req, res, next) {
    try {
        const id = req.params.id;
        const playlist = await prisma_1.prisma.playlist.findUnique({
            where: { id },
            include: {
                items: {
                    orderBy: { position: 'asc' },
                },
            },
        });
        if (!playlist) {
            return res.status(404).json({ success: false, message: 'Playlist not found' });
        }
        return res.json({ success: true, data: playlist });
    }
    catch (error) {
        next(error);
    }
}
async function createPlaylist(req, res, next) {
    try {
        const { name, description, sessionId } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Playlist name is required' });
        }
        const playlist = await prisma_1.prisma.playlist.create({
            data: {
                name: name.trim(),
                description: description ? description.trim() : '',
                sessionId: sessionId || 'default-session',
            },
            include: { items: true },
        });
        return res.status(201).json({ success: true, data: playlist, message: 'Playlist created successfully' });
    }
    catch (error) {
        next(error);
    }
}
async function updatePlaylist(req, res, next) {
    try {
        const id = req.params.id;
        const { name, description } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Playlist name is required' });
        }
        const updated = await prisma_1.prisma.playlist.update({
            where: { id },
            data: {
                name: name.trim(),
                description: description !== undefined ? description.trim() : undefined,
            },
            include: { items: { orderBy: { position: 'asc' } } },
        });
        return res.json({ success: true, data: updated, message: 'Playlist updated successfully' });
    }
    catch (error) {
        next(error);
    }
}
async function deletePlaylist(req, res, next) {
    try {
        const id = req.params.id;
        await prisma_1.prisma.playlistItem.deleteMany({ where: { playlistId: id } });
        await prisma_1.prisma.playlist.deleteMany({ where: { id } });
        return res.json({ success: true, message: 'Playlist deleted successfully' });
    }
    catch (error) {
        next(error);
    }
}
async function addPlaylistItem(req, res, next) {
    try {
        const id = req.params.id;
        const { title, artist, audioUrl, coverUrl, duration } = req.body;
        if (!title || !audioUrl) {
            return res.status(400).json({ success: false, message: 'Track title and audio URL are required' });
        }
        const existingCount = await prisma_1.prisma.playlistItem.count({
            where: { playlistId: id },
        });
        const newItem = await prisma_1.prisma.playlistItem.create({
            data: {
                playlistId: id,
                title: title.trim(),
                artist: artist ? artist.trim() : 'Radio Ninada RJ',
                audioUrl: audioUrl.trim(),
                coverUrl: coverUrl || null,
                duration: duration || '3:30',
                position: existingCount,
            },
        });
        const updatedPlaylist = await prisma_1.prisma.playlist.findUnique({
            where: { id },
            include: { items: { orderBy: { position: 'asc' } } },
        });
        return res.status(201).json({
            success: true,
            data: updatedPlaylist,
            newItem,
            message: 'Item added to playlist',
        });
    }
    catch (error) {
        next(error);
    }
}
async function removePlaylistItem(req, res, next) {
    try {
        const id = req.params.id;
        const itemId = req.params.itemId;
        await prisma_1.prisma.playlistItem.deleteMany({
            where: { id: itemId, playlistId: id },
        });
        const updatedPlaylist = await prisma_1.prisma.playlist.findUnique({
            where: { id },
            include: { items: { orderBy: { position: 'asc' } } },
        });
        return res.json({
            success: true,
            data: updatedPlaylist,
            message: 'Item removed from playlist',
        });
    }
    catch (error) {
        next(error);
    }
}
