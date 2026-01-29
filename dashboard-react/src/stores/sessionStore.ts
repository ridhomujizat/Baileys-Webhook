import { create } from 'zustand';
import type { SessionData } from '../types/index';

interface SessionState {
    sessions: SessionData[];
    setSessions: (sessions: SessionData[]) => void;
    updateSession: (sessionId: string, data: Partial<SessionData>) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    sessions: [],
    setSessions: (sessions) => set({ sessions }),
    updateSession: (sessionId, data) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.sessionId === sessionId ? { ...s, ...data } : s
            ),
        })),
}));
