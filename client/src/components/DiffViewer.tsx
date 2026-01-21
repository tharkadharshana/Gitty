import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    ArrowLeft,
    Save,
    RotateCcw,

    AlertTriangle,
    Columns,
    Rows,

} from 'lucide-react';
import { gitApi } from '../services/api';
import type { CommitInfo, FileChange, RepoInfo, DiffResult } from '../types';
import type { ToastType } from './Toast';

interface DiffViewerProps {
    commit: CommitInfo;
    file: FileChange;
    repoInfo: RepoInfo;
    onBack: () => void;
    onUpdate: () => void;
    addToast: (type: ToastType, message: string) => void;
}

type ViewMode = 'split' | 'unified';

export function DiffViewer({
    commit,
    file,
    repoInfo,
    onBack,
    onUpdate,
    addToast,
}: DiffViewerProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('split');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [originalBranch] = useState(repoInfo.current_branch);

    // Fetch diff data
    const { data: diffData, isLoading } = useQuery<DiffResult>({
        queryKey: ['diff', commit.hash, file.filepath],
        queryFn: () => gitApi.getFileDiff(commit.hash, file.filepath),
    });

    useEffect(() => {
        if (diffData) {
            setEditedContent(diffData.new_content);
        }
    }, [diffData]);

    // Mutation for saving changes
    const saveMutation = useMutation({
        mutationFn: async () => {
            // 1. Write the file
            await gitApi.writeFile(file.filepath, editedContent);

            // 2. Stage the file
            await gitApi.stageFiles([file.filepath]);

            // 3. Amend the commit
            const amendResult = await gitApi.amendCommit();

            if (!amendResult.success) {
                throw new Error(amendResult.message);
            }

            const newHash = amendResult.data?.new_hash as string;

            // 4. Rebase onto new commit
            const rebaseResult = await gitApi.rebaseOnto(newHash, commit.hash, originalBranch);

            if (!rebaseResult.success) {
                throw new Error(rebaseResult.message);
            }

            return { newHash };
        },
        onSuccess: () => {
            addToast('success', 'Commit successfully amended and history rewritten!');
            setIsEditing(false);
            onUpdate();
        },
        onError: (error: Error) => {
            addToast('error', `Failed to save: ${error.message}`);
        },
    });

    // Start editing mode (checkout commit first)
    const startEditMutation = useMutation({
        mutationFn: () => gitApi.checkoutCommit(commit.hash),
        onSuccess: () => {
            setIsEditing(true);
            addToast('info', 'Editing mode enabled. Make your changes and save.');
        },
        onError: (error: Error) => {
            addToast('error', `Failed to checkout: ${error.message}`);
        },
    });

    // Cancel editing
    const cancelMutation = useMutation({
        mutationFn: () => gitApi.checkoutBranch(originalBranch),
        onSuccess: () => {
            setIsEditing(false);
            if (diffData) {
                setEditedContent(diffData.new_content);
            }
            addToast('info', 'Changes discarded.');
        },
        onError: (error: Error) => {
            addToast('error', `Failed to cancel: ${error.message}`);
        },
    });

    const handleStartEdit = () => {
        if (repoInfo.is_detached) {
            // Already checked out, just enable editing
            setIsEditing(true);
        } else {
            startEditMutation.mutate();
        }
    };

    const handleCancel = () => {
        cancelMutation.mutate();
    };

    const handleSave = () => {
        saveMutation.mutate();
    };

    const hasChanges = diffData && editedContent !== diffData.new_content;

    if (isLoading) {
        return (
            <div className="diff-viewer" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="diff-viewer">
            {/* Header */}
            <div className="diff-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button className="btn btn-ghost btn-icon" onClick={onBack}>
                        <ArrowLeft size={18} />
                    </button>
                    <span className="diff-filename">{file.filepath}</span>
                    <span className={`file-status ${file.status}`} style={{ marginLeft: '8px' }}>
                        {file.status}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* View mode toggle */}
                    <div className="diff-toggle">
                        <button
                            className={`diff-toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
                            onClick={() => setViewMode('split')}
                        >
                            <Columns size={14} />
                        </button>
                        <button
                            className={`diff-toggle-btn ${viewMode === 'unified' ? 'active' : ''}`}
                            onClick={() => setViewMode('unified')}
                        >
                            <Rows size={14} />
                        </button>
                    </div>

                    {/* Edit actions */}
                    {!isEditing ? (
                        <button
                            className="btn btn-primary"
                            onClick={handleStartEdit}
                            disabled={startEditMutation.isPending || file.status === 'deleted'}
                        >
                            Edit File
                        </button>
                    ) : (
                        <>
                            <button
                                className="btn btn-secondary"
                                onClick={handleCancel}
                                disabled={saveMutation.isPending || cancelMutation.isPending}
                            >
                                <RotateCcw size={14} />
                                Cancel
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={handleSave}
                                disabled={!hasChanges || saveMutation.isPending}
                            >
                                {saveMutation.isPending ? (
                                    <div className="loading-spinner" style={{ width: 14, height: 14 }} />
                                ) : (
                                    <Save size={14} />
                                )}
                                Save & Amend
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Warning banner when editing */}
            {isEditing && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: 'var(--color-warning-subtle)',
                    borderBottom: '1px solid var(--color-warning)',
                    fontSize: '13px',
                    color: 'var(--color-warning)',
                }}>
                    <AlertTriangle size={16} />
                    <span>
                        You are editing <strong>{commit.abbreviated_hash}</strong>.
                        Saving will amend this commit and rebase all subsequent commits.
                    </span>
                </div>
            )}

            {/* Diff Content */}
            <div className="diff-content">
                {viewMode === 'split' ? (
                    <div className="diff-split">
                        {/* Before (Old Content) */}
                        <div className="diff-pane">
                            <div className="diff-pane-header">
                                Before (Parent)
                            </div>
                            <div className="diff-code">
                                {(diffData?.old_content || '').split('\n').map((line, i) => (
                                    <div key={i} className="diff-line">
                                        <div className="diff-line-number">{i + 1}</div>
                                        <div className="diff-line-content">{line}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* After (New/Edited Content) */}
                        <div className="diff-pane">
                            <div className="diff-pane-header">
                                {isEditing ? 'Editing' : 'After (This Commit)'}
                            </div>
                            {isEditing ? (
                                <textarea
                                    className="editor-textarea"
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    spellCheck={false}
                                />
                            ) : (
                                <div className="diff-code">
                                    {(diffData?.new_content || '').split('\n').map((line, i) => (
                                        <div key={i} className="diff-line">
                                            <div className="diff-line-number">{i + 1}</div>
                                            <div className="diff-line-content">{line}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Unified diff view */
                    <div className="diff-code" style={{ padding: '8px 0' }}>
                        {diffData?.hunks.map((hunk, hunkIndex) => (
                            <div key={hunkIndex}>
                                <div style={{
                                    padding: '4px 16px',
                                    background: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text-tertiary)',
                                    fontFamily: 'var(--font-family-mono)',
                                    fontSize: '12px',
                                }}>
                                    @@ -{hunk.old_start},{hunk.old_lines} +{hunk.new_start},{hunk.new_lines} @@
                                </div>
                                {hunk.lines.map((line, lineIndex) => (
                                    <div
                                        key={lineIndex}
                                        className={`diff-line ${line.type === 'add' ? 'added' : line.type === 'remove' ? 'removed' : ''}`}
                                    >
                                        <div className="diff-line-number" style={{ width: '80px' }}>
                                            {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                                        </div>
                                        <div className="diff-line-content">{line.content}</div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
