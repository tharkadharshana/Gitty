import { Router, Request, Response } from 'express';
import { gitService } from '../services/GitService';
import { AmendRequest, RebaseOntoRequest } from '../types';

const router = Router();

/**
 * POST /api/git/open
 * Open a Git repository
 */
router.post('/open', async (req: Request, res: Response) => {
    try {
        const { path } = req.body;

        if (!path) {
            return res.status(400).json({ error: 'Repository path is required' });
        }

        const repoInfo = await gitService.openRepository(path);
        res.json(repoInfo);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/git/browse
 * Browse folders for repository selection
 */
router.post('/browse', async (req: Request, res: Response) => {
    try {
        const { path } = req.body;
        const result = await gitService.browseFolders(path);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/git/info
 * Get current repository info
 */
router.get('/info', async (_req: Request, res: Response) => {
    try {
        const info = await gitService.getRepoInfo();
        res.json(info);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/git/commits
 * Get commit history
 */
router.get('/commits', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;
        const commits = await gitService.getCommitHistory(limit);
        res.json(commits);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/git/branches
 * Get all branches
 */
router.get('/branches', async (_req: Request, res: Response) => {
    try {
        const branches = await gitService.getBranches();
        res.json(branches);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/git/commits/:hash/files
 * Get files changed in a commit
 */
router.get('/commits/:hash/files', async (req: Request, res: Response) => {
    try {
        const { hash } = req.params;
        const files = await gitService.getCommitFiles(hash);
        res.json(files);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/git/commits/:hash/diff/:filepath
 * Get diff for a specific file in a commit
 */
router.get('/commits/:hash/diff/*', async (req: Request, res: Response) => {
    try {
        const { hash } = req.params;
        const filepath = req.params[0]; // Capture the rest of the path
        const diff = await gitService.getFileDiff(hash, filepath);
        res.json(diff);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/git/file/:hash/*
 * Get file content at a specific commit
 */
router.get('/file/:hash/*', async (req: Request, res: Response) => {
    try {
        const { hash } = req.params;
        const filepath = req.params[0];
        const content = await gitService.getFileContent(hash, filepath);
        res.json(content);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/git/working-file/*
 * Get file content from working directory
 */
router.get('/working-file/*', async (req: Request, res: Response) => {
    try {
        const filepath = req.params[0];
        const content = await gitService.getWorkingFileContent(filepath);
        res.json(content);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/git/checkout/:hash
 * Checkout a specific commit
 */
router.post('/checkout/:hash', async (req: Request, res: Response) => {
    try {
        const { hash } = req.params;
        const result = await gitService.checkoutCommit(hash);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/git/checkout-branch
 * Checkout a branch
 */
router.post('/checkout-branch', async (req: Request, res: Response) => {
    try {
        const { branch } = req.body;
        if (!branch) {
            return res.status(400).json({ error: 'branch name is required' });
        }
        const result = await gitService.checkoutBranch(branch);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/git/write-file
 * Write content to a file
 */
router.post('/write-file', async (req: Request, res: Response) => {
    try {
        const { filepath, content } = req.body;

        if (!filepath || content === undefined) {
            return res.status(400).json({ error: 'filepath and content are required' });
        }

        const result = await gitService.writeFile(filepath, content);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/git/stage
 * Stage files for commit
 */
router.post('/stage', async (req: Request, res: Response) => {
    try {
        const { files } = req.body;

        if (!files || !Array.isArray(files)) {
            return res.status(400).json({ error: 'files array is required' });
        }

        const result = await gitService.stageFiles(files);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/git/amend
 * Amend the current HEAD commit
 */
router.post('/amend', async (req: Request, res: Response) => {
    try {
        const { message } = req.body as AmendRequest;
        const result = await gitService.amendCommit(message);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/git/rebase-onto
 * Perform rebase --onto operation
 */
router.post('/rebase-onto', async (req: Request, res: Response) => {
    try {
        const { new_base, old_base, branch } = req.body as RebaseOntoRequest;

        if (!new_base || !old_base || !branch) {
            return res.status(400).json({ error: 'new_base, old_base, and branch are required' });
        }

        const result = await gitService.rebaseOnto(new_base, old_base, branch);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/git/rebase-abort
 * Abort ongoing rebase
 */
router.post('/rebase-abort', async (_req: Request, res: Response) => {
    try {
        const result = await gitService.abortRebase();
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/git/rebase-continue
 * Continue rebase after resolving conflicts
 */
router.post('/rebase-continue', async (_req: Request, res: Response) => {
    try {
        const result = await gitService.continueRebase();
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/git/force-push
 * Force push to remote
 */
router.post('/force-push', async (req: Request, res: Response) => {
    try {
        const { remote, branch } = req.body;

        if (!remote || !branch) {
            return res.status(400).json({ error: 'remote and branch are required' });
        }

        const result = await gitService.forcePush(remote, branch);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/git/status
 * Get working directory status
 */
router.get('/status', async (_req: Request, res: Response) => {
    try {
        const status = await gitService.getStatus();
        res.json(status);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/git/move-branch
 * Move branch pointer to HEAD
 */
router.post('/move-branch', async (req: Request, res: Response) => {
    try {
        const { branch } = req.body;

        if (!branch) {
            return res.status(400).json({ error: 'branch is required' });
        }

        const result = await gitService.moveBranchToHead(branch);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/git/analyze-refactor
 * Suggest a multi-commit refactor plan
 */
router.post('/analyze-refactor', async (req: Request, res: Response) => {
    try {
        const { filepath, targetContent, repoPath } = req.body;
        if (!filepath || targetContent === undefined) {
            return res.status(400).json({ error: 'filepath and targetContent are required' });
        }
        const plan = await gitService.analyzeRefactor(filepath, targetContent, repoPath);
        res.json(plan);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/git/apply-refactor
 * Apply a sequence of refactor commits
 */
router.post('/apply-refactor', async (req: Request, res: Response) => {
    try {
        const { filepath, commits } = req.body;
        if (!filepath || !commits || !Array.isArray(commits)) {
            return res.status(400).json({ error: 'filepath and commits array are required' });
        }
        const result = await gitService.applyRefactorSequence(filepath, commits);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
