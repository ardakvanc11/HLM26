

import React from 'react';
import { GameState, Player, IncomingOffer, PendingTransfer, TrainingConfig, IndividualTrainingType, Position, Team } from '../types';
import { calculateTransferStrengthImpact, recalculateTeamStrength, calculateMonthlyNetFlow, applyTraining, calculateTransferRevenueRetention } from '../utils/gameEngine';
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
        const { updatedTeam: trainedTeam, report } = applyTraining(myTeam, config, gameState.currentWeek);
        
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

    // --- NEW: TOGGLE SHORTLIST ---
    const handleToggleShortlist = (playerId: string) => {
        setGameState(prev => {
            const list = prev.shortlist || [];
            if (list.includes(playerId)) {
                return { ...prev, shortlist: list.filter(id => id !== playerId) };
            } else {
                return { ...prev, shortlist: [...list, playerId] };
            }
        });
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

            // Remove from shortlist if bought
            const updatedShortlist = (gameState.shortlist || []).filter(id => id !== player.id);

            setGameState(prev => ({ 
                ...prev, 
                transferList: newTransferList, 
                teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t), 
                manager: updatedManager,
                shortlist: updatedShortlist 
            }));
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
        // Just triggers the Sell Negotiation flow, no direct logic here.
        // It relies on handleAcceptOffer to finalize
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
            let retainedAmount = 0;
            let debtRepayment = 0;
            let clubCash = 0;

            let msg = '';
            
            // Financial Update Object
            const financials = { ...myTeam.financialRecords };
            let updatedTeam = { ...myTeam };
            const dateObj = new Date(gameState.currentDate);

            if (isLoan && offer.loanDetails) {
                // LOAN LOGIC (USER -> AI)
                const totalLoanFee = offer.loanDetails.monthlyFee * 10; 
                
                const monthlyNet = calculateMonthlyNetFlow(myTeam, gameState.fixtures, gameState.currentDate, gameState.manager!);
                const retentionPct = calculateTransferRevenueRetention(myTeam, monthlyNet, gameState.lastSeasonGoalAchieved);
                const retentionRate = retentionPct / 100;

                budgetAddition = totalLoanFee * retentionRate;
                retainedAmount = totalLoanFee - budgetAddition;
                debtRepayment = retainedAmount / 2;
                clubCash = retainedAmount / 2;

                financials.income.transfers += totalLoanFee;

                // --- NEW: CALCULATE RETURN DATE ---
                let returnDate = new Date(gameState.currentDate);
                const durationStr = offer.loanDetails.duration || "Sezon Sonu";

                if(durationStr === 'Sezon Sonu') {
                    const currentYear = returnDate.getFullYear();
                    // Always target June 30th of the current season end year
                    // If current date is > June, season end is Next Year June. 
                    // Else Current Year June.
                    // Simplified: Game starts July, season ends June next year.
                    const targetMonth = 5; // June (0-indexed)
                    const targetDay = 30;
                    
                    let targetYear = currentYear;
                    if (returnDate.getMonth() > 5) {
                        targetYear = currentYear + 1;
                    }
                    
                    returnDate = new Date(targetYear, targetMonth, targetDay);
                    
                } else if (durationStr.includes('Ay')) { 
                     // e.g. "6 Ay", "12 Ay"
                     const months = parseInt(durationStr);
                     if (!isNaN(months)) {
                         returnDate.setMonth(returnDate.getMonth() + months);
                     }
                } else {
                    // Default fallback
                    returnDate.setMonth(returnDate.getMonth() + 10);
                }

                // Add Loan Info to Player
                const playerWithLoan = {
                    ...player,
                    loanInfo: {
                        originalTeamId: myTeam.id,
                        returnDate: returnDate.toISOString(),
                        loanFee: offer.loanDetails.monthlyFee,
                        wageContribution: offer.loanDetails.wageContribution
                    }
                };

                // Determine Target Team
                const targetTeam = gameState.teams.find(t => t.name === offer.fromTeamName);
                
                let updatedTeams = [...gameState.teams];

                if (targetTeam) {
                    // Move player to target team
                    updatedTeams = updatedTeams.map(t => {
                        if (t.id === targetTeam.id) {
                            return { ...t, players: [...t.players, playerWithLoan] };
                        }
                        return t;
                    });
                } else {
                    // Move to "loanedOutPlayers" list (Foreign)
                    updatedTeam = {
                        ...updatedTeam,
                        loanedOutPlayers: [...(updatedTeam.loanedOutPlayers || []), playerWithLoan]
                    };
                }

                updatedTeam = { 
                    ...updatedTeam, 
                    budget: updatedTeam.budget + budgetAddition,
                    initialDebt: Math.max(0, (updatedTeam.initialDebt || 0) - debtRepayment),
                    players: updatedTeam.players.filter(p => p.id !== player.id), // Remove from active squad
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

                // Apply update to myTeam in the list
                updatedTeams = updatedTeams.map(t => t.id === myTeam.id ? updatedTeam : t);

                msg = `${player.name}, ${offer.fromTeamName} takımına kiralandı!\n\nToplam Kiralama Geliri: ${totalLoanFee.toFixed(2)} M€\n`;
                msg += `Transfer Bütçesine: ${budgetAddition.toFixed(1)} M€\n`;
                if (retainedAmount > 0) {
                     msg += `Borç Ödemesi: ${debtRepayment.toFixed(1)} M€\n`;
                     msg += `Kulüp Kasası: ${clubCash.toFixed(1)} M€`;
                }

                // Manager Stats Update
                const updatedManager = { ...gameState.manager! };
                updatedManager.stats.moneyEarned += (offer.loanDetails.monthlyFee * 10);
                
                setGameState(prev => {
                    const remainingOffers = prev.incomingOffers.filter(o => o.id !== offer.id);
                    return { 
                        ...prev, 
                        teams: updatedTeams, 
                        manager: updatedManager,
                        incomingOffers: remainingOffers 
                    };
                });

            } else {
                // TRANSFER LOGIC (Existing)
                const monthlyNet = calculateMonthlyNetFlow(myTeam, gameState.fixtures, gameState.currentDate, gameState.manager!);
                
                const retentionPct = calculateTransferRevenueRetention(myTeam, monthlyNet, gameState.lastSeasonGoalAchieved);
                const retentionRate = retentionPct / 100;

                budgetAddition = offer.amount * retentionRate;
                retainedAmount = offer.amount - budgetAddition;
                
                debtRepayment = retainedAmount / 2;
                clubCash = retainedAmount / 2;

                financials.income.transfers += offer.amount;
                
                updatedTeam = { 
                    ...myTeam, 
                    budget: myTeam.budget + budgetAddition,
                    initialDebt: Math.max(0, (myTeam.initialDebt || 0) - debtRepayment),
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

                msg = `${player.name}, ${offer.fromTeamName} takımına satıldı! Gelir: ${offer.amount} M€\n\n`;
                msg += `Transfer Bütçesine: ${budgetAddition.toFixed(1)} M€ (%${retentionPct})\n`;
                
                if (retainedAmount > 0) {
                     msg += `Yönetim Kesintisi Dağılımı:\n`;
                     msg += `- Borç Ödemesi: ${debtRepayment.toFixed(1)} M€\n`;
                     msg += `- Kulüp Kasası: ${clubCash.toFixed(1)} M€`;
                }
                
                // Recalculate Strength
                const impact = calculateTransferStrengthImpact(myTeam.strength, player.skill, false);
                const newVisibleStrength = Math.min(100, Math.max(0, myTeam.strength + impact));
                updatedTeam.strength = Number(newVisibleStrength.toFixed(1));
                updatedTeam = recalculateTeamStrength(updatedTeam);
                
                // Manager Stats Update
                const updatedManager = { ...gameState.manager! };
                updatedManager.stats.moneyEarned += offer.amount;
                updatedManager.stats.transferIncomeThisMonth += offer.amount;
                updatedManager.stats.playersSold++;

                setGameState(prev => {
                    const remainingOffers = prev.incomingOffers.filter(o => o.id !== offer.id);
                    return { 
                        ...prev, 
                        teams: prev.teams.map(t => t.id === myTeam.id ? updatedTeam : t), 
                        manager: updatedManager,
                        incomingOffers: remainingOffers 
                    };
                });
            }
            
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
        
        // CHECK IF LOAN SIGNING (Implied by fee being very low or handled by a separate flag? 
        // For now, assuming standard transfer flow.
        // If we want loan in, `fee` usually 0 or loan fee.
        // We'll rely on the sourceTeam logic. If we were loaning, `player` might already have markers.
        // But standard `handleSignPlayer` is for permanent/bosman.
        
        // Actually, contract negotiation view doesn't pass "Loan" status. 
        // We'll assume standard transfer for this block unless we add loan logic here.
        // However, if we accepted an incoming LOAN offer to GET a player, it usually skips contract negotiation in simplified modes
        // or uses a simplified one.
        
        // Let's standard transfer logic for now.
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
            clubName: undefined 
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
            // Remove from old team
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
        handleMessageReply,
        handleToggleShortlist // NEW EXPORT
    };
};
