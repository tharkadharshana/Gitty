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
import type { CommitInfo, FileChange, RepoInfo } from '../types';
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
            return gitApi.rebaseOnto(newHash, commit.hash, repoInfo.current_branch);
        },
        onSuccess: () => {
            setWorkflowStep('complete');
            addToast('success', 'History successfully rewritten!');
            onUpdate();
        },
        onError: (error: Error) => {
            addToast('error', `Rebase failed: ${error.message}`);
        },
    });

    const handleStartEdit = () => {
        setEditMode(true);
        setWorkflowStep('checkout');
        checkoutMutation.mutate();
    };

    const handleCancelEdit = async () => {
        try {
            await gitApi.checkoutBranch(repoInfo.current_branch);
            setEditMode(false);
            setWorkflowStep('idle');
            addToast('info', 'Edit cancelled, returned to branch.');
        } catch (error: any) {
            addToast('error', `Failed to return to branch: ${error.message}`);
        }
    };

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
                    <div className="file-tree-header">
                        Files Changed ({files.length})
                    </div>

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

                {/* Parent commits */}
                {commit.parent_hashes.length > 0 && (
                    <div style={{ marginTop: '16px', padding: '16px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>
                            Parent Commit{commit.parent_hashes.length > 1 ? 's' : ''}
                        </div>
                        {commit.parent_hashes.map((hash, i) => (
                            <code key={i} style={{
                                display: 'block',
                                fontFamily: 'var(--font-family-mono)',
                                fontSize: '12px',
                                color: 'var(--color-info)',
                                marginTop: i > 0 ? '4px' : 0,
                            }}>
                                {hash.substring(0, 7)}
                            </code>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
