import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import api from '../api/client';

export const AuthPage: React.FC = () => {
    const [inputToken, setInputToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setToken = useAuthStore((state) => state.setToken);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Temporarily set token in axios instance to check validity
            // We don't save to store yet until validated
            api.defaults.headers.common['Authorization'] = `Bearer ${inputToken}`;

            await authApi.checkToken();

            // If successful, save to store (which persists it)
            setToken(inputToken);
            navigate('/');
        } catch (err) {
            setError('Invalid API Token.');
            // Reset axios header
            delete api.defaults.headers.common['Authorization'];
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-indigo-500/10 rounded-full">
                        <Lock className="w-8 h-8 text-indigo-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-white text-center mb-2">
                    Baileys Webhook
                </h1>
                <p className="text-gray-400 text-center mb-8">
                    Enter your API Token to continue
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="token" className="block text-sm font-medium text-gray-300 mb-1">
                            API Token
                        </label>
                        <input
                            type="password"
                            id="token"
                            value={inputToken}
                            onChange={(e) => setInputToken(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="Enter token"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={clsx(
                            "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2",
                            isLoading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            'Access Dashboard'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
