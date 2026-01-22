import { useState } from 'react';
import { FolderOpen, X, ChevronLeft, Folder, ChevronRight, HardDrive } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { gitApi } from '../services/api';

interface OpenRepoModalProps {
    onOpen: (path: string) => void;
    onClose: () => void;
    isLoading: boolean;
}

export function OpenRepoModal({ onOpen, onClose, isLoading }: OpenRepoModalProps) {
    const [path, setPath] = useState('');
    const [browserPath, setBrowserPath] = useState<string>('.');

    const { data: browseData, isLoading: isBrowsing, error: browseError } = useQuery({
        queryKey: ['browse', browserPath],
        queryFn: () => gitApi.browseFolders(browserPath),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (path.trim()) {
            onOpen(path.trim());
        }
    };

    const handleFolderClick = (folderPath: string) => {
        setBrowserPath(folderPath);
        setPath(folderPath);
    };

    const handleSelectFolder = (folderPath: string) => {
        setPath(folderPath);
    };

    const handleGoBack = () => {
        if (browseData?.parentPath) {
            setBrowserPath(browseData.parentPath);
            setPath(browseData.parentPath);
        }
    };

    const handleDriveChange = (drive: string) => {
        setBrowserPath(drive + '\\');
        setPath(drive + '\\');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
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
                        {/* Selected Path Input */}
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
                                placeholder="Enter or select the path..."
                                value={path}
                                onChange={(e) => setPath(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {/* Drive & Path Toolbar */}
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '12px',
                            alignItems: 'center'
                        }}>
                            {browseData?.drives && browseData.drives.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <HardDrive size={14} className="text-muted" />
                                    <select
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '2px 8px', height: '32px', appearance: 'auto' }}
                                        onChange={(e) => handleDriveChange(e.target.value)}
                                        value={browseData.currentPath.substring(0, 2).toUpperCase()}
                                    >
                                        {browseData.drives.map(drive => (
                                            <option key={drive} value={drive}>{drive}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div className="file-explorer-header" style={{ borderRadius: '6px' }}>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-icon btn-sm"
                                        onClick={handleGoBack}
                                        disabled={!browseData?.parentPath || isBrowsing}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <div className="file-explorer-current-path" title={browseData?.currentPath}>
                                        {isBrowsing ? 'Loading...' : browseData?.currentPath}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Explorer List */}
                        <div className="file-explorer" style={{ maxHeight: '350px', marginTop: 0 }}>
                            <div className="file-explorer-list">
                                {isBrowsing ? (
                                    <div className="file-explorer-empty">
                                        <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
                                        Scanning directory...
                                    </div>
                                ) : browseError ? (
                                    <div className="file-explorer-empty" style={{ color: 'var(--color-danger)' }}>
                                        Failed to list directory contents.
                                    </div>
                                ) : browseData?.folders.length === 0 ? (
                                    <div className="file-explorer-empty">
                                        No folders found in this directory.
                                    </div>
                                ) : (
                                    browseData?.folders.map((folder) => (
                                        <div
                                            key={folder.path}
                                            className={`file-explorer-item ${path === folder.path ? 'selected' : ''} ${folder.isRepo ? 'repo' : ''}`}
                                            onClick={() => handleSelectFolder(folder.path)}
                                            onDoubleClick={() => handleFolderClick(folder.path)}
                                        >
                                            <Folder size={16} fill={folder.isRepo ? 'currentColor' : 'none'} />
                                            <div className="file-explorer-item-name">
                                                {folder.name}
                                            </div>
                                            {folder.isRepo && <span className="repo-badge">Git Repo</span>}
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-icon btn-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFolderClick(folder.path);
                                                }}
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <p style={{
                            marginTop: '12px',
                            fontSize: '11px',
                            color: 'var(--color-text-tertiary)',
                            textAlign: 'center'
                        }}>
                            Double-click a folder to enter, single-click to select.
                        </p>
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
                                    Open Repository
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
