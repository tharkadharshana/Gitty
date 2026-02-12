// Shared types between client and server

export interface CommitInfo {
    hash: string;
    abbreviated_hash: string;
    message: string;
    author_name: string;
    author_email: string;
    date: string;
    parent_hashes: string[];
    refs: string;
}

export interface FileChange {
    filepath: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
    insertions?: number;
    deletions?: number;
    old_path?: string;
}

export interface DiffResult {
    filepath: string;
    old_content: string;
    new_content: string;
    hunks: DiffHunk[];
}

export interface DiffHunk {
    old_start: number;
    old_lines: number;
    new_start: number;
    new_lines: number;
    lines: DiffLine[];
}

export interface DiffLine {
    type: 'add' | 'remove' | 'context';
    content: string;
    old_line?: number;
    new_line?: number;
}

export interface RepoInfo {
    path: string;
    current_branch: string;
    is_detached: boolean;
    remotes: RemoteInfo[];
    has_uncommitted_changes: boolean;
}

export interface RemoteInfo {
    name: string;
    fetch_url: string;
    push_url: string;
}

export interface BranchInfo {
    name: string;
    current: boolean;
    commit_hash: string;
    tracking?: string;
}

export interface OperationResult {
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
    conflicts?: ConflictInfo[];
}

export interface ConflictInfo {
    filepath: string;
    ours_content: string;
    theirs_content: string;
    base_content?: string;
}

export interface FileContent {
    filepath: string;
    content: string;
    encoding: 'utf-8' | 'binary';
}

// Workflow step states
export type WorkflowStep =
    | 'idle'
    | 'checkout'
    | 'editing'
    | 'staging'
    | 'amending'
    | 'rebasing'
    | 'pushing'
    | 'complete'
    | 'error';

export interface WorkflowState {
    step: WorkflowStep;
    targetCommit: CommitInfo | null;
    originalBranch: string;
    newCommitHash: string | null;
    modifiedFiles: string[];
    error: string | null;
}

export interface RefactorCommit {
    id: string;
    message: string;
    changes: string;
}

export interface RefactorPlan {
    filepath: string;
    commits: RefactorCommit[];
}
