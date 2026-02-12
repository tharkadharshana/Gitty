import { Router } from 'express';
import { filesService } from '../services/FilesService';

const router = Router();

// GET /api/files/tree?path=...
router.get('/tree', async (req, res) => {
    try {
        const dirPath = req.query.path as string || process.cwd(); // Default to CWD if no path
        const tree = await filesService.getTree(dirPath);
        res.json({ path: dirPath, items: tree });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/files/content?path=...
router.get('/content', async (req, res) => {
    try {
        const filePath = req.query.path as string;
        if (!filePath) {
            return res.status(400).json({ error: 'Path is required' });
        }
        const content = await filesService.getFileContent(filePath);
        res.json({ content });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
