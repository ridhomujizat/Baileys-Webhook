import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../layout/Layout';
import { sessionApi } from '../api/session';
import { useSessionStore } from '../stores/sessionStore';
import { Plus, Wifi, WifiOff, Loader2, Trash2, QrCode, Phone, Power, PowerOff } from 'lucide-react';
import { Modal } from '../components/Modal';
import clsx from 'clsx';
import type { SessionData } from '../types/index';

export const Dashboard: React.FC = () => {
    const queryClient = useQueryClient();
    const setSessions = useSessionStore((state) => state.setSessions);
    const sessions = useSessionStore((state) => state.sessions);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newSessionId, setNewSessionId] = useState('');

    // Fetch all sessions
    const { data: sessionsData, isLoading } = useQuery({
        queryKey: ['sessions'],
        queryFn: sessionApi.getAllSessions,
        refetchInterval: 5000, // Poll every 5s for status updates
    });

    useEffect(() => {
        if (sessionsData?.data) {
            setSessions(sessionsData.data);
        }
    }, [sessionsData, setSessions]);

    // Create Session Mutation
    const createSessionMutation = useMutation({
        mutationFn: sessionApi.startSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
            setIsAddModalOpen(false);
            setNewSessionId('');
        }
    });

    const handleCreateSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSessionId) {
            createSessionMutation.mutate(newSessionId);
        }
    };

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sessions</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your WhatsApp connections</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                    <Plus className="w-5 h-5" />
                    Add Session
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 border-dashed">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No sessions found</p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                    >
                        Create your first session
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map((session) => (
                        <SessionCard
                            key={session.sessionId}
                            session={session}
                        />
                    ))}
                </div>
            )}

            {/* Add Session Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="New Session"
                hideFooter
            >
                <form onSubmit={handleCreateSession}>
                    <input
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-500"
                        placeholder="Session ID (e.g., marketing-wa)"
                        value={newSessionId}
                        onChange={(e) => setNewSessionId(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createSessionMutation.isPending || !newSessionId}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                        >
                            {createSessionMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create
                        </button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
};

const SessionCard: React.FC<{
    session: SessionData;
}> = ({ session }) => {
    const queryClient = useQueryClient();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [pairingModalOpen, setPairingModalOpen] = useState(false);
    const [webhookModalOpen, setWebhookModalOpen] = useState(false);
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [webhookUrl, setWebhookUrl] = useState(session.webhookUrl || '');

    const isConnected = session.status === 'connected';
    const isActive = session.isActive !== false; // Default to true if undefined

    // Logout/Delete Mutation (logout already deletes in backend)
    const logoutMutation = useMutation({
        mutationFn: sessionApi.logoutSession,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
            setDeleteModalOpen(false);
        }
    });

    // Toggle Active Mutation
    const toggleActiveMutation = useMutation({
        mutationFn: ({ sessionId, active }: { sessionId: string; active: boolean }) =>
            sessionApi.toggleActive(sessionId, active),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
        }
    });

    // Get Pairing Code Mutation
    const pairingCodeMutation = useMutation({
        mutationFn: sessionApi.getPairingCode,
        onSuccess: (data) => {
            if (data.success && data.data?.pairingCode) {
                setPairingCode(data.data.pairingCode);
            }
        }
    });

    // Update Webhook URL Mutation
    const webhookMutation = useMutation({
        mutationFn: ({ sessionId, webhookUrl }: { sessionId: string; webhookUrl: string }) =>
            sessionApi.updateWebhookUrl(sessionId, webhookUrl),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
            setWebhookModalOpen(false);
        }
    });

    const handleGetPairingCode = () => {
        setPairingModalOpen(true);
        pairingCodeMutation.mutate(session.sessionId);
    };

    const handleUpdateWebhook = (e: React.FormEvent) => {
        e.preventDefault();
        webhookMutation.mutate({ sessionId: session.sessionId, webhookUrl });
    };

    // Sync local state with session data
    React.useEffect(() => {
        setWebhookUrl(session.webhookUrl || '');
    }, [session.webhookUrl]);

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors shadow-sm">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{session.sessionId}</h3>
                            <div className={clsx(
                                "flex items-center gap-2 text-sm mt-1",
                                isConnected ? "text-green-500" : "text-yellow-500"
                            )}>
                                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                                <span className="capitalize">{session.status.replace('_', ' ')}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {isConnected && (
                                <div className={clsx(
                                    "px-3 py-1 rounded-full text-xs font-medium border",
                                    isActive
                                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                                        : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                                )}>
                                    {isActive ? 'Active' : 'Inactive'}
                                </div>
                            )}
                        </div>
                    </div>

                    {isConnected ? (
                        <div className="space-y-2 mb-4">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-transparent">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Phone Number</p>
                                <p className="text-gray-900 dark:text-gray-200 font-mono">{session.phone || 'Unknown'}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-transparent">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Webhook URL</p>
                                    <button
                                        onClick={() => setWebhookModalOpen(true)}
                                        className="text-xs text-indigo-500 hover:text-indigo-400 cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <p className="text-gray-900 dark:text-gray-200 text-sm truncate">
                                    {session.webhookUrl || <span className="text-gray-400 italic">Not set</span>}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 bg-gray-50 dark:bg-white/5 rounded-lg mb-4 min-h-[200px]">
                            {session.qr ? (
                                <div className="bg-white p-2 rounded-lg">
                                    <img src={session.qr} alt="QR Code" className="w-40 h-40" />
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 flex flex-col items-center gap-2">
                                    <QrCode className="w-10 h-10 opacity-20" />
                                    <span className="text-sm">Waiting for QR...</span>
                                    {session.status === 'connecting' && <Loader2 className="w-4 h-4 animate-spin mt-2" />}
                                </div>
                            )}
                            <p className="text-xs text-center text-gray-400 mt-3 max-w-[200px]">
                                Scan this QR code with WhatsApp to connect
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 mt-4">
                        {/* Pairing Code Button - show when not connected */}
                        {!isConnected && (
                            <button
                                onClick={handleGetPairingCode}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors cursor-pointer"
                            >
                                <Phone className="w-4 h-4" />
                                Get Pairing Code
                            </button>
                        )}

                        {/* Toggle Active/Inactive - show when connected */}
                        {isConnected && (
                            <button
                                onClick={() => toggleActiveMutation.mutate({ sessionId: session.sessionId, active: !isActive })}
                                disabled={toggleActiveMutation.isPending}
                                className={clsx(
                                    "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50",
                                    isActive
                                        ? "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white"
                                        : "bg-green-600 hover:bg-green-700 text-white"
                                )}
                            >
                                {isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                {toggleActiveMutation.isPending ? 'Updating...' : (isActive ? 'Deactivate' : 'Activate')}
                            </button>
                        )}

                        {/* Delete/Logout Button */}
                        <button
                            onClick={() => setDeleteModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/20 hover:border-red-500/50 rounded-lg text-sm transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isConnected ? 'Logout & Delete' : 'Delete Session'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title={isConnected ? "Logout & Delete Session" : "Delete Session"}
                onConfirm={() => logoutMutation.mutate(session.sessionId)}
                confirmText={isConnected ? "Logout & Delete" : "Delete"}
                confirmVariant="danger"
                isLoading={logoutMutation.isPending}
            >
                <p>
                    Are you sure you want to {isConnected ? 'logout and delete' : 'delete'} the session <strong>{session.sessionId}</strong>?
                </p>
                {isConnected && (
                    <p className="mt-2 text-sm text-gray-500">
                        This will disconnect the WhatsApp account and remove all session data.
                    </p>
                )}
            </Modal>

            {/* Pairing Code Modal */}
            <Modal
                isOpen={pairingModalOpen}
                onClose={() => {
                    setPairingModalOpen(false);
                    setPairingCode(null);
                }}
                title="Pairing Code"
            >
                {pairingCodeMutation.isPending ? (
                    <div className="flex flex-col items-center py-4">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <p className="mt-2 text-sm text-gray-500">Generating pairing code...</p>
                    </div>
                ) : pairingCode ? (
                    <div className="text-center">
                        <p className="text-3xl font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 py-4 rounded-lg">
                            {pairingCode}
                        </p>
                        <p className="mt-4 text-sm text-gray-500">
                            Open WhatsApp on your phone → Settings → Linked Devices → Link a Device → Link with phone number
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-red-500">
                            {pairingCodeMutation.error?.message || 'Failed to get pairing code. Please try again.'}
                        </p>
                    </div>
                )}
            </Modal>

            {/* Webhook URL Modal */}
            <Modal
                isOpen={webhookModalOpen}
                onClose={() => setWebhookModalOpen(false)}
                title="Edit Webhook URL"
                hideFooter
            >
                <form onSubmit={handleUpdateWebhook}>
                    <p className="text-sm text-gray-500 mb-4">
                        Incoming messages will be sent to this URL. Leave empty to disable.
                    </p>
                    <input
                        type="url"
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-500"
                        placeholder="https://example.com/webhook"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setWebhookModalOpen(false)}
                            className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={webhookMutation.isPending}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                        >
                            {webhookMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

