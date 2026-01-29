import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '../layout/Layout';
import { sessionApi } from '../api/session';
import { JsonEditor } from '../components/JsonEditor';
import { Download, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/client';

export const MediaDownloader: React.FC = () => {
    const [sessionId, setSessionId] = useState('');
    const [jsonInput, setJsonInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<{ url: string; type: string } | null>(null);

    // Fetch sessions for dropdown
    const { data: sessionsData } = useQuery({
        queryKey: ['sessions'],
        queryFn: sessionApi.getAllSessions,
    });

    // Filter to only connected and active sessions
    const activeSessions = sessionsData?.data?.filter(
        (s) => s.status === 'connected' && s.isActive !== false
    ) || [];

    const handleDownload = async () => {
        try {
            setLoading(true);
            setError(null);
            setPreview(null);

            if (!sessionId) {
                throw new Error('Please select a session');
            }

            const parsed = JSON.parse(jsonInput);

            // Build request payload
            const payload = {
                sessionId,
                message: parsed.message || parsed,
                returnBase64: false, // Request binary
            };

            // Make request with arraybuffer response type for binary data
            const response = await api.post('/message/download-media', payload, {
                responseType: 'arraybuffer',
            });

            // Get content type from response headers
            const contentType = response.headers['content-type'] || 'application/octet-stream';

            // Convert arraybuffer to blob then to data URL
            const blob = new Blob([response.data], { type: contentType });
            const url = URL.createObjectURL(blob);

            setPreview({ url, type: contentType });

        } catch (err: any) {
            if (err.response?.data) {
                // Try to decode error message from arraybuffer
                try {
                    const decoder = new TextDecoder();
                    const text = decoder.decode(err.response.data);
                    const json = JSON.parse(text);
                    setError(json.error || 'Failed to download media');
                } catch {
                    setError(err.message);
                }
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const sampleJson = `{
  "message": {
    "imageMessage": {
      "url": "https://mmg.whatsapp.net/...",
      "mimetype": "image/jpeg",
      "mediaKey": "...",
      "fileEncSha256": "...",
      "directPath": "..."
    }
  }
}`;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Media Downloader</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col shadow-sm">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">Session ID</label>
                            <select
                                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                value={sessionId}
                                onChange={e => setSessionId(e.target.value)}
                            >
                                <option value="">Select a session...</option>
                                {activeSessions.map((session) => (
                                    <option key={session.sessionId} value={session.sessionId}>
                                        {session.sessionId} ({session.phone || 'No phone'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">
                            Message JSON
                            <span className="text-xs text-gray-500 ml-2">(paste the message object)</span>
                        </label>
                        <div className="flex-1 min-h-[250px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-4">
                            <JsonEditor
                                value={jsonInput}
                                onChange={setJsonInput}
                                height="250px"
                                placeholder={sampleJson}
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3 mb-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleDownload}
                            disabled={loading || !jsonInput || !sessionId}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {loading ? 'Downloading...' : 'Download Media'}
                        </button>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center min-h-[300px] shadow-sm">
                        {preview ? (
                            <div className="w-full flex flex-col items-center gap-4">
                                {preview.type.startsWith('image/') && (
                                    <img src={preview.url} alt="Preview" className="max-w-full max-h-[400px] rounded-lg border border-gray-200 dark:border-gray-700" />
                                )}
                                {preview.type.startsWith('video/') && (
                                    <video src={preview.url} controls className="max-w-full max-h-[400px] rounded-lg border border-gray-200 dark:border-gray-700" />
                                )}
                                {preview.type.startsWith('audio/') && (
                                    <audio src={preview.url} controls className="w-full" />
                                )}

                                <a
                                    href={preview.url}
                                    download={`download.${preview.type.split('/')[1]}`}
                                    className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline cursor-pointer"
                                >
                                    <Download className="w-4 h-4" />
                                    Save File
                                </a>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 dark:text-gray-500">
                                <Download className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>Preview will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};
