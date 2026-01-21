import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    User,
    Clock,
    Hash,
    FileText,
    Plus,
    Minus,
    Edit3,
    RotateCcw,
    Upload,
    AlertTriangle,
} from 'lucide-react';
import { gitApi } from '../services/api';
import { ConflictResolver } from './ConflictResolver';
import { ForcePushModal } from './ForcePushModal';
import type { CommitInfo, FileChange, RepoInfo, ConflictInfo } from '../types';
import type { ToastType } from './Toast';

interface CommitDetailsProps {
    commit: CommitInfo;
    files: FileChange[];
    repoInfo: RepoInfo;
    onSelectFile: (file: FileChange) => void;
    onUpdate: () => void;
    addToast: (type: ToastType, message: string) => void;
}

const statusIcons = {
    added: Plus,
    modified: Edit3,
    deleted: Minus,
    renamed: FileText,
    copied: FileText,
};

const statusLabels = {
    added: 'Added',
    modified: 'Modified',
    deleted: 'Deleted',
    renamed: 'Renamed',
    copied: 'Copied',
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function CommitDetails({
    commit,
    files,
    repoInfo,
    onSelectFile,
    onUpdate,
    addToast,
}: CommitDetailsProps) {
    const [isEditMode, setEditMode] = useState(false);
    const [workflowStep, setWorkflowStep] = useState<'idle' | 'checkout' | 'editing' | 'rebasing' | 'complete'>('idle');

    // Conflict and Push States
    const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
    const [showForcePush, setShowForcePush] = useState(false);

    // Mutation for starting edit workflow
    const checkoutMutation = useMutation({
        mutationFn: () => gitApi.checkoutCommit(commit.hash),
        onSuccess: () => {
            setWorkflowStep('editing');
            addToast('success', `Checked out commit ${commit.abbreviated_hash}. You can now edit files.`);
        },
        onError: (error: Error) => {
            addToast('error', `Checkout failed: ${error.message}`);
            setWorkflowStep('idle');
        },
    });

    // Mutation for completing the rebase
    const rebaseMutation = useMutation({
        mutationFn: async (newHash: string) => {
            // If we already have conflicts, we are continuing
            if (conflicts.length > 0) {
                return gitApi.continueRebase();
            }
            return gitApi.rebaseOnto(newHash, commit.hash, repoInfo.current_branch);
        },
        onSuccess: (result) => {
            if (result.success) {
                setConflicts([]);
                setWorkflowStep('complete');
                addToast('success', 'Rebase complete! History rewritten.');
                onUpdate();
            } else if (result.conflicts) {
                setConflicts(result.conflicts);
                setWorkflowStep('rebasing');
                addToast('warning', 'Conflicts detected during rebase. Please resolve them.');
            } else {
                addToast('error', `Rebase failed: ${result.message}`);
            }
        },
        onError: (error: Error) => {
            addToast('error', `Rebase failed: ${error.message}`);
        },
    });

    // Mutation for aborting rebase
    const abortRebaseMutation = useMutation({
        mutationFn: () => gitApi.abortRebase(),
        onSuccess: () => {
            setConflicts([]);
            setWorkflowStep('idle');
            setEditMode(false);
            gitApi.checkoutBranch(repoInfo.current_branch);
            addToast('info', 'Rebase aborted. Changes discarded.');
        },
        onError: (error: Error) => {
            addToast('error', `Failed to abort: ${error.message}`);
        },
    });

    // Force Push Mutation
    const forcePushMutation = useMutation({
        mutationFn: () => gitApi.forcePush('origin', repoInfo.current_branch), // Assuming origin for now
        onSuccess: () => {
            setShowForcePush(false);
            addToast('success', `Force pushed to origin/${repoInfo.current_branch}`);
        },
        onError: (error: Error) => {
            addToast('error', `Force push failed: ${error.message}`);
        },
    });

    const handleStartEdit = () => {
        setEditMode(true);
        setWorkflowStep('checkout');
        checkoutMutation.mutate();
    };

    const handleCancelEdit = async () => {
        if (workflowStep === 'rebasing' || conflicts.length > 0) {
            abortRebaseMutation.mutate();
        } else {
            try {
                await gitApi.checkoutBranch(repoInfo.current_branch);
                setEditMode(false);
                setWorkflowStep('idle');
                addToast('info', 'Edit cancelled, returned to branch.');
            } catch (error: any) {
                addToast('error', `Failed to return to branch: ${error.message}`);
            }
        }
    };

    const handleResolveConflicts = async (resolutions: Map<string, string>) => {
        try {
            // 1. Write resolved files
            for (const [filepath, content] of resolutions.entries()) {
                await gitApi.writeFile(filepath, content);
            }

            // 2. Stage them
            const filesToStage = Array.from(resolutions.keys());
            await gitApi.stageFiles(filesToStage);

            // 3. Continue rebase
            // We pass a dummy hash because continueRebase doesn't need it, 
            // but rebaseMutation expects an argument.
            rebaseMutation.mutate('continue');

        } catch (error: any) {
            addToast('error', `Failed to resolve: ${error.message}`);
        }
    };

    if (conflicts.length > 0) {
        return (
            <ConflictResolver
                conflicts={conflicts}
                onResolve={handleResolveConflicts}
                onAbort={() => abortRebaseMutation.mutate()}
                addToast={addToast}
            />
        );
    }

    return (
        <div className="commit-details">
            {/* Workflow Steps Indicator */}
            {isEditMode && (
                <div className="workflow-steps">
                    <div className={`workflow-step ${workflowStep === 'checkout' ? 'active' : workflowStep !== 'idle' ? 'completed' : ''}`}>
                        <div className="workflow-step-number"><span>1</span></div>
                        Checkout
                    </div>
                    <div className={`workflow-step ${workflowStep === 'editing' ? 'active' : ['rebasing', 'complete'].includes(workflowStep) ? 'completed' : ''}`}>
                        <div className="workflow-step-number"><span>2</span></div>
                        Edit Files
                    </div>
                    <div className={`workflow-step ${workflowStep === 'rebasing' ? 'active' : workflowStep === 'complete' ? 'completed' : ''}`}>
                        <div className="workflow-step-number"><span>3</span></div>
                        Rebase
                    </div>
                    <div className={`workflow-step ${workflowStep === 'complete' ? 'completed' : ''}`}>
                        <div className="workflow-step-number"><span>4</span></div>
                        Complete
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="commit-details-header">
                <h2 className="commit-details-title">{commit.message}</h2>

                <div className="commit-details-info">
                    <div className="commit-details-info-item">
                        <Hash size={14} />
                        <code style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px' }}>
                            {commit.abbreviated_hash}
                        </code>
                    </div>
                    <div className="commit-details-info-item">
                        <User size={14} />
                        <span>{commit.author_name}</span>
                    </div>
                    <div className="commit-details-info-item">
                        <Clock size={14} />
                        <span>{formatDate(commit.date)}</span>
                    </div>
                </div>

                <div className="commit-details-actions">
                    {!isEditMode ? (
                        <>
                            <button
                                className="btn btn-primary"
                                onClick={handleStartEdit}
                                disabled={repoInfo.is_detached}
                            >
                                <Edit3 size={16} />
                                Edit This Commit
                            </button>
                            {repoInfo.is_detached && (
                                <span style={{ fontSize: '12px', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <AlertTriangle size={14} />
                                    Cannot edit while in detached HEAD
                                </span>
                            )}

                            {/* Force Push Button (Visible when NOT editing) */}
                            <button
                                className="btn btn-danger"
                                onClick={() => setShowForcePush(true)}
                                disabled={repoInfo.is_detached}
                                style={{ marginLeft: 'auto' }}
                            >
                                <Upload size={16} />
                                Force Push
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="btn btn-secondary"
                                onClick={handleCancelEdit}
                                disabled={checkoutMutation.isPending || rebaseMutation.isPending}
                            >
                                <RotateCcw size={16} />
                                Cancel
                            </button>
                            {workflowStep === 'editing' && (
                                <span style={{ fontSize: '12px', color: 'var(--color-info)' }}>
                                    Click on a file below to edit it
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Files List */}
            <div className="commit-details-content">
                <div className="file-tree">
                    {files.length === 0 ? (
                        <div style={{ padding: '16px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                            No files in this commit
                        </div>
                    ) : (
                        files.map((file) => {
                            const Icon = statusIcons[file.status];
                            return (
                                <div
                                    key={file.filepath}
                                    className="file-item"
                                    onClick={() => onSelectFile(file)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && onSelectFile(file)}
                                >
                                    <Icon
                                        size={16}
                                        className={`file-icon ${file.status}`}
                                    />
                                    <span className="file-name" title={file.filepath}>
                                        {file.filepath}
                                    </span>
                                    <span className={`file-status ${file.status}`}>
                                        {statusLabels[file.status]}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Full commit hash */}
                <div style={{ marginTop: '24px', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>
                        Full Commit Hash
                    </div>
                    <code style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '12px',
                        color: 'var(--color-text-secondary)',
                        wordBreak: 'break-all',
                    }}>
                        {commit.hash}
                    </code>
                </div>
            </div>

            {/* Force Push Modal */}
            {showForcePush && (
                <ForcePushModal
                    branch={repoInfo.current_branch}
                    remote="origin"
                    onConfirm={() => forcePushMutation.mutate()}
                    onCancel={() => setShowForcePush(false)}
                    isLoading={forcePushMutation.isPending}
                />
            )}
        </div>
    );
}
