import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FolderOpen,
    RefreshCw,
    Settings,
    Upload,
    History,
    Folders,
    Code,
    Wand2
} from 'lucide-react';
import { gitApi } from './services/api';
import { CommitList } from './components/CommitList';
import { CommitDetails } from './components/CommitDetails';
import { DiffViewer } from './components/DiffViewer';
import { OpenRepoModal } from './components/OpenRepoModal';
import { SettingsModal } from './components/SettingsModal';
import { FileExplorer } from './components/FileExplorer';
import { RefactorWizard } from './components/RefactorWizard';
import { BranchSelector } from './components/BranchSelector';
import { Toast, ToastContainer, useToast } from './components/Toast';
import type { CommitInfo, FileChange, RepoInfo } from './types';

function App() {
    const queryClient = useQueryClient();
    const { toasts, addToast, removeToast } = useToast();

    const [isOpenModalVisible, setOpenModalVisible] = useState(false);
    const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
    const [selectedCommit, setSelectedCommit] = useState<CommitInfo | null>(null);
    const [selectedFile, setSelectedFile] = useState<FileChange | null>(null);

    // Workspace Mode State
    const [sidebarMode, setSidebarMode] = useState<'history' | 'workspace'>('history');
    const [workspaceFile, setWorkspaceFile] = useState<{ path: string; content: string } | null>(null);
    const [isRefactoringWorkspace, setIsRefactoringWorkspace] = useState(false);

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
        setSidebarMode('history');
    }, []);

    const handleSelectWorkspaceFile = useCallback((path: string, content: string) => {
        setWorkspaceFile({ path, content });
        setIsRefactoringWorkspace(false);
    }, []);

    const handleSelectFile = useCallback((file: FileChange) => {
        setSelectedFile(file);
    }, []);

    const handleRefresh = useCallback(() => {
        refetchCommits();
        refetchRepoInfo();
        if (sidebarMode === 'workspace') {
            // In a real app we might trigger a specific refresh for file tree,
            // but for now checking repo info handles most 'something changed' cases.
        }
        addToast('info', 'Refreshing...');
    }, [refetchCommits, refetchRepoInfo, addToast, sidebarMode]);

    const handleCommitUpdated = useCallback(async () => {
        // First invalidate to mark stale
        queryClient.invalidateQueries({ queryKey: ['repoInfo'] });
        queryClient.invalidateQueries({ queryKey: ['commits'] });
        queryClient.invalidateQueries({ queryKey: ['branches'] });

        // Explicitly refetch repo info first so everything else dependent on it updates
        await refetchRepoInfo();

        if (sidebarMode === 'history') {
            setSelectedCommit(null);
            setSelectedFile(null);
        }
        // For workspace, we might want to reload the file content if it changed,
        // but often the refactor wizard handled the update.

        addToast('success', 'Repository updated!');
    }, [queryClient, addToast, refetchRepoInfo, sidebarMode]);

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
                {/* Sidebar */}
                <aside
                    className="app-sidebar flex flex-col h-full overflow-hidden border-r border-gray-800 bg-dark"
                    style={{ width: `${sidebarWidth}px` }}
                >
                    {/* Sidebar Tabs (Segmented Control) */}
                    <div className="p-3 border-b border-gray-800">
                        <div className="flex p-1 bg-dark-darker rounded-lg border border-gray-800">
                            <button
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${sidebarMode === 'history'
                                        ? 'bg-primary/20 text-primary shadow-sm ring-1 ring-primary/50'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                    }`}
                                onClick={() => setSidebarMode('history')}
                            >
                                <History size={14} />
                                <span>History</span>
                            </button>
                            <button
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${sidebarMode === 'workspace'
                                        ? 'bg-primary/20 text-primary shadow-sm ring-1 ring-primary/50'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                    }`}
                                onClick={() => setSidebarMode('workspace')}
                            >
                                <Folders size={14} />
                                <span>Workspace</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                        {sidebarMode === 'history' ? (
                            <CommitList
                                commits={commits || []}
                                selectedCommit={selectedCommit}
                                onSelectCommit={handleSelectCommit}
                                isLoading={isLoadingCommits}
                                currentBranch={repoInfo?.current_branch}
                            />
                        ) : (
                            <FileExplorer
                                rootDir={repoInfo?.path || ''}
                                onSelectFile={handleSelectWorkspaceFile}
                                addToast={addToast}
                            />
                        )}
                    </div>
                </aside>

                <div
                    className={`resize-handle ${isResizing ? 'resizing' : ''}`}
                    onMouseDown={startResizing}
                />

                {/* Main Content Area */}
                <div className="app-content">
                    {sidebarMode === 'history' ? (
                        selectedCommit ? (
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
                                <History className="empty-state-icon" />
                                <h2 className="empty-state-title">Select a commit</h2>
                                <p className="empty-state-description">View history and manage commits</p>
                            </div>
                        )
                    ) : (
                        // Workspace Mode Content
                        workspaceFile ? (
                            isRefactoringWorkspace ? (
                                <div className="h-full flex flex-col">
                                    <div className="p-4 border-b border-gray-800 flex items-center gap-3 bg-dark-lighter">
                                        <button className="btn btn-ghost" onClick={() => setIsRefactoringWorkspace(false)}>Back</button>
                                        <h3 className="text-lg font-semibold">Refactoring: {workspaceFile.path.split(/[\\/]/).pop()}</h3>
                                    </div>
                                    <RefactorWizard
                                        filepath={workspaceFile.path}
                                        currentContent={workspaceFile.content}
                                        onClose={() => setIsRefactoringWorkspace(false)}
                                        onSuccess={handleCommitUpdated}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-dark-lighter">
                                        <div className="flex items-center gap-2">
                                            <Code size={18} className="text-primary" />
                                            <h3 className="font-semibold">{workspaceFile.path.split(/[\\/]/).pop()}</h3>
                                            <span className="text-xs text-gray truncate max-w-[300px]">{workspaceFile.path}</span>
                                        </div>
                                        <button
                                            className="btn btn-primary flex items-center gap-2"
                                            onClick={() => setIsRefactoringWorkspace(true)}
                                        >
                                            <Wand2 size={16} />
                                            AI Refactor
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-auto p-4 bg-dark">
                                        <pre className="text-sm font-mono text-gray-300 p-4 bg-dark-darker rounded border border-gray-800 overflow-x-auto">
                                            {workspaceFile.content}
                                        </pre>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="empty-state">
                                <Folders className="empty-state-icon" />
                                <h2 className="empty-state-title">Select a file</h2>
                                <p className="empty-state-description">Browse your workspace and select a file to refactor</p>
                            </div>
                        )
                    )}

                    {!repoInfo && !selectedCommit && sidebarMode === 'history' && (
                        <div className="empty-state absolute inset-0 bg-dark z-50">
                            <Upload className="empty-state-icon" />
                            <h2 className="empty-state-title">Open a repository</h2>
                            <p className="empty-state-description">Click "Open Repository" to get started.</p>
                            <button
                                className="btn btn-primary btn-lg mt-4"
                                onClick={() => setOpenModalVisible(true)}
                            >
                                <FolderOpen size={18} />
                                Open Repository
                            </button>
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
                    addToast={addToast}
                    repoPath={repoInfo?.path}
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
        </div>
    );
}

export default App;
