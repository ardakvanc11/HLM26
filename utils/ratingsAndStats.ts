
import { Position, Team, MatchEvent, PlayerPerformance } from '../types';

interface RatingProps {
    position: Position;
    skill: number;
    goals: number;
    assists: number;
    saves: number;
    goalsConceded: number;
    cleanSheet: boolean;
    yellowCards: number;
    redCards: number;
    ownGoals: number;
    penaltiesCaused: number;
    penaltiesMissed: number;
    matchResult: 'WIN' | 'DRAW' | 'LOSS';
    minutesPlayed: number;
    isInjured?: boolean; // NEW: Added isInjured prop
}

/**
 * DETERMINISTIC RATING CALCULATOR
 * Rules:
 * 1. No Randomness.
 * 2. Base Performance Impact Max ±0.5.
 * 3. GK Max Rating 9.0 (Save/CS bonus max +2.0).
 * 4. Loser Floor 4.5 (Unless Red/Pen/OwnGoal).
 * 5. Context Impact Max ±0.2.
 * 6. 10.0 Only for Hat-trick or 2G+1A.
 * 7. Injury Penalty: 50% reduction.
 */
export const calculateRating = (props: RatingProps): number => {
    // --- 1. BASELINE ---
    let rating = 6.0;

    // --- 2. BASE PERFORMANCE (Skill Factor) ---
    // Scale: 70 is average. 
    // 90 skill -> +0.5
    // 50 skill -> -0.5
    let basePerf = (props.skill - 70) / 40;
    // Strict Clamp ±0.5 (Rule 2)
    basePerf = Math.max(-0.5, Math.min(0.5, basePerf));
    rating += basePerf;

    // --- 3. CONTEXT (Rule 5) ---
    if (props.matchResult === 'WIN') rating += 0.2;
    else if (props.matchResult === 'LOSS') rating -= 0.2;

    // --- 4. POSITIVE EVENTS ---
    
    // Goals
    if (props.goals > 0) {
        if (props.position === Position.SNT || props.position === Position.SLK || props.position === Position.SGK) {
            rating += (props.goals * 1.0);
        } else if (props.position === Position.OS || props.position === Position.OOS) {
            rating += (props.goals * 1.2); // Midfielders get slightly more
        } else {
            rating += (props.goals * 1.5); // Defenders/GK get massive bonus
        }
    }

    // Assists
    if (props.assists > 0) {
        rating += (props.assists * 0.8);
    }

    // Goalkeeper Specifics (Rule 3)
    if (props.position === Position.GK) {
        let gkBonus = 0;
        
        // Saves
        gkBonus += (props.saves * 0.2); // 5 saves = +1.0

        // Clean Sheet (Only if played significant time)
        if (props.cleanSheet && props.minutesPlayed > 60) {
            gkBonus += 0.5;
        }

        // GK Bonus Cap (Rule 3: Clean sheet + Saves max +2.0)
        gkBonus = Math.min(2.0, gkBonus);
        rating += gkBonus;

        // Conceded Penalty (Soft)
        if (props.goalsConceded > 1) {
            rating -= ((props.goalsConceded - 1) * 0.2);
        }
    } 
    // Defender Clean Sheet
    else if ([Position.STP, Position.SLB, Position.SGB].includes(props.position)) {
        if (props.cleanSheet && props.minutesPlayed > 60) {
            rating += 0.4;
        }
        // Defender Conceded Penalty (Soft)
        if (props.goalsConceded > 1) {
            rating -= ((props.goalsConceded - 1) * 0.1);
        }
    }

    // --- 5. NEGATIVE EVENTS ---
    
    // Cards
    if (props.yellowCards > 0) rating -= 0.3;
    if (props.redCards > 0) rating -= 2.0;

    // Major Errors
    if (props.penaltiesCaused > 0) rating -= 1.5;
    if (props.ownGoals > 0) rating -= 1.5;
    if (props.penaltiesMissed > 0) rating -= 1.0;

    // --- 6. MINUTES PLAYED ---
    // If played very little and did nothing, pull towards 6.0
    if (props.minutesPlayed < 15 && props.goals === 0 && props.assists === 0 && props.redCards === 0) {
        // Neutralize rating for late subs
        rating = 6.0 + (rating - 6.0) * 0.5; 
    }

    // --- 7. FINAL RULES & CLAMPS ---

    // Rule 4: Loser Floor
    const hasMajorError = props.redCards > 0 || props.penaltiesCaused > 0 || props.ownGoals > 0;
    if (props.matchResult === 'LOSS' && !hasMajorError) {
        rating = Math.max(4.5, rating);
    }

    // Rule 6 & 3: Ceilings
    let maxRating = 9.5;
    
    // GK Cap (Rule 3)
    if (props.position === Position.GK) {
        maxRating = 9.0;
    } 
    // 10.0 Condition (Rule 6)
    else if (props.goals >= 3 || (props.goals >= 2 && props.assists >= 1)) {
        maxRating = 10.0;
    }

    rating = Math.min(maxRating, rating);
    
    // Absolute Floor
    rating = Math.max(3.0, rating);

    // --- 8. INJURY PENALTY (NEW) ---
    // Rule 7: If player plays while injured, performance drops by 50%
    if (props.isInjured) {
        rating = rating * 0.5;
    }

    return parseFloat(rating.toFixed(1));
};

/**
 * Extracts events and calculates ratings for all players.
 */
export const calculateRatingsFromEvents = (
    homeTeam: Team, 
    awayTeam: Team, 
    events: MatchEvent[], 
    homeScore: number, 
    awayScore: number
): { homeRatings: PlayerPerformance[], awayRatings: PlayerPerformance[] } => {
    
    const calculateForTeam = (team: Team, isHome: boolean): PlayerPerformance[] => {
        const myScore = isHome ? homeScore : awayScore;
        const oppScore = isHome ? awayScore : homeScore;
        
        let result: 'WIN' | 'DRAW' | 'LOSS' = 'DRAW';
        if (myScore > oppScore) result = 'WIN';
        else if (myScore < oppScore) result = 'LOSS';

        // 1. Identify active players (Starters + Subs)
        const starters = team.players.slice(0, 11);
        const substitutions = events.filter(e => e.type === 'SUBSTITUTION' && e.teamName === team.name);
        const subInNames = new Set(substitutions.map(s => s.description.split(' 🔄 ')[1].trim()));
        const subPlayers = team.players.filter(p => subInNames.has(p.name));
        const allActivePlayers = [...starters, ...subPlayers];

        // 2. Parse Events per Player
        return allActivePlayers.map(player => {
            // Minutes Calculation
            let minutes = 90;
            const subInEvent = substitutions.find(s => s.description.includes(`🔄 ${player.name}`));
            const subOutEvent = substitutions.find(s => s.description.startsWith(player.name));
            
            if (subInEvent) minutes = 90 - subInEvent.minute;
            if (subOutEvent) minutes = subOutEvent.minute; // If subbed out, overrides 90
            
            // Red Card Check
            const redEvent = events.find(e => e.type === 'CARD_RED' && e.playerId === player.id);
            if (redEvent) minutes = redEvent.minute; // Stops playing at red card

            // Count Events
            let goals = 0;
            let assists = 0;
            let saves = 0;
            let yellowCards = 0;
            let redCards = 0;
            let ownGoals = 0;
            let penaltiesCaused = 0;
            let penaltiesMissed = 0;

            events.forEach(e => {
                const isMyTeamEvent = e.teamName === team.name;
                
                // Direct attribution
                if (e.playerId === player.id) {
                    if (e.type === 'CARD_YELLOW') yellowCards++;
                    if (e.type === 'CARD_RED') redCards++;
                    if (e.type === 'SAVE') saves++;
                    if (e.type === 'MISS' && e.description.includes('PENALTI')) penaltiesMissed++;
                    
                    // Penalty Caused check: Event type is PENALTY, playerId is victim usually, 
                    // BUT in matchLogic, we assigned playerId to victim. 
                    // We need to parse description or context.
                    // For simplicity in this engine: If Opponent gets a penalty and description mentions this player
                }

                if (e.type === 'GOAL') {
                    if (e.scorer === player.name && isMyTeamEvent) goals++;
                    if (e.assist === player.name && isMyTeamEvent) assists++;
                    
                    // Own Goal Detection (Scorer is player, but teamName is NOT my team OR description says Own Goal)
                    // Note: Current engine usually puts own goals as separate events or handles them via teamName mismatch.
                    // Standard logic: If I scored but teamName is Opponent -> Own Goal.
                    if (e.scorer === player.name && !isMyTeamEvent) ownGoals++;
                }

                // Parse Penalty Cause (Fouler)
                if (e.type === 'PENALTY') {
                    // Description format: "PENALTI! {fouler}, {victim}'i..."
                    if (e.description.startsWith(`PENALTI! ${player.name}`)) {
                        penaltiesCaused++;
                    }
                }
            });

            // Calculate
            const rating = calculateRating({
                position: player.position,
                skill: player.skill,
                goals,
                assists,
                saves,
                goalsConceded: oppScore,
                cleanSheet: oppScore === 0,
                yellowCards,
                redCards,
                ownGoals,
                penaltiesCaused,
                penaltiesMissed,
                matchResult: result,
                minutesPlayed: minutes,
                isInjured: player.injury && player.injury.daysRemaining > 0 // Pass injury status
            });

            return {
                playerId: player.id,
                name: player.name,
                position: player.position,
                rating,
                goals,
                assists
            };
        });
    };

    return {
        homeRatings: calculateForTeam(homeTeam, true),
        awayRatings: calculateForTeam(awayTeam, false)
    };
};

export const determineMVP = (homeRatings: PlayerPerformance[], awayRatings: PlayerPerformance[]): { id: string, name: string } => {
    const allPlayers = [...homeRatings, ...awayRatings];
    
    // Sort logic: Rating > Goals > Assists
    allPlayers.sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (b.goals !== a.goals) return b.goals - a.goals;
        return b.assists - a.assists;
    });

    const best = allPlayers[0];
    return {
        id: best?.playerId || '',
        name: best?.name || 'Bilinmiyor'
    };
};