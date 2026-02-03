import fs from 'fs-extra';
import path from 'path';

export interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileNode[];
}

export class FilesService {
    async getTree(dirPath: string): Promise<FileNode[]> {
        // Validate path exists
        if (!fs.existsSync(dirPath)) {
            throw new Error(`Path does not exist: ${dirPath}`);
        }

        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
            throw new Error(`Path is not a directory: ${dirPath}`);
        }

        const items = await fs.readdir(dirPath, { withFileTypes: true });

        // Sort: directories first, then alphabetical
        items.sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });

        const nodes: FileNode[] = [];

        for (const item of items) {
            // Skip hidden files/dirs (simple heuristic)
            if (item.name.startsWith('.') && item.name !== '.git') { // Allow .git for now if user wants, but usually hidden
                continue;
            }
            if (item.name === 'node_modules' || item.name === 'dist' || item.name === 'out') {
                continue;
            }

            nodes.push({
                name: item.name,
                path: path.join(dirPath, item.name),
                type: item.isDirectory() ? 'directory' : 'file',
                // We'll do lazy loading on frontend, so no children here for flat list of current dir, 
                // but if we wanted recursive we'd call getTree here. 
                // Let's stick to single level for the API to be efficient.
            });
        }

        return nodes;
    }

    async getFileContent(filePath: string): Promise<string> {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File does not exist: ${filePath}`);
        }
        return fs.readFile(filePath, 'utf-8');
    }
}

export const filesService = new FilesService();
