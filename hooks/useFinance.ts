
import React from 'react';
import { GameState, SponsorDeal } from '../types';

export const useFinance = (
    gameState: GameState,
    // Add comment above the fix: Ensure setGameState is properly typed
    setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {

    const handleTakeEmergencyLoan = (amount: number) => {
        if (!gameState.myTeamId) return;
        
        setGameState(prev => {
            const team = prev.teams.find(t => t.id === prev.myTeamId);
            const manager = prev.manager;
            if (!team || !manager) return prev;

            const debtIncrease = amount + (amount * 0.35);
            const newTrust = { ...manager.trust };
            newTrust.board = Math.max(0, newTrust.board - 10);

            const updatedTeam = {
                ...team,
                budget: team.budget + amount,
                initialDebt: (team.initialDebt || 0) + debtIncrease
            };

            const updatedTeams = prev.teams.map(t => t.id === prev.myTeamId ? updatedTeam : t);
            
            return {
                ...prev,
                teams: updatedTeams,
                manager: { ...manager, trust: newTrust }
            };
        });
        
        alert(`${amount} M€ borç alındı. Toplam geri ödeme (Faiz Dahil): ${ (amount * 1.35).toFixed(1) } M€.\nYönetim güveni sarsıldı (-10).`);
    };

    const handleUpdateSponsor = (type: 'main' | 'stadium' | 'sleeve', deal: SponsorDeal) => {
        if (!gameState.myTeamId) return;
        
        setGameState(prev => {
            const updatedTeams = prev.teams.map(t => {
                if (t.id === prev.myTeamId) {
                    return {
                        ...t,
                        sponsors: {
                            ...t.sponsors,
                            [type]: deal
                        }
                    };
                }
                return t;
            });
            return { ...prev, teams: updatedTeams };
        });
        
        alert(`Sponsor anlaşması güncellendi!\nYeni ${type === 'main' ? 'Ana' : type === 'stadium' ? 'Stadyum' : 'Kol'} Sponsoru: ${deal.name}`);
    };

    // Add comment above the fix: Implement handleUpdateBudget to allow redistributing budget between transfer and wage pots
    const handleUpdateBudget = (newTransferBudget: number, newWageBudget: number) => {
        if (!gameState.myTeamId) return;
        
        setGameState(prev => {
            const team = prev.teams.find(t => t.id === prev.myTeamId);
            if (!team) return prev;

            const updatedTeam = {
                ...team,
                budget: newTransferBudget,
                wageBudget: newWageBudget
            };

            return {
                ...prev,
                teams: prev.teams.map(t => t.id === prev.myTeamId ? updatedTeam : t)
            };
        });
        
        alert("Bütçe dağılımı başarıyla güncellendi!");
    };

    return {
        handleTakeEmergencyLoan,
        handleUpdateSponsor,
        handleUpdateBudget
    };
};
