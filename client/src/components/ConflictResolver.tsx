import { useState } from 'react';
import {
    AlertTriangle,
    Check,
    X,
    ArrowLeft,
    ArrowRight,
    RefreshCw,
} from 'lucide-react';
import type { ConflictInfo } from '../types';
import type { ToastType } from './Toast';

interface ConflictResolverProps {
    conflicts: ConflictInfo[];
    onResolve: (resolutions: Map<string, string>) => void;
    onAbort: () => void;
    addToast: (type: ToastType, message: string) => void;
}

export function ConflictResolver({
    conflicts,
    onResolve,
    onAbort,
    addToast,
}: ConflictResolverProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [resolutions, setResolutions] = useState<Map<string, string>>(new Map());
    const [mergedContent, setMergedContent] = useState('');

    const currentConflict = conflicts[currentIndex];
    const isResolved = resolutions.has(currentConflict?.filepath);
    const allResolved = conflicts.every((c) => resolutions.has(c.filepath));

    const handleUseOurs = () => {
        if (currentConflict) {
            setMergedContent(currentConflict.ours_content);
            const newResolutions = new Map(resolutions);
            newResolutions.set(currentConflict.filepath, currentConflict.ours_content);
            setResolutions(newResolutions);
            addToast('info', `Using "ours" version for ${currentConflict.filepath}`);
        }
    };

    const handleUseTheirs = () => {
        if (currentConflict) {
            setMergedContent(currentConflict.theirs_content);
            const newResolutions = new Map(resolutions);
            newResolutions.set(currentConflict.filepath, currentConflict.theirs_content);
            setResolutions(newResolutions);
            addToast('info', `Using "theirs" version for ${currentConflict.filepath}`);
        }
    };

    const handleSaveResolution = () => {
        if (currentConflict && mergedContent) {
            const newResolutions = new Map(resolutions);
            newResolutions.set(currentConflict.filepath, mergedContent);
            setResolutions(newResolutions);
            addToast('success', `Resolved ${currentConflict.filepath}`);
        }
    };

    const handleNext = () => {
        if (currentIndex < conflicts.length - 1) {
            setCurrentIndex(currentIndex + 1);
            const nextConflict = conflicts[currentIndex + 1];
            setMergedContent(resolutions.get(nextConflict.filepath) || '');
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            const prevConflict = conflicts[currentIndex - 1];
            setMergedContent(resolutions.get(prevConflict.filepath) || '');
        }
    };

    const handleComplete = () => {
        if (allResolved) {
            onResolve(resolutions);
        }
    };

    if (conflicts.length === 0) {
        return (
            <div className="empty-state">
                <Check className="empty-state-icon" style={{ color: 'var(--color-success)' }} />
                <h2 className="empty-state-title">No Conflicts</h2>
                <p className="empty-state-description">All changes merged successfully!</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                background: 'var(--color-warning-subtle)',
                borderBottom: '1px solid var(--color-warning)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>
                        Conflict Resolution Required
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        ({currentIndex + 1} of {conflicts.length})
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={onAbort}>
                        <X size={14} />
                        Abort Rebase
                    </button>
                    <button
                        className="btn btn-success btn-sm"
                        onClick={handleComplete}
                        disabled={!allResolved}
                    >
                        <Check size={14} />
                        Complete Resolution
                    </button>
                </div>
            </div>

            {/* File Navigation */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 20px',
                background: 'var(--color-bg-secondary)',
                borderBottom: '1px solid var(--color-border-primary)',
            }}>
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                >
                    <ArrowLeft size={14} />
                    Previous
                </button>

                <div style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <span>{currentConflict?.filepath}</span>
                    {isResolved && (
                        <span style={{
                            padding: '2px 8px',
                            background: 'var(--color-success-subtle)',
                            color: 'var(--color-success)',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 500,
                        }}>
                            RESOLVED
                        </span>
                    )}
                </div>

                <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleNext}
                    disabled={currentIndex === conflicts.length - 1}
                >
                    Next
                    <ArrowRight size={14} />
                </button>
            </div>

            {/* Quick Actions */}
            <div style={{
                display: 'flex',
                gap: '8px',
                padding: '12px 20px',
                background: 'var(--color-bg-tertiary)',
                borderBottom: '1px solid var(--color-border-primary)',
            }}>
                <button className="btn btn-secondary btn-sm" onClick={handleUseOurs}>
                    Use Ours
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleUseTheirs}>
                    Use Theirs
                </button>
                <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveResolution}
                    disabled={!mergedContent}
                >
                    <Check size={14} />
                    Save Resolution
                </button>
            </div>

            {/* Conflict Content */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', overflow: 'hidden' }}>
                {/* Ours */}
                <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border-primary)' }}>
                    <div style={{
                        padding: '8px 16px',
                        background: 'var(--color-success-subtle)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--color-success)',
                    }}>
                        OURS (Current Branch)
                    </div>
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: '12px',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '12px',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                    }}>
                        {currentConflict?.ours_content}
                    </div>
                </div>

                {/* Merged Result */}
                <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border-primary)' }}>
                    <div style={{
                        padding: '8px 16px',
                        background: 'var(--color-info-subtle)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--color-info)',
                    }}>
                        RESOLVED (Edit Below)
                    </div>
                    <textarea
                        value={mergedContent}
                        onChange={(e) => setMergedContent(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '12px',
                            fontFamily: 'var(--font-family-mono)',
                            fontSize: '12px',
                            lineHeight: 1.6,
                            background: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            border: 'none',
                            resize: 'none',
                        }}
                        placeholder="Edit the merged content here..."
                    />
                </div>

                {/* Theirs */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        padding: '8px 16px',
                        background: 'var(--color-warning-subtle)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--color-warning)',
                    }}>
                        THEIRS (Incoming Changes)
                    </div>
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: '12px',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: '12px',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                    }}>
                        {currentConflict?.theirs_content}
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div style={{
                padding: '12px 20px',
                background: 'var(--color-bg-secondary)',
                borderTop: '1px solid var(--color-border-primary)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Resolution Progress</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>
                        {resolutions.size} / {conflicts.length} files resolved
                    </span>
                </div>
                <div style={{
                    height: '4px',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        width: `${(resolutions.size / conflicts.length) * 100}%`,
                        height: '100%',
                        background: 'var(--gradient-success)',
                        transition: 'width 0.3s ease',
                    }} />
                </div>
            </div>
        </div>
    );
}
