import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

// Use a data directory for the DB
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'gitty.db');

export interface AppSettings {
    geminiApiKey?: string;
    [key: string]: string | undefined;
}

export class SettingsService {
    private db: Database.Database;

    constructor() {
        // Ensure data dir exists
        fs.ensureDirSync(DATA_DIR);

        this.db = new Database(DB_PATH);
        this.initialize();
    }

    private initialize() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `);
    }

    get(key: string): string | undefined {
        const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
        return row?.value;
    }

    set(key: string, value: string) {
        this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
    }

    getAll(): AppSettings {
        const rows = this.db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];

        const settings: AppSettings = {};
        for (const row of rows) {
            settings[row.key] = row.value;
        }
        return settings;
    }

    // specific helpers
    getGeminiKey(): string | undefined {
        return this.get('gemini_api_key');
    }

    getRepoRules(repoPath: string): string | undefined {
        return this.get(`repo_rules_${repoPath}`);
    }
}

export const settingsService = new SettingsService();
