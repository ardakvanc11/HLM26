
import { useState, useEffect } from 'react';
import { GameState, Team, Player, Fixture, MatchEvent, MatchStats, PendingTransfer, IncomingOffer, BoardInteraction } from '../types';
import { GAME_CALENDAR } from '../data/gameConstants';
import { INITIAL_MESSAGES } from '../data/messagePool';

export const useCoreState = () => {
    const [gameState, setGameState] = useState<GameState>({
        managerName: null,
        manager: null,
        myTeamId: null,
        currentWeek: 1,
        currentDate: GAME_CALENDAR.START_DATE.toISOString(),
        teams: [],
        fixtures: [],
        messages: INITIAL_MESSAGES,
        isGameStarted: false,
        transferList: [],
        trainingPerformed: false,
        news: [],
        playTime: 0,
        lastSeenInjuryCount: 0,
        pendingTransfers: [],
        incomingOffers: [],
        seasonChampion: null,
        lastSeasonSummary: null,
        lastTrainingReport: [],
        consecutiveFfpYears: 0,
        yearsAtCurrentClub: 0,
        lastSeasonGoalAchieved: false,
        uiAlert: null
    });

    // Selection States
    const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<Player | null>(null);
    const [selectedTeamForDetail, setSelectedTeamForDetail] = useState<Team | null>(null);
    const [matchResultData, setMatchResultData] = useState<any>(null);
    const [selectedFixtureForDetail, setSelectedFixtureForDetail] = useState<Fixture | null>(null);
    const [selectedFixtureInfo, setSelectedFixtureInfo] = useState<Fixture | null>(null); 
    const [gameOverReason, setGameOverReason] = useState<string | null>(null);

    // Board Room State
    const [boardInteraction, setBoardInteraction] = useState<BoardInteraction | null>(null);

    // Negotiation States
    const [negotiatingTransferPlayer, setNegotiatingTransferPlayer] = useState<Player | null>(null);
    const [incomingTransfer, setIncomingTransfer] = useState<PendingTransfer | null>(null);

    // Theme State
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('hlm26_theme') as 'dark' | 'light';
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('hlm26_theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return {
        gameState, setGameState,
        selectedPlayerForDetail, setSelectedPlayerForDetail,
        selectedTeamForDetail, setSelectedTeamForDetail,
        matchResultData, setMatchResultData,
        selectedFixtureForDetail, setSelectedFixtureForDetail,
        selectedFixtureInfo, setSelectedFixtureInfo,
        gameOverReason, setGameOverReason,
        boardInteraction, setBoardInteraction,
        negotiatingTransferPlayer, setNegotiatingTransferPlayer,
        incomingTransfer, setIncomingTransfer,
        theme, toggleTheme
    };
};
