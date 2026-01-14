

import { Team, Fixture } from '../types';
import { generateId, GAME_CALENDAR } from '../constants';

const MONTH_NAMES = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

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

    // Summer: July 1 to Sept 1
    // Month 6 (July), Month 7 (Aug), Month 8 (Sept) up to day 1
    if ((month === 6) || (month === 7) || (month === 8 && day <= 1)) {
        return true;
    }
    
    // Winter: Jan 1 to Feb 1
    // Month 0 (Jan), Month 1 (Feb) up to day 1
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

// USER DEFINED SPECIFIC SCHEDULE
// Month is 0-indexed (0=Jan, 7=Aug, 11=Dec)
const WEEK_DEFINITIONS = [
    // --- 1. YARI ---
    { week: 1, month: 7, day: 8 },   // 8 Aug
    { week: 2, month: 7, day: 15 },  // 15 Aug
    { week: 3, month: 7, day: 22 },  // 22 Aug
    { week: 4, month: 7, day: 29 },  // 29 Aug
    { week: 5, month: 8, day: 5 },   // 5 Sep
    { week: 6, month: 8, day: 12 },  // 12 Sep
    { week: 7, month: 8, day: 19 },  // 19 Sep
    { week: 8, month: 9, day: 6 },   // 6 Oct
    { week: 9, month: 9, day: 13 },  // 13 Oct
    { week: 10, month: 9, day: 27 }, // 27 Oct
    { week: 11, month: 10, day: 2 }, // 2 Nov
    { week: 12, month: 10, day: 9 }, // 9 Nov
    { week: 13, month: 10, day: 16 },// 16 Nov
    { week: 14, month: 11, day: 1 }, // 1 Dec
    { week: 15, month: 11, day: 7 }, // 7 Dec
    { week: 16, month: 11, day: 15 },// 15 Dec
    { week: 17, month: 11, day: 22 },// 22 Dec (Half Time)
    
    // --- 2. YARI (NEXT YEAR) ---
    { week: 18, month: 1, day: 2 },  // 2 Feb
    { week: 19, month: 1, day: 9 },  // 9 Feb
    { week: 20, month: 1, day: 16 }, // 16 Feb
    { week: 21, month: 1, day: 23 }, // 23 Feb
    { week: 22, month: 2, day: 2 },  // 2 Mar
    { week: 23, month: 2, day: 9 },  // 9 Mar
    { week: 24, month: 2, day: 16 }, // 16 Mar
    { week: 25, month: 2, day: 23 }, // 23 Mar
    { week: 26, month: 3, day: 6 },  // 6 Apr
    { week: 27, month: 3, day: 13 }, // 13 Apr
    { week: 28, month: 3, day: 20 }, // 20 Apr
    { week: 29, month: 3, day: 27 }, // 27 Apr
    { week: 30, month: 4, day: 4 },  // 4 May
    { week: 31, month: 4, day: 11 }, // 11 May
    { week: 32, month: 4, day: 18 }, // 18 May
    { week: 33, month: 4, day: 25 }, // 25 May
    { week: 34, month: 5, day: 1 },  // 1 Jun
];

// Generates specific weekly dates based on the user provided list
const getSpecificSeasonDates = (startYear: number): Date[] => {
    return WEEK_DEFINITIONS.map(def => {
        // If month is earlier than August (month < 7), it's the next year
        const year = def.month < 6 ? startYear + 1 : startYear;
        return new Date(year, def.month, def.day);
    });
};

export const generateFixtures = (teams: Team[], year: number = 2025, competitionId: string = 'LEAGUE'): Fixture[] => {
    const fixtures: Fixture[] = [];
    const teamIds = teams.map(t => t.id);
    const numTeams = teamIds.length;
    const numMatchesPerTeam = (numTeams - 1) * 2; 
    const matchesPerRound = numTeams / 2; // 18 teams -> 9 matches per week

    // Round Robin Logic
    const rotation = [...teamIds]; 
    const fixed = rotation.shift()!;
    
    // Get the specific dates from the definition
    const seasonDates = getSpecificSeasonDates(year);
    
    for (let round = 0; round < numMatchesPerTeam; round++) {
        // Use dynamically generated dates
        let baseDate = new Date();
        if (round < seasonDates.length) {
            baseDate = new Date(seasonDates[round]);
        } else {
            // Safety Fallback
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

        // --- SPLIT MATCHES TO 2 DAYS (50% / 50%) ---
        // 9 matches: First 5 on Day 1, Last 4 on Day 2
        // Matches are already randomized by the round robin rotation somewhat,
        // but splitting by index ensures distinct days.
        
        const splitIndex = Math.ceil(matchesPerRound / 2); // 9 matches -> 5 on first day, 4 on second
        
        roundFixtures.forEach((fix, index) => {
            const matchDate = new Date(baseDate);
            // If index is >= splitIndex (e.g. index 5,6,7,8), add 1 day
            if (index >= splitIndex) {
                matchDate.setDate(matchDate.getDate() + 1);
            }
            fix.date = matchDate.toISOString();
            fix.competitionId = competitionId; // Use the passed competitionId
        });

        fixtures.push(...roundFixtures);
        rotation.unshift(rotation.pop()!);
    }
    
    // Sort chronologically
    return fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// --- NEW EUROPEAN FORMAT GENERATION (CIRCLE METHOD) ---
// 36 Teams, 8 Matches each. Uses Circle Method to guarantee pairing uniqueness and completeness.
export const generateEuropeanLeagueFixtures = (teams: Team[], year: number): Fixture[] => {
    const fixtures: Fixture[] = [];
    const numTeams = teams.length; // 36
    
    if (numTeams % 2 !== 0) {
        console.warn("Avrupa Ligi için takım sayısı çift olmalı!");
        return [];
    }

    // Dates for 8 Rounds (League Phase)
    const dates = [
        new Date(year, 8, 24), // Sep 24 (Week 1)
        new Date(year, 9, 1),  // Oct 1 (Week 2)
        new Date(year, 9, 22), // Oct 22 (Week 3)
        new Date(year, 10, 5), // Nov 5 (Week 4)
        new Date(year, 10, 26),// Nov 26 (Week 5)
        new Date(year, 11, 10),// Dec 10 (Week 6)
        new Date(year + 1, 0, 21), // Jan 21 (Week 7)
        new Date(year + 1, 0, 28)  // Jan 28 (Week 8)
    ];

    // Indices array for rotation
    const indices = Array.from({ length: numTeams }, (_, i) => i); // [0, 1, 2 ... 35]
    
    // We need 8 rounds. The Circle Method generates N-1 rounds (35 rounds).
    // We will generate the first 8 rounds from this sequence.
    for (let round = 0; round < 8; round++) {
        const roundFixtures: Fixture[] = [];
        const date = dates[round];

        // Match Split Logic (Half on Day 1, Half on Day 2)
        const matchesPerRound = numTeams / 2;
        const splitIndex = Math.ceil(matchesPerRound / 2);

        // Pairing:
        // Index 0 vs Index N-1
        // Index 1 vs Index N-2
        // ...
        for (let i = 0; i < matchesPerRound; i++) {
            const idx1 = indices[i];
            const idx2 = indices[numTeams - 1 - i];

            const t1 = teams[idx1];
            const t2 = teams[idx2];

            // Alternate Home/Away based on round number and pair index to balance H/A
            // Round 0: 0, 2, 4... are Home
            // Round 1: 1, 3, 5... are Home
            const isT1Home = (i + round) % 2 === 0;

            // Determine specific date (Split between Day 1 and Day 2)
            const matchDate = new Date(date);
            if (i >= splitIndex) {
                matchDate.setDate(matchDate.getDate() + 1);
            }

            roundFixtures.push({
                id: generateId(),
                week: 201 + round, // Week 201-208 for Europe League Phase
                date: matchDate.toISOString(),
                homeTeamId: isT1Home ? t1.id : t2.id,
                awayTeamId: isT1Home ? t2.id : t1.id,
                played: false,
                homeScore: null,
                awayScore: null,
                competitionId: 'EUROPE'
            });
        }

        fixtures.push(...roundFixtures);

        // Rotate indices for next round (Circle Method)
        // Keep index 0 fixed, rotate 1...N-1
        // [0, 1, 2, 3, 4, 5] -> [0, 5, 1, 2, 3, 4]
        const lastItem = indices.pop()!;
        indices.splice(1, 0, lastItem);
    }
    
    return fixtures;
};

// Generates Super Cup Fixtures (Semi-Finals)
export const generateSuperCupFixtures = (teams: Team[], year: number, isInitialSeason: boolean = false): Fixture[] => {
    const fixtures: Fixture[] = [];
    
    let t1: Team | undefined, t2: Team | undefined, t3: Team | undefined, t4: Team | undefined;

    if (isInitialSeason) {
        // 1. Arıspor
        // 2. Eşşekboğanspor FK
        // 3. Köpekspor
        // 4. Kedispor (Cup Winner)
        t1 = teams.find(t => t.name === 'Arıspor');
        t2 = teams.find(t => t.name === 'Eşşekboğanspor FK');
        t3 = teams.find(t => t.name === 'Köpekspor');
        t4 = teams.find(t => t.name === 'Kedispor');
    } else {
        // Assume teams are sorted by qualification
        if (teams.length >= 4) {
            t1 = teams[0];
            t2 = teams[1];
            t3 = teams[2];
            t4 = teams[3];
        }
    }

    if (t1 && t2 && t3 && t4) {
        // Semi 1: 1 vs 3 -> Jan 5
        const d1 = new Date(year + 1, 0, 5); // Jan 5
        fixtures.push({
            id: generateId(),
            week: 90, // Special Week ID for Super Cup
            date: d1.toISOString(),
            homeTeamId: t1.id,
            awayTeamId: t3.id,
            played: false,
            homeScore: null,
            awayScore: null,
            competitionId: 'SUPER_CUP'
        });

        // Semi 2: 2 vs 4 -> Jan 6
        const d2 = new Date(year + 1, 0, 6); // Jan 6
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

// Generates Turkish Cup Fixtures
export const generateCupRoundFixtures = (teams: Team[], fixtures: Fixture[], round: 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL', year: number): Fixture[] => {
    const newFixtures: Fixture[] = [];
    let pool: Team[] = [];

    // Week mapping for Cup Rounds
    const CUP_WEEKS = { 'R32': 100, 'R16': 101, 'QF': 102, 'SF': 103, 'FINAL': 104 };
    const cupWeek = CUP_WEEKS[round];

    // --- IDENTIFY PARTICIPANTS ---
    if (round === 'R32') {
        // Filter out banned teams
        pool = teams.filter(t => !t.cupBan);
    } else {
        // Find winners from previous round
        const prevWeek = round === 'R16' ? 100 : round === 'QF' ? 101 : round === 'SF' ? 102 : 103;
        const prevFixtures = fixtures.filter(f => f.competitionId === 'CUP' && f.week === prevWeek && f.played);
        
        const winners: Team[] = [];
        prevFixtures.forEach(f => {
            const h = teams.find(t => t.id === f.homeTeamId);
            const a = teams.find(t => t.id === f.awayTeamId);
            if (h && a) {
                // Determine winner including penalties
                let winnerId = f.homeTeamId;
                if (f.homeScore! > f.awayScore!) winnerId = f.homeTeamId;
                else if (f.awayScore! > f.homeScore!) winnerId = f.awayTeamId;
                else if (f.pkHome! > f.pkAway!) winnerId = f.homeTeamId;
                else winnerId = f.awayTeamId;

                const winner = teams.find(t => t.id === winnerId);
                if (winner) winners.push(winner);
            }
        });
        pool = winners;
    }

    // --- SHUFFLE & PAIR ---
    // Random Shuffle
    pool = pool.sort(() => 0.5 - Math.random());

    // Pair Up
    for (let i = 0; i < pool.length; i += 2) {
        if (i + 1 < pool.length) {
            const home = pool[i];
            const away = pool[i + 1];

            // Determine Date based on Round
            let matchDate = new Date();
            // Dates are adjusted for "Next Year" if month < 7 (August)
            const seasonStartYear = year; 
            const nextYear = seasonStartYear + 1;

            if (round === 'R32') {
                // Dec 28 or 29
                matchDate = new Date(seasonStartYear, 11, i % 4 === 0 ? 28 : 29); // Split roughly
            } else if (round === 'R16') {
                // Jan 14 or 15
                matchDate = new Date(nextYear, 0, i % 4 === 0 ? 14 : 15);
            } else if (round === 'QF') {
                // Mar 27 or 28
                matchDate = new Date(nextYear, 2, i % 4 === 0 ? 27 : 28);
            } else if (round === 'SF') {
                // May 1 or 2
                matchDate = new Date(nextYear, 4, i === 0 ? 1 : 2);
            } else if (round === 'FINAL') {
                // May 14
                matchDate = new Date(nextYear, 4, 14);
            }

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

// Generates European Knockout Rounds (Playoff, R16, QF, SF, Final)
export const generateEuropeanKnockoutFixtures = (teams: Team[], fixtures: Fixture[], round: 'PLAYOFF' | 'R16' | 'QF' | 'SF' | 'FINAL', year: number, leagueTable?: Team[]): Fixture[] => {
    const newFixtures: Fixture[] = [];
    const nextYear = year + 1;
    
    // Updated Schedule based on user request:
    // Playoff (9-24): 209 (L1), 210 (L2) - Feb 19, Feb 26
    // R16: 211 (L1), 212 (L2) - Mar 4, Mar 11
    // QF: 213 (L1), 214 (L2) - Apr 1, Apr 8
    // SF: 215 (L1), 216 (L2) - Apr 29, May 6
    // Final: 217 - Jun 6
    
    let pairedTeams: {t1: Team, t2: Team}[] = [];

    // --- PAIRING LOGIC ---
    if (round === 'PLAYOFF') {
        if (!leagueTable) return [];
        // Teams 9-24 play. 
        const playoffTeams = leagueTable.slice(8, 24); // Index 8 is rank 9
        // Pair Top vs Bottom of this slice
        for (let i = 0; i < 8; i++) {
            const highSeed = playoffTeams[i]; // 9th, 10th...
            const lowSeed = playoffTeams[15 - i]; // 24th, 23rd...
            pairedTeams.push({ t1: lowSeed, t2: highSeed }); // Lower seed home first usually
        }
    } else if (round === 'R16') {
        // Find previous round winners (Playoff 210)
        const poMatches = fixtures.filter(f => f.competitionId === 'EUROPE' && f.week === 210 && f.played);
        const poWinners: Team[] = [];
        
        // Determine aggregate winners
        poMatches.forEach(leg2 => {
            const leg1 = fixtures.find(f => f.competitionId === 'EUROPE' && f.week === 209 && 
                ((f.homeTeamId === leg2.awayTeamId && f.awayTeamId === leg2.homeTeamId))
            );
            
            if (leg1 && leg1.played) {
                const hId = leg2.homeTeamId;
                const aId = leg2.awayTeamId;
                
                const hScoreTotal = (leg2.homeScore || 0) + (leg1.awayScore || 0); 
                const aScoreTotal = (leg2.awayScore || 0) + (leg1.homeScore || 0);
                
                let winnerId = hId;
                if (aScoreTotal > hScoreTotal) winnerId = aId;
                else if (hScoreTotal === aScoreTotal) {
                    if (leg2.pkHome !== undefined && leg2.pkAway !== undefined) {
                        if (leg2.pkAway! > leg2.pkHome!) winnerId = aId;
                    }
                }
                
                const w = teams.find(t => t.id === winnerId);
                if (w) poWinners.push(w);
            }
        });

        if (leagueTable) {
            const top8 = leagueTable.slice(0, 8);
            
            // Random draw between Top 8 and PO Winners
            const seed1 = top8.sort(() => 0.5 - Math.random());
            const seed2 = poWinners.sort(() => 0.5 - Math.random());
            
            for(let i=0; i<Math.min(seed1.length, seed2.length); i++) {
                pairedTeams.push({ t1: seed2[i], t2: seed1[i] }); // Unseeded home first
            }
        }
    } else {
        // QF, SF, Final: Find winners from previous round and pair randomly
        const prevWeek = round === 'QF' ? 212 : round === 'SF' ? 214 : 216;
        const prevMatches = fixtures.filter(f => f.competitionId === 'EUROPE' && f.week === prevWeek && f.played);
        
        const roundWinners: Team[] = [];
        prevMatches.forEach(leg2 => {
            const leg1 = fixtures.find(f => f.competitionId === 'EUROPE' && f.week === prevWeek - 1 && 
                 ((f.homeTeamId === leg2.awayTeamId && f.awayTeamId === leg2.homeTeamId))
            );
            
            if (leg1) {
                const hId = leg2.homeTeamId;
                const aId = leg2.awayTeamId;
                const hScoreTotal = (leg2.homeScore || 0) + (leg1.awayScore || 0);
                const aScoreTotal = (leg2.awayScore || 0) + (leg1.homeScore || 0);
                
                let winnerId = hId;
                if (aScoreTotal > hScoreTotal) winnerId = aId;
                else if (hScoreTotal === aScoreTotal && leg2.pkHome !== undefined && leg2.pkAway !== undefined) {
                     if (leg2.pkAway! > leg2.pkHome!) winnerId = aId;
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

    // --- CREATE FIXTURES ---
    pairedTeams.forEach(pair => {
        if (round === 'FINAL') {
             // Single Leg - June 6
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
            // Double Leg
            let w1 = 0, w2 = 0;
            let d1 = new Date(), d2 = new Date();

            if (round === 'PLAYOFF') { 
                w1=209; w2=210; 
                d1=new Date(nextYear, 1, 19); // Feb 19
                d2=new Date(nextYear, 1, 26); // Feb 26
            }
            else if (round === 'R16') { 
                w1=211; w2=212; 
                d1=new Date(nextYear, 2, 4);  // Mar 4
                d2=new Date(nextYear, 2, 11); // Mar 11
            }
            else if (round === 'QF') { 
                w1=213; w2=214; 
                d1=new Date(nextYear, 3, 1);  // Apr 1
                d2=new Date(nextYear, 3, 8);  // Apr 8
            }
            else if (round === 'SF') { 
                w1=215; w2=216; 
                d1=new Date(nextYear, 3, 29); // Apr 29
                d2=new Date(nextYear, 4, 6);  // May 6
            }

            // Leg 1
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
            // Leg 2
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
