import React, { useState, useEffect } from 'react';
import { GameState, Team, Player, Fixture, MatchEvent, MatchStats, PendingTransfer, SponsorDeal, IncomingOffer, TrainingConfig, IndividualTrainingType, BoardInteraction, Position, TransferViewState, SquadViewState, CompetitionViewState, UIAlert, HolidayConfig } from '../types';
import { FileWarning, LogOut, Trophy, Building2, BarChart3, ArrowRightLeft, Wallet, Clock, TrendingUp, TrendingDown, Crown, Plane, X, Loader2, Calendar as CalendarIcon, Newspaper, ChevronRight, PauseCircle, Star, Shield, Globe } from 'lucide-react';
import { isSameDay, getFormattedDate, addDays } from '../utils/calendarAndFixtures';

// Views
import IntroScreen from '../views/IntroScreen';
import TeamSelection from '../views/TeamSelection';
import HomeView from '../views/HomeView';
import SquadView from '../views/SquadView';
import TacticsView from '../views/TacticsView';
import FixturesView from '../views/FixturesView';
import TransferView from '../views/TransferView';
import FinanceView from '../views/FinanceView';
import SocialMediaView from '../views/SocialMediaView';
import TrainingView from '../views/TrainingView';
import DevelopmentCenterView from '../views/DevelopmentCenterView';
import TeamDetailView from '../views/TeamDetailView';
import PlayerDetailView from '../views/PlayerDetailView'; 
import MatchPreview from '../views/MatchPreview';
import LockerRoomView from '../views/LockerRoomView';
import MatchSimulation from '../views/MatchSimulation/index'; // UPDATED IMPORT
import PostMatchInterview from '../views/PostMatchInterview';
import HealthCenterView from '../views/HealthCenterView';
import ContractNegotiationView from '../views/ContractNegotiationView'; 
import TransferOfferNegotiationView from '../views/TransferOfferNegotiationView';
import LeagueCupView from '../views/LeagueCupView';
import ClubObjectivesView from '../views/ClubObjectivesView'; 
import PreMatchTalkView from '../views/PreMatchTalkView'; // New Import

// Layouts & Modals
import Dashboard from '../layout/Dashboard';
import MatchDetailModal from '../modals/MatchDetailModal';
import MatchResultModal from '../modals/MatchResultModal';
import HallOfFameModal from '../modals/HallOfFameModal';
import FixtureDetailPanel from './shared/FixtureDetailPanel';
import ChampionCelebrationModal from '../modals/ChampionCelebrationModal'; 
import SeasonSummaryModal from '../modals/SeasonSummaryModal';
import BoardInteractionModal from '../modals/BoardInteractionModal'; 
import CustomAlert from './shared/CustomAlert'; 

// Types definition for props
interface MainContentProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
    viewHistory: string[];
    historyIndex: number;
    currentView: string;
    selectedPlayerForDetail: Player | null;
    setSelectedPlayerForDetail: React.Dispatch<React.SetStateAction<Player | null>>;
    selectedTeamForDetail: Team | null;
    setSelectedTeamForDetail: React.Dispatch<React.SetStateAction<Team | null>>;
    matchResultData: any;
    setMatchResultData: React.Dispatch<React.SetStateAction<any>>;
    selectedFixtureForDetail: Fixture | null;
    setSelectedFixtureForDetail: React.Dispatch<React.SetStateAction<Fixture | null>>;
    selectedFixtureInfo: Fixture | null;
    setSelectedFixtureInfo: React.Dispatch<React.SetStateAction<Fixture | null>>;
    gameOverReason: string | null;
    boardInteraction: BoardInteraction | null; 
    setBoardInteraction: React.Dispatch<React.SetStateAction<BoardInteraction | null>>; 
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    navigateTo: (view: string) => void;
    resetTo: (view: string) => void;
    goBack: () => void;
    goForward: () => void;
    handleStart: (name: string, year: string, country: string) => void;
    handleSelectTeam: (id: string) => void;
    handleSave: () => void;
    handleNewGame: () => void;
    handleNextWeek: () => void;
    handleTrain: (config: TrainingConfig) => void; 
    handleAssignIndividualTraining: (playerId: string, type: IndividualTrainingType) => void; 
    handleAssignPositionTraining: (playerId: string, target: Position, weeks: number) => void; 
    handleMatchFinish: (hScore: number, aScore: number, events: MatchEvent[], stats: MatchStats, fixtureId?: string) => void;
    handleFastSimulate: (fixtureId?: string) => void; 
    handleShowTeamDetail: (teamId: string) => void;
    handleShowPlayerDetail: (player: Player) => void;
    handleBuyPlayer: (player: Player) => void;
    handleSellPlayer: (player: Player) => void;
    handleMessageReply: (msgId: number, optIndex: number) => void;
    handleInterviewComplete: (effect: any, relatedPlayerId?: string) => void;
    handleSkipInterview: () => void; 
    handleRetire: () => void;
    handleTerminateContract: () => void;
    handlePlayerInteraction: (playerId: string, type: 'POSITIVE' | 'NEGATIVE' | 'HOSTILE') => void;
    handlePlayerUpdate: (playerId: string, updates: Partial<Player>) => void;
    handleReleasePlayer: (player: Player, cost: number) => void; 
    handleTransferOfferSuccess: (player: Player, agreedFee: number) => void; 
    handleSignPlayer: (player: Player, fee: number, contract: any) => void; 
    handleCancelTransfer: (playerId: string) => void; 
    handleUpdateSponsor: (type: 'main' | 'stadium' | 'sleeve', deal: SponsorDeal) => void;
    handleTakeEmergencyLoan: (amount: number) => void;
    handleUpdateBudget: (newTransferBudget: number, newWageBudget: number) => void;
    handleAcceptOffer: (offer: IncomingOffer) => void;
    handleRejectOffer: (offer: IncomingOffer) => void;
    handleToggleTrainingDelegation: () => void;
    handleBoardRequest: (type: string, isDebug?: boolean) => void; 
    handleToggleShortlist: (playerId: string) => void; 
    negotiatingTransferPlayer: Player | null; 
    setNegotiatingTransferPlayer: React.Dispatch<React.SetStateAction<Player | null>>; 
    incomingTransfer: PendingTransfer | null; 
    setIncomingTransfer: React.Dispatch<React.SetStateAction<PendingTransfer | null>>;
    transferViewState: TransferViewState | null; 
    setTransferViewState: React.Dispatch<React.SetStateAction<TransferViewState | null>>; 
    squadViewState: SquadViewState | null; 
    setSquadViewState: React.Dispatch<React.SetStateAction<SquadViewState | null>>; 
    competitionViewState: CompetitionViewState | null;
    setCompetitionViewState: React.Dispatch<React.SetStateAction<CompetitionViewState | null>>;
    liveMatchPhase: string;
    setLiveMatchPhase: React.Dispatch<React.SetStateAction<string>>;
    matchActionSignal: string | null;
    setMatchActionSignal: React.Dispatch<React.SetStateAction<string | null>>;
    myTeam?: Team;
    injuredBadgeCount: number;
    isTransferWindowOpen: boolean;
}

const MainContent: React.FC<MainContentProps> = (props) => {
    const {
        gameState,
        setGameState,
        viewHistory,
        historyIndex,
        currentView,
        selectedPlayerForDetail,
        setSelectedPlayerForDetail,
        selectedTeamForDetail,
        setSelectedTeamForDetail,
        matchResultData,
        setMatchResultData,
        selectedFixtureForDetail,
        setSelectedFixtureForDetail,
        selectedFixtureInfo,
        setSelectedFixtureInfo,
        gameOverReason,
        boardInteraction,
        setBoardInteraction,
        theme,
        toggleTheme,
        navigateTo,
        resetTo,
        goBack,
        goForward,
        handleStart,
        handleSelectTeam,
        handleSave,
        handleNewGame,
        handleNextWeek,
        handleTrain,
        handleAssignIndividualTraining,
        handleAssignPositionTraining, 
        handleMatchFinish,
        handleFastSimulate,
        handleShowTeamDetail,
        handleShowPlayerDetail, 
        handleBuyPlayer,
        handleSellPlayer,
        handleMessageReply,
        handleInterviewComplete,
        handleSkipInterview, 
        handleRetire,
        handleTerminateContract,
        handlePlayerInteraction,
        handlePlayerUpdate,
        handleReleasePlayer,
        handleTransferOfferSuccess,
        handleSignPlayer,
        handleCancelTransfer,
        handleUpdateSponsor,
        handleTakeEmergencyLoan,
        handleAcceptOffer,
        handleRejectOffer,
        handleToggleTrainingDelegation,
        handleBoardRequest,
        handleToggleShortlist, 
        negotiatingTransferPlayer,
        setNegotiatingTransferPlayer,
        incomingTransfer,
        setIncomingTransfer,
        transferViewState,
        setTransferViewState,
        squadViewState,
        setSquadViewState,
        competitionViewState,
        setCompetitionViewState,
        liveMatchPhase,
        setLiveMatchPhase,
        matchActionSignal,
        setMatchActionSignal,
        myTeam,
        injuredBadgeCount,
        isTransferWindowOpen
    } = props;

    // Helper for formatting time
    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        
        if (h > 0) return `${h} Sa ${m} Dk`;
        return `${m} Dk`;
    };

    // State for showing Hall of Fame inside Game Over screen
    const [showGameOverHoF, setShowGameOverHoF] = useState(false);
    
    // State for Contract Negotiation (With Own Players)
    const [negotiatingPlayer, setNegotiatingPlayer] = useState<Player | null>(null);
    
    // State for Negotiation Mode (Buying vs Selling)
    const [negotiationMode, setNegotiationMode] = useState<'BUY' | 'SELL'>('BUY');
    const [initialSellOffer, setInitialSellOffer] = useState<number>(0);
    // NEW: State to track if the current negotiation is for a LOAN or TRANSFER
    const [negotiationOfferType, setNegotiationOfferType] = useState<'TRANSFER' | 'LOAN'>('TRANSFER');

    // State to handle direct navigation to a specific competition (e.g. from player stats)
    const [targetCompetitionId, setTargetCompetitionId] = useState<string | null>(null);

    // --- PAUSE STATE ---
    const [isMatchPaused, setIsMatchPaused] = useState(false);

    // --- TACTICS MENU STATE (Lifted from MatchSimulation) ---
    const [isTacticsOpen, setIsTacticsOpen] = useState(false);

    // --- ACTION BLOCK STATE (Bug Fix) ---
    // If true, header buttons (continue/finish) are disabled because an action (like forced sub) is required inside match view
    const [isMatchActionBlocked, setIsMatchActionBlocked] = useState(false);

    // Reset target competition when returning to home
    useEffect(() => {
        if (currentView === 'home') {
            setTargetCompetitionId(null);
            setIsMatchPaused(false); // Reset pause state on home
            setIsTacticsOpen(false); // Reset tactics state
            setIsMatchActionBlocked(false); // Reset blocking state
        }
    }, [currentView]);

    const handleGoOnHoliday = (config: HolidayConfig) => {
        setGameState(prev => ({ ...prev, activeHoliday: config }));
    };

    const handleStopHoliday = () => {
        setGameState(prev => ({ ...prev, activeHoliday: null }));
    };

    // Function to handle budget updates from Finance View
    const handleBudgetUpdate = (newTransferBudget: number, newWageBudget: number) => {
        if (!myTeam) return;
        
        const updatedTeam = { 
            ...myTeam, 
            budget: newTransferBudget,
            wageBudget: newWageBudget 
        };
        
        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t)
        }));
        
        alert("Bütçe dağılımı başarıyla güncellendi!"); 
    };

    const handleManagerContractUpdate = (newWage: number, newExpiry: number) => {
        setGameState(prev => ({
            ...prev,
            manager: {
                ...prev.manager!,
                contract: { ...prev.manager!.contract, salary: newWage, expires: newExpiry }
            }
        }));
    };

    // Handler for clicking competition in player stats OR fixture list
    const handleCompetitionClick = (compId: string) => {
        setTargetCompetitionId(compId);
        // Force reset the saved state if we are clicking a specific comp ID to ensure we go there
        // NOTE: We don't nullify competitionViewState here completely to preserve tabs for other comps if needed, 
        // but targetCompetitionId takes precedence in LeagueCupView
        navigateTo('competitions');
    };

    // Contract Negotiation Handlers
    const handleStartNegotiation = (player: Player) => {
        setNegotiatingPlayer(player);
        navigateTo('contract_negotiation');
    };

    // Define clearCooldown before it's used in handleFinishNegotiation
    const clearCooldown = (p: Player, cw?: number) => {
        if (!p.nextNegotiationWeek || !cw) return 4;
        return Math.max(1, p.nextNegotiationWeek - cw);
    }

    const handleFinishNegotiation = (success: boolean, newContract: any) => {
        if (success && newContract) {
            if (incomingTransfer && activeNegotiationPlayer && activeNegotiationPlayer.id === incomingTransfer.playerId) {
                handleSignPlayer(activeNegotiationPlayer, incomingTransfer.agreedFee, newContract);
            } else if (negotiatingPlayer) {
                handlePlayerUpdate(negotiatingPlayer.id, {
                    squadStatus: newContract.role,
                    contractExpiry: 2025 + newContract.years,
                    activePromises: newContract.promises,
                    wage: newContract.wage
                });
                alert("Yeni sözleşme imzalandı!");
                setNegotiatingPlayer(null);
                goBack();
            }
        } else {
            const cooldownWeeks = 4;
            const nextWeek = gameState.currentWeek + cooldownWeeks;

            if (negotiatingPlayer) {
                handlePlayerUpdate(negotiatingPlayer.id, {
                    activePromises: negotiatingPlayer.activePromises,
                    nextNegotiationWeek: nextWeek
                });
                alert(`Görüşmeler başarısız oldu. Oyuncu ${clearCooldown(negotiatingPlayer, gameState.currentWeek)} hafta daha beklemeniz gerekiyor.`);
                setNegotiatingPlayer(null);
                goBack();
            } else if (incomingTransfer) {
                handlePlayerUpdate(incomingTransfer.playerId, {
                    nextNegotiationWeek: nextWeek
                });
                alert(`Anlaşma sağlanamadı. ${cooldownWeeks} hafta boyunca tekrar teklif yapılamaz.`);
                
                handleCancelTransfer(incomingTransfer.playerId);
                resetTo('home');
            }
        }
    };

    const handleStartTransferNegotiation = (player: Player) => {
        setNegotiationMode('BUY');
        setInitialSellOffer(0);
        setNegotiationOfferType('TRANSFER'); // Default to transfer when buying
        if (player.teamId === 'free_agent') {
            const dummyTransfer: PendingTransfer = {
                playerId: player.id,
                sourceTeamId: 'free_agent',
                agreedFee: 0,
                date: gameState.currentDate
            };
            setIncomingTransfer(dummyTransfer);
            navigateTo('contract_negotiation');
        } else {
            setNegotiatingTransferPlayer(player);
            navigateTo('transfer_negotiation');
        }
    }

    const handleNegotiateOffer = (offer: IncomingOffer) => {
        if (!myTeam) return;
        const player = myTeam.players.find(p => p.id === offer.playerId);
        if (player) {
            setNegotiatingTransferPlayer(player);
            setNegotiationMode('SELL');
            
            // Set offer type based on the incoming offer
            setNegotiationOfferType(offer.type || 'TRANSFER');

            // Handle value initialization: If Loan, use monthly fee. If Transfer, use amount.
            if (offer.type === 'LOAN' && offer.loanDetails) {
                setInitialSellOffer(offer.loanDetails.monthlyFee);
            } else {
                setInitialSellOffer(offer.amount);
            }
            
            navigateTo('transfer_negotiation');
        }
    };

    const handleFinishTransferNegotiation = (success: boolean, fee: number) => {
        if (negotiationMode === 'BUY') {
            if (success && negotiatingTransferPlayer) {
                handleTransferOfferSuccess(negotiatingTransferPlayer, fee);
            } else if (!success && negotiatingTransferPlayer) {
                const cooldown = 3;
                handlePlayerUpdate(negotiatingTransferPlayer.id, {
                    nextNegotiationWeek: gameState.currentWeek + cooldown
                });
                alert(`Kulüp ile anlaşma sağlanamadı. ${cooldown} hafta boyunca yeni teklif yapılamaz.`);
            }
        } else {
            if (negotiatingTransferPlayer) {
                const originalOffer = gameState.incomingOffers.find(o => o.playerId === negotiatingTransferPlayer.id);
                if (success) {
                    const finalOffer: IncomingOffer = {
                        id: originalOffer ? originalOffer.id : 'simulated_' + Date.now(),
                        playerId: negotiatingTransferPlayer.id,
                        playerName: negotiatingTransferPlayer.name,
                        fromTeamName: originalOffer ? originalOffer.fromTeamName : 'Karşı Kulüp',
                        amount: fee,
                        date: gameState.currentDate,
                        type: negotiationOfferType, // Persist Type
                        // If loan, recreate simple structure (fee is monthly fee here if loan)
                        loanDetails: negotiationOfferType === 'LOAN' ? {
                            monthlyFee: fee,
                            wageContribution: 100, // Default if not detailed
                            duration: 'Sezon Sonu'
                        } : undefined
                    };
                    handleAcceptOffer(finalOffer);
                } else {
                    alert("Anlaşma sağlanamadı. Karşı kulüp masadan kalktı.");
                    if (originalOffer) {
                        handleRejectOffer(originalOffer);
                    }
                }
            }
        }
        setNegotiatingTransferPlayer(null);
        goBack();
    };

    const getIncomingPlayer = () => {
        if (!incomingTransfer) return null;
        for (const t of gameState.teams) {
            const p = t.players.find(x => x.id === incomingTransfer.playerId);
            if(p) return p;
        }
        return gameState.transferList.find(x => x.id === incomingTransfer.playerId) || null;
    };

    const incomingPlayerObj = getIncomingPlayer();
    const activeNegotiationPlayer = negotiatingPlayer || incomingPlayerObj;

    const handleCloseCelebration = () => {
        setGameState(prev => ({ ...prev, seasonChampion: null }));
    };

    const handleCloseSeasonSummary = () => {
        setGameState(prev => ({ ...prev, lastSeasonSummary: null }));
    };

    const getTargetTeamForNegotiation = (teamId: string) => {
        const found = gameState.teams.find(t => t.id === teamId);
        if (found) return found;
        if (negotiationMode === 'SELL' && negotiatingTransferPlayer) {
            const offer = gameState.incomingOffers.find(o => o.playerId === negotiatingTransferPlayer.id);
            const teamName = offer ? offer.fromTeamName : 'Talip Kulüp';
            return {
                id: 'buying_ai_team',
                name: teamName,
                logo: '',
                colors: ['bg-slate-700', 'text-white'],
                players: [],
                championships: 0, fanBase: 0, stadiumName: '', stadiumCapacity: 0, budget: 1000, initialDebt: 0, 
                reputation: 0, financialRecords: { income: {} as any, expense: {} as any }, 
                transferHistory: [], sponsors: {} as any, formation: '', mentality: {} as any, passing: {} as any, 
                tempo: {} as any, width: {} as any, creative: {} as any, finalThird: {} as any, crossing: {} as any, 
                defLine: {} as any, tackling: {} as any, pressFocus: {} as any, timeWasting: {} as any, 
                tactic: {} as any, attackStyle: {} as any, pressingStyle: {} as any, stats: {} as any, strength: 0, morale: 0
            } as unknown as Team;
        }
        return {
            id: teamId,
            name: teamId === 'free_agent' ? 'Serbest' : 'Yurt Dışı Kulübü',
            logo: '', 
            colors: ['bg-slate-700', 'text-white'],
            players: new Array(25).fill({}),
            championships: 0, fanBase: 0, stadiumName: '', stadiumCapacity: 0, budget: 0, initialDebt: 0, 
            reputation: 0, financialRecords: { income: {} as any, expense: {} as any }, 
            transferHistory: [], sponsors: {} as any, formation: '', mentality: {} as any, passing: {} as any, 
            tempo: {} as any, width: {} as any, creative: {} as any, finalThird: {} as any, crossing: {} as any, 
            defLine: {} as any, tackling: {} as any, pressFocus: {} as any, timeWasting: {} as any, 
            tactic: {} as any, attackStyle: {} as any, pressingStyle: {} as any, stats: {} as any, strength: 0, morale: 0
        } as unknown as Team;
    };

    // Helper function for showing alerts
    const handleShowAlert = (alert: UIAlert) => {
        setGameState(prev => ({ ...prev, uiAlert: alert }));
    };

    const getCompetitionDetails = (compId?: string) => {
        switch (compId) {
            case 'SUPER_CUP': return { name: 'Süper Kupa', icon: Star, color: 'text-yellow-500' };
            case 'CUP': return { name: 'Türkiye Kupası', icon: Shield, color: 'text-red-500' };
            case 'LEAGUE_1': return { name: '1. Lig', icon: TrendingUp, color: 'text-orange-500' };
            case 'EUROPE': return { name: 'Avrupa', icon: Globe, color: 'text-blue-500' };
            default: return { name: 'Lig', icon: Trophy, color: 'text-slate-600' };
        }
    };

    if (currentView === 'intro') return <IntroScreen onStart={handleStart} />;
    if (currentView === 'team_select') return <TeamSelection teams={gameState.teams} onSelect={handleSelectTeam} />;

    let maxAllowedWage = 0;
    if (myTeam && activeNegotiationPlayer) {
        const currentTotalWages = myTeam.players.reduce((acc, p) => acc + (p.wage !== undefined ? p.wage : (p.value * 0.005 * 52)), 0);
        const playerCurrentWage = (activeNegotiationPlayer.teamId === myTeam.id) 
            ? (activeNegotiationPlayer.wage !== undefined ? activeNegotiationPlayer.wage : (activeNegotiationPlayer.value * 0.005 * 52))
            : 0;
        const committedWagesOthers = currentTotalWages - playerCurrentWage;
        const wageBudgetLimit = myTeam.wageBudget !== undefined ? myTeam.wageBudget : currentTotalWages;
        maxAllowedWage = Math.max(0, wageBudgetLimit - committedWagesOthers);
    }
    
    // --- DETERMINE ACTIVE FIXTURE FOR PREVIEW AND SIMULATION ---
    const getActiveFixture = () => {
        if (gameState.activeFixtureId) {
            const found = gameState.fixtures.find(f => f.id === gameState.activeFixtureId);
            if (found && !found.played) return found;
        }
        const todayMatch = gameState.fixtures.find(f => 
            (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId) && 
            !f.played && 
            isSameDay(f.date, gameState.currentDate)
        );
        if (todayMatch) return todayMatch;
        return gameState.fixtures.find(f => (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId) && !f.played);
    }

    const activeFixture = getActiveFixture();
    const matchPreviewHomeTeam = activeFixture ? gameState.teams.find(t => t.id === activeFixture.homeTeamId) : null;
    const matchPreviewAwayTeam = activeFixture ? gameState.teams.find(t => t.id === activeFixture.awayTeamId) : null;

    // Handler for talk opponent lookup
    const talkOpponent = activeFixture ? gameState.teams.find(t => t.id === (activeFixture.homeTeamId === gameState.myTeamId ? activeFixture.awayTeamId : activeFixture.homeTeamId)) : undefined;
    
    // --- PREVIOUS LEG CALCULATION FOR EUROPEAN 2ND LEGS ---
    let previousLegScore = undefined;
    if (activeFixture && activeFixture.competitionId === 'EUROPE' && [210, 212, 214, 216].includes(activeFixture.week)) {
        // Find previous leg match
        // Rule: Previous week, Home/Away reversed
        const prevWeek = activeFixture.week - 1;
        
        // STRICT LOOKUP: Match by IDs reversed (Leg 1: Current Away was Home, Current Home was Away)
        // CRITICAL FIX: Also check year context to avoid false positives in long-running saves
        const activeDate = new Date(activeFixture.date);
        const activeSeasonYear = activeDate.getMonth() >= 6 ? activeDate.getFullYear() : activeDate.getFullYear() - 1;

        const prevFixture = gameState.fixtures.find(f => {
            const d = new Date(f.date);
            const fSeasonYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
            
            return f.competitionId === 'EUROPE' && 
                   f.week === prevWeek && 
                   f.homeTeamId === activeFixture.awayTeamId && // Leg 1 Home = Leg 2 Away
                   f.awayTeamId === activeFixture.homeTeamId && // Leg 1 Away = Leg 2 Home
                   f.played &&
                   fSeasonYear === activeSeasonYear; // Must be same season
        });
        
        if (prevFixture) {
             previousLegScore = { home: prevFixture.homeScore!, away: prevFixture.awayScore! };
        }
    }

    // Wrapped Handlers for Match Locking
    const handleMatchProceed = () => {
        if (activeFixture) {
            setGameState(prev => ({ ...prev, activeFixtureId: activeFixture.id }));
            navigateTo('locker_room');
        }
    };

    const handleGoToTalk = () => {
        if (activeFixture) {
            setGameState(prev => ({ ...prev, activeFixtureId: activeFixture.id }));
            navigateTo('pre_match_talk');
        }
    };

    const handleMatchFinishWrapper = (hScore: number, aScore: number, events: MatchEvent[], stats: MatchStats, fixtureId?: string) => {
        handleMatchFinish(hScore, aScore, events, stats, fixtureId);
        setIsMatchPaused(false); // Reset pause state
        setIsTacticsOpen(false); // Reset tactics state
        setIsMatchActionBlocked(false); // Reset blocking state
    };

    const handleFastSimulateWrapper = () => {
        handleFastSimulate(gameState.activeFixtureId || undefined);
    };

    // Calculate details for holiday modal visual
    const currentDateObj = getFormattedDate(gameState.currentDate);
    const dayName = currentDateObj.label.split(' ')[0];
    const monthName = currentDateObj.label.split(' ')[1];
    
    // --- SEASON YEAR CALCULATION ---
    // Month >= 6 (July) means new season year.
    // e.g. July 2025 -> Season 2025/26
    // e.g. Jan 2026 -> Season 2025/26 (Year 2026, so Season Start Year is 2025)
    const seasonStartYear = currentDateObj.dateObj.getMonth() >= 6 ? currentDateObj.dateObj.getFullYear() : currentDateObj.dateObj.getFullYear() - 1;
    const currentSeasonString = `${seasonStartYear}/${(seasonStartYear + 1).toString().slice(2)}`;
    // --------------------------------

    // Recent matches for Holiday modal
    const recentMatches = gameState.fixtures
        .filter(f => f.played && (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
        .slice(0, 5);

    // Calendar Generation for Holiday Modal
    const calendarDays = Array.from({length: 5}, (_, i) => {
        const d = addDays(gameState.currentDate, i + 1);
        const f = gameState.fixtures.find(f => (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId) && isSameDay(f.date, d));
        return { date: d, fixture: f };
    });

    return (
        <Dashboard 
            state={gameState} 
            onNavigate={(view) => {
                // EXPLOIT FIX: If user tries to go to match_preview but already initiated match flow, redirect to locker room
                if (view === 'match_preview' && gameState.activeFixtureId) {
                    navigateTo('locker_room');
                } else {
                    if (view === 'competitions') {
                        // RESETTING STATE FOR COMPETITION VIEW ON SIDEBAR CLICK
                        setTargetCompetitionId(null);
                        setCompetitionViewState(prev => prev ? { ...prev, selectedCompId: null } : null);
                    }
                    navigateTo(view);
                }
            }} 
            onSave={handleSave} 
            onNewGame={handleNewGame}
            onNextWeek={handleNextWeek}
            currentView={currentView}
            theme={theme}
            toggleTheme={toggleTheme}
            onBack={goBack}
            onForward={goForward}
            canBack={historyIndex > 0}
            canForward={historyIndex < viewHistory.length - 1}
            injuredCount={injuredBadgeCount}
            onTeamClick={handleShowTeamDetail}
            onPlayerClick={handleShowPlayerDetail}
            // NEW PROPS FOR PAUSE
            isMatchPaused={isMatchPaused}
            onToggleMatchPause={() => setIsMatchPaused(prev => prev)}
            // NEW PROPS FOR TACTICS MENU RESUME
            isTacticsOpen={isTacticsOpen}
            onCloseTactics={() => setIsTacticsOpen(false)}
            // MATCH HEADER ACTIONS
            activeMatchPhase={liveMatchPhase}
            onMatchHeaderAction={(action) => setMatchActionSignal(action)}
            // ACTION BLOCK
            isMatchActionBlocked={isMatchActionBlocked}
        >
            {/* UPDATED HOLIDAY OVERLAY */}
            {gameState.activeHoliday && (
                <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-5xl bg-[#121519] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] animate-in zoom-in duration-300">
                        
                        {/* LEFT SIDEBAR (STATUS) */}
                        <div className="w-full md:w-1/3 bg-gradient-to-b from-indigo-900 to-[#121519] p-8 flex flex-col relative border-r border-slate-700/50">
                            {/* Spinner */}
                            <div className="absolute top-6 right-6 text-white/20 animate-spin">
                                <Loader2 size={48} />
                            </div>

                            <div className="mt-4">
                                <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-1">DURUM</h3>
                                <h1 className="text-4xl font-black text-white uppercase tracking-tight">İŞLENİYOR</h1>
                            </div>

                            <div className="flex-1 flex flex-col justify-center gap-6">
                                <div className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    <div className="text-xs font-bold text-slate-300 uppercase mb-2">BUGÜN</div>
                                    <div className="text-6xl font-black text-white leading-none">{dayName}</div>
                                    <div className="text-2xl font-bold text-indigo-300 uppercase mt-1">{monthName}</div>
                                </div>

                                {(() => {
                                     const getReturnInfo = () => {
                                        const config = gameState.activeHoliday;
                                        if (!config) return { label: '-', days: null };

                                        if (config.type === 'INDEFINITE') return { label: 'Süresiz (Manuel)', days: null };

                                        let targetDateStr = '';
                                        
                                        if (config.type === 'NEXT_MATCH') {
                                             const nextMatch = gameState.fixtures
                                                .filter(f => (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId) && !f.played)
                                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
                                            if (nextMatch) targetDateStr = nextMatch.date;
                                            else return { label: 'Sezon Sonu', days: null };
                                        } else if (config.type === 'DATE') {
                                            targetDateStr = config.targetDate || '';
                                        } else if (config.type === 'DURATION') {
                                            const d = new Date(gameState.currentDate);
                                            d.setDate(d.getDate() + (config.days || 0));
                                            targetDateStr = d.toISOString();
                                        }

                                        if(targetDateStr) {
                                            const diff = new Date(targetDateStr).getTime() - new Date(gameState.currentDate).getTime();
                                            const dLeft = Math.ceil(diff / (1000 * 3600 * 24));
                                            return { label: getFormattedDate(targetDateStr).label, days: Math.max(0, dLeft) };
                                        }
                                        return { label: '-', days: 0 };
                                     };
                                     const rInfo = getReturnInfo();

                                     return (
                                        <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/10">
                                            <div className="text-xs font-bold text-indigo-300 uppercase mb-1 flex items-center gap-2">
                                                 <CalendarIcon size={14}/> Dönüş Tarihi
                                            </div>
                                            <div className="text-xl font-black text-white leading-none">
                                                {rInfo.label}
                                            </div>
                                            {rInfo.days !== null && (
                                                 <div className="text-xs font-bold text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded inline-block">
                                                     {rInfo.days === 0 ? 'Bugün' : `${rInfo.days} Gün İçinde`}
                                                 </div>
                                            )}
                                        </div>
                                     );
                                })()}
                            </div>

                            <button 
                                onClick={handleStopHoliday}
                                className="mt-auto bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl shadow-lg shadow-red-900/20 flex items-center justify-center gap-3 transition-transform active:scale-95 group"
                            >
                                <PauseCircle size={24} className="group-hover:fill-white group-hover:text-red-600 transition-colors"/> 
                                TATİLİ DURDUR
                            </button>
                        </div>

                        {/* RIGHT CONTENT (RECENT MATCHES & CALENDAR) */}
                        <div className="flex-1 bg-[#121519] flex flex-col">
                            
                            {/* Recent Matches Section */}
                            <div className="flex-1 p-6 overflow-hidden flex flex-col">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Trophy size={16}/> Son Maçlar
                                </h3>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                    {/* GRID HEADER ROW (LIKE FIXTURES VIEW) */}
                                    <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase px-3 py-1 bg-[#21242c] rounded border border-slate-700/50">
                                        <div className="col-span-3">Tarih</div>
                                        <div className="col-span-2">Org.</div>
                                        <div className="col-span-2 text-right">Ev Sahibi</div>
                                        <div className="col-span-1 text-center">Skor</div>
                                        <div className="col-span-2 text-left">Deplasman</div>
                                        <div className="col-span-2 text-right">Goller</div>
                                    </div>

                                    {recentMatches.map((f) => {
                                        const isHome = f.homeTeamId === gameState.myTeamId;
                                        const homeTeam = gameState.teams.find(t => t.id === f.homeTeamId); 
                                        const awayTeam = gameState.teams.find(t => t.id === f.awayTeamId); 
                                        const compDetails = getCompetitionDetails(f.competitionId);
                                        const CompIcon = compDetails.icon;

                                        // Result Logic
                                        const myScore = isHome ? f.homeScore! : f.awayScore!;
                                        const opScore = isHome ? f.awayScore! : f.homeScore!;
                                        let resultColor = 'text-slate-400';
                                        let borderColor = 'border-slate-700/50';

                                        if (myScore > opScore) {
                                            resultColor = 'text-green-500';
                                            borderColor = 'border-green-900/30';
                                        } else if (myScore < opScore) {
                                            resultColor = 'text-red-500';
                                            borderColor = 'border-red-900/30';
                                        } else {
                                            resultColor = 'text-yellow-500';
                                            borderColor = 'border-yellow-900/30';
                                        }

                                        // Penalties check
                                        const showPK = f.pkHome !== undefined && f.pkAway !== undefined;

                                        // Scorers Text
                                        let scorersText = "";
                                        if (f.played && f.matchEvents) {
                                            const goals = f.matchEvents.filter(e => e.type === 'GOAL');
                                            scorersText = goals.map(g => `${g.scorer?.split(' ').pop()} ${g.minute}'`).join(', ');
                                            if (scorersText.length > 25) scorersText = scorersText.substring(0, 22) + "...";
                                        }

                                        return (
                                            <div key={f.id} className={`grid grid-cols-12 gap-2 items-center p-3 rounded-lg border bg-[#1a1e24] relative group hover:border-slate-600 transition-colors ${borderColor} animate-in slide-in-from-right-4`}>
                                                
                                                {/* Date */}
                                                <div className="col-span-3 text-xs font-medium text-slate-400">
                                                    {getFormattedDate(f.date).label}
                                                </div>
                                                
                                                {/* Competition */}
                                                <div className="col-span-2 flex items-center gap-1.5 overflow-hidden">
                                                     <CompIcon size={12} className={compDetails.color} />
                                                     <span className="text-[10px] font-bold text-slate-300 uppercase truncate" title={compDetails.name}>{compDetails.name}</span>
                                                </div>

                                                {/* Home Team */}
                                                <div className="col-span-2 flex items-center justify-end gap-2 text-right">
                                                     <span className={`text-xs font-bold truncate ${f.homeTeamId === gameState.myTeamId ? 'text-yellow-500' : 'text-slate-200'}`}>{homeTeam?.name}</span>
                                                     {homeTeam?.logo ? <img src={homeTeam.logo} className="w-5 h-5 object-contain"/> : <div className={`w-4 h-4 rounded-full ${homeTeam?.colors[0]}`}></div>}
                                                </div>

                                                {/* Score */}
                                                <div className="col-span-1 flex justify-center flex-col items-center">
                                                     <div className={`bg-[#111] px-2 py-0.5 rounded text-sm font-black font-mono border border-[#333] ${resultColor}`}>
                                                        {f.homeScore}-{f.awayScore}
                                                     </div>
                                                     {showPK && <span className="text-[8px] text-yellow-500 font-mono mt-0.5">P: {f.pkHome}-{f.pkAway}</span>}
                                                </div>

                                                {/* Away Team */}
                                                <div className="col-span-2 flex items-center justify-start gap-2 text-left">
                                                     {awayTeam?.logo ? <img src={awayTeam.logo} className="w-5 h-5 object-contain"/> : <div className={`w-4 h-4 rounded-full ${awayTeam?.colors[0]}`}></div>}
                                                     <span className={`text-xs font-bold truncate ${f.awayTeamId === gameState.myTeamId ? 'text-yellow-500' : 'text-slate-200'}`}>{awayTeam?.name}</span>
                                                </div>

                                                {/* Scorers */}
                                                <div className="col-span-2 text-[9px] text-slate-500 truncate text-right" title={scorersText}>
                                                    {scorersText || '-'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {recentMatches.length === 0 && (
                                        <div className="text-center text-slate-600 italic mt-10">Henüz oynanmış maç yok.</div>
                                    )}
                                </div>
                            </div>

                            {/* Upcoming Schedule Strip */}
                            <div className="h-44 bg-[#0d1014] border-t border-slate-800 p-4 shrink-0">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <CalendarIcon size={14}/> Gelecek Program
                                </h3>
                                <div className="flex gap-2 h-full">
                                    {calendarDays.map((day, i) => {
                                        const dateLabel = getFormattedDate(day.date).label.split(' ');
                                        const f = day.fixture;
                                        const isMatch = !!f;
                                        
                                        // Find teams
                                        let homeTeam, awayTeam;
                                        if (f) {
                                            homeTeam = gameState.teams.find(t => t.id === f.homeTeamId);
                                            awayTeam = gameState.teams.find(t => t.id === f.awayTeamId);
                                        }

                                        return (
                                            <div key={i} className={`flex-1 rounded-lg border flex flex-col items-center justify-center gap-1 transition-colors ${isMatch ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-[#1a1e24] border-slate-700/50 opacity-60'}`}>
                                                {/* Date Header */}
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">{dateLabel[1].substring(0,3)}</span>
                                                
                                                {/* Content Body */}
                                                {isMatch && homeTeam && awayTeam ? (
                                                    <div className="flex flex-col items-center justify-center flex-1 w-full">
                                                        {f.played ? (
                                                            // SCORE VIEW
                                                            <div className="flex flex-col items-center animate-in zoom-in">
                                                                <span className={`text-lg font-black ${f.homeScore! > f.awayScore! && f.homeTeamId === gameState.myTeamId ? 'text-green-500' : f.awayScore! > f.homeScore! && f.awayTeamId === gameState.myTeamId ? 'text-green-500' : f.homeScore === f.awayScore ? 'text-yellow-500' : 'text-red-500'}`}>
                                                                    {f.homeScore}-{f.awayScore}
                                                                </span>
                                                                <div className="flex gap-1 mt-0.5">
                                                                    {/* Mini Logos next to score */}
                                                                    {homeTeam.logo ? <img src={homeTeam.logo} className="w-3 h-3 object-contain"/> : <div className={`w-3 h-3 rounded-full ${homeTeam.colors[0]}`}></div>}
                                                                    {awayTeam.logo ? <img src={awayTeam.logo} className="w-3 h-3 object-contain"/> : <div className={`w-3 h-3 rounded-full ${awayTeam.colors[0]}`}></div>}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            // PREVIEW VIEW (LOGOS)
                                                            <div className="flex items-center gap-2">
                                                                {homeTeam.logo ? (
                                                                    <img src={homeTeam.logo} className="w-8 h-8 object-contain drop-shadow-md" alt={homeTeam.name}/>
                                                                ) : (
                                                                    <div className={`w-8 h-8 rounded-full ${homeTeam.colors[0]} flex items-center justify-center text-[10px] font-bold text-white`}>{homeTeam.name.charAt(0)}</div>
                                                                )}
                                                                <span className="text-[10px] text-slate-500 font-bold">vs</span>
                                                                {awayTeam.logo ? (
                                                                    <img src={awayTeam.logo} className="w-8 h-8 object-contain drop-shadow-md" alt={awayTeam.name}/>
                                                                ) : (
                                                                    <div className={`w-8 h-8 rounded-full ${awayTeam.colors[0]} flex items-center justify-center text-[10px] font-bold text-white`}>{awayTeam.name.charAt(0)}</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // NO MATCH VIEW (Just Date Number)
                                                    <span className="text-xl font-black text-slate-500">{dateLabel[0]}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div className="flex-1 flex items-center justify-center">
                                        <ChevronRight size={20} className="text-slate-600"/>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            )}

            {/* GLOBAL UI ALERT COMPONENT */}
            {gameState.uiAlert && (
                <CustomAlert 
                    alert={gameState.uiAlert} 
                    onClose={() => setGameState(prev => ({ ...prev, uiAlert: null }))} 
                />
            )}

            {/* Board Interaction Modal */}
            {boardInteraction && myTeam && (
                <BoardInteractionModal 
                    interaction={boardInteraction} 
                    board={myTeam.board} 
                    onClose={() => setBoardInteraction(null)}
                />
            )}

            {/* Season Champion Celebration Modal - ONLY SHOW ON HOME VIEW */}
            {gameState.seasonChampion && currentView === 'home' && (
                <ChampionCelebrationModal 
                    champion={gameState.seasonChampion} 
                    onClose={handleCloseCelebration}
                    isUserChampion={gameState.seasonChampion.teamId === gameState.myTeamId} // Add this
                />
            )}

            {/* Season Summary Modal */}
            {gameState.lastSeasonSummary && (
                <SeasonSummaryModal
                    summary={gameState.lastSeasonSummary}
                    onClose={handleCloseSeasonSummary}
                />
            )}

            {/* Game Over Screen */}
            {(currentView === 'game_over' || gameOverReason) && (
                <div className={`h-full flex items-center justify-center p-8 absolute inset-0 z-50 overflow-y-auto ${gameOverReason?.includes('emekli') || gameOverReason?.includes('feshettin') ? 'bg-slate-900' : 'bg-red-950'} text-white`}>
                    {showGameOverHoF && gameState.manager && (
                        <HallOfFameModal manager={gameState.manager} onClose={() => setShowGameOverHoF(false)} />
                    )}
                    <div className={`max-w-4xl w-full border-4 p-8 rounded-2xl text-center shadow-2xl animate-in zoom-in duration-500 ${gameOverReason?.includes('emekli') || gameOverReason?.includes('feshettin') ? 'bg-slate-800 border-slate-600' : 'bg-red-900 border-red-700'}`}>
                        {gameOverReason?.includes('emekli') || gameOverReason?.includes('feshettin') ? (
                            <Trophy size={80} className="mx-auto mb-6 text-yellow-400 animate-bounce"/>
                        ) : (
                            <FileWarning size={80} className="mx-auto mb-6 text-red-300 animate-pulse"/>
                        )}
                        <h1 className="text-5xl font-bold mb-6 tracking-widest uppercase">
                            {gameOverReason?.includes('emekli') ? "Efsanevi Veda" : gameOverReason?.includes('feshettin') ? "Sözleşme Feshi" : "Kovuldunuz"}
                        </h1>
                        <p className={`text-2xl font-serif italic mb-8 border-l-4 pl-4 text-left p-4 rounded ${gameOverReason?.includes('emekli') || gameOverReason?.includes('feshettin') ? 'border-yellow-500 bg-slate-700/50' : 'border-red-500 bg-red-800/50'}`}>
                            "{gameOverReason}"
                        </p>
                        {gameState.manager && (
                            <div className="bg-black/30 p-6 rounded-xl mb-8">
                                <h3 className="text-xl font-bold mb-4 border-b border-white/20 pb-2 text-left uppercase text-slate-300">Kariyer İstatistikleri</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <div className="text-2xl font-bold flex items-center justify-center gap-1">{gameState.manager.stats.leagueTitles} <Trophy size={16} className="text-yellow-400"/></div>
                                        <div className="text-[10px] uppercase text-slate-400 mt-1 font-bold">Lig Şampiyonluğu</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <div className="text-2xl font-bold flex items-center justify-center gap-1">{gameState.manager.stats.domesticCups} <Trophy size={16} className="text-blue-400"/></div>
                                        <div className="text-[10px] uppercase text-slate-400 mt-1 font-bold">Kupa</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <div className="text-2xl font-bold text-green-400">{gameState.manager.stats.wins}</div>
                                        <div className="text-[10px] uppercase text-slate-400 mt-1 font-bold">Galibiyet</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <div className="text-2xl font-bold text-slate-200">{gameState.manager.stats.matchesManaged}</div>
                                        <div className="text-[10px] uppercase text-slate-400 mt-1 font-bold">Maç Sayısı</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <div className="text-xl font-bold text-emerald-400 flex items-center justify-center gap-1"><Wallet size={16}/> {gameState.manager.stats.careerEarnings.toFixed(1)} M€</div>
                                        <div className="text-[10px] uppercase text-slate-400 mt-1 font-bold">Toplam Kazanç</div>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-lg">
                                        <div className="text-xl font-bold flex items-center justify-center gap-1"><Clock size={16}/> {formatTime(gameState.playTime)}</div>
                                        <div className="text-[10px] uppercase text-slate-400 mt-1 font-bold">Oynama Süresi</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-center gap-6">
                            <button onClick={() => setShowGameOverHoF(true)} className="px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-lg flex items-center gap-2 bg-yellow-600 text-white hover:bg-yellow-500"><Crown size={24}/> ONUR TABLOSU</button>
                            <button onClick={handleNewGame} className={`px-8 py-4 rounded-xl font-bold text-xl transition-all shadow-lg flex items-center gap-2 ${gameOverReason?.includes('emekli') || gameOverReason?.includes('feshettin') ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-white text-red-900 hover:bg-slate-200'}`}><LogOut size={24}/> YENİ KARİYER</button>
                        </div>
                    </div>
                </div>
            )}

            {currentView === 'home' && myTeam && (
                <HomeView 
                    manager={gameState.manager!} 
                    team={myTeam} 
                    teams={gameState.teams} 
                    myTeamId={myTeam.id} 
                    currentWeek={gameState.currentWeek} 
                    fixtures={gameState.fixtures}
                    onTeamClick={handleShowTeamDetail}
                    onFixtureClick={(f) => setSelectedFixtureForDetail(f)}
                    playTime={gameState.playTime}
                    onRetire={handleRetire}
                    onTerminateContract={handleTerminateContract}
                    onUpdateManagerContract={handleManagerContractUpdate} 
                    onShowAlert={handleShowAlert} // PASS ALERT HANDLER
                />
            )}
            
            {currentView === 'competitions' && myTeam && (
                <LeagueCupView 
                    teams={gameState.teams}
                    fixtures={gameState.fixtures}
                    myTeamId={myTeam.id}
                    currentWeek={gameState.currentWeek}
                    currentDate={gameState.currentDate}
                    onTeamClick={handleShowTeamDetail}
                    onFixtureClick={(f) => setSelectedFixtureForDetail(f)}
                    myTeam={myTeam}
                    onPlayerClick={handleShowPlayerDetail}
                    initialCompetitionId={targetCompetitionId} 
                    savedState={competitionViewState} // PASS STATE
                    onSaveState={setCompetitionViewState} // PASS SETTER
                />
            )}
            
            {currentView === 'squad' && myTeam && (
                <SquadView 
                    team={myTeam} 
                    onPlayerClick={handleShowPlayerDetail}
                    manager={gameState.manager!} 
                    currentWeek={gameState.currentWeek}
                    savedState={squadViewState}
                    onSaveState={setSquadViewState}
                />
            )}

            {currentView === 'objectives' && myTeam && (
                <ClubObjectivesView 
                    team={myTeam}
                    manager={gameState.manager!}
                    currentSeason={currentSeasonString} // Updated prop
                    fixtures={gameState.fixtures}
                    currentWeek={gameState.currentWeek}
                    teams={gameState.teams} 
                />
            )}

            {currentView === 'tactics' && myTeam && (
                <TacticsView 
                    team={myTeam} 
                    setTeam={(updatedTeam) => {
                        setGameState(prev => ({
                            ...prev,
                            teams: prev.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t)
                        }));
                    }} 
                    currentWeek={gameState.currentWeek}
                />
            )}

            {currentView === 'health_center' && myTeam && (
                <HealthCenterView 
                    team={myTeam} 
                    currentWeek={gameState.currentWeek} 
                    onPlayerClick={handleShowPlayerDetail}
                />
            )}

            {currentView === 'fixtures' && myTeam && (
                <FixturesView 
                    fixtures={gameState.fixtures} 
                    teams={gameState.teams} 
                    myTeamId={myTeam.id} 
                    currentWeek={gameState.currentWeek}
                    onTeamClick={handleShowTeamDetail}
                    onFixtureClick={(f) => setSelectedFixtureForDetail(f)}
                    onFixtureInfoClick={(f) => setSelectedFixtureInfo(f)}
                    onCompetitionClick={handleCompetitionClick} 
                    currentDate={gameState.currentDate} // PASS DATE
                    onGoOnHoliday={handleGoOnHoliday} // NEW PROP
                />
            )}
            
            {currentView === 'transfer' && myTeam && (
                <TransferView 
                    transferList={gameState.transferList} 
                    team={myTeam} 
                    budget={myTeam.budget}
                    isWindowOpen={isTransferWindowOpen}
                    onBuy={handleBuyPlayer}
                    onSell={handleSellPlayer}
                    onPlayerClick={handleShowPlayerDetail}
                    incomingOffers={gameState.incomingOffers || []}
                    onAcceptOffer={handleAcceptOffer}
                    onRejectOffer={handleRejectOffer}
                    onNegotiateOffer={handleNegotiateOffer}
                    savedState={transferViewState}
                    onSaveState={setTransferViewState}
                    allTeams={gameState.teams}
                    shortlist={gameState.shortlist}
                />
            )}

            {currentView === 'finance' && myTeam && (
                <FinanceView 
                    team={myTeam} 
                    manager={gameState.manager!}
                    onUpdateBudget={handleBudgetUpdate}
                    onUpdateSponsor={handleUpdateSponsor} 
                    onTakeLoan={handleTakeEmergencyLoan}
                    fixtures={gameState.fixtures}
                    currentWeek={gameState.currentWeek}
                    currentDate={gameState.currentDate}
                    onPlayerClick={handleShowPlayerDetail} 
                />
            )}

            {currentView === 'social' && (
                <SocialMediaView 
                    news={gameState.news} 
                    teams={gameState.teams}
                    messages={gameState.messages}
                    onUpdateMessages={(msgs) => setGameState(prev => ({ ...prev, messages: msgs }))}
                    onReply={handleMessageReply}
                    isTransferWindowOpen={isTransferWindowOpen}
                    myTeamId={gameState.myTeamId!} 
                />
            )}

            {currentView === 'training' && myTeam && (
                <TrainingView 
                    onTrain={handleTrain} 
                    performed={gameState.trainingPerformed}
                    team={myTeam}
                    manager={gameState.manager!}
                    onGoToDevelopment={() => navigateTo('development')}
                    onToggleDelegation={handleToggleTrainingDelegation}
                    lastReport={gameState.lastTrainingReport || []} 
                    onPlayerClick={handleShowPlayerDetail} 
                />
            )}

            {currentView === 'development' && myTeam && (
                <DevelopmentCenterView 
                    players={myTeam.players}
                    onAssignTraining={handleAssignIndividualTraining}
                    onAssignPositionTraining={handleAssignPositionTraining} 
                    currentWeek={gameState.currentWeek} 
                    onPlayerClick={handleShowPlayerDetail} // NEW: Pass handler
                />
            )}

            {currentView === 'team_detail' && selectedTeamForDetail && (
                <TeamDetailView 
                    team={selectedTeamForDetail} 
                    allTeams={gameState.teams}
                    fixtures={gameState.fixtures}
                    currentDate={gameState.currentDate}
                    currentWeek={gameState.currentWeek}
                    manager={gameState.manager!}
                    myTeamId={gameState.myTeamId!}
                    onClose={() => {
                        setSelectedTeamForDetail(null);
                        goBack();
                    }}
                    onPlayerClick={handleShowPlayerDetail} 
                    onTeamClick={handleShowTeamDetail}
                    onBoardRequest={handleBoardRequest}
                    yearsAtClub={gameState.yearsAtCurrentClub}
                    lastSeasonGoalAchieved={gameState.lastSeasonGoalAchieved}
                    consecutiveFfpYears={gameState.consecutiveFfpYears}
                    onFixtureClick={(f) => setSelectedFixtureForDetail(f)} 
                    onCompetitionClick={handleCompetitionClick} 
                />
            )}

            {currentView === 'my_team_detail' && myTeam && (
                <TeamDetailView 
                    team={myTeam} 
                    allTeams={gameState.teams}
                    fixtures={gameState.fixtures}
                    currentDate={gameState.currentDate}
                    currentWeek={gameState.currentWeek}
                    manager={gameState.manager!}
                    myTeamId={gameState.myTeamId!}
                    onClose={() => goBack()}
                    onPlayerClick={handleShowPlayerDetail} 
                    onTeamClick={handleShowTeamDetail}
                    onBoardRequest={handleBoardRequest}
                    yearsAtClub={gameState.yearsAtCurrentClub}
                    lastSeasonGoalAchieved={gameState.lastSeasonGoalAchieved}
                    consecutiveFfpYears={gameState.consecutiveFfpYears}
                    onFixtureClick={(f) => setSelectedFixtureForDetail(f)} 
                    onCompetitionClick={handleCompetitionClick} 
                />
            )}

            {currentView === 'player_detail' && selectedPlayerForDetail && (
                <PlayerDetailView 
                    player={selectedPlayerForDetail} 
                    onClose={() => goBack()}
                    myTeamId={gameState.myTeamId!} 
                    manager={gameState.manager!}
                    teammates={gameState.teams.find(t => t.id === selectedPlayerForDetail.teamId)?.players || []}
                    onInteract={handlePlayerInteraction}
                    onUpdatePlayer={handlePlayerUpdate}
                    onStartNegotiation={handleStartNegotiation}
                    onStartTransferNegotiation={handleStartTransferNegotiation} 
                    onReleasePlayer={handleReleasePlayer} 
                    currentWeek={gameState.currentWeek} 
                    fixtures={gameState.fixtures}
                    onCompetitionClick={handleCompetitionClick} 
                    isTransferWindowOpen={isTransferWindowOpen} 
                    shortlist={gameState.shortlist || []} 
                    onToggleShortlist={handleToggleShortlist} 
                />
            )}

            {currentView === 'contract_negotiation' && activeNegotiationPlayer && (
                <ContractNegotiationView
                    player={activeNegotiationPlayer}
                    onClose={() => {
                        setNegotiatingPlayer(null);
                        if(incomingTransfer) {
                            alert("Sözleşme görüşmesi iptal edildi. Transfer gerçekleşmedi.");
                            handleCancelTransfer(incomingTransfer.playerId); 
                            resetTo('home');
                        } else {
                            goBack();
                        }
                    }}
                    onFinish={handleFinishNegotiation}
                    maxAllowedWage={maxAllowedWage} 
                />
            )}

            {currentView === 'transfer_negotiation' && negotiatingTransferPlayer && myTeam && (
                <TransferOfferNegotiationView
                    player={negotiatingTransferPlayer}
                    targetTeam={getTargetTeamForNegotiation(negotiatingTransferPlayer.teamId)}
                    myTeamBudget={myTeam.budget}
                    myTeam={myTeam} 
                    onClose={() => {
                        setNegotiatingTransferPlayer(null);
                        goBack();
                    }}
                    onFinish={handleFinishTransferNegotiation}
                    mode={negotiationMode}
                    initialOfferAmount={initialSellOffer}
                    initialOfferType={negotiationOfferType} 
                />
            )}

            {currentView === 'match_preview' && myTeam && activeFixture && matchPreviewHomeTeam && matchPreviewAwayTeam && (
                <div className="h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto p-4 transition-colors duration-300">
                    <MatchPreview 
                        fixture={activeFixture}
                        homeTeam={matchPreviewHomeTeam}
                        awayTeam={matchPreviewAwayTeam}
                        onProceed={handleMatchProceed} 
                        onGoToTalk={handleGoToTalk} // Added Handler
                    />
                </div>
            )}

            {/* PRE-MATCH TALK VIEW ROUTE */}
            {currentView === 'pre_match_talk' && myTeam && talkOpponent && (
                <div className="h-full">
                    <PreMatchTalkView 
                        team={myTeam}
                        opponent={talkOpponent}
                        managerName={gameState.manager?.name || 'Menajer'}
                        onComplete={(moraleChange) => {
                            setGameState(prev => ({
                                ...prev,
                                teams: prev.teams.map(t => t.id === myTeam.id ? { 
                                    ...t, 
                                    players: t.players.map(p => ({ ...p, morale: Math.min(100, Math.max(0, p.morale + moraleChange)) }))
                                } : t)
                            }));
                        }}
                        onProceedToLockerRoom={() => navigateTo('locker_room')}
                    />
                </div>
            )}

            {currentView === 'locker_room' && myTeam && (
                <div className="h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
                    < LockerRoomView 
                        team={myTeam} 
                        setTeam={(updatedTeam) => {
                            setGameState(prev => ({
                                ...prev,
                                teams: prev.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t)
                            }));
                        }}
                        onStartMatch={() => navigateTo('match_live')}
                        onSimulateMatch={handleFastSimulateWrapper}
                        currentWeek={gameState.currentWeek}
                        nextMatchCompetitionId={activeFixture?.competitionId}
                    />
                </div>
            )}

            {currentView === 'match_live' && myTeam && activeFixture && matchPreviewHomeTeam && matchPreviewAwayTeam && (
                <div className="h-full w-full bg-black">
                    <MatchSimulation 
                        homeTeam={matchPreviewHomeTeam}
                        awayTeam={matchPreviewAwayTeam}
                        userTeamId={myTeam.id}
                        onFinish={handleMatchFinishWrapper}
                        allTeams={gameState.teams}
                        fixtures={gameState.fixtures}
                        managerTrust={gameState.manager?.trust.players || 50}
                        fixtureId={gameState.activeFixtureId || activeFixture.id}
                        isPaused={isMatchPaused} // PASS PAUSE STATE
                        isTacticsOpen={isTacticsOpen} // PASS TACTICS STATE
                        setIsTacticsOpen={setIsTacticsOpen} // PASS SETTER
                        onPhaseChange={setLiveMatchPhase} // Report Phase
                        matchActionSignal={matchActionSignal} // Pass Action Signal
                        onActionSignalHandled={() => setMatchActionSignal(null)} // Reset Signal
                        onMatchBlockingStateChange={setIsMatchActionBlocked} // Pass Blocking Setter (Fix for forced sub bug)
                        previousLegScore={previousLegScore} // NEW: Pass Previous Leg Score
                    />
                </div>
            )}

            {currentView === 'match_result' && matchResultData && (
                <MatchResultModal 
                    homeTeam={matchResultData.homeTeam}
                    awayTeam={matchResultData.awayTeam}
                    homeScore={matchResultData.homeScore}
                    awayScore={matchResultData.awayScore}
                    stats={matchResultData.stats}
                    events={matchResultData.events}
                    onProceed={() => navigateTo('interview')}
                    onSkip={handleSkipInterview}
                    competitionId={matchResultData.competitionId}
                    aggregateScore={matchResultData.aggregateScore} // Pass aggregateScore
                />
            )}

            {currentView === 'interview' && matchResultData && (
                <PostMatchInterview 
                    result={matchResultData.homeScore > matchResultData.awayScore ? (matchResultData.homeTeam.id === myTeam?.id ? 'WIN' : 'LOSS') : matchResultData.homeScore < matchResultData.awayScore ? (matchResultData.homeTeam.id === myTeam?.id ? 'LOSS' : 'WIN') : 'DRAW'}
                    onClose={handleSkipInterview}
                    onComplete={handleInterviewComplete}
                    events={matchResultData.events}
                    homeTeam={matchResultData.homeTeam}
                    awayTeam={matchResultData.awayTeam}
                    myTeamId={myTeam?.id || ''}
                    managerTrust={gameState.manager?.trust.players || 50}
                />
            )}

            {selectedFixtureForDetail && (
                <MatchDetailModal 
                    fixture={selectedFixtureForDetail} 
                    teams={gameState.teams} 
                    onClose={() => setSelectedFixtureForDetail(null)} 
                    allFixtures={gameState.fixtures} // NEW PROP
                />
            )}

            {selectedFixtureInfo && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setSelectedFixtureInfo(null)}>
                    <div className="w-full max-w-md h-full" onClick={e => e.stopPropagation()}>
                        <FixtureDetailPanel 
                            fixture={selectedFixtureInfo}
                            homeTeam={gameState.teams.find(t => t.id === selectedFixtureInfo.homeTeamId)!}
                            awayTeam={gameState.teams.find(t => t.id === selectedFixtureInfo.awayTeamId)!}
                            allFixtures={gameState.fixtures}
                            onClose={() => setSelectedFixtureInfo(null)}
                            variant="modal"
                            myTeamId={gameState.myTeamId!}
                            onTeamClick={handleShowTeamDetail}
                        />
                    </div>
                </div>
            )}

        </Dashboard>
    );
};

export default MainContent;