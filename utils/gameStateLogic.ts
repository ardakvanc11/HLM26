
import { GameState, Team, MatchEvent, MatchStats, SeasonSummary, SeasonChampion, IncomingOffer, Position, Fixture, NewsItem } from '../types';
import { 
    simulateAiDailyTransfers, 
    simulateBackgroundMatch, 
    processMatchPostGame, 
    generateWeeklyNews, 
    generateTransferMarket, 
    calculatePlayerWage, 
    applySeasonEndReputationUpdates,
    archiveSeason,
    resetForNewSeason,
    recalculateTeamStrength,
    simulatePlayerDevelopmentAndAging,
    generateAiOffersForUser, 
    getAssistantTrainingConfig, 
    applyTraining,
    optimizeAiSquad,
    processDailyIndividualTraining,
    processLoanReturns
} from './gameEngine';
import { isSameDay, addDays, isTransferWindowOpen, generateFixtures, generateSuperCupFixtures, generateCupRoundFixtures, generateEuropeanKnockoutFixtures, generateEuropeanLeagueFixtures } from './calendarAndFixtures';
import { getWeightedInjury } from './matchLogic';
import { generateId } from '../constants';

// Bir sonraki günün işlenmesi mantığı
export const processNextDayLogic = (
    currentState: GameState,
    handleGameOver: (reason: string) => void
): Partial<GameState> | null => {
    const currentDateObj = new Date(currentState.currentDate);
    const nextDate = addDays(currentState.currentDate, 1);
    const nextDateObj = new Date(nextDate);

    // --- 1. LOAN RETURN LOGIC (RUNS BEFORE EVERYTHING) ---
    const { updatedTeams: teamsAfterLoans, returnNews: loanReturnNews } = processLoanReturns(currentState.teams, nextDate, currentState.currentWeek);

    // --- YENİ SEZON (1 TEMMUZ) ---
    if (nextDateObj.getDate() === 1 && nextDateObj.getMonth() === 6) { 
        const teamsToProcess = teamsAfterLoans;
        const myTeam = teamsToProcess.find(t => t.id === currentState.myTeamId);
        let summary: SeasonSummary | null = null;
        let lastSeasonGoalAchieved = false;
        
        const superLeagueTeams = teamsToProcess.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
        const sortedSL = [...superLeagueTeams].sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
            return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
        });
        
        const relegatedTeams = sortedSL.slice(sortedSL.length - 3); 

        const league1Teams = teamsToProcess.filter(t => t.leagueId === 'LEAGUE_1');
        const sortedL1 = [...league1Teams].sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
            return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
        });
        
        const directPromoted = sortedL1.slice(0, 2); 

        const playoffFinal = currentState.fixtures.find(f => f.competitionId === 'PLAYOFF_FINAL' && f.played);
        let playoffWinner: Team | null = null;
        
        if (playoffFinal && playoffFinal.homeScore !== null && playoffFinal.awayScore !== null) {
            const winnerId = playoffFinal.homeScore > playoffFinal.awayScore 
                ? playoffFinal.homeTeamId 
                : (playoffFinal.awayScore > playoffFinal.homeScore ? playoffFinal.awayTeamId 
                : (playoffFinal.pkHome! > playoffFinal.pkAway! ? playoffFinal.homeTeamId : playoffFinal.awayTeamId));
            
            playoffWinner = teamsToProcess.find(t => t.id === winnerId) || null;
        } else {
            playoffWinner = sortedL1[2];
        }

        const teamsToUpdate = [...teamsToProcess];
        
        relegatedTeams.forEach(rt => {
            const idx = teamsToUpdate.findIndex(t => t.id === rt.id);
            if (idx !== -1) teamsToUpdate[idx].leagueId = 'LEAGUE_1';
        });

        directPromoted.forEach(pt => {
            const idx = teamsToUpdate.findIndex(t => t.id === pt.id);
            if (idx !== -1) teamsToUpdate[idx].leagueId = 'LEAGUE';
        });

        if (playoffWinner) {
            const idx = teamsToUpdate.findIndex(t => t.id === playoffWinner!.id);
            if (idx !== -1) teamsToUpdate[idx].leagueId = 'LEAGUE';
        }

        const bannedSL = sortedSL.slice(sortedSL.length - 2).map(t => t.id);
        const bannedL1 = sortedL1.slice(sortedL1.length - 2).map(t => t.id);
        const allBannedIds = new Set([...bannedSL, ...bannedL1]);

        teamsToUpdate.forEach(t => {
            if (allBannedIds.has(t.id)) t.cupBan = true;
            else t.cupBan = false;
        });

        const qualifiedTeams = [sortedSL[0], sortedSL[1], sortedSL[2], sortedSL[3]];

        if (myTeam) {
            summary = archiveSeason(myTeam, teamsToProcess, nextDateObj.getFullYear(), currentState.fixtures);
            const userLeague = myTeam.leagueId || 'LEAGUE';
            const relevantTeams = teamsToProcess.filter(t => (t.leagueId || 'LEAGUE') === userLeague);
            const sorted = [...relevantTeams].sort((a, b) => {
                if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
            });
            const rank = sorted.findIndex(t => t.id === myTeam.id) + 1;
            const exp = myTeam.board.expectations;
            if (exp === 'Şampiyonluk' && rank === 1) lastSeasonGoalAchieved = true;
            else if (exp === 'Üst Sıralar' && rank <= 5) lastSeasonGoalAchieved = true;
            else if (exp === 'Ligde Kalmak' && rank <= 15) lastSeasonGoalAchieved = true;
        }

        let resetTeams = resetForNewSeason(teamsToUpdate);
        
        const slTeams = resetTeams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
        const l1Teams = resetTeams.filter(t => t.leagueId === 'LEAGUE_1');
        
        const fixturesSL = generateFixtures(slTeams, nextDateObj.getFullYear(), 'LEAGUE');
        const fixturesL1 = generateFixtures(l1Teams, nextDateObj.getFullYear(), 'LEAGUE_1');
        
        const reFoundQualified = qualifiedTeams.map(qt => resetTeams.find(rt => rt.id === qt.id)!);
        const fixturesSuperCup = generateSuperCupFixtures(reFoundQualified, nextDateObj.getFullYear(), false);

        // DO NOT GENERATE EUROPE HERE - WAIT FOR SEPT 1
        const newFixtures = [...fixturesSL, ...fixturesL1, ...fixturesSuperCup];

        let newFfpYears = currentState.consecutiveFfpYears;
        if (myTeam) {
            const annualWages = myTeam.players.reduce((s, p) => s + (p.wage || 0), 0);
            if (myTeam.wageBudget && annualWages <= myTeam.wageBudget) {
                newFfpYears++;
            } else {
                newFfpYears = 0;
            }
        }

        return {
            currentDate: nextDate,
            currentWeek: 1,
            teams: resetTeams,
            // KEEP HISTORY: Append new fixtures to existing ones
            fixtures: [...currentState.fixtures, ...newFixtures],
            lastSeasonSummary: summary,
            seasonChampion: null,
            championDeclaredThisSeason: false, // RESET FLAG
            incomingOffers: [],
            news: [...loanReturnNews, ...currentState.news], 
            yearsAtCurrentClub: currentState.yearsAtCurrentClub + 1,
            consecutiveFfpYears: newFfpYears,
            lastSeasonGoalAchieved: lastSeasonGoalAchieved
        };
    }

    let updatedTeams = [...teamsAfterLoans]; 
    let updatedFixtures = [...currentState.fixtures];
    let updatedManager = currentState.manager ? { ...currentState.manager } : null;
    let lastTrainingReport: any[] = []; 
    let newWeek = currentState.currentWeek;
    const dailyNewsBuffer: NewsItem[] = [];
    const isHoliday = !!currentState.activeHoliday; // Check if user is on holiday
    
    // --- AI SQUAD OPTIMIZATION ---
    updatedTeams = updatedTeams.map(t => {
        if (t.id === currentState.myTeamId) return t; 
        return optimizeAiSquad(t, currentState.currentWeek);
    });

    const day = nextDateObj.getDate();
    const month = nextDateObj.getMonth(); // 0 = Jan, 8 = Sept
    const year = nextDateObj.getFullYear();
    const currentSeasonStartYear = month > 6 ? year : year - 1;

    // --- EUROPEAN LEAGUE DRAW (SEPTEMBER 1ST) ---
    if (month === 8 && day === 1) { // September 1st
        // Check if fixtures generated for THIS season
        // FIX: Check for matches in the current season (Autumn/Winter of current year), not just any match in current year
        const hasEuropeThisSeason = updatedFixtures.some(f => 
            f.competitionId === 'EUROPE' && 
            new Date(f.date).getFullYear() === year &&
            new Date(f.date).getMonth() >= 8 // Ensure it's a new season match (Sep+)
        );

        if (!hasEuropeThisSeason) {
            // Identify Participants
            // 1. Foreign Teams (EUROPE_LEAGUE leagueId)
            const foreignTeams = updatedTeams.filter(t => t.leagueId === 'EUROPE_LEAGUE');
            
            // 2. Turkish Teams
            const turkishCandidates = updatedTeams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
            
            let turkishEuroTeams: Team[] = [];

            // Check if we have played a season (League history exists)
            const hasHistory = turkishCandidates.some(t => t.leagueHistory && t.leagueHistory.length > 0);

            if (hasHistory) {
                // 1. Sort by last season ranking
                const sortedByLastSeason = [...turkishCandidates].sort((a, b) => {
                    const histA = a.leagueHistory || [];
                    const histB = b.leagueHistory || [];
                    const rankA = histA.length > 0 ? histA[histA.length - 1].rank : 99;
                    const rankB = histB.length > 0 ? histB[histB.length - 1].rank : 99;
                    return rankA - rankB;
                });

                // 2. Identify Cup Winner (From previous season, week 104)
                // Search in updatedFixtures (which contains past fixtures too)
                // Matches week 104 and competitionId CUP and Played=true
                const cupFinal = updatedFixtures
                    .filter(f => f.competitionId === 'CUP' && f.week === 104 && f.played)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]; // Get most recent

                let cupWinnerId: string | null = null;
                if (cupFinal) {
                    if (cupFinal.homeScore! > cupFinal.awayScore!) cupWinnerId = cupFinal.homeTeamId;
                    else if (cupFinal.awayScore! > cupFinal.homeScore!) cupWinnerId = cupFinal.awayTeamId;
                    else if ((cupFinal.pkHome || 0) > (cupFinal.pkAway || 0)) cupWinnerId = cupFinal.homeTeamId;
                    else cupWinnerId = cupFinal.awayTeamId;
                }

                // 3. Selection Logic
                // Get Top 4 from League
                const top4 = sortedByLastSeason.slice(0, 4);
                const top4Ids = top4.map(t => t.id);

                if (cupWinnerId && !top4Ids.includes(cupWinnerId)) {
                    // Scenario B: Cup Winner is NOT in Top 4
                    // Participants: Top 4 + Cup Winner
                    turkishEuroTeams = [...top4];
                    const cupWinnerTeam = turkishCandidates.find(t => t.id === cupWinnerId);
                    if (cupWinnerTeam) {
                        turkishEuroTeams.push(cupWinnerTeam);
                    } else {
                         // Fallback safety (should not happen): Take 5th place
                         turkishEuroTeams.push(sortedByLastSeason[4]);
                    }
                } else {
                    // Scenario A: Cup Winner IS in Top 4 OR No Cup played yet
                    // Participants: Top 5
                    turkishEuroTeams = sortedByLastSeason.slice(0, 5);
                }
            } else {
                // Season 1: Use Predefined Lore Teams
                const predefinedEuroTeams = ['Ayıboğanspor SK', 'Arıspor', 'Kedispor', 'Eşşekboğanspor FK', 'Köpekspor'];
                turkishEuroTeams = turkishCandidates.filter(t => predefinedEuroTeams.includes(t.name));
            }
            
            // Safety Check: Ensure we have exactly 5 Turkish teams. 
            if (turkishEuroTeams.length < 5) {
                const remaining = turkishCandidates
                    .filter(t => !turkishEuroTeams.map(x => x.id).includes(t.id))
                    .sort((a, b) => b.strength - a.strength)
                    .slice(0, 5 - turkishEuroTeams.length);
                turkishEuroTeams.push(...remaining);
            }
            if (turkishEuroTeams.length > 5) {
                turkishEuroTeams = turkishEuroTeams.slice(0, 5);
            }

            const allEuroParticipants = [...foreignTeams, ...turkishEuroTeams];
            
            // Generate Fixtures with Constraints
            const euroFixtures = generateEuropeanLeagueFixtures(allEuroParticipants, year);
            updatedFixtures.push(...euroFixtures);

            // Add News Item
            dailyNewsBuffer.push({
                id: generateId(),
                week: currentState.currentWeek,
                type: 'GENERAL',
                title: 'UEFA|@EuropaLeague|OFFICIAL',
                content: `Avrupa Ligi kuraları çekildi! ${turkishEuroTeams.map(t => t.name).join(', ')} ülkemizi temsil edecek.`
            });
        }
    }

    // ... (Rest of fixture generation logic for Cup rounds remains the same) ...

    // R32: Dec 1
    if (month === 11 && day === 1) { 
        const hasR32 = updatedFixtures.some(f => f.competitionId === 'CUP' && f.week === 100 && new Date(f.date).getFullYear() === year);
        if (!hasR32) {
            const cupR32 = generateCupRoundFixtures(updatedTeams, updatedFixtures, 'R32', currentSeasonStartYear);
            updatedFixtures.push(...cupR32);
        }
    }
    // R16: Dec 30
    if (month === 11 && day === 30) {
        const hasR16 = updatedFixtures.some(f => f.competitionId === 'CUP' && f.week === 101 && new Date(f.date).getFullYear() === currentSeasonStartYear + 1); // Check year
        if (!hasR16) {
            const cupR16 = generateCupRoundFixtures(updatedTeams, updatedFixtures, 'R16', currentSeasonStartYear);
            updatedFixtures.push(...cupR16);
        }
    }
    // QF: Jan 16
    if (month === 0 && day === 16) {
        const hasQF = updatedFixtures.some(f => f.competitionId === 'CUP' && f.week === 102 && new Date(f.date).getFullYear() === year);
        if (!hasQF) {
            const cupQF = generateCupRoundFixtures(updatedTeams, updatedFixtures, 'QF', currentSeasonStartYear);
            updatedFixtures.push(...cupQF);
        }
    }
    // SF: Mar 29
    if (month === 2 && day === 29) { 
        const hasSF = updatedFixtures.some(f => f.competitionId === 'CUP' && f.week === 103 && new Date(f.date).getFullYear() === year);
        if (!hasSF) {
            const cupSF = generateCupRoundFixtures(updatedTeams, updatedFixtures, 'SF', currentSeasonStartYear);
            updatedFixtures.push(...cupSF);
        }
    }
    // FINAL: May 3
    if (month === 4 && day === 3) {
        const hasFinal = updatedFixtures.some(f => f.competitionId === 'CUP' && f.week === 104 && new Date(f.date).getFullYear() === year);
        if (!hasFinal) {
            const cupFinal = generateCupRoundFixtures(updatedTeams, updatedFixtures, 'FINAL', currentSeasonStartYear);
            updatedFixtures.push(...cupFinal);
        }
    }

    // EUROPEAN LEAGUE PROGRESSION (Knockouts)
    // FIX: Using SEASON AWARE check to correctly generate knockouts in subsequent seasons
    
    const hasFixtureThisSeason = (compId: string, week: number) => {
        return updatedFixtures.some(f => {
            if (f.competitionId !== compId || f.week !== week) return false;
            const d = new Date(f.date);
            // Calculate season year for the fixture (e.g. Feb 2026 belongs to 2025 season)
            // If Month is July-Dec (6-11), Season Year is Calendar Year
            // If Month is Jan-June (0-5), Season Year is Calendar Year - 1
            const fSeasonStartYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
            
            // Compare with the current processing season
            return fSeasonStartYear === currentSeasonStartYear;
        });
    }

    if (month === 0 && day === 30) { // Jan 30
        if (!hasFixtureThisSeason('EUROPE', 209)) { // Check if Playoff generated FOR THIS SEASON
             // Use seasonFixtures to calculate table and seeds
             const seasonFixtures = updatedFixtures.filter(f => {
                const d = new Date(f.date);
                const fYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
                return fYear === currentSeasonStartYear && f.competitionId === 'EUROPE';
            });

             const r8 = seasonFixtures.filter(f => f.week === 208);
             const hasR8 = r8.length > 0;
             const allPlayed = r8.every(f => f.played);
             
             if (hasR8 && allPlayed) {
                const euroFixtures = seasonFixtures.filter(f => f.week <= 208);
                const teamIds = new Set<string>();
                euroFixtures.forEach(f => { teamIds.add(f.homeTeamId); teamIds.add(f.awayTeamId); });
                
                const euroTeams = updatedTeams.filter(t => teamIds.has(t.id)).map(t => {
                     let pts=0, gf=0, ga=0, ag=0;
                     euroFixtures.filter(f => f.homeTeamId === t.id || f.awayTeamId === t.id).forEach(f => {
                         if(!f.played) return;
                         const isHome = f.homeTeamId === t.id;
                         const myS = isHome ? f.homeScore! : f.awayScore!;
                         const opS = isHome ? f.awayScore! : f.homeScore!;
                         gf += myS; ga += opS; if (!isHome) ag += myS;
                         if(myS > opS) pts+=3; else if(myS===opS) pts+=1;
                     });
                     return { ...t, euroStats: { pts, gf, ga, ag } };
                });

                euroTeams.sort((a, b) => {
                    if (b.euroStats.pts !== a.euroStats.pts) return b.euroStats.pts - a.euroStats.pts;
                    if ((b.euroStats.gf - b.euroStats.ga) !== (a.euroStats.gf - a.euroStats.ga)) return (b.euroStats.gf - b.euroStats.ga) - (a.euroStats.gf - a.euroStats.ga);
                    if (b.euroStats.gf !== a.euroStats.gf) return b.euroStats.gf - a.euroStats.gf;
                    return b.euroStats.ag - a.euroStats.ag;
                });

                const playoffs = generateEuropeanKnockoutFixtures(updatedTeams, updatedFixtures, 'PLAYOFF', currentSeasonStartYear, euroTeams);
                updatedFixtures.push(...playoffs);
            }
        }
    }

    if (month === 1 && day === 28) { // Feb 28
        if (!hasFixtureThisSeason('EUROPE', 211)) {
            // Check Playoff Round 2 (Week 210) for this season
            const seasonFixtures = updatedFixtures.filter(f => {
                const d = new Date(f.date);
                const fYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
                return fYear === currentSeasonStartYear && f.competitionId === 'EUROPE';
            });
            
            const po2 = seasonFixtures.filter(f => f.week === 210);
            const hasPO = po2.length > 0;
            const allPlayed = po2.every(f => f.played);
            
            if (hasPO && allPlayed) {
                // Re-calculate Euro Table to properly seed R16 Draw
                const euroLeagueFixtures = seasonFixtures.filter(f => f.week <= 208);
                const teamIds = new Set<string>();
                euroLeagueFixtures.forEach(f => { teamIds.add(f.homeTeamId); teamIds.add(f.awayTeamId); });
                
                const euroTeams = updatedTeams.filter(t => teamIds.has(t.id)).map(t => {
                     let pts=0, gf=0, ga=0, ag=0;
                     euroLeagueFixtures.filter(f => f.homeTeamId === t.id || f.awayTeamId === t.id).forEach(f => {
                         if(!f.played) return;
                         const isHome = f.homeTeamId === t.id;
                         const myS = isHome ? f.homeScore! : f.awayScore!;
                         const opS = isHome ? f.awayScore! : f.homeScore!;
                         gf += myS; ga += opS; if (!isHome) ag += myS;
                         if(myS > opS) pts+=3; else if(myS===opS) pts+=1;
                     });
                     return { ...t, euroStats: { pts, gf, ga, ag } };
                });

                euroTeams.sort((a, b) => {
                    if (b.euroStats.pts !== a.euroStats.pts) return b.euroStats.pts - a.euroStats.pts;
                    if ((b.euroStats.gf - b.euroStats.ga) !== (a.euroStats.gf - a.euroStats.ga)) return (b.euroStats.gf - b.euroStats.ga) - (a.euroStats.gf - a.euroStats.ga);
                    if (b.euroStats.gf !== a.euroStats.gf) return b.euroStats.gf - a.euroStats.gf;
                    return b.euroStats.ag - a.euroStats.ag;
                });
                
                const r16Matches = generateEuropeanKnockoutFixtures(updatedTeams, updatedFixtures, 'R16', currentSeasonStartYear, euroTeams);
                updatedFixtures.push(...r16Matches);
            }
        }
    }

    if (month === 2 && day === 14) { 
        if (!hasFixtureThisSeason('EUROPE', 213)) {
            const seasonFixtures = updatedFixtures.filter(f => {
                const d = new Date(f.date);
                const fYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
                return fYear === currentSeasonStartYear && f.competitionId === 'EUROPE';
            });
            const r16_2 = seasonFixtures.filter(f => f.week === 212);
            if (r16_2.length > 0 && r16_2.every(f => f.played)) {
                const qfMatches = generateEuropeanKnockoutFixtures(updatedTeams, updatedFixtures, 'QF', currentSeasonStartYear);
                updatedFixtures.push(...qfMatches);
            }
        }
    }

    if (month === 3 && day === 11) {
        if (!hasFixtureThisSeason('EUROPE', 215)) {
            const seasonFixtures = updatedFixtures.filter(f => {
                const d = new Date(f.date);
                const fYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
                return fYear === currentSeasonStartYear && f.competitionId === 'EUROPE';
            });
            const qf2 = seasonFixtures.filter(f => f.week === 214);
            if (qf2.length > 0 && qf2.every(f => f.played)) {
                const sfMatches = generateEuropeanKnockoutFixtures(updatedTeams, updatedFixtures, 'SF', currentSeasonStartYear);
                updatedFixtures.push(...sfMatches);
            }
        }
    }

    if (month === 4 && day === 9) {
        if (!hasFixtureThisSeason('EUROPE', 217)) {
            const seasonFixtures = updatedFixtures.filter(f => {
                const d = new Date(f.date);
                const fYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
                return fYear === currentSeasonStartYear && f.competitionId === 'EUROPE';
            });
            const sf2 = seasonFixtures.filter(f => f.week === 216);
            if (sf2.length > 0 && sf2.every(f => f.played)) {
                const finalMatch = generateEuropeanKnockoutFixtures(updatedTeams, updatedFixtures, 'FINAL', currentSeasonStartYear);
                updatedFixtures.push(...finalMatch);
            }
        }
    }

    // League 1 Playoffs Logic
    const leagueFixtures = updatedFixtures.filter(f => (f.competitionId === 'LEAGUE_1') && f.week === 34 && (new Date(f.date).getFullYear() === year));
    const allLeague1Played = leagueFixtures.length > 0 && leagueFixtures.every(f => f.played);
    const hasPlayoffSemis = updatedFixtures.some(f => f.competitionId === 'PLAYOFF' && (new Date(f.date).getFullYear() === year));
    
    if (newWeek === 34 && allLeague1Played && !hasPlayoffSemis) {
        const league1Teams = updatedTeams.filter(t => t.leagueId === 'LEAGUE_1');
        const sortedL1 = [...league1Teams].sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
            return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
        });

        const t3 = sortedL1[2];
        const t4 = sortedL1[3];
        const t5 = sortedL1[4];
        const t6 = sortedL1[5];

        if (t3 && t4 && t5 && t6) {
            const dateSemi = new Date(currentDateObj.getFullYear(), 4, 15);
            const semi1: Fixture = { id: generateId(), week: 35, date: dateSemi.toISOString(), homeTeamId: t3.id, awayTeamId: t5.id, played: false, homeScore: null, awayScore: null, competitionId: 'PLAYOFF' };
            const semi2: Fixture = { id: generateId(), week: 35, date: dateSemi.toISOString(), homeTeamId: t4.id, awayTeamId: t6.id, played: false, homeScore: null, awayScore: null, competitionId: 'PLAYOFF' };
            updatedFixtures.push(semi1, semi2);
        }
    }

    const playoffSemis = updatedFixtures.filter(f => f.competitionId === 'PLAYOFF' && (new Date(f.date).getFullYear() === year));
    const allSemisPlayed = playoffSemis.length === 2 && playoffSemis.every(f => f.played);
    const hasPlayoffFinal = updatedFixtures.some(f => f.competitionId === 'PLAYOFF_FINAL' && (new Date(f.date).getFullYear() === year));

    if (newWeek === 35 && allSemisPlayed && !hasPlayoffFinal) {
        const winners = playoffSemis.map(f => {
            if (f.homeScore! > f.awayScore!) return f.homeTeamId;
            if (f.awayScore! > f.homeScore!) return f.awayTeamId;
            return f.pkHome! > f.pkAway! ? f.homeTeamId : f.awayTeamId;
        });
        const w1 = updatedTeams.find(t => t.id === winners[0]);
        const w2 = updatedTeams.find(t => t.id === winners[1]);
        if (w1 && w2) {
            const dateFinal = new Date(currentDateObj.getFullYear(), 4, 22);
            const finalMatch: Fixture = { id: generateId(), week: 36, date: dateFinal.toISOString(), homeTeamId: w1.id, awayTeamId: w2.id, played: false, homeScore: null, awayScore: null, competitionId: 'PLAYOFF_FINAL' };
            updatedFixtures.push(finalMatch);
        }
    }

    // Super Cup Final (Jan 10) if Semis Done
    if (nextDateObj.getMonth() === 0 && nextDateObj.getDate() === 7) {
        const semis = updatedFixtures.filter(f => f.competitionId === 'SUPER_CUP' && f.played && (new Date(f.date).getFullYear() === year));
        if (semis.length >= 2) {
            // ... (Winner selection logic same as before) ...
             const winners: Team[] = [];
             semis.forEach(match => {
                if (match.homeScore !== null && match.awayScore !== null) {
                    let winnerId = null;
                    if (match.homeScore > match.awayScore) winnerId = match.homeTeamId;
                    else if (match.awayScore > match.homeScore) winnerId = match.awayTeamId;
                    else {
                         if (match.pkHome !== undefined && match.pkAway !== undefined) {
                             if (match.pkHome > match.pkAway) winnerId = match.homeTeamId;
                             else winnerId = match.awayTeamId;
                         } else {
                             winnerId = match.homeTeamId; 
                         }
                    }
                    const winner = updatedTeams.find(t => t.id === winnerId);
                    if (winner) winners.push(winner);
                }
            });

            if (winners.length === 2) {
                const finalFixture: Fixture = {
                    id: generateId(),
                    week: 91,
                    date: new Date(nextDateObj.getFullYear(), 0, 10).toISOString(),
                    homeTeamId: winners[0].id,
                    awayTeamId: winners[1].id,
                    played: false,
                    homeScore: null,
                    awayScore: null,
                    competitionId: 'SUPER_CUP'
                };
                updatedFixtures.push(finalFixture);
            }
        }
    }

    if (currentState.myTeamId && updatedManager) {
        const myTeam = updatedTeams.find(t => t.id === currentState.myTeamId);
        if (myTeam) {
            let trustChange = 0;
            if (myTeam.budget < 0) {
                let penalty = 0.5;
                if (myTeam.budget >= -10) penalty = 0.2;
                else if (myTeam.budget >= -30) penalty = 0.5;
                else penalty = 1.0;
                trustChange -= penalty;
            }
            const currentTotalWages = myTeam.players.reduce((a, b) => a + (b.wage || 0), 0);
            if (myTeam.wageBudget && currentTotalWages > myTeam.wageBudget) {
                trustChange -= 0.3; 
            }
            if (myTeam.initialReputation && myTeam.reputation >= myTeam.initialReputation + 0.1) {
                trustChange += 0.1;
            }
            if (trustChange !== 0) {
                updatedManager.trust.board = Math.max(0, Math.min(100, updatedManager.trust.board + trustChange));
            }
        }
    }

    const allEventsForToday: MatchEvent[] = [];
    
    const { updatedTeams: teamsAfterTransfers, updatedTransferList: transferListAfterTransfers, newNews: transferNews } = simulateAiDailyTransfers(
        updatedTeams,
        nextDate,
        currentState.currentWeek,
        currentState.myTeamId,
        currentState.transferList
    );
    
    let userLeagueId = 'LEAGUE';
    if (currentState.myTeamId) {
        const uTeam = updatedTeams.find(t => t.id === currentState.myTeamId);
        if (uTeam) userLeagueId = uTeam.leagueId || 'LEAGUE';
    }

    const filteredTransferNews = transferNews.filter(n => {
        const teamName = n.title.split('|')[0];
        const t = updatedTeams.find(x => x.name === teamName);
        if (!t) return false;
        if (t.leagueId === 'EUROPE_LEAGUE') return false;
        return (t.leagueId || 'LEAGUE') === userLeagueId;
    });

    updatedTeams = teamsAfterTransfers;
    let newTransferList = transferListAfterTransfers;

    if (isTransferWindowOpen(nextDate) && newTransferList.length < 30) {
        newTransferList = [...newTransferList, ...generateTransferMarket(20, nextDate)];
    }

    let newIncomingOffers: IncomingOffer[] = [];
    const withdrawnNews: any[] = [];
    const activeOffers: IncomingOffer[] = [];
    
    const isWindowOpenNextDay = isTransferWindowOpen(nextDate);

    if (!isWindowOpenNextDay) {
        if (currentState.incomingOffers && currentState.incomingOffers.length > 0) {
             withdrawnNews.push({
                id: generateId(),
                week: currentState.currentWeek,
                type: 'TRANSFER',
                title: 'TFF|@Transfer|OFFICIAL',
                content: 'Transfer dönemi sona erdi. Bekleyen tüm teklifler ve görüşmeler iptal edildi.'
            });
        }
        newIncomingOffers = [];
    } else {
        (currentState.incomingOffers || []).forEach(offer => {
            const offerDate = new Date(offer.date);
            const current = new Date(nextDate);
            const diffTime = Math.abs(current.getTime() - offerDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

            if (diffDays <= 5) {
                activeOffers.push(offer);
            } else {
                withdrawnNews.push({
                    id: generateId(),
                    week: currentState.currentWeek,
                    type: 'TRANSFER',
                    title: `${offer.fromTeamName}|@Transfer|OFFICIAL`,
                    content: `${offer.fromTeamName}, ${offer.playerName} için yaptığı teklifi geri çekti. Süre doldu.`
                });
            }
        });
        
        newIncomingOffers = activeOffers;

        if (currentState.myTeamId) {
            const myTeam = updatedTeams.find(t => t.id === currentState.myTeamId);
            if (myTeam) {
                const freshOffers = generateAiOffersForUser(myTeam, nextDate);
                if (freshOffers.length > 0) {
                    newIncomingOffers = [...newIncomingOffers, ...freshOffers];
                }
            }
        }
    }

    const matchesToSimulate = updatedFixtures.filter(f => 
        (isSameDay(f.date, currentState.currentDate) || isSameDay(f.date, nextDate)) && 
        !f.played &&
        (
            (f.homeTeamId !== currentState.myTeamId && f.awayTeamId !== currentState.myTeamId) ||
            (isHoliday && (f.homeTeamId === currentState.myTeamId || f.awayTeamId === currentState.myTeamId))
        )
    );

    matchesToSimulate.forEach(match => {
         const h = updatedTeams.find(t => t.id === match.homeTeamId)!;
         const a = updatedTeams.find(t => t.id === match.awayTeamId)!;
         const isKnockout = match.competitionId === 'PLAYOFF' || match.competitionId === 'PLAYOFF_FINAL' || match.competitionId === 'SUPER_CUP' || match.competitionId === 'CUP' || match.competitionId === 'EUROPE';
         
         // 2-legged Logic: First legs are NEVER knockouts in terms of "must declare winner now".
         // Only Final (217) or single legs are.
         // Playoff (209-210), R16 (211-212), QF (213-214), SF (215-216).
         // 209, 211, 213, 215 -> 1st Legs. NO KNOCKOUT LOGIC.
         // 210, 212, 214, 216 -> 2nd Legs. AGGREGATE LOGIC.
         // 217 -> Final. SINGLE LEG KNOCKOUT.

         let effectiveKnockout = false;
         let firstLegScore = undefined;

         if (match.competitionId === 'EUROPE') {
             if (match.week === 217) {
                 effectiveKnockout = true; // Final
             } else if ([210, 212, 214, 216].includes(match.week)) {
                 // 2nd Leg. Find 1st leg score.
                 // Previous leg: Week - 1. Home was Away, Away was Home.
                 const prevWeek = match.week - 1;
                 
                 // CRITICAL FIX: Ensure we find the exact match from THIS season.
                 // Use find() on updatedFixtures directly as matchesToSimulate doesn't have past games.
                 const prevFixture = updatedFixtures.find(f => 
                     f.competitionId === 'EUROPE' &&
                     f.week === prevWeek && 
                     f.homeTeamId === match.awayTeamId && 
                     f.awayTeamId === match.homeTeamId &&
                     f.played
                 );
                 
                 if (prevFixture) {
                     effectiveKnockout = true;
                     // Note: prevFixture.homeScore is score of current Away Team (in leg 1)
                     firstLegScore = { home: prevFixture.homeScore!, away: prevFixture.awayScore! };
                 } else {
                     // FALLBACK REMOVED PER USER REQUEST
                     // If previous match is missing, we do NOT set effectiveKnockout = true.
                     // This prevents a single-leg penalty shootout from triggering on a random draw.
                     console.warn(`European match ${match.id} (Week ${match.week}) missing previous leg. Treating as standard match.`);
                     effectiveKnockout = false; 
                 }
             }
         } else {
             // Domestic Cups (Single leg in this simulation logic except stated otherwise, but here treating as single leg standard)
             // If domestic cups are single leg, keep as is. If double leg intended, similar logic applies.
             // Currently genericCupRoundFixtures generates single legs. So isKnockout is fine.
             effectiveKnockout = isKnockout;
         }
         
         const res = simulateBackgroundMatch(h, a, effectiveKnockout, firstLegScore);
         allEventsForToday.push(...res.events);

         const idx = updatedFixtures.findIndex(f => f.id === match.id);
         if(idx >= 0) {
             updatedFixtures[idx] = { 
                 ...match, played: true, homeScore: res.homeScore, awayScore: res.awayScore, 
                 stats: res.stats, matchEvents: res.events, pkHome: res.pkScore?.h, pkAway: res.pkScore?.a 
             };
         }

         // NEW: UPDATE MANAGER STATS IF USER MATCH ON HOLIDAY
         if (isHoliday && updatedManager && (match.homeTeamId === currentState.myTeamId || match.awayTeamId === currentState.myTeamId)) {
             const isHome = match.homeTeamId === currentState.myTeamId;
             const myScore = isHome ? res.homeScore : res.awayScore;
             const opScore = isHome ? res.awayScore : res.homeScore;

             updatedManager.stats.matchesManaged++;
             updatedManager.stats.goalsFor += myScore;
             updatedManager.stats.goalsAgainst += opScore;

             if (myScore > opScore) {
                 updatedManager.stats.wins++;
                 updatedManager.trust.board = Math.min(100, updatedManager.trust.board + 2);
                 updatedManager.trust.fans = Math.min(100, updatedManager.trust.fans + 2);
             } else if (myScore < opScore) {
                 updatedManager.stats.losses++;
                 updatedManager.trust.board = Math.max(0, updatedManager.trust.board - 2);
                 updatedManager.trust.fans = Math.max(0, updatedManager.trust.fans - 2);
             } else {
                 // Check Penalties for 'Win' status in Cup context (though technically a draw in stats)
                 if (effectiveKnockout && res.pkScore) {
                      const myPk = isHome ? res.pkScore.h : res.pkScore.a;
                      const opPk = isHome ? res.pkScore.a : res.pkScore.h;
                      if (myPk > opPk) {
                          // Won on penalties
                           updatedManager.trust.board = Math.min(100, updatedManager.trust.board + 2);
                      } else {
                           updatedManager.trust.board = Math.max(0, updatedManager.trust.board - 2);
                      }
                      updatedManager.stats.draws++; // Usually recorded as draw
                 } else {
                     updatedManager.stats.draws++;
                 }
             }
         }
    });

    const finishedFinals = updatedFixtures.filter(f => (isSameDay(f.date, currentState.currentDate) || isSameDay(f.date, nextDate)) && f.played && (f.week === 104 || f.week === 91 || f.week === 217));
    
    finishedFinals.forEach(f => {
        let winnerId = null;
        if (f.homeScore! > f.awayScore!) winnerId = f.homeTeamId;
        else if (f.awayScore! > f.homeScore!) winnerId = f.awayTeamId;
        else if (f.pkHome! > f.pkAway!) winnerId = f.homeTeamId;
        else winnerId = f.awayTeamId;

        const winnerIndex = updatedTeams.findIndex(t => t.id === winnerId);
        if (winnerIndex !== -1) {
            if (f.competitionId === 'CUP') {
                updatedTeams[winnerIndex] = { ...updatedTeams[winnerIndex], domesticCups: (updatedTeams[winnerIndex].domesticCups || 0) + 1 };
            } else if (f.competitionId === 'SUPER_CUP') {
                updatedTeams[winnerIndex] = { ...updatedTeams[winnerIndex], superCups: (updatedTeams[winnerIndex].superCups || 0) + 1 };
            } else if (f.competitionId === 'EUROPE') {
                updatedTeams[winnerIndex] = { ...updatedTeams[winnerIndex], europeanCups: (updatedTeams[winnerIndex].europeanCups || 0) + 1 };
            }
        }
    });

    if (allEventsForToday.length > 0) {
        updatedTeams = processMatchPostGame(updatedTeams, allEventsForToday, currentState.currentWeek, updatedFixtures);
    }

    if (currentState.myTeamId) {
        const teamIndex = updatedTeams.findIndex(t => t.id === currentState.myTeamId);
        if (teamIndex !== -1) {
            const userTeam = updatedTeams[teamIndex];
            const financials = { ...userTeam.financialRecords };
            const annualSponsorValue = userTeam.sponsors.main.yearlyValue + userTeam.sponsors.stadium.yearlyValue + userTeam.sponsors.sleeve.yearlyValue;
            const dailySponsor = annualSponsorValue / 365; 
            const annualWages = userTeam.players.reduce((acc, p) => acc + (p.wage !== undefined ? p.wage : calculatePlayerWage(p)), 0);
            const dailyWages = annualWages / 365;

            financials.income.sponsor += dailySponsor;
            financials.expense.wages += dailyWages;
            financials.expense.staff += (dailyWages * 0.15); 
            financials.expense.maint += ((userTeam.stadiumCapacity / 100000) * 0.5) / 30;
            financials.expense.academy += (userTeam.strength/100 * 0.4) / 30;
            financials.expense.admin += 0.05 / 30;

            updatedTeams[teamIndex] = { ...userTeam, financialRecords: financials };
        }
    }

    updatedTeams = updatedTeams.map(team => {
         // RE-CALCULATE STATS BASED ON ALL PLAYED FIXTURES OF THIS SEASON
         // This ensures the league table is always up to date
         const playedFixtures = updatedFixtures.filter(f => f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id));
         
         // Filter fixtures for current league season
         const seasonFixtures = playedFixtures.filter(f => {
            const d = new Date(f.date);
            const fYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
            return fYear === currentSeasonStartYear;
         });
         
         let played=0, won=0, drawn=0, lost=0, gf=0, ga=0, points=0;
         seasonFixtures.forEach(f => {
             // Only count league matches for league stats
             if (f.competitionId !== 'LEAGUE' && f.competitionId !== 'LEAGUE_1' && f.competitionId) return;

             played++;
             const isHome = f.homeTeamId === team.id;
             const myScore = isHome ? f.homeScore! : f.awayScore!;
             const oppScore = isHome ? f.awayScore! : f.homeScore!;
             gf += myScore; ga += oppScore;
             if(myScore > oppScore) { won++; points += 3; }
             else if(myScore === oppScore) { drawn++; points += 1; }
             else lost++;
         });
         return { ...team, stats: { played, won, drawn, lost, gf, ga, points } };
    });

    updatedTeams = updatedTeams.map(t => {
        const isMyTeam = t.id === currentState.myTeamId;
        let didTrain = isMyTeam ? currentState.trainingPerformed : true; 
        let currentTeam = t;

        if (isMyTeam && updatedManager && t.isTrainingDelegated) {
            const aiConfig = getAssistantTrainingConfig(t, updatedManager);
            const { updatedTeam, report } = applyTraining(t, aiConfig, currentState.currentWeek);
            const recalculated = recalculateTeamStrength(updatedTeam);
            currentTeam = recalculated;
            lastTrainingReport = report;
            didTrain = true;
        }

        const updatedPlayerList = currentTeam.players.map(p => {
            let newP = { ...p };
            
            if (newP.injury) {
                newP.condition = 0;
                newP.injury.daysRemaining -= 1;
                if (newP.injury.daysRemaining <= 0) {
                    const history = newP.injuryHistory || [];
                    const lastRecord = history[history.length - 1];
                    newP.lastInjuryDurationDays = lastRecord ? lastRecord.durationDays : 14;
                    newP.injury = undefined;
                }
            }
            
            if (!newP.injury) {
                const totalDailyRisk = 0.001 + ((newP.injurySusceptibility || 0) * 0.00005);
                if (Math.random() < totalDailyRisk) { 
                    const injuryType = getWeightedInjury();
                    const durationDays = Math.floor(Math.random() * (injuryType.maxDays - injuryType.minDays + 1)) + injuryType.minDays;
                    newP.injury = { type: injuryType.type, daysRemaining: durationDays, description: "Antrenmanda talihsiz bir sakatlık yaşadı." };
                    newP.condition = 0;
                    if (!newP.injuryHistory) newP.injuryHistory = [];
                    newP.injuryHistory.push({ type: injuryType.type, week: currentState.currentWeek, durationDays: durationDays });
                }
            }
            
            if (!newP.injury) {
                const baseRecovery = 10 + (newP.stats.stamina * 0.5);
                let durationMultiplier = 1.0;
                const lastDur = newP.lastInjuryDurationDays || 0;
                if (lastDur > 0) {
                    if (lastDur <= 10) durationMultiplier = 1.35;
                    else if (lastDur >= 56) durationMultiplier = 0.45;
                    else if (lastDur >= 28) durationMultiplier = 0.7;
                }
                if (didTrain) durationMultiplier *= 0.5; 
                else durationMultiplier *= 1.2; 
                newP.condition = Math.min(100, (newP.condition || 0) + baseRecovery * durationMultiplier);
            }

            newP = simulatePlayerDevelopmentAndAging(newP, didTrain);
            
            if (isMyTeam && newP.activeTraining) {
                 const { updatedPlayer, reportItem } = processDailyIndividualTraining(newP, currentState.currentWeek);
                 newP = updatedPlayer;
                 if (reportItem) lastTrainingReport.push(reportItem);
            }

            if (isMyTeam && newP.positionTrainingTarget) {
                const baseProgress = 1/7;
                const tickProgress = didTrain ? baseProgress : baseProgress * 0.5;
                newP.positionTrainingProgress = Number(((newP.positionTrainingProgress || 0) + tickProgress).toFixed(3));
                if (newP.positionTrainingProgress >= (newP.positionTrainingRequired || 12)) {
                    const oldPos = newP.position;
                    const newPos = newP.positionTrainingTarget;
                    if (newP.secondaryPosition === newPos) { newP.position = newPos; newP.secondaryPosition = oldPos; } else { newP.secondaryPosition = newPos; }
                    lastTrainingReport.push({ playerId: newP.id, playerName: newP.name, message: `YENİ MEVKİ! Artık ${newPos} mevkisinde de görev alabilir.`, type: 'POSITIVE' });
                    newP.positionTrainingTarget = undefined; newP.positionTrainingProgress = undefined; newP.positionTrainingRequired = undefined;
                }
            }

            return newP;
        });

        return { ...currentTeam, players: updatedPlayerList };
    });

    const dailyNews = generateWeeklyNews(currentState.currentWeek, updatedFixtures, updatedTeams, currentState.myTeamId);
    
    if (isTransferWindowOpen(nextDate)) {
        if (newTransferList.length > 5 && Math.random() > 0.7) newTransferList.shift(); 
        if (Math.random() > 0.6) newTransferList = [...newTransferList, ...generateTransferMarket(1, nextDate)];
    }

    if (updatedManager) {
        updatedManager.stats.careerEarnings += (updatedManager.contract.salary / 365);
        if (currentDateObj.getMonth() !== nextDateObj.getMonth()) {
            updatedManager.stats.transferSpendThisMonth = 0;
            updatedManager.stats.transferIncomeThisMonth = 0;
        }
    }

    const leagueFixturesThisWeek = updatedFixtures.filter(f => 
        f.week === newWeek && 
        (f.competitionId === 'LEAGUE' || f.competitionId === 'LEAGUE_1' || f.competitionId === 'PLAYOFF' || f.competitionId === 'PLAYOFF_FINAL' || !f.competitionId)
    );
    const allPlayed = leagueFixturesThisWeek.length > 0 && leagueFixturesThisWeek.every(f => f.played);
    
    let seasonChampion: SeasonChampion | null = null;
    let championDeclared = currentState.championDeclaredThisSeason; // Keep existing flag

    if (allPlayed) {
        
        // --- NEW: EARLY CHAMPION CHECK (MATHEMATICAL) ---
        const slTeamsForCheck = updatedTeams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
        const sortedForCheck = [...slTeamsForCheck].sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
            return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
        });

        const leader = sortedForCheck[0];
        const runnerUp = sortedForCheck[1];
        // newWeek starts as currentWeek. If all matches played, we move to next.
        // Matches remaining AFTER this week is done = 34 - newWeek.
        const matchesRemaining = 34 - newWeek;
        const maxPointsCatchup = matchesRemaining * 3;

        // If we have a leader and runner up, and math is secure
        if (leader && runnerUp && !championDeclared) {
            if (leader.stats.points > (runnerUp.stats.points + maxPointsCatchup)) {
                // Early Celebration!
                const seasonYear = `${currentDateObj.getFullYear() - (month > 6 ? 0 : 1)}/${currentDateObj.getFullYear() + (month > 6 ? 1 : 0)}`;
                seasonChampion = {
                    teamId: leader.id,
                    teamName: leader.name,
                    logo: leader.logo,
                    colors: leader.colors,
                    season: seasonYear
                };
                championDeclared = true; // Mark as declared
            }
        }
        // ----------------------------------------------------

        if (newWeek === 34) {
            updatedTeams = applySeasonEndReputationUpdates(updatedTeams);
            const slTeams = updatedTeams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
            const finalStandings = [...slTeams].sort((a, b) => {
                if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
            });
            const champion = finalStandings[0];
            const seasonYear = `${currentDateObj.getFullYear() - 1}/${currentDateObj.getFullYear()}`;

            const champIndex = updatedTeams.findIndex(t => t.id === champion.id);
            if (champIndex !== -1) {
                updatedTeams[champIndex] = {
                    ...updatedTeams[champIndex],
                    championships: updatedTeams[champIndex].championships + 1
                };
            }

            updatedTeams = updatedTeams.map(team => {
                const league = team.leagueId || 'LEAGUE';
                const compTeams = updatedTeams.filter(t => (t.leagueId || 'LEAGUE') === league);
                const sortedComp = [...compTeams].sort((a, b) => {
                    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                    return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
                });
                const rank = sortedComp.findIndex(t => t.id === team.id) + 1;

                // --- CHANGE HERE: Use the correct competitionId ---
                const historyEntry = { year: seasonYear, rank: rank, competitionId: league }; // ADDED competitionId
                // --------------------------------------------------
                
                return {
                    ...team,
                    leagueHistory: [...(team.leagueHistory || []), historyEntry]
                };
            });

            if (updatedManager && updatedManager.contract.teamName === champion.name) {
                updatedManager.stats.trophies += 1;
                updatedManager.stats.leagueTitles += 1;
                updatedManager.trust.board = 100;
                updatedManager.trust.fans = 100;
            }

            // Always show champion at end of season (Trophy lift), even if declared early
            seasonChampion = {
                teamId: champion.id,
                teamName: champion.name,
                logo: champion.logo,
                colors: champion.colors,
                season: seasonYear
            };
            championDeclared = true; // Ensure flag is set for consistency
        }
        newWeek++;
    }

    if (updatedManager && (updatedManager.trust.board < 30 || updatedManager.trust.fans < 35)) {
        if(updatedManager.trust.board < 30) handleGameOver("Yönetim kurulu acil toplantısı sonrası görevine son verildi. Gerekçe: Başarısız sonuçlar ve güven kaybı.");
        else handleGameOver("Taraftar baskısı dayanılmaz hale geldi. Yönetim, taraftarların isteği üzerine sözleşmeni feshetti.");
        return null;
    }

    const filteredNews = [...dailyNewsBuffer, ...withdrawnNews, ...filteredTransferNews, ...dailyNews, ...currentState.news].slice(0, 30);

    return {
        currentDate: nextDate,
        currentWeek: newWeek,
        teams: updatedTeams,
        fixtures: updatedFixtures,
        news: filteredNews,
        manager: updatedManager,
        transferList: newTransferList,
        trainingPerformed: false,
        seasonChampion: seasonChampion,
        championDeclaredThisSeason: championDeclared, // UPDATE FLAG
        lastTrainingReport: lastTrainingReport,
        incomingOffers: newIncomingOffers
    };
};
