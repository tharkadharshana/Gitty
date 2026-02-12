import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FolderOpen,
    RefreshCw,
    Settings,
    Upload,
} from 'lucide-react';
import { gitApi } from './services/api';
import { CommitList } from './components/CommitList';
import { CommitDetails } from './components/CommitDetails';
import { DiffViewer } from './components/DiffViewer';
import { OpenRepoModal } from './components/OpenRepoModal';
import { BranchSelector } from './components/BranchSelector';
import { Toast, ToastContainer, useToast } from './components/Toast';
import UpdateNotification from './components/UpdateNotification';
import { SettingsModal } from './components/SettingsModal';
import type { CommitInfo, FileChange, RepoInfo } from './types';

function App() {
    const queryClient = useQueryClient();
    const { toasts, addToast, removeToast } = useToast();

    const [isOpenModalVisible, setOpenModalVisible] = useState(false);
    const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
    const [selectedCommit, setSelectedCommit] = useState<CommitInfo | null>(null);
    const [selectedFile, setSelectedFile] = useState<FileChange | null>(null);
    const [logPath, setLogPath] = useState<string | null>(null);

    // Sidebar resizing
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = e.clientX;
            if (newWidth > 200 && newWidth < 600) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    // Listen for log path from Electron
    useEffect(() => {
        if ((window as any).electron) {
            (window as any).electron.onLogPath((_event: any, path: string) => {
                console.log('Log path received:', path);
                setLogPath(path);
            });
        }
    }, []);

    // Query for repository info
    const { data: repoInfo, refetch: refetchRepoInfo } = useQuery<RepoInfo>({
        queryKey: ['repoInfo'],
        queryFn: () => gitApi.getRepoInfo(),
        retry: false,
    });

    // Query for commits
    const { data: commits, isLoading: isLoadingCommits, refetch: refetchCommits } = useQuery<CommitInfo[]>({
        queryKey: ['commits'],
        queryFn: () => gitApi.getCommits(100),
        enabled: !!repoInfo,
    });

    // Query for files in selected commit
    const { data: commitFiles } = useQuery<FileChange[]>({
        queryKey: ['commitFiles', selectedCommit?.hash],
        queryFn: () => gitApi.getCommitFiles(selectedCommit!.hash),
        enabled: !!selectedCommit,
    });

    // Mutation for opening repository
    const openRepoMutation = useMutation({
        mutationFn: (path: string) => gitApi.openRepository(path),
        onSuccess: (data) => {
            queryClient.setQueryData(['repoInfo'], data);
            queryClient.invalidateQueries({ queryKey: ['commits'] });
            addToast('success', `Opened repository: ${data.path}`);
            setOpenModalVisible(false);
        },
        onError: (error: Error) => {
            addToast('error', error.message);
        },
    });

    const handleOpenRepo = useCallback((path: string) => {
        openRepoMutation.mutate(path);
    }, [openRepoMutation]);

    const handleSelectCommit = useCallback((commit: CommitInfo) => {
        setSelectedCommit(commit);
        setSelectedFile(null);
    }, []);

    const handleSelectFile = useCallback((file: FileChange) => {
        setSelectedFile(file);
    }, []);

    const handleRefresh = useCallback(() => {
        refetchCommits();
        refetchRepoInfo();
        addToast('info', 'Refreshing commits...');
    }, [refetchCommits, refetchRepoInfo, addToast]);

    const handleCommitUpdated = useCallback(async () => {
        // First invalidate to mark stale
        queryClient.invalidateQueries({ queryKey: ['repoInfo'] });
        queryClient.invalidateQueries({ queryKey: ['commits'] });
        queryClient.invalidateQueries({ queryKey: ['branches'] });

        // Explicitly refetch repo info first so everything else dependent on it updates
        await refetchRepoInfo();

        setSelectedCommit(null);
        setSelectedFile(null);
        addToast('success', 'Commit history updated!');
    }, [queryClient, addToast, refetchRepoInfo]);

    return (
        <div className="app-layout">
            {/* Header */}
            <header className="app-header">
                <div className="logo">
                    <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
                        <defs>
                            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#58a6ff" />
                                <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                        </defs>
                        <circle cx="16" cy="16" r="14" fill="url(#logoGrad)" />
                        <path
                            d="M16 6 L16 26 M10 12 L16 6 L22 12"
                            stroke="white"
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <circle cx="16" cy="20" r="2.5" fill="white" />
                    </svg>
                    <span>Gitty</span>
                </div>

                {repoInfo ? (
                    <>
                        <div className="repo-path">
                            <FolderOpen size={14} />
                            <span>{repoInfo.path}</span>
                        </div>
                        <BranchSelector
                            repoInfo={repoInfo}
                            onBranchChange={handleCommitUpdated}
                        />
                    </>
                ) : (
                    <div className="repo-path" style={{ opacity: 0.5 }}>
                        <FolderOpen size={14} />
                        <span>No repository opened</span>
                    </div>
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    {repoInfo && (
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={handleRefresh}
                            title="Refresh"
                        >
                            <RefreshCw size={18} />
                        </button>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={() => setOpenModalVisible(true)}
                    >
                        <FolderOpen size={16} />
                        Open Repository
                    </button>
                    <button
                        className="btn btn-ghost btn-icon"
                        title="Settings"
                        onClick={() => setSettingsModalVisible(true)}
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="app-main">
                {/* Sidebar - Commit List */}
                <aside className="app-sidebar" style={{ width: `${sidebarWidth}px` }}>
                    <CommitList
                        commits={commits || []}
                        selectedCommit={selectedCommit}
                        onSelectCommit={handleSelectCommit}
                        isLoading={isLoadingCommits}
                        currentBranch={repoInfo?.current_branch}
                    />
                </aside>

                <div
                    className={`resize-handle ${isResizing ? 'resizing' : ''}`}
                    onMouseDown={startResizing}
                />

                {/* Main Content Area */}
                <div className="app-content">
                    {selectedCommit ? (
                        selectedFile ? (
                            <DiffViewer
                                commit={selectedCommit}
                                file={selectedFile}
                                repoInfo={repoInfo!}
                                onBack={() => setSelectedFile(null)}
                                onUpdate={handleCommitUpdated}
                                addToast={addToast}
                            />
                        ) : (
                            <CommitDetails
                                commit={selectedCommit}
                                files={commitFiles || []}
                                repoInfo={repoInfo!}
                                onSelectFile={handleSelectFile}
                                onUpdate={handleCommitUpdated}
                                addToast={addToast}
                            />
                        )
                    ) : (
                        <div className="empty-state">
                            <Upload className="empty-state-icon" />
                            <h2 className="empty-state-title">
                                {repoInfo ? 'Select a commit' : 'Open a repository'}
                            </h2>
                            <p className="empty-state-description">
                                {repoInfo
                                    ? 'Click on a commit in the sidebar to view its details and edit history.'
                                    : 'Click "Open Repository" to get started with editing Git history.'}
                            </p>
                            {!repoInfo && (
                                <button
                                    className="btn btn-primary btn-lg mt-4"
                                    onClick={() => setOpenModalVisible(true)}
                                >
                                    <FolderOpen size={18} />
                                    Open Repository
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            {isOpenModalVisible && (
                <OpenRepoModal
                    onOpen={handleOpenRepo}
                    onClose={() => setOpenModalVisible(false)}
                    isLoading={openRepoMutation.isPending}
                />
            )}

            {isSettingsModalVisible && (
                <SettingsModal
                    onClose={() => setSettingsModalVisible(false)}
                    logPath={logPath}
                    appVersion="1.0.0"
                />
            )}

            {/* Toast Notifications */}
            <ToastContainer>
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        type={toast.type}
                        message={toast.message}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </ToastContainer>

            {/* Electron Update Notification */}
            <UpdateNotification />
        </div>
    );
}

export default App;
