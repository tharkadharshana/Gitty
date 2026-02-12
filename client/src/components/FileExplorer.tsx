import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Wand2 } from 'lucide-react';
import axios from 'axios';

interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileNode[];
}

interface FileExplorerProps {
    rootDir: string;
    onSelectFile: (path: string, content: string) => void;
    addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const FileTreeNode: React.FC<{
    node: FileNode;
    depth: number;
    onSelectFile: (path: string, content: string) => void;
    addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}> = ({ node, depth, onSelectFile, addToast }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [children, setChildren] = useState<FileNode[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const toggleOpen = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'file') {
            loadContent();
            return;
        }

        if (!isOpen && children.length === 0) {
            setIsLoading(true);
            try {
                const response = await axios.get(`http://localhost:3080/api/files/tree?path=${encodeURIComponent(node.path)}`);
                setChildren(response.data.items);
                setIsOpen(true);
            } catch (error) {
                console.error('Failed to load directory:', error);
                addToast('error', `Failed to load ${node.name}`);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsOpen(!isOpen);
        }
    };

    const loadContent = async () => {
        try {
            const response = await axios.get(`http://localhost:3080/api/files/content?path=${encodeURIComponent(node.path)}`);
            onSelectFile(node.path, response.data.content);
        } catch (error) {
            console.error('Failed to load file:', error);
            addToast('error', `Failed to load ${node.name}`);
        }
    };

    const handleRefactorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        loadContent();
    };

    return (
        <div style={{ marginLeft: depth * 12 }}>
            <div
                className={`file-node ${isHovered ? 'bg-dark-lighter' : ''}`}
                onClick={toggleOpen}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                }}
            >
                <div style={{ marginRight: '4px', display: 'flex', alignItems: 'center' }}>
                    {node.type === 'directory' && (
                        node.children?.length === 0 && isLoading ? (
                            <div className="spinner-sm" style={{ width: 14, height: 14 }} />
                        ) : isOpen ? (
                            <ChevronDown size={14} className="text-gray" />
                        ) : (
                            <ChevronRight size={14} className="text-gray" />
                        )
                    )}
                </div>

                <div className="mr-2 text-primary">
                    {node.type === 'directory' ? (
                        isOpen ? <FolderOpen size={16} /> : <Folder size={16} />
                    ) : (
                        <File size={16} className="text-gray" />
                    )}
                </div>

                <span className="text-sm truncate select-none flex-1">{node.name}</span>

                {node.type === 'file' && isHovered && (
                    <button
                        className="btn btn-xs btn-ghost text-primary ml-2"
                        title="Refactor this file"
                        onClick={handleRefactorClick}
                    >
                        <Wand2 size={12} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div>
                    {children.map((child) => (
                        <FileTreeNode
                            key={child.path}
                            node={child}
                            depth={depth + 1}
                            onSelectFile={onSelectFile}
                            addToast={addToast}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ rootDir, onSelectFile, addToast }) => {
    const [rootItems, setRootItems] = useState<FileNode[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (rootDir) {
            loadRoot();
        }
    }, [rootDir]);

    const loadRoot = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`http://localhost:3080/api/files/tree?path=${encodeURIComponent(rootDir)}`);
            setRootItems(response.data.items);
        } catch (error) {
            console.error('Failed to load root:', error);
            addToast('error', 'Failed to load repository files');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center text-gray">Loading files...</div>;
    }

    return (
        <div className="file-explorer py-2">
            {rootItems.map((node) => (
                <FileTreeNode
                    key={node.path}
                    node={node}
                    depth={0}
                    onSelectFile={onSelectFile}
                    addToast={addToast}
                />
            ))}
        </div>
    );
};
