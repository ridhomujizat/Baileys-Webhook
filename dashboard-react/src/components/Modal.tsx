import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onConfirm?: () => void;
    confirmText?: string;
    confirmVariant?: 'primary' | 'danger';
    isLoading?: boolean;
    hideFooter?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    onConfirm,
    confirmText = 'Confirm',
    confirmVariant = 'primary',
    isLoading = false,
    hideFooter = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="text-gray-700 dark:text-gray-300">
                    {children}
                </div>

                {!hideFooter && (
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        {onConfirm && (
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`px-4 py-2 rounded-lg font-medium cursor-pointer disabled:opacity-50 transition-colors ${confirmVariant === 'danger'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}
                            >
                                {isLoading ? 'Loading...' : confirmText}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
