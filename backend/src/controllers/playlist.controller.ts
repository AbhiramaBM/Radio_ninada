import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export async function getPlaylists(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = (req.query.sessionId as string) || 'default-session';
    let playlists = await prisma.playlist.findMany({
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
      const defaultPlaylist = await prisma.playlist.create({
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
  } catch (error) {
    next(error);
  }
}

export async function getPlaylistById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const playlist = await prisma.playlist.findUnique({
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
  } catch (error) {
    next(error);
  }
}

export async function createPlaylist(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description, sessionId } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Playlist name is required' });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : '',
        sessionId: sessionId || 'default-session',
      },
      include: { items: true },
    });

    return res.status(201).json({ success: true, data: playlist, message: 'Playlist created successfully' });
  } catch (error) {
    next(error);
  }
}

export async function updatePlaylist(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Playlist name is required' });
    }

    const updated = await prisma.playlist.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description !== undefined ? description.trim() : undefined,
      },
      include: { items: { orderBy: { position: 'asc' } } },
    });

    return res.json({ success: true, data: updated, message: 'Playlist updated successfully' });
  } catch (error) {
    next(error);
  }
}

export async function deletePlaylist(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await prisma.playlist.delete({ where: { id } });
    return res.json({ success: true, message: 'Playlist deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function addPlaylistItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { title, artist, audioUrl, coverUrl, duration } = req.body;

    if (!title || !audioUrl) {
      return res.status(400).json({ success: false, message: 'Track title and audio URL are required' });
    }

    const existingCount = await prisma.playlistItem.count({
      where: { playlistId: id },
    });

    const newItem = await prisma.playlistItem.create({
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

    const updatedPlaylist = await prisma.playlist.findUnique({
      where: { id },
      include: { items: { orderBy: { position: 'asc' } } },
    });

    return res.status(201).json({
      success: true,
      data: updatedPlaylist,
      newItem,
      message: 'Item added to playlist',
    });
  } catch (error) {
    next(error);
  }
}

export async function removePlaylistItem(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const itemId = req.params.itemId as string;

    await prisma.playlistItem.delete({
      where: { id: itemId },
    });

    const updatedPlaylist = await prisma.playlist.findUnique({
      where: { id },
      include: { items: { orderBy: { position: 'asc' } } },
    });


    return res.json({
      success: true,
      data: updatedPlaylist,
      message: 'Item removed from playlist',
    });
  } catch (error) {
    next(error);
  }
}
