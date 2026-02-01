
import { Team, Tempo, PressIntensity, Player } from '../../types';

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

// --- NEW: SHOUT EFFECT LOGIC ---
export const calculateShoutEffect = (player: Player, scoreDiff: number, shoutType: string): number => {
    // 1. Determine Personality Type
    let type: 'YOUNG' | 'LEADER' | 'VETERAN' | 'MATURE' = 'MATURE';
    
    if (player.age <= 22) {
        type = 'YOUNG';
    } else if (player.age >= 29) {
        // Leader check: High Leadership stat or designated captain (simplified here to stat/skill)
        if (player.stats.leadership >= 15 || player.skill >= 85) {
            type = 'LEADER';
        } else {
            type = 'VETERAN';
        }
    } else {
        type = 'MATURE';
    }

    // 2. Determine Match Status
    let status: 'BEHIND' | 'DRAW' | 'AHEAD' = 'DRAW';
    if (scoreDiff < 0) status = 'BEHIND';
    else if (scoreDiff > 0) status = 'AHEAD';

    // 3. Matrix Lookup
    // PRAISE = Aferin
    // ENCOURAGE = Başarabilirsin
    // CALM = Sakin Ol
    // DEMAND = Daha İyisini Yap
    
    if (type === 'YOUNG') {
        if (status === 'BEHIND') {
            if (shoutType === 'PRAISE') return 3;
            if (shoutType === 'ENCOURAGE') return 5;
            if (shoutType === 'CALM') return 0;
            if (shoutType === 'DEMAND') return -3;
        }
        if (status === 'DRAW') {
            if (shoutType === 'PRAISE') return 5;
            if (shoutType === 'ENCOURAGE') return 3;
            if (shoutType === 'CALM') return -2;
            if (shoutType === 'DEMAND') return -4;
        }
        if (status === 'AHEAD') {
            if (shoutType === 'PRAISE') return 4;
            if (shoutType === 'ENCOURAGE') return 0;
            if (shoutType === 'CALM') return -2;
            if (shoutType === 'DEMAND') return -4;
        }
    }

    if (type === 'VETERAN') {
        if (status === 'BEHIND') {
            if (shoutType === 'PRAISE') return 0;
            if (shoutType === 'ENCOURAGE') return 0;
            if (shoutType === 'CALM') return 2;
            if (shoutType === 'DEMAND') return 4;
        }
        if (status === 'DRAW') {
            if (shoutType === 'PRAISE') return 3;
            if (shoutType === 'ENCOURAGE') return 0;
            if (shoutType === 'CALM') return 3;
            if (shoutType === 'DEMAND') return 3;
        }
        if (status === 'AHEAD') {
            if (shoutType === 'PRAISE') return 3;
            if (shoutType === 'ENCOURAGE') return 0;
            if (shoutType === 'CALM') return 3;
            if (shoutType === 'DEMAND') return -3;
        }
    }

    if (type === 'LEADER') {
        if (status === 'BEHIND') {
            if (shoutType === 'PRAISE') return 0;
            if (shoutType === 'ENCOURAGE') return -3;
            if (shoutType === 'CALM') return 3;
            if (shoutType === 'DEMAND') return 5;
        }
        if (status === 'DRAW') {
            if (shoutType === 'PRAISE') return 3;
            if (shoutType === 'ENCOURAGE') return 0;
            if (shoutType === 'CALM') return 3;
            if (shoutType === 'DEMAND') return 5;
        }
        if (status === 'AHEAD') {
            if (shoutType === 'PRAISE') return 3;
            if (shoutType === 'ENCOURAGE') return 0;
            if (shoutType === 'CALM') return 5;
            if (shoutType === 'DEMAND') return 0;
        }
    }

    if (type === 'MATURE') {
        if (status === 'BEHIND') {
            if (shoutType === 'PRAISE') return 3;
            if (shoutType === 'ENCOURAGE') return 3;
            if (shoutType === 'CALM') return 5;
            if (shoutType === 'DEMAND') return 3;
        }
        if (status === 'DRAW') {
            if (shoutType === 'PRAISE') return 3;
            if (shoutType === 'ENCOURAGE') return 0;
            if (shoutType === 'CALM') return 3;
            if (shoutType === 'DEMAND') return 0;
        }
        if (status === 'AHEAD') {
            if (shoutType === 'PRAISE') return 3;
            if (shoutType === 'ENCOURAGE') return 0;
            if (shoutType === 'CALM') return 5;
            if (shoutType === 'DEMAND') return -3;
        }
    }

    return 0; // Fallback
};
