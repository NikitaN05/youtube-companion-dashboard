import { Router } from 'express';
import { NoteController } from '../controllers/note.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All note routes require authentication
router.use(authenticate);

// Get all unique tags
router.get('/tags/all', NoteController.getUserTags);

// Search notes
router.get('/search', NoteController.searchNotes);

// Get notes for a specific video
router.get('/video/:videoId', NoteController.getNotesByVideo);

// Get all notes with optional search/filter
router.get('/', NoteController.getNotes);

// Get a single note
router.get('/:noteId', NoteController.getNoteById);

// Create a new note
router.post('/', NoteController.validateCreateNote, NoteController.createNote);

// Update a note
router.put(
  '/:noteId',
  NoteController.validateUpdateNote,
  NoteController.updateNote
);

// Delete a note
router.delete('/:noteId', NoteController.deleteNote);

export default router;

