
import React from 'react';
import { GameState, Player, IncomingOffer, PendingTransfer, TrainingConfig, IndividualTrainingType, Position } from '../types';
import { calculateTransferStrengthImpact, recalculateTeamStrength, calculateMonthlyNetFlow, applyTraining } from '../utils/gameEngine';
import { generateStarSoldRiotTweets } from '../utils/newsAndSocial';

export const usePlayerActions = (
    gameState: GameState,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    navigation: any,
    coreSetters: any
) => {

    const handleTrain = (config: TrainingConfig) => {
        if(gameState.trainingPerformed) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        
        // Use updated applyTraining which returns { updatedTeam, report }
        const { updatedTeam: trainedTeam, report } = applyTraining(myTeam, config);
        
        const recalculatedTeam = recalculateTeamStrength(trainedTeam);
        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === recalculatedTeam.id ? recalculatedTeam : t),
            trainingPerformed: true,
            lastTrainingReport: report // Store the report
        }));
    };

    const handleToggleTrainingDelegation = () => {
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
        if (!myTeam) return;

        const updatedTeam = { ...myTeam, isTrainingDelegated: !myTeam.isTrainingDelegated };
        
        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t)
        }));
    };

    const handleAssignIndividualTraining = (playerId: string, type: IndividualTrainingType) => {
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
        if (!myTeam) return;

        const updatedPlayers = myTeam.players.map(p => {
            if (p.id === playerId) {
                return { ...p, activeTraining: type };
            }
            return p;
        });

        const updatedTeam = { ...myTeam, players: updatedPlayers };

        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t)
        }));
    };

    const handleAssignPositionTraining = (playerId: string, target: Position, weeks: number) => {
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId);
        if (!myTeam) return;

        const updatedPlayers = myTeam.players.map(p => {
            if (p.id === playerId) {
                return { 
                    ...p, 
                    positionTrainingTarget: target, 
                    positionTrainingRequired: weeks,
                    positionTrainingProgress: 0 
                };
            }
            return p;
        });

        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === myTeam.id ? { ...t, players: updatedPlayers } : t)
        }));
    };

    const handleBuyPlayer = (player: Player) => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        if (myTeam.budget >= player.value) {
            const newTransferList = gameState.transferList.filter(p => p.id !== player.id);
            // FIX: Clear clubName to remove 'Serbest' label from pitch visual
            const newPlayer = { ...player, teamId: myTeam.id, jersey: myTeam.jersey, clubName: undefined };
            const financials = { ...myTeam.financialRecords };
            financials.expense.transfers += player.value;
            let updatedTeam = { ...myTeam, budget: myTeam.budget - player.value, players: [...myTeam.players, newPlayer], financialRecords: financials };
            const impact = calculateTransferStrengthImpact(myTeam.strength, player.skill, true);
            const newVisibleStrength = Math.min(100, Math.max(0, myTeam.strength + impact));
            updatedTeam.strength = Number(newVisibleStrength.toFixed(1));
            updatedTeam = recalculateTeamStrength(updatedTeam);
            
            const updatedManager = { ...gameState.manager! };
            updatedManager.stats.moneySpent += player.value;
            updatedManager.stats.transferSpendThisMonth += player.value;
            updatedManager.stats.playersBought++;
            if (player.value > updatedManager.stats.recordTransferFee) updatedManager.stats.recordTransferFee = player.value;
            
            const dateObj = new Date(gameState.currentDate);
            const record: any = {
                date: `${dateObj.getDate()} ${dateObj.getMonth() === 6 ? 'Tem' : dateObj.getMonth() === 7 ? 'Ağu' : 'Eyl'}`,
                playerName: newPlayer.name,
                type: 'BOUGHT',
                counterparty: 'Serbest/Liste',
                price: `${newPlayer.value} M€`
            };
            updatedTeam.transferHistory = [...(updatedTeam.transferHistory || []), record];

            setGameState(prev => ({ ...prev, transferList: newTransferList, teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t), manager: updatedManager }));
            alert(`${player.name} takımınıza katıldı!`);
        } else alert("Bütçeniz yetersiz!");
    };

    const handleReleasePlayer = (player: Player, cost: number) => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        
        // --- KADRO DERİNLİĞİ KONTROLÜ (MİNİMUM 22 OYUNCU) ---
        if (myTeam.players.length <= 22) { 
            setGameState(prev => ({
                ...prev,
                uiAlert: {
                    title: "Yönetim Engeli: Kadro Yetersizliği",
                    message: "Yönetim Kurulu, kadro derinliğinin kritik seviyeye (22 oyuncu) düştüğünü tespit etti. Takımın rekabetçiliğini korumak adına, yeni bir transfer yapılmadan mevcut oyuncuların gönderilmesine izin verilmiyor.",
                    type: "error"
                }
            }));
            return; 
        }

        if (cost > 0 && myTeam.budget < cost) {
            alert(`Yetersiz Bütçe!\n\nBu oyuncuyu serbest bırakmak için ${cost.toFixed(2)} M€ tazminat ödemeniz gerekiyor ancak kasanızda ${myTeam.budget.toFixed(2)} M€ var.`);
            return;
        }

        const financials = { ...myTeam.financialRecords };
        if (cost > 0) {
            financials.expense.transfers += cost;
        }

        let updatedTeam = { 
            ...myTeam, 
            budget: myTeam.budget - cost, 
            players: myTeam.players.filter(p => p.id !== player.id), 
            financialRecords: financials 
        };

        const impact = calculateTransferStrengthImpact(myTeam.strength, player.skill, false);
        const newVisibleStrength = Math.min(100, Math.max(0, myTeam.strength + impact));
        updatedTeam.strength = Number(newVisibleStrength.toFixed(1));
        updatedTeam = recalculateTeamStrength(updatedTeam);

        const dateObj = new Date(gameState.currentDate);
        const record: any = {
            date: `${dateObj.getDate()} ${dateObj.getMonth() === 6 ? 'Tem' : dateObj.getMonth() === 7 ? 'Ağu' : 'Eyl'}`,
            playerName: player.name,
            type: 'SOLD',
            counterparty: 'Serbest',
            price: cost > 0 ? `-${cost.toFixed(1)} M€ (Fesih)` : 'Bedelsiz (Fesih)'
        };
        updatedTeam.transferHistory = [...(updatedTeam.transferHistory || []), record];

        setGameState(prev => ({
            ...prev,
            teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t)
        }));

        if (cost > 0) {
            alert(`${player.name} serbest bırakıldı. Tazminat ödendi: ${cost.toFixed(2)} M€`);
        } else {
            alert(`${player.name} ile yollar ayrıldı.`);
        }
        
        navigation.goBack(); 
    };

    const handleSellPlayer = (player: Player) => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        
        // --- KADRO DERİNLİĞİ KONTROLÜ (MİNİMUM 22 OYUNCU) ---
        if (myTeam.players.length <= 22) { 
            setGameState(prev => ({
                ...prev,
                uiAlert: {
                    title: "Yönetim Engeli: Kadro Yetersizliği",
                    message: "Yönetim Kurulu, kadro derinliğinin kritik seviyeye (22 oyuncu) düştüğünü tespit etti. Takımın rekabetçiliğini korumak adına, yeni bir transfer yapılmadan mevcut oyuncuların satılmasına izin verilmiyor.",
                    type: "error"
                }
            }));
            return; 
        }
        
        const monthlyNet = calculateMonthlyNetFlow(myTeam, gameState.fixtures, gameState.currentDate, gameState.manager!);
        let injectionRate = 0.5;
        let statusLabel = 'Riskli (%50)';
        
        if (monthlyNet > 10) { injectionRate = 1.0; statusLabel = 'Zengin (%100)'; }
        else if (monthlyNet > 0) { injectionRate = 0.8; statusLabel = 'Güvende (%80)'; }
        else if (monthlyNet >= -5) { injectionRate = 0.6; statusLabel = 'Dengeli (%60)'; }

        const budgetAddition = player.value * injectionRate;
        const retainedAmount = player.value - budgetAddition;

        const financials = { ...myTeam.financialRecords };
        financials.income.transfers += player.value;
        
        let updatedTeam = { 
            ...myTeam, 
            budget: myTeam.budget + budgetAddition, 
            players: myTeam.players.filter(p => p.id !== player.id), 
            financialRecords: financials 
        };
        
        const impact = calculateTransferStrengthImpact(myTeam.strength, player.skill, false);
        const newVisibleStrength = Math.min(100, Math.max(0, myTeam.strength + impact));
        updatedTeam.strength = Number(newVisibleStrength.toFixed(1));
        updatedTeam = recalculateTeamStrength(updatedTeam);
        
        const updatedManager = { ...gameState.manager! };
        updatedManager.stats.moneyEarned += player.value;
        updatedManager.stats.transferIncomeThisMonth += player.value;
        updatedManager.stats.playersSold++;
        
        const dateObj = new Date(gameState.currentDate);
        const record: any = {
            date: `${dateObj.getDate()} ${dateObj.getMonth() === 6 ? 'Tem' : dateObj.getMonth() === 7 ? 'Ağu' : 'Eyl'}`,
            playerName: player.name,
            type: 'SOLD',
            counterparty: 'Yurt Dışı',
            price: `${player.value} M€`
        };
        updatedTeam.transferHistory = [...(updatedTeam.transferHistory || []), record];

        const sortedPlayers = [...myTeam.players].sort((a, b) => b.skill - a.skill);
        const rank = sortedPlayers.findIndex(p => p.id === player.id);
        const isStarPlayer = rank < 3; 
        let riotNews: any[] = [];
        if (isStarPlayer) {
            updatedManager.trust.fans = Math.max(0, updatedManager.trust.fans - 3);
            updatedManager.trust.board = Math.max(0, updatedManager.trust.board - 5);
            riotNews = generateStarSoldRiotTweets(gameState.currentWeek, myTeam, player.name);
        }
        setGameState(prev => ({ ...prev, teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t), manager: updatedManager, news: [...riotNews, ...prev.news] }));
        
        let msg = `${player.name} satıldı! Bonservis: ${player.value} M€\n\nFinansal Durum: ${statusLabel}\nBütçeye Eklenen: ${budgetAddition.toFixed(1)} M€`;
        if (retainedAmount > 0) {
            msg += `\n(Yönetim ${retainedAmount.toFixed(1)} M€ tutara borçlar ve giderler için el koydu.)`;
        }
        
        if (isStarPlayer) msg += `\n\nTARAFTAR TEPKİLİ! Takımın yıldızı satıldığı için güven seviyeniz düştü (-3).`;
        
        alert(msg);
    };

    const handleAcceptOffer = (offer: IncomingOffer) => {
        const player = gameState.teams.find(t => t.id === gameState.myTeamId)?.players.find(p => p.id === offer.playerId);
        if (player) {
            const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
            
            // --- KADRO DERİNLİĞİ KONTROLÜ (MİNİMUM 22 OYUNCU) ---
            if (myTeam.players.length <= 22) { 
                setGameState(prev => ({
                    ...prev,
                    uiAlert: {
                        title: "Yönetim Engeli: Kadro Yetersizliği",
                        message: "Yönetim Kurulu, kadro derinliğinin kritik seviyeye (22 oyuncu) düştüğünü tespit etti. Takımın rekabetçiliğini korumak adına, yeni bir transfer yapılmadan mevcut oyuncuların satılmasına/kiralanmasına izin verilmiyor.",
                        type: "error"
                    }
                }));
                return; 
            }

            const isLoan = offer.type === 'LOAN';

            // --- YILDIZ OYUNCU KİRALIK GİTMEYİ REDDEDER ---
            const nonLoanableStatuses = ['STAR', 'IMPORTANT', 'FIRST_XI'];
            if (isLoan && player.squadStatus && nonLoanableStatuses.includes(player.squadStatus)) {
                // Oyuncunun morali düşer çünkü kulüp onu göndermek istedi
                const newMorale = Math.max(0, player.morale - 15);
                
                setGameState(prev => {
                     // Teklifi listeden kaldır (reddedildi sayılır oyuncu tarafından)
                    const remainingOffers = prev.incomingOffers.filter(o => o.id !== offer.id);
                    
                    // Oyuncunun moralini güncelle
                    const updatedTeams = prev.teams.map(t => {
                        if (t.id === myTeam.id) {
                            return {
                                ...t,
                                players: t.players.map(p => p.id === player.id ? { ...p, morale: newMorale } : p)
                            };
                        }
                        return t;
                    });

                    return { ...prev, teams: updatedTeams, incomingOffers: remainingOffers };
                });

                alert(`TRANSFER İPTAL EDİLDİ!\n\n${player.name}, kiralık olarak gitmeyi reddetti!\n\nOyuncu Açıklaması: "Ben bu takımın ${player.squadStatus === 'STAR' ? 'yıldızıyım' : 'as oyuncusuyum'}. Kiralık gidip kariyerimde geriye düşmek istemiyorum."\n\n(Oyuncu bu duruma içerledi: Moral -15)`);
                return;
            }

            let budgetAddition = 0;
            let statusLabel = '';
            let msg = '';
            
            // Financial Update Object
            const financials = { ...myTeam.financialRecords };
            let updatedTeam = { ...myTeam };
            const dateObj = new Date(gameState.currentDate);

            if (isLoan && offer.loanDetails) {
                // LOAN LOGIC
                // For loans, we assume the monthly fee is paid upfront for the loan duration (simplified)
                // or just added as a lump sum "Loan Fee" to transfer income.
                const totalLoanFee = offer.loanDetails.monthlyFee * 10; // Approx 10 months season
                
                financials.income.transfers += totalLoanFee;
                budgetAddition = totalLoanFee;
                statusLabel = 'Kiralık Geliri';

                updatedTeam = { 
                    ...myTeam, 
                    budget: myTeam.budget + budgetAddition, 
                    players: myTeam.players.filter(p => p.id !== player.id), // Remove player temporarily (simulated loan out)
                    financialRecords: financials 
                };

                const record: any = {
                    date: `${dateObj.getDate()} ${dateObj.getMonth() === 6 ? 'Tem' : dateObj.getMonth() === 7 ? 'Ağu' : 'Eyl'}`,
                    playerName: player.name,
                    type: 'LOAN_OUT',
                    counterparty: offer.fromTeamName,
                    price: `${offer.loanDetails.monthlyFee.toFixed(2)} M€/Ay`
                };
                updatedTeam.transferHistory = [...(updatedTeam.transferHistory || []), record];

                msg = `${player.name}, ${offer.fromTeamName} takımına kiralandı!\n\nAylık Bedel: ${offer.loanDetails.monthlyFee} M€\nMaaş Katkısı: %${offer.loanDetails.wageContribution}`;

            } else {
                // TRANSFER LOGIC (Existing)
                const monthlyNet = calculateMonthlyNetFlow(myTeam, gameState.fixtures, gameState.currentDate, gameState.manager!);
                let injectionRate = 0.5;
                statusLabel = 'Riskli (%50)';
                
                if (monthlyNet > 10) { injectionRate = 1.0; statusLabel = 'Zengin (%100)'; }
                else if (monthlyNet > 0) { injectionRate = 0.8; statusLabel = 'Güvende (%80)'; }
                else if (monthlyNet >= -5) { injectionRate = 0.6; statusLabel = 'Dengeli (%60)'; }

                budgetAddition = offer.amount * injectionRate;
                const retainedAmount = offer.amount - budgetAddition;

                financials.income.transfers += offer.amount;
                
                updatedTeam = { 
                    ...myTeam, 
                    budget: myTeam.budget + budgetAddition, 
                    players: myTeam.players.filter(p => p.id !== player.id), 
                    financialRecords: financials 
                };
                
                const record: any = {
                    date: `${dateObj.getDate()} ${dateObj.getMonth() === 6 ? 'Tem' : dateObj.getMonth() === 7 ? 'Ağu' : 'Eyl'}`,
                    playerName: player.name,
                    type: 'SOLD',
                    counterparty: offer.fromTeamName,
                    price: `${offer.amount.toFixed(1)} M€`
                };
                updatedTeam.transferHistory = [...(updatedTeam.transferHistory || []), record];

                msg = `${player.name}, ${offer.fromTeamName} takımına satıldı! Gelir: ${offer.amount} M€\n\nFinansal Durum: ${statusLabel}\nBütçeye Eklenen: ${budgetAddition.toFixed(1)} M€`;
                if (retainedAmount > 0) {
                    msg += `\n(Yönetim ${retainedAmount.toFixed(1)} M€ tutara borçlar ve giderler için el koydu.)`;
                }
            }

            // Recalculate Strength
            const impact = calculateTransferStrengthImpact(myTeam.strength, player.skill, false);
            const newVisibleStrength = Math.min(100, Math.max(0, myTeam.strength + impact));
            updatedTeam.strength = Number(newVisibleStrength.toFixed(1));
            updatedTeam = recalculateTeamStrength(updatedTeam);
            
            // Manager Stats Update
            const updatedManager = { ...gameState.manager! };
            if (isLoan && offer.loanDetails) {
                 updatedManager.stats.moneyEarned += (offer.loanDetails.monthlyFee * 10);
            } else {
                 updatedManager.stats.moneyEarned += offer.amount;
                 updatedManager.stats.transferIncomeThisMonth += offer.amount;
                 updatedManager.stats.playersSold++;
            }

            setGameState(prev => {
                const remainingOffers = prev.incomingOffers.filter(o => o.id !== offer.id);
                return { 
                    ...prev, 
                    teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t), 
                    manager: updatedManager,
                    incomingOffers: remainingOffers 
                };
            });
            
            alert(msg);
        }
    };

    const handleRejectOffer = (offer: IncomingOffer) => {
        setGameState(prev => {
            const remainingOffers = prev.incomingOffers.filter(o => o.id !== offer.id);
            return { ...prev, incomingOffers: remainingOffers };
        });
    };

    const handleTransferOfferSuccess = (player: Player, agreedFee: number) => {
        if (!gameState.myTeamId) return;
        
        const pending: PendingTransfer = {
            playerId: player.id,
            sourceTeamId: player.teamId,
            agreedFee: agreedFee,
            date: gameState.currentDate
        };

        setGameState(prev => ({
            ...prev,
            pendingTransfers: [...prev.pendingTransfers, pending]
        }));
        
        coreSetters.setNegotiatingTransferPlayer(null);
        alert("Teklif KABUL EDİLDİ!\n\nKulüp ile bonservis konusunda anlaştınız. Oyuncu, bir sonraki gün sözleşme görüşmeleri için kulübe gelecek.");
    };

    const handleCancelTransfer = (playerId: string) => {
        const remainingPending = gameState.pendingTransfers.filter(pt => pt.playerId !== playerId);
        setGameState(prev => ({
            ...prev,
            pendingTransfers: remainingPending
        }));
        
        if (coreSetters.incomingTransfer && coreSetters.incomingTransfer.playerId === playerId) {
            if (remainingPending.length > 0) {
                coreSetters.setIncomingTransfer(remainingPending[0]);
            } else {
                coreSetters.setIncomingTransfer(null);
                navigation.navigateTo('home');
            }
        }
    };

    const handleSignPlayer = (player: Player, fee: number, contract: any) => {
        if (!gameState.myTeamId) return;
        const myTeam = gameState.teams.find(t => t.id === gameState.myTeamId)!;
        
        const newBudget = myTeam.budget - fee;
        const oldTeam = gameState.teams.find(t => t.id === player.teamId);
        
        const newPlayer: Player = { 
            ...player, 
            teamId: myTeam.id, 
            jersey: myTeam.jersey,
            squadStatus: contract.role,
            contractExpiry: 2025 + contract.years, 
            wage: contract.wage,
            activePromises: contract.promises,
            clubName: undefined // Clear previous club name/status
        };
        
        const financials = { ...myTeam.financialRecords };
        financials.expense.transfers += fee;
        
        let updatedMyTeam = { ...myTeam, budget: newBudget, players: [...myTeam.players, newPlayer], financialRecords: financials };
        
        const impact = calculateTransferStrengthImpact(myTeam.strength, player.skill, true);
        const newVisibleStrength = Math.min(100, Math.max(0, myTeam.strength + impact));
        updatedMyTeam.strength = Number(newVisibleStrength.toFixed(1));
        updatedMyTeam = recalculateTeamStrength(updatedMyTeam);

        const updatedManager = { ...gameState.manager! };
        updatedManager.stats.moneySpent += fee;
        updatedManager.stats.transferSpendThisMonth += fee;
        updatedManager.stats.playersBought++;
        if (fee > updatedManager.stats.recordTransferFee) updatedManager.stats.recordTransferFee = fee;

        const dateObj = new Date(gameState.currentDate);
        const buyRecord: any = {
            date: `${dateObj.getDate()} ${dateObj.getMonth() === 6 ? 'Tem' : dateObj.getMonth() === 7 ? 'Ağu' : 'Eyl'}`,
            playerName: newPlayer.name,
            type: 'BOUGHT',
            counterparty: oldTeam ? oldTeam.name : 'Serbest',
            price: `${fee.toFixed(1)} M€`
        };
        updatedMyTeam.transferHistory = [...(updatedMyTeam.transferHistory || []), buyRecord];

        let updatedTeams = gameState.teams.map(t => t.id === myTeam.id ? updatedMyTeam : t);

        if (oldTeam) {
            let updatedOldTeam = { ...oldTeam, budget: oldTeam.budget + fee, players: oldTeam.players.filter(p => p.id !== player.id) };
            const sellImpact = calculateTransferStrengthImpact(oldTeam.strength, player.skill, false);
            const oldVisibleStrength = Math.min(100, Math.max(0, oldTeam.strength + sellImpact));
            updatedOldTeam.strength = Number(oldVisibleStrength.toFixed(1));
            updatedOldTeam = recalculateTeamStrength(updatedOldTeam);
            
            const sellRecord: any = {
                date: `${dateObj.getDate()} ${dateObj.getMonth() === 6 ? 'Tem' : dateObj.getMonth() === 7 ? 'Ağu' : 'Eyl'}`,
                playerName: player.name,
                type: 'SOLD',
                counterparty: myTeam.name,
                price: `${fee.toFixed(1)} M€`
            };
            updatedOldTeam.transferHistory = [...(updatedOldTeam.transferHistory || []), sellRecord];
            updatedTeams = updatedTeams.map(t => t.id === oldTeam.id ? updatedOldTeam : t);
        }

        const updatedTransferList = gameState.transferList.filter(p => p.id !== player.id);
        const remainingPending = gameState.pendingTransfers.filter(pt => pt.playerId !== player.id);

        setGameState(prev => ({ 
            ...prev, 
            teams: updatedTeams, 
            transferList: updatedTransferList, 
            manager: updatedManager,
            pendingTransfers: remainingPending
        }));
        
        alert(`${player.name} resmen takımda!`);

        if (remainingPending.length > 0) {
            coreSetters.setIncomingTransfer(remainingPending[0]);
        } else {
            coreSetters.setIncomingTransfer(null);
            navigation.navigateTo('home');
        }
    };

    const handlePlayerInteraction = (playerId: string, type: 'POSITIVE' | 'NEGATIVE' | 'HOSTILE') => {
        setGameState(prev => {
            if (!prev.manager) return prev;
            
            const newManager = { ...prev.manager };
            if (!newManager.playerRelations) newManager.playerRelations = [];
            
            let relationIndex = newManager.playerRelations.findIndex(r => r.playerId === playerId);
            let relationValue = 50; 
            
            if (relationIndex !== -1) {
                relationValue = newManager.playerRelations[relationIndex].value;
            }

            let change = 0;
            if (type === 'POSITIVE') change = 10;
            else if (type === 'NEGATIVE') change = -15;
            else if (type === 'HOSTILE') change = -50;

            relationValue = Math.max(0, Math.min(100, relationValue + change));

            const team = prev.teams.find(t => t.id === prev.myTeamId);
            const player = team?.players.find(p => p.id === playerId);
            const playerName = player?.name || 'Oyuncu';

            if (relationIndex !== -1) {
                newManager.playerRelations[relationIndex] = { ...newManager.playerRelations[relationIndex], value: relationValue };
            } else {
                newManager.playerRelations.push({ playerId, name: playerName, value: relationValue });
            }

            const updatedTeams = prev.teams.map(t => {
                if (t.id === prev.myTeamId) {
                    return {
                        ...t,
                        players: t.players.map(p => {
                            if (p.id === playerId) {
                                let moraleDrop = type === 'POSITIVE' ? 5 : (type === 'HOSTILE' ? -30 : -10);
                                return { ...p, morale: Math.max(0, Math.min(100, p.morale + moraleDrop)) };
                            }
                            return p;
                        })
                    };
                }
                return t;
            });

            return { ...prev, manager: newManager, teams: updatedTeams };
        });
    };

    const handlePlayerUpdate = (playerId: string, updates: Partial<Player>) => {
        if (updates.activePromises && updates.nextNegotiationWeek === undefined) {
            updates.nextNegotiationWeek = gameState.currentWeek + 24; 
        }

        setGameState(prev => {
            let playerRef: Player | undefined;

            const updatedTeams = prev.teams.map(t => {
                if (t.players.some(p => p.id === playerId)) {
                    return {
                        ...t,
                        players: t.players.map(p => {
                            if (p.id === playerId) {
                                const updatedPlayer = { 
                                    ...p, 
                                    ...updates,
                                    nextNegotiationWeek: updates.activePromises ? prev.currentWeek + 24 : (updates.nextNegotiationWeek !== undefined ? updates.nextNegotiationWeek : p.nextNegotiationWeek)
                                };
                                playerRef = updatedPlayer;
                                if (coreSetters.selectedPlayerForDetail?.id === playerId) {
                                    coreSetters.setSelectedPlayerForDetail(updatedPlayer);
                                }
                                return updatedPlayer;
                            }
                            return p;
                        })
                    };
                }
                return t;
            });

            let updatedTransferList = [...prev.transferList];
            updatedTransferList = updatedTransferList.map(p => {
                if (p.id === playerId) {
                     const updatedPlayer = { 
                        ...p, 
                        ...updates,
                        nextNegotiationWeek: updates.activePromises ? prev.currentWeek + 24 : (updates.nextNegotiationWeek !== undefined ? updates.nextNegotiationWeek : p.nextNegotiationWeek)
                    };
                    if (coreSetters.selectedPlayerForDetail?.id === playerId) {
                        coreSetters.setSelectedPlayerForDetail(updatedPlayer);
                    }
                    return updatedPlayer;
                }
                return p;
            });

            if (updates.transferListed !== undefined && playerRef) {
                if (updates.transferListed) {
                    if (!updatedTransferList.some(p => p.id === playerId)) {
                        updatedTransferList.push(playerRef);
                    }
                } else {
                    updatedTransferList = updatedTransferList.filter(p => p.id !== playerId);
                }
            }

            return { ...prev, teams: updatedTeams, transferList: updatedTransferList };
        });
    };

    const handleMessageReply = (msgId: number, optIndex: number) => {
        // Logic for replying is inside SocialMediaView mostly, this is a placeholder if needed upstream
    };

    return {
        handleTrain,
        handleToggleTrainingDelegation,
        handleAssignIndividualTraining,
        handleAssignPositionTraining, // NEW
        handleBuyPlayer,
        handleSellPlayer,
        handleAcceptOffer,
        handleRejectOffer,
        handleTransferOfferSuccess,
        handleSignPlayer,
        handleReleasePlayer,
        handlePlayerInteraction,
        handlePlayerUpdate,
        handleCancelTransfer,
        handleMessageReply
    };
};
