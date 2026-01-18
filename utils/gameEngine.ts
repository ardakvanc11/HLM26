
import { Team, Player, Fixture, MatchEvent, MatchStats, Position, Message, TransferRecord, NewsItem, SeasonSummary, TransferImpact, IncomingOffer, IndividualTrainingType, ManagerProfile, TrainingConfig, TrainingType, TrainingIntensity } from '../types';
import { generateId, generatePlayer, INJURY_TYPES, RIVALRIES, GAME_CALENDAR } from '../constants';
import { FAN_NAMES, DERBY_TWEETS_WIN, DERBY_TWEETS_LOSS, FAN_TWEETS_WIN, FAN_TWEETS_LOSS, FAN_TWEETS_DRAW } from '../data/tweetPool';
import { MATCH_INFO_MESSAGES } from '../data/infoPool';
import { GOAL_TEXTS, SAVE_TEXTS, MISS_TEXTS, FOUL_TEXTS, YELLOW_CARD_TEXTS, YELLOW_CARD_AGGRESSIVE_TEXTS, OFFSIDE_TEXTS, CORNER_TEXTS } from '../data/eventTexts';
import { generatePlayer as createNewPlayer, calculateMarketValue } from '../data/playerConstants';
import { INDIVIDUAL_PROGRAMS } from '../data/trainingData';

export * from './helpers';
export * from './ratingsAndStats';
export * from './teamCalculations';
export * from './calendarAndFixtures';
export * from './matchLogic';
export * from './newsAndSocial';
export * from './gameFlow';

import { calculateRating } from './ratingsAndStats'; 
import { getWeightedInjury } from './matchLogic'; 
import { recalculateTeamStrength, calculateRawTeamStrength } from './teamCalculations';
// Added missing import for transfer window check
import { isTransferWindowOpen } from './calendarAndFixtures';

// --- NEW MECHANIC: DYNAMIC DEVELOPMENT & AGING ---
export const simulatePlayerDevelopmentAndAging = (player: Player, trainingIntensity: boolean): Player => {
    let newSkill = Math.floor(player.skill);
    let stats = { ...player.stats };
    let changed = false;
    let recentChanges: Record<string, 'UP' | 'DOWN' | 'PARTIAL_UP'> = {};

    // --- INDIVIDUAL TRAINING BOOST ---
    if (player.activeTraining) {
        const program = INDIVIDUAL_PROGRAMS.find(p => p.id === player.activeTraining);
        if (program && trainingIntensity) { // Only boost if team trained
            // Chance to improve specific stats: 0.5% per day per stat
            const boostChance = 0.005;
            
            program.stats.forEach(statKey => {
                // @ts-ignore
                if (stats[statKey] < 20 && Math.random() < boostChance) {
                    // @ts-ignore
                    stats[statKey] = Math.min(20, Math.floor(stats[statKey] + 1));
                    recentChanges[statKey] = 'UP';
                    changed = true;
                }
            });
        }
    }

    // 1. AGING (Regression) - Yaşlı oyuncular güç kaybeder
    if (player.age >= 30) {
        let dropChance = 0;
        if (player.age >= 38) dropChance = 0.05;
        else if (player.age >= 35) dropChance = 0.015;
        else if (player.age >= 33) dropChance = 0.005;
        else dropChance = 0.001;

        if (Math.random() < dropChance) {
            const physicals = ['pace', 'acceleration', 'stamina', 'agility', 'balance', 'naturalFitness'] as const;
            let targetStat: keyof typeof stats;
            
            if (Math.random() < 0.80) {
                targetStat = physicals[Math.floor(Math.random() * physicals.length)];
            } else {
                const allKeys = Object.keys(stats) as (keyof typeof stats)[];
                targetStat = allKeys[Math.floor(Math.random() * allKeys.length)];
            }

            // Özellik değerini düşür (Min 1 - 20 Scale)
            // @ts-ignore
            if (stats[targetStat] > 1) {
                // @ts-ignore
                stats[targetStat] = Math.max(1, Math.floor(stats[targetStat] - 1));
                recentChanges[targetStat] = 'DOWN';
                changed = true;
                
                let ovrDropChance = 0.1;
                if (player.age >= 38) ovrDropChance = 1.0; 
                else if (player.age >= 35) ovrDropChance = 0.7; 
                else if (player.age >= 33) ovrDropChance = 0.4; 

                if (Math.random() < ovrDropChance) {
                    newSkill = Math.max(1, newSkill - 1);
                }
            }
        }
    }

    // 2. DEVELOPMENT (Progression) - Gençler potansiyellerine koşar
    else if (player.skill < player.potential && player.age <= 29) {
        let growthChance = 0.005; 
        if (player.age <= 21) growthChance = 0.015; 
        else if (player.age <= 23) growthChance = 0.010;

        if (trainingIntensity) growthChance *= 1.5;
        if ((player.potential - player.skill) > 10) growthChance *= 1.2;

        if (Math.random() < growthChance) {
            const allKeys = Object.keys(stats) as (keyof typeof stats)[];
            const targetStat = allKeys[Math.floor(Math.random() * allKeys.length)];

            // @ts-ignore
            if (stats[targetStat] < 20) {
                // @ts-ignore
                stats[targetStat] = Math.min(20, Math.floor(stats[targetStat] + 1));
                recentChanges[targetStat] = 'UP';
                changed = true;

                if (Math.random() < 0.30) {
                    newSkill = Math.min(player.potential, newSkill + 1);
                }
            }
        }
    }

    // If no specific change happened but training occurred (simulate clearing old flags if not persistent),
    // NOTE: This overwrites whatever `applyTraining` did if called sequentially improperly.
    // In `processNextDayLogic`, `applyTraining` happens BEFORE this.
    // We should MERGE recentChanges if they exist.
    // However, `player` passed here comes from the state which might already have changes from `applyTraining`.
    // Let's preserve existing changes if they exist.
    const mergedChanges = { ...player.recentAttributeChanges, ...recentChanges };

    if (changed || Object.keys(recentChanges).length > 0) {
        // Legacy sync
        stats.shooting = stats.finishing;
        // @ts-ignore
        stats.defending = Math.floor(((stats.marking || 10) + (stats.tackling || 10)) / 2);

        const newValue = calculateMarketValue(player.position, newSkill, player.age);
        return {
            ...player,
            skill: Math.floor(newSkill),
            stats: stats,
            value: newValue,
            recentAttributeChanges: mergedChanges
        };
    }
    return player;
};

/**
 * Calculates the AI-delegated training configuration.
 * Used when the user has set "isTrainingDelegated" to true.
 */
export const getAssistantTrainingConfig = (team: Team, manager: ManagerProfile): TrainingConfig => {
    // We use staffRelations to simulate coach quality/personality
    const assistant = manager.staffRelations.find(s => s.role === 'Yardımcı Antrenör');
    const fitnessCoach = manager.staffRelations.find(s => s.role === 'Kondisyoner');
    
    const assistantQuality = assistant ? assistant.value : 50;
    const fitnessQuality = fitnessCoach ? fitnessCoach.value : 50;
    
    // Calculate average staff competence
    const staffCompetence = (assistantQuality + fitnessQuality) / 2;
    
    let selectedMain = TrainingType.TACTICAL;
    let selectedSub = TrainingType.PHYSICAL;
    let selectedIntensity = TrainingIntensity.STANDARD;

    if (staffCompetence > 70) {
        // Good Staff: Makes logical choices
        const random = Math.random();
        if (random < 0.3) { selectedMain = TrainingType.TACTICAL; selectedSub = TrainingType.MATCH_PREP; }
        else if (random < 0.6) { selectedMain = TrainingType.PHYSICAL; selectedSub = TrainingType.DEFENSE; }
        else { selectedMain = TrainingType.ATTACK; selectedSub = TrainingType.SET_PIECES; }
        
        // Adjust intensity smartly based on condition
        const avgCondition = team.players.reduce((sum, p) => sum + (p.condition || 100), 0) / team.players.length;
        if (avgCondition < 70) selectedIntensity = TrainingIntensity.LOW;
        else if (avgCondition > 90) selectedIntensity = TrainingIntensity.HIGH;
        else selectedIntensity = TrainingIntensity.STANDARD;

    } else if (staffCompetence < 40) {
        // Bad Staff: Random/Poor choices
        const allTypes = Object.values(TrainingType);
        selectedMain = allTypes[Math.floor(Math.random() * allTypes.length)] as TrainingType;
        selectedSub = allTypes[Math.floor(Math.random() * allTypes.length)] as TrainingType;
        
        // Risk of bad intensity
        if (Math.random() < 0.5) selectedIntensity = TrainingIntensity.HIGH; // Risk injury
        else selectedIntensity = TrainingIntensity.LOW; // Lazy
    } else {
        // Average Staff
        selectedMain = TrainingType.TACTICAL;
        selectedSub = TrainingType.PHYSICAL;
        selectedIntensity = TrainingIntensity.STANDARD;
    }

    return {
        mainFocus: selectedMain,
        subFocus: selectedSub,
        intensity: selectedIntensity
    };
};

/**
 * Processes post-match logic for all teams, including stat updates and condition/injury management.
 */
export const processMatchPostGame = (teams: Team[], events: MatchEvent[], week: number, fixtures: Fixture[]): Team[] => {
    return teams.map(team => {
        const fixture = fixtures.find(f => f.week === week && (f.homeTeamId === team.id || f.awayTeamId === team.id));
        if (!fixture || !fixture.played) return team;

        const teamEvents = events.filter(e => e.teamName === team.name);
        
        const updatedPlayers = team.players.map(player => {
            // FIX: Ensure stats are initialized if missing (migration safety)
            if (!player.seasonStats.processedMatchIds) player.seasonStats.processedMatchIds = [];

            // CRITICAL CHECK: Has this player already been processed for this fixture?
            if (player.seasonStats.processedMatchIds.includes(fixture.id)) {
                return player; // Skip redundant processing
            }

            const ratings = fixture.homeTeamId === team.id ? fixture.stats?.homeRatings : fixture.stats?.awayRatings;
            const pPerf = ratings?.find(r => r.playerId === player.id);

            // Only process if the player actually played (has a performance rating)
            if (!pPerf) return player;

            const playerEvents = teamEvents.filter(e => e.playerId === player.id || e.scorer === player.name || e.assist === player.name);
            
            const goals = playerEvents.filter(e => e.type === 'GOAL' && (e.scorer === player.name || e.playerId === player.id)).length;
            const assists = playerEvents.filter(e => e.type === 'GOAL' && e.assist === player.name).length;
            const yellows = playerEvents.filter(e => e.type === 'CARD_YELLOW').length;
            const reds = playerEvents.filter(e => e.type === 'CARD_RED').length;
            const injuryEvent = playerEvents.find(e => e.type === 'INJURY');

            const newSeasonStats = { ...player.seasonStats };
            
            // Increment Stats
            newSeasonStats.goals += goals;
            newSeasonStats.assists += assists;
            // Yellows updated below with accumulation logic
            // newSeasonStats.yellowCards += yellows; 
            newSeasonStats.redCards += reds;
            newSeasonStats.matchesPlayed += 1;
            newSeasonStats.ratings.push(pPerf.rating);
            newSeasonStats.averageRating = Number((newSeasonStats.ratings.reduce((a, b) => a + b, 0) / newSeasonStats.ratings.length).toFixed(2));
            
            // Mark this match as processed for this player
            newSeasonStats.processedMatchIds = [...newSeasonStats.processedMatchIds, fixture.id];

            // --- SUSPENSION LOGIC UPDATE ---
            // Calculate Accumulated Yellows
            let accumulatedYellows = newSeasonStats.yellowCards + yellows;
            let suspensionTarget = player.suspendedUntilWeek;

            // Rule: 5 Yellow Cards -> 1 Match Ban & Reset
            if (accumulatedYellows >= 5) {
                suspensionTarget = week + 1; // Suspend for next match
                accumulatedYellows = 0; // Reset accumulation
            }
            newSeasonStats.yellowCards = accumulatedYellows;

            // Rule: Red Card -> 1 Match Ban (Direct or 2nd Yellow)
            if (reds > 0) {
                suspensionTarget = week + 1;
            }

            let newCondition = player.condition !== undefined ? player.condition : player.stats.stamina;
            newCondition = Math.max(0, newCondition - (20 + Math.random() * 10));

            let updatedInjury = player.injury;
            if (injuryEvent) {
                const injuryType = getWeightedInjury();
                const days = Math.floor(Math.random() * (injuryType.maxDays - injuryType.minDays + 1)) + injuryType.minDays;
                updatedInjury = {
                    type: injuryType.type,
                    daysRemaining: days,
                    description: injuryEvent.description
                };
                newCondition = 0;
            }

            return {
                ...player,
                seasonStats: newSeasonStats,
                condition: newCondition,
                injury: updatedInjury,
                suspendedUntilWeek: suspensionTarget
            };
        });
        return { ...team, players: updatedPlayers };
    });
};

/**
 * Handles daily transfer simulations for AI-controlled teams.
 */
export const simulateAiDailyTransfers = (teams: Team[], date: string, week: number, myTeamId: string | null): { updatedTeams: Team[], newNews: NewsItem[] } => {
    if (!isTransferWindowOpen(date)) return { updatedTeams: teams, newNews: [] };
    if (Math.random() > 0.4) return { updatedTeams: teams, newNews: [] };

    const newNews: NewsItem[] = [];
    const updatedTeams = [...teams];

    const aiTeams = updatedTeams.filter(t => t.id !== myTeamId);
    if (aiTeams.length < 2) return { updatedTeams, newNews };

    const buyerIdx = updatedTeams.findIndex(t => t.id === aiTeams[Math.floor(Math.random() * aiTeams.length)].id);
    const sellerIdx = updatedTeams.findIndex(t => t.id === aiTeams[Math.floor(Math.random() * aiTeams.length)].id);

    if (buyerIdx === sellerIdx || buyerIdx === -1 || sellerIdx === -1) return { updatedTeams, newNews };

    const buyer = updatedTeams[buyerIdx];
    const seller = updatedTeams[sellerIdx];

    if (seller.players.length <= 16) return { updatedTeams, newNews };

    const playerIdx = Math.floor(Math.random() * seller.players.length);
    const player = seller.players[playerIdx];

    if (buyer.budget >= player.value) {
        const soldPlayer = { ...player, teamId: buyer.id };
        updatedTeams[buyerIdx] = { 
            ...buyer, 
            budget: buyer.budget - player.value, 
            players: [...buyer.players, soldPlayer] 
        };
        updatedTeams[sellerIdx] = { 
            ...seller, 
            budget: seller.budget + player.value, 
            players: seller.players.filter(p => p.id !== player.id) 
        };

        newNews.push({
            id: generateId(),
            week,
            type: 'TRANSFER',
            title: `${buyer.name}|@Transfer|OFFICIAL`,
            content: `${buyer.name}, ${seller.name} takımından ${player.name} isimli oyuncuyu ${player.value} M€ karşılığında kadrosuna kattı.`
        });
    }

    return { updatedTeams: updatedTeams, newNews };
};

/**
 * Summarizes the season for the user's team.
 */
export const archiveSeason = (myTeam: Team, allTeams: Team[], year: number): SeasonSummary => {
    const sorted = [...allTeams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });
    const rank = sorted.findIndex(t => t.id === myTeam.id) + 1;
    
    const allPlayers = allTeams.flatMap(t => t.players);
    const topScorer = [...allPlayers].sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)[0];
    const topAssister = [...allPlayers].sort((a, b) => b.seasonStats.assists - a.seasonStats.assists)[0];
    const topRated = [...allPlayers].filter(p => p.seasonStats.matchesPlayed > 5).sort((a, b) => (b.seasonStats.averageRating || 0) - (a.seasonStats.averageRating || 0))[0];

    return {
        season: `${year-1}/${year}`,
        teamName: myTeam.name,
        rank,
        // FIX: Manually map Team.stats properties to match the expected SeasonSummary.stats interface structure.
        stats: {
            wins: myTeam.stats.won,
            draws: myTeam.stats.drawn,
            losses: myTeam.stats.lost,
            goalsFor: myTeam.stats.gf,
            goalsAgainst: myTeam.stats.ga,
            points: myTeam.stats.points
        },
        bestXI: myTeam.players.slice(0, 11),
        topScorer: { name: topScorer?.name || 'Yok', count: topScorer?.seasonStats.goals || 0 },
        topAssister: { name: topAssister?.name || 'Yok', count: topAssister?.seasonStats.assists || 0 },
        topRated: { name: topRated?.name || 'Yok', rating: topRated?.seasonStats.averageRating || 0 },
        trophiesWon: rank === 1 ? ['Süper Toto Hayvanlar Ligi'] : [],
        transfersIn: []
    };
};

/**
 * Resets teams for the next season, incrementing age and clearing stats.
 */
export const resetForNewSeason = (teams: Team[]): Team[] => {
    return teams.map(team => ({
        ...team,
        stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
        players: team.players.map(p => ({
            ...p,
            age: p.age + 1,
            seasonStats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, ratings: [], averageRating: 0, matchesPlayed: 0, processedMatchIds: [] }
        }))
    }));
};

/**
 * Generates incoming transfer offers for user-owned players from AI teams.
 */
export const generateAiOffersForUser = (myTeam: Team, date: string): IncomingOffer[] => {
    if (!isTransferWindowOpen(date)) return [];
    
    // 1. Identify Target Players
    // Priority: Listed Players (Transfer Listed or Loan Listed)
    // Secondary: Random scouting
    
    const listedPlayers = myTeam.players.filter(p => p.transferListed || p.loanListed);
    const unlistedPlayers = myTeam.players.filter(p => !p.transferListed && !p.loanListed && p.value > 0);
    
    let targetPlayer: Player | null = null;
    let isForcedLoan = false;
    let isForcedTransfer = false;

    // High chance to pick from listed players if any
    if (listedPlayers.length > 0 && Math.random() < 0.6) {
        targetPlayer = listedPlayers[Math.floor(Math.random() * listedPlayers.length)];
        
        // Determine type based on listing status
        if (targetPlayer.loanListed && targetPlayer.transferListed) {
            // Both listed: 50/50 chance
            if(Math.random() < 0.5) isForcedLoan = true; else isForcedTransfer = true;
        } else if (targetPlayer.loanListed) {
            isForcedLoan = true;
        } else {
            isForcedTransfer = true;
        }
    } else if (unlistedPlayers.length > 0 && Math.random() < 0.15) {
         // Random scout offer (low chance)
         targetPlayer = unlistedPlayers[Math.floor(Math.random() * unlistedPlayers.length)];
    }

    if (!targetPlayer) return [];
    
    // --- DETERMINE OFFER TYPE ---
    // If forced via listing, use that. Otherwise use squad status logic.
    
    let isLoanOffer = false;
    
    if (isForcedLoan) {
        isLoanOffer = true;
    } else if (isForcedTransfer) {
        isLoanOffer = false;
    } else {
        // Fallback to random logic based on squad status
        const squadStatus = targetPlayer.squadStatus || '';
        const isImportant = ['STAR', 'IMPORTANT', 'FIRST_XI'].includes(squadStatus);
        const isExpendable = ['ROTATION', 'IMPACT', 'JOKER', 'SURPLUS', 'BACKUP'].includes(squadStatus) || !squadStatus;
        
        let loanProbability = 0;
        if (isImportant) {
            loanProbability = 0.02; // Very rare for stars
        } else if (isExpendable) {
            loanProbability = 0.40; // 40% chance for rotation players
        }
        isLoanOffer = Math.random() < loanProbability;
    }

    const buyingTeamNames = ['Aslanlar SK', 'Kartallar FK', 'Kanaryalar SK', 'Kurtlarspor', 'Panterler İdman Yurdu', 'Ankara Gücü', 'İzmir İdman Yurdu', 'Adana Şimşekspor', 'Bozkurtlar FC', 'Yunuslar SK', 'Timsahlar SK'];
    const fromTeamName = buyingTeamNames[Math.floor(Math.random() * buyingTeamNames.length)];
    const id = generateId();

    if (isLoanOffer) {
        // Loan Offer Details
        // If loan listed, AI makes slightly better offers (higher wage contribution) to attract deal
        const baseWageContrib = targetPlayer.loanListed ? 70 : 40;
        const wageContribution = Math.min(100, Math.floor(Math.random() * (100 - baseWageContrib)) + baseWageContrib); 
        
        const monthlyFee = Math.max(0.01, targetPlayer.value * (Math.random() * 0.05)); // Small rental fee

        return [{
            id,
            playerId: targetPlayer.id,
            playerName: targetPlayer.name,
            fromTeamName,
            amount: 0, // No transfer fee for loan
            date,
            type: 'LOAN',
            loanDetails: {
                wageContribution,
                duration: 'Sezon Sonu',
                monthlyFee: parseFloat(monthlyFee.toFixed(3))
            }
        }];
    } else {
        // Transfer Offer
        // If transfer listed, might offer slightly below value (bargain hunting)
        // If scouted (unlisted), might offer value or slightly above
        
        let offerRatio = 1.0;
        if (targetPlayer.transferListed) {
            offerRatio = 0.8 + Math.random() * 0.3; // 0.8 to 1.1
        } else {
            offerRatio = 0.9 + Math.random() * 0.4; // 0.9 to 1.3
        }
        
        return [{
            id,
            playerId: targetPlayer.id,
            playerName: targetPlayer.name,
            fromTeamName,
            amount: Number((targetPlayer.value * offerRatio).toFixed(1)),
            date,
            type: 'TRANSFER'
        }];
    }
};
