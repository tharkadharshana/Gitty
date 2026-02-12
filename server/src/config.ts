import dotenv from 'dotenv';
import path from 'path';

<<<<<<< HEAD
// Load environment variables from .env file
dotenv.config();
=======
// Load environment variables from .env file (explicitly from server root)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('[Config] Loading configuration...');
if (process.env.GEMINI_API_KEY) {
    console.log('[Config] GEMINI_API_KEY found.');
} else {
    console.warn('[Config] GEMINI_API_KEY NOT found in process.env');
}
>>>>>>> main

export const config = {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    port: process.env.PORT || 3000,
};
<<<<<<< HEAD

if (!config.geminiApiKey) {
    console.warn('WARNING: GEMINI_API_KEY is not set. AI-assisted refactoring will use fallback heuristics.');
}
=======
>>>>>>> main
