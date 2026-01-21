import { useState } from 'react';
import { FolderOpen, X } from 'lucide-react';

interface OpenRepoModalProps {
    onOpen: (path: string) => void;
    onClose: () => void;
    isLoading: boolean;
}

export function OpenRepoModal({ onOpen, onClose, isLoading }: OpenRepoModalProps) {
    const [path, setPath] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (path.trim()) {
            onOpen(path.trim());
        }
    };

    // Common repository paths for quick access
    const quickPaths = [
        { label: 'Current Directory', path: '.' },
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <FolderOpen size={20} style={{ marginRight: '8px' }} />
                        Open Repository
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div style={{ marginBottom: '16px' }}>
                            <label
                                htmlFor="repo-path"
                                style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: 'var(--color-text-secondary)',
                                }}
                            >
                                Repository Path
                            </label>
                            <input
                                id="repo-path"
                                type="text"
                                className="input input-mono"
                                placeholder="Enter the path to a Git repository..."
                                value={path}
                                onChange={(e) => setPath(e.target.value)}
                                autoFocus
                            />
                            <p style={{
                                marginTop: '8px',
                                fontSize: '12px',
                                color: 'var(--color-text-tertiary)',
                            }}>
                                Enter the full path to a Git repository folder
                            </p>
                        </div>

                        <div>
                            <div style={{
                                fontSize: '12px',
                                fontWeight: 500,
                                color: 'var(--color-text-tertiary)',
                                marginBottom: '8px',
                            }}>
                                Quick Access
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {quickPaths.map((item) => (
                                    <button
                                        key={item.path}
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setPath(item.path)}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!path.trim() || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="loading-spinner" style={{ width: 14, height: 14 }} />
                                    Opening...
                                </>
                            ) : (
                                <>
                                    <FolderOpen size={14} />
                                    Open
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
