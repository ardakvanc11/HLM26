
import React from 'react';
import { GameState, MatchEvent, MatchStats, Team, Fixture, SeasonChampion } from '../types';
import { processMatchPostGame, simulateBackgroundMatch, recalculateTeamStrength, calculateOdds } from '../utils/gameEngine';
import { RIVALRIES } from '../constants';

export const useMatchLogic = (
    gameState: GameState,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    navigation: any,
    coreSetters: any
) => {

    const handleMatchFinish = (hScore: number, aScore: number, events: MatchEvent[], stats: MatchStats, fixtureId?: string) => {
        const fId = fixtureId || gameState.activeFixtureId;
        if (!fId) return;

        const currentFixture = gameState.fixtures.find(f => f.id === fId);
        if (!currentFixture) return;

        // 1. Update Fixture
        const updatedFixture = {
            ...currentFixture,
            played: true,
            homeScore: hScore,
            awayScore: aScore,
            matchEvents: events,
            stats: stats,
            pkHome: stats.pkHome,
            pkAway: stats.pkAway
        };

        // 2. Process Post Game (Injuries, Suspensions, Stats) for TEAMS
        // Only update teams involved to save perf, but processMatchPostGame typically iterates all or takes list.
        // We will pass current teams state.
        let updatedTeams = processMatchPostGame(gameState.teams, events, gameState.currentWeek, [updatedFixture]);
        
        // 3. Update League Table Stats for Home/Away Team
        const homeTeamIdx = updatedTeams.findIndex(t => t.id === currentFixture.homeTeamId);
        const awayTeamIdx = updatedTeams.findIndex(t => t.id === currentFixture.awayTeamId);

        let hTeam: Team | null = null;
        let aTeam: Team | null = null;

        if (homeTeamIdx !== -1 && awayTeamIdx !== -1) {
            const h = updatedTeams[homeTeamIdx];
            const a = updatedTeams[awayTeamIdx];
            hTeam = h;
            aTeam = a;

            // Only update league table stats if it's a league match
            if (!currentFixture.competitionId || currentFixture.competitionId === 'LEAGUE' || currentFixture.competitionId === 'LEAGUE_1') {
                // Update Home
                h.stats.played++;
                h.stats.gf += hScore;
                h.stats.ga += aScore;
                if (hScore > aScore) { h.stats.won++; h.stats.points += 3; }
                else if (hScore === aScore) { h.stats.drawn++; h.stats.points += 1; }
                else { h.stats.lost++; }
                
                // Update Away
                a.stats.played++;
                a.stats.gf += aScore;
                a.stats.ga += hScore;
                if (aScore > hScore) { a.stats.won++; a.stats.points += 3; }
                else if (aScore === hScore) { a.stats.drawn++; a.stats.points += 1; }
                else { a.stats.lost++; }
            }
            
            // Re-calc strength if dynamic progression enabled (implied by processMatchPostGame updates to players)
             updatedTeams[homeTeamIdx] = recalculateTeamStrength(h);
             updatedTeams[awayTeamIdx] = recalculateTeamStrength(a);
        }

        // 4. Update Manager Stats & TRUST LOGIC (NEW ODDS BASED SYSTEM)
        let updatedManager = { ...gameState.manager! };
        const myTeamId = gameState.myTeamId;
        const isHome = currentFixture.homeTeamId === myTeamId;
        const myScore = isHome ? hScore : aScore;
        const oppScore = isHome ? aScore : hScore;
        
        // Result
        let res: 'WIN' | 'DRAW' | 'LOSS' = 'DRAW';
        if (myScore > oppScore) res = 'WIN';
        else if (myScore < oppScore) res = 'LOSS';
        
        // PK Check for result determination (Trust calculation considers PK win as Win usually, or Draw depending on philosophy. Here we treat PK win as Win)
        if (myScore === oppScore && stats.pkHome !== undefined && stats.pkAway !== undefined) {
             const myPk = isHome ? stats.pkHome : stats.pkAway;
             const oppPk = isHome ? stats.pkAway : stats.pkHome;
             if (myPk > oppPk) res = 'WIN';
             else res = 'LOSS';
        }

        updatedManager.stats.matchesManaged++;
        updatedManager.stats.goalsFor += myScore;
        updatedManager.stats.goalsAgainst += oppScore;
        if (res === 'WIN') updatedManager.stats.wins++;
        else if (res === 'DRAW') updatedManager.stats.draws++;
        else updatedManager.stats.losses++;

        // --- TRUST CALCULATION BASED ON ODDS ---
        if (hTeam && aTeam) {
            const odds = calculateOdds(hTeam, aTeam);
            const myOdd = isHome ? odds.home : odds.away;
            const oppOdd = isHome ? odds.away : odds.home;
            
            // "Diff" logic: 
            // If I am favorite (lower odd), OppOdd - MyOdd is Positive.
            // If Opponent is favorite (lower odd), OppOdd - MyOdd is Negative.
            const diff = oppOdd - myOdd;
            
            let baseBoardChange = 0;
            let baseFanChange = 0;

            // Scenario 1: Big Favorite (I am expected to win comfortably)
            // Condition: diff >= 0.30
            if (diff >= 0.30) {
                if (res === 'WIN') {
                    baseBoardChange = 2;
                    baseFanChange = 2;
                } else if (res === 'DRAW') {
                    baseBoardChange = -3;
                    baseFanChange = -3;
                } else { // LOSS
                    baseBoardChange = -5;
                    baseFanChange = -5;
                }
            } 
            // Scenario 2: Medium Favorite (Orta Favori)
            // Condition: 0.10 <= diff < 0.30
            else if (diff >= 0.10) {
                if (res === 'WIN') {
                    baseBoardChange = 3;
                    baseFanChange = 3;
                } else if (res === 'DRAW') {
                    baseBoardChange = -2;
                    baseFanChange = -2;
                } else { // LOSS
                    baseBoardChange = -3;
                    baseFanChange = -3;
                }
            }
            // Scenario 3: Opponent Big Favorite (I am Big Underdog)
            // Condition: diff <= -0.30
            else if (diff <= -0.30) {
                if (res === 'WIN') {
                    baseBoardChange = 6;
                    baseFanChange = 6;
                } else if (res === 'DRAW') {
                    baseBoardChange = 2;
                    baseFanChange = 2;
                } else { // LOSS
                    baseBoardChange = 0;
                    baseFanChange = -1;
                }
            }
            // Scenario 4: Opponent Slight Favorite (Rakip Hafif Favori)
            // Condition: -0.30 < diff <= -0.10
            else if (diff <= -0.10) {
                if (res === 'WIN') {
                    baseBoardChange = 4;
                    baseFanChange = 4;
                } else if (res === 'DRAW') {
                    baseBoardChange = 0;
                    baseFanChange = 0;
                } else { // LOSS
                    baseBoardChange = -2;
                    baseFanChange = -2;
                }
            }
            // Scenario 5: Balanced Match (Odds are close, within < 0.10 diff)
            // Expectation: Contest. 
            else {
                if (res === 'WIN') {
                    baseBoardChange = 3;
                    baseFanChange = 3;
                } else if (res === 'DRAW') {
                    baseBoardChange = 0;
                    baseFanChange = 0;
                } else { // LOSS
                    baseBoardChange = -3;
                    baseFanChange = -3;
                }
            }

            // Multipliers
            let multiplier = 1.0;

            // Derby Check
            const isDerby = RIVALRIES.some(pair => (pair.includes(hTeam!.name) && pair.includes(aTeam!.name)));
            if (isDerby) {
                multiplier = 2.0;
            }

            // Final Check
            // Weeks: 104 (Cup), 91 (Super Cup), 217 (Euro), 36 (Playoff)
            const isFinal = [104, 91, 217, 36].includes(currentFixture.week);
            if (isFinal) {
                multiplier = 2.0;
            }

            // Apply Multiplier and Round
            let finalBoardChange = Math.round(baseBoardChange * multiplier);
            let finalFanChange = Math.round(baseFanChange * multiplier);

            // --- CRISIS MODE LOGIC ---
            // 1. Get previous 4 matches for user team
            const previousMatches = gameState.fixtures
                .filter(f => f.played && (f.homeTeamId === myTeamId || f.awayTeamId === myTeamId) && f.id !== fId)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 4);

            // 2. Build history array including current result (res)
            const historyToCheck = [res];
            previousMatches.forEach(pm => {
                const isPmHome = pm.homeTeamId === myTeamId;
                const pmMyScore = isPmHome ? pm.homeScore! : pm.awayScore!;
                const pmOppScore = isPmHome ? pm.awayScore! : pm.homeScore!;
                
                if (pmMyScore > pmOppScore) historyToCheck.push('WIN');
                else if (pmMyScore === pmOppScore) historyToCheck.push('DRAW');
                else historyToCheck.push('LOSS');
            });

            // 3. Check Condition: Last 5 matches exist and NO WINS (Loss or Draw counts as crisis)
            // Note: If less than 5 matches played total, crisis mode is effectively disabled (safe).
            const isCrisis = historyToCheck.length >= 5 && !historyToCheck.includes('WIN');

            // 4. Apply Crisis Effects (Double Negative Impact)
            if (isCrisis) {
                if (finalBoardChange < 0) finalBoardChange *= 2;
                if (finalFanChange < 0) finalFanChange *= 2;
            }
            // -------------------------

            // Update Trust
            updatedManager.trust.board = Math.max(0, Math.min(100, updatedManager.trust.board + finalBoardChange));
            updatedManager.trust.fans = Math.max(0, Math.min(100, updatedManager.trust.fans + finalFanChange));
        }

        // --- AGGREGATE SCORE CALCULATION (For 2nd Legs) ---
        let aggregateScore = null;
        if (currentFixture.competitionId === 'EUROPE' && [210, 212, 214, 216].includes(currentFixture.week)) {
             const prevWeek = currentFixture.week - 1;
             
             // STRICT LOOKUP: Match by IDs reversed (Leg 1: Current Away was Home, Current Home was Away)
             const prevFixture = gameState.fixtures.find(f => 
                f.competitionId === 'EUROPE' && 
                f.week === prevWeek && 
                f.homeTeamId === currentFixture.awayTeamId && // Leg 1 Home = Leg 2 Away
                f.awayTeamId === currentFixture.homeTeamId && // Leg 1 Away = Leg 2 Home
                f.played
             );
             
             if (prevFixture) {
                 // Current Home Team (B) Total = Current Match Home Score (B) + Previous Match Away Score (B)
                 const totalHome = hScore + (prevFixture.awayScore || 0);
                 
                 // Current Away Team (A) Total = Current Match Away Score (A) + Previous Match Home Score (A)
                 const totalAway = aScore + (prevFixture.homeScore || 0);
                 
                 aggregateScore = { home: totalHome, away: totalAway };
             }
        }

        // --- TROPHY CHECK ---
        let wonTrophy: SeasonChampion | null = null;
        if (currentFixture.week === 104 && currentFixture.competitionId === 'CUP' && res === 'WIN') {
            // Cup Final
            const t = updatedTeams.find(x => x.id === myTeamId);
            if(t) {
                wonTrophy = {
                    teamId: t.id,
                    teamName: t.name,
                    logo: t.logo,
                    colors: t.colors,
                    season: new Date(gameState.currentDate).getFullYear().toString()
                };
                t.domesticCups++;
                updatedManager.stats.domesticCups++;
                updatedManager.stats.trophies++;
            }
        } else if (currentFixture.week === 91 && currentFixture.competitionId === 'SUPER_CUP' && res === 'WIN') {
             // Super Cup Final
             const t = updatedTeams.find(x => x.id === myTeamId);
             if(t) {
                wonTrophy = {
                    teamId: t.id,
                    teamName: t.name,
                    logo: t.logo,
                    colors: t.colors,
                    season: new Date(gameState.currentDate).getFullYear().toString()
                };
                t.superCups++;
                // Manager stats for super cup? usually counts as domestic or trophy.
                updatedManager.stats.trophies++;
            }
        } else if (currentFixture.week === 217 && currentFixture.competitionId === 'EUROPE' && res === 'WIN') {
            // Euro Final
             const t = updatedTeams.find(x => x.id === myTeamId);
             if(t) {
                wonTrophy = {
                    teamId: t.id,
                    teamName: t.name,
                    logo: t.logo,
                    colors: t.colors,
                    season: new Date(gameState.currentDate).getFullYear().toString()
                };
                t.europeanCups++;
                updatedManager.stats.europeanCups++;
                updatedManager.stats.trophies++;
            }
        } else if (currentFixture.competitionId === 'PLAYOFF_FINAL' && res === 'WIN') {
            // Playoff Final (Promotion)
             const t = updatedTeams.find(x => x.id === myTeamId);
             if(t) {
                wonTrophy = {
                    teamId: t.id,
                    teamName: t.name,
                    logo: t.logo,
                    colors: t.colors,
                    season: new Date(gameState.currentDate).getFullYear().toString()
                };
                // Not really a major trophy in stats usually but counts as success
                updatedManager.stats.trophies++; // Promotion trophy
            }
        }

        if (wonTrophy) {
            updatedManager.trust.board = 100;
            updatedManager.trust.fans = 100;
        }

        // Save Result Data for Modal
        coreSetters.setMatchResultData({
            homeTeam: updatedTeams.find(t => t.id === currentFixture.homeTeamId),
            awayTeam: updatedTeams.find(t => t.id === currentFixture.awayTeamId),
            homeScore: hScore,
            awayScore: aScore,
            stats: stats,
            events: events,
            competitionId: currentFixture.competitionId,
            aggregateScore: aggregateScore // Pass aggregate score to modal
        });

        setGameState(prev => ({
            ...prev,
            fixtures: prev.fixtures.map(f => f.id === fId ? updatedFixture : f),
            teams: updatedTeams,
            manager: updatedManager,
            seasonChampion: wonTrophy || prev.seasonChampion,
            activeFixtureId: null // Clear active match
        }));

        navigation.navigateTo('match_result');
    };

    const handleFastSimulate = (fixtureId?: string) => {
        const fId = fixtureId || gameState.activeFixtureId;
        if (!fId) return;

        const fixture = gameState.fixtures.find(f => f.id === fId);
        if (!fixture) return;

        const homeTeam = gameState.teams.find(t => t.id === fixture.homeTeamId)!;
        const awayTeam = gameState.teams.find(t => t.id === fixture.awayTeamId)!;
        
        const isKnockout = ['CUP', 'SUPER_CUP', 'PLAYOFF', 'PLAYOFF_FINAL', 'EUROPE'].includes(fixture.competitionId || '');
        
        let effectiveKnockout = false;
        let firstLegScore = undefined;

        if (fixture.competitionId === 'EUROPE') {
             if (fixture.week === 217) {
                 effectiveKnockout = true; // Final
             } else if ([210, 212, 214, 216].includes(fixture.week)) {
                 // 2nd Leg logic
                 effectiveKnockout = true;
                 // Find 1st leg score
                 const prevWeek = fixture.week - 1;
                 const prevFixture = gameState.fixtures.find(f => 
                    f.competitionId === 'EUROPE' &&
                    f.week === prevWeek &&
                    f.homeTeamId === fixture.awayTeamId && // Swapped
                    f.awayTeamId === fixture.homeTeamId &&
                    f.played
                 );
                 if (prevFixture) {
                     firstLegScore = { home: prevFixture.homeScore!, away: prevFixture.awayScore! };
                 }
             }
             // 1st legs (209, 211, 213, 215) default to effectiveKnockout = false
        } else {
             // Domestic Cups (Assumed Single Leg for now based on generation)
             effectiveKnockout = isKnockout;
        }

        const result = simulateBackgroundMatch(homeTeam, awayTeam, effectiveKnockout, firstLegScore);

        handleMatchFinish(result.homeScore, result.awayScore, result.events, result.stats, fId);
    };

    const handleInterviewComplete = (effect: any, relatedPlayerId?: string) => {
        setGameState(prev => {
            let updatedManager = { ...prev.manager! };
            let updatedTeams = [...prev.teams];

            if (effect.trustUpdate) {
                if (effect.trustUpdate.board) updatedManager.trust.board = Math.max(0, Math.min(100, updatedManager.trust.board + effect.trustUpdate.board));
                if (effect.trustUpdate.fans) updatedManager.trust.fans = Math.max(0, Math.min(100, updatedManager.trust.fans + effect.trustUpdate.fans));
                if (effect.trustUpdate.players) updatedManager.trust.players = Math.max(0, Math.min(100, updatedManager.trust.players + effect.trustUpdate.players));
                if (effect.trustUpdate.referees) updatedManager.trust.referees = Math.max(0, Math.min(100, updatedManager.trust.referees + effect.trustUpdate.referees));
                if (effect.trustUpdate.media) updatedManager.trust.media = Math.max(0, Math.min(100, (updatedManager.trust.media || 50) + effect.trustUpdate.media));
            }

            if (effect.teamMorale) {
                const myTeamIndex = updatedTeams.findIndex(t => t.id === prev.myTeamId);
                if (myTeamIndex !== -1) {
                    updatedTeams[myTeamIndex] = {
                        ...updatedTeams[myTeamIndex],
                        players: updatedTeams[myTeamIndex].players.map(p => ({
                            ...p,
                            morale: Math.max(0, Math.min(100, p.morale + effect.teamMorale))
                        })),
                        morale: Math.max(0, Math.min(100, updatedTeams[myTeamIndex].morale + effect.teamMorale))
                    };
                }
            }
            
            if (effect.playerMorale && relatedPlayerId) {
                const myTeamIndex = updatedTeams.findIndex(t => t.id === prev.myTeamId);
                if (myTeamIndex !== -1) {
                     updatedTeams[myTeamIndex] = {
                        ...updatedTeams[myTeamIndex],
                        players: updatedTeams[myTeamIndex].players.map(p => {
                            if (p.id === relatedPlayerId) {
                                return { ...p, morale: Math.max(0, Math.min(100, p.morale + effect.playerMorale)) };
                            }
                            return p;
                        })
                    };
                }
            }

            return {
                ...prev,
                manager: updatedManager,
                teams: updatedTeams
            };
        });

        navigation.navigateTo('home'); // Return to home after interview
        coreSetters.setMatchResultData(null); // Clear result data
    };

    const handleSkipInterview = () => {
        // Penalty for skipping: -3 Media Trust
        setGameState(prev => ({
            ...prev,
            manager: {
                ...prev.manager!,
                trust: {
                    ...prev.manager!.trust,
                    media: Math.max(0, (prev.manager!.trust.media || 50) - 3)
                }
            }
        }));
        navigation.navigateTo('home');
        coreSetters.setMatchResultData(null);
    };

    return {
        handleMatchFinish,
        handleFastSimulate,
        handleInterviewComplete,
        handleSkipInterview
    };
};
