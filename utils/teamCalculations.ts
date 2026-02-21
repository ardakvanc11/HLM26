

import { Team, Position, Fixture, BettingOdds, ManagerStats, Player, ManagerProfile, PlayerStats } from '../types';

// --- CONSTANTS FOR WEIGHTED CALCULATIONS ---

// KRK (Kadro Rolü Katsayısı)
const KRK = {
    STARTER: 1.00,
    RESERVE: 0.35,
    ROTATION: 0.10
};

// PÖK (Pozisyon Önemi Katsayısı)
const POK = {
    OS: 1.10, // CM, DM, AM
    ST: 1.05, // SNT
    GK: 1.00, // GK
    DEF: 0.95, // STP
    WING: 0.90, // SLK, SGK
    FULLBACK: 0.80 // SLB, SGB
};

const getPokForPosition = (pos: Position): number => {
    switch (pos) {
        case Position.OS:
        case Position.OOS: return POK.OS;
        case Position.SNT: return POK.ST;
        case Position.GK: return POK.GK;
        case Position.STP: return POK.DEF;
        case Position.SLK:
        case Position.SGK: return POK.WING;
        case Position.SLB:
        case Position.SGB: return POK.FULLBACK;
        default: return 1.0;
    }
};

// --- MEVKİ BAZLI STAT AĞIRLIKLARI (POSITION-BASED STAT WEIGHTS) ---
// Maps Position -> { Attribute: Weight }
const STAT_WEIGHTS: Partial<Record<Position, Partial<Record<keyof PlayerStats, number>>>> = {
    [Position.GK]: {
        agility: 1.5,
        concentration: 1.5,
        positioning: 1.4,
        composure: 1.4,
        anticipation: 1.3,
        decisions: 1.3,
        bravery: 1.2,
        acceleration: 1.0,
        balance: 1.0,
        physical: 0.9,
        jumping: 0.8,
        passing: 0.7,
        firstTouch: 0.6,
        technique: 0.6,
        pace: 0.5,
        stamina: 0.5,
        teamwork: 0.4,
        leadership: 0.4,
        aggression: 0.3,
        vision: 0.3,
        penalty: 0.2,
        freeKick: 0.2,
        corners: 0.1,
        longThrows: 0.1
    },
    [Position.STP]: {
        positioning: 1.5,
        marking: 1.5,
        tackling: 1.4,
        heading: 1.4,
        physical: 1.3,
        concentration: 1.3,
        decisions: 1.2,
        anticipation: 1.2,
        composure: 1.1,
        jumping: 1.1,
        aggression: 1.0,
        pace: 0.9,
        acceleration: 0.8,
        stamina: 0.8,
        passing: 0.7,
        technique: 0.6,
        firstTouch: 0.6,
        balance: 0.6,
        agility: 0.5,
        teamwork: 0.5,
        workRate: 0.5,
        vision: 0.4,
        longShots: 0.3,
        finishing: 0.3,
        dribbling: 0.3,
        penalty: 0.2,
        corners: 0.2,
        freeKick: 0.2,
        longThrows: 0.1
    },
    [Position.SLB]: {
        pace: 1.5,
        stamina: 1.4,
        acceleration: 1.4,
        crossing: 1.3,
        tackling: 1.3,
        positioning: 1.2,
        marking: 1.2,
        agility: 1.1,
        workRate: 1.1,
        teamwork: 1.0,
        passing: 1.0,
        dribbling: 0.9,
        firstTouch: 0.9,
        technique: 0.9,
        composure: 0.8,
        anticipation: 0.8,
        physical: 0.8,
        balance: 0.7,
        jumping: 0.7,
        decisions: 0.7,
        aggression: 0.7,
        offTheBall: 0.6,
        longShots: 0.5,
        finishing: 0.4,
        heading: 0.4,
        vision: 0.3,
        flair: 0.3,
        penalty: 0.2,
        corners: 0.2,
        freeKick: 0.2,
        longThrows: 0.1
    },
    [Position.SGB]: {
        pace: 1.5,
        stamina: 1.4,
        acceleration: 1.4,
        crossing: 1.3,
        tackling: 1.3,
        positioning: 1.2,
        marking: 1.2,
        agility: 1.1,
        workRate: 1.1,
        teamwork: 1.0,
        passing: 1.0,
        dribbling: 0.9,
        firstTouch: 0.9,
        technique: 0.9,
        composure: 0.8,
        anticipation: 0.8,
        physical: 0.8,
        balance: 0.7,
        jumping: 0.7,
        decisions: 0.7,
        aggression: 0.7,
        offTheBall: 0.6,
        longShots: 0.5,
        finishing: 0.4,
        heading: 0.4,
        vision: 0.3,
        flair: 0.3,
        penalty: 0.2,
        corners: 0.2,
        freeKick: 0.2,
        longThrows: 0.1
    },
    [Position.OS]: {
        passing: 1.5,
        stamina: 1.4,
        decisions: 1.4,
        vision: 1.3,
        technique: 1.3,
        positioning: 1.2,
        tackling: 1.2,
        workRate: 1.1,
        teamwork: 1.1,
        composure: 1.0,
        anticipation: 1.0,
        dribbling: 0.9,
        firstTouch: 0.9,
        aggression: 0.9,
        physical: 0.9,
        longShots: 0.8,
        offTheBall: 0.8,
        pace: 0.7,
        acceleration: 0.7,
        agility: 0.7,
        balance: 0.7,
        finishing: 0.5,
        flair: 0.5,
        heading: 0.4,
        jumping: 0.4,
        penalty: 0.2,
        corners: 0.2,
        freeKick: 0.2,
        longThrows: 0.1
    },
    [Position.OOS]: {
        technique: 1.5,
        vision: 1.5,
        passing: 1.4,
        decisions: 1.4,
        composure: 1.3,
        offTheBall: 1.3,
        dribbling: 1.2,
        firstTouch: 1.2,
        flair: 1.1,
        finishing: 1.0,
        longShots: 0.9,
        positioning: 0.9,
        anticipation: 0.9,
        agility: 0.8,
        balance: 0.8,
        acceleration: 0.8,
        stamina: 0.7,
        workRate: 0.7,
        teamwork: 0.7,
        physical: 0.6,
        pace: 0.6,
        aggression: 0.5,
        heading: 0.3,
        jumping: 0.3,
        tackling: 0.2,
        marking: 0.2,
        penalty: 0.2,
        corners: 0.2,
        freeKick: 0.2,
        longThrows: 0.1
    },
    [Position.SLK]: {
        pace: 1.5,
        acceleration: 1.4,
        dribbling: 1.4,
        agility: 1.3,
        crossing: 1.2,
        offTheBall: 1.2,
        technique: 1.1,
        firstTouch: 1.0,
        stamina: 0.9,
        passing: 0.9,
        vision: 0.8,
        decisions: 0.8,
        composure: 0.7,
        finishing: 0.7,
        balance: 0.7,
        longShots: 0.6,
        physical: 0.6,
        flair: 0.6,
        teamwork: 0.5,
        workRate: 0.5,
        jumping: 0.5,
        aggression: 0.4,
        positioning: 0.4,
        corners: 0.3,
        freeKick: 0.3,
        tackling: 0.2,
        marking: 0.2,
        penalty: 0.2,
        longThrows: 0.1
    },
    [Position.SGK]: {
        pace: 1.5,
        acceleration: 1.4,
        dribbling: 1.4,
        agility: 1.3,
        crossing: 1.2,
        offTheBall: 1.2,
        technique: 1.1,
        firstTouch: 1.0,
        stamina: 0.9,
        passing: 0.9,
        vision: 0.8,
        decisions: 0.8,
        composure: 0.7,
        finishing: 0.7,
        balance: 0.7,
        longShots: 0.6,
        physical: 0.6,
        flair: 0.6,
        teamwork: 0.5,
        workRate: 0.5,
        jumping: 0.5,
        aggression: 0.4,
        positioning: 0.4,
        corners: 0.3,
        freeKick: 0.3,
        tackling: 0.2,
        marking: 0.2,
        penalty: 0.2,
        longThrows: 0.1
    },
    [Position.SNT]: {
        finishing: 1.5,
        offTheBall: 1.4,
        positioning: 1.3,
        composure: 1.3,
        heading: 1.2,
        pace: 1.0,
        acceleration: 0.9,
        physical: 0.9,
        jumping: 0.8,
        technique: 0.8,
        dribbling: 0.7,
        firstTouch: 0.7,
        passing: 0.4,
        vision: 0.3,
        teamwork: 0.3,
        aggression: 0.3,
        stamina: 0.3,
        balance: 0.3,
        penalty: 0.2,
        longShots: 0.3,
        flair: 0.3
    }
};

/**
 * Calculates the Effective Skill of a player based on their position's stat weights.
 */
export const calculateEffectiveSkill = (player: Player): number => {
    const weights = STAT_WEIGHTS[player.position] || {};
    let totalScore = 0;
    let totalWeight = 0;

    if (Object.keys(weights).length === 0) return player.skill;

    for (const [statKey, weight] of Object.entries(weights)) {
        // @ts-ignore
        let statValue = player.stats[statKey] || 10;
        totalScore += (statValue * 5) * weight;
        totalWeight += weight;
    }

    if (totalWeight === 0) return player.skill;
    const weightedAvg = totalScore / totalWeight;
    return (weightedAvg * 0.8) + (player.skill * 0.2);
};

/**
 * Calculates the RAW Overall Rating (Skill) purely from Attributes.
 */
export const calculatePlayerOverallFromStats = (player: Player): number => {
    const weights = STAT_WEIGHTS[player.position] || {};
    let totalScore = 0;
    let totalWeight = 0;
    
    if (Object.keys(weights).length === 0) return player.skill;

    for (const [statKey, weight] of Object.entries(weights)) {
        // @ts-ignore
        let statValue = player.stats[statKey] || 10;
        totalScore += (statValue * 5) * weight;
        totalWeight += weight;
    }
    
    const averageAllStats = Object.values(player.stats).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) / 36;
    const baselineScore = averageAllStats * 5;
    
    if (totalWeight === 0) return Math.round(baselineScore);
    const weightedAvg = totalScore / totalWeight;
    const finalRating = (weightedAvg * 0.7) + (baselineScore * 0.3);

    return Math.max(1, Math.min(99, Math.round(finalRating)));
};

/**
 * Calculates the RAW Weighted Team Strength (THG) based on squad roles.
 */
export const calculateRawTeamStrength = (players: Player[]): number => {
    if (players.length === 0) return 0;

    const sorted = [...players].sort((a, b) => calculateEffectiveSkill(b) - calculateEffectiveSkill(a));

    const starters: Player[] = [];
    const pool = [...sorted];

    const pickBest = (pos: Position, count: number) => {
        const found = [];
        for (let i = 0; i < count; i++) {
            const idx = pool.findIndex(p => p.position === pos);
            if (idx !== -1) {
                found.push(pool[idx]);
                pool.splice(idx, 1);
            }
        }
        return found;
    };

    starters.push(...pickBest(Position.GK, 1));
    starters.push(...pickBest(Position.SLB, 1));
    starters.push(...pickBest(Position.SGB, 1));
    starters.push(...pickBest(Position.STP, 2));
    starters.push(...pickBest(Position.SLK, 1));
    starters.push(...pickBest(Position.SGK, 1));
    starters.push(...pickBest(Position.OS, 1)); 
    starters.push(...pickBest(Position.OOS, 1)); 
    
    const currentMids = starters.filter(p => p.position === Position.OS || p.position === Position.OOS).length;
    if (currentMids < 2) {
        const midIdx = pool.findIndex(p => p.position === Position.OS || p.position === Position.OOS);
        if (midIdx !== -1) { starters.push(pool[midIdx]); pool.splice(midIdx, 1); }
    }

    starters.push(...pickBest(Position.SNT, 2));

    while (starters.length < 11 && pool.length > 0) {
        starters.push(pool.shift()!);
    }

    const keyReserves: Player[] = [];
    for (let i = 0; i < 7; i++) {
        if (pool.length > 0) keyReserves.push(pool.shift()!);
    }

    const rotation = [...pool];

    let totalContribution = 0;
    let totalWeight = 0;

    const addToCalc = (p: Player, roleCoef: number) => {
        const pok = getPokForPosition(p.position);
        const weight = pok * roleCoef;
        const effectiveSkill = calculateEffectiveSkill(p);
        const contribution = effectiveSkill * weight;
        
        totalContribution += contribution;
        totalWeight += weight;
    };

    starters.forEach(p => addToCalc(p, KRK.STARTER));
    keyReserves.forEach(p => addToCalc(p, KRK.RESERVE));
    rotation.forEach(p => addToCalc(p, KRK.ROTATION));

    if (totalWeight === 0) return 0;
    const thg = totalContribution / totalWeight;
    return Math.round(thg * 10) / 10;
};

export const calculateTransferStrengthImpact = (currentVisibleStrength: number, playerSkill: number, isBuying: boolean): number => {
    const referenceStrength = currentVisibleStrength - 4;

    if (isBuying) {
        if (playerSkill > referenceStrength) {
            const diff = playerSkill - referenceStrength;
            return 0.3 + (diff * 0.05);
        } else {
            return 0;
        }
    } else {
        if (playerSkill < referenceStrength) {
            return -0.1;
        } else {
            const diff = playerSkill - referenceStrength;
            return -(0.4 + (diff * 0.1));
        }
    }
};

export const recalculateTeamStrength = (team: Team): Team => {
    const newRawStrength = calculateRawTeamStrength(team.players);
    const delta = team.strengthDelta !== undefined ? team.strengthDelta : 0;
    const potentialVisible = newRawStrength + delta;
    const currentVisible = team.strength;
    let finalVisible = currentVisible;
    
    if (potentialVisible > currentVisible) {
        finalVisible = Math.min(potentialVisible, currentVisible + 0.5);
    } else if (potentialVisible < currentVisible) {
         finalVisible = Math.max(potentialVisible, currentVisible - 0.5);
    }
    
    return {
        ...team,
        rawStrength: newRawStrength,
        strength: Math.round(finalVisible * 10) / 10
    };
};

export const calculateTeamStrength = (team: Team): number => {
    return calculateRawTeamStrength(team.players);
};

export const calculatePlayerWage = (player: Player): number => {
    let status = player.squadStatus;
    if (!status) {
        if (player.skill >= 85) status = 'STAR';
        else if (player.skill >= 80) status = 'IMPORTANT';
        else if (player.skill >= 75) status = 'FIRST_XI';
        else if (player.skill >= 70) status = 'ROTATION';
        else status = 'JOKER';
    }

    let wage = player.value * 0.20;
    let skillFloor = 0;
    if (player.skill >= 90) skillFloor = 12.0;
    else if (player.skill >= 85) skillFloor = 8.0;
    else if (player.skill >= 80) skillFloor = 4.0;
    else if (player.skill >= 75) skillFloor = 1.5;
    
    wage = Math.max(wage, skillFloor);
    const statusMultipliers: Record<string, number> = {
        'STAR': 1.6,
        'IMPORTANT': 1.3,
        'FIRST_XI': 1.0,
        'ROTATION': 0.7,
        'IMPACT': 0.6,
        'JOKER': 0.5,
        'SURPLUS': 0.3
    };
    wage *= (statusMultipliers[status] || 1.0);

    if (player.age <= 21) {
        wage *= 0.6; 
    } else if (player.age >= 33) {
        if (player.skill >= 80) {
            wage *= 1.3; 
        } else {
            wage *= 0.9;
        }
    }

    if (player.nationality === 'Türkiye') {
        wage *= 0.7;
    }

    wage = Math.max(0.05, wage);
    return Number(wage.toFixed(2));
};

export const calculateForm = (teamId: string, fixtures: Fixture[], competitionFilter?: string): string[] => {
    if (!fixtures || fixtures.length === 0) return [];

    // 1. Determine the "Current Season" based on the latest fixture date in the entire list (played or scheduled).
    // This allows us to reset the form when a new season's fixtures are generated.
    const lastFixture = fixtures[fixtures.length - 1];
    if (!lastFixture) return [];
    
    const latestDate = new Date(lastFixture.date);
    const refMonth = latestDate.getMonth();
    const refYear = latestDate.getFullYear();
    
    // Season starts in July (Month 6). 
    // If we are in or after July, the season year is the current year.
    // If we are before July (Jan-June), the season year is previous year.
    const globalSeasonStartYear = refMonth >= 6 ? refYear : refYear - 1;

    // 2. Filter matches for this team, this competition, AND this season
    const playedMatches = fixtures
        .filter(f => {
            if (!f.played) return false;
            if (f.homeTeamId !== teamId && f.awayTeamId !== teamId) return false;
            
            // Season Check
            const d = new Date(f.date);
            const m = d.getMonth();
            const y = d.getFullYear();
            const fSeasonStart = m >= 6 ? y : y - 1;
            
            if (fSeasonStart !== globalSeasonStartYear) return false;

            // Competition Check
            if (competitionFilter) {
                if (competitionFilter === 'LEAGUE') {
                    return f.competitionId === 'LEAGUE' || !f.competitionId;
                }
                return f.competitionId === competitionFilter;
            }
            
            return true;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    return playedMatches.map(f => {
        const isHome = f.homeTeamId === teamId;
        const myScore = isHome ? f.homeScore! : f.awayScore!;
        const oppScore = isHome ? f.awayScore! : f.homeScore!;

        if (myScore > oppScore) return 'W';
        if (myScore < oppScore) return 'L';

        if (f.pkHome !== undefined && f.pkAway !== undefined) {
            const myPk = isHome ? f.pkHome : f.pkAway;
            const oppPk = isHome ? f.pkAway : f.pkHome;
            return myPk > oppPk ? 'W' : 'L';
        }

        return 'D';
    }).reverse();
};

export const calculateOdds = (home: Team, away: Team): BettingOdds => {
    const hStr = calculateRawTeamStrength(home.players) + 5; 
    const aStr = calculateRawTeamStrength(away.players);
    
    if (hStr + aStr === 0) return { home: 1, draw: 1, away: 1 };

    const total = hStr + aStr;
    const strengthRatio = Math.min(hStr, aStr) / Math.max(hStr, aStr); 
    const dProb = 0.15 + (0.15 * strengthRatio);
    const remainingProb = 1 - dProb;
    const hProb = (hStr / total) * remainingProb;
    const aProb = (aStr / total) * remainingProb;

    const margin = 1.12;
    const fmt = (p: number) => {
        const val = margin / p;
        return Number(Math.max(1.01, val).toFixed(2));
    };

    return { home: fmt(hProb), draw: fmt(dProb), away: fmt(aProb) };
};

export const calculateManagerPower = (stats: ManagerStats): number => {
    let power = 50; 
    const leagueBase = 3;
    const leagueMultipliers = [1.50, 1.20, 1.00, 0.80, 0.60, 0.45, 0.35, 0.25];
    for (let i = 0; i < stats.leagueTitles; i++) {
        const mult = i < 7 ? leagueMultipliers[i] : 0.25;
        power += (leagueBase * mult);
    }
    const cupBase = 1;
    const cupMultipliers = [1.50, 1.20, 1.00, 0.80, 0.60, 0.45, 0.35, 0.25];
    for (let i = 0; i < stats.domesticCups; i++) {
        const mult = i < 7 ? cupMultipliers[i] : 0.25;
        power += (cupBase * mult);
    }
    const euroValues = [9, 3, 2, 1]; 
    for (let i = 0; i < stats.europeanCups; i++) {
        if (i < 3) power += euroValues[i];
        else power += 1;
    }
    return Math.round(power);
};

export const calculateManagerSalary = (strength: number): number => {
    if (strength >= 90) return 2.5;
    if (strength >= 88) return 2.25;
    if (strength >= 86) return 2.0;
    if (strength >= 84) return 1.8;
    if (strength >= 82) return 1.5;
    if (strength >= 80) return 1.25;
    if (strength >= 78) return 1.0;
    if (strength >= 76) return 0.75;
    if (strength >= 75) return 0.6;
    if (strength >= 73) return 0.46;
    if (strength >= 72) return 0.39;
    if (strength >= 71) return 0.32;
    if (strength >= 70) return 0.25;
    if (strength >= 68) return 0.20;
    if (strength >= 60) return 0.15; 
    return 0.10; 
};

export const applySeasonEndReputationUpdates = (teams: Team[]): Team[] => {
    const standings = [...teams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });

    return teams.map(team => {
        const rank = standings.findIndex(t => t.id === team.id) + 1;
        const isRelegated = rank >= 16; 
        const strength = team.strength;
        let repChange = 0;

        if (strength > 80) {
            if (rank > 10) repChange -= 0.1;
            if (isRelegated) repChange -= 1.0;
        }
        if (strength > 75) {
            if (rank > 15) repChange -= 0.1;
        }
        if (strength < 80 && isRelegated) {
            repChange -= 0.3;
        }
        if (strength >= 74 && strength <= 80 && rank <= 3) {
            repChange += 0.1;
        }
        if (strength >= 70 && strength < 74 && rank <= 5) {
            repChange += 0.1;
        }
        if (strength >= 60 && strength < 70 && rank <= 5) {
            repChange += 0.1;
        }

        const newRep = Number((team.reputation + repChange).toFixed(1));
        const finalRep = Math.min(5.0, Math.max(0.1, newRep));

        return { ...team, reputation: finalRep };
    });
};

export const calculateTeamReputation = (team: Team): number => {
    return team.reputation || 1;
};

export const calculateMonthlyNetFlow = (team: Team, fixtures: Fixture[], currentDate: string, manager?: ManagerProfile, excludeTransfers: boolean = false): number => {
    const dateObj = new Date(currentDate);
    const currentMonth = dateObj.getMonth();
    const currentYear = dateObj.getFullYear();
    const dayOfMonth = dateObj.getDate();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const strengthFactor = team.strength / 100;
    const fanFactor = team.fanBase / 1000000;

    const annualSponsorIncome = 
        (team.sponsors.main.yearlyValue) + 
        (team.sponsors.stadium.yearlyValue) + 
        (team.sponsors.sleeve.yearlyValue);

    const totalMonthlySponsorValue = annualSponsorIncome / 12;
    const inc_Sponsor = (totalMonthlySponsorValue / daysInCurrentMonth) * dayOfMonth;

    const merchSeed = team.id.charCodeAt(0) + currentMonth + currentYear;
    const merchFluctuation = 0.8 + ((merchSeed % 40) / 100);
    const starPlayerBonus = team.players.filter(p => p.skill >= 86).length * 0.2;
    const inc_Merch = ((fanFactor * 0.8) / 12) * merchFluctuation * (team.strength > 80 ? 1.2 : 1.0) + starPlayerBonus;
    const inc_Trade = inc_Merch * 0.2;

    const playedThisMonth = fixtures.filter(f => 
        f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id) &&
        new Date(f.date).getMonth() === currentMonth
    );
    const inc_TV = playedThisMonth.length * (0.20 + (strengthFactor * 0.10));

    const homePlayedThisMonth = fixtures.filter(f => 
        f.homeTeamId === team.id && f.played &&
        new Date(f.date).getMonth() === currentMonth
    );
    const inc_Gate = homePlayedThisMonth.length * (fanFactor * 0.01944444);
    const inc_Loca = inc_Gate * 0.45;

    const inc_Transfers = (!excludeTransfers && manager && manager.contract.teamName === team.name) 
        ? (manager.stats.transferIncomeThisMonth || 0) 
        : 0;

    const totalIncome = inc_Sponsor + inc_Merch + inc_Trade + inc_TV + inc_Gate + inc_Loca + inc_Transfers;

    const totalAnnualWages = team.players.reduce((acc, p) => {
        return acc + (p.wage !== undefined ? p.wage : calculatePlayerWage(p));
    }, 0);
    
    const monthlyWages = totalAnnualWages / 12;
    const exp_Staff = monthlyWages * 0.15;
    const exp_Stadium = (team.stadiumCapacity / 100000) * 0.5;
    const exp_Academy = strengthFactor * 0.4;
    
    const exp_Debt = (team.initialDebt || 0) / 60;
    const exp_Transfers = (!excludeTransfers && manager && manager.contract.teamName === team.name) 
        ? (manager.stats.transferSpendThisMonth || 0) 
        : 0;

    const totalExpense = monthlyWages + exp_Staff + exp_Stadium + exp_Academy + exp_Debt + exp_Transfers + 0.35; 

    return totalIncome - totalExpense;
};

export const calculateTransferRevenueRetention = (team: Team, monthlyNet: number, objectivesMet: boolean): number => {
    const reputation = team.reputation || 1.0;
    const debt = team.initialDebt || 0;

    let threshold = 3; 
    if (reputation >= 4.5) threshold = 800;
    else if (reputation >= 4.0) threshold = 500;
    else if (reputation >= 3.5) threshold = 100;
    else if (reputation >= 3.0) threshold = 20; 
    else if (reputation >= 2.0) threshold = 5;  
    else threshold = 3; 

    let basePct = 100;
    if (debt > threshold) {
        const ratio = threshold / debt;
        basePct = 10 + (39 * ratio);
    } else {
        const ratio = debt / threshold;
        basePct = 100 - (30 * ratio);
    }

    if (objectivesMet) {
        basePct += 5;
    }

    let penalty = 0;
    if (monthlyNet > 10) {
        penalty = 0;
    } else if (monthlyNet > 0) {
        penalty = 5;
    } else if (monthlyNet >= -5) {
        penalty = 10;
    } else {
        penalty = 20;
    }

    let finalPct = basePct - penalty;
    return Math.floor(Math.max(5, Math.min(100, finalPct)));
};
