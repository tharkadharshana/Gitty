import { Router } from 'express';
import { settingsService } from '../services/SettingsService';

const router = Router();

// GET all settings
router.get('/', (req, res) => {
    try {
        const settings = settingsService.getAll();
        // Don't expose values for sensitive keys in a real app, but for this local tool it's okay-ish. 
        // Maybe mask the key partially if needed.
        res.json(settings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST update settings
router.post('/', (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) {
            return res.status(400).json({ error: 'Key is required' });
        }

        settingsService.set(key, value || '');
        res.json({ success: true, key, value });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
