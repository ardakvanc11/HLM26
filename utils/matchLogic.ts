
import { Team, Player, MatchEvent, MatchStats, Position, Tackling, PlayerPerformance, Mentality, PassingStyle, Tempo, Width, AttackingTransition, CreativeFreedom, SupportRuns, Dribbling, FocusArea, PassTarget, Patience, LongShots, CrossingType, GKDistributionSpeed, PressingLine, DefensiveLine, DefLineMobility, PressIntensity, DefensiveTransition, PreventCrosses, PressingFocus, SetPiecePlay, PlayStrategy, GoalKickType, GKDistributionTarget } from '../types';
import { INJURY_TYPES } from '../constants';
import { GOAL_TEXTS, SAVE_TEXTS, MISS_TEXTS, FOUL_TEXTS, YELLOW_CARD_TEXTS, YELLOW_CARD_AGGRESSIVE_TEXTS, OFFSIDE_TEXTS, CORNER_TEXTS } from '../data/eventTexts';
import { calculateTeamStrength, calculateRawTeamStrength } from './teamCalculations';
import { calculateRating, determineMVP, calculateRatingsFromEvents } from './ratingsAndStats';
import { fillTemplate, pick } from './helpers';

// --- HELPER FUNCTIONS ---

const getSentOffPlayers = (events: MatchEvent[]) => {
    return new Set(events.filter(e => e.type === 'CARD_RED').map(e => e.playerId));
};

const getAvailablePlayers = (team: Team, sentOff: Set<string | undefined>) => {
    return team.players.slice(0, 11).filter(p => !sentOff.has(p.id));
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
    // This is a fallback generator if simulation fails, but primarily we use accumulated stats now.
    // Kept for compatibility.
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
    if (minute > 70 && team.tempo === Tempo.BEAST_MODE) { multiplier *= 0.85; warning = "Takım yoruldu, tempo düştü."; }
    if (scoreDiff > 0 && team.mentality === Mentality.DEFENSIVE) { multiplier *= 1.1; } 
    else if (scoreDiff < 0 && team.mentality === Mentality.ATTACKING) { multiplier *= 1.05; }
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
    existingEvents: MatchEvent[] = []
): MatchEvent | null => {
    
    // --- 1. PROBABILITY CONFIGURATION ---

    const eventRoll = Math.random();

    // INJURY PROBABILITY
    // Standard: 0.2%
    // If player condition < 60%: 3% (Boosted)
    // We check if ANY player on pitch is at high risk
    const getTeamInjuryRisk = (t: Team) => t.players.slice(0, 11).some(p => (p.condition || 100) < 60);
    const homeRisk = getTeamInjuryRisk(home);
    const awayRisk = getTeamInjuryRisk(away);
    
    let P_INJURY = 0.002;
    if (homeRisk || awayRisk) {
        // If someone is tired, chance spikes
        P_INJURY = 0.03; 
    }

    // --- 2. EVENT THRESHOLDS ---
    // Instead of Goal Prob directly, we now roll for a "Shot Opportunity".
    // 15-20% of minutes generate a shot action.
    const P_SHOT_OPPORTUNITY = 0.20;
    const P_FOUL = 0.15;
    const P_CORNER = 0.10;
    const P_OFFSIDE = 0.05;

    // Cumulative Thresholds
    const T_INJURY = P_INJURY;
    const T_SHOT = T_INJURY + P_SHOT_OPPORTUNITY;
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

    if (homeTactics.warning && Math.random() < 0.05) return { minute, description: `Ev Sahibi: ${homeTactics.warning}`, type: 'INFO', teamName: home.name };
    if (awayTactics.warning && Math.random() < 0.05) return { minute, description: `Deplasman: ${awayTactics.warning}`, type: 'INFO', teamName: away.name };

    const sentOff = getSentOffPlayers(existingEvents);
    const homeReds = existingEvents.filter(e => e.type === 'CARD_RED' && e.teamName === home.name).length;
    const awayReds = existingEvents.filter(e => e.type === 'CARD_RED' && e.teamName === away.name).length;

    let homeStr = (calculateRawTeamStrength(home.players) + 5) * homeTactics.multiplier; 
    let awayStr = calculateRawTeamStrength(away.players) * awayTactics.multiplier;

    if (homeReds > 0) homeStr *= (1 - (homeReds * 0.15));
    if (awayReds > 0) awayStr *= (1 - (awayReds * 0.15));

    const totalStr = homeStr + awayStr;
    const homeDominance = totalStr > 0 ? homeStr / totalStr : 0.5;
    
    // --- 4. EVENT GENERATION ---

    // INJURY (Priority)
    if (eventRoll < T_INJURY) {
        // Decide who gets injured based on condition logic
        // If specific teams are tired, they are more likely
        let homeProb = 0.5;
        if (homeRisk && !awayRisk) homeProb = 0.8;
        else if (!homeRisk && awayRisk) homeProb = 0.2;
        
        const isHomeInjured = Math.random() < homeProb;
        const injuredTeam = isHomeInjured ? home : away;
        
        // Pick specific player - prioritize low condition
        const pool = getAvailablePlayers(injuredTeam, sentOff);
        let player = pool[0];
        
        // Try to find the tired player
        const tiredPlayer = pool.find(p => (p.condition || 100) < 60);
        if (tiredPlayer && Math.random() < 0.8) {
            player = tiredPlayer; // 80% chance it's the tired one
        } else {
            player = getPlayer(injuredTeam, sentOff);
        }

        const injury = getWeightedInjury();
        return { minute, description: `${player.name} sakatlandı (${injury.type}) ve oyuna devam edemiyor.`, type: 'INJURY', teamName: injuredTeam.name, playerId: player.id };
    }
    
    // SHOT OPPORTUNITY (GOAL / MISS / SAVE)
    else if (eventRoll < T_SHOT) {
        // Determine who shoots based on dominance
        const isHomeAttacking = Math.random() < homeDominance;
        const attackingTeam = isHomeAttacking ? home : away;
        const defendingTeam = isHomeAttacking ? away : home;
        
        // --- GOAL PROBABILITY CALCULATION (10% - 20%) ---
        // Base: 10%
        let conversionRate = 0.10;
        
        // Strength Factor (Up to +5%)
        const attackerStrength = isHomeAttacking ? homeStr : awayStr;
        // Map 50-100 strength to 0.0-0.05
        conversionRate += Math.max(0, (attackerStrength - 50) / 1000);

        // Tactics Factor (Up to +5%)
        if (attackingTeam.mentality === Mentality.VERY_ATTACKING) conversionRate += 0.05;
        else if (attackingTeam.mentality === Mentality.ATTACKING) conversionRate += 0.03;
        else if (attackingTeam.mentality === Mentality.STANDARD) conversionRate += 0.01;
        
        // FATIGUE PENALTY (<50% Condition)
        const avgCond = getAverageCondition(attackingTeam);
        if (avgCond < 50) {
            // Significant drop in conversion (Miss more likely)
            conversionRate -= 0.05; 
        }

        // Cap at 20% (Max) and 2% (Min)
        conversionRate = Math.min(0.20, Math.max(0.02, conversionRate));
        
        const shotRoll = Math.random();

        // 1. GOAL
        if (shotRoll < conversionRate) {
            const { scorer, assist } = getScorer(attackingTeam, sentOff);
            let varResult: 'GOAL' | 'NO_GOAL' | undefined = undefined;
            if (Math.random() < 0.15) { varResult = Math.random() < 0.7 ? 'GOAL' : 'NO_GOAL'; }
            const text = fillTemplate(pick(GOAL_TEXTS), { scorer: scorer.name, assist: assist.name, team: attackingTeam.name });
            return { minute, type: 'GOAL', description: text, teamName: attackingTeam.name, scorer: scorer.name, assist: assist.id !== scorer.id ? assist.name : undefined, playerId: scorer.id, varOutcome: varResult };
        }
        // 2. MISS OR SAVE (The remaining ~80-90%)
        else {
            // Split remaining chance: 35% Save, 65% Miss
            // If tired, MISS chance increases relative to SAVE
            let missWeight = 0.65;
            if (avgCond < 50) missWeight = 0.85; // More likely to miss completely if tired

            if (Math.random() < (1 - missWeight)) {
                // SAVE
                const keeper = defendingTeam.players.find(p => p.position === Position.GK) || defendingTeam.players[0];
                const attacker = getPlayer(attackingTeam, sentOff);
                const defender = getPlayer(defendingTeam, sentOff);
                const text = fillTemplate(pick(SAVE_TEXTS), { keeper: keeper.name, attacker: attacker.name, defender: defender.name });
                return { minute, description: text, type: 'SAVE', teamName: defendingTeam.name, playerId: keeper.id };
            } else {
                // MISS
                const player = getPlayer(attackingTeam, sentOff);
                const text = fillTemplate(pick(MISS_TEXTS), { player: player.name });
                return { minute, description: text, type: 'MISS', teamName: attackingTeam.name, playerId: player.id };
            }
        }
    }
    // FOUL
    else if (eventRoll < T_FOUL) {
        const isHomeFoul = Math.random() > homeDominance; 
        const foulTeam = isHomeFoul ? home : away;
        const victimTeam = isHomeFoul ? away : home;
        const player = getPlayer(foulTeam, sentOff);
        const victim = getPlayer(victimTeam, sentOff);
        const isAggressive = foulTeam.tackling === Tackling.AGGRESSIVE;
        
        // Tired players commit more fouls/cards
        const foulCond = getAverageCondition(foulTeam);
        let cardBase = 0.17;
        if (foulCond < 50) cardBase = 0.25; // 25% chance of card if tired

        // CARD PROBABILITIES
        const cardRoll = Math.random();
        let cardType: MatchEvent['type'] = 'FOUL';
        let desc = fillTemplate(pick(FOUL_TEXTS), { player: player.name, victim: victim.name });
        
        if (cardRoll < 0.01) { // 1% Red
             cardType = 'CARD_RED'; 
             desc = `${player.name} gaddarca faulü sonrası direkt KIRMIZI KART gördü!`; 
        } else if (cardRoll < cardBase) { // 16-25% Yellow
             cardType = 'CARD_YELLOW'; 
             desc = isAggressive 
                ? fillTemplate(pick(YELLOW_CARD_AGGRESSIVE_TEXTS), { player: player.name })
                : fillTemplate(pick(YELLOW_CARD_TEXTS), { player: player.name });
        }

        return { minute, description: desc, type: cardType, teamName: foulTeam.name, playerId: player.id };
    }
    // CORNER
    else if (eventRoll < T_CORNER) {
        const isHomeAttacking = Math.random() < homeDominance;
        const attackingTeam = isHomeAttacking ? home : away;
        const player = getPlayer(attackingTeam, sentOff);
        const text = fillTemplate(pick(CORNER_TEXTS), { player: player.name, team: attackingTeam.name });
        return { minute, description: text, type: 'CORNER', teamName: attackingTeam.name };
    }
    // OFFSIDE
    else {
        const isHomeOffside = Math.random() < homeDominance; 
        const offsideTeam = isHomeOffside ? home : away;
        const player = getPlayer(offsideTeam, sentOff);
        const text = fillTemplate(pick(OFFSIDE_TEXTS), { player: player.name });
        return { minute, description: text, type: 'OFFSIDE', teamName: offsideTeam.name, playerId: player.id };
    }
};

/**
 * NEW: Fully simulates a match minute-by-minute in the background.
 * This replaces the old probability-only simulation for "Fast Simulate", providing full events.
 */
export const simulateBackgroundMatch = (homeOriginal: Team, awayOriginal: Team, isKnockout: boolean = false): { homeScore: number, awayScore: number, stats: MatchStats, events: MatchEvent[], pkScore?: { h: number, a: number } } => {
    // 1. Create deep copies to manage lineups locally during simulation
    let home = JSON.parse(JSON.stringify(homeOriginal));
    let away = JSON.parse(JSON.stringify(awayOriginal));
    
    // Initial Stats
    const stats: MatchStats = getEmptyMatchStats();
    // Default Possession Calc
    const hStr = calculateRawTeamStrength(home.players);
    const aStr = calculateRawTeamStrength(away.players);
    const totalStr = hStr + aStr;
    const baseHomePoss = totalStr > 0 ? (hStr / totalStr) * 100 : 50;
    stats.homePossession = Math.min(80, Math.max(20, Math.round(baseHomePoss)));
    stats.awayPossession = 100 - stats.homePossession;

    let events: MatchEvent[] = [];
    let currentScore = { h: 0, a: 0 };
    let homeSubsUsed = 0;
    let awaySubsUsed = 0;

    // Helper: Perform Substitution
    const performSub = (team: Team, isHome: boolean, forcedId?: string) => {
        const currentSubs = isHome ? homeSubsUsed : awaySubsUsed;
        if (currentSubs >= 5) return;

        const onPitch = team.players.slice(0, 11);
        const bench = team.players.slice(11, 18);
        const sentOff = getSentOffPlayers(events);
        
        let outPlayer: Player | undefined;
        
        if (forcedId) {
            outPlayer = onPitch.find(p => p.id === forcedId);
        } else {
            // Tactical: Lowest condition or lowest skill
            const validOut = onPitch.filter(p => !sentOff.has(p.id));
            if (validOut.length > 0) {
                outPlayer = validOut.sort((a,b) => (a.condition || 100) - (b.condition || 100))[0];
            }
        }

        if (!outPlayer) return;

        // Find Sub
        const inPlayer = bench.filter(p => !sentOff.has(p.id) && !p.injury)[0]; // Simplest: first available bench
        if (!inPlayer) return;

        // Swap in local array
        const idxOut = team.players.findIndex(p => p.id === outPlayer!.id);
        const idxIn = team.players.findIndex(p => p.id === inPlayer.id);
        
        if (idxOut !== -1 && idxIn !== -1) {
            [team.players[idxOut], team.players[idxIn]] = [team.players[idxIn], team.players[idxOut]];
            
            if (isHome) homeSubsUsed++;
            else awaySubsUsed++;

            events.push({
                minute: events.length > 0 ? events[events.length-1].minute + 1 : 1, // Approx time
                type: 'SUBSTITUTION',
                description: `${outPlayer.name} 🔄 ${inPlayer.name} ${forcedId ? '(Sakatlık)' : ''}`,
                teamName: team.name
            });
        }
    };

    // --- MAIN LOOP (1 to 90) ---
    for (let minute = 1; minute <= 90; minute++) {
        // 1. Run Step
        const event = simulateMatchStep(minute, home, away, currentScore, events);

        // 2. Process Event
        if (event) {
            const isHomeEvent = event.teamName === home.name;

            // Handle Goals & VAR
            if (event.type === 'GOAL') {
                events.push(event);
                
                if (event.varOutcome === 'NO_GOAL') {
                    // Canceled
                    events.push({
                        minute: minute,
                        type: 'OFFSIDE',
                        description: `VAR İncelemesi: GOL İPTAL! (${event.scorer})`,
                        teamName: event.teamName
                    });
                    // Stat correction: Add goal then remove? No, just track raw shots
                } else {
                    // Confirmed Goal
                    if (isHomeEvent) currentScore.h++; else currentScore.a++;
                    if (event.varOutcome === 'GOAL') {
                        events.push({
                            minute: minute,
                            type: 'INFO',
                            description: 'VAR İncelemesi: GOL GEÇERLİ!',
                            teamName: event.teamName
                        });
                    }
                }
            } 
            // Handle Injury -> Forced Sub
            else if (event.type === 'INJURY') {
                events.push(event);
                if (event.playerId) {
                    performSub(isHomeEvent ? home : away, isHomeEvent, event.playerId);
                }
            }
            // Standard Event
            else {
                events.push(event);
            }

            // Update Basic Stats
            if (event.type === 'GOAL' || event.type === 'MISS' || event.type === 'SAVE') {
                if (isHomeEvent) { stats.homeShots++; if (event.type !== 'MISS') stats.homeShotsOnTarget++; }
                else { stats.awayShots++; if (event.type !== 'MISS') stats.awayShotsOnTarget++; }
            }
            if (event.type === 'CORNER') isHomeEvent ? stats.homeCorners++ : stats.awayCorners++;
            if (event.type === 'FOUL') isHomeEvent ? stats.homeFouls++ : stats.awayFouls++;
            if (event.type === 'CARD_YELLOW') isHomeEvent ? stats.homeYellowCards++ : stats.awayYellowCards++;
            if (event.type === 'CARD_RED') isHomeEvent ? stats.homeRedCards++ : stats.awayRedCards++;
            if (event.type === 'OFFSIDE') isHomeEvent ? stats.homeOffsides++ : stats.awayOffsides++;
        }

        // 3. Tactical Subs (Minute 60 & 75)
        if (minute === 60 || minute === 75) {
            if (Math.random() < 0.7) performSub(home, true);
            if (Math.random() < 0.7) performSub(away, false);
        }
    }

    // --- PENALTIES (If Knockout & Draw) ---
    let pkScore = undefined;
    if (isKnockout && currentScore.h === currentScore.a) {
        pkScore = { h: 0, a: 0 };
        // Simple 5-round sim
        for (let i = 0; i < 5; i++) {
             // Home
             if (Math.random() > 0.25) { 
                 pkScore.h++; 
                 events.push({ minute: 120, type: 'GOAL', description: `Penaltı Atışları: ${home.name} GOL!`, teamName: home.name });
             } else {
                 events.push({ minute: 120, type: 'MISS', description: `Penaltı Atışları: ${home.name} KAÇIRDI!`, teamName: home.name });
             }
             // Away
             if (Math.random() > 0.25) { 
                 pkScore.a++; 
                 events.push({ minute: 120, type: 'GOAL', description: `Penaltı Atışları: ${away.name} GOL!`, teamName: away.name });
             } else {
                 events.push({ minute: 120, type: 'MISS', description: `Penaltı Atışları: ${away.name} KAÇIRDI!`, teamName: away.name });
             }
        }
        // Sudden Death
        while (pkScore.h === pkScore.a) {
             if (Math.random() > 0.3) { pkScore.h++; events.push({ minute: 120, type: 'GOAL', description: `Penaltı (SD): ${home.name} GOL!`, teamName: home.name }); }
             else events.push({ minute: 120, type: 'MISS', description: `Penaltı (SD): ${home.name} KAÇIRDI!`, teamName: home.name });
             
             if (Math.random() > 0.3) { pkScore.a++; events.push({ minute: 120, type: 'GOAL', description: `Penaltı (SD): ${away.name} GOL!`, teamName: away.name }); }
             else events.push({ minute: 120, type: 'MISS', description: `Penaltı (SD): ${away.name} KAÇIRDI!`, teamName: away.name });
        }
        stats.pkHome = pkScore.h;
        stats.pkAway = pkScore.a;
    }

    // --- RATINGS ---
    const { homeRatings, awayRatings } = calculateRatingsFromEvents(home, away, events, currentScore.h, currentScore.a);
    const mvpInfo = determineMVP(homeRatings, awayRatings);
    stats.homeRatings = homeRatings;
    stats.awayRatings = awayRatings;
    stats.mvpPlayerId = mvpInfo.id;
    stats.mvpPlayerName = mvpInfo.name;

    return { 
        homeScore: currentScore.h, 
        awayScore: currentScore.a, 
        stats, 
        events, 
        pkScore 
    };
};

export const simulateMatchInstant = (home: Team, away: Team): { homeScore: number, awayScore: number, stats: MatchStats } => {
    const res = simulateBackgroundMatch(home, away);
    return { homeScore: res.homeScore, awayScore: res.awayScore, stats: res.stats };
};
