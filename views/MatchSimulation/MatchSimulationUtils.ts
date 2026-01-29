
import { Team, Tempo, PressIntensity } from '../../types';

export const GOAL_SOUND = '/voices/goalsound.wav';
export const WHISTLE_SOUND = '/voices/whistle.wav';

export const getFatigueDrop = (tempo: Tempo, press: PressIntensity): number => {
    // Base Values for Tempo
    let tVal = 0.5; // Standard
    if (tempo === Tempo.VERY_SLOW) tVal = 0.2;
    else if (tempo === Tempo.SLOW) tVal = 0.3;
    else if (tempo === Tempo.HIGH) tVal = 0.8;
    else if (tempo === Tempo.BEAST_MODE) tVal = 1.2; // Extreme drain

    // Base Values for Pressing
    let pVal = 0.5; // Standard
    if (press === PressIntensity.VERY_LOW) pVal = 0.1;
    else if (press === PressIntensity.LOW) pVal = 0.3;
    else if (press === PressIntensity.HIGH) pVal = 0.8;
    else if (press === PressIntensity.VERY_HIGH) pVal = 1.1; // Extreme drain

    // Total drain per minute (Range: ~0.3 to ~2.3)
    // REDUCED BY 50% PER USER REQUEST
    return (tVal + pVal) * 0.5;
};

export const applyFatigueToTeam = (team: Team, scoreDiff: number): Team => {
    const drop = getFatigueDrop(team.tempo, team.pressIntensity || PressIntensity.STANDARD);
    
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

    // Effect: High leadership reduces fatigue (motivation). Low leadership in losing scenarios increases it (stress).
    let captainMultiplier = 1.0;
    
    if (leadership >= 15) {
        captainMultiplier = 0.95; // 5% less fatigue (Motivated)
    } 
    
    if (scoreDiff < 0 && leadership <= 8) {
        captainMultiplier = 1.05; // 5% more fatigue (Panic/Stress)
    }

    const finalDropBase = drop * captainMultiplier;

    const updatedPlayers = team.players.map((p, index) => {
        // Apply only to players on pitch (Indices 0-10)
        // Do not apply to subs (Indices 11+)
        if (index < 11 && !p.injury && !p.suspendedUntilWeek) {
             // Using current condition or 100 as fallback
             const currentCond = p.condition !== undefined ? p.condition : 100;
             
             // Stamina Stat Mitigation (1-20 Scale)
             // Stamina 20 -> Multiplier 0.6 (Lose 40% less energy)
             // Stamina 10 -> Multiplier 0.8
             // Stamina 1  -> Multiplier 1.0 (Full fatigue)
             const staminaStat = p.stats.stamina || 10;
             const staminaFactor = 1 - ((staminaStat - 1) * 0.02); 
             
             const actualDrop = finalDropBase * staminaFactor;
             const newCond = Math.max(0, currentCond - actualDrop);

             return { ...p, condition: newCond };
        }
        return p;
    });
    
    return { ...team, players: updatedPlayers };
};
