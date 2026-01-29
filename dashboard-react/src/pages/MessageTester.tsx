import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../layout/Layout';
import { messageApi } from '../api/message';
import { sessionApi } from '../api/session';
import { JsonEditor } from '../components/JsonEditor';
import { Send, Loader2 } from 'lucide-react';

export const MessageTester: React.FC = () => {
    const [sessionId, setSessionId] = useState('');
    const [to, setTo] = useState('');
    const [type, setType] = useState('text');
    const [text, setText] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string>('');

    // Fetch sessions for dropdown
    const { data: sessionsData } = useQuery({
        queryKey: ['sessions'],
        queryFn: sessionApi.getAllSessions,
    });

    // Filter to only connected and active sessions
    const activeSessions = sessionsData?.data?.filter(
        (s) => s.status === 'connected' && s.isActive !== false
    ) || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult('');

        try {
            const payload: any = {
                sessionId,
                type,
                to,
            };

            if (type === 'text') payload.text = text;
            if (type === 'image') {
                payload.image = mediaUrl;
                payload.caption = caption;
            }
            if (type === 'video') {
                payload.video = mediaUrl;
                payload.caption = caption;
            }

            const response = await messageApi.sendMessage(payload);
            setResult(JSON.stringify(response, null, 2));
        } catch (error: any) {
            setResult(JSON.stringify(error.response?.data || { error: error.message }, null, 2));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Message Tester</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Session ID</label>
                                <select
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                    value={sessionId}
                                    onChange={e => setSessionId(e.target.value)}
                                    required
                                >
                                    <option value="">Select a session...</option>
                                    {activeSessions.map((session) => (
                                        <option key={session.sessionId} value={session.sessionId}>
                                            {session.sessionId} ({session.phone || 'No phone'})
                                        </option>
                                    ))}
                                </select>
                                {activeSessions.length === 0 && (
                                    <p className="text-xs text-yellow-500 mt-1">No connected & active sessions available</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">To (Phone Number)</label>
                                <input
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={to}
                                    onChange={e => setTo(e.target.value)}
                                    placeholder="628..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Type</label>
                                <select
                                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                    value={type}
                                    onChange={e => setType(e.target.value)}
                                >
                                    <option value="text">Text Message</option>
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>

                            {type === 'text' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Message</label>
                                    <textarea
                                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={text}
                                        onChange={e => setText(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            {(type === 'image' || type === 'video') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Media URL</label>
                                        <input
                                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={mediaUrl}
                                            onChange={e => setMediaUrl(e.target.value)}
                                            placeholder="https://..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Caption</label>
                                        <input
                                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={caption}
                                            onChange={e => setCaption(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !sessionId}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Response</h2>
                        <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <JsonEditor
                                value={result || '// Response will appear here...'}
                                readOnly={true}
                                height="300px"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
