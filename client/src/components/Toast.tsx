import { useState, useCallback, useEffect, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastProps {
    type: ToastType;
    message: string;
    onClose: () => void;
    duration?: number;
}

const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const colorMap = {
    success: 'var(--color-success)',
    error: 'var(--color-danger)',
    warning: 'var(--color-warning)',
    info: 'var(--color-info)',
};

export function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
    const Icon = iconMap[type];

    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
        <div className={`toast ${type}`}>
            <Icon className="toast-icon" size={18} style={{ color: colorMap[type] }} />
            <span className="toast-message">{message}</span>
            <button
                className="btn btn-ghost btn-icon"
                onClick={onClose}
                style={{ marginLeft: 'auto', padding: '4px' }}
            >
                <X size={14} />
            </button>
        </div>
    );
}

interface ToastContainerProps {
    children: ReactNode;
}

export function ToastContainer({ children }: ToastContainerProps) {
    return <div className="toast-container">{children}</div>;
}

export function useToast() {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts((prev) => [...prev, { id, type, message }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return { toasts, addToast, removeToast };
}
