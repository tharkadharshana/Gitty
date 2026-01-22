import simpleGit, { SimpleGit, LogResult, StatusResult } from 'simple-git';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
    CommitInfo,
    FileChange,
    DiffResult,
    RepoInfo,
    BranchInfo,
    OperationResult,
    FileContent,
} from '../types';

export class GitService {
    private git: SimpleGit | null = null;
    private repoPath: string | null = null;

    /**
     * Open a Git repository at the specified path
     */
    async openRepository(repoPath: string): Promise<RepoInfo> {
        const absolutePath = path.resolve(repoPath);

        // Check if directory exists
        try {
            await fs.access(absolutePath);
        } catch {
            throw new Error(`Directory does not exist: ${absolutePath}`);
        }

        // Check if it's a git repository
        const git = simpleGit(absolutePath);
        const isRepo = await git.checkIsRepo();

        if (!isRepo) {
            throw new Error(`Not a Git repository: ${absolutePath}`);
        }

        this.git = git;
        this.repoPath = absolutePath;

        return this.getRepoInfo();
    }

    /**
     * List subdirectories and drives for browsing
     */
    async browseFolders(targetPath: string = '.'): Promise<{
        currentPath: string;
        parentPath: string | null;
        folders: { name: string; path: string; isRepo: boolean }[];
        drives: string[];
    }> {
        const absolutePath = path.resolve(targetPath);
        const parentPath = path.dirname(absolutePath) === absolutePath ? null : path.dirname(absolutePath);

        let drives: string[] = [];
        if (process.platform === 'win32') {
            try {
                const { execSync } = require('child_process');
                const output = execSync('wmic logicaldisk get name').toString();
                drives = output.split('\n')
                    .map((line: string) => line.trim())
                    .filter((line: string) => line.match(/^[A-Z]:$/));
            } catch (err) {
                console.error('Failed to list drives:', err);
            }
        }

        try {
            const entries = await fs.readdir(absolutePath, { withFileTypes: true });
            const folders = [];

            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    const fullPath = path.join(absolutePath, entry.name);
                    let isRepo = false;

                    // Specific check for .git directory to avoid false positives from parent repos
                    try {
                        const gitDir = path.join(fullPath, '.git');
                        await fs.access(gitDir);
                        isRepo = true;
                    } catch {
                        isRepo = false;
                    }

                    folders.push({
                        name: entry.name,
                        path: fullPath,
                        isRepo
                    });
                }
            }

            return {
                currentPath: absolutePath,
                parentPath,
                folders: folders.sort((a, b) => a.name.localeCompare(b.name)),
                drives
            };
        } catch (error: any) {
            throw new Error(`Failed to browse path ${absolutePath}: ${error.message}`);
        }
    }

    /**
     * Get information about the current repository
     */
    async getRepoInfo(): Promise<RepoInfo> {
        this.ensureRepo();

        const status = await this.git!.status();
        const remotes = await this.git!.getRemotes(true);

        // Check if HEAD is detached
        let isDetached = false;
        let currentBranch = status.current || '';

        try {
            const head = await this.git!.revparse(['--abbrev-ref', 'HEAD']);
            isDetached = head.trim() === 'HEAD';
            if (!isDetached) {
                currentBranch = head.trim();
            }
        } catch {
            isDetached = true;
        }

        return {
            path: this.repoPath!,
            current_branch: currentBranch,
            is_detached: isDetached,
            remotes: remotes.map(r => ({
                name: r.name,
                fetch_url: r.refs.fetch || '',
                push_url: r.refs.push || '',
            })),
            has_uncommitted_changes: !status.isClean(),
        };
    }

    /**
     * Get commit history
     */
    async getCommitHistory(limit: number = 100): Promise<CommitInfo[]> {
        this.ensureRepo();

        const log = await this.git!.log({
            maxCount: limit,
            format: {
                hash: '%H',
                abbreviated_hash: '%h',
                message: '%s',
                author_name: '%an',
                author_email: '%ae',
                date: '%aI',
                parent_hashes: '%P',
                refs: '%D',
            },
        });

        return log.all.map((entry: any) => ({
            hash: entry.hash,
            abbreviated_hash: entry.abbreviated_hash,
            message: entry.message,
            author_name: entry.author_name,
            author_email: entry.author_email,
            date: entry.date,
            parent_hashes: entry.parent_hashes ? entry.parent_hashes.split(' ') : [],
            refs: entry.refs || '',
        }));
    }

    /**
     * Get list of branches
     */
    async getBranches(): Promise<BranchInfo[]> {
        this.ensureRepo();

        const branchSummary = await this.git!.branch(['-a', '-v']);

        return Object.entries(branchSummary.branches).map(([name, info]) => ({
            name: info.name,
            current: info.current,
            commit_hash: info.commit,
            tracking: (info as any).tracking,
        }));
    }

    /**
     * Get files changed in a specific commit
     */
    async getCommitFiles(hash: string): Promise<FileChange[]> {
        this.ensureRepo();

        const result = await this.git!.show([
            hash,
            '--name-status',
            '--format=',
        ]);

        const lines = result.trim().split('\n').filter(line => line.trim());
        const files: FileChange[] = [];

        for (const line of lines) {
            const parts = line.split('\t');
            if (parts.length >= 2) {
                const statusCode = parts[0].charAt(0);
                let status: FileChange['status'];

                switch (statusCode) {
                    case 'A': status = 'added'; break;
                    case 'M': status = 'modified'; break;
                    case 'D': status = 'deleted'; break;
                    case 'R': status = 'renamed'; break;
                    case 'C': status = 'copied'; break;
                    default: status = 'modified';
                }

                files.push({
                    filepath: parts[parts.length - 1],
                    status,
                    old_path: statusCode === 'R' || statusCode === 'C' ? parts[1] : undefined,
                });
            }
        }

        return files;
    }

    /**
     * Get diff for a file in a specific commit
     */
    async getFileDiff(hash: string, filepath: string): Promise<DiffResult> {
        this.ensureRepo();

        // Get old content (parent commit)
        let oldContent = '';
        try {
            oldContent = await this.git!.show([`${hash}^:${filepath}`]);
        } catch {
            // File didn't exist in parent commit (new file)
            oldContent = '';
        }

        // Get new content (this commit)
        let newContent = '';
        try {
            newContent = await this.git!.show([`${hash}:${filepath}`]);
        } catch {
            // File was deleted in this commit
            newContent = '';
        }

        // Get the actual diff output using git show
        // This is more reliable for historical commits and handles merge commits naturally
        let diffOutput = '';
        try {
            diffOutput = await this.git!.show([hash, '--', filepath]);
        } catch (error) {
            console.error('Failed to get diff output:', error);
            diffOutput = '';
        }

        return {
            filepath,
            old_content: oldContent,
            new_content: newContent,
            hunks: this.parseDiffHunks(diffOutput),
        };
    }

    /**
     * Checkout a specific commit (detached HEAD)
     */
    async checkoutCommit(hash: string): Promise<OperationResult> {
        this.ensureRepo();

        try {
            await this.git!.checkout(hash);
            return {
                success: true,
                message: `Checked out commit ${hash.substring(0, 7)}`,
                data: { hash },
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Checkout a branch
     */
    async checkoutBranch(branch: string): Promise<OperationResult> {
        this.ensureRepo();

        try {
            await this.git!.checkout(branch);
            return {
                success: true,
                message: `Checked out branch ${branch}`,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Get file content at a specific commit
     */
    async getFileContent(hash: string, filepath: string): Promise<FileContent> {
        this.ensureRepo();

        try {
            const content = await this.git!.show([`${hash}:${filepath}`]);
            return {
                filepath,
                content,
                encoding: 'utf-8',
            };
        } catch (error: any) {
            throw new Error(`Could not get file content: ${error.message}`);
        }
    }

    /**
     * Get current working directory file content
     */
    async getWorkingFileContent(filepath: string): Promise<FileContent> {
        this.ensureRepo();

        const fullPath = path.join(this.repoPath!, filepath);

        try {
            const content = await fs.readFile(fullPath, 'utf-8');
            return {
                filepath,
                content,
                encoding: 'utf-8',
            };
        } catch (error: any) {
            throw new Error(`Could not read file: ${error.message}`);
        }
    }

    /**
     * Write content to a file in the working directory
     */
    async writeFile(filepath: string, content: string): Promise<OperationResult> {
        this.ensureRepo();

        const fullPath = path.join(this.repoPath!, filepath);

        try {
            // Ensure directory exists
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, content, 'utf-8');
            return {
                success: true,
                message: `File written: ${filepath}`,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Stage files for commit
     */
    async stageFiles(files: string[]): Promise<OperationResult> {
        this.ensureRepo();

        try {
            await this.git!.add(files);
            return {
                success: true,
                message: `Staged ${files.length} file(s)`,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Amend the current HEAD commit
     */
    async amendCommit(message?: string): Promise<OperationResult> {
        this.ensureRepo();

        try {
            const args = ['--amend'];
            if (message) {
                args.push('-m', message);
            } else {
                args.push('--no-edit');
            }

            await this.git!.commit([], args);

            // Get the new commit hash
            const newHash = await this.git!.revparse(['HEAD']);

            return {
                success: true,
                message: 'Commit amended successfully',
                data: { new_hash: newHash.trim() },
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Perform rebase --onto operation
     * This replays commits from old_base to branch onto new_base
     */
    async rebaseOnto(newBase: string, oldBase: string, branch: string): Promise<OperationResult> {
        this.ensureRepo();

        try {
            await this.git!.rebase(['--onto', newBase, oldBase, branch]);
            return {
                success: true,
                message: `Successfully rebased ${branch} onto ${newBase.substring(0, 7)}`,
            };
        } catch (error: any) {
            // Check if there are conflicts
            const status = await this.git!.status();

            if (status.conflicted.length > 0) {
                return {
                    success: false,
                    message: 'Rebase stopped due to conflicts',
                    conflicts: status.conflicted.map(filepath => ({
                        filepath,
                        ours_content: '',
                        theirs_content: '',
                    })),
                };
            }

            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Abort ongoing rebase
     */
    async abortRebase(): Promise<OperationResult> {
        this.ensureRepo();

        try {
            await this.git!.rebase(['--abort']);
            return {
                success: true,
                message: 'Rebase aborted',
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Continue rebase after resolving conflicts
     */
    async continueRebase(): Promise<OperationResult> {
        this.ensureRepo();

        try {
            await this.git!.rebase(['--continue']);
            return {
                success: true,
                message: 'Rebase continued',
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Force push to remote
     */
    async forcePush(remote: string, branch: string): Promise<OperationResult> {
        this.ensureRepo();

        try {
            await this.git!.push(remote, branch, ['--force']);
            return {
                success: true,
                message: `Force pushed ${branch} to ${remote}`,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Get status of the working directory
     */
    async getStatus(): Promise<StatusResult> {
        this.ensureRepo();
        return this.git!.status();
    }

    /**
     * Move branch pointer to current HEAD
     */
    async moveBranchToHead(branch: string): Promise<OperationResult> {
        this.ensureRepo();

        try {
            await this.git!.branch(['-f', branch, 'HEAD']);
            return {
                success: true,
                message: `Moved ${branch} to HEAD`,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    /**
     * Parse diff output into hunks
     */
    private parseDiffHunks(diffOutput: string): DiffResult['hunks'] {
        const hunks: DiffResult['hunks'] = [];
        const lines = diffOutput.split('\n');

        let currentHunk: DiffResult['hunks'][0] | null = null;
        const hunkHeaderRegex = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/;

        for (const line of lines) {
            const hunkMatch = line.match(hunkHeaderRegex);

            if (hunkMatch) {
                if (currentHunk) {
                    hunks.push(currentHunk);
                }
                currentHunk = {
                    old_start: parseInt(hunkMatch[1], 10),
                    old_lines: hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1,
                    new_start: parseInt(hunkMatch[3], 10),
                    new_lines: hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1,
                    lines: [],
                };
            } else if (currentHunk) {
                if (line.startsWith('+')) {
                    currentHunk.lines.push({
                        type: 'add',
                        content: line.substring(1),
                    });
                } else if (line.startsWith('-')) {
                    currentHunk.lines.push({
                        type: 'remove',
                        content: line.substring(1),
                    });
                } else if (line.startsWith(' ')) {
                    currentHunk.lines.push({
                        type: 'context',
                        content: line.substring(1),
                    });
                }
            }
        }

        if (currentHunk) {
            hunks.push(currentHunk);
        }

        return hunks;
    }

    /**
     * Ensure a repository is opened
     */
    private ensureRepo(): void {
        if (!this.git || !this.repoPath) {
            throw new Error('No repository opened. Call openRepository first.');
        }
    }
}

// Export singleton instance
export const gitService = new GitService();
