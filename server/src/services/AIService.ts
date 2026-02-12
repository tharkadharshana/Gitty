import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { RefactorPlan, RefactorCommit } from '../types';
import { settingsService } from './SettingsService';

export class AIService {
    private getGenAI(): GoogleGenerativeAI | null {
        // Try DB first, then config/env
        const dbKey = settingsService.getGeminiKey();
        const apiKey = dbKey || config.geminiApiKey;

        if (apiKey) {
            return new GoogleGenerativeAI(apiKey);
        }
        return null;
    }

    async suggestCommits(filepath: string, currentContent: string, targetContent: string, repoPath?: string): Promise<RefactorPlan> {
        const genAI = this.getGenAI();
        if (!genAI) {
            // Fallback to simple heuristic if no API key
            console.log('[AIService] No API key found in DB or Env, using fallback heuristic.');
            return this.fallbackHeuristic(filepath, currentContent, targetContent);
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Get custom rules for this repo
        const repoRules = repoPath ? settingsService.getRepoRules(repoPath) : undefined;

        const prompt = `
            You are an expert software engineer specializing in clean Git history.
            I have a file "${filepath}" that has been refactored.
            ${repoRules ? `\nIMPORTANT REPO RULES: ${repoRules}\n` : ''}
            
            CURRENT CONTENT:
            file_content_start
            ${currentContent}
            file_content_end
            
            TARGET CONTENT (The final state after refactoring):
            file_content_start
            ${targetContent}
            file_content_end
            
            PLEASE split the changes into a sequence of logical, atomic Git commits.
            For each commit, provide:
            1. A clear, descriptive commit message (Imperative mood, e.g., "Extract helper function").
            2. The FULL content of the file as it should look AFTER that specific commit is applied.
            
            The final commit MUST result in the file matching the TARGET CONTENT exactly.
            
            RESPONSE FORMAT:
            You must respond ONLY with a valid JSON object in the following format:
            {
                "commits": [
                    {
                        "message": "Commit message 1",
                        "changes": "FULL file content after commit 1"
                    },
                    ...
                ]
            }
            
            Do not include any prose or markdown formatting (like \`\`\`json) outside of the JSON object.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON if model included markdown blocks
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const jsonText = jsonMatch ? jsonMatch[0] : text;
            const parsed = JSON.parse(jsonText);

            return {
                filepath,
                commits: parsed.commits.map((c: any, i: number) => ({
                    id: `ai-commit-${i}`,
                    message: c.message,
                    changes: c.changes,
                })),
            };
        } catch (error) {
            console.error('AI Analysis failed, using fallback:', error);
            return this.fallbackHeuristic(filepath, currentContent, targetContent);
        }
    }

    private fallbackHeuristic(filepath: string, currentContent: string, targetContent: string): RefactorPlan {
        const isAdoc = filepath.endsWith('.adoc');
        const commits: RefactorCommit[] = [];

        if (isAdoc) {
            const sections = targetContent.split(/(?=\n==? )/);
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const headerMatch = section.match(/==? (.*)/);
                const title = headerMatch ? headerMatch[1] : `Section ${i + 1}`;
                commits.push({
                    id: `heuristic-${i}`,
                    message: `Refactor section: ${title} (Heuristic Split)`,
                    changes: section,
                });
            }
        } else {
            commits.push({
                id: 'heuristic-final',
                message: `Refactor ${filepath} (Single Commit)`,
                changes: targetContent,
            });
        }

        // Ensure final state matches target
        if (commits.length > 0) {
            commits[commits.length - 1].changes = targetContent;
        }

        return { filepath, commits };
    }
}

export const aiService = new AIService();
