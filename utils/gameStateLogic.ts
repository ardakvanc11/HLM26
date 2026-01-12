

import { GameState, Team, MatchEvent, MatchStats, SeasonSummary, SeasonChampion, IncomingOffer, Position, Fixture } from '../types';
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
    applyTraining 
} from './gameEngine';
import { isSameDay, addDays, isTransferWindowOpen, generateFixtures, generateSuperCupFixtures, generateCupRoundFixtures, generateEuropeanKnockoutFixtures } from './calendarAndFixtures';
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

    // --- YENİ SEZON (1 TEMMUZ) ---
    if (nextDateObj.getDate() === 1 && nextDateObj.getMonth() === 6) { 
        // ... (Existing New Season Logic - Keep as is) ...
        // Note: For brevity in this diff, assuming the original New Season block is here.
        // It handles League Relegation/Promotion. We should ensure European qualification is handled here too eventually,
        // but for now, we focus on in-season progression.
        
        const myTeam = currentState.teams.find(t => t.id === currentState.myTeamId);
        let summary: SeasonSummary | null = null;
        let lastSeasonGoalAchieved = false;
        
        const superLeagueTeams = currentState.teams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
        const sortedSL = [...superLeagueTeams].sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
            return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
        });
        
        const relegatedTeams = sortedSL.slice(sortedSL.length - 3); 

        const league1Teams = currentState.teams.filter(t => t.leagueId === 'LEAGUE_1');
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
            
            playoffWinner = currentState.teams.find(t => t.id === winnerId) || null;
        } else {
            playoffWinner = sortedL1[2];
        }

        const teamsToUpdate = [...currentState.teams];
        
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
            summary = archiveSeason(myTeam, currentState.teams, nextDateObj.getFullYear());
            const userLeague = myTeam.leagueId || 'LEAGUE';
            const relevantTeams = currentState.teams.filter(t => (t.leagueId || 'LEAGUE') === userLeague);
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

        // NOTE: EUROPEAN FIXTURES ARE NOT REGENERATED HERE AUTOMATICALLY FOR NEXT SEASON YET
        // Ideally we would qualify teams here and generate, but keeping scope tight.
        // Assuming user plays 1 season mostly or simulation handles basic next steps.
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
            fixtures: newFixtures,
            lastSeasonSummary: summary,
            seasonChampion: null,
            incomingOffers: [],
            yearsAtCurrentClub: currentState.yearsAtCurrentClub + 1,
            consecutiveFfpYears: newFfpYears,
            lastSeasonGoalAchieved: lastSeasonGoalAchieved
        };
    }

    let updatedTeams = [...currentState.teams];
    let updatedFixtures = [...currentState.fixtures];
    let updatedManager = currentState.manager ? { ...currentState.manager } : null;
    let lastTrainingReport = currentState.lastTrainingReport || [];
    let newWeek = currentState.currentWeek;

    // --- TURKISH CUP FIXTURE GENERATION ---
    const month = nextDateObj.getMonth();
    const day = nextDateObj.getDate();
    const year = nextDateObj.getFullYear();
    const currentSeasonStartYear = month > 6 ? year : year - 1;

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
        const hasR16 = updatedFixtures.some(f => f.competitionId === 'CUP' && f.week === 101);
        if (!hasR16) {
            const cupR16 = generateCupRoundFixtures(updatedTeams, updatedFixtures, 'R16', currentSeasonStartYear);
            updatedFixtures.push(...cupR16);
        }
    }
    // QF: Jan 16
    if (month === 0 && day === 16) {
        const hasQF = updatedFixtures.some(f => f.competitionId === 'CUP' && f.week === 102);
        if (!hasQF) {
            const cupQF = generateCupRoundFixtures(updatedTeams, updatedFixtures, 'QF', currentSeasonStartYear);
            updatedFixtures.push(...cupQF);
        }
    }
    // SF: Mar 29
    if (month === 2 && day === 29) { 
        const hasSF = updatedFixtures.some(f => f.competitionId === 'CUP' && f.week === 103);
        if (!hasSF) {
            const cupSF = generateCupRoundFixtures(updatedTeams, updatedFixtures, 'SF', currentSeasonStartYear);
            updatedFixtures.push(...cupSF);
        }
    }
    // FINAL: May 3
    if (month === 4 && day === 3) {
        const hasFinal = updatedFixtures.some(f => f.competitionId === 'CUP' && f.week === 104);
        if (!hasFinal) {
            const cupFinal = generateCupRoundFixtures(updatedTeams, updatedFixtures, 'FINAL', currentSeasonStartYear);
            updatedFixtures.push(...cupFinal);
        }
    }

    // --- EUROPEAN LEAGUE PROGRESSION LOGIC ---
    
    // 1. League Phase End -> Playoff Generation (After Week 208, Jan 28)
    // Trigger on Jan 30
    if (month === 0 && day === 30) { // Jan 30
        const r8 = updatedFixtures.filter(f => f.competitionId === 'EUROPE' && f.week === 208);
        const hasR8 = r8.length > 0;
        const allPlayed = r8.every(f => f.played);
        const hasPlayoffs = updatedFixtures.some(f => f.competitionId === 'EUROPE' && f.week === 209);
        
        if (hasR8 && allPlayed && !hasPlayoffs) {
            // Need League Table for Europe
            // 1. Identify all teams that participated in Europe
            const euroFixtures = updatedFixtures.filter(f => f.competitionId === 'EUROPE' && f.week <= 208);
            const teamIds = new Set<string>();
            euroFixtures.forEach(f => { teamIds.add(f.homeTeamId); teamIds.add(f.awayTeamId); });
            
            const euroTeams = updatedTeams.filter(t => teamIds.has(t.id)).map(t => {
                 // Calculate stats for table
                 let pts=0, gf=0, ga=0, ag=0;
                 euroFixtures.filter(f => f.homeTeamId === t.id || f.awayTeamId === t.id).forEach(f => {
                     if(!f.played) return;
                     const isHome = f.homeTeamId === t.id;
                     const myS = isHome ? f.homeScore! : f.awayScore!;
                     const opS = isHome ? f.awayScore! : f.homeScore!;
                     gf += myS; ga += opS;
                     if (!isHome) ag += myS;
                     if(myS > opS) pts+=3;
                     else if(myS===opS) pts+=1;
                 });
                 return { ...t, euroStats: { pts, gf, ga, ag } };
            });

            // Sort: Points, GD, GF, Away Goals
            euroTeams.sort((a, b) => {
                if (b.euroStats.pts !== a.euroStats.pts) return b.euroStats.pts - a.euroStats.pts;
                if ((b.euroStats.gf - b.euroStats.ga) !== (a.euroStats.gf - a.euroStats.ga)) return (b.euroStats.gf - b.euroStats.ga) - (a.euroStats.gf - a.euroStats.ga);
                if (b.euroStats.gf !== a.euroStats.gf) return b.euroStats.gf - a.euroStats.gf;
                return b.euroStats.ag - a.euroStats.ag;
            });

            // Pass the sorted list to generator
            const playoffs = generateEuropeanKnockoutFixtures(updatedTeams, updatedFixtures, 'PLAYOFF', year, euroTeams);
            updatedFixtures.push(...playoffs);
        }
    }

    // 2. Playoff End -> R16 Generation (After Playoff 2nd Leg on Feb 26)
    // Trigger on Feb 28
    if (month === 1 && day === 28) { // Feb 28
        const po2 = updatedFixtures.filter(f => f.competitionId === 'EUROPE' && f.week === 210);
        const hasPO = po2.length > 0;
        const allPlayed = po2.every(f => f.played);
        const hasR16 = updatedFixtures.some(f => f.competitionId === 'EUROPE' && f.week === 211);
        
        if (hasPO && allPlayed && !hasR16) {
            // Need the sorted table again to find Top 8 (Could be cached but recalculating is safer stateless)
            const euroFixtures = updatedFixtures.filter(f => f.competitionId === 'EUROPE' && f.week <= 208);
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

            const r16Matches = generateEuropeanKnockoutFixtures(updatedTeams, updatedFixtures, 'R16', year, euroTeams);
            updatedFixtures.push(...r16Matches);
        }
    }

    // 3. R16 End -> QF (After R16 2nd Leg on Mar 11)
    // Trigger on Mar 14
    if (month === 2 && day === 14) { // Mar 14
        const r16_2 = updatedFixtures.filter(f => f.competitionId === 'EUROPE' && f.week === 212);
        if (r16_2.length > 0 && r16_2.every(f => f.played) && !updatedFixtures.some(f => f.competitionId === 'EUROPE' && f.week === 213)) {
            const qfMatches = generateEuropeanKnockoutFixtures(updatedTeams, updatedFixtures, 'QF', year);
            updatedFixtures.push(...qfMatches);
        }
    }

    // 4. QF End -> SF (After QF 2nd Leg on Apr 8)
    // Trigger on Apr 11
    if (month === 3 && day === 11) { // Apr 11
        const qf2 = updatedFixtures.filter(f => f.competitionId === 'EUROPE' && f.week === 214);
        if (qf2.length > 0 && qf2.every(f => f.played) && !updatedFixtures.some(f => f.competitionId === 'EUROPE' && f.week === 215)) {
            const sfMatches = generateEuropeanKnockoutFixtures(updatedTeams, updatedFixtures, 'SF', year);
            updatedFixtures.push(...sfMatches);
        }
    }

    // 5. SF End -> Final (After SF 2nd Leg on May 6)
    // Trigger on May 9
    if (month === 4 && day === 9) { // May 9
        const sf2 = updatedFixtures.filter(f => f.competitionId === 'EUROPE' && f.week === 216);
        if (sf2.length > 0 && sf2.every(f => f.played) && !updatedFixtures.some(f => f.competitionId === 'EUROPE' && f.week === 217)) {
            const finalMatch = generateEuropeanKnockoutFixtures(updatedTeams, updatedFixtures, 'FINAL', year);
            updatedFixtures.push(...finalMatch);
        }
    }


    // --- PLAY-OFF FIXTURE GENERATION (DOMESTIC 1. LIG) ---
    // Lig maçları (Hafta 34) bittiğinde devreye girer
    const leagueFixtures = updatedFixtures.filter(f => (f.competitionId === 'LEAGUE_1') && f.week === 34);
    const allLeague1Played = leagueFixtures.length > 0 && leagueFixtures.every(f => f.played);
    
    const hasPlayoffSemis = updatedFixtures.some(f => f.competitionId === 'PLAYOFF');
    
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
            const dateSemi = new Date(currentDateObj.getFullYear(), 4, 15); // May 15
            const semi1: Fixture = {
                id: generateId(),
                week: 35,
                date: dateSemi.toISOString(),
                homeTeamId: t3.id,
                awayTeamId: t5.id,
                played: false,
                homeScore: null,
                awayScore: null,
                competitionId: 'PLAYOFF'
            };
            const semi2: Fixture = {
                id: generateId(),
                week: 35,
                date: dateSemi.toISOString(),
                homeTeamId: t4.id,
                awayTeamId: t6.id,
                played: false,
                homeScore: null,
                awayScore: null,
                competitionId: 'PLAYOFF'
            };
            updatedFixtures.push(semi1, semi2);
        }
    }

    // Play-off Finali (1. Lig)
    const playoffSemis = updatedFixtures.filter(f => f.competitionId === 'PLAYOFF');
    const allSemisPlayed = playoffSemis.length === 2 && playoffSemis.every(f => f.played);
    const hasPlayoffFinal = updatedFixtures.some(f => f.competitionId === 'PLAYOFF_FINAL');

    if (newWeek === 35 && allSemisPlayed && !hasPlayoffFinal) {
        const winners = playoffSemis.map(f => {
            if (f.homeScore! > f.awayScore!) return f.homeTeamId;
            if (f.awayScore! > f.homeScore!) return f.awayTeamId;
            return f.pkHome! > f.pkAway! ? f.homeTeamId : f.awayTeamId;
        });

        const w1 = updatedTeams.find(t => t.id === winners[0]);
        const w2 = updatedTeams.find(t => t.id === winners[1]);

        if (w1 && w2) {
            const dateFinal = new Date(currentDateObj.getFullYear(), 4, 22); // May 22
            const finalMatch: Fixture = {
                id: generateId(),
                week: 36,
                date: dateFinal.toISOString(),
                homeTeamId: w1.id,
                awayTeamId: w2.id,
                played: false,
                homeScore: null,
                awayScore: null,
                competitionId: 'PLAYOFF_FINAL'
            };
            updatedFixtures.push(finalMatch);
        }
    }

    // --- SUPER CUP FINAL GENERATION (JAN 7) ---
    if (nextDateObj.getMonth() === 0 && nextDateObj.getDate() === 7) {
        const semis = updatedFixtures.filter(f => f.competitionId === 'SUPER_CUP' && f.played);
        if (semis.length >= 2) {
            // ... (Same logic as existing for Super Cup)
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

    // ... (Board Trust, Transfers, News logic remains same)
    
    // --- BOARD TRUST UPDATES (DAILY) ---
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
    
    const { updatedTeams: teamsAfterTransfers, newNews: transferNews } = simulateAiDailyTransfers(
        updatedTeams, 
        nextDate, 
        currentState.currentWeek, 
        currentState.myTeamId
    );
    updatedTeams = teamsAfterTransfers;

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

    // --- FIX: SIMULATE AI MATCHES FOR TODAY AND TOMORROW (CATCH UP) ---
    // User pressed Next Day. We must process any unplayed matches scheduled for TODAY (currentDate)
    // AND then potentially handle logic for tomorrow if needed (usually just setting up).
    // The previous logic only looked at `nextDate`, skipping matches on `currentDate` that AI hasn't played yet.
    
    const matchesToSimulate = updatedFixtures.filter(f => 
        (isSameDay(f.date, currentState.currentDate) || isSameDay(f.date, nextDate)) && 
        !f.played &&
        f.homeTeamId !== currentState.myTeamId && 
        f.awayTeamId !== currentState.myTeamId
    );

    matchesToSimulate.forEach(match => {
         const h = updatedTeams.find(t => t.id === match.homeTeamId)!;
         const a = updatedTeams.find(t => t.id === match.awayTeamId)!;
         const isKnockout = match.competitionId === 'PLAYOFF' || match.competitionId === 'PLAYOFF_FINAL' || match.competitionId === 'SUPER_CUP' || match.competitionId === 'CUP' || match.competitionId === 'EUROPE';
         const effectiveKnockout = isKnockout && (match.competitionId !== 'EUROPE' || match.week > 208);
         
         const res = simulateBackgroundMatch(h, a, effectiveKnockout);
         allEventsForToday.push(...res.events);

         const idx = updatedFixtures.findIndex(f => f.id === match.id);
         if(idx >= 0) {
             updatedFixtures[idx] = { 
                 ...match, played: true, homeScore: res.homeScore, awayScore: res.awayScore, 
                 stats: res.stats, matchEvents: res.events, pkHome: res.pkScore?.h, pkAway: res.pkScore?.a 
             };
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
         const playedFixtures = updatedFixtures.filter(f => f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id));
         let played=0, won=0, drawn=0, lost=0, gf=0, ga=0, points=0;
         playedFixtures.forEach(f => {
             // Only count LEAGUE games for league table
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
            const { updatedTeam, report } = applyTraining(t, aiConfig);
            const recalculated = recalculateTeamStrength(updatedTeam);
            currentTeam = recalculated;
            lastTrainingReport = report;
            didTrain = true;
        }

        return {
            ...currentTeam,
            players: currentTeam.players.map(p => {
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
            })
        };
    });

    const dailyNews = generateWeeklyNews(currentState.currentWeek, updatedFixtures, updatedTeams, currentState.myTeamId);
    
    let newTransferList = [...currentState.transferList];
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

    if (allPlayed) {
        if (newWeek === 34) {
            updatedTeams = applySeasonEndReputationUpdates(updatedTeams);
            
            const slTeams = updatedTeams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
            const finalStandings = [...slTeams].sort((a, b) => {
                if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
            });
            const champion = finalStandings[0];
            const seasonYear = `${currentDateObj.getFullYear()}/${currentDateObj.getFullYear() + 1}`;

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

                const historyEntry = { year: seasonYear, rank: rank };
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

            seasonChampion = {
                teamId: champion.id,
                teamName: champion.name,
                logo: champion.logo,
                colors: champion.colors,
                season: seasonYear
            };
        }
        newWeek++;
    }

    if (updatedManager && (updatedManager.trust.board < 30 || updatedManager.trust.fans < 35)) {
        if(updatedManager.trust.board < 30) handleGameOver("Yönetim kurulu acil toplantısı sonrası görevine son verildi. Gerekçe: Başarısız sonuçlar ve güven kaybı.");
        else handleGameOver("Taraftar baskısı dayanılmaz hale geldi. Yönetim, taraftarların isteği üzerine sözleşmeni feshetti.");
        return null;
    }

    const filteredNews = [...withdrawnNews, ...transferNews, ...dailyNews, ...currentState.news].slice(0, 30);

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
        lastTrainingReport: lastTrainingReport,
        incomingOffers: newIncomingOffers
    };
};
