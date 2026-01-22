import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export const config = {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    port: process.env.PORT || 3000,
};

if (!config.geminiApiKey) {
    console.warn('WARNING: GEMINI_API_KEY is not set. AI-assisted refactoring will use fallback heuristics.');
}
