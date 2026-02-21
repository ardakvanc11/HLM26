
import { useState, useEffect } from 'react';
import { GameState, Team, Player, Fixture, MatchEvent, MatchStats, PendingTransfer, IncomingOffer, BoardInteraction, TransferViewState, SquadViewState, CompetitionViewState, HolidayConfig } from '../types';
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
        shortlist: [], 
        seasonChampion: null,
        championDeclaredThisSeason: false, 
        lastSeasonSummary: null,
        lastTrainingReport: [],
        consecutiveFfpYears: 0,
        yearsAtCurrentClub: 0,
        lastSeasonGoalAchieved: false,
        uiAlert: null,
        activeFixtureId: null,
        activeHoliday: null // NEW: Init holiday state
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

    // Persisted UI States (For back navigation)
    const [transferViewState, setTransferViewState] = useState<TransferViewState | null>(null);
    const [squadViewState, setSquadViewState] = useState<SquadViewState | null>(null);
    const [competitionViewState, setCompetitionViewState] = useState<CompetitionViewState | null>(null);

    // Match UI States
    const [liveMatchPhase, setLiveMatchPhase] = useState<string>('FIRST_HALF');
    const [matchActionSignal, setMatchActionSignal] = useState<string | null>(null);

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
        transferViewState, setTransferViewState,
        squadViewState, setSquadViewState,
        competitionViewState, setCompetitionViewState,
        theme, toggleTheme,
        liveMatchPhase, setLiveMatchPhase,
        matchActionSignal, setMatchActionSignal
    };
};
