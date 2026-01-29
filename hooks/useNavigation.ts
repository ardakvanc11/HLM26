
import { useState } from 'react';

export const useNavigation = (setLastSeenInjuryCount?: (count: number) => void, gameState?: any) => {
    const [viewHistory, setViewHistory] = useState<string[]>(['intro']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const currentView = viewHistory[historyIndex] || 'intro';

    const navigateTo = (view: string) => {
        if (view === currentView) return;

        // Health center badge reset logic injected here if dependencies provided
        if (view === 'health_center' && setLastSeenInjuryCount && gameState) {
            const t = gameState.teams.find((t: any) => t.id === gameState.myTeamId);
            const currentInjured = t ? t.players.filter((p: any) => p.injury && p.injury.daysRemaining > 0).length : 0;
            setLastSeenInjuryCount(currentInjured);
        }

        const newHistory = viewHistory.slice(0, historyIndex + 1);
        newHistory.push(view);
        setViewHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const resetTo = (view: string) => {
        setViewHistory([view]);
        setHistoryIndex(0);
    };

    const goBack = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
        }
    };

    const goForward = () => {
        if (historyIndex < viewHistory.length - 1) {
            setHistoryIndex(historyIndex + 1);
        }
    };

    return {
        viewHistory,
        historyIndex,
        currentView,
        navigateTo,
        resetTo,
        goBack,
        goForward,
        setViewHistory,
        setHistoryIndex
    };
};
