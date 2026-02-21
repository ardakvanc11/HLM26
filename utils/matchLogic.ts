
import { Team, Player, MatchEvent, MatchStats, Position, Tackling, PlayerPerformance, Mentality, PassingStyle, Tempo, Width, AttackingTransition, CreativeFreedom, SupportRuns, Dribbling, FocusArea, PassTarget, Patience, LongShots, CrossingType, GKDistributionSpeed, PressingLine, DefensiveLine, DefLineMobility, PressIntensity, DefensiveTransition, PreventCrosses, PressingFocus, SetPiecePlay, PlayStrategy, GoalKickType, GKDistributionTarget } from '../types';
import { INJURY_TYPES, RIVALRIES } from '../constants';
import { GOAL_TEXTS, SAVE_TEXTS, MISS_TEXTS, FOUL_TEXTS, YELLOW_CARD_TEXTS, YELLOW_CARD_AGGRESSIVE_TEXTS, OFFSIDE_TEXTS, CORNER_TEXTS } from '../data/eventTexts';
import { getRareEventDescription } from '../data/rareEvents';
import { calculateTeamStrength, calculateRawTeamStrength } from './teamCalculations';
import { calculateRating, determineMVP, calculateRatingsFromEvents } from './ratingsAndStats';
import { fillTemplate, pick } from './helpers';

// --- HELPER FUNCTIONS ---

export const getSentOffPlayers = (events: MatchEvent[]) => {
    return new Set(events.filter(e => e.type === 'CARD_RED' || e.type === 'FIGHT' || e.type === 'ARGUMENT').map(e => e.playerId));
};

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

    const outfielders = pool.filter(p => p.position !== Position.GK);
    const candidates = outfielders.length > 0 ? outfielders : pool;

    const fwds = candidates.filter(p => [Position.SNT, Position.SLK, Position.SGK].includes(p.position));
    const mids = candidates.filter(p => [Position.OS, Position.OOS].includes(p.position));
    const defs = candidates.filter(p => [Position.STP, Position.SLB, Position.SGB].includes(p.position));
    
    const scorerPool = [
        ...fwds, ...fwds, ...fwds, ...fwds, 
        ...mids, ...mids, 
        ...defs 
    ];
    
    const finalScorerPool = scorerPool.length > 0 ? scorerPool : candidates;
    const scorer = finalScorerPool[Math.floor(Math.random() * finalScorerPool.length)];
    
    let assistPool = pool;
    let assist = assistPool[Math.floor(Math.random() * assistPool.length)];
    
    if (assist.id === scorer.id && assistPool.length > 1) {
        assist = assistPool.find(p => p.id !== scorer.id) || assist;
    }
    
    return { scorer, assist };
};

export const getPenaltyTaker = (team: Team, sentOffIds: Set<string | undefined>): Player => {
    const onPitch = team.players.slice(0, 11).filter(p => 
        !sentOffIds.has(p.id) && 
        (!p.injury || p.injury.daysRemaining <= 0)
    );

    if (onPitch.length === 0) return team.players[0];

    if (team.setPieceTakers?.penalty) {
        const designated = onPitch.find(p => p.id === team.setPieceTakers?.penalty);
        if (designated) return designated;
    }

    const outfielders = onPitch.filter(p => p.position !== Position.GK);
    const candidates = outfielders.length > 0 ? outfielders : onPitch;

    candidates.sort((a, b) => {
        if (b.stats.penalty !== a.stats.penalty) return b.stats.penalty - a.stats.penalty;
        if (b.stats.finishing !== a.stats.finishing) return b.stats.finishing - a.stats.finishing;
        return b.stats.composure - a.stats.composure;
    });

    return candidates[0];
};

export const calculatePenaltyOutcome = (penaltySkill: number): boolean => {
    const roll = Math.random() * 100;
    if (penaltySkill >= 20) return roll < 80;
    else if (penaltySkill >= 15) return roll < 70;
    else if (penaltySkill >= 10) return roll < 60;
    else return roll < 30;
};

// --- SIMULATION LOGIC ---

export const generateRandomPlayerRatings = (players: Player[], teamGoals: number, goalsConceded: number, isWinner: boolean, isDraw: boolean): PlayerPerformance[] => {
    const lineup = [...players].slice(0, 11); 
    let ratings = lineup.map(p => {
        let result: 'WIN' | 'DRAW' | 'LOSS' = 'LOSS';
        if (isWinner) result = 'WIN';
        else if (isDraw) result = 'DRAW';
        const rating = calculateRating({
            position: p.position,
            skill: p.skill,
            goals: 0,
            assists: 0,
            saves: 0,
            goalsConceded: goalsConceded,
            cleanSheet: goalsConceded === 0,
            yellowCards: 0,
            redCards: 0,
            ownGoals: 0,
            penaltiesCaused: 0,
            penaltiesMissed: 0,
            matchResult: result,
            minutesPlayed: 90
        });
        return { playerId: p.id, name: p.name, position: p.position, rating, goals: 0, assists: 0 };
    });
    return ratings;
};

/**
 * Üretilen istatistikleri daha gerçekçi ve skora duyarlı hale getiren fonksiyon.
 */
export const generateMatchStats = (homeTeam: Team, awayTeam: Team, hScore: number, aScore: number): MatchStats => {
    // Topla oynama hesaplama (Güç farkı + Rastgelelik)
    const hStr = homeTeam.strength;
    const aStr = awayTeam.strength;
    const totalStr = hStr + aStr;
    
    let homePossession = Math.floor((hStr / totalStr) * 100);
    // Rastgele dalgalanma (+/- 5)
    homePossession += (Math.floor(Math.random() * 11) - 5);
    // Skor etkisi (Önde olan takım topu rakibe bırakabilir)
    if (hScore > aScore) homePossession -= (hScore - aScore) * 2;
    if (aScore > hScore) homePossession += (aScore - hScore) * 2;
    
    homePossession = Math.max(30, Math.min(70, homePossession));
    const awayPossession = 100 - homePossession;

    // Şut Sayıları (Skora göre daha yüksek ve dinamik)
    const homeShots = Math.floor(Math.random() * 8) + 10 + (hScore * 2);
    const awayShots = Math.floor(Math.random() * 8) + 8 + (aScore * 2);
    
    const homeShotsOnTarget = hScore + Math.floor(Math.random() * 4) + Math.floor(homeShots * 0.1);
    const awayShotsOnTarget = aScore + Math.floor(Math.random() * 3) + Math.floor(awayShots * 0.1);

    const homeRatings = generateRandomPlayerRatings(homeTeam.players, hScore, aScore, hScore > aScore, hScore === aScore);
    const awayRatings = generateRandomPlayerRatings(awayTeam.players, aScore, hScore, aScore > hScore, hScore === aScore);
    
    return {
        homePossession,
        awayPossession,
        homeShots,
        awayShots,
        homeShotsOnTarget: Math.min(homeShots, homeShotsOnTarget),
        awayShotsOnTarget: Math.min(awayShots, awayShotsOnTarget),
        homeCorners: Math.floor(homeShots / 3) + Math.floor(Math.random() * 3),
        awayCorners: Math.floor(awayShots / 3) + Math.floor(Math.random() * 3),
        homeFouls: 8 + Math.floor(Math.random() * 8),
        awayFouls: 9 + Math.floor(Math.random() * 9),
        homeOffsides: Math.floor(Math.random() * 4),
        awayOffsides: Math.floor(Math.random() * 4),
        homeYellowCards: Math.floor(Math.random() * 3),
        awayYellowCards: Math.floor(Math.random() * 4),
        homeRedCards: 0, 
        awayRedCards: 0,
        mvpPlayerId: '', 
        mvpPlayerName: '', 
        homeRatings, 
        awayRatings
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
    const onPitch = team.players.slice(0, 11);
    let leadership = 10;
    if (team.setPieceTakers?.captain) {
        const cap = onPitch.find(p => p.id === team.setPieceTakers?.captain);
        if (cap) leadership = cap.stats.leadership;
        else {
             const nextLeader = onPitch.reduce((prev, current) => (prev.stats.leadership > current.stats.leadership) ? prev : current, onPitch[0]);
             if(nextLeader) leadership = nextLeader.stats.leadership;
        }
    } else {
         const autoCap = onPitch.reduce((prev, current) => (prev.stats.leadership > current.stats.leadership) ? prev : current, onPitch[0]);
         if(autoCap) leadership = autoCap.stats.leadership;
    }
    if (scoreDiff < 0) {
        if (leadership >= 18) multiplier += 0.04;
        else if (leadership >= 14) multiplier += 0.02;
        else if (leadership <= 7) multiplier -= 0.02;
    }
    return { multiplier, warning };
};

export const simulateMatchStep = (
    minute: number, 
    home: Team, 
    away: Team, 
    currentScore: {h:number, a:number},
    existingEvents: MatchEvent[] = [],
    currentStats?: MatchStats
): MatchEvent | null => {
    
    // --- AGGRAVATION CHECK (Injured players staying on pitch) ---
    for (const team of [home, away]) {
       const activePlayers = team.players.slice(0, 11);
       for (const p of activePlayers) {
           if (p.injury && p.injury.occurredAtMinute !== undefined) {
               const duration = minute - p.injury.occurredAtMinute;
               if (duration >= 40) {
                   if (Math.random() < 0.45) {
                       return {
                           minute,
                           type: 'INJURY',
                           playerId: p.id,
                           description: `SAKATLIĞI NÜKSETTİ! ${p.name} sakat sakat oynamanın bedelini ağır ödüyor.`,
                           teamName: team.name
                       };
                   }
               }
           }
       }
    }

    const eventRoll = Math.random();
    const getTeamInjuryRisk = (t: Team) => t.players.slice(0, 11).some(p => (p.condition || 100) < 60);
    const homeRisk = getTeamInjuryRisk(home);
    const awayRisk = getTeamInjuryRisk(away);
    let P_INJURY = 0.0015;
    if (homeRisk || awayRisk) P_INJURY = 0.03;

    const P_PITCH_INVASION = 0.00005; 
    const P_FIGHT = 0.0001; 
    const P_ARGUMENT = 0.0001; 

    const isDerby = RIVALRIES.some(pair => (pair.includes(home.name) && pair.includes(away.name)));

    let homePenaltyChance = 0.001;
    let awayPenaltyChance = 0.001;
    if (currentStats) {
        if (currentStats.homePossession > 70) homePenaltyChance = 0.015;
        else if (currentStats.homePossession > 60) homePenaltyChance = 0.01;
        else homePenaltyChance = 0.005;
        if (currentStats.awayPossession > 70) awayPenaltyChance = 0.015;
        else if (currentStats.awayPossession > 60) awayPenaltyChance = 0.01;
        else awayPenaltyChance = 0.005;
    }
    const P_PENALTY = homePenaltyChance + awayPenaltyChance;
    const P_SHOT_OPPORTUNITY = 0.20;
    const P_FOUL = isDerby ? 0.15 * 1.10 : 0.15;
    const P_CORNER = 0.10;
    const P_OFFSIDE = 0.05;

    const T_PITCH_INVASION = P_PITCH_INVASION;
    const T_FIGHT = T_PITCH_INVASION + P_FIGHT;
    const T_ARGUMENT = T_FIGHT + P_ARGUMENT;
    const T_INJURY = T_ARGUMENT + P_INJURY;
    const T_PENALTY = T_INJURY + (P_PENALTY * 0.5); 
    const T_SHOT = T_PENALTY + P_SHOT_OPPORTUNITY;
    const T_FOUL = T_SHOT + P_FOUL;
    const T_CORNER = T_FOUL + P_CORNER;
    const T_OFFSIDE = T_CORNER + P_OFFSIDE;

    if (eventRoll > T_OFFSIDE) return null;

    const homeScoreDiff = currentScore.h - currentScore.a;
    const awayScoreDiff = currentScore.a - currentScore.h;
    const homeTactics = calculateTacticalEfficiency(home, minute, homeScoreDiff);
    const awayTactics = calculateTacticalEfficiency(away, minute, awayScoreDiff);

    let awayStrengthMalus = 0;
    if (home.fanBase > 1500000) {
        const awayXI = away.players.slice(0, 11);
        const avgComposure = awayXI.reduce((sum, p) => sum + (p.stats.composure || 10), 0) / Math.max(1, awayXI.length);
        if (avgComposure < 14) awayStrengthMalus = -1;
    }

    if (homeTactics.warning && Math.random() < 0.05) return { minute, description: `Ev Sahibi: ${homeTactics.warning}`, type: 'INFO', teamName: home.name };
    if (awayTactics.warning && Math.random() < 0.05) return { minute, description: `Deplasman: ${awayTactics.warning}`, type: 'INFO', teamName: away.name };

    if (eventRoll < T_PITCH_INVASION) {
        return {
            minute,
            type: 'PITCH_INVASION',
            description: getRareEventDescription('PITCH_INVASION', { player: '', team: home.name }),
            teamName: home.name
        };
    }
    else if (eventRoll < T_FIGHT) {
        const sentOff = getSentOffPlayers(existingEvents);
        const homeAggro = getAvailablePlayers(home, sentOff).filter(p => p.stats.aggression >= 18);
        const awayAggro = getAvailablePlayers(away, sentOff).filter(p => p.stats.aggression >= 18);
        let aggressivePlayer: Player | null = null;
        let team: Team = home;
        if (homeAggro.length > 0 || awayAggro.length > 0) {
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
        if (!aggressivePlayer) {
             team = Math.random() < 0.5 ? home : away;
             aggressivePlayer = getPlayer(team, sentOff);
        }
        return {
            minute,
            type: 'FIGHT',
            description: getRareEventDescription('FIGHT', { player: aggressivePlayer.name }),
            teamName: team.name,
            playerId: aggressivePlayer.id
        };
    }
    else if (eventRoll < T_ARGUMENT) {
        const team = Math.random() < 0.5 ? home : away;
        const sentOff = getSentOffPlayers(existingEvents);
        const player = getPlayer(team, sentOff);
        return {
            minute,
            type: 'ARGUMENT',
            description: getRareEventDescription('ARGUMENT', { player: player.name }),
            teamName: team.name,
            playerId: player.id
        };
    }
    else if (eventRoll < T_INJURY) {
        const isHomeInjured = Math.random() < (homeRisk && !awayRisk ? 0.8 : awayRisk && !homeRisk ? 0.2 : 0.5);
        const victimTeam = isHomeInjured ? home : away;
        const injuredPlayer = getPlayer(victimTeam, getSentOffPlayers(existingEvents));
        return {
            minute,
            type: 'INJURY',
            description: `${injuredPlayer.name} yerde kaldı. Sağlık ekipleri sahada.`,
            teamName: victimTeam.name,
            playerId: injuredPlayer.id
        };
    }
    else if (eventRoll < T_PENALTY) {
        const totalChance = homePenaltyChance + awayPenaltyChance;
        const isHomePenalty = Math.random() < (homePenaltyChance / totalChance);
        const attackingTeam = isHomePenalty ? home : away;
        const defendingTeam = isHomePenalty ? away : home;
        const fouler = getPlayer(defendingTeam, getSentOffPlayers(existingEvents));
        const victim = getPlayer(attackingTeam, getSentOffPlayers(existingEvents));
        return {
            minute,
            type: 'PENALTY',
            description: `PENALTI! ${fouler.name}, ${victim.name}'i ceza sahası içinde düşürdü.`,
            teamName: attackingTeam.name,
            playerId: victim.id
        };
    }
    else if (eventRoll < T_SHOT) {
        const homeAttack = home.strength * homeTactics.multiplier;
        const awayAttack = (away.strength + awayStrengthMalus) * awayTactics.multiplier;
        const totalAttack = homeAttack + awayAttack;
        const isHomeAttacking = Math.random() < (homeAttack / totalAttack);
        const attackingTeam = isHomeAttacking ? home : away;
        const defendingTeam = isHomeAttacking ? away : home;
        const scorerInfo = getScorer(attackingTeam, getSentOffPlayers(existingEvents));
        const scorer = scorerInfo.scorer;
        const assist = scorerInfo.assist;
        const keeper = defendingTeam.players.find(p => p.position === Position.GK) || defendingTeam.players[0];
        let goalProb = 0.14; 
        const skillDiff = scorer.skill - keeper.skill;
        goalProb += (skillDiff * 0.005); 
        if (attackingTeam.mentality === Mentality.VERY_ATTACKING) goalProb += 0.05;
        if (defendingTeam.mentality === Mentality.VERY_DEFENSIVE || defendingTeam.defLine === DefensiveLine.VERY_DEEP) goalProb -= 0.05;
        const shotRoll = Math.random();
        if (shotRoll < goalProb) {
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
            const template = pick(SAVE_TEXTS);
            const defender = getPlayer(defendingTeam, getSentOffPlayers(existingEvents));
            const desc = fillTemplate(template, { keeper: keeper.name, attacker: scorer.name, defender: defender.name });
            return {
                minute,
                type: 'SAVE',
                description: desc,
                teamName: defendingTeam.name,
                playerId: keeper.id
            };
        } else {
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
    else if (eventRoll < T_FOUL) {
        const isHomeFoul = Math.random() < 0.5;
        const foulingTeam = isHomeFoul ? home : away;
        const victimTeam = isHomeFoul ? away : home;
        const fouler = getPlayer(foulingTeam, getSentOffPlayers(existingEvents));
        const victim = getPlayer(victimTeam, getSentOffPlayers(existingEvents));
        let redChance = 0.02;
        let yellowChance = 0.15;
        
        // --- SARI KARTLI OYUNCU İÇİN İHTİMAL DÜŞÜRME (YENİ) ---
        const hasYellow = existingEvents.some(e => e.type === 'CARD_YELLOW' && e.playerId === fouler.id);
        if (hasYellow) {
            yellowChance *= 0.7; // 30% oranında azalır
        }

        if (foulingTeam.tackling === Tackling.AGGRESSIVE) {
            redChance = 0.03;
            yellowChance = 0.25; 
        } else if (foulingTeam.tackling === Tackling.CAUTIOUS) {
            redChance = 0.005;
            yellowChance = 0.05;
        }
        if (foulingTeam.pressIntensity === PressIntensity.VERY_HIGH) {
            yellowChance += 0.05;
            redChance += 0.005;
        }
        const cardRoll = Math.random();
        if (cardRoll < redChance) {
            return {
                minute,
                type: 'CARD_RED',
                description: `KIRMIZI KART! ${fouler.name} (VAR Kontrolü Sonrası) oyundan atıldı!`,
                teamName: foulingTeam.name,
                playerId: fouler.id
            };
        } else if (cardRoll < redChance + yellowChance) {
            
            if (hasYellow) {
                 return {
                    minute,
                    type: 'CARD_RED',
                    description: `İKİNCİ SARI KARTTAN KIRMIZI! ${fouler.name} faulü sonrası ikinci sarı kartı görerek oyundan atıldı!`,
                    teamName: foulingTeam.name,
                    playerId: fouler.id
                };
            }

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

export const simulateBackgroundMatch = (home: Team, away: Team, isKnockout: boolean = false, firstLegScore?: { home: number, away: number }) => {
    let homeScore = 0;
    let awayScore = 0;
    let events: MatchEvent[] = [];
    for (let m = 1; m <= 90; m++) {
        // İstatistikleri simülasyon sırasında biriktirmiyoruz, sonunda topluca üretiyoruz (generateMatchStats ile)
        const fakeStats: MatchStats = { ...getEmptyMatchStats(), homePossession: 50, awayPossession: 50 };
        const event = simulateMatchStep(m, home, away, {h: homeScore, a: awayScore}, events, fakeStats);
        if (event) {
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
                events.push({ ...event, type: 'CARD_RED' });
            }
            else if (event.type !== 'PITCH_INVASION') { 
                events.push(event);
                if (event.type === 'GOAL') {
                    if (event.teamName === home.name) homeScore++;
                    else awayScore++;
                }
            }
        }
    }
    
    let pkScore: {h:number, a:number} | undefined = undefined;
    let triggerPenalties = false;

    if (isKnockout) {
        if (firstLegScore) {
            // STRICT DOUBLE-LEG LOGIC
            // User requirement: AggregateHome = CurrentHome + PrevAway
            // User requirement: AggregateAway = CurrentAway + PrevHome
            const aggregateHome = homeScore + firstLegScore.away;
            const aggregateAway = awayScore + firstLegScore.home;

            if (aggregateHome === aggregateAway) {
                triggerPenalties = true;
            }
            // Note: Even if homeScore !== awayScore (e.g. 1-0 win), if agg is tied (e.g. 0-1 prev), penalties trigger.
            // This replaces the old logic.
        } else {
            // Single leg knockout (Standard)
            if (homeScore === awayScore) triggerPenalties = true;
        }
    }

    if (triggerPenalties) {
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
    
    // İstatistikleri dinamik olarak üret
    const stats = generateMatchStats(home, away, homeScore, awayScore);
    stats.homeYellowCards = events.filter(e => e.type === 'CARD_YELLOW' && e.teamName === home.name).length;
    stats.awayYellowCards = events.filter(e => e.type === 'CARD_YELLOW' && e.teamName === away.name).length;
    stats.homeRedCards = events.filter(e => e.type === 'CARD_RED' && e.teamName === home.name).length;
    stats.awayRedCards = events.filter(e => e.type === 'CARD_RED' && e.teamName === away.name).length;
    
    // --- İKİNCİ SARI KARTLARI İSTATİSTİĞE EKLEME ---
    const secondYellowsHome = events.filter(e => e.type === 'CARD_RED' && e.teamName === home.name && e.description.toLowerCase().includes('ikinci sarı')).length;
    const secondYellowsAway = events.filter(e => e.type === 'CARD_RED' && e.teamName === away.name && e.description.toLowerCase().includes('ikinci sarı')).length;

    stats.homeYellowCards += secondYellowsHome;
    stats.awayYellowCards += secondYellowsAway;
    
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
