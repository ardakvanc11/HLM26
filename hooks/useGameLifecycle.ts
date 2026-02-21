
import React, { useEffect, useRef, useCallback } from 'react';
import { GameState, HolidayType } from '../types';
import { initializeTeams } from '../data/teamConstants';
import { GAME_CALENDAR } from '../data/gameConstants';
import { generateFixtures, generateTransferMarket, generateWeeklyNews, generateSuperCupFixtures, isSameDay, addDays } from '../utils/gameEngine';
import { calculateManagerSalary } from '../utils/teamCalculations';
import { processNextDayLogic } from '../utils/gameStateLogic';
import { INITIAL_MESSAGES } from '../data/messagePool';
import { saveGameToDB, loadGameFromDB, clearGameFromDB } from '../utils/dbHelper';

export const useGameLifecycle = (
    gameState: GameState,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    navigation: any,
    coreSetters: any
) => {
    const stateRef = useRef(gameState);
    useEffect(() => {
        stateRef.current = gameState;
    }, [gameState]);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (gameState.isGameStarted) {
            interval = setInterval(() => {
                setGameState(prev => ({
                    ...prev,
                    playTime: (prev.playTime || 0) + 1
                }));
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [gameState.isGameStarted, setGameState]);

    // --- HOLIDAY SIMULATION LOOP ---
    useEffect(() => {
        let timer: any;
        
        if (gameState.activeHoliday) {
            timer = setInterval(() => {
                const current = stateRef.current; // Access latest state
                if (!current.activeHoliday) {
                    clearInterval(timer);
                    return;
                }

                const config = current.activeHoliday;

                // --- SPECIAL CHECK FOR 'NEXT MATCH' STOP CONDITION ---
                // Bir sonraki gün maç olup olmadığını kontrol et.
                // Eğer varsa, günü "normal" (tatilsiz) olarak ilerlet ve tatili durdur.
                // Böylece processNextDayLogic maçı simüle etmez (çünkü activeHoliday null olarak gönderilir).
                if (config.type === HolidayType.NEXT_MATCH) {
                    const nextDateStr = addDays(current.currentDate, 1);
                    const matchNextDay = current.fixtures.find(f => 
                        (f.homeTeamId === current.myTeamId || f.awayTeamId === current.myTeamId) &&
                        !f.played &&
                        isSameDay(f.date, nextDateStr)
                    );

                    if (matchNextDay) {
                        // Tatil modunu geçici olarak devre dışı bırakarak günü ilerlet
                        const stateAsIfNormal = { ...current, activeHoliday: null };
                        
                        const result = processNextDayLogic(stateAsIfNormal, (reason) => {
                            coreSetters.setGameOverReason(reason);
                            navigation.setViewHistory(['game_over']);
                            navigation.setHistoryIndex(0);
                            setGameState(prev => ({ ...prev, activeHoliday: null }));
                        });

                        if (result) {
                            setGameState(prev => ({
                                ...prev,
                                ...result,
                                activeFixtureId: null,
                                activeHoliday: null // Tatili tamamen durdur
                            }));
                        } else {
                            // Game Over during transition
                            clearInterval(timer);
                            return;
                        }
                        clearInterval(timer);
                        return; // Döngüyü kır
                    }
                }

                // Check Other Stop Conditions
                let shouldStop = false;
                const today = new Date(current.currentDate);

                // --- MANDATORY STOP ON JULY 1ST (NEW SEASON) ---
                // Force stop if the NEXT day is July 1st.
                // This ensures the holiday simulation halts right before the heavy season transition logic runs.
                // The user will see June 30th and must click "Next" manually to trigger the new season.
                const checkNextDay = new Date(today);
                checkNextDay.setDate(checkNextDay.getDate() + 1);
                
                if (checkNextDay.getMonth() === 6 && checkNextDay.getDate() === 1) {
                    shouldStop = true;
                }

                if (!shouldStop) {
                    if (config.type === HolidayType.DATE && config.targetDate) {
                        const target = new Date(config.targetDate);
                        if (today >= target) shouldStop = true;
                    } 
                    else if (config.type === HolidayType.DURATION && config.days !== undefined) {
                        if (config.days <= 0) shouldStop = true;
                    }
                    // Fallback for NEXT_MATCH (e.g. if already on match day)
                    else if (config.type === HolidayType.NEXT_MATCH) {
                        const matchToday = current.fixtures.find(f => 
                            (f.homeTeamId === current.myTeamId || f.awayTeamId === current.myTeamId) &&
                            !f.played &&
                            isSameDay(f.date, current.currentDate)
                        );
                        if (matchToday) shouldStop = true;
                    }
                }

                if (shouldStop) {
                    // Stop holiday
                    setGameState(prev => ({ ...prev, activeHoliday: null }));
                    clearInterval(timer);
                    return;
                }

                // Execute Next Day Logic (Standard Holiday Processing)
                const result = processNextDayLogic(current, (reason) => {
                    coreSetters.setGameOverReason(reason);
                    navigation.setViewHistory(['game_over']);
                    navigation.setHistoryIndex(0);
                    setGameState(prev => ({ ...prev, activeHoliday: null }));
                });

                if (result) {
                    setGameState(prev => {
                        const newDays = prev.activeHoliday?.type === HolidayType.DURATION ? (prev.activeHoliday.days || 1) - 1 : prev.activeHoliday?.days;
                        
                        return {
                            ...prev,
                            ...result,
                            activeFixtureId: null, // Clear active match if simulating over it
                            activeHoliday: prev.activeHoliday ? { ...prev.activeHoliday, days: newDays } : null
                        };
                    });
                } else {
                    // Game Over occurred (result is null). Stop holiday immediately.
                    clearInterval(timer);
                    return;
                }

            }, 50); // 50ms per day simulation speed
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [gameState.activeHoliday, setGameState, coreSetters, navigation]);


    // Load Game Logic - Updated to IndexedDB
    useEffect(() => {
        const initLoad = async () => {
            const parsed = await loadGameFromDB();
            if(parsed) {
                try {
                    // Migration ve Eksik Veri Kontrolleri
                    if (typeof parsed.playTime === 'undefined') parsed.playTime = 0;
                    if (typeof parsed.lastSeenInjuryCount === 'undefined') parsed.lastSeenInjuryCount = 0;
                    if (!parsed.currentDate) parsed.currentDate = GAME_CALENDAR.START_DATE.toISOString();
                    if (!parsed.pendingTransfers) parsed.pendingTransfers = [];
                    if (!parsed.incomingOffers) parsed.incomingOffers = [];
                    if (!parsed.seasonChampion) parsed.seasonChampion = null;
                    if (typeof parsed.championDeclaredThisSeason === 'undefined') parsed.championDeclaredThisSeason = false;
                    if (typeof parsed.activeFixtureId === 'undefined') parsed.activeFixtureId = null;
                    if (typeof parsed.activeHoliday === 'undefined') parsed.activeHoliday = null;
                    
                    if (parsed.manager && parsed.manager.stats) {
                        if (typeof parsed.manager.stats.leagueTitles === 'undefined') parsed.manager.stats.leagueTitles = 0;
                        if (typeof parsed.manager.stats.domesticCups === 'undefined') parsed.manager.stats.domesticCups = 0;
                        if (typeof parsed.manager.stats.europeanCups === 'undefined') parsed.manager.stats.europeanCups = 0;
                        if (typeof parsed.manager.stats.careerEarnings === 'undefined') parsed.manager.stats.careerEarnings = 0;
                        if (typeof parsed.manager.stats.transferSpendThisMonth === 'undefined') parsed.manager.stats.transferSpendThisMonth = 0;
                        if (typeof parsed.manager.stats.transferIncomeThisMonth === 'undefined') parsed.manager.stats.transferIncomeThisMonth = 0;
                    }
                    
                    if (parsed.manager && !parsed.manager.staffRelations) {
                        parsed.manager.staffRelations = [
                            { id: '1', name: 'Ahmet Arslan', role: 'Kulüp Başkanı', value: 50, avatarColor: 'bg-indigo-600' },
                            { id: '2', name: 'Mert Yılmaz', role: 'Yardımcı Antrenör', value: 50, avatarColor: 'bg-emerald-600' },
                            { id: '3', name: 'Caner Kurt', role: 'Sportif Direktör', value: 50, avatarColor: 'bg-blue-600' },
                            { id: '4', name: 'Hüseyin Çelik', role: 'Şef Gözlemci', value: 50, avatarColor: 'bg-amber-600' },
                            { id: '5', name: 'Selim Özer', role: 'Kondisyoner', value: 50, avatarColor: 'bg-rose-600' }
                        ];
                    }

                    if (parsed.teams) {
                        parsed.teams = parsed.teams.map((t: any, index: number) => {
                            if (!t.leagueId) {
                                t.leagueId = index < 18 ? 'LEAGUE' : 'LEAGUE_1';
                            }
                            if (!t.financialRecords) {
                                t.financialRecords = {
                                    income: { transfers: 0, tv: 0, merch: 0, loca: 0, gate: 0, sponsor: 0 },
                                    expense: { wages: 0, transfers: 0, staff: 0, maint: 0, academy: 0, debt: 0, matchDay: 0, travel: 0, scouting: 0, admin: 0, bonus: 0, fines: 0 }
                                };
                            }
                            if (!t.transferHistory) t.transferHistory = [];
                            if (!t.sponsors) {
                                t.sponsors = {
                                    main: { name: 'HAYVANLAR HOLDING', yearlyValue: 15, expiryYear: 2026 },
                                    stadium: { name: t.stadiumName, yearlyValue: 7, expiryYear: 2026 },
                                    sleeve: { name: 'Süper Toto', yearlyValue: 3, expiryYear: 2026 }
                                };
                            }
                            return t;
                        });
                    }

                    setGameState(parsed);
                    
                    if(parsed.isGameStarted) {
                        navigation.setViewHistory(['home']);
                        navigation.setHistoryIndex(0);
                    }
                } catch(e) { 
                    console.error("Save load processing failed", e); 
                }
            }
        };
        initLoad();
    }, []);

    const handleStart = (name: string, year: string, country: string) => {
        const teams = initializeTeams();
        const superLeagueTeams = teams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
        const league1Teams = teams.filter(t => t.leagueId === 'LEAGUE_1');
        
        const fixturesSL = generateFixtures(superLeagueTeams, 2025, 'LEAGUE');
        const fixturesL1 = generateFixtures(league1Teams, 2025, 'LEAGUE_1');
        const fixturesSuperCup = generateSuperCupFixtures(superLeagueTeams, 2025, true);
        
        const fixtures = [...fixturesSL, ...fixturesL1, ...fixturesSuperCup];

        const marketCount = Math.floor(Math.random() * 1001) + 5000;
        const transferList = generateTransferMarket(marketCount, GAME_CALENDAR.START_DATE.toISOString());
        const news = generateWeeklyNews(1, fixtures, teams);

        const birthYear = parseInt(year) || 1980;
        const currentAge = 2025 - birthYear;

        const newState: GameState = {
            managerName: name,
            manager: {
                name,
                age: Math.max(18, Math.min(100, currentAge)),
                nationality: country,
                power: 50,
                stats: { 
                    matchesManaged: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, 
                    trophies: 0, leagueTitles: 0, domesticCups: 0, europeanCups: 0,
                    playersBought: 0, playersSold: 0, moneySpent: 0, moneyEarned: 0,
                    transferSpendThisMonth: 0, transferIncomeThisMonth: 0, recordTransferFee: 0, careerEarnings: 0
                },
                contract: { salary: 1.5, expires: 2027, teamName: '' },
                trust: { board: 50, fans: 50, players: 50, referees: 50, media: 50 },
                playerRelations: [],
                staffRelations: [
                    { id: '1', name: 'Ahmet Arslan', role: 'Kulüp Başkanı', value: 50, avatarColor: 'bg-indigo-600' },
                    { id: '2', name: 'Mert Yılmaz', role: 'Yardımcı Antrenör', value: 50, avatarColor: 'bg-emerald-600' },
                    { id: '3', name: 'Caner Kurt', role: 'Sportif Direktör', value: 50, avatarColor: 'bg-blue-600' },
                    { id: '4', name: 'Hüseyin Çelik', role: 'Şef Gözlemci', value: 50, avatarColor: 'bg-amber-600' },
                    { id: '5', name: 'Selim Özer', role: 'Kondisyoner', value: 50, avatarColor: 'bg-rose-600' }
                ],
                history: []
            },
            myTeamId: null,
            currentWeek: 1,
            currentDate: GAME_CALENDAR.START_DATE.toISOString(),
            teams,
            fixtures,
            messages: INITIAL_MESSAGES,
            isGameStarted: false,
            transferList,
            trainingPerformed: false,
            news,
            playTime: 0,
            lastSeenInjuryCount: 0,
            pendingTransfers: [],
            incomingOffers: [],
            seasonChampion: null,
            championDeclaredThisSeason: false,
            lastSeasonSummary: null,
            consecutiveFfpYears: 0,
            yearsAtCurrentClub: 0,
            lastSeasonGoalAchieved: false,
            activeFixtureId: null,
            activeHoliday: null
        };
        setGameState(newState);
        navigation.navigateTo('team_select');
    };

    const handleSelectTeam = (id: string) => {
        const selectedTeam = gameState.teams.find(t => t.id === id);
        const salary = selectedTeam ? calculateManagerSalary(selectedTeam.strength) : 1.5;

        setGameState(prev => ({
            ...prev,
            myTeamId: id,
            isGameStarted: true,
            manager: prev.manager ? { 
                ...prev.manager, 
                contract: { 
                    ...prev.manager.contract, 
                    teamName: selectedTeam?.name || '',
                    salary: salary
                } 
            } : null
        }));
        navigation.setViewHistory(['home']);
        navigation.setHistoryIndex(0);
    };

    const handleSave = useCallback(async () => {
        if (!stateRef.current) return;
        const success = await saveGameToDB(stateRef.current);
        if (!success) {
            alert("Oyun kaydedilemedi! Bir hata oluştu.");
        }
    }, []);

    const handleNewGame = async () => {
        await clearGameFromDB();
        setGameState({
            managerName: null, manager: null, myTeamId: null, currentWeek: 1,
            currentDate: GAME_CALENDAR.START_DATE.toISOString(), teams: [], fixtures: [],
            messages: [], isGameStarted: false, transferList: [], trainingPerformed: false,
            news: [], playTime: 0, lastSeenInjuryCount: 0, pendingTransfers: [], incomingOffers: [], 
            seasonChampion: null, championDeclaredThisSeason: false, lastSeasonSummary: null, consecutiveFfpYears: 0, yearsAtCurrentClub: 0, lastSeasonGoalAchieved: false,
            activeFixtureId: null, activeHoliday: null
        });
        
        coreSetters.setSelectedPlayerForDetail(null);
        coreSetters.setSelectedTeamForDetail(null);
        coreSetters.setMatchResultData(null);
        coreSetters.setSelectedFixtureForDetail(null);
        coreSetters.setSelectedFixtureInfo(null);
        coreSetters.setGameOverReason(null);
        
        navigation.setViewHistory(['intro']);
        navigation.setHistoryIndex(0);
    };

    const handleNextWeek = () => {
        const result = processNextDayLogic(gameState, (reason) => {
            coreSetters.setGameOverReason(reason);
            navigation.setViewHistory(['game_over']);
            navigation.setHistoryIndex(0);
        });

        if (result) {
            setGameState(prev => {
                const nextState = { ...prev, ...result };
                nextState.activeFixtureId = null;

                if (nextState.pendingTransfers && nextState.pendingTransfers.length > 0) {
                    const pending = nextState.pendingTransfers[0];
                    coreSetters.setIncomingTransfer(pending);
                    setTimeout(() => navigation.navigateTo('contract_negotiation'), 100);
                } else {
                    navigation.navigateTo('home');
                }
                return nextState;
            });
        }
    };

    const handleRetire = () => {
        coreSetters.setGameOverReason("Kendi isteğinle emekliye ayrıldın. Futbol dünyası başarılarını asla unutmayacak.");
        navigation.setViewHistory(['game_over']);
        navigation.setHistoryIndex(0);
    };

    const handleTerminateContract = () => {
        coreSetters.setGameOverReason("Sözleşmeni tek taraflı feshettin. Kulüp yönetimi ve taraftarlar bu ani ayrılık karşısında şokta.");
        navigation.setViewHistory(['game_over']);
        navigation.setHistoryIndex(0);
    };

    return {
        handleStart,
        handleSelectTeam,
        handleSave,
        handleNewGame,
        handleNextWeek,
        handleRetire,
        handleTerminateContract
    };
};
