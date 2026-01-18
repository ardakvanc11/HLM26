
import React, { useState, useEffect } from 'react';
import { GameState, Team, Player, Fixture, MatchEvent, MatchStats, PendingTransfer, SponsorDeal, IncomingOffer, TrainingConfig, IndividualTrainingType, BoardInteraction, Position } from '../types';
import { FileWarning, LogOut, Trophy, Building2, BarChart3, ArrowRightLeft, Wallet, Clock, TrendingUp, TrendingDown, Crown } from 'lucide-react';
import { isSameDay } from '../utils/calendarAndFixtures';

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
import MatchSimulation from '../views/MatchSimulation';
import PostMatchInterview from '../views/PostMatchInterview';
import HealthCenterView from '../views/HealthCenterView';
import ContractNegotiationView from '../views/ContractNegotiationView'; 
import TransferOfferNegotiationView from '../views/TransferOfferNegotiationView';
import LeagueCupView from '../views/LeagueCupView';
import ClubObjectivesView from '../views/ClubObjectivesView'; // New View

// Layouts & Modals
import Dashboard from '../layout/Dashboard';
import MatchDetailModal from '../modals/MatchDetailModal';
import MatchResultModal from '../modals/MatchResultModal';
import HallOfFameModal from '../modals/HallOfFameModal';
import FixtureDetailPanel from './shared/FixtureDetailPanel';
import ChampionCelebrationModal from '../modals/ChampionCelebrationModal'; 
import SeasonSummaryModal from '../modals/SeasonSummaryModal';
import BoardInteractionModal from '../modals/BoardInteractionModal'; // NEW

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
    boardInteraction: BoardInteraction | null; // NEW
    setBoardInteraction: React.Dispatch<React.SetStateAction<BoardInteraction | null>>; // NEW
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    navigateTo: (view: string) => void;
    goBack: () => void;
    goForward: () => void;
    handleStart: (name: string, year: string, country: string) => void;
    handleSelectTeam: (id: string) => void;
    handleSave: () => void;
    handleNewGame: () => void;
    handleNextWeek: () => void;
    handleTrain: (config: TrainingConfig) => void; 
    handleAssignIndividualTraining: (playerId: string, type: IndividualTrainingType) => void; 
    handleAssignPositionTraining: (playerId: string, target: Position, weeks: number) => void; // NEW
    handleMatchFinish: (hScore: number, aScore: number, events: MatchEvent[], stats: MatchStats, fixtureId?: string) => void;
    handleFastSimulate: (fixtureId?: string) => void; // UPDATED TYPE
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
    handleAcceptOffer: (offer: IncomingOffer) => void;
    handleRejectOffer: (offer: IncomingOffer) => void;
    handleToggleTrainingDelegation: () => void;
    handleBoardRequest: (type: string, isDebug?: boolean) => void; // NEW
    negotiatingTransferPlayer: Player | null; 
    setNegotiatingTransferPlayer: React.Dispatch<React.SetStateAction<Player | null>>; 
    incomingTransfer: PendingTransfer | null; 
    setIncomingTransfer: React.Dispatch<React.SetStateAction<PendingTransfer | null>>;
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
        goBack,
        goForward,
        handleStart,
        handleSelectTeam,
        handleSave,
        handleNewGame,
        handleNextWeek,
        handleTrain,
        handleAssignIndividualTraining,
        handleAssignPositionTraining, // NEW
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
        negotiatingTransferPlayer,
        setNegotiatingTransferPlayer,
        incomingTransfer,
        setIncomingTransfer,
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

    // FIX: Lock the match ID when entering the match flow to prevent switching to the next match mid-process
    const [playingFixtureId, setPlayingFixtureId] = useState<string | null>(null);

    // State to handle direct navigation to a specific competition (e.g. from player stats)
    const [targetCompetitionId, setTargetCompetitionId] = useState<string | null>(null);

    // Reset locked match when returning to home to avoid stale state
    useEffect(() => {
        if (currentView === 'home') {
            setPlayingFixtureId(null);
            setTargetCompetitionId(null);
        }
    }, [currentView]);

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

    // Handler for clicking competition in player stats OR fixture list
    const handleCompetitionClick = (compId: string) => {
        setTargetCompetitionId(compId);
        navigateTo('competitions');
    };

    // Contract Negotiation Handlers
    const handleStartNegotiation = (player: Player) => {
        setNegotiatingPlayer(player);
        navigateTo('contract_negotiation');
    };

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
                alert(`Görüşmeler başarısız oldu. Oyuncu ${cooldownWeeks} hafta boyunca yeni tekliflere kapalı olacak.`);
                setNegotiatingPlayer(null);
                goBack();
            } else if (incomingTransfer) {
                handlePlayerUpdate(incomingTransfer.playerId, {
                    nextNegotiationWeek: nextWeek
                });
                alert(`Anlaşma sağlanamadı. ${cooldownWeeks} hafta boyunca tekrar teklif yapılamaz.`);
                
                handleCancelTransfer(incomingTransfer.playerId);
                navigateTo('home');
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
        if (playingFixtureId) {
            return gameState.fixtures.find(f => f.id === playingFixtureId);
        }
        const todayMatch = gameState.fixtures.find(f => 
            (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId) && 
            !f.played && 
            isSameDay(f.date, gameState.currentDate)
        );
        if (todayMatch) return todayMatch;
        return gameState.fixtures.find(f => (f.homeTeamId === gameState.myTeamId || f.awayTeamId === gameState.myTeamId) && !f.played);
    }

    const activeMatchFixture = getActiveFixture();
    const matchPreviewHomeTeam = activeMatchFixture ? gameState.teams.find(t => t.id === activeMatchFixture.homeTeamId) : null;
    const matchPreviewAwayTeam = activeMatchFixture ? gameState.teams.find(t => t.id === activeMatchFixture.awayTeamId) : null;

    // Wrapped Handlers for Match Locking
    const handleMatchProceed = () => {
        if (activeMatchFixture) {
            setPlayingFixtureId(activeMatchFixture.id); 
            navigateTo('locker_room');
        }
    };

    const handleMatchFinishWrapper = (hScore: number, aScore: number, events: MatchEvent[], stats: MatchStats, fixtureId?: string) => {
        const targetId = fixtureId || playingFixtureId;
        handleMatchFinish(hScore, aScore, events, stats, targetId || undefined);
        setPlayingFixtureId(null); 
    };

    const handleFastSimulateWrapper = () => {
        if (playingFixtureId) {
            handleFastSimulate(playingFixtureId);
            setPlayingFixtureId(null);
        } else {
            handleFastSimulate();
        }
    };

    return (
        <Dashboard 
            state={gameState} 
            onNavigate={(view) => {
                if (view === 'competitions') {
                    setTargetCompetitionId(null);
                }
                navigateTo(view);
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
        >
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
                    initialCompetitionId={targetCompetitionId} // PASS PROP
                />
            )}
            
            {currentView === 'squad' && myTeam && (
                <SquadView 
                    team={myTeam} 
                    onPlayerClick={handleShowPlayerDetail}
                    manager={gameState.manager!} 
                    currentWeek={gameState.currentWeek}
                />
            )}

            {currentView === 'objectives' && myTeam && (
                <ClubObjectivesView 
                    team={myTeam}
                    manager={gameState.manager!}
                    currentSeason="2025/26"
                    fixtures={gameState.fixtures}
                    currentWeek={gameState.currentWeek}
                    teams={gameState.teams} // PASS TEAMS HERE
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
                    onCompetitionClick={handleCompetitionClick} // NEW PROP
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
                />
            )}

            {currentView === 'development' && myTeam && (
                <DevelopmentCenterView 
                    players={myTeam.players}
                    onAssignTraining={handleAssignIndividualTraining}
                    onAssignPositionTraining={handleAssignPositionTraining} // NEW
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
                    onCompetitionClick={handleCompetitionClick} // PASS HANDLER
                    isTransferWindowOpen={isTransferWindowOpen} // PASS PROP
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
                            navigateTo('home');
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
                    initialOfferType={negotiationOfferType} // PASS PROP
                />
            )}

            {currentView === 'match_preview' && myTeam && activeMatchFixture && matchPreviewHomeTeam && matchPreviewAwayTeam && (
                <div className="h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto p-4 transition-colors duration-300">
                    <MatchPreview 
                        fixture={activeMatchFixture}
                        homeTeam={matchPreviewHomeTeam}
                        awayTeam={matchPreviewAwayTeam}
                        onProceed={handleMatchProceed} // Lock Match ID here
                    />
                </div>
            )}

            {currentView === 'locker_room' && myTeam && (
                <div className="h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
                    <LockerRoomView 
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
                    />
                </div>
            )}

            {currentView === 'match_live' && myTeam && activeMatchFixture && matchPreviewHomeTeam && matchPreviewAwayTeam && (
                <div className="h-full w-full bg-black">
                    <MatchSimulation 
                        homeTeam={matchPreviewHomeTeam}
                        awayTeam={matchPreviewAwayTeam}
                        userTeamId={myTeam.id}
                        onFinish={handleMatchFinishWrapper}
                        allTeams={gameState.teams}
                        fixtures={gameState.fixtures}
                        managerTrust={gameState.manager?.trust.players || 50}
                        fixtureId={playingFixtureId || activeMatchFixture.id} // Pass locked ID
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
                    competitionId={matchResultData.competitionId} // PASS PROP
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
