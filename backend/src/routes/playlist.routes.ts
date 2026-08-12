import { Router } from 'express';
import {
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addPlaylistItem,
  removePlaylistItem,
} from '../controllers/playlist.controller';

const router = Router();

router.get('/', getPlaylists);
router.post('/', createPlaylist);
router.get('/:id', getPlaylistById);
router.put('/:id', updatePlaylist);
router.delete('/:id', deletePlaylist);
router.post('/:id/items', addPlaylistItem);
router.delete('/:id/items/:itemId', removePlaylistItem);

export default router;
