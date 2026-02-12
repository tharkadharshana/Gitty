import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    X,
    Wand2,
    FileText,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Loader2,
    ChevronRight,
    Save
} from 'lucide-react';
import { gitApi } from '../services/api';
import type { RefactorPlan } from '../types';

interface RefactorWizardProps {
    filepath: string;
    onClose: () => void;
    onComplete: () => void;
}

type WizardStep = 'PASTE' | 'PLAN' | 'EXECUTING' | 'DONE';

export function RefactorWizard({ filepath, onClose, onComplete }: RefactorWizardProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState<WizardStep>('PASTE');
    const [targetContent, setTargetContent] = useState('');
    const [plan, setPlan] = useState<RefactorPlan | null>(null);
    const [executingIndex, setExecutingIndex] = useState(-1);
    const [error, setError] = useState<string | null>(null);

    // Analysis Mutation
    const analyzeMutation = useMutation({
        mutationFn: () => gitApi.analyzeRefactor(filepath, targetContent),
        onSuccess: (data) => {
            setPlan(data);
            setStep('PLAN');
        },
        onError: (err: Error) => {
            setError(`Analysis failed: ${err.message}`);
        }
    });

    const handleAnalyze = () => {
        if (!targetContent.trim()) return;
        analyzeMutation.mutate();
    };

    const handleExecute = async () => {
        if (!plan) return;
        setStep('EXECUTING');
        setError(null);

        try {
            for (let i = 0; i < plan.commits.length; i++) {
                setExecutingIndex(i);
                const commit = plan.commits[i];

                // 1. Write state
                await gitApi.writeFile(filepath, commit.changes);

                // 2. Stage
                await gitApi.stageFiles([filepath]);

                // 3. Commit
                await gitApi.amendCommit(commit.message);

                // Wait a tiny bit for visual feedback
                await new Promise(r => setTimeout(r, 400));
            }

            setStep('DONE');
            queryClient.invalidateQueries({ queryKey: ['commits'] });
            queryClient.invalidateQueries({ queryKey: ['repoInfo'] });
        } catch (err: any) {
            setError(`Execution failed at step ${executingIndex + 1}: ${err.message}`);
            setStep('PLAN');
        }
    };

    const handleUpdateCommitMessage = (id: string, newMessage: string) => {
        if (!plan) return;
        const newCommits = plan.commits.map(c =>
            c.id === id ? { ...c, message: newMessage } : c
        );
        setPlan({ ...plan, commits: newCommits });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '800px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        <Wand2 size={20} className="text-primary" style={{ marginRight: '8px' }} />
                        AI-Assisted Refactor: {filepath.split('/').pop()}
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Step 1: Paste Content */}
                    {step === 'PASTE' && (
                        <div className="flex-col gap-4">
                            <div className="alert alert-info">
                                <FileText size={16} />
                                <div>
                                    <strong>How it works:</strong> Paste the final refactored version of your file.
                                    Gitty will analyze the changes and suggest how to split them into logical commits.
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="input-label">Pasted Target Content</label>
                                <textarea
                                    className="input input-mono"
                                    style={{ height: '400px', resize: 'none', fontSize: '12px' }}
                                    placeholder="Paste the new version of your file here..."
                                    value={targetContent}
                                    onChange={(e) => setTargetContent(e.target.value)}
                                />
                            </div>

                            <div className="modal-footer" style={{ padding: '0', marginTop: '16px' }}>
                                <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleAnalyze}
                                    disabled={!targetContent.trim() || analyzeMutation.isPending}
                                >
                                    {analyzeMutation.isPending ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <ArrowRight size={16} />
                                    )}
                                    Analyze Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Plan Review */}
                    {step === 'PLAN' && plan && (
                        <div className="flex-col gap-4">
                            <div className={`alert ${plan.commits[0]?.id.startsWith('ai') ? 'alert-primary' : 'alert-success'}`}>
                                {plan.commits[0]?.id.startsWith('ai') ? <Wand2 size={16} /> : <CheckCircle2 size={16} />}
                                <div>
                                    {plan.commits[0]?.id.startsWith('ai')
                                        ? <><strong>AI Analysis complete!</strong> Gemini has suggested logical split points for your changes.</>
                                        : <><strong>Analysis complete!</strong> We've used structural heuristics to suggest <strong>{plan.commits.length}</strong> commits.</>
                                    }
                                </div>
                            </div>

                            <div className="refactor-plan-list">
                                {plan.commits.map((commit, index) => (
                                    <div key={commit.id} className="refactor-plan-item">
                                        <div className="refactor-plan-number">{index + 1}</div>
                                        <div className="refactor-plan-content">
                                            <input
                                                type="text"
                                                className="input input-sm"
                                                value={commit.message}
                                                onChange={(e) => handleUpdateCommitMessage(commit.id, e.target.value)}
                                                placeholder="Commit message..."
                                            />
                                            <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>
                                                {index === plan.commits.length - 1 ? 'Finalizes the refactor' : 'Intermediate logical step'}
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-muted" />
                                    </div>
                                ))}
                            </div>

                            {error && (
                                <div className="alert alert-danger">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div className="modal-footer" style={{ padding: '0', marginTop: '16px' }}>
                                <button className="btn btn-secondary" onClick={() => setStep('PASTE')}>Back</button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleExecute}
                                    disabled={step !== 'PLAN'}
                                >
                                    <Save size={16} />
                                    Apply All Commits
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Executing */}
                    {step === 'EXECUTING' && (
                        <div className="flex-col items-center justify-center py-12 gap-6">
                            <div className="loading-spinner-large" />
                            <div className="text-center">
                                <h3 className="text-lg font-bold">Applying Refactor Sequence...</h3>
                                <p className="text-muted">Committing changes byte by byte to ensure a clean history.</p>
                            </div>
                            <div className="w-full max-w-md bg-tertiary rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-500"
                                    style={{ width: `${(executingIndex + 1) / (plan?.commits.length || 1) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Done */}
                    {step === 'DONE' && (
                        <div className="flex-col items-center justify-center py-12 gap-6">
                            <div className="text-success">
                                <CheckCircle2 size={64} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold">Refactor Complete!</h3>
                                <p className="text-muted">The file has been successfully refactored into {plan?.commits.length} logical commits.</p>
                            </div>
                            <div className="modal-footer" style={{ padding: '0' }}>
                                <button className="btn btn-primary btn-lg" onClick={onComplete}>
                                    Great! Return to History
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .refactor-plan-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    max-height: 400px;
                    overflow-y: auto;
                    padding-right: 8px;
                }
                .refactor-plan-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px;
                    background: var(--color-bg-secondary);
                    border: 1px solid var(--color-border-primary);
                    border-radius: var(--radius-md);
                }
                .refactor-plan-number {
                    width: 28px;
                    height: 28px;
                    background: var(--color-bg-tertiary);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: bold;
                    color: var(--color-text-secondary);
                    flex-shrink: 0;
                }
                .refactor-plan-content {
                    flex: 1;
                }
                .loading-spinner-large {
                    width: 48px;
                    height: 48px;
                    border: 4px solid var(--color-bg-tertiary);
                    border-top-color: var(--color-primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
