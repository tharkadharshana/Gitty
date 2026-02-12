import React, { useEffect, useState } from 'react';

const UpdateNotification: React.FC = () => {
    const [status, setStatus] = useState<'none' | 'available' | 'downloaded'>('none');

    useEffect(() => {
        if ((window as any).electron) {
            (window as any).electron.onUpdateAvailable(() => {
                setStatus('available');
            });

            (window as any).electron.onUpdateDownloaded(() => {
                setStatus('downloaded');
            });
        }
    }, []);

    if (status === 'none') return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#2d333b',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 9999,
            border: '1px solid #444c56'
        }}>
            {status === 'available' && (
                <p>New update available. Downloading...</p>
            )}
            {status === 'downloaded' && (
                <div>
                    <p style={{ margin: '0 0 10px 0' }}>Update ready to install!</p>
                    <button
                        onClick={() => (window as any).electron.restartApp()}
                        style={{
                            backgroundColor: '#238636',
                            color: 'white',
                            border: 'none',
                            padding: '5px 15px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Restart Now
                    </button>
                </div>
            )}
        </div>
    );
};

export default UpdateNotification;
