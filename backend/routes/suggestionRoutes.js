import { Router } from 'express';
import { getSuggestions } from '../controllers/suggestions/suggestionController.js';

const router = Router();

// Route for getting career suggestions
router.post('/', getSuggestions);

export default router; 