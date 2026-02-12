import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file (explicitly from server root)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('[Config] Loading configuration...');
if (process.env.GEMINI_API_KEY) {
    console.log('[Config] GEMINI_API_KEY found.');
} else {
    console.warn('[Config] GEMINI_API_KEY NOT found in process.env');
}

export const config = {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    port: process.env.PORT || 3000,
};
