

import { useCoreState } from './useCoreState';
import { useNavigation } from './useNavigation';
import { useGameLifecycle } from './useGameLifecycle';
import { useMatchLogic } from './useMatchLogic';
import { usePlayerActions } from './usePlayerActions';
import { useFinance } from './useFinance';
import { isTransferWindowOpen } from '../utils/calendarAndFixtures';
import { Team, Player, Fixture, BoardInteraction, Position } from '../types';

export const useGameState = () => {
    // 1. Core State
    const core = useCoreState();

    // 2. Navigation
    const nav = useNavigation(
        (count) => core.setGameState(prev => ({ ...prev, lastSeenInjuryCount: count })),
        core.gameState
    );

    // Helpers
    const handleShowTeamDetail = (teamId: string) => {
        const t = core.gameState.teams.find(x => x.id === teamId);
        if (t) { core.setSelectedTeamForDetail(t); nav.navigateTo('team_detail'); }
    };

    const handleShowPlayerDetail = (player: Player) => {
        core.setSelectedPlayerForDetail(player);
        nav.navigateTo('player_detail');
    };

    // 3. Sub-Hooks
    const lifecycle = useGameLifecycle(core.gameState, core.setGameState, nav, core);
    const matchLogic = useMatchLogic(core.gameState, core.setGameState, nav, core);
    const playerActions = usePlayerActions(core.gameState, core.setGameState, nav, core);
    const finance = useFinance(core.gameState, core.setGameState);

    // Derived State
    const myTeam = core.gameState.teams.find(t => t.id === core.gameState.myTeamId);
    const injuredBadgeCount = myTeam ? myTeam.players.filter(p => p.injury && p.injury.daysRemaining > 0).length - core.gameState.lastSeenInjuryCount : 0;

    const handleBoardRequest = (type: string, isDebug: boolean = false) => {
        if (!myTeam || !core.gameState.manager) return;

        const managerPower = core.gameState.manager.power;
        const yearsAtClub = core.gameState.yearsAtCurrentClub;
        const currentRep = myTeam.reputation;
        const lastGoalAchieved = core.gameState.lastSeasonGoalAchieved;

        let managerMessage = "";
        let requestLabel = "";
        let update: any = {};
        
        // Randomization: 70% Accept, 30% Reject
        const isSuccessfulRoll = isDebug || Math.random() < 0.7;

        switch (type) {
            case 'NEW_STADIUM':
                requestLabel = "Yeni Stadyum İnşası";
                managerMessage = "Başkanım, stadımız artık bu şehrin büyüklüğünü kaldıramıyor. Taraftarımız dışarıda kalıyor. Modern ve daha büyük bir stadyum için projeye başlamalıyız.";
                update = {
                    stadiumCapacity: myTeam.stadiumCapacity + 15000,
                    stadiumName: "Yeni " + myTeam.stadiumName,
                    boardRequests: { ...myTeam.boardRequests, stadiumBuilt: true }
                };
                break;
            case 'UPGRADE_TRAINING':
                requestLabel = "Antrenman Tesislerini Geliştirme";
                managerMessage = "Oyuncularımın potansiyellerine ulaşması için mevcut tesisler yetersiz kalıyor. Teknolojiyi tesislerimize entegre edip antrenman verimini artırmalıyız.";
                update = {
                    facilities: { ...myTeam.facilities, trainingLevel: Math.min(20, myTeam.facilities.trainingLevel + 1) },
                    boardRequests: { 
                        ...myTeam.boardRequests, 
                        trainingUpgradesCount: myTeam.boardRequests.trainingUpgradesCount + 1,
                        trainingLastRep: currentRep
                    }
                };
                break;
            case 'UPGRADE_YOUTH':
                requestLabel = "Altyapı Akademisi Yatırımı";
                managerMessage = "Kulübün geleceği altyapıda. Akademimizdeki ekipmanları ve sahaları yenileyerek kendi yıldızlarımızı yetiştirmek için daha iyi bir ortam sağlamalıyız.";
                update = {
                    facilities: { ...myTeam.facilities, youthLevel: Math.min(20, myTeam.facilities.youthLevel + 1) },
                    boardRequests: { 
                        ...myTeam.boardRequests, 
                        youthUpgradesCount: myTeam.boardRequests.youthUpgradesCount + 1,
                        youthLastRep: currentRep
                    }
                };
                break;
            case 'INC_TRANSFER_BUDGET':
                requestLabel = "Ek Transfer Bütçesi";
                managerMessage = "Transfer döneminde elimiz zayıf kalıyor. Şampiyonluk yolunda kritik bir takviye için kasadan ek bütçe talep ediyorum.";
                update = { budget: myTeam.budget + 25 };
                break;
            case 'WAGE_PERCENTAGE':
                requestLabel = "Maaş Bütçesi Artışı";
                managerMessage = "Takımdaki yıldızları tutmak ve yeni transferlerin maaş dengesini bozmamak için maaş tavanımızı %15 oranında yükseltmemiz gerekiyor.";
                update = { wageBudget: (myTeam.wageBudget || 0) * 1.15 };
                break;
            case 'NEW_CONTRACT':
                requestLabel = "Yeni Sözleşme Görüşmesi";
                managerMessage = "Kulüpteki geleceğimi ve uzun vadeli projelerimi garanti altına almak istiyorum. Kariyerimi burada devam ettirmek adına yeni bir sözleşme talep ediyorum.";
                break;
        }

        // Response logic
        let boardResponse = "";
        if (isSuccessfulRoll) {
            const responses = [
                "Hocam, vizyonun bizi heyecanlandırıyor. İstediğin yatırımı onaylıyorum, hayırlı olsun.",
                "Bu kulübün sana güveni tam. Talebin kabul edilmiştir, gereği hemen yapılacak.",
                "Mantıklı bir talep. Kulübün menfaatleri doğrultusunda bu yatırımı yapma kararı aldık."
            ];
            boardResponse = responses[Math.floor(Math.random() * responses.length)];
            
            // Special Case for Contract Update logic
            if (type === 'NEW_CONTRACT') {
                const newSalary = core.gameState.manager.contract.salary * 1.25;
                const newExpiry = 2025 + core.gameState.yearsAtCurrentClub + 3;
                core.setGameState(prev => ({
                    ...prev,
                    manager: {
                        ...prev.manager!,
                        contract: { ...prev.manager!.contract, salary: parseFloat(newSalary.toFixed(2)), expires: newExpiry }
                    }
                }));
            } else {
                core.setGameState(prev => ({
                    ...prev,
                    teams: prev.teams.map(t => t.id === myTeam.id ? { ...t, ...update } : t)
                }));
            }
        } else {
            const rejections = [
                "Hocam şu anki mali tablomuz buna uygun değil. Sabırlı olman lazım.",
                "Talep haklı olabilir ama yönetim olarak önceliğimiz şu an bu değil. Reddedildi.",
                "Üzgünüm ama sportif başarıların şu an böyle bir yatırımı talep etmek için yeterli görülmedi."
            ];
            boardResponse = rejections[Math.floor(Math.random() * rejections.length)];
        }

        const interaction: BoardInteraction = {
            requestId: Math.random().toString(),
            requestType: requestLabel,
            managerMessage: managerMessage,
            boardResponse: boardResponse,
            status: isSuccessfulRoll ? 'ACCEPTED' : 'REJECTED'
        };

        core.setBoardInteraction(interaction);
    };

    return {
        // State
        gameState: core.gameState,
        setGameState: core.setGameState,
        viewHistory: nav.viewHistory,
        historyIndex: nav.historyIndex,
        currentView: nav.currentView,
        selectedPlayerForDetail: core.selectedPlayerForDetail,
        setSelectedPlayerForDetail: core.setSelectedPlayerForDetail,
        selectedTeamForDetail: core.selectedTeamForDetail,
        setSelectedTeamForDetail: core.setSelectedTeamForDetail,
        matchResultData: core.matchResultData,
        setMatchResultData: core.setMatchResultData,
        selectedFixtureForDetail: core.selectedFixtureForDetail,
        setSelectedFixtureForDetail: core.setSelectedFixtureForDetail,
        selectedFixtureInfo: core.selectedFixtureInfo,
        setSelectedFixtureInfo: core.setSelectedFixtureInfo,
        gameOverReason: core.gameOverReason,
        boardInteraction: core.boardInteraction,
        setBoardInteraction: core.setBoardInteraction,
        theme: core.theme,
        toggleTheme: core.toggleTheme,
        negotiatingTransferPlayer: core.negotiatingTransferPlayer,
        setNegotiatingTransferPlayer: core.setNegotiatingTransferPlayer,
        incomingTransfer: core.incomingTransfer,
        setIncomingTransfer: core.setIncomingTransfer,
        
        // UI Persistence
        transferViewState: core.transferViewState,
        setTransferViewState: core.setTransferViewState,
        squadViewState: core.squadViewState,
        setSquadViewState: core.setSquadViewState,
        competitionViewState: core.competitionViewState,
        setCompetitionViewState: core.setCompetitionViewState,

        // Match States
        liveMatchPhase: core.liveMatchPhase,
        setLiveMatchPhase: core.setLiveMatchPhase,
        matchActionSignal: core.matchActionSignal,
        setMatchActionSignal: core.setMatchActionSignal,

        myTeam,
        injuredBadgeCount: Math.max(0, injuredBadgeCount),
        isTransferWindowOpen: isTransferWindowOpen(core.gameState.currentDate),

        // Navigation
        navigateTo: nav.navigateTo,
        resetTo: nav.resetTo,
        goBack: nav.goBack,
        goForward: nav.goForward,

        // Handlers
        handleStart: lifecycle.handleStart,
        handleSelectTeam: lifecycle.handleSelectTeam,
        handleSave: lifecycle.handleSave,
        handleNewGame: lifecycle.handleNewGame,
        handleNextWeek: lifecycle.handleNextWeek,
        handleRetire: lifecycle.handleRetire,
        handleTerminateContract: lifecycle.handleTerminateContract,

        handleMatchFinish: matchLogic.handleMatchFinish,
        handleFastSimulate: matchLogic.handleFastSimulate,
        handleInterviewComplete: matchLogic.handleInterviewComplete,
        handleSkipInterview: matchLogic.handleSkipInterview,

        handleTrain: playerActions.handleTrain,
        handleAssignIndividualTraining: playerActions.handleAssignIndividualTraining, 
        handleAssignPositionTraining: playerActions.handleAssignPositionTraining, 
        handleToggleTrainingDelegation: playerActions.handleToggleTrainingDelegation, 
        handleBuyPlayer: playerActions.handleBuyPlayer,
        handleSellPlayer: playerActions.handleSellPlayer,
        handleAcceptOffer: playerActions.handleAcceptOffer,
        handleRejectOffer: playerActions.handleRejectOffer,
        handleTransferOfferSuccess: playerActions.handleTransferOfferSuccess,
        handleSignPlayer: playerActions.handleSignPlayer,
        handleReleasePlayer: playerActions.handleReleasePlayer,
        handlePlayerInteraction: playerActions.handlePlayerInteraction,
        handlePlayerUpdate: playerActions.handlePlayerUpdate,
        handleCancelTransfer: playerActions.handleCancelTransfer,
        handleMessageReply: playerActions.handleMessageReply,
        handleToggleShortlist: playerActions.handleToggleShortlist, 

        handleTakeEmergencyLoan: finance.handleTakeEmergencyLoan,
        handleUpdateSponsor: finance.handleUpdateSponsor,
        handleUpdateBudget: finance.handleUpdateBudget,

        handleBoardRequest, 

        // UI Handlers
        handleShowTeamDetail,
        handleShowPlayerDetail
    };
};