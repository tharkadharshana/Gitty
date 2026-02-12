import React from 'react';
import { X } from 'lucide-react';

interface SettingsModalProps {
    onClose: () => void;
    logPath: string | null;
    appVersion: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, logPath, appVersion }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>Settings & Debug Info</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="setting-group">
                        <h3>Application Info</h3>
                        <p><strong>Version:</strong> {appVersion}</p>
                    </div>

                    <div className="setting-group" style={{ marginTop: '20px' }}>
                        <h3>Debug Logs</h3>
                        <p className="text-sm text-muted">
                            If you encounter issues, please check the log file located at:
                        </p>

                        {logPath ? (
                            <div style={{
                                background: '#1e242a',
                                padding: '10px',
                                borderRadius: '6px',
                                marginTop: '10px',
                                wordBreak: 'break-all',
                                fontFamily: 'monospace',
                                border: '1px solid #30363d'
                            }}>
                                {logPath}
                            </div>
                        ) : (
                            <p style={{ fontStyle: 'italic', color: '#8b949e' }}>
                                Log path not available (are you running in Electron mode?)
                            </p>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};
