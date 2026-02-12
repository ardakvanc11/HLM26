
import React from 'react';
import { GameState, MatchEvent, MatchStats, Team, Fixture, SeasonChampion } from '../types';
import { processMatchPostGame, simulateBackgroundMatch, recalculateTeamStrength } from '../utils/gameEngine';

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

        if (homeTeamIdx !== -1 && awayTeamIdx !== -1) {
            const h = updatedTeams[homeTeamIdx];
            const a = updatedTeams[awayTeamIdx];

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

        // 4. Update Manager Stats
        let updatedManager = { ...gameState.manager! };
        const myTeamId = gameState.myTeamId;
        const isHome = currentFixture.homeTeamId === myTeamId;
        const myScore = isHome ? hScore : aScore;
        const oppScore = isHome ? aScore : hScore;
        
        let res: 'WIN' | 'DRAW' | 'LOSS' = 'DRAW';
        if (myScore > oppScore) res = 'WIN';
        else if (myScore < oppScore) res = 'LOSS';
        
        // PK Check
        if (myScore === oppScore && stats.pkHome !== undefined && stats.pkAway !== undefined) {
             const myPk = isHome ? stats.pkHome : stats.pkAway;
             const oppPk = isHome ? stats.pkAway : stats.pkHome;
             if (myPk > oppPk) res = 'WIN';
             else res = 'LOSS';
        }

        updatedManager.stats.matchesManaged++;
        updatedManager.stats.goalsFor += myScore;
        updatedManager.stats.goalsAgainst += oppScore;
        
        if (res === 'WIN') {
            updatedManager.trust.board = Math.min(100, updatedManager.trust.board + 2);
            updatedManager.trust.fans = Math.min(100, updatedManager.trust.fans + 3);
            updatedManager.stats.wins++;
        } else if (res === 'DRAW') updatedManager.stats.draws++;
        else {
            updatedManager.trust.board = Math.max(0, updatedManager.trust.board - 2);
            
            // Avrupa maçlarında yenilgi taraftar güvenini %50 daha az düşürür (Normalde 5, Avrupa'da 2)
            const isEurope = currentFixture.competitionId === 'EUROPE';
            const fanTrustDrop = isEurope ? 2 : 5;

            updatedManager.trust.fans = Math.max(0, updatedManager.trust.fans - fanTrustDrop);
            updatedManager.stats.losses++;
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
            competitionId: currentFixture.competitionId
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
        const effectiveKnockout = isKnockout && (fixture.competitionId !== 'EUROPE' || fixture.week > 208); // Euro only KO after groups

        const result = simulateBackgroundMatch(homeTeam, awayTeam, effectiveKnockout);

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
