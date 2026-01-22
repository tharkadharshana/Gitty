import axios from 'axios';
import type {
    RepoInfo,
    CommitInfo,
    BranchInfo,
    FileChange,
    DiffResult,
    FileContent,
    OperationResult,
} from '../types';

const api = axios.create({
    baseURL: '/api/git',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const gitApi = {
    // Repository operations
    async openRepository(path: string): Promise<RepoInfo> {
        const response = await api.post<RepoInfo>('/open', { path });
        return response.data;
    },

    async browseFolders(path?: string): Promise<{
        currentPath: string;
        parentPath: string | null;
        folders: { name: string; path: string; isRepo: boolean }[];
        drives: string[];
    }> {
        const response = await api.post('/browse', { path });
        return response.data;
    },

    async getRepoInfo(): Promise<RepoInfo> {
        const response = await api.get<RepoInfo>('/info');
        return response.data;
    },

    async getStatus(): Promise<Record<string, unknown>> {
        const response = await api.get('/status');
        return response.data;
    },

    // Commits
    async getCommits(limit: number = 100): Promise<CommitInfo[]> {
        const response = await api.get<CommitInfo[]>('/commits', { params: { limit } });
        return response.data;
    },

    async getCommitFiles(hash: string): Promise<FileChange[]> {
        const response = await api.get<FileChange[]>(`/commits/${hash}/files`);
        return response.data;
    },

    async getFileDiff(hash: string, filepath: string): Promise<DiffResult> {
        const response = await api.get<DiffResult>(`/commits/${hash}/diff/${filepath}`);
        return response.data;
    },

    // Branches
    async getBranches(): Promise<BranchInfo[]> {
        const response = await api.get<BranchInfo[]>('/branches');
        return response.data;
    },

    // File operations
    async getFileContent(hash: string, filepath: string): Promise<FileContent> {
        const response = await api.get<FileContent>(`/file/${hash}/${filepath}`);
        return response.data;
    },

    async getWorkingFileContent(filepath: string): Promise<FileContent> {
        const response = await api.get<FileContent>(`/working-file/${filepath}`);
        return response.data;
    },

    async writeFile(filepath: string, content: string): Promise<OperationResult> {
        const response = await api.post<OperationResult>('/write-file', { filepath, content });
        return response.data;
    },

    // Git operations for history editing
    async checkoutCommit(hash: string): Promise<OperationResult> {
        const response = await api.post<OperationResult>(`/checkout/${hash}`);
        return response.data;
    },

    async checkoutBranch(branch: string): Promise<OperationResult> {
        const response = await api.post<OperationResult>('/checkout-branch', { branch });
        return response.data;
    },

    async stageFiles(files: string[]): Promise<OperationResult> {
        const response = await api.post<OperationResult>('/stage', { files });
        return response.data;
    },

    async amendCommit(message?: string): Promise<OperationResult> {
        const response = await api.post<OperationResult>('/amend', { message });
        return response.data;
    },

    async rebaseOnto(newBase: string, oldBase: string, branch: string): Promise<OperationResult> {
        const response = await api.post<OperationResult>('/rebase-onto', {
            new_base: newBase,
            old_base: oldBase,
            branch,
        });
        return response.data;
    },

    async abortRebase(): Promise<OperationResult> {
        const response = await api.post<OperationResult>('/rebase-abort');
        return response.data;
    },

    async continueRebase(): Promise<OperationResult> {
        const response = await api.post<OperationResult>('/rebase-continue');
        return response.data;
    },

    async forcePush(remote: string, branch: string): Promise<OperationResult> {
        const response = await api.post<OperationResult>('/force-push', { remote, branch });
        return response.data;
    },

    async moveBranchToHead(branch: string): Promise<OperationResult> {
        const response = await api.post<OperationResult>('/move-branch', { branch });
        return response.data;
    },
};

export default gitApi;
