
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

// --- AI SQUAD OPTIMIZATION ---
/**
 * Reorders the AI team's players array so that the best available (non-injured, non-suspended)
 * players are in the First 11 (indices 0-10).
 * Index 0 is always a Goalkeeper.
 */
export const optimizeAiSquad = (team: Team, currentWeek: number): Team => {
    const allPlayers = [...team.players];

    // 1. Separate Available vs Unavailable
    const unavailable: Player[] = [];
    const available: Player[] = [];

    allPlayers.forEach(p => {
        const isInjured = p.injury && p.injury.daysRemaining > 0;
        
        // Check suspensions (Legacy + New Map)
        const isSuspendedLegacy = p.suspendedUntilWeek && p.suspendedUntilWeek > currentWeek;
        const isSuspendedMap = p.suspensions && Object.values(p.suspensions).some(v => v > 0);

        if (isInjured || isSuspendedLegacy || isSuspendedMap) {
            unavailable.push(p);
        } else {
            available.push(p);
        }
    });

    // 2. Sort available by skill (descending)
    available.sort((a, b) => b.skill - a.skill);

    // 3. Select Goalkeeper
    const gkIndex = available.findIndex(p => p.position === Position.GK);
    let selectedGK: Player;
    
    if (gkIndex !== -1) {
        selectedGK = available[gkIndex];
        available.splice(gkIndex, 1);
    } else if (unavailable.length > 0) {
         // Edge Case: No healthy GK. Check unavailable list.
         const unAvGKIndex = unavailable.findIndex(p => p.position === Position.GK);
         if (unAvGKIndex !== -1) {
             selectedGK = unavailable[unAvGKIndex];
             unavailable.splice(unAvGKIndex, 1);
         } else {
             // Disaster: Force best available outfield player as GK
             selectedGK = available[0];
             available.shift();
         }
    } else {
         // Should realistically not happen with full squads
         return team;
    }

    // 4. Select Best 10 Outfielders
    const startingOutfielders = available.slice(0, 10);
    const benchAndReserves = available.slice(10);

    // 5. Reconstruct Roster: [GK, ...XI, ...Bench/Reserves, ...Unavailable]
    // The simulation engine uses indices 0-10 as the active lineup.
    const newRoster = [selectedGK, ...startingOutfielders, ...benchAndReserves, ...unavailable];

    return {
        ...team,
        players: newRoster
    };
};

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
 * UPDATED: Handles competition-specific suspensions.
 */
export const processMatchPostGame = (teams: Team[], events: MatchEvent[], week: number, fixtures: Fixture[]): Team[] => {
    return teams.map(team => {
        const fixture = fixtures.find(f => f.week === week && (f.homeTeamId === team.id || f.awayTeamId === team.id));
        if (!fixture || !fixture.played) return team;

        // Identify competition ID for suspension tracking
        let compId = fixture.competitionId || 'LEAGUE';
        if (compId === 'PLAYOFF_FINAL') compId = 'PLAYOFF'; 
        if (compId === 'PLAYOFF' && team.leagueId === 'LEAGUE_1') compId = 'LEAGUE_1'; 

        const teamEvents = events.filter(e => e.teamName === team.name);
        
        const updatedPlayers = team.players.map(player => {
            // FIX: Ensure stats are initialized if missing (migration safety)
            if (!player.seasonStats.processedMatchIds) player.seasonStats.processedMatchIds = [];
            
            // CRITICAL CHECK: Has this player already been processed for this fixture?
            // This prevents double-decrementing suspensions if function runs multiple times.
            if (player.seasonStats.processedMatchIds.includes(fixture.id)) {
                return player;
            }

            const newSeasonStats = { ...player.seasonStats };
            let hasProcessed = false; // Flag to check if we did anything to mark this match as processed

            // Initialize suspensions map if missing
            let suspensions = { ...(player.suspensions || {}) };
            
            // --- 1. SERVING SUSPENSION LOGIC ---
            // If the player was suspended for THIS competition, and the team played a match, decrement.
            // This happens regardless of whether they played (in fact, they shouldn't have played).
            if (suspensions[compId] && suspensions[compId] > 0) {
                suspensions[compId] -= 1;
                if (suspensions[compId] <= 0) {
                    delete suspensions[compId]; // Remove key if 0
                }
                hasProcessed = true; // We processed a suspension event
            }

            const ratings = fixture.homeTeamId === team.id ? fixture.stats?.homeRatings : fixture.stats?.awayRatings;
            const pPerf = ratings?.find(r => r.playerId === player.id);

            // If player played, update stats
            if (pPerf) {
                const playerEvents = teamEvents.filter(e => e.playerId === player.id || e.scorer === player.name || e.assist === player.name);
                
                const goals = playerEvents.filter(e => e.type === 'GOAL' && (e.scorer === player.name || e.playerId === player.id)).length;
                const assists = playerEvents.filter(e => e.type === 'GOAL' && e.assist === player.name).length;
                const yellows = playerEvents.filter(e => e.type === 'CARD_YELLOW').length;
                const reds = playerEvents.filter(e => e.type === 'CARD_RED' || e.type === 'FIGHT' || e.type === 'ARGUMENT').length;
                
                // Increment Stats
                newSeasonStats.goals += goals;
                newSeasonStats.assists += assists;
                // Yellows updated below with accumulation logic
                // newSeasonStats.yellowCards += yellows; 
                newSeasonStats.redCards += reds;
                newSeasonStats.matchesPlayed += 1;
                newSeasonStats.ratings.push(pPerf.rating);
                newSeasonStats.averageRating = Number((newSeasonStats.ratings.reduce((a, b) => a + b, 0) / newSeasonStats.ratings.length).toFixed(2));
                
                // --- SUSPENSION ACCUMULATION LOGIC ---
                // Calculate Accumulated Yellows
                let accumulatedYellows = newSeasonStats.yellowCards + yellows;
                
                // Rule: 4 Yellow Cards -> 1 Match Ban & Reset
                if (accumulatedYellows >= 4) {
                    suspensions[compId] = (suspensions[compId] || 0) + 1;
                    accumulatedYellows = 0; // Reset accumulation
                }
                newSeasonStats.yellowCards = accumulatedYellows;

                // Rule: Red Card -> 1 Match Ban
                if (reds > 0) {
                    suspensions[compId] = (suspensions[compId] || 0) + 1;
                }
                
                hasProcessed = true;
            }

            // --- LEGACY SUSPENSION COMPATIBILITY ---
            // If we added a new suspension above, also set the legacy suspendedUntilWeek for safety
            // (Used by some UI components or older logic)
            let suspensionTarget = player.suspendedUntilWeek;
            if (hasProcessed && (suspensions[compId] || 0) > 0) {
                 // Set to cover next match (Current Week + 2 ensures > Current Week + 1 check passes)
                 suspensionTarget = week + 2; 
            }

            // --- INJURY & CONDITION ---
            let newCondition = player.condition !== undefined ? player.condition : player.stats.stamina;
            let updatedInjury = player.injury;

            if (pPerf) {
                // Condition drops only if played
                newCondition = Math.max(0, newCondition - (20 + Math.random() * 10));
                
                // Check for new injuries from events
                const injuryEvent = teamEvents.find(e => e.type === 'INJURY' && e.playerId === player.id);
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
            }

            // MARK AS PROCESSED
            // If we touched suspension OR stats, mark ID to prevent double processing
            if (hasProcessed) {
                newSeasonStats.processedMatchIds = [...newSeasonStats.processedMatchIds, fixture.id];
            }

            return {
                ...player,
                seasonStats: newSeasonStats,
                condition: newCondition,
                injury: updatedInjury,
                suspendedUntilWeek: suspensionTarget,
                suspensions: suspensions 
            };
        });
        return { ...team, players: updatedPlayers };
    });
};

/**
 * Handles daily transfer simulations for AI-controlled teams.
 * REWRITTEN: NO SQUAD LIMITS (USER REQUEST).
 * UPDATED: Added budget reservation logic and flexible selling for good offers.
 * UPDATED (v2): Small teams (Strength < 75) sell more. All teams must sell min 4 players in Summer.
 */
export const simulateAiDailyTransfers = (
    teams: Team[], 
    date: string, 
    week: number, 
    myTeamId: string | null,
    globalTransferList: Player[] = []
): { updatedTeams: Team[], updatedTransferList: Player[], newNews: NewsItem[] } => {
    
    if (!isTransferWindowOpen(date)) return { updatedTeams: teams, updatedTransferList: globalTransferList, newNews: [] };

    // --- TIME BASED ACTIVITY CALCULATOR ---
    const d = new Date(date);
    const month = d.getMonth(); // 6=July, 7=Aug, 8=Sept, 0=Jan
    const day = d.getDate();

    let teamActivityChance = 0.0; 
    let maxGlobalTransfers = 0; 
    let minSkillGap = 0; 
    let baseSellChance = 0.10; 
    
    // --- BUDGET RESERVATION LOGIC ---
    // If Summer (July/Aug), AI reserves 20-30% for Winter
    const isSummer = month === 6 || month === 7 || (month === 8 && day <= 1);
    const reserveRatio = isSummer ? (0.20 + Math.random() * 0.10) : 0; // 20-30% reserve in summer, 0 in winter

    if (month === 6) { // JULY
        if (day <= 15) { 
            teamActivityChance = 0.10; 
            maxGlobalTransfers = 4;
            minSkillGap = 3;
            baseSellChance = 0.05; 
        } else {
            teamActivityChance = 0.20;
            maxGlobalTransfers = 8;
            minSkillGap = 1;
            baseSellChance = 0.15;
        }
    } else if (month === 7) { // AUGUST
        if (day <= 15) {
            teamActivityChance = 0.40;
            maxGlobalTransfers = 15;
            minSkillGap = -2;
            baseSellChance = 0.30;
        } else {
            teamActivityChance = 0.85; 
            maxGlobalTransfers = 25; 
            minSkillGap = -5;
            baseSellChance = 0.50; 
        }
    } else if (month === 8 && day <= 1) { 
        // Deadline Day
        teamActivityChance = 1.0; 
        maxGlobalTransfers = 60;
        minSkillGap = -5;
        baseSellChance = 0.60;
    } else if (month === 0) { // JANUARY
         teamActivityChance = 0.25;
         maxGlobalTransfers = 8;
         minSkillGap = 0;
         baseSellChance = 0.20;
    }

    const newNews: NewsItem[] = [];
    let updatedTeams = [...teams];
    let updatedTransferList = [...globalTransferList];
    let globalTransactionCount = 0;

    // Filter AI teams
    const aiTeams = updatedTeams.filter(t => t.id !== myTeamId);
    const shuffledAiTeams = aiTeams.sort(() => 0.5 - Math.random());

    for (let team of shuffledAiTeams) {
        if (globalTransactionCount >= maxGlobalTransfers) break;

        const history = team.transferHistory || [];
        const buysCount = history.filter(h => h.type === 'BOUGHT').length;
        
        // --- CONSTRAINT 2: MINIMUM 4 SALES PER SUMMER ---
        const soldCount = history.filter(h => h.type === 'SOLD').length;
        const mustSellForQuota = isSummer && soldCount < 4;
        
        // --- CONSTRAINT 1: SMALL TEAMS SELL MORE ---
        // Teams with < 75 strength are considered "Feeder Clubs" / Small Teams with less budget
        const isSmallTeam = team.strength < 75;

        const squadSize = team.players.length;
        const maxSquadSize = 42; 
        // Absolute minimum to function is 15 (11+4). They should avoid selling below 20 unless great offer.
        const criticalMinSquad = 15; 
        const healthyMinSquad = 20;

        const isBroke = team.budget < 3; 
        const isHardCapped = squadSize >= maxSquadSize; 

        // SELLING MOTIVATION
        const needsToSell = isBroke || isHardCapped || mustSellForQuota;
        
        // Opportunity Sell (Surplus clearing) - Increased for Small Teams
        const opportunityBase = isSmallTeam ? 0.30 : 0.12; 
        const opportunitySell = squadSize > healthyMinSquad && Math.random() < opportunityBase; 

        // --- NEW: GOOD OFFER LOGIC ---
        // Simulates receiving an offer above market value.
        // Small teams get tempted more easily (20% vs 5% for big teams)
        const offerChance = isSmallTeam ? 0.20 : 0.05;
        const isIrresistibleOffer = Math.random() < offerChance; 

        // Can we sell? Yes if squad is healthy OR if it's a great offer (and we are above critical limit)
        // OR if we HAVE to sell for quota (and > critical)
        const canSell = squadSize > healthyMinSquad || ((isIrresistibleOffer || mustSellForQuota) && squadSize > criticalMinSquad);

        // BUYING MOTIVATION
        // Calculate Effective Budget (Reserve logic)
        const effectiveBudget = Math.max(0, team.budget * (1 - reserveRatio));

        const canBuy = effectiveBudget > 2 && squadSize < maxSquadSize;
        const needsToBuy = squadSize < 24 || (buysCount < 10 && canBuy);

        let currentTeamChance = teamActivityChance;
        if (needsToBuy && buysCount === 0 && month === 7) currentTeamChance += 0.3; 
        if (squadSize < 20) currentTeamChance += 0.4; 
        
        // Boost activity for small teams (more churning) and those who need to meet quota
        if (isSmallTeam) currentTeamChance += 0.2;
        if (mustSellForQuota) currentTeamChance = 0.95; // Force check

        if (Math.random() > currentTeamChance) continue;

        let actionTaken = false;

        // --- SELLING LOGIC ---
        // Sell if broke, hard capped, opportunity, quota needs, OR irresistible offer
        if ((needsToSell || opportunitySell || isIrresistibleOffer) && canSell && !actionTaken) {
            let effectiveSellChance = baseSellChance;
            
            if (isBroke || isHardCapped || mustSellForQuota) effectiveSellChance = 0.95; // Highly motivated
            else if (isIrresistibleOffer) effectiveSellChance = 0.90; // Almost always accept great offer
            else if (opportunitySell) effectiveSellChance = 0.25; 
            
            // Small teams always have slightly higher sell bias if offer is decent
            if (isSmallTeam && !isIrresistibleOffer) effectiveSellChance += 0.15;

            if (Math.random() < effectiveSellChance) {
                let candidates = team.players.filter(p => !p.transferListed);
                
                // If forced to sell (Broke/Cap/Quota), lower standards for who goes
                if (needsToSell || isHardCapped || mustSellForQuota) {
                    // Small teams or Desperate teams sell key players too if needed
                    let weakLinks;
                    if (isSmallTeam || mustSellForQuota) {
                        // Can sell anyone except maybe top 1-2 stars if desperate
                         weakLinks = candidates.filter(p => p.squadStatus !== 'STAR');
                         if (weakLinks.length === 0) weakLinks = candidates; // Sell anyone
                    } else {
                        // Big teams protect core
                        weakLinks = candidates.filter(p => 
                            ['SURPLUS', 'JOKER', 'ROTATION'].includes(p.squadStatus || '') || 
                            p.age > 33 || 
                            p.skill < team.strength - 5
                        );
                    }
                    
                    if (weakLinks.length > 0) candidates = weakLinks;
                    // else fallback to all candidates
                } else if (isIrresistibleOffer) {
                    // If good offer, it usually targets good players
                    let valuablePlayers = candidates.filter(p => p.value > 5);
                    if (valuablePlayers.length > 0) candidates = valuablePlayers;
                }
                
                if (needsToSell) {
                    // If small team needs money, sell highest value? No, usually sell mid-range.
                    // For quota/broke, sell somewhat randomly or worst.
                    candidates.sort((a,b) => a.skill - b.skill); // Sell worst first typically
                } else {
                    candidates.sort(() => 0.5 - Math.random()); // Random pick
                }

                if (candidates.length > 0) {
                    const toSell = candidates[0];
                    const teamIdx = updatedTeams.findIndex(t => t.id === team.id);
                    
                    let counterparty = 'Yurt Dışı Kulübü';
                    
                    // Determine Price
                    let finalPrice = toSell.value;
                    if (isIrresistibleOffer) {
                        // "Good Offer" -> 20-50% Markup
                        finalPrice = toSell.value * (1.2 + Math.random() * 0.3);
                    } else if (isBroke || isHardCapped) {
                        // Distressed Sell -> Market value or slightly less
                         if (toSell.value < 0.5 && isHardCapped) {
                             counterparty = 'Serbest (Fesih)';
                             finalPrice = 0; // Free release
                             updatedTeams[teamIdx].budget -= 0.1; // Termination fee
                         }
                    }

                    // Apply Budget Update
                    if (counterparty !== 'Serbest (Fesih)') {
                         updatedTeams[teamIdx].budget += finalPrice;
                    }

                    updatedTeams[teamIdx].players = updatedTeams[teamIdx].players.filter(p => p.id !== toSell.id);
                    
                    const d = new Date(date);
                    const dateStr = `${d.getDate()} ${d.getMonth() === 6 ? 'Tem' : d.getMonth() === 7 ? 'Ağu' : d.getMonth() === 0 ? 'Oca' : 'Eyl'}`;
                    
                    const priceDisplay = finalPrice === 0 ? 'Bedelsiz' : `${finalPrice.toFixed(1)} M€`;
                    
                    const record: TransferRecord = {
                        date: dateStr,
                        playerName: toSell.name,
                        type: 'SOLD',
                        counterparty: counterparty,
                        price: priceDisplay
                    };
                    if (!updatedTeams[teamIdx].transferHistory) updatedTeams[teamIdx].transferHistory = [];
                    updatedTeams[teamIdx].transferHistory.push(record);
                    
                    if (finalPrice > 3) {
                        newNews.push({
                            id: generateId(),
                            week,
                            type: 'TRANSFER',
                            title: `${team.name}|@Transfer|OFFICIAL`,
                            content: `${team.name}, ${toSell.name} isimli oyuncusu ile yollarını ayırdı. Bonservis bedeli: ${priceDisplay}.`
                        });
                    }

                    team = updatedTeams[teamIdx];
                    actionTaken = true;
                    globalTransactionCount++;
                }
            }
        }

        // --- BUYING LOGIC ---
        // Buy if needs/wants to buy AND has effective budget AND has space
        // Small teams buy less frequently unless replacing sold players (budget recycled)
        if (canBuy && needsToBuy && !actionTaken) {
             let buyChance = (month === 6 && day <= 15) ? 0.20 : (buysCount < 5 ? 0.60 : 0.20);
             if (squadSize < 20) buyChance = 0.90; // Panic buy

             if (Math.random() < buyChance) {
                 const positions = [Position.GK, Position.STP, Position.SLB, Position.SGB, Position.OS, Position.SLK, Position.SGK, Position.SNT];
                 let targetPos = Position.OS; 
                 
                 let minCount = 99;
                 positions.forEach(pos => {
                     const cnt = team.players.filter(p => p.position === pos).length;
                     if (cnt < minCount) { minCount = cnt; targetPos = pos; }
                 });

                 // Relax skill gap if desperate
                 let effectiveSkillGap = minSkillGap;
                 if (squadSize < 20) effectiveSkillGap = -10; // Take anyone decent

                 let candidates = updatedTransferList.filter(p => 
                     p.value <= effectiveBudget && // Use Reserved Budget Logic
                     p.skill >= (team.strength + effectiveSkillGap) 
                 );
                 
                 const posCandidates = candidates.filter(p => p.position === targetPos);
                 if (posCandidates.length > 0) candidates = posCandidates;

                 if (candidates.length > 0) {
                     candidates.sort((a,b) => b.skill - a.skill);
                     const candidate = candidates[0];
                     
                     const buyerIdx = updatedTeams.findIndex(t => t.id === team.id);
                     let sellerIdx = -1;
                     let sellerTeamName = 'Serbest';
                    
                     if (candidate.teamId !== 'free_agent' && candidate.teamId !== 'foreign') {
                        sellerIdx = updatedTeams.findIndex(t => t.id === candidate.teamId);
                        if (sellerIdx !== -1) sellerTeamName = updatedTeams[sellerIdx].name;
                     } else if (candidate.teamId === 'foreign') {
                        sellerTeamName = 'Yurt Dışı Kulübü';
                     }

                     updatedTeams[buyerIdx].budget -= candidate.value;
                     if (sellerIdx !== -1) {
                        updatedTeams[sellerIdx].budget += candidate.value;
                        updatedTeams[sellerIdx].players = updatedTeams[sellerIdx].players.filter(p => p.id !== candidate.id);
                     }
                     
                     updatedTransferList = updatedTransferList.filter(p => p.id !== candidate.id);

                     const newPlayer = { 
                        ...candidate, 
                        teamId: team.id, 
                        transferListed: false,
                        loanListed: false,
                        jersey: updatedTeams[buyerIdx].jersey,
                        clubName: undefined 
                     };
                     updatedTeams[buyerIdx].players.push(newPlayer);
                     
                     const d = new Date(date);
                     const dateStr = `${d.getDate()} ${d.getMonth() === 6 ? 'Tem' : d.getMonth() === 7 ? 'Ağu' : d.getMonth() === 0 ? 'Oca' : 'Eyl'}`;
                     const record: TransferRecord = {
                        date: dateStr,
                        playerName: candidate.name,
                        type: 'BOUGHT',
                        counterparty: sellerTeamName,
                        price: `${candidate.value} M€`
                     };
                     if (!updatedTeams[buyerIdx].transferHistory) updatedTeams[buyerIdx].transferHistory = [];
                     updatedTeams[buyerIdx].transferHistory.push(record);
                     
                     if (sellerIdx !== -1) {
                         const sRecord: TransferRecord = {
                            date: dateStr,
                            playerName: candidate.name,
                            type: 'SOLD',
                            counterparty: team.name,
                            price: `${candidate.value} M€`
                         };
                         if (!updatedTeams[sellerIdx].transferHistory) updatedTeams[sellerIdx].transferHistory = [];
                         updatedTeams[sellerIdx].transferHistory.push(sRecord);
                     }

                     updatedTeams[buyerIdx] = recalculateTeamStrength(updatedTeams[buyerIdx]);
                     if (sellerIdx !== -1) updatedTeams[sellerIdx] = recalculateTeamStrength(updatedTeams[sellerIdx]);

                     newNews.push({
                        id: generateId(),
                        week,
                        type: 'TRANSFER',
                        title: `${team.name}|@Transfer|OFFICIAL`,
                        // Updated Tweet Text
                        content: `Ailemize hoş geldin ${candidate.name}! ✍️ ${candidate.value.toFixed(1)} M€ bedelle kadromuza kattık. Camiamıza hayırlı olsun. #Transfer`
                     });
                     
                     globalTransactionCount++;
                 }
             }
        }
    }

    return { updatedTeams, updatedTransferList, newNews };
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
            seasonStats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, ratings: [], averageRating: 0, matchesPlayed: 0, processedMatchIds: [] },
            suspensions: {} // Clear suspensions on new season
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
    // UPDATED: Exclude Injured Players
    
    const isHealthy = (p: Player) => !p.injury || p.injury.daysRemaining <= 0;

    const listedPlayers = myTeam.players.filter(p => (p.transferListed || p.loanListed) && isHealthy(p));
    const unlistedPlayers = myTeam.players.filter(p => !p.transferListed && !p.loanListed && p.value > 0 && isHealthy(p));
    
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
