// Type definitions for Gitty

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

export interface AmendRequest {
    files: string[];
    message?: string;
}

export interface RebaseOntoRequest {
    new_base: string;
    old_base: string;
    branch: string;
}

export interface ConflictInfo {
    filepath: string;
    ours_content: string;
    theirs_content: string;
    base_content?: string;
}

export interface OperationResult {
    success: boolean;
    message: string;
    data?: any;
    conflicts?: ConflictInfo[];
}

export interface FileContent {
    filepath: string;
    content: string;
    encoding: 'utf-8' | 'binary';
}
