
import { Team, Player, MatchEvent, MatchStats, Position, Tackling, PlayerPerformance, Mentality, PassingStyle, Tempo, Width, AttackingTransition, CreativeFreedom, SupportRuns, Dribbling, FocusArea, PassTarget, Patience, LongShots, CrossingType, GKDistributionSpeed, PressingLine, DefensiveLine, DefLineMobility, PressIntensity, DefensiveTransition, PreventCrosses, PressingFocus, SetPiecePlay, PlayStrategy, GoalKickType, GKDistributionTarget } from '../types';
import { INJURY_TYPES, RIVALRIES } from '../constants';
import { GOAL_TEXTS, SAVE_TEXTS, MISS_TEXTS, FOUL_TEXTS, YELLOW_CARD_TEXTS, YELLOW_CARD_AGGRESSIVE_TEXTS, OFFSIDE_TEXTS, CORNER_TEXTS } from '../data/eventTexts';
import { calculateTeamStrength, calculateRawTeamStrength } from './teamCalculations';
import { calculateRating, determineMVP, calculateRatingsFromEvents } from './ratingsAndStats';
import { fillTemplate, pick } from './helpers';

// --- HELPER FUNCTIONS ---

export const getSentOffPlayers = (events: MatchEvent[]) => {
    return new Set(events.filter(e => e.type === 'CARD_RED' || e.type === 'FIGHT' || e.type === 'ARGUMENT').map(e => e.playerId));
};

// UPDATED: Now excludes Injured players (who are still in the first 11 array)
const getAvailablePlayers = (team: Team, sentOff: Set<string | undefined>) => {
    return team.players.slice(0, 11).filter(p => 
        !sentOff.has(p.id) && 
        (!p.injury || p.injury.daysRemaining <= 0)
    );
};

const getPlayer = (team: Team, sentOff: Set<string | undefined>, includeGK = false): Player => {
    const pool = getAvailablePlayers(team, sentOff);
    if (pool.length === 0) return team.players[0]; 
    const candidates = includeGK ? pool : pool.filter(p => p.position !== Position.GK);
    const finalPool = candidates.length > 0 ? candidates : pool;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
};

const getScorer = (team: Team, sentOff: Set<string | undefined>) => {
    const pool = getAvailablePlayers(team, sentOff);
    if (pool.length === 0) return { scorer: team.players[0], assist: team.players[0] };

    const fwds = pool.filter(p => [Position.SNT, Position.SLK, Position.SGK].includes(p.position));
    const mids = pool.filter(p => [Position.OS, Position.OOS].includes(p.position));
    
    const scorerPool = [...fwds, ...fwds, ...fwds, ...mids, ...mids, ...pool];
    const scorer = scorerPool[Math.floor(Math.random() * scorerPool.length)];
    
    let assist = pool[Math.floor(Math.random() * pool.length)];
    if (assist.id === scorer.id && pool.length > 1) {
        assist = pool.find(p => p.id !== scorer.id) || assist;
    }
    
    return { scorer, assist };
};

// --- NEW PENALTY LOGIC ---

export const getPenaltyTaker = (team: Team, sentOffIds: Set<string | undefined>): Player => {
    // Get players currently on the pitch
    const onPitch = team.players.slice(0, 11).filter(p => 
        !sentOffIds.has(p.id) && 
        (!p.injury || p.injury.daysRemaining <= 0)
    );

    if (onPitch.length === 0) return team.players[0]; // Fallback

    // 1. Check for Designated Taker in Tactics
    if (team.setPieceTakers?.penalty) {
        const designated = onPitch.find(p => p.id === team.setPieceTakers?.penalty);
        if (designated) return designated;
    }

    // 2. If no designated taker, look for a Forward (SNT)
    const strikers = onPitch.filter(p => p.position === Position.SNT);
    if (strikers.length > 0) {
        // Return the striker with the best penalty stat
        return strikers.sort((a, b) => b.stats.penalty - a.stats.penalty)[0];
    }

    // 3. Fallback: Player with highest Penalty stat
    return onPitch.sort((a, b) => b.stats.penalty - a.stats.penalty)[0];
};

export const calculatePenaltyOutcome = (penaltySkill: number): boolean => {
    const roll = Math.random() * 100;
    
    if (penaltySkill >= 20) {
        return roll < 80; // 80% Success
    } else if (penaltySkill >= 15) {
        return roll < 70; // 70% Success
    } else if (penaltySkill >= 10) {
        return roll < 60; // 60% Success
    } else {
        return roll < 30; // 30% Success (Skill < 10)
    }
};

// --- SIMULATION LOGIC ---

export const generateRandomPlayerRatings = (players: Player[], teamGoals: number, goalsConceded: number, isWinner: boolean, isDraw: boolean): PlayerPerformance[] => {
    const lineup = [...players].slice(0, 11); 
    let ratings = lineup.map(p => {
        let result: 'WIN' | 'DRAW' | 'LOSS' = 'LOSS';
        if (isWinner) result = 'WIN';
        else if (isDraw) result = 'DRAW';
        const rating = calculateRating(p.position, p.skill, 0, 0, 0, 0, goalsConceded, result, 90, 0);
        return { playerId: p.id, name: p.name, position: p.position, rating, goals: 0, assists: 0 };
    });
    return ratings;
};

export const generateMatchStats = (homePlayers: Player[], awayPlayers: Player[], hScore: number, aScore: number): MatchStats => {
    const homeRatings = generateRandomPlayerRatings(homePlayers, hScore, aScore, hScore > aScore, hScore === aScore);
    const awayRatings = generateRandomPlayerRatings(awayPlayers, aScore, hScore, aScore > hScore, hScore === aScore);
    
    return {
        homePossession: 50, awayPossession: 50, homeShots: hScore + 4, awayShots: aScore + 3,
        homeShotsOnTarget: hScore + 2, awayShotsOnTarget: aScore + 1, homeCorners: 3, awayCorners: 2,
        homeFouls: 10, awayFouls: 12, homeOffsides: 2, awayOffsides: 1,
        homeYellowCards: 1, awayYellowCards: 2, homeRedCards: 0, awayRedCards: 0,
        mvpPlayerId: '', mvpPlayerName: '', homeRatings, awayRatings
    };
};

export const getEmptyMatchStats = (): MatchStats => ({
    homePossession: 50, awayPossession: 50, homeShots: 0, awayShots: 0, homeShotsOnTarget: 0, awayShotsOnTarget: 0,
    homeCorners: 0, awayCorners: 0, homeFouls: 0, awayFouls: 0, homeOffsides: 0, awayOffsides: 0,
    homeYellowCards: 0, awayYellowCards: 0, homeRedCards: 0, awayRedCards: 0, mvpPlayerId: '', mvpPlayerName: '',
    homeRatings: [], awayRatings: []
});

export const getWeightedInjury = () => {
    const totalWeight = INJURY_TYPES.reduce((sum, item) => sum + item.probability, 0);
    let random = Math.random() * totalWeight;
    for (const injury of INJURY_TYPES) {
        if (random < injury.probability) return injury;
        random -= injury.probability;
    }
    return INJURY_TYPES[0];
};

const calculateTacticalEfficiency = (team: Team, minute: number, scoreDiff: number): { multiplier: number, warning?: string } => {
    let multiplier = 1.0;
    let warning = undefined;
    
    // Base Tactics
    if (minute > 70 && team.tempo === Tempo.BEAST_MODE) { multiplier *= 0.85; warning = "Takım yoruldu, tempo düştü."; }
    if (scoreDiff > 0 && team.mentality === Mentality.DEFENSIVE) { multiplier *= 1.1; } 
    else if (scoreDiff < 0 && team.mentality === Mentality.ATTACKING) { multiplier *= 1.05; }

    // --- CAPTAIN INFLUENCE (HIDDEN MECHANIC) ---
    // Calculate leadership of the player wearing the armband (on pitch)
    const onPitch = team.players.slice(0, 11);
    let leadership = 10; // Default average

    if (team.setPieceTakers?.captain) {
        const cap = onPitch.find(p => p.id === team.setPieceTakers?.captain);
        if (cap) leadership = cap.stats.leadership;
        else {
             // Captain subbed out? Find next leader
             const nextLeader = onPitch.reduce((prev, current) => (prev.stats.leadership > current.stats.leadership) ? prev : current, onPitch[0]);
             if(nextLeader) leadership = nextLeader.stats.leadership;
        }
    } else {
         const autoCap = onPitch.reduce((prev, current) => (prev.stats.leadership > current.stats.leadership) ? prev : current, onPitch[0]);
         if(autoCap) leadership = autoCap.stats.leadership;
    }

    // Effect: If losing, high leadership prevents collapse. Low leadership accelerates it.
    if (scoreDiff < 0) {
        if (leadership >= 18) multiplier += 0.04; // Good captain rallies team (+4%)
        else if (leadership >= 14) multiplier += 0.02; // Decent captain (+2%)
        else if (leadership <= 7) multiplier -= 0.02; // Bad captain, team crumbles (-2%)
    }

    return { multiplier, warning };
};

const getAverageCondition = (team: Team): number => {
    const onPitch = team.players.slice(0, 11);
    if (onPitch.length === 0) return 100;
    const sum = onPitch.reduce((s, p) => s + (p.condition !== undefined ? p.condition : 100), 0);
    return sum / onPitch.length;
};

// --- SIMULATION STEP ---

export const simulateMatchStep = (
    minute: number, 
    home: Team, 
    away: Team, 
    currentScore: {h:number, a:number},
    existingEvents: MatchEvent[] = [],
    currentStats?: MatchStats // ADDED: To check possession
): MatchEvent | null => {
    
    // --- 1. PROBABILITY CONFIGURATION ---

    const eventRoll = Math.random();

    // INJURY PROBABILITY
    const getTeamInjuryRisk = (t: Team) => t.players.slice(0, 11).some(p => (p.condition || 100) < 60);
    const homeRisk = getTeamInjuryRisk(home);
    const awayRisk = getTeamInjuryRisk(away);
    
    // INCREASED RISK BACK TO NORMAL LEVELS (Condition drops slower, but punishment is high if low)
    let P_INJURY = 0.0015; // Base: ~0.15% per minute (Random accidents)
    if (homeRisk || awayRisk) {
        P_INJURY = 0.03; // Risk: ~3.0% per minute (Very high if fatigued)
    }

    // RARE EVENTS PROBABILITIES
    const P_PITCH_INVASION = 0.0005; // 0.05%
    const P_FIGHT = 0.001; // 0.1% base
    const P_ARGUMENT = 0.001; // 0.1% base

    // CHECK FOR DERBY
    const isDerby = RIVALRIES.some(pair => 
        (pair.includes(home.name) && pair.includes(away.name))
    );

    // --- 2. EVENT THRESHOLDS ---

    // PENALTY LOGIC (UPDATED: Reduced by 50%)
    // Base 0.5%. If Possession > 60% -> 1%. If Possession > 70% -> 1.5%.
    // Determine attacking team first to check their possession
    let homePenaltyChance = 0.001; // Base 0.1% per minute
    let awayPenaltyChance = 0.001;

    if (currentStats) {
        if (currentStats.homePossession > 70) homePenaltyChance = 0.015; // Reduced from 0.03
        else if (currentStats.homePossession > 60) homePenaltyChance = 0.01; // Reduced from 0.02
        else homePenaltyChance = 0.005; // Reduced from 0.01

        if (currentStats.awayPossession > 70) awayPenaltyChance = 0.015; // Reduced from 0.03
        else if (currentStats.awayPossession > 60) awayPenaltyChance = 0.01; // Reduced from 0.02
        else awayPenaltyChance = 0.005; // Reduced from 0.01
    }

    const P_PENALTY = homePenaltyChance + awayPenaltyChance;

    const P_SHOT_OPPORTUNITY = 0.20;
    // Base foul chance 0.15. If derby, increase by 10% (multiply by 1.10)
    const P_FOUL = isDerby ? 0.15 * 1.10 : 0.15;
    const P_CORNER = 0.10;
    const P_OFFSIDE = 0.05;

    // Cumulative Thresholds (Rare events first)
    const T_PITCH_INVASION = P_PITCH_INVASION;
    const T_FIGHT = T_PITCH_INVASION + P_FIGHT;
    const T_ARGUMENT = T_FIGHT + P_ARGUMENT;
    const T_INJURY = T_ARGUMENT + P_INJURY;
    const T_PENALTY = T_INJURY + (P_PENALTY * 0.5); 
    const T_SHOT = T_PENALTY + P_SHOT_OPPORTUNITY;
    const T_FOUL = T_SHOT + P_FOUL;
    const T_CORNER = T_FOUL + P_CORNER;
    const T_OFFSIDE = T_CORNER + P_OFFSIDE;

    // Return if no event this minute
    if (eventRoll > T_OFFSIDE) return null;

    // --- 3. TEAM & TACTICS CALCULATION ---
    const homeScoreDiff = currentScore.h - currentScore.a;
    const awayScoreDiff = currentScore.a - currentScore.h;

    const homeTactics = calculateTacticalEfficiency(home, minute, homeScoreDiff);
    const awayTactics = calculateTacticalEfficiency(away, minute, awayScoreDiff);

    // --- HOME CROWD PRESSURE (Background Mechanic) ---
    // Logic: If Home Fans > 1.5M AND Away Team Avg Composure < 14, Away Team gets -1 Strength
    let awayStrengthMalus = 0;
    if (home.fanBase > 1500000) {
        const awayXI = away.players.slice(0, 11);
        const avgComposure = awayXI.reduce((sum, p) => sum + (p.stats.composure || 10), 0) / Math.max(1, awayXI.length);
        
        // If average composure is less than 14 (out of 20), they succumb to pressure
        if (avgComposure < 14) {
            awayStrengthMalus = -1;
        }
    }

    if (homeTactics.warning && Math.random() < 0.05) return { minute, description: `Ev Sahibi: ${homeTactics.warning}`, type: 'INFO', teamName: home.name };
    if (awayTactics.warning && Math.random() < 0.05) return { minute, description: `Deplasman: ${awayTactics.warning}`, type: 'INFO', teamName: away.name };

    // --- 4. EVENT DETERMINATION ---

    // A. PITCH INVASION (Rare)
    if (eventRoll < T_PITCH_INVASION) {
        return {
            minute,
            type: 'PITCH_INVASION',
            description: 'TARAFTAR SAHAYA GİRDİ! Güvenlik güçleri müdahale ediyor, oyun durdu.',
            teamName: home.name // Usually implies home fans
        };
    }

    // B. FIGHT (Rare - Red Card)
    else if (eventRoll < T_FIGHT) {
        // Find players with High Aggression (>17)
        const sentOff = getSentOffPlayers(existingEvents);
        const homeAggro = getAvailablePlayers(home, sentOff).filter(p => p.stats.aggression >= 18);
        const awayAggro = getAvailablePlayers(away, sentOff).filter(p => p.stats.aggression >= 18);
        
        let aggressivePlayer: Player | null = null;
        let team: Team = home;

        // Chance increases if aggressive players exist
        if (homeAggro.length > 0 || awayAggro.length > 0) {
            // Reroll to confirm fight based on aggression presence (boost probability)
            if (Math.random() < 0.3) {
                 if (homeAggro.length > 0 && awayAggro.length > 0) {
                     team = Math.random() < 0.5 ? home : away;
                     aggressivePlayer = team === home ? homeAggro[0] : awayAggro[0];
                 } else if (homeAggro.length > 0) {
                     team = home;
                     aggressivePlayer = homeAggro[0];
                 } else {
                     team = away;
                     aggressivePlayer = awayAggro[0];
                 }
            }
        }

        // If no high aggro player triggered it, standard low chance applies to random player
        if (!aggressivePlayer) {
             team = Math.random() < 0.5 ? home : away;
             aggressivePlayer = getPlayer(team, sentOff);
        }

        return {
            minute,
            type: 'FIGHT',
            description: `KAVGA ÇIKTI! ${aggressivePlayer.name} rakibine yumruk attı! Direkt KIRMIZI KART!`,
            teamName: team.name,
            playerId: aggressivePlayer.id
        };
    }

    // C. ARGUMENT (Rare - Red Card)
    else if (eventRoll < T_ARGUMENT) {
        const team = Math.random() < 0.5 ? home : away;
        const sentOff = getSentOffPlayers(existingEvents);
        const player = getPlayer(team, sentOff);
        
        return {
            minute,
            type: 'ARGUMENT',
            description: `HAKEMLE TARTIŞMA! ${player.name} karara sinirlenip hakemin üzerine yürüdü. Direkt KIRMIZI KART!`,
            teamName: team.name,
            playerId: player.id
        };
    }

    // D. INJURY
    else if (eventRoll < T_INJURY) {
        const isHomeInjured = Math.random() < (homeRisk && !awayRisk ? 0.8 : awayRisk && !homeRisk ? 0.2 : 0.5);
        const victimTeam = isHomeInjured ? home : away;
        // Determine player
        const injuredPlayer = getPlayer(victimTeam, getSentOffPlayers(existingEvents));
        
        return {
            minute,
            type: 'INJURY',
            description: `${injuredPlayer.name} yerde kaldı. Sağlık ekipleri sahada.`,
            teamName: victimTeam.name,
            playerId: injuredPlayer.id
        };
    }

    // E. PENALTY (NEW)
    else if (eventRoll < T_PENALTY) {
        // Determine who gets the penalty based on their respective probabilities
        const totalChance = homePenaltyChance + awayPenaltyChance;
        const isHomePenalty = Math.random() < (homePenaltyChance / totalChance);
        
        const attackingTeam = isHomePenalty ? home : away;
        const defendingTeam = isHomePenalty ? away : home;
        
        const fouler = getPlayer(defendingTeam, getSentOffPlayers(existingEvents));
        const victim = getPlayer(attackingTeam, getSentOffPlayers(existingEvents));
        
        return {
            minute,
            type: 'PENALTY', // Special internal type to trigger UI flow, will become GOAL or MISS later
            description: `PENALTI! ${fouler.name}, ${victim.name}'i ceza sahası içinde düşürdü.`,
            teamName: attackingTeam.name,
            playerId: victim.id // The player who earned it
        };
    }
    
    // F. SHOT (GOAL / SAVE / MISS)
    else if (eventRoll < T_SHOT) {
        const homeAttack = home.strength * homeTactics.multiplier;
        // Apply Home Crowd Malus to Away Team here
        const awayAttack = (away.strength + awayStrengthMalus) * awayTactics.multiplier;
        
        const totalAttack = homeAttack + awayAttack;
        const isHomeAttacking = Math.random() < (homeAttack / totalAttack);
        
        const attackingTeam = isHomeAttacking ? home : away;
        const defendingTeam = isHomeAttacking ? away : home;
        
        const scorerInfo = getScorer(attackingTeam, getSentOffPlayers(existingEvents));
        const scorer = scorerInfo.scorer;
        const assist = scorerInfo.assist;
        const keeper = defendingTeam.players.find(p => p.position === Position.GK) || defendingTeam.players[0];

        // Goal Probability calculation
        let goalProb = 0.14; 
        const skillDiff = scorer.skill - keeper.skill;
        goalProb += (skillDiff * 0.005); 
        
        // Tactics impact on goal prob
        if (attackingTeam.mentality === Mentality.VERY_ATTACKING) goalProb += 0.05;
        if (defendingTeam.mentality === Mentality.VERY_DEFENSIVE || defendingTeam.defLine === DefensiveLine.VERY_DEEP) goalProb -= 0.05;

        const shotRoll = Math.random();

        if (shotRoll < goalProb) {
            // GOAL
            const template = pick(GOAL_TEXTS);
            const desc = fillTemplate(template, { scorer: scorer.name });
            return {
                minute,
                type: 'GOAL',
                description: desc,
                teamName: attackingTeam.name,
                scorer: scorer.name,
                assist: assist.id !== scorer.id ? assist.name : undefined
            };
        } else if (shotRoll < goalProb + 0.30) {
            // SAVE
            const template = pick(SAVE_TEXTS);
            const defender = getPlayer(defendingTeam, getSentOffPlayers(existingEvents));
            const desc = fillTemplate(template, { keeper: keeper.name, attacker: scorer.name, defender: defender.name });
            return {
                minute,
                type: 'SAVE',
                description: desc,
                teamName: defendingTeam.name, // Credit to defending team (Keeper)
                playerId: keeper.id
            };
        } else {
            // MISS
            const template = pick(MISS_TEXTS);
            const defender = getPlayer(defendingTeam, getSentOffPlayers(existingEvents));
            const desc = fillTemplate(template, { player: scorer.name, defender: defender.name });
            return {
                minute,
                type: 'MISS',
                description: desc,
                teamName: attackingTeam.name,
                playerId: scorer.id
            };
        }
    }

    // G. FOUL (CARDS)
    else if (eventRoll < T_FOUL) {
        const isHomeFoul = Math.random() < 0.5;
        const foulingTeam = isHomeFoul ? home : away;
        const victimTeam = isHomeFoul ? away : home;
        
        const fouler = getPlayer(foulingTeam, getSentOffPlayers(existingEvents));
        const victim = getPlayer(victimTeam, getSentOffPlayers(existingEvents));

        // CARD PROBABILITIES
        // Update per user request: Red Card 2%, Aggressive 3%
        let redChance = 0.02; // Default 2%
        let yellowChance = 0.15;

        if (foulingTeam.tackling === Tackling.AGGRESSIVE) {
            redChance = 0.03; // Aggressive 3%
            yellowChance = 0.25; 
        } else if (foulingTeam.tackling === Tackling.CAUTIOUS) {
            redChance = 0.005;
            yellowChance = 0.05;
        }
        
        // Increase chances if pressing intensity is high
        if (foulingTeam.pressIntensity === PressIntensity.VERY_HIGH) {
            yellowChance += 0.05;
            redChance += 0.005;
        }

        const cardRoll = Math.random();

        if (cardRoll < redChance) {
            // RED CARD
            return {
                minute,
                type: 'CARD_RED',
                description: `KIRMIZI KART! ${fouler.name} (VAR Kontrolü Sonrası) oyundan atıldı!`,
                teamName: foulingTeam.name,
                playerId: fouler.id
            };
        } else if (cardRoll < redChance + yellowChance) {
            // YELLOW CARD
            const template = foulingTeam.tackling === Tackling.AGGRESSIVE ? pick(YELLOW_CARD_AGGRESSIVE_TEXTS) : pick(YELLOW_CARD_TEXTS);
            const desc = fillTemplate(template, { player: fouler.name });
            return {
                minute,
                type: 'CARD_YELLOW',
                description: desc,
                teamName: foulingTeam.name,
                playerId: fouler.id
            };
        } else {
            // NORMAL FOUL
            const template = pick(FOUL_TEXTS);
            const desc = fillTemplate(template, { player: fouler.name, victim: victim.name });
            return {
                minute,
                type: 'FOUL',
                description: desc,
                teamName: foulingTeam.name
            };
        }
    }

    // H. CORNER
    else if (eventRoll < T_CORNER) {
        const isHomeCorner = Math.random() < 0.5;
        const team = isHomeCorner ? home : away;
        const takerId = team.setPieceTakers?.corner;
        let takerName = "Oyuncu";
        if (takerId) {
            const p = team.players.find(x => x.id === takerId);
            if (p) takerName = p.name;
        }
        
        const template = pick(CORNER_TEXTS);
        const desc = fillTemplate(template, { team: team.name, player: takerName });
        
        return {
            minute,
            type: 'CORNER',
            description: desc,
            teamName: team.name
        };
    }

    // I. OFFSIDE
    else if (eventRoll < T_OFFSIDE) {
        const isHomeOff = Math.random() < 0.5;
        const team = isHomeOff ? home : away;
        const player = getPlayer(team, getSentOffPlayers(existingEvents));
        
        const template = pick(OFFSIDE_TEXTS);
        const desc = fillTemplate(template, { player: player.name });

        return {
            minute,
            type: 'OFFSIDE',
            description: desc,
            teamName: team.name
        };
    }

    return null;
};

export const simulateBackgroundMatch = (home: Team, away: Team, isKnockout: boolean = false) => {
    let homeScore = 0;
    let awayScore = 0;
    let events: MatchEvent[] = [];

    // Simulate 90 mins
    for (let m = 1; m <= 90; m++) {
        // Pass fake stats (50/50) for background matches
        const fakeStats: MatchStats = { ...getEmptyMatchStats(), homePossession: 50, awayPossession: 50 };
        const event = simulateMatchStep(m, home, away, {h: homeScore, a: awayScore}, events, fakeStats);
        
        if (event) {
            // Handle Penalty immediately for background match using new Logic
            if (event.type === 'PENALTY') {
                const team = event.teamName === home.name ? home : away;
                const sentOff = getSentOffPlayers(events);
                const taker = getPenaltyTaker(team, sentOff);
                const isGoal = calculatePenaltyOutcome(taker.stats.penalty);

                if (isGoal) {
                    if (event.teamName === home.name) homeScore++;
                    else awayScore++;
                    events.push({ ...event, type: 'GOAL', description: `GOOOOL! (Penaltı) - ${taker.name}`, scorer: taker.name, assist: 'Penaltı' });
                } else {
                    events.push({ ...event, type: 'MISS', description: `PENALTI KAÇTI! - ${taker.name}` });
                }
            } 
            else if (event.type === 'FIGHT' || event.type === 'ARGUMENT') {
                // Map to Red Card for simplicity in background logs
                events.push({ ...event, type: 'CARD_RED' });
            }
            else if (event.type !== 'PITCH_INVASION') { // Skip invasion logging for background to avoid confusion, or map to INFO
                events.push(event);
                if (event.type === 'GOAL') {
                    if (event.teamName === home.name) homeScore++;
                    else awayScore++;
                }
            }
        }
    }

    let pkScore: {h:number, a:number} | undefined = undefined;

    if (isKnockout && homeScore === awayScore) {
        const hProb = 0.5 + ((home.strength - away.strength) * 0.005);
        let hPen = 0;
        let aPen = 0;
        for(let i=0; i<5; i++) {
             if(Math.random() < hProb) hPen++;
             if(Math.random() < (1-hProb)) aPen++;
        }
        while(hPen === aPen) {
             if(Math.random() < hProb) hPen++;
             if(Math.random() < (1-hProb)) aPen++;
        }
        pkScore = { h: hPen, a: aPen };
    }

    const stats = generateMatchStats(home.players, away.players, homeScore, awayScore);
    
    // Correct stats based on events
    stats.homeYellowCards = events.filter(e => e.type === 'CARD_YELLOW' && e.teamName === home.name).length;
    stats.awayYellowCards = events.filter(e => e.type === 'CARD_YELLOW' && e.teamName === away.name).length;
    stats.homeRedCards = events.filter(e => e.type === 'CARD_RED' && e.teamName === home.name).length;
    stats.awayRedCards = events.filter(e => e.type === 'CARD_RED' && e.teamName === away.name).length;
    
    // Ratings
    const ratings = calculateRatingsFromEvents(home, away, events, homeScore, awayScore);
    stats.homeRatings = ratings.homeRatings;
    stats.awayRatings = ratings.awayRatings;
    
    const mvp = determineMVP(stats.homeRatings, stats.awayRatings);
    stats.mvpPlayerId = mvp.id;
    stats.mvpPlayerName = mvp.name;
    
    if (pkScore) {
        stats.pkHome = pkScore.h;
        stats.pkAway = pkScore.a;
    }

    return { homeScore, awayScore, stats, events, pkScore };
};