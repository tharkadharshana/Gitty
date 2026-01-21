import { memo } from 'react';
import { GitCommit, Clock, User } from 'lucide-react';
import type { CommitInfo } from '../types';

interface CommitListProps {
    commits: CommitInfo[];
    selectedCommit: CommitInfo | null;
    onSelectCommit: (commit: CommitInfo) => void;
    isLoading: boolean;
    currentBranch?: string;
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}

const CommitItem = memo(function CommitItem({
    commit,
    isSelected,
    isHead,
    onClick,
}: {
    commit: CommitInfo;
    isSelected: boolean;
    isHead: boolean;
    onClick: () => void;
}) {
    return (
        <div
            className={`commit-item ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
        >
            <div className={`commit-node ${isHead ? 'head' : ''}`} />
            <div className="commit-content">
                <div className="commit-message" title={commit.message}>
                    {commit.message}
                </div>
                <div className="commit-meta">
                    <span className="commit-hash">{commit.abbreviated_hash}</span>
                    <span className="commit-author">
                        {commit.author_name}
                    </span>
                    <span className="commit-date">
                        {formatDate(commit.date)}
                    </span>
                </div>
                {commit.refs && (
                    <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {commit.refs.split(', ').map((ref, i) => (
                            <span
                                key={i}
                                style={{
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    background: ref.includes('HEAD')
                                        ? 'var(--color-success-subtle)'
                                        : 'var(--color-info-subtle)',
                                    color: ref.includes('HEAD')
                                        ? 'var(--color-success)'
                                        : 'var(--color-info)',
                                    borderRadius: '4px',
                                    fontWeight: 500,
                                }}
                            >
                                {ref}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

export function CommitList({
    commits,
    selectedCommit,
    onSelectCommit,
    isLoading,
    currentBranch,
}: CommitListProps) {
    if (isLoading) {
        return (
            <div className="commit-list" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    if (commits.length === 0) {
        return (
            <div className="commit-list">
                <div className="empty-state" style={{ padding: '24px' }}>
                    <GitCommit className="empty-state-icon" style={{ width: 40, height: 40 }} />
                    <h3 className="empty-state-title" style={{ fontSize: '14px' }}>No commits</h3>
                    <p className="empty-state-description" style={{ fontSize: '12px' }}>
                        Open a repository to see commits
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="commit-list">
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--color-border-primary)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
            }}>
                Commits ({commits.length})
            </div>
            {commits.map((commit, index) => (
                <CommitItem
                    key={commit.hash}
                    commit={commit}
                    isSelected={selectedCommit?.hash === commit.hash}
                    isHead={index === 0}
                    onClick={() => onSelectCommit(commit)}
                />
            ))}
        </div>
    );
}
