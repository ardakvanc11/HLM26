

import { Team, Fixture, Player } from '../types';
import { generateId, GAME_CALENDAR } from '../constants';

const MONTH_NAMES = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// --- COEFFICIENT DATA FOR SEEDING ---
const HISTORIC_COEFFS_21_22: Record<string, number> = { "Aslanspor SK": 17.5, "Gorilla United": 12.5, "Gorilla City": 8.0, "Eşşekboğanspor FK": 10.5, "El-Katir": 6.5, "Yılanspor FK": 6.5, "Kartalcelona": 6.5, "Kaplanspor SK": 4.0, "Köpekspor": 2.0, "Kedispor": 2.5, "Arıspor": 1.5, "Shefield Karakoçan": 2.5, "Ejderspor": 1.0, "Gergedanspor FK": 1.5, "Zirafaspor": 1.0, "Kediboğanspor": 1.0, "Boğaboğanspor": 1.5, "Çitaboğanspor": 2.0, "Pirhanakundakçısıspor": 1.5, "Keçiboğanspor": 1.5 };
const HISTORIC_COEFFS_22_23: Record<string, number> = { "Aslanspor SK": 17.5, "Gorilla City": 12.5, "Gorilla United": 8.0, "Kaplanspor SK": 8.0, "Götten Tothennam": 6.5, "Ejderspor": 6.5, "Kartalcelona": 6.5, "Eşşekboğanspor FK": 6.5, "Shefield Karakoçan": 4.5, "El-Katir": 4.0, "Yılanspor FK": 3.5, "Ayıboğanspor SK": 3.0, "Kedispor": 2.5, "Arıspor": 2.0, "Köpekspor": 1.5, "Gergedanspor FK": 1.5, "Tezkeresport": 1.0, "Zirafaspor": 1.0, "Boğaboğanspor": 1.0, "Çitaboğanspor": 1.0 };
const HISTORIC_COEFFS_23_24: Record<string, number> = { "Gorilla United": 17.5, "Kartalcelona": 15.0, "Aslanspor SK": 8.0, "Gorilla City": 8.0, "Arıspor": 6.5, "Yılanspor FK": 6.5, "El-Katir": 6.5, "Kaplanspor SK": 4.0, "Eşşekboğanspor FK": 4.5, "Ayıboğanspor SK": 4.0, "Kedispor": 3.5, "Götten Tothennam": 4.5, "Ejderspor": 3.5, "Shefield Karakoçan": 3.0 };
const HISTORIC_COEFFS_24_25: Record<string, number> = { "Gorilla United": 17.5, "Gorilla City": 12.5, "El-Katir": 10.5, "Kartalcelona": 8.0, "Arıspor": 6.5, "Yılanspor FK": 6.5, "Götten Tothennam": 6.5, "Aslanspor SK": 4.0 };

export const getFormattedDate = (dateStr: string): { label: string, dateObj: Date } => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    
    return {
        dateObj: date,
        label: `${day} ${MONTH_NAMES[monthIndex]} ${year}`
    };
};

export const addDays = (dateStr: string, days: number): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString();
};

export const isTransferWindowOpen = (dateStr: string): boolean => {
    const current = new Date(dateStr);
    const year = current.getFullYear();
    const month = current.getMonth();
    const day = current.getDate();

    if ((month === 6) || (month === 7) || (month === 8 && day <= 1)) {
        return true;
    }
    
    if ((month === 0) || (month === 1 && day <= 1)) {
        return true;
    }

    return false;
};

export const isSameDay = (d1Str: string, d2Str: string): boolean => {
    const d1 = new Date(d1Str);
    const d2 = new Date(d2Str);
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate();
};

const WEEK_DEFINITIONS = [
    { week: 1, month: 7, day: 8 },   
    { week: 2, month: 7, day: 15 },  
    { week: 3, month: 7, day: 22 },  
    { week: 4, month: 7, day: 29 },  
    { week: 5, month: 8, day: 5 },   
    { week: 6, month: 8, day: 12 },  
    { week: 7, month: 8, day: 19 },  
    { week: 8, month: 9, day: 6 },   
    { week: 9, month: 9, day: 13 },  
    { week: 10, month: 9, day: 27 }, 
    { week: 11, month: 10, day: 2 }, 
    { week: 12, month: 10, day: 9 }, 
    { week: 13, month: 10, day: 16 },
    { week: 14, month: 11, day: 1 }, 
    { week: 15, month: 11, day: 7 }, 
    { week: 16, month: 11, day: 15 },
    { week: 17, month: 11, day: 22 },
    
    { week: 18, month: 1, day: 2 },  
    { week: 19, month: 1, day: 9 },  
    { week: 20, month: 1, day: 16 }, 
    { week: 21, month: 1, day: 23 }, 
    { week: 22, month: 2, day: 2 },  
    { week: 23, month: 2, day: 9 },  
    { week: 24, month: 2, day: 16 }, 
    { week: 25, month: 2, day: 23 }, 
    { week: 26, month: 3, day: 6 },  
    { week: 27, month: 3, day: 13 }, 
    { week: 28, month: 3, day: 20 }, 
    { week: 29, month: 3, day: 27 }, 
    { week: 30, month: 4, day: 4 },  
    { week: 31, month: 4, day: 11 }, 
    { week: 32, month: 4, day: 18 }, 
    { week: 33, month: 4, day: 25 }, 
    { week: 34, month: 5, day: 1 },  
];

const getSpecificSeasonDates = (startYear: number): Date[] => {
    return WEEK_DEFINITIONS.map(def => {
        const year = def.month < 6 ? startYear + 1 : startYear;
        return new Date(year, def.month, def.day);
    });
};

export const generateFixtures = (teams: Team[], year: number = 2025, competitionId: string = 'LEAGUE'): Fixture[] => {
    const fixtures: Fixture[] = [];
    const teamIds = teams.map(t => t.id);
    const numTeams = teamIds.length;
    const numMatchesPerTeam = (numTeams - 1) * 2; 
    const matchesPerRound = numTeams / 2;

    const rotation = [...teamIds]; 
    const fixed = rotation.shift()!;
    
    const seasonDates = getSpecificSeasonDates(year);
    
    for (let round = 0; round < numMatchesPerTeam; round++) {
        let baseDate = new Date();
        if (round < seasonDates.length) {
            baseDate = new Date(seasonDates[round]);
        } else {
            baseDate = new Date(seasonDates[seasonDates.length - 1]);
            baseDate.setDate(baseDate.getDate() + 7);
        }

        const roundFixtures: Fixture[] = [];
        
        const p1 = fixed;
        const p2 = rotation[rotation.length - 1];
        
        if (round % 2 === 0) roundFixtures.push(createFixture(round + 1, '', p1, p2));
        else roundFixtures.push(createFixture(round + 1, '', p2, p1));

        for (let i = 0; i < (rotation.length - 1) / 2; i++) {
            const t1 = rotation[i];
            const t2 = rotation[rotation.length - 2 - i];
            if (round % 2 === 0) roundFixtures.push(createFixture(round + 1, '', t1, t2));
            else roundFixtures.push(createFixture(round + 1, '', t2, t1));
        }

        const splitIndex = Math.ceil(matchesPerRound / 2);
        
        roundFixtures.forEach((fix, index) => {
            const matchDate = new Date(baseDate);
            if (index >= splitIndex) {
                matchDate.setDate(matchDate.getDate() + 1);
            }
            fix.date = matchDate.toISOString();
            fix.competitionId = competitionId;
        });

        fixtures.push(...roundFixtures);
        rotation.unshift(rotation.pop()!);
    }
    
    return fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// --- DETERMINISTIC BACKTRACKING SCHEDULER FOR EUROPEAN LEAGUE ---
const solveEuroSchedule = (allMatches: {t1: string, t2: string}[], teamIds: string[], totalWeeks: number): number[] | null => {
    // Maps each match index to a week index (0-7). Initialized to -1.
    const matchWeeks = new Array(allMatches.length).fill(-1);
    
    // Create an adjacency list: TeamID -> Array of Match Indices involving that team
    // This allows fast lookup of which matches a team participates in.
    const teamMatchIndices: Record<string, number[]> = {};
    teamIds.forEach(id => teamMatchIndices[id] = []);
    allMatches.forEach((m, idx) => {
        teamMatchIndices[m.t1].push(idx);
        teamMatchIndices[m.t2].push(idx);
    });

    // Track which matches have been assigned globally to avoid reuse
    const usedMatchIndices = new Set<number>();

    // We solve one week at a time.
    for (let week = 0; week < totalWeeks; week++) {
        
        // --- Single Week Solver (Backtracking) ---
        // We need to pick 18 matches such that every team plays exactly once.
        const currentWeekMatches: number[] = [];
        const teamsPlayedThisWeek = new Set<string>();

        const solveWeek = (): boolean => {
            // Base Case: If all teams have played, this week is complete.
            if (teamsPlayedThisWeek.size === teamIds.length) {
                return true;
            }

            // --- MRV HEURISTIC (Minimum Remaining Values) ---
            // Pick the team that has the FEWEST valid opponents remaining in the pool.
            
            let bestTeam: string | null = null;
            let minMoves = 9999;
            
            // Filter only teams that haven't played this week yet
            const candidates = teamIds.filter(t => !teamsPlayedThisWeek.has(t));

            // Find the most constrained team
            for (const t of candidates) {
                // Count valid moves for team t
                let validCount = 0;
                const potentialMatches = teamMatchIndices[t];
                
                for (const mIdx of potentialMatches) {
                    if (usedMatchIndices.has(mIdx)) continue; // Match already used in previous weeks
                    
                    const m = allMatches[mIdx];
                    const opponent = m.t1 === t ? m.t2 : m.t1;
                    
                    if (teamsPlayedThisWeek.has(opponent)) continue; // Opponent already playing this week
                    
                    validCount++;
                }

                if (validCount < minMoves) {
                    minMoves = validCount;
                    bestTeam = t;
                    // Optimization: If 0 moves, this branch is dead immediately
                    if (minMoves === 0) return false;
                }
            }

            if (!bestTeam) return false; // Should not happen given logic, but safety

            // Try all valid matches for the chosen 'bestTeam'
            // UPDATED: Random sort to prevent deterministic deadlocks
            const availableMatchesForTeam = teamMatchIndices[bestTeam]
                .filter(mIdx => {
                    if (usedMatchIndices.has(mIdx)) return false;
                    const m = allMatches[mIdx];
                    const opponent = m.t1 === bestTeam ? m.t2 : m.t1;
                    return !teamsPlayedThisWeek.has(opponent);
                })
                .sort(() => 0.5 - Math.random()); // RANDOMIZE to ensure finding a solution

            for (const mIdx of availableMatchesForTeam) {
                const m = allMatches[mIdx];
                const opponent = m.t1 === bestTeam ? m.t2 : m.t1;

                // DO MOVE
                currentWeekMatches.push(mIdx);
                usedMatchIndices.add(mIdx);
                teamsPlayedThisWeek.add(bestTeam);
                teamsPlayedThisWeek.add(opponent);

                // RECURSE
                if (solveWeek()) return true;

                // BACKTRACK
                currentWeekMatches.pop();
                usedMatchIndices.delete(mIdx);
                teamsPlayedThisWeek.delete(bestTeam);
                teamsPlayedThisWeek.delete(opponent);
            }

            return false;
        };

        if (!solveWeek()) {
            // If solving failed for this week, the whole schedule is likely bad due to previous choices.
            // We return null to trigger a full retry in the parent function.
            return null; 
        }

        // Apply this week's solution to the main results array
        currentWeekMatches.forEach(mIdx => {
            matchWeeks[mIdx] = week;
        });
    }

    return matchWeeks;
};

// --- NEW EUROPEAN FORMAT GENERATION (SWISS MODEL WITH POTS) ---
export const generateEuropeanLeagueFixtures = (teams: Team[], year: number): Fixture[] => {
    // 1. Calculate Coefficients for Sorting
    const rankedTeams = teams.map(t => {
        const seed = t.id.charCodeAt(0) + (t.reputation * 100);
        let s1 = 0; if (HISTORIC_COEFFS_21_22[t.name] !== undefined) s1 = HISTORIC_COEFFS_21_22[t.name]; else s1 = Math.max(0, (t.reputation * 0.5) + (Math.sin(seed) * 0.5));
        let s2 = 0; if (HISTORIC_COEFFS_22_23[t.name] !== undefined) s2 = HISTORIC_COEFFS_22_23[t.name]; else s2 = Math.max(0, (t.reputation * 0.2) + (Math.cos(seed) * 0.5));
        let s3 = 0; if (HISTORIC_COEFFS_23_24[t.name] !== undefined) s3 = HISTORIC_COEFFS_23_24[t.name]; else { const r = (Math.sin(seed + 50) + 1) * 0.75; const rs = (t.reputation * 0.65) + r; s3 = Math.min(4.9, Math.max(0.1, rs)); }
        let s4 = 0; if (HISTORIC_COEFFS_24_25[t.name] !== undefined) s4 = HISTORIC_COEFFS_24_25[t.name]; else { const r = (Math.cos(seed + 100) + 1) * 0.5; const rs = (t.reputation * 0.8) + r; s4 = Math.min(4.9, Math.max(0.1, rs)); }
        // Season start: S5 is 0
        const total = s1 + s2 + s3 + s4;
        return { ...t, coefficient: total };
    }).sort((a, b) => b.coefficient - a.coefficient);

    // 2. Assign Pots (9 Teams per Pot)
    // If less than 36 teams, we slice proportionally or handle edge case
    const totalTeams = rankedTeams.length;
    // Ensure mult of 4
    if (totalTeams % 4 !== 0) {
        console.warn("European teams not divisible by 4. Scheduling might be unbalanced.");
    }
    const potSize = Math.ceil(totalTeams / 4);

    const pot1 = rankedTeams.slice(0, potSize);
    const pot2 = rankedTeams.slice(potSize, potSize * 2);
    const pot3 = rankedTeams.slice(potSize * 2, potSize * 3);
    const pot4 = rankedTeams.slice(potSize * 3);
    
    const pots = [pot1, pot2, pot3, pot4];
    const fixtures: Fixture[] = [];
    const allMatches: { t1: string, t2: string }[] = [];

    // 3. Pairing Logic
    // Explicitly NO country check to ensure validity.
    
    const addMatch = (teamA: Team, teamB: Team) => {
        allMatches.push({ t1: teamA.id, t2: teamB.id });
    };

    // A. Intra-Pot Matches
    pots.forEach(pot => {
        const n = pot.length;
        for (let i = 0; i < n; i++) {
            const team = pot[i];
            const opponent1 = pot[(i + 1) % n]; 
            addMatch(team, opponent1);
        }
    });

    // B. Inter-Pot Matches
    const potPairs = [
        [0, 1], [0, 2], [0, 3], // P1 vs P2, P3, P4
        [1, 2], [1, 3],         // P2 vs P3, P4
        [2, 3]                  // P3 vs P4
    ];

    potPairs.forEach(([idxA, idxB]) => {
        const pA = pots[idxA];
        const pB = pots[idxB];
        const n = Math.min(pA.length, pB.length); // Safety

        for (let i = 0; i < n; i++) {
            addMatch(pA[i], pB[i]);
            addMatch(pA[i], pB[(i + 1) % n]);
        }
    });

    // 4. Deterministic Schedule Solving with Retries
    const teamIds = rankedTeams.map(t => t.id);
    let scheduleIndices: number[] | null = null;
    
    // Retry up to 50 times (It usually solves in < 5 tries with randomization)
    for(let attempt = 0; attempt < 50; attempt++) {
        scheduleIndices = solveEuroSchedule(allMatches, teamIds, 8);
        if (scheduleIndices) break;
    }

    // Fallback if super unlucky (Should not happen with valid graph)
    if (!scheduleIndices) {
        console.warn("European Schedule generation failed after retries. Using fallback sequential distribution.");
        // Fallback: Just distribute sequentially. This might cause a team to play twice in a week visually, but prevents crash.
        scheduleIndices = allMatches.map((_, i) => Math.floor(i / (allMatches.length / 8)));
    }

    // 5. Construct Fixtures
    const matchDates = [
        new Date(year, 8, 24), // Sep 24
        new Date(year, 9, 1),  // Oct 1
        new Date(year, 9, 22), // Oct 22
        new Date(year, 10, 5), // Nov 5
        new Date(year, 10, 26),// Nov 26
        new Date(year, 11, 10),// Dec 10
        new Date(year + 1, 0, 21), // Jan 21
        new Date(year + 1, 0, 28)  // Jan 28
    ];

    const homeCounts = new Map<string, number>();
    rankedTeams.forEach(t => homeCounts.set(t.id, 0));

    allMatches.forEach((m, idx) => {
        // @ts-ignore - scheduleIndices is checked above or fallback used
        const weekIdx = scheduleIndices[idx];
        
        let t1 = m.t1;
        let t2 = m.t2;

        const h1 = homeCounts.get(t1) || 0;
        const h2 = homeCounts.get(t2) || 0;
        
        let finalHome = t1;
        let finalAway = t2;

        if (h1 > h2) { finalHome = t2; finalAway = t1; } 
        else if (h2 > h1) { finalHome = t1; finalAway = t2; } 
        else {
            if (t1.localeCompare(t2) > 0) { finalHome = t2; finalAway = t1; }
        }
        
        if (homeCounts.get(finalHome)! >= 4 && homeCounts.get(finalAway)! < 4) {
             const temp = finalHome; finalHome = finalAway; finalAway = temp;
        }

        homeCounts.set(finalHome, (homeCounts.get(finalHome) || 0) + 1);

        const roundBaseDate = matchDates[Math.min(weekIdx, 7)];
        const d = new Date(roundBaseDate);
        
        // MODIFICATION: Only split matches to next day if it is NOT the final week (index 7)
        // Week Index 7 corresponds to Jan 28. If weekIdx is 7, we skip this block, keeping date as Jan 28.
        if (idx % 2 === 0 && weekIdx !== 7) {
            d.setDate(d.getDate() + 1);
        }

        fixtures.push({
            id: generateId(),
            week: 201 + weekIdx,
            date: d.toISOString(),
            homeTeamId: finalHome,
            awayTeamId: finalAway,
            played: false,
            homeScore: null,
            awayScore: null,
            competitionId: 'EUROPE'
        });
    });

    return fixtures;
};

export const generateSuperCupFixtures = (teams: Team[], year: number, isInitialSeason: boolean = false): Fixture[] => {
    const fixtures: Fixture[] = [];
    
    let t1: Team | undefined, t2: Team | undefined, t3: Team | undefined, t4: Team | undefined;

    if (isInitialSeason) {
        t1 = teams.find(t => t.name === 'Arıspor');
        t2 = teams.find(t => t.name === 'Eşşekboğanspor FK');
        t3 = teams.find(t => t.name === 'Köpekspor');
        t4 = teams.find(t => t.name === 'Kedispor');
    } else {
        if (teams.length >= 4) {
            t1 = teams[0];
            t2 = teams[1];
            t3 = teams[2];
            t4 = teams[3];
        }
    }

    if (t1 && t2 && t3 && t4) {
        const d1 = new Date(year + 1, 0, 5);
        fixtures.push({
            id: generateId(),
            week: 90, 
            date: d1.toISOString(),
            homeTeamId: t1.id,
            awayTeamId: t3.id,
            played: false,
            homeScore: null,
            awayScore: null,
            competitionId: 'SUPER_CUP'
        });

        const d2 = new Date(year + 1, 0, 6);
        fixtures.push({
            id: generateId(),
            week: 90,
            date: d2.toISOString(),
            homeTeamId: t2.id,
            awayTeamId: t4.id,
            played: false,
            homeScore: null,
            awayScore: null,
            competitionId: 'SUPER_CUP'
        });
    }

    return fixtures;
};

export const generateCupRoundFixtures = (teams: Team[], fixtures: Fixture[], round: 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL', year: number): Fixture[] => {
    const newFixtures: Fixture[] = [];
    let pool: Team[] = [];

    const CUP_WEEKS = { 'R32': 100, 'R16': 101, 'QF': 102, 'SF': 103, 'FINAL': 104 };
    const cupWeek = CUP_WEEKS[round];

    if (round === 'R32') {
        pool = teams.filter(t => 
            !t.cupBan && 
            (t.leagueId === 'LEAGUE' || t.leagueId === 'LEAGUE_1' || !t.leagueId)
        );
    } else {
        const prevWeek = round === 'R16' ? 100 : round === 'QF' ? 101 : round === 'SF' ? 102 : 103;
        
        // --- FIX IMPLEMENTED HERE ---
        // Ensure we only select winners from the CURRENT SEASON'S previous round.
        // The year parameter is the start year of the current season (e.g., 2025).
        const prevFixtures = fixtures.filter(f => {
            if (f.competitionId !== 'CUP' || f.week !== prevWeek || !f.played) return false;
            
            const d = new Date(f.date);
            const fYear = d.getFullYear();
            const fMonth = d.getMonth();
            
            // Season starts in July (Month 6). 
            // If month >= 6 (July-Dec), it belongs to year X.
            // If month < 6 (Jan-June), it belongs to year X-1.
            // Example: Match in Dec 2025 -> Season 2025
            // Example: Match in Jan 2026 -> Season 2025
            
            const fSeasonStartYear = fMonth >= 6 ? fYear : fYear - 1;
            
            return fSeasonStartYear === year;
        });
        
        const winners: Team[] = [];
        prevFixtures.forEach(f => {
            let winnerId = f.homeTeamId;
            if (f.homeScore! > f.awayScore!) winnerId = f.homeTeamId;
            else if (f.awayScore! > f.homeScore!) winnerId = f.awayTeamId;
            else if ((f.pkHome || 0) > (f.pkAway || 0)) winnerId = f.homeTeamId;
            else winnerId = f.awayTeamId;

            const winner = teams.find(t => t.id === winnerId);
            if (winner) winners.push(winner);
        });
        pool = winners;
    }

    pool = pool.sort(() => 0.5 - Math.random());

    for (let i = 0; i < pool.length; i += 2) {
        if (i + 1 < pool.length) {
            const home = pool[i];
            const away = pool[i + 1];

            let matchDate = new Date();
            const seasonStartYear = year; 
            const nextYear = seasonStartYear + 1;

            if (round === 'R32') matchDate = new Date(seasonStartYear, 11, i % 4 === 0 ? 28 : 29);
            else if (round === 'R16') matchDate = new Date(nextYear, 0, i % 4 === 0 ? 14 : 15);
            else if (round === 'QF') matchDate = new Date(nextYear, 2, i % 4 === 0 ? 27 : 28);
            else if (round === 'SF') matchDate = new Date(nextYear, 4, i === 0 ? 1 : 2);
            else if (round === 'FINAL') matchDate = new Date(nextYear, 4, 14);

            newFixtures.push({
                id: generateId(),
                week: cupWeek,
                date: matchDate.toISOString(),
                homeTeamId: home.id,
                awayTeamId: away.id,
                played: false,
                homeScore: null,
                awayScore: null,
                competitionId: 'CUP'
            });
        }
    }

    return newFixtures;
};

export const generateEuropeanKnockoutFixtures = (teams: Team[], fixtures: Fixture[], round: 'PLAYOFF' | 'R16' | 'QF' | 'SF' | 'FINAL', year: number, leagueTable?: Team[]): Fixture[] => {
    const newFixtures: Fixture[] = [];
    const nextYear = year + 1;
    
    let pairedTeams: {t1: Team, t2: Team}[] = [];

    if (round === 'PLAYOFF') {
        if (!leagueTable) return [];
        const playoffTeams = leagueTable.slice(8, 24); 
        for (let i = 0; i < 8; i++) {
            const highSeed = playoffTeams[i];
            const lowSeed = playoffTeams[15 - i];
            // Leg 1: Low vs High
            pairedTeams.push({ t1: lowSeed, t2: highSeed });
        }
    } else if (round === 'R16') {
        const targetYear = nextYear; // Matches are played in Feb of nextYear

        const poMatches = fixtures.filter(f => 
            f.competitionId === 'EUROPE' && 
            f.week === 210 && 
            f.played &&
            new Date(f.date).getFullYear() === targetYear // SEASON AWARE CHECK
        );
        const poWinners: Team[] = [];
        
        poMatches.forEach(leg2 => {
            // Find Leg 1 (Week 209). In Leg 1: Leg2.Home was Away.
            const leg1 = fixtures.find(f => 
                f.competitionId === 'EUROPE' && 
                f.week === 209 && 
                f.homeTeamId === leg2.awayTeamId && 
                f.awayTeamId === leg2.homeTeamId &&
                new Date(f.date).getFullYear() === targetYear // SEASON AWARE CHECK
            );
            
            if (leg1 && leg1.played) {
                // Team Home in Leg 2 (e.g. High Seed)
                const teamA_ID = leg2.homeTeamId;
                // Team Away in Leg 2 (e.g. Low Seed)
                const teamB_ID = leg2.awayTeamId;
                
                // Leg 1: Team B (Home) vs Team A (Away)
                // Leg 2: Team A (Home) vs Team B (Away)
                
                // Total Goals for A = A_Leg2_Score + A_Leg1_Score (Away)
                // Note: leg1.awayScore is score of Team A.
                const goalsA = (leg2.homeScore || 0) + (leg1.awayScore || 0);
                
                // Total Goals for B = B_Leg2_Score (Away) + B_Leg1_Score (Home)
                const goalsB = (leg2.awayScore || 0) + (leg1.homeScore || 0);
                
                let winnerId = teamA_ID;
                if (goalsB > goalsA) winnerId = teamB_ID;
                else if (goalsA === goalsB) {
                     if (leg2.pkHome !== undefined && leg2.pkAway !== undefined) {
                        if (leg2.pkAway! > leg2.pkHome!) winnerId = teamB_ID;
                        else winnerId = teamA_ID;
                     } else {
                         winnerId = Math.random() > 0.5 ? teamA_ID : teamB_ID;
                     }
                }
                const w = teams.find(t => t.id === winnerId);
                if (w) poWinners.push(w);
            }
        });

        if (leagueTable) {
            const top8 = leagueTable.slice(0, 8);
            const seed1 = top8.sort(() => 0.5 - Math.random());
            const seed2 = poWinners.sort(() => 0.5 - Math.random());
            
            for(let i=0; i<Math.min(seed1.length, seed2.length); i++) {
                // Leg 1: PO Winner (Unseeded) vs Top 8 (Seeded)
                pairedTeams.push({ t1: seed2[i], t2: seed1[i] }); 
            }
        }
    } else {
        const targetYear = nextYear;
        const prevWeek = round === 'QF' ? 212 : round === 'SF' ? 214 : 216;
        
        const prevMatches = fixtures.filter(f => 
            f.competitionId === 'EUROPE' && 
            f.week === prevWeek && 
            f.played &&
            new Date(f.date).getFullYear() === targetYear // SEASON AWARE CHECK
        );
        
        const roundWinners: Team[] = [];
        prevMatches.forEach(leg2 => {
            const leg1 = fixtures.find(f => 
                f.competitionId === 'EUROPE' && 
                f.week === prevWeek - 1 && 
                f.homeTeamId === leg2.awayTeamId && 
                f.awayTeamId === leg2.homeTeamId &&
                new Date(f.date).getFullYear() === targetYear // SEASON AWARE CHECK
            );
            
            if (leg1) {
                const teamA_ID = leg2.homeTeamId;
                const teamB_ID = leg2.awayTeamId;
                
                const goalsA = (leg2.homeScore || 0) + (leg1.awayScore || 0);
                const goalsB = (leg2.awayScore || 0) + (leg1.homeScore || 0);
                
                let winnerId = teamA_ID;
                if (goalsB > goalsA) winnerId = teamB_ID;
                else if (goalsA === goalsB) {
                     if (leg2.pkHome !== undefined && leg2.pkAway !== undefined) {
                        if (leg2.pkAway! > leg2.pkHome!) winnerId = teamB_ID;
                        else winnerId = teamA_ID;
                     } else {
                        winnerId = Math.random() > 0.5 ? teamA_ID : teamB_ID;
                     }
                }
                const w = teams.find(t => t.id === winnerId);
                if (w) roundWinners.push(w);
            }
        });

        const shuffled = roundWinners.sort(() => 0.5 - Math.random());
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i+1 < shuffled.length) {
                pairedTeams.push({ t1: shuffled[i], t2: shuffled[i+1] });
            }
        }
    }

    pairedTeams.forEach(pair => {
        if (round === 'FINAL') {
             const date = new Date(nextYear, 5, 6); 
             newFixtures.push({
                 id: generateId(),
                 week: 217,
                 date: date.toISOString(),
                 homeTeamId: pair.t1.id,
                 awayTeamId: pair.t2.id,
                 played: false,
                 homeScore: null,
                 awayScore: null,
                 competitionId: 'EUROPE'
             });
        } else {
            let w1 = 0, w2 = 0;
            let d1 = new Date(), d2 = new Date();

            if (round === 'PLAYOFF') { 
                w1=209; w2=210; 
                d1=new Date(nextYear, 1, 19);
                d2=new Date(nextYear, 1, 26);
            }
            else if (round === 'R16') { 
                w1=211; w2=212; 
                d1=new Date(nextYear, 2, 4); 
                d2=new Date(nextYear, 2, 11);
            }
            else if (round === 'QF') { 
                w1=213; w2=214; 
                d1=new Date(nextYear, 3, 1);
                d2=new Date(nextYear, 3, 8);
            }
            else if (round === 'SF') { 
                w1=215; w2=216; 
                d1=new Date(nextYear, 3, 29);
                d2=new Date(nextYear, 4, 6);
            }

            // Leg 1: T1 vs T2
            newFixtures.push({
                id: generateId(),
                week: w1,
                date: d1.toISOString(),
                homeTeamId: pair.t1.id,
                awayTeamId: pair.t2.id,
                played: false,
                homeScore: null,
                awayScore: null,
                competitionId: 'EUROPE'
            });
            // Leg 2: T2 vs T1
            newFixtures.push({
                id: generateId(),
                week: w2,
                date: d2.toISOString(),
                homeTeamId: pair.t2.id,
                awayTeamId: pair.t1.id,
                played: false,
                homeScore: null,
                awayScore: null,
                competitionId: 'EUROPE'
            });
        }
    });

    return newFixtures;
};

const createFixture = (week: number, date: string, homeId: string, awayId: string): Fixture => ({
    id: generateId(),
    week,
    date,
    homeTeamId: homeId,
    awayTeamId: awayId,
    played: false,
    homeScore: null,
    awayScore: null
});