import { useState } from 'react';
import { AlertTriangle, Upload, X } from 'lucide-react';

interface ForcePushModalProps {
    branch: string;
    remote: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

export function ForcePushModal({
    branch,
    remote,
    onConfirm,
    onCancel,
    isLoading,
}: ForcePushModalProps) {
    const [confirmText, setConfirmText] = useState('');
    const expectedText = branch;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header" style={{ borderColor: 'var(--color-danger)' }}>
                    <h2 className="modal-title" style={{ color: 'var(--color-danger)' }}>
                        <AlertTriangle size={20} style={{ marginRight: '8px' }} />
                        Force Push Warning
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={onCancel}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    <div style={{
                        padding: '16px',
                        background: 'var(--color-danger-subtle)',
                        borderRadius: '8px',
                        marginBottom: '20px',
                    }}>
                        <p style={{ color: 'var(--color-danger)', fontSize: '14px', fontWeight: 500 }}>
                            ⚠️ This action will OVERWRITE history on the remote repository!
                        </p>
                        <ul style={{
                            marginTop: '12px',
                            marginLeft: '20px',
                            fontSize: '13px',
                            color: 'var(--color-text-secondary)',
                            lineHeight: 1.6,
                        }}>
                            <li>Other collaborators may lose their work</li>
                            <li>This cannot be undone easily</li>
                            <li>Make sure everyone on your team is aware</li>
                        </ul>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                            <strong>Remote:</strong>{' '}
                            <code style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-info)' }}>
                                {remote}
                            </code>
                        </div>
                        <div style={{ fontSize: '13px' }}>
                            <strong>Branch:</strong>{' '}
                            <code style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--color-warning)' }}>
                                {branch}
                            </code>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="confirm-text"
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '13px',
                                color: 'var(--color-text-secondary)',
                            }}
                        >
                            Type <strong style={{ color: 'var(--color-text-primary)' }}>{expectedText}</strong> to confirm:
                        </label>
                        <input
                            id="confirm-text"
                            type="text"
                            className="input input-mono"
                            placeholder={expectedText}
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={onConfirm}
                        disabled={confirmText !== expectedText || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="loading-spinner" style={{ width: 14, height: 14 }} />
                                Pushing...
                            </>
                        ) : (
                            <>
                                <Upload size={14} />
                                Force Push
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
