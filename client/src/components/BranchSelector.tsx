import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GitBranch, ChevronDown, Check, Globe, Home } from 'lucide-react';
import { gitApi } from '../services/api';
import type { BranchInfo, RepoInfo } from '../types';

interface BranchSelectorProps {
    repoInfo: RepoInfo;
    onBranchChange: () => void;
}

export function BranchSelector({ repoInfo, onBranchChange }: BranchSelectorProps) {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    const { data: branches, isLoading } = useQuery<BranchInfo[]>({
        queryKey: ['branches'],
        queryFn: () => gitApi.getBranches(),
        enabled: isOpen,
    });

    const checkoutMutation = useMutation({
        mutationFn: (branchName: string) => gitApi.checkoutBranch(branchName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            setIsOpen(false);
            onBranchChange();
        },
    });

    const handleSelectBranch = (branch: BranchInfo) => {
        if (branch.current) return;
        checkoutMutation.mutate(branch.name);
    };

    const currentBranchName = repoInfo.is_detached ? 'DETACHED' : repoInfo.current_branch;

    return (
        <div className="branch-selector">
            <button
                className={`branch-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <GitBranch size={14} className="branch-icon" />
                <span className="branch-name">{currentBranchName}</span>
                <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="branch-dropdown">
                    <div className="branch-dropdown-header">
                        Switch Branch
                    </div>
                    <div className="branch-list">
                        {isLoading ? (
                            <div className="branch-loading">
                                <div className="spinner-sm"></div>
                                Loading branches...
                            </div>
                        ) : !branches || branches.length === 0 ? (
                            <div className="branch-empty">No branches found</div>
                        ) : (
                            branches.map((branch) => {
                                const isRemote = branch.name.startsWith('remotes/');
                                const shortName = isRemote
                                    ? branch.name.replace('remotes/', '')
                                    : branch.name;

                                return (
                                    <button
                                        key={branch.name}
                                        className={`branch-item ${branch.current ? 'current' : ''}`}
                                        onClick={() => handleSelectBranch(branch)}
                                        disabled={checkoutMutation.isPending}
                                    >
                                        <div className="branch-item-icon">
                                            {isRemote ? <Globe size={12} /> : <Home size={12} />}
                                        </div>
                                        <div className="branch-item-content">
                                            <span className="branch-item-name">{shortName}</span>
                                            {branch.tracking && (
                                                <span className="branch-item-tracking">tracking {branch.tracking}</span>
                                            )}
                                        </div>
                                        {branch.current && <Check size={14} className="check-icon" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
