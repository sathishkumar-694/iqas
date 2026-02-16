import express from 'express';
import {
    getBugsByProject,
    getBugById,
    createBug,
    updateBug,
    deleteBug,
} from '../controllers/bugController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createBug);
router.route('/project/:projectId').get(protect, getBugsByProject);
router
    .route('/:id')
    .get(protect, getBugById)
    .put(protect, updateBug)
    .delete(protect, deleteBug);

export default router;
