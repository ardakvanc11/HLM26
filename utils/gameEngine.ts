
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

// --- LOAN RETURN LOGIC ---
export const processLoanReturns = (teams: Team[], date: string, currentWeek: number): { updatedTeams: Team[], returnNews: NewsItem[] } => {
    let updatedTeams = JSON.parse(JSON.stringify(teams)) as Team[]; // Deep copy to avoid mutation issues during swaps
    const returnNews: NewsItem[] = [];
    const today = new Date(date);

    // 1. Check players currently IN a squad (Loaned IN from somewhere)
    // This covers: User loaned a player IN, or AI loaned a player IN.
    for (let i = 0; i < updatedTeams.length; i++) {
        const team = updatedTeams[i];
        
        // Find players whose loan expires today or passed
        const returningPlayers = team.players.filter(p => {
             if (!p.loanInfo) return false;
             const returnDate = new Date(p.loanInfo.returnDate);
             // Return if today is ON or AFTER the return date
             return today >= returnDate;
        });

        if (returningPlayers.length > 0) {
            // Remove from current team
            team.players = team.players.filter(p => !returningPlayers.some(rp => rp.id === p.id));
            
            // Return to Original Team
            returningPlayers.forEach(rp => {
                const originalTeamId = rp.loanInfo!.originalTeamId;
                const originalTeamIdx = updatedTeams.findIndex(t => t.id === originalTeamId);
                
                // Clear Loan Info
                const returnedPlayer = { ...rp, loanInfo: undefined, teamId: originalTeamId, clubName: undefined };

                if (originalTeamIdx !== -1) {
                    updatedTeams[originalTeamIdx].players.push(returnedPlayer);
                    
                    returnNews.push({
                        id: generateId(),
                        week: currentWeek,
                        type: 'TRANSFER',
                        title: `${updatedTeams[originalTeamIdx].name}|@Transfer|OFFICIAL`,
                        content: `Kiralık sözleşmesi sona eren ${rp.name}, kulübüne (${updatedTeams[originalTeamIdx].name}) geri döndü.`
                    });
                } else {
                    // If original team is 'foreign' or 'free_agent' (Not in game DB)
                    // They basically disappear from the current team (already removed above)
                    if (originalTeamId === 'foreign' || originalTeamId === 'free_agent') {
                        returnNews.push({
                            id: generateId(),
                            week: currentWeek,
                            type: 'TRANSFER',
                            title: `${team.name}|@Transfer|OFFICIAL`,
                            content: `${rp.name} ile olan kiralık sözleşmemiz sona erdi ve oyuncu kulübüne döndü.`
                        });
                    }
                }
            });
            
            // Re-calculate strength for the team that lost players
            updatedTeams[i] = recalculateTeamStrength(team);
            // Re-calculate for the team that gained players (done in loop if we find index, but safer to do it lazily or here)
            // Note: If originalTeamIdx was found, we modified updatedTeams[originalTeamIdx] directly above.
        }
    }

    // 2. Check players currently OUT on loan (Loaned OUT to "Foreign/Non-Playable")
    // Players loaned to IN-GAME teams are handled in step 1 (because they exist in that team's roster).
    // This step is specifically for players loaned to 'foreign' clubs who sit in the 'loanedOutPlayers' array.
    for (let i = 0; i < updatedTeams.length; i++) {
        const team = updatedTeams[i];
        
        if (team.loanedOutPlayers && team.loanedOutPlayers.length > 0) {
            const returningFromForeign = team.loanedOutPlayers.filter(p => {
                if (!p.loanInfo) return true; // Should have info, if not return them to be safe
                const returnDate = new Date(p.loanInfo.returnDate);
                return today >= returnDate;
            });

            if (returningFromForeign.length > 0) {
                 // Remove from loanedOut list
                 team.loanedOutPlayers = team.loanedOutPlayers.filter(p => !returningFromForeign.some(rp => rp.id === p.id));
                 
                 // Add back to main squad
                 returningFromForeign.forEach(rp => {
                     const returnedPlayer = { ...rp, loanInfo: undefined, teamId: team.id, clubName: undefined };
                     team.players.push(returnedPlayer);
                     
                     returnNews.push({
                        id: generateId(),
                        week: currentWeek,
                        type: 'TRANSFER',
                        title: `${team.name}|@Transfer|OFFICIAL`,
                        content: `Yurt dışına kiralık olarak gönderilen ${rp.name}, sözleşmesi biterek takımımıza geri katıldı.`
                    });
                 });
                 
                 // Recalculate strength
                 updatedTeams[i] = recalculateTeamStrength(team);
            }
        }
    }

    return { updatedTeams, returnNews };
};

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
                recentChanges[targetStat as string] = 'DOWN';
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
                recentChanges[targetStat as string] = 'UP';
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
                
                // Count Yellows (Including second yellow leading to red)
                const yellows = playerEvents.filter(e => 
                    e.type === 'CARD_YELLOW' || 
                    (e.type === 'CARD_RED' && e.description.toLowerCase().includes('ikinci sarı'))
                ).length;

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
 * UPDATED (v3): Added Activity Cooldown (Teams won't transfer every day).
 * UPDATED (v4): Added Context Aware Transfers (Need based)
 * UPDATED (v5): REDUCED SALES BY 50% & REMOVED QUOTA RULES
 */
export const simulateAiDailyTransfers = (
    teams: Team[], 
    date: string, 
    week: number, 
    myTeamId: string | null,
    globalTransferList: Player[] = []
): { updatedTeams: Team[], updatedTransferList: Player[], newNews: NewsItem[] } => {
    
    if (!isTransferWindowOpen(date)) return { updatedTeams: teams, updatedTransferList: globalTransferList, newNews: [] };

    // --- PRE-CALCULATE STANDINGS FOR CONTEXT ---
    // This allows us to know if a team is in title race or relegation battle
    const standingsMap = new Map<string, number>(); // TeamID -> Rank
    
    // Group by league
    const leagueGroups = new Map<string, Team[]>();
    teams.forEach(t => {
        const lid = t.leagueId || 'LEAGUE';
        if(!leagueGroups.has(lid)) leagueGroups.set(lid, []);
        leagueGroups.get(lid)?.push(t);
    });

    leagueGroups.forEach((groupTeams) => {
        const sorted = [...groupTeams].sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
            return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
        });
        sorted.forEach((t, index) => {
            standingsMap.set(t.id, index + 1);
        });
    });

    // --- TIME BASED ACTIVITY CALCULATOR ---
    const d = new Date(date);
    const month = d.getMonth(); // 6=July, 7=Aug, 8=Sept, 0=Jan
    const day = d.getDate();

    // --- DEADLINE DAY DETECTION ---
    const isDeadlineDay = (month === 8 && day <= 1) || (month === 1 && day <= 1);

    let teamActivityChance = 0.0; 
    let maxGlobalTransfers = 0; 
    
    // --- SELLING CHANCE REDUCTION (50% REDUCTION APPLIED) ---
    let baseSellChance = 0.05; // Was 0.10
    
    // --- BUDGET RESERVATION LOGIC ---
    const isSummer = month === 6 || month === 7 || (month === 8 && day <= 1);
    const reserveRatio = (isSummer && !isDeadlineDay) ? (0.20 + Math.random() * 0.10) : 0; 

    if (month === 6) { // JULY
        if (day <= 15) { teamActivityChance = 0.08; maxGlobalTransfers = 3; baseSellChance = 0.10; } // Was 0.20
        else { teamActivityChance = 0.12; maxGlobalTransfers = 7; baseSellChance = 0.12; } // Was 0.25
    } else if (month === 7) { // AUGUST
        if (day <= 15) { teamActivityChance = 0.70; maxGlobalTransfers = 25; baseSellChance = 0.22; } // Was 0.45
        else { teamActivityChance = 0.85; maxGlobalTransfers = 30; baseSellChance = 0.25; } // Was 0.50
    } else if (isDeadlineDay) { 
        teamActivityChance = 0.55; maxGlobalTransfers = 60; baseSellChance = 0.30; // Was 0.60
    } else if (month === 0) { // JANUARY
         teamActivityChance = 0.35; maxGlobalTransfers = 10; baseSellChance = 0.12; // Was 0.25
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

        // --- COOLDOWN CHECK ---
        if (team.lastTransferActivityDate && !isDeadlineDay) {
            const lastActivity = new Date(team.lastTransferActivityDate);
            const diffTime = Math.abs(d.getTime() - lastActivity.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays < 4) continue;
        }

        const history = team.transferHistory || [];
        const buysCount = history.filter(h => h.type === 'BOUGHT').length;
        const soldCount = history.filter(h => h.type === 'SOLD').length;
        
        // --- QUOTA RULE REMOVED ---
        const mustSellForQuota = false; // DISABLED: isSummer && soldCount < 4;
        
        const isSmallTeam = team.strength < 75;
        const squadSize = team.players.length;
        
        // --- SQUAD SIZE RELAXED ---
        const maxSquadSize = 34; // Increased from 42 to prevent forced bloat sales
        const healthyMinSquad = 20;

        const effectiveBudget = Math.max(0, team.budget * (1 - reserveRatio));
        const budgetToUse = isDeadlineDay ? team.budget : effectiveBudget;
        const canBuy = budgetToUse > 2 && squadSize < maxSquadSize;

        // --- NEEDS ANALYSIS (NEW) ---
        // 1. Analyze Squad Composition & Quality
        const posStats = {
            GK: { count: 0, avgSkill: 0 },
            DEF: { count: 0, avgSkill: 0 }, // STP, SLB, SGB
            MID: { count: 0, avgSkill: 0 }, // OS, OOS
            FWD: { count: 0, avgSkill: 0 }  // SNT, SLK, SGK
        };

        let totalSkill = 0;
        team.players.forEach(p => {
            let cat: 'GK'|'DEF'|'MID'|'FWD' = 'MID';
            if (p.position === 'GK') cat = 'GK';
            else if (['STP','SLB','SGB'].includes(p.position)) cat = 'DEF';
            else if (['OS','OOS'].includes(p.position)) cat = 'MID';
            else cat = 'FWD';

            posStats[cat].count++;
            posStats[cat].avgSkill += p.skill;
            totalSkill += p.skill;
        });

        // Compute averages
        posStats.GK.avgSkill = posStats.GK.count > 0 ? posStats.GK.avgSkill / posStats.GK.count : 0;
        posStats.DEF.avgSkill = posStats.DEF.count > 0 ? posStats.DEF.avgSkill / posStats.DEF.count : 0;
        posStats.MID.avgSkill = posStats.MID.count > 0 ? posStats.MID.avgSkill / posStats.MID.count : 0;
        posStats.FWD.avgSkill = posStats.FWD.count > 0 ? posStats.FWD.avgSkill / posStats.FWD.count : 0;
        const teamAvgSkill = team.players.length > 0 ? totalSkill / team.players.length : 0;

        // 2. Determine Context (Rank)
        const currentRank = standingsMap.get(team.id) || 10;
        const totalInLeague = teams.filter(t => (t.leagueId || 'LEAGUE') === (team.leagueId || 'LEAGUE')).length;
        
        const isRelegationBattle = currentRank >= (totalInLeague - 3);
        const isTitleContender = currentRank <= 4;
        
        // 3. Identify Buying Need (Target)
        let buyTarget: { posCategory: 'GK'|'DEF'|'MID'|'FWD'|'ANY', minSkill: number, reason: string } | null = null;

        // Rule A: Critical Deficiency
        if (posStats.GK.count < 2) {
            buyTarget = { posCategory: 'GK', minSkill: teamAvgSkill - 5, reason: 'Kadroda yeterli kaleci bulunmadığı için...' };
        } else if (squadSize < 20) {
            // Fill lowest count position
            const lowest = Object.entries(posStats).sort((a,b) => a[1].count - b[1].count)[0];
            buyTarget = { posCategory: lowest[0] as any, minSkill: teamAvgSkill - 5, reason: 'Kadro derinliğini artırmak için...' };
        } 
        else {
            // Rule B: Replacement (Recent Sale)
            // Check if sold a player for > 10M recently (last 7 days logic simplified to check 'SOLD' type in recent history)
            // Since we don't have exact days in history easily, let's check current session logic or just random chance if soldCount > buysCount
            if (soldCount > buysCount && Math.random() < 0.5) {
                 const lowest = Object.entries(posStats).sort((a,b) => a[1].count - b[1].count)[0];
                 buyTarget = { posCategory: lowest[0] as any, minSkill: teamAvgSkill, reason: 'Giden oyuncuların yerini doldurmak için...' };
            }
            // Rule C: Performance Pressure
            else if (isRelegationBattle) {
                // Find weakest link (lowest avg skill) and buy upgrade
                const weakest = Object.entries(posStats).sort((a,b) => a[1].avgSkill - b[1].avgSkill)[0];
                buyTarget = { posCategory: weakest[0] as any, minSkill: teamAvgSkill + 2, reason: 'Küme düşme hattından uzaklaşmak ve kaliteyi artırmak için...' };
            }
            else if (isTitleContender) {
                // Buy depth for strongest area or fix minor weakness
                // Let's buy depth for thin lines
                const thinnest = Object.entries(posStats).sort((a,b) => a[1].count - b[1].count)[0];
                buyTarget = { posCategory: thinnest[0] as any, minSkill: teamAvgSkill - 2, reason: 'Şampiyonluk yarışında kadro alternatiflerini artırmak için...' };
            }
            // Rule D: Opportunity / General Improvement
            else if (Math.random() < 0.2) {
                // Random position upgrade
                const cats = ['DEF', 'MID', 'FWD'];
                const rndCat = cats[Math.floor(Math.random() * cats.length)];
                buyTarget = { posCategory: rndCat as any, minSkill: teamAvgSkill, reason: 'Gelecek sezon planlaması kapsamında...' };
            }
        }

        const needsToBuy = !!buyTarget || isDeadlineDay;

        // --- EXECUTION ---

        let currentTeamChance = teamActivityChance;
        if (needsToBuy) currentTeamChance += 0.2; 
        if (mustSellForQuota) currentTeamChance = 0.95;

        if (Math.random() > currentTeamChance) continue;

        let actionTaken = false;

        // --- SELLING LOGIC (REDUCED PROBABILITIES) ---
        const needsToSell = team.budget < 3 || squadSize >= maxSquadSize || mustSellForQuota;
        
        // Halved Opportunity & Irresistible Offer Chances
        const opportunitySell = squadSize > healthyMinSquad && Math.random() < (isSmallTeam ? 0.15 : 0.06); // Reduced
        const isIrresistibleOffer = Math.random() < (isSmallTeam ? 0.10 : 0.02); // Reduced
        
        const canSell = squadSize > healthyMinSquad || ((isIrresistibleOffer || mustSellForQuota) && squadSize > 15);

        if ((needsToSell || opportunitySell || isIrresistibleOffer) && canSell && !actionTaken) {
             let effectiveSellChance = baseSellChance;
             if (needsToSell) effectiveSellChance = 0.95;
             else if (isIrresistibleOffer) effectiveSellChance = 0.90;
             else if (opportunitySell) effectiveSellChance = 0.25;

             if (Math.random() < effectiveSellChance) {
                 let candidates = team.players.filter(p => !p.transferListed);
                 // ... (Selection logic same as before) ...
                 if (needsToSell || squadSize >= maxSquadSize) {
                      candidates = candidates.filter(p => p.squadStatus !== 'STAR' && p.skill < team.strength);
                      if (candidates.length === 0) candidates = team.players;
                 } else if (isIrresistibleOffer) {
                      candidates = candidates.filter(p => p.value > 5);
                 }

                 if (candidates.length > 0) {
                     // Sort logic...
                     const toSell = candidates[Math.floor(Math.random() * candidates.length)];
                     const teamIdx = updatedTeams.findIndex(t => t.id === team.id);
                     
                     let finalPrice = toSell.value;
                     if (isIrresistibleOffer) finalPrice *= 1.3;
                     
                     updatedTeams[teamIdx].budget += finalPrice;
                     updatedTeams[teamIdx].players = updatedTeams[teamIdx].players.filter(p => p.id !== toSell.id);
                     updatedTeams[teamIdx].lastTransferActivityDate = date;

                     // Add history & news (same as before)
                     const dateStr = `${d.getDate()} ${d.getMonth() === 6 ? 'Tem' : d.getMonth() === 7 ? 'Ağu' : d.getMonth() === 0 ? 'Oca' : 'Eyl'}`;
                     updatedTeams[teamIdx].transferHistory.push({
                         date: dateStr, playerName: toSell.name, type: 'SOLD', counterparty: 'Yurt Dışı Kulübü', price: `${finalPrice.toFixed(1)} M€`
                     });
                     
                     if (finalPrice > 3) {
                         newNews.push({ id: generateId(), week, type: 'TRANSFER', title: `${team.name}|@Transfer|OFFICIAL`, content: `${team.name}, ${toSell.name} isimli oyuncusu ile yollarını ayırdı. Bonservis bedeli: ${finalPrice.toFixed(1)} M€.` });
                     }

                     team = updatedTeams[teamIdx];
                     actionTaken = true;
                     globalTransactionCount++;
                 }
             }
        }

        // --- BUYING LOGIC (UPDATED WITH TARGETING) ---
        if (canBuy && needsToBuy && !actionTaken) {
             let buyChance = (month === 6 && day <= 15) ? 0.35 : (buysCount < 5 ? 0.70 : 0.30);
             if (squadSize < 20) buyChance = 0.95; 
             if (isDeadlineDay) buyChance += 0.3;

             if (Math.random() < buyChance) {
                 // FILTER GLOBAL LIST BASED ON TARGET
                 let candidates = updatedTransferList.filter(p => p.value <= budgetToUse);
                 
                 if (buyTarget) {
                     candidates = candidates.filter(p => p.skill >= buyTarget!.minSkill);
                     
                     if (buyTarget.posCategory === 'GK') candidates = candidates.filter(p => p.position === 'GK');
                     else if (buyTarget.posCategory === 'DEF') candidates = candidates.filter(p => ['STP','SLB','SGB'].includes(p.position));
                     else if (buyTarget.posCategory === 'MID') candidates = candidates.filter(p => ['OS','OOS'].includes(p.position));
                     else if (buyTarget.posCategory === 'FWD') candidates = candidates.filter(p => ['SNT','SLK','SGK'].includes(p.position));
                 } else {
                     // Fallback to general skill check
                     candidates = candidates.filter(p => p.skill >= team.strength - 5);
                 }

                 if (candidates.length > 0) {
                     candidates.sort((a,b) => b.skill - a.skill);
                     // Pick top 3 to randomise slightly
                     const candidate = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))];
                     
                     const buyerIdx = updatedTeams.findIndex(t => t.id === team.id);
                     updatedTeams[buyerIdx].budget -= candidate.value;
                     updatedTeams[buyerIdx].lastTransferActivityDate = date;
                     
                     // Handle seller if exists
                     if (candidate.teamId !== 'free_agent' && candidate.teamId !== 'foreign') {
                         const sellerIdx = updatedTeams.findIndex(t => t.id === candidate.teamId);
                         if (sellerIdx !== -1) {
                             updatedTeams[sellerIdx].budget += candidate.value;
                             updatedTeams[sellerIdx].players = updatedTeams[sellerIdx].players.filter(p => p.id !== candidate.id);
                         }
                     }
                     
                     updatedTransferList = updatedTransferList.filter(p => p.id !== candidate.id);

                     const newPlayer = { ...candidate, teamId: team.id, transferListed: false, loanListed: false, jersey: updatedTeams[buyerIdx].jersey, clubName: undefined };
                     updatedTeams[buyerIdx].players.push(newPlayer);
                     
                     const dateStr = `${d.getDate()} ${d.getMonth() === 6 ? 'Tem' : d.getMonth() === 7 ? 'Ağu' : d.getMonth() === 0 ? 'Oca' : 'Eyl'}`;
                     updatedTeams[buyerIdx].transferHistory.push({
                         date: dateStr, playerName: candidate.name, type: 'BOUGHT', counterparty: 'Liste', price: `${candidate.value.toFixed(1)} M€`
                     });

                     updatedTeams[buyerIdx] = recalculateTeamStrength(updatedTeams[buyerIdx]);

                     // CONTEXTUAL NEWS CONTENT
                     const reasonText = buyTarget ? buyTarget.reason : "Kadro rotasyonunu genişletmek için...";
                     const newsContent = `${reasonText} ${team.name}, ${candidate.name} transferini açıkladı! ✍️ ${candidate.value.toFixed(1)} M€`;

                     newNews.push({
                        id: generateId(),
                        week,
                        type: 'TRANSFER',
                        title: `${team.name}|@Transfer|OFFICIAL`,
                        content: newsContent
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
export const archiveSeason = (myTeam: Team, allTeams: Team[], year: number, fixtures: Fixture[]): SeasonSummary => {
    // 1. Calculate Season Year boundaries (The season being archived ends at 'year')
    // Typically, year passed is the 'next' season start year in July, so current season ended in 'year'.
    // Example: If passed year is 2026 (July 2026), season was 2025-2026.
    const seasonEndYear = year;
    const seasonStartYear = year - 1;
    
    // 2. Identify League ID
    const myLeagueId = myTeam.leagueId || 'LEAGUE';

    // 3. Filter Teams in User's League
    // Explicitly filter out EUROPE_LEAGUE or mismatching leagues
    const leagueTeams = allTeams.filter(t => {
        const tLeague = t.leagueId || 'LEAGUE';
        return tLeague === myLeagueId;
    });

    // 4. Recalculate Stats from Scratch based on THIS SEASON'S FIXTURES only
    const teamSeasonStats = leagueTeams.map(t => {
        let stats = { points: 0, gf: 0, ga: 0, won: 0, drawn: 0, lost: 0 };
        
        fixtures.forEach(f => {
            if(!f.played) return;
            const d = new Date(f.date);
            const fYear = d.getFullYear();
            const fMonth = d.getMonth();
            
            // Season Check: July of startYear to June of endYear
            const isSeason = (fYear === seasonStartYear && fMonth >= 6) || (fYear === seasonEndYear && fMonth < 6);
            if(!isSeason) return;

            // STRICT COMPETITION CHECK
            // If my league is LEAGUE, fixture must be LEAGUE or undefined.
            // If my league is LEAGUE_1, fixture must be LEAGUE_1.
            if (myLeagueId === 'LEAGUE') {
                if (f.competitionId && f.competitionId !== 'LEAGUE') return;
            } else {
                 if (f.competitionId !== myLeagueId) return;
            }

            if (f.homeTeamId === t.id) {
                stats.gf += f.homeScore!;
                stats.ga += f.awayScore!;
                if(f.homeScore! > f.awayScore!) { stats.points += 3; stats.won++; }
                else if(f.homeScore === f.awayScore!) { stats.points += 1; stats.drawn++; }
                else stats.lost++;
            } else if (f.awayTeamId === t.id) {
                stats.gf += f.awayScore!;
                stats.ga += f.homeScore!;
                if(f.awayScore! > f.homeScore!) { stats.points += 3; stats.won++; }
                else if(f.awayScore === f.homeScore!) { stats.points += 1; stats.drawn++; }
                else stats.lost++;
            }
        });

        return { team: t, stats };
    });

    // 5. Sort based on Recalculated Stats
    teamSeasonStats.sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });

    // 6. Find My Team's Rank and Stats
    const myEntry = teamSeasonStats.find(x => x.team.id === myTeam.id);
    const rank = teamSeasonStats.findIndex(x => x.team.id === myTeam.id) + 1;

    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0, points = 0;

    if (myEntry) {
        wins = myEntry.stats.won;
        draws = myEntry.stats.drawn;
        losses = myEntry.stats.lost;
        goalsFor = myEntry.stats.gf;
        goalsAgainst = myEntry.stats.ga;
        points = myEntry.stats.points;
    } else {
        // Fallback to current team stats if entry not found (shouldn't happen)
        wins = myTeam.stats.won;
        draws = myTeam.stats.drawn;
        losses = myTeam.stats.lost;
        goalsFor = myTeam.stats.gf;
        goalsAgainst = myTeam.stats.ga;
        points = myTeam.stats.points;
    }
    
    const allPlayers = allTeams.flatMap(t => t.players);
    const topScorer = [...allPlayers].sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)[0];
    const topAssister = [...allPlayers].sort((a, b) => b.seasonStats.assists - a.seasonStats.assists)[0];
    const topRated = [...allPlayers].filter(p => p.seasonStats.matchesPlayed > 5).sort((a, b) => (b.seasonStats.averageRating || 0) - (a.seasonStats.averageRating || 0))[0];

    const trophies: string[] = [];

    // 1. League
    if (rank === 1) {
         trophies.push(myTeam.leagueId === 'LEAGUE_1' ? '1. Lig Şampiyonluğu' : 'Süper Toto Hayvanlar Ligi');
    }

    // Helper to check final winner
    const checkWinner = (week: number, compId: string, name: string) => {
        const final = fixtures.find(f => f.week === week && f.competitionId === compId && f.played);
        if (final) {
            let winnerId = final.homeTeamId;
            // Logic to determine winner (Score or PK)
            if (final.awayScore! > final.homeScore!) winnerId = final.awayTeamId;
            else if (final.homeScore === final.awayScore) {
                if ((final.pkAway || 0) > (final.pkHome || 0)) winnerId = final.awayTeamId;
            }

            if (winnerId === myTeam.id) trophies.push(name);
        }
    };

    // Check Finals
    checkWinner(104, 'CUP', 'Türkiye Kupası');
    checkWinner(91, 'SUPER_CUP', 'Süper Kupa');
    checkWinner(217, 'EUROPE', 'Avrupa Kupası');
    checkWinner(36, 'PLAYOFF_FINAL', '1. Lig Play-Off Şampiyonluğu');

    // Updated Format: YYYY/YY (e.g. 2025/26)
    const seasonLabel = `${year-1}/${year.toString().slice(2)}`;

    return {
        season: seasonLabel,
        teamName: myTeam.name,
        rank,
        stats: {
            wins,
            draws,
            losses,
            goalsFor,
            goalsAgainst,
            points
        },
        bestXI: myTeam.players.slice(0, 11),
        topScorer: { name: topScorer?.name || 'Yok', count: topScorer?.seasonStats.goals || 0 },
        topAssister: { name: topAssister?.name || 'Yok', count: topAssister?.seasonStats.assists || 0 },
        topRated: { name: topRated?.name || 'Yok', rating: topRated?.seasonStats.averageRating || 0 },
        trophiesWon: trophies,
        transfersIn: []
    };
};

/**
 * Resets teams for the next season, incrementing age and clearing stats.
 */
export const resetForNewSeason = (teams: Team[]): Team[] => {
    return teams.map(team => {
        // AGE Players
        const agedPlayers = team.players.map(p => ({
            ...p,
            age: p.age + 1,
            seasonStats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, ratings: [], averageRating: 0, matchesPlayed: 0, processedMatchIds: [] },
            suspensions: {}, // Clear suspensions on new season
            suspendedUntilWeek: 0 // FIX: Explicitly clear legacy suspension counter
        }));

        // AGE Loaned Out Players (Important!)
        const agedLoanedOut = team.loanedOutPlayers ? team.loanedOutPlayers.map(p => ({
            ...p,
            age: p.age + 1,
            seasonStats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, ratings: [], averageRating: 0, matchesPlayed: 0, processedMatchIds: [] },
            suspensions: {}, 
            suspendedUntilWeek: 0 // FIX: Explicitly clear legacy suspension counter
        })) : [];

        return {
            ...team,
            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
            players: agedPlayers,
            loanedOutPlayers: agedLoanedOut,
            transferHistory: [], // Reset Transfer History
            financialRecords: { // Reset Season Financials
                income: { transfers: 0, tv: 0, merch: 0, loca: 0, gate: 0, sponsor: 0 },
                expense: { wages: 0, transfers: 0, staff: 0, maint: 0, academy: 0, debt: 0, matchDay: 0, travel: 0, scouting: 0, admin: 0, bonus: 0, fines: 0 }
            }
        };
    });
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
