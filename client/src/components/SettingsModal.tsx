import React, { useState, useEffect } from 'react';
import { X, Save, Key, FileText, AlertTriangle } from 'lucide-react';
import axios from 'axios';

interface SettingsModalProps {
    onClose: () => void;
    addToast: (type: 'success' | 'error' | 'info', message: string) => void;
    repoPath?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, addToast, repoPath }) => {
    const [apiKey, setApiKey] = useState('');
    const [repoRules, setRepoRules] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await axios.get('http://localhost:3080/api/settings');
            const settings = response.data;
            setApiKey(settings.gemini_api_key || '');

            if (repoPath) {
                setRepoRules(settings[`repo_rules_${repoPath}`] || '');
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            addToast('error', 'Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save API Key
            await axios.post('http://localhost:3080/api/settings', {
                key: 'gemini_api_key',
                value: apiKey
            });

            // Save Rules if repo is open
            if (repoPath) {
                await axios.post('http://localhost:3080/api/settings', {
                    key: `repo_rules_${repoPath}`,
                    value: repoRules
                });
            }

            addToast('success', 'Settings saved successfully');
            onClose();
        } catch (error) {
            console.error('Failed to save settings:', error);
            addToast('error', 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ width: '600px', maxWidth: '90vw' }}>
                <div className="modal-header">
                    <h2>Application Settings</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* API Key Section */}
                    <div className="form-group mb-6">
                        <label className="form-label flex items-center gap-2">
                            <Key size={16} />
                            Gemini API Key
                        </label>
                        <input
                            type="password"
                            className="form-input"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="AIzaSy..."
                        />
                        <p className="text-sm text-gray mt-2">
                            Required for AI-Assisted Refactoring features.
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="ml-1 text-primary">
                                Get a key here
                            </a>
                        </p>
                    </div>

                    <hr className="border-gray-800 my-6" />

                    {/* Repo Rules Section */}
                    {repoPath ? (
                        <div className="form-group">
                            <label className="form-label flex items-center gap-2">
                                <FileText size={16} />
                                Repository Rules: <span className="text-xs font-mono bg-dark-lighter px-1 rounded">{repoPath}</span>
                            </label>
                            <textarea
                                className="form-input"
                                rows={6}
                                value={repoRules}
                                onChange={(e) => setRepoRules(e.target.value)}
                                placeholder="Example: Always use 'feat:', 'fix:', 'chore:' prefixes. Max 50 chars for title."
                            />
                            <p className="text-sm text-gray mt-2">
                                These instructions will be appended to the AI prompt to guide commit generation for this specific repository.
                            </p>
                        </div>
                    ) : (
                        <div className="alert alert-info">
                            <AlertTriangle size={16} />
                            <span>Open a repository to configure repository-specific rules.</span>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary flex items-center gap-2"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save size={16} />
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
