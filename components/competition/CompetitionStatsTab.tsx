
import React, { useState, useMemo } from 'react';
import { Player, Team, Fixture, Position } from '../../types';
import { Goal, Star, Zap, Shield, Award, AlertTriangle, BarChart2, User, Trophy, PlayCircle, Target, Footprints, ShieldCheck, Activity, MousePointerClick, MoveRight, CheckCircle2, Maximize2, Minimize2, X, Ban, ChevronRight, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Users, Wallet, CreditCard, Ticket, Hand } from 'lucide-react';
import PlayerFace from '../shared/PlayerFace';
import { getFormattedDate } from '../../utils/calendarAndFixtures';
import { calculatePlayerWage } from '../../utils/teamCalculations';
import { COUNTRY_CODES } from '../../data/uiConstants';

interface CompetitionStatsTabProps {
    teams: Team[];
    fixtures: Fixture[];
    competitionId: string;
    onPlayerClick: (p: Player) => void;
    onTeamClick: (id: string) => void;
    currentWeek: number;
    currentDate: string; // NEW: Sezon filtresi için gerekli
}

// Takım Kategori Tanımları
const CATEGORIES = {
    GENERAL: { label: 'Genel', icon: Activity },
    FORM: { label: 'Form', icon: TrendingUp },
    ATTACK: { label: 'Hücum', icon: Target },
    DEFENSE: { label: 'Savunma', icon: Shield },
    ATTENDANCE: { label: 'Seyirci', icon: Users },
    FINANCE: { label: 'Finans', icon: Wallet },
};

// Oyuncu Kategori Tanımları (GÜNCELLENDİ)
const PLAYER_CATEGORIES = {
    GENERAL: { label: 'Genel', icon: Star },
    ATTACK: { label: 'Hücum', icon: Target },
    DEFENSE: { label: 'Savunma', icon: Shield },
    GOALKEEPING: { label: 'Kalecilik', icon: Hand },
};

const CompetitionStatsTab: React.FC<CompetitionStatsTabProps> = ({ teams, fixtures, competitionId, onPlayerClick, onTeamClick, currentWeek, currentDate }) => {
    const [viewMode, setViewMode] = useState<'TEAM' | 'PLAYER'>('TEAM');
    
    // Modal States
    const [showTeamStatsModal, setShowTeamStatsModal] = useState(false);
    const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(false);
    const [showInjuryModal, setShowInjuryModal] = useState(false);
    
    // Team Modal Internal State
    const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORIES>('GENERAL');
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [selectedStatKey, setSelectedStatKey] = useState<string>('avgPossession');

    // Player Modal Internal State
    const [activePlayerCategory, setActivePlayerCategory] = useState<keyof typeof PLAYER_CATEGORIES>('GENERAL');
    const [isPlayerCategoryMenuOpen, setIsPlayerCategoryMenuOpen] = useState(false);
    const [selectedPlayerStatKey, setSelectedPlayerStatKey] = useState<string>('avgRating');

    // --- SEASON FILTER LOGIC ---
    const currentSeasonStartYear = useMemo(() => {
        const d = new Date(currentDate);
        // Eğer ay Temmuz (6) veya sonrasıysa, sezon yılı o yıldır. Değilse bir önceki yıldır.
        return d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    }, [currentDate]);

    // Filter relevant fixtures FOR CURRENT SEASON ONLY
    const compFixtures = useMemo(() => fixtures.filter(f => 
        f.played && 
        (
            (competitionId === 'LEAGUE' ? (f.competitionId === 'LEAGUE' || !f.competitionId) : f.competitionId === competitionId) ||
            (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL')
        ) &&
        // SEZON KONTROLÜ
        (() => {
            const fd = new Date(f.date);
            const fYear = fd.getMonth() >= 6 ? fd.getFullYear() : fd.getFullYear() - 1;
            return fYear === currentSeasonStartYear;
        })()
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [fixtures, competitionId, currentSeasonStartYear]);

    // --- IDENTIFY PARTICIPATING TEAMS (CRITICAL FIX) ---
    // Only teams that have a fixture in this competition or belong to the league should be shown
    const participatingTeamIds = useMemo(() => {
        const ids = new Set<string>();
        
        // 1. Add teams from Fixtures (Played or Unplayed) - Check ALL fixtures for participants, not just current season played
        const relevantFixtures = fixtures.filter(f => 
            (competitionId === 'LEAGUE' ? (f.competitionId === 'LEAGUE' || !f.competitionId) : f.competitionId === competitionId) ||
            (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL')
        );
        
        relevantFixtures.forEach(f => {
            // Sezon kontrolü buraya da eklenebilir ama takım listesi genelde sabittir.
            // Yine de o sezonun takımlarını göstermek daha doğru.
            const fd = new Date(f.date);
            const fYear = fd.getMonth() >= 6 ? fd.getFullYear() : fd.getFullYear() - 1;
            if (fYear === currentSeasonStartYear) {
                ids.add(f.homeTeamId);
                ids.add(f.awayTeamId);
            }
        });

        // 2. If it's a League, ensure all league members are included even if no fixtures generated yet
        if (competitionId === 'LEAGUE' || competitionId === 'LEAGUE_1') {
            teams.forEach(t => {
                if (competitionId === 'LEAGUE' && (t.leagueId === 'LEAGUE' || !t.leagueId)) ids.add(t.id);
                if (competitionId === 'LEAGUE_1' && t.leagueId === 'LEAGUE_1') ids.add(t.id);
            });
        }

        return ids;
    }, [fixtures, competitionId, teams, currentSeasonStartYear]);


    // --- TEAM STATS CALCULATION ---
    const teamStats = useMemo(() => {
        const statsMap = new Map<string, {
            id: string, name: string, logo?: string, colors: [string, string],
            goalsFor: number,
            possessionSum: number,
            gamesPlayed: number,
            shots: number,
            shotsOnTarget: number, 
            shotsConceded: number,
            shotsOnTargetConceded: number,
            yellows: number,
            reds: number,
            cleanSheets: number,
            goalsAgainst: number,
            won: number,
            drawn: number,
            lost: number,
            points: number,
            // Simulated / Derived Stats
            dribbles: number,
            passAccuracySum: number,
            tackles: number,
            tackleSuccessSum: number,
            aerialsWonSum: number,
            aerialsLostSum: number,
            fouls: number,
            blocks: number,
            interceptions: number,
            clearances: number,
            // Detailed Attack Stats
            xGSum: number,
            npxGSum: number,
            xGaSum: number,
            cornerGoals: number,
            freeKickGoals: number,
            possessionLostSum: number,
            // Detailed Defense Stats
            concededCornerGoals: number,
            concededFreeKickGoals: number,
            concededPenaltyGoals: number,
            // Attendance
            homeGames: number,
            attendanceSum: number,
            maxAttendance: number, // New
            minAttendance: number, // New
            stadiumCapacity: number,
            // Finance
            budget: number,
            squadValue: number,
            transferSpend: number, // NEW
            annualWages: number, // NEW
            // Match History for Form & Streaks
            matchHistory: { result: 'W'|'D'|'L', isHome: boolean, scored: number, conceded: number }[]
        }>();

        // Initialize Map ONLY for participating teams
        teams.forEach(t => {
            // STRICT FILTERING
            if (!participatingTeamIds.has(t.id)) return;
            
            const squadVal = t.players.reduce((acc, p) => acc + p.value, 0);
            
            // Calculate Annual Wages
            const annualWages = t.players.reduce((acc, p) => acc + (p.wage !== undefined ? p.wage : calculatePlayerWage(p)), 0);

            // Calculate Transfer Spend
            let transferSpend = 0;
            if (t.transferHistory) {
                t.transferHistory.forEach(h => {
                    if (h.type === 'BOUGHT') {
                         // Parse price string like "12.5 M€"
                         const val = parseFloat(h.price.replace(/[^0-9.]/g, ''));
                         if (!isNaN(val)) transferSpend += val;
                    }
                });
            }

            statsMap.set(t.id, {
                id: t.id, name: t.name, logo: t.logo, colors: t.colors,
                goalsFor: 0, possessionSum: 0, gamesPlayed: 0, shots: 0, shotsOnTarget: 0, shotsConceded: 0, shotsOnTargetConceded: 0,
                yellows: 0, reds: 0, cleanSheets: 0, goalsAgainst: 0,
                won: 0, drawn: 0, lost: 0, points: 0,
                dribbles: 0, passAccuracySum: 0, tackles: 0, tackleSuccessSum: 0, aerialsWonSum: 0, aerialsLostSum: 0, fouls: 0,
                blocks: 0, interceptions: 0, clearances: 0,
                xGSum: 0, npxGSum: 0, xGaSum: 0, cornerGoals: 0, freeKickGoals: 0, possessionLostSum: 0,
                concededCornerGoals: 0, concededFreeKickGoals: 0, concededPenaltyGoals: 0,
                homeGames: 0, attendanceSum: 0, maxAttendance: 0, minAttendance: 999999, stadiumCapacity: t.stadiumCapacity,
                budget: t.budget, squadValue: squadVal, transferSpend, annualWages,
                matchHistory: []
            });
        });

        compFixtures.forEach(f => {
            const h = statsMap.get(f.homeTeamId);
            const a = statsMap.get(f.awayTeamId);
            const s = f.stats;

            if (h && s) {
                h.gamesPlayed++;
                h.homeGames++;
                
                const seed = f.id.charCodeAt(0) + (f.homeScore || 0);
                const randomFill = 0.6 + ((seed % 35) / 100); 
                const attendance = Math.floor(h.stadiumCapacity * randomFill);
                
                h.attendanceSum += attendance;
                if (attendance > h.maxAttendance) h.maxAttendance = attendance;
                if (attendance < h.minAttendance) h.minAttendance = attendance;

                h.goalsFor += f.homeScore!;
                h.goalsAgainst += f.awayScore!;
                h.possessionSum += s.homePossession;
                h.shots += s.homeShots;
                h.shotsOnTarget += s.homeShotsOnTarget;
                h.shotsConceded += s.awayShots;
                h.shotsOnTargetConceded += s.awayShotsOnTarget;
                h.yellows += s.homeYellowCards;
                h.reds += s.homeRedCards;
                h.fouls += s.homeFouls;
                
                let result: 'W'|'D'|'L' = 'D';
                if (f.homeScore! > f.awayScore!) { h.won++; h.points += 3; result='W'; }
                else if (f.homeScore === f.awayScore!) { h.drawn++; h.points += 1; result='D'; }
                else { h.lost++; result='L'; }
                
                if (f.awayScore === 0) h.cleanSheets++;

                h.matchHistory.push({ result, isHome: true, scored: f.homeScore!, conceded: f.awayScore! });

                h.dribbles += Math.floor(s.homeShots * 0.8) + (f.homeScore! * 2);
                h.tackles += (s.homeFouls * 1.5) + (s.homeYellowCards * 3) + 10;
                h.passAccuracySum += Math.min(95, 70 + (s.homePossession * 0.2) + (f.homeScore! * 1.5));
                h.aerialsWonSum += Math.floor(s.homeCorners * 1.5) + Math.floor(Math.random() * 5) + 5;
                
                h.blocks += Math.floor(s.awayShots * 0.25) + Math.floor(Math.random() * 3);
                h.interceptions += Math.floor((100 - s.homePossession) * 0.4) + Math.floor(Math.random() * 5);
                h.clearances += Math.floor((100 - s.homePossession) * 0.6) + Math.floor(Math.random() * 10);
                h.tackleSuccessSum += (60 + Math.random() * 25);
                h.aerialsLostSum += Math.floor(s.awayCorners * 1.5) + Math.floor(Math.random() * 5) + 3;

                const hXG = (s.homeShots * 0.06) + (s.homeShotsOnTarget * 0.15) + ((s.pkHome||0) * 0.76) + (f.homeScore! * 0.10);
                const hNpXG = (s.homeShots * 0.06) + (s.homeShotsOnTarget * 0.15) + (f.homeScore! * 0.10); 
                h.xGSum += hXG;
                h.npxGSum += hNpXG;

                const hXGA = (s.awayShots * 0.06) + (s.awayShotsOnTarget * 0.15) + ((s.pkAway||0) * 0.76) + (f.awayScore! * 0.10);
                h.xGaSum += hXGA;

                if (f.matchEvents) {
                    const homeGoalEvents = f.matchEvents.filter(e => e.type === 'GOAL' && e.teamName === h.name);
                    h.cornerGoals += homeGoalEvents.filter(e => e.assist === 'Korner' || e.description.toLowerCase().includes('korner')).length;
                    h.freeKickGoals += homeGoalEvents.filter(e => e.description.toLowerCase().includes('frikik') || e.description.toLowerCase().includes('serbest vuruş')).length;
                    
                    const awayGoalEvents = f.matchEvents.filter(e => e.type === 'GOAL' && e.teamName === a?.name);
                    h.concededCornerGoals += awayGoalEvents.filter(e => e.assist === 'Korner' || e.description.toLowerCase().includes('korner')).length;
                    h.concededFreeKickGoals += awayGoalEvents.filter(e => e.description.toLowerCase().includes('frikik') || e.description.toLowerCase().includes('serbest vuruş')).length;
                    h.concededPenaltyGoals += awayGoalEvents.filter(e => e.assist === 'Penaltı' || e.description.toLowerCase().includes('penaltı')).length;
                }

                const hPassAcc = Math.min(95, 70 + (s.homePossession * 0.2));
                const hLost = Math.floor((100 - hPassAcc) / 2) + Math.floor(s.homeShots * 0.3);
                h.possessionLostSum += hLost;
            }

            if (a && s) {
                a.gamesPlayed++;
                a.goalsFor += f.awayScore!;
                a.goalsAgainst += f.homeScore!;
                a.possessionSum += s.awayPossession;
                a.shots += s.awayShots;
                a.shotsOnTarget += s.awayShotsOnTarget;
                a.shotsConceded += s.homeShots;
                a.shotsOnTargetConceded += s.homeShotsOnTarget;
                a.yellows += s.awayYellowCards;
                a.reds += s.awayRedCards;
                a.fouls += s.awayFouls;

                let result: 'W'|'D'|'L' = 'D';
                if (f.awayScore! > f.homeScore!) { a.won++; a.points += 3; result='W'; }
                else if (f.awayScore === f.homeScore!) { a.drawn++; a.points += 1; result='D'; }
                else { a.lost++; result='L'; }

                if (f.homeScore === 0) a.cleanSheets++;

                a.matchHistory.push({ result, isHome: false, scored: f.awayScore!, conceded: f.homeScore! });

                a.dribbles += Math.floor(s.awayShots * 0.8) + (f.awayScore! * 2);
                a.tackles += (s.awayFouls * 1.5) + (s.awayYellowCards * 3) + 10;
                a.passAccuracySum += Math.min(95, 70 + (s.awayPossession * 0.2) + (f.awayScore! * 1.5));
                a.aerialsWonSum += Math.floor(s.awayCorners * 1.5) + Math.floor(Math.random() * 5) + 5;

                a.blocks += Math.floor(s.homeShots * 0.25) + Math.floor(Math.random() * 3);
                a.interceptions += Math.floor((100 - s.awayPossession) * 0.4) + Math.floor(Math.random() * 5);
                a.clearances += Math.floor((100 - s.awayPossession) * 0.6) + Math.floor(Math.random() * 10);
                a.tackleSuccessSum += (60 + Math.random() * 25);
                a.aerialsLostSum += Math.floor(s.homeCorners * 1.5) + Math.floor(Math.random() * 5) + 3;

                const aXG = (s.awayShots * 0.06) + (s.awayShotsOnTarget * 0.15) + ((s.pkAway||0) * 0.76) + (f.awayScore! * 0.10);
                const aNpXG = (s.awayShots * 0.06) + (s.awayShotsOnTarget * 0.15) + (f.awayScore! * 0.10);
                a.xGSum += aXG;
                a.npxGSum += aNpXG;

                const aXGA = (s.homeShots * 0.06) + (s.homeShotsOnTarget * 0.15) + ((s.pkHome||0) * 0.76) + (f.homeScore! * 0.10);
                a.xGaSum += aXGA;

                if (f.matchEvents) {
                    const awayGoalEvents = f.matchEvents.filter(e => e.type === 'GOAL' && e.teamName === a.name);
                    a.cornerGoals += awayGoalEvents.filter(e => e.assist === 'Korner' || e.description.toLowerCase().includes('korner')).length;
                    a.freeKickGoals += awayGoalEvents.filter(e => e.description.toLowerCase().includes('frikik') || e.description.toLowerCase().includes('serbest vuruş')).length;
                    
                    const homeGoalEvents = f.matchEvents.filter(e => e.type === 'GOAL' && e.teamName === h?.name);
                    a.concededCornerGoals += homeGoalEvents.filter(e => e.assist === 'Korner' || e.description.toLowerCase().includes('korner')).length;
                    a.concededFreeKickGoals += homeGoalEvents.filter(e => e.description.toLowerCase().includes('frikik') || e.description.toLowerCase().includes('serbest vuruş')).length;
                    a.concededPenaltyGoals += homeGoalEvents.filter(e => e.assist === 'Penaltı' || e.description.toLowerCase().includes('penaltı')).length;
                }

                const aPassAcc = Math.min(95, 70 + (s.awayPossession * 0.2));
                const aLost = Math.floor((100 - aPassAcc) / 2) + Math.floor(s.awayShots * 0.3);
                a.possessionLostSum += aLost;
            }
        });

        const list = Array.from(statsMap.values()).filter(t => participatingTeamIds.has(t.id));
        
        return list.map(t => {
            const history = t.matchHistory; 
            const reversedHistory = [...history].reverse(); 
            
            const formLast5 = history.slice(-5).map(m => m.result);
            const homeFormLast5 = history.filter(m => m.isHome).slice(-5).map(m => m.result);
            const awayFormLast5 = history.filter(m => !m.isHome).slice(-5).map(m => m.result);

            let currentWinStreak = 0;
            let currentLossStreak = 0;
            let currentWinlessStreak = 0;
            let currentScoringStreak = 0;
            
            for (const m of reversedHistory) {
                if (m.result === 'W') {
                    if (currentWinStreak === -1) {} else currentWinStreak++;
                    currentLossStreak = -1; 
                    currentWinlessStreak = -1; 
                } else if (m.result === 'L') {
                    if (currentLossStreak === -1) {} else currentLossStreak++;
                    if (currentWinlessStreak === -1) {} else currentWinlessStreak++;
                    currentWinStreak = -1; 
                } else { 
                    if (currentWinlessStreak === -1) {} else currentWinlessStreak++;
                    currentWinStreak = -1;
                    currentLossStreak = -1;
                }

                if (m.scored > 0) {
                    if (currentScoringStreak === -1) {} else currentScoringStreak++;
                } else {
                    currentScoringStreak = -1;
                }

                if (currentWinStreak === -1 && currentLossStreak === -1 && currentWinlessStreak === -1 && currentScoringStreak === -1) break;
            }

            currentWinStreak = Math.max(0, currentWinStreak);
            currentLossStreak = Math.max(0, currentLossStreak);
            currentWinlessStreak = Math.max(0, currentWinlessStreak);
            currentScoringStreak = Math.max(0, currentScoringStreak);

            let maxUnbeaten = 0;
            let currentUnbeatenRun = 0;
            history.forEach(m => {
                if (m.result !== 'L') {
                    currentUnbeatenRun++;
                } else {
                    maxUnbeaten = Math.max(maxUnbeaten, currentUnbeatenRun);
                    currentUnbeatenRun = 0;
                }
            });
            maxUnbeaten = Math.max(maxUnbeaten, currentUnbeatenRun);

            const failedToScoreCount = history.filter(m => m.scored === 0).length;

            return {
                ...t,
                avgPossession: t.gamesPlayed > 0 ? t.possessionSum / t.gamesPlayed : 0,
                avgPassAccuracy: t.gamesPlayed > 0 ? t.passAccuracySum / t.gamesPlayed : 0,
                avgTackleSuccess: t.gamesPlayed > 0 ? t.tackleSuccessSum / t.gamesPlayed : 0,
                aerialsLostPerGame: t.gamesPlayed > 0 ? t.aerialsLostSum / t.gamesPlayed : 0,
                shotsPerGame: t.gamesPlayed > 0 ? t.shots / t.gamesPlayed : 0,
                aerialsPerGame: t.gamesPlayed > 0 ? t.aerialsWonSum / t.gamesPlayed : 0,
                goalsPerGame: t.gamesPlayed > 0 ? t.goalsFor / t.gamesPlayed : 0,
                dribblesPerGame: t.gamesPlayed > 0 ? t.dribbles / t.gamesPlayed : 0,
                avgAttendance: t.homeGames > 0 ? t.attendanceSum / t.homeGames : 0,
                fillRate: t.stadiumCapacity > 0 ? (t.homeGames > 0 ? (t.attendanceSum / t.homeGames) / t.stadiumCapacity * 100 : 0) : 0,
                maxAttendance: t.maxAttendance,
                minAttendance: t.homeGames > 0 ? t.minAttendance : 0,
                shotAccuracy: t.shots > 0 ? (t.shotsOnTarget / t.shots) * 100 : 0,
                conversionRate: t.shots > 0 ? (t.goalsFor / t.shots) * 100 : 0,
                
                // Form Data
                formLast5,
                homeFormLast5,
                awayFormLast5,
                currentWinStreak,
                currentLossStreak,
                currentScoringStreak,
                longestUnbeatenStreak: maxUnbeaten,
                currentWinlessStreak,
                failedToScoreCount
            };
        });

    }, [compFixtures, teams, competitionId, participatingTeamIds]);

    // --- SUSPENDED PLAYERS CALCULATION (FIXED) ---
    const suspendedPlayers = useMemo(() => {
        const list: { 
            player: Player, 
            team: Team, 
            reason: string, 
            startDate: string,
            remaining: number 
        }[] = [];

        // ONLY iterate participating teams
        const relevantTeams = teams.filter(t => participatingTeamIds.has(t.id));

        relevantTeams.forEach(t => {
            t.players.forEach(p => {
                let isSuspended = false;
                if (p.suspensions && p.suspensions[competitionId] && p.suspensions[competitionId] > 0) {
                     isSuspended = true;
                } else if (p.suspendedUntilWeek && p.suspendedUntilWeek > currentWeek) {
                     isSuspended = true;
                }

                if (isSuspended) {
                    let reason = "Sarı Kart Sınırı";
                    if (p.seasonStats.redCards > 0) {
                        reason = "Atıldı (Kırmızı Kart)";
                    } else if (p.seasonStats.yellowCards >= 4) {
                        reason = "4 Sarı Kart"; 
                    }

                    const lastMatch = fixtures
                        .filter(f => f.played && (f.homeTeamId === t.id || f.awayTeamId === t.id))
                        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    
                    const startDate = lastMatch ? getFormattedDate(lastMatch.date).label : '-';

                    list.push({
                        player: p,
                        team: t,
                        reason: reason,
                        startDate: startDate,
                        remaining: (p.suspensions?.[competitionId] || (p.suspendedUntilWeek ? p.suspendedUntilWeek - currentWeek : 1))
                    });
                }
            });
        });

        return list;
    }, [teams, currentWeek, fixtures, competitionId, participatingTeamIds]);

    // --- INJURED PLAYERS CALCULATION (FIXED) ---
    const injuredPlayers = useMemo(() => {
        const list: { player: Player, team: Team }[] = [];

        // ONLY iterate participating teams
        const relevantTeams = teams.filter(t => participatingTeamIds.has(t.id));

        relevantTeams.forEach(t => {
            t.players.forEach(p => {
                if (p.injury && p.injury.daysRemaining > 0) {
                    list.push({ player: p, team: t });
                }
            });
        });

        return list.sort((a, b) => (b.player.injury?.daysRemaining || 0) - (a.player.injury?.daysRemaining || 0));
    }, [teams, competitionId, participatingTeamIds]);

    // --- PLAYER STATS LEADERBOARDS ---
    const playerStatsRaw = useMemo(() => {
        const pMap = new Map<string, {
            player: Player, team: Team,
            ratingSum: number, matches: number, 
            goals: number, assists: number, 
            cleanSheets: number, mvps: number,
            tackles: number, shots: number, keyPasses: number, dribbles: number, passAccSum: number,
            yellow: number, red: number,
            // NEW SPECIFIC STATS
            starts: number,
            wonMatches: number,
            lostMatches: number,
            aerialsWon: number,
            interceptions: number,
            possessionLost: number,
            offsides: number,
            saves: number,
            goalsConceded: number,
            minutesPlayed: number, // NEW
            shotsOnTarget: number, // NEW
            penaltyGoals: number, // NEW
            freeKickGoals: number, // NEW
            foulsWon: number, // NEW
            fouls: number, // NEW: Yapılan Faul
            blocks: number, // NEW: Şut Engelleme
            clearances: number, // NEW: Uzaklaştırma
            shotsBlocked: number // NEW: Engellenen Şutlar
        }>();

        compFixtures.forEach(f => {
            const processRatings = (ratings: any[], teamId: string, conceded: number, isHome: boolean) => {
                const team = teams.find(t => t.id === teamId);
                if (!team) return;

                // Check match result for W/L stats
                const myScore = isHome ? f.homeScore! : f.awayScore!;
                const oppScore = isHome ? f.awayScore! : f.homeScore!;
                const isWin = myScore > oppScore;
                const isLoss = myScore < oppScore;

                ratings.forEach(r => {
                    if (!pMap.has(r.playerId)) {
                        const p = team.players.find(pl => pl.id === r.playerId);
                        if (p) {
                            pMap.set(r.playerId, {
                                player: p, team: team,
                                ratingSum: 0, matches: 0, goals: 0, assists: 0, cleanSheets: 0, mvps: 0,
                                tackles: 0, shots: 0, keyPasses: 0, dribbles: 0, passAccSum: 0,
                                yellow: 0, red: 0,
                                starts: 0, wonMatches: 0, lostMatches: 0, aerialsWon: 0,
                                interceptions: 0, possessionLost: 0, offsides: 0,
                                saves: 0, goalsConceded: 0,
                                minutesPlayed: 0, shotsOnTarget: 0, penaltyGoals: 0, freeKickGoals: 0, foulsWon: 0,
                                fouls: 0, blocks: 0, clearances: 0, shotsBlocked: 0
                            });
                        }
                    }

                    const entry = pMap.get(r.playerId);
                    if (entry) {
                        entry.ratingSum += r.rating;
                        entry.matches++;
                        entry.goals += r.goals;
                        entry.assists += r.assists;
                        
                        let mins = 90;
                        const subIn = f.matchEvents?.find(e => e.type === 'SUBSTITUTION' && e.description.includes(`🔄 ${entry.player.name}`));
                        const subOut = f.matchEvents?.find(e => e.type === 'SUBSTITUTION' && e.description.startsWith(entry.player.name));
                        const redCard = f.matchEvents?.find(e => e.type === 'CARD_RED' && e.playerId === entry.player.id);
                        
                        if (subIn) mins = 90 - subIn.minute;
                        if (subOut) mins = subOut.minute;
                        if (redCard) mins = redCard.minute;
                        if (subIn && subOut) mins = subOut.minute - subIn.minute;
                        if (subIn && redCard) mins = redCard.minute - subIn.minute;

                        entry.minutesPlayed += mins;

                        if (isWin) entry.wonMatches++;
                        if (isLoss) entry.lostMatches++;

                        const wasSubbedIn = !!subIn;
                        if (!wasSubbedIn) entry.starts++;

                        entry.goalsConceded += conceded;

                        if (r.position === 'GK') {
                             if (conceded === 0) entry.cleanSheets++;
                             const estimatedSaves = Math.max(0, Math.floor(r.rating - 4 + (conceded * 0.5)));
                             entry.saves += estimatedSaves;
                        }

                        if (f.stats?.mvpPlayerId === r.playerId) entry.mvps++;

                        const isFwd = ['SNT', 'SLK', 'SGK'].includes(r.position);
                        const isMid = ['OS', 'OOS'].includes(r.position);
                        const isDef = ['STP', 'SLB', 'SGB', 'GK'].includes(r.position);

                        entry.shots += r.goals * 2 + (isFwd ? 2 : isMid ? 1 : 0.2); 
                        entry.shotsOnTarget += r.goals + Math.floor((entry.shots - r.goals) * 0.4);

                        entry.keyPasses += r.assists * 2 + (isMid ? 1.5 : isFwd ? 0.8 : 0.1);
                        entry.tackles += (isDef ? 2.5 : isMid ? 1.5 : 0.3) + (r.rating > 7 ? 1 : 0);
                        
                        const isWinger = ['SLK', 'SGK'].includes(r.position);
                        const isDribbler = ['OOS', 'SNT'].includes(r.position);
                        entry.dribbles += (isWinger ? 3.5 : isDribbler ? 2.0 : 0.2) + (r.rating > 7.5 ? 2 : 0);
                        const baseAcc = isDef ? 85 : isMid ? 82 : 75;
                        const matchAcc = Math.min(100, baseAcc + (r.rating - 6) * 5 + (Math.random() * 5));
                        entry.passAccSum += matchAcc;

                        entry.aerialsWon += (isDef ? 3 : isFwd ? 1.5 : 0.5) * (r.rating / 6.5);
                        entry.interceptions += (isDef || isMid ? 2.5 : 0.5) * (r.rating / 6.5);
                        entry.possessionLost += (15 - r.rating) + (isFwd ? 4 : isMid ? 2 : 1);
                        
                        entry.fouls += Math.floor((isDef ? 1.5 : isMid ? 1 : 0.5) * (Math.random() * 1.5));
                        entry.blocks += Math.floor((isDef ? 2 : isMid ? 0.5 : 0.1) * (r.rating / 6.0));
                        entry.clearances += Math.floor((isDef ? 3.5 : isMid ? 0.5 : 0.1) * (r.rating / 6.0));
                        entry.shotsBlocked += Math.floor(entry.blocks * 0.8);

                        entry.foulsWon += Math.floor(entry.dribbles * 0.4) + (isFwd ? 1 : 0);

                        if (f.matchEvents) {
                            entry.penaltyGoals += f.matchEvents.filter(e => e.type === 'GOAL' && e.scorer === entry.player.name && (e.assist === 'Penaltı' || e.description.includes('Penaltı'))).length;
                            entry.freeKickGoals += f.matchEvents.filter(e => e.type === 'GOAL' && e.scorer === entry.player.name && e.description.toLowerCase().includes('frikik')).length;
                            entry.offsides += f.matchEvents.filter(e => e.type === 'OFFSIDE' && e.description.includes(entry.player.name)).length;
                        }
                    }
                });
            };

            if (f.matchEvents) {
                f.matchEvents.forEach(e => {
                    if ((e.type === 'CARD_YELLOW' || e.type === 'CARD_RED') && e.playerId) {
                         const entry = pMap.get(e.playerId);
                         if (entry) {
                             if (e.type === 'CARD_YELLOW') entry.yellow++;
                             if (e.type === 'CARD_RED') entry.red++;
                         }
                    }
                });
            }

            if (f.stats) {
                if (f.stats.homeRatings) processRatings(f.stats.homeRatings, f.homeTeamId, f.awayScore!, true);
                if (f.stats.awayRatings) processRatings(f.stats.awayRatings, f.awayTeamId, f.homeScore!, false);
            }
        });

        return Array.from(pMap.values()).map(x => {
            const xG = (x.shots * 0.08) + (x.shotsOnTarget * 0.20) + (x.penaltyGoals * 0.76);
            const xA = (x.keyPasses * 0.15) + (x.assists * 0.5);
            const npxG = xG - (x.penaltyGoals * 0.76);

            return {
                ...x,
                avgRating: x.matches > 0 ? x.ratingSum / x.matches : 0,
                avgPassAcc: x.matches > 0 ? x.passAccSum / x.matches : 0,
                shots: Math.floor(x.shots),
                keyPasses: Math.floor(x.keyPasses),
                tackles: Math.floor(x.tackles),
                dribbles: Math.floor(x.dribbles),
                aerialsWon: Math.floor(x.aerialsWon),
                interceptions: Math.floor(x.interceptions),
                possessionLost: Math.floor(x.possessionLost),
                shotsOnTarget: Math.floor(x.shotsOnTarget),
                xG,
                xA,
                npxG,
                minsPerGoal: x.goals > 0 ? x.minutesPlayed / x.goals : 0,
                shotsPer90: x.minutesPlayed > 0 ? (x.shots / x.minutesPlayed) * 90 : 0,
                assistsPer90: x.minutesPlayed > 0 ? (x.assists / x.minutesPlayed) * 90 : 0,
                shotAcc: x.shots > 0 ? (x.shotsOnTarget / x.shots) * 100 : 0,
                convRate: x.shots > 0 ? (x.goals / x.shots) * 100 : 0,
                fouls: Math.floor(x.fouls),
                blocks: Math.floor(x.blocks),
                clearances: Math.floor(x.clearances),
                shotsBlocked: Math.floor(x.shotsBlocked),
                goalsConceded: Math.floor(x.goalsConceded)
            };
        });
    }, [compFixtures, teams]);

    // 2. Derived Leaderboards for Grid View
    const playerLeaderboards = useMemo(() => {
        const all = [...playerStatsRaw];
        const getTop = (sortFn: (a: any, b: any) => number) => {
            const sorted = [...all].sort(sortFn);
            return sorted.length > 0 ? sorted[0] : null;
        };

        return [
            { id: 1, title: 'En Fazla Gol Atan', icon: Goal, data: getTop((a,b) => b.goals - a.goals), valueKey: 'goals' },
            { id: 2, title: 'Kalesine En Az Şut Çekilen', icon: Shield, data: getTop((a,b) => b.cleanSheets - a.cleanSheets), valueKey: 'cleanSheets' },
            { id: 3, title: 'En Fazla Topla Oynama', icon: Activity, data: getTop((a,b) => b.avgPassAcc - a.avgPassAcc), valueKey: 'avgPassAcc', format: (v: number) => `%${Math.round(v)}` },
            { id: 4, title: 'En Fazla Başarılı Çalım', icon: Footprints, data: getTop((a,b) => b.dribbles - a.dribbles), valueKey: 'dribbles' },
            { id: 5, title: 'En Fazla Sarı Kart', icon: AlertTriangle, data: getTop((a,b) => (b.yellow || 0) - (a.yellow || 0)), valueKey: 'yellow' },
            { id: 6, title: 'En Yüksek Pas İsabeti', icon: CheckCircle2, data: getTop((a,b) => b.avgPassAcc - a.avgPassAcc), valueKey: 'avgPassAcc', format: (v: number) => `%${Math.round(v)}` },
            { id: 7, title: 'En Fazla Şut Çeken', icon: Target, data: getTop((a,b) => b.shots - a.shots), valueKey: 'shots' },
            { id: 8, title: 'En Fazla Başarılı Topa Müdahale', icon: ShieldCheck, data: getTop((a,b) => b.tackles - a.tackles), valueKey: 'tackles' },
            { id: 9, title: 'En Fazla Asist Yapan', icon: Zap, data: getTop((a,b) => b.assists - a.assists), valueKey: 'assists' },
            { id: 10, title: 'En Yüksek Maç Puanı', icon: Star, data: getTop((a,b) => b.avgRating - a.avgRating), valueKey: 'avgRating', format: (v: number) => v.toFixed(2) },
        ];
    }, [playerStatsRaw]);

    // --- RENDER HELPERS ---
    const renderStatRow = (label: string, dataKey: keyof typeof teamStats[0] | ((t: any) => number), format: (v: number) => string = (v) => v.toString(), sortDir: 'asc'|'desc' = 'desc') => {
        if (teamStats.length === 0) return null;
        
        const sorted = [...teamStats].sort((a, b) => {
            const valA = typeof dataKey === 'function' ? dataKey(a) : a[dataKey] as number;
            const valB = typeof dataKey === 'function' ? dataKey(b) : b[dataKey] as number;
            return sortDir === 'desc' ? valB - valA : valA - valB;
        });

        const best = sorted[0];
        const val = typeof dataKey === 'function' ? dataKey(best) : best[dataKey] as number;

        return (
            <div className="flex justify-between items-center py-3 border-b border-[#333] last:border-0 hover:bg-[#252525] px-2 rounded transition-colors group">
                <div className="flex flex-col">
                    <span className="text-slate-400 text-xs font-medium mb-1">{label}</span>
                    <button 
                        onClick={() => onTeamClick(best.id)}
                        className="flex items-center gap-2 text-white font-bold hover:text-yellow-500 transition-colors text-sm text-left"
                    >
                         {best.logo ? <img src={best.logo} className="w-5 h-5 object-contain" /> : <div className={`w-5 h-5 rounded-full ${best.colors[0]}`}></div>}
                         <span className="truncate max-w-[120px]">{best.name}</span>
                    </button>
                </div>
                <div className="text-xl font-black text-white group-hover:text-yellow-500 transition-colors">
                    {format(val)}
                </div>
            </div>
        );
    };

    const renderPlayerStatRow = (item: any) => {
        if (!item || !item.data) return null;
        const p = item.data.player;
        const t = item.data.team;
        const val = (item.data as any)[item.valueKey];
        const displayVal = item.format ? item.format(val) : val;

        return (
            <div className="flex justify-between items-center py-3 border-b border-[#333] last:border-0 hover:bg-[#252525] px-2 rounded transition-colors group cursor-pointer" onClick={() => onPlayerClick(p)}>
                <div className="flex flex-col flex-1">
                    <span className="text-slate-400 text-xs font-medium mb-1">{item.title}</span>
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 overflow-hidden shrink-0 group-hover:border-[#ff9f43] transition-colors">
                             <PlayerFace player={p} />
                         </div>
                         <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-bold text-sm group-hover:text-yellow-500 transition-colors whitespace-nowrap">{p.name}</span>
                            
                            {/* Team Badge */}
                            <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">
                                {t.logo ? <img src={t.logo} className="w-3 h-3 object-contain opacity-70"/> : <div className={`w-2 h-2 rounded-full ${t.colors[0]}`}></div>}
                                <span className="text-[9px] text-slate-400 font-bold uppercase">{t.name.split(' ')[0]}</span>
                            </div>

                            {/* Country Badge */}
                            <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">
                                <img 
                                    src={`https://flagcdn.com/w20/${COUNTRY_CODES[p.nationality] || 'un'}.png`} 
                                    className="w-3 h-auto object-contain opacity-70"
                                    alt={p.nationality}
                                    onError={(e) => e.currentTarget.style.display='none'} 
                                />
                                <span className="text-[9px] text-slate-400 font-bold uppercase">{COUNTRY_CODES[p.nationality] ? p.nationality.substring(0,3).toUpperCase() : p.nationality}</span>
                            </div>
                         </div>
                    </div>
                </div>
                <div className="text-xl font-black text-white group-hover:text-yellow-500 transition-colors font-mono pl-2">
                    {displayVal}
                </div>
            </div>
        );
    };

    const getPItem = (id: number) => playerLeaderboards.find(p => p.id === id);
    
    // --- CATEGORY CONFIGURATION FOR MODAL ---
    const getModalItems = () => {
        switch(activeCategory) {
            case 'GENERAL':
                return [
                    { key: 'avgPossession', label: 'Ortalama Topla Oynama', format: (v: number) => `%${v.toFixed(1)}`, order: 'desc' },
                    { key: 'avgPassAccuracy', label: 'Pas İsabet Oranı', format: (v: number) => `%${v.toFixed(1)}`, order: 'desc' },
                    { key: 'aerialsPerGame', label: 'Başarılı Kafa Topu (Ort)', format: (v: number) => v.toFixed(1), order: 'desc' },
                    { key: 'yellows', label: 'Sarı Kart', format: (v: number) => v.toString(), order: 'desc' },
                    { key: 'reds', label: 'Kırmızı Kart', format: (v: number) => v.toString(), order: 'desc' },
                ];
            case 'FORM':
                return [
                     { key: 'formLast5', label: 'Form (Son 5 Maç)', format: (v: string[]) => v, order: 'desc' },
                     { key: 'homeFormLast5', label: 'İç Saha Formu', format: (v: string[]) => v, order: 'desc' },
                     { key: 'awayFormLast5', label: 'Deplasman Formu', format: (v: string[]) => v, order: 'desc' },
                     { key: 'currentWinStreak', label: 'Galibiyet Serisi', format: (v: number) => v.toString(), order: 'desc' },
                     { key: 'currentLossStreak', label: 'Mağlubiyet Serisi', format: (v: number) => v.toString(), order: 'desc' },
                     { key: 'currentScoringStreak', label: 'Üst Üste Gol Attığı', format: (v: number) => v.toString(), order: 'desc' },
                     { key: 'longestUnbeatenStreak', label: 'Namağlup Seri (Rekor)', format: (v: number) => v.toString(), order: 'desc' },
                     { key: 'currentWinlessStreak', label: 'Galibiyetsiz Seri', format: (v: number) => v.toString(), order: 'desc' },
                     { key: 'cleanSheets', label: 'Gol Yenmeyen Maçlar', format: (v: number) => v.toString(), order: 'desc' },
                     { key: 'failedToScoreCount', label: 'Gol Atamadan Biten Maçlar', format: (v: number) => v.toString(), order: 'desc' },
                ];
            case 'ATTACK':
                return [
                    { key: 'goalsFor', label: 'Gol', format: (v: number) => v.toString(), order: 'desc' },
                    { key: 'goalsPerGame', label: 'Maç Başına Gol Sayısı', format: (v: number) => v.toFixed(2), order: 'desc' },
                    { key: 'xGSum', label: 'Gol Beklentisi (xG)', format: (v: number) => v.toFixed(2), order: 'desc' },
                    { key: 'npxGSum', label: 'Penaltı Hariç xG', format: (v: number) => v.toFixed(2), order: 'desc' },
                    { key: 'cornerGoals', label: 'Kornerden Gelen Goller', format: (v: number) => v.toString(), order: 'desc' },
                    { key: 'freeKickGoals', label: 'Frikiklerden Atılan Gol', format: (v: number) => v.toString(), order: 'desc' },
                    { key: 'shots', label: 'Şut', format: (v: number) => v.toString(), order: 'desc' },
                    { key: 'shotsOnTarget', label: 'İsabetli Şut', format: (v: number) => v.toString(), order: 'desc' },
                    { key: 'shotAccuracy', label: 'Kaleyi Bulan Şut Oranı', format: (v: number) => `%${v.toFixed(1)}`, order: 'desc' },
                    { key: 'conversionRate', label: 'Gole Dönüşme Oranı', format: (v: number) => `%${v.toFixed(1)}`, order: 'desc' },
                    { key: 'shotsPerGame', label: 'Maç Başına Şut', format: (v: number) => v.toFixed(1), order: 'desc' },
                    { key: 'fouls', label: 'Yapılan Faul', format: (v: number) => v.toString(), order: 'desc' },
                    { key: 'dribbles', label: 'Başarılı Çalım', format: (v: number) => v.toString(), order: 'desc' },
                    { key: 'dribblesPerGame', label: 'Maç Başına Çalım', format: (v: number) => v.toFixed(1), order: 'desc' },
                    { key: 'possessionLostSum', label: 'Top Kaybı', format: (v: number) => v.toString(), order: 'asc' }, 
                ];
            case 'DEFENSE':
                return [
                    { key: 'goalsAgainst', label: 'Yenilen Goller', format: (v: number) => v.toString(), order: 'asc' },
                    { key: 'xGaSum', label: 'Rakibin Gol Beklentisi (xGA)', format: (v: number) => v.toFixed(2), order: 'asc' },
                    { key: 'concededCornerGoals', label: 'Kornerlerden Yenilen Gol', format: (v: number) => v.toString(), order: 'asc' },
                    { key: 'concededFreeKickGoals', label: 'Frikiklerden Yenilen Gol', format: (v: number) => v.toString(), order: 'asc' },
                    { key: 'cleanSheets', label: 'Gol Yemediği Maç Sayısı', format: (v: number) => v.toString(), order: 'desc' },
                    { key: 'fouls', label: 'Yaptığı Faul', format: (v: number) => v.toString(), order: 'asc' },
                    { key: 'tackles', label: 'Başarılı Topa Müdahale', format: (v: number) => v.toString(), order: 'desc' },
                    { key: 'avgTackleSuccess', label: 'Topa Müdahale Kazanma Oranı', format: (v: number) => `%${v.toFixed(1)}`, order: 'desc' },
                    { key: 'blocks', label: 'Şut Engelleme', format: (v: number) => v.toString(), order: 'desc' },
                    { key: 'interceptions', label: 'Top Kazanma', format: (v: number) => v.toString(), order: 'desc' },
                    { key: 'clearances', label: 'Uzaklaştırma', format: (v: number) => v.toString(), order: 'desc' },
                    { key: 'concededPenaltyGoals', label: 'Penaltıdan Yenilen Goller', format: (v: number) => v.toString(), order: 'asc' },
                    { key: 'shotsConceded', label: 'Rakibin Çektiği Şut', format: (v: number) => v.toString(), order: 'asc' },
                    { key: 'shotsOnTargetConceded', label: 'Rakibin İsabetli Şutu', format: (v: number) => v.toString(), order: 'asc' },
                    { key: 'aerialsLostSum', label: 'Kafa Topu Kaybı', format: (v: number) => v.toString(), order: 'asc' },
                    { key: 'aerialsLostPerGame', label: 'Maç Başına Yapılan Kafa Topu Kaybı', format: (v: number) => v.toFixed(1), order: 'asc' },
                ];
            case 'ATTENDANCE':
                return [
                    { key: 'avgAttendance', label: 'Ortalama Seyirci', format: (v: number) => Math.round(v).toLocaleString(), order: 'desc' },
                    { key: 'fillRate', label: 'Kapasiteye Göre Ortalama Seyirci %', format: (v: number) => `%${v.toFixed(1)}`, order: 'desc' },
                    { key: 'maxAttendance', label: 'En Yüksek Seyirci', format: (v: number) => v.toLocaleString(), order: 'desc' },
                    { key: 'minAttendance', label: 'En Düşük Seyirci', format: (v: number) => v.toLocaleString(), order: 'desc' },
                    { key: 'stadiumCapacity', label: 'Stadyum Kapasitesi', format: (v: number) => v.toLocaleString(), order: 'desc' },
                ];
            case 'FINANCE':
                 return [
                     { key: 'squadValue', label: 'Kadro Değeri', format: (v: number) => `${v.toLocaleString(undefined, {maximumFractionDigits:1})} M€`, order: 'desc' },
                     { key: 'transferSpend', label: 'Transfer Harcaması', format: (v: number) => `${v.toFixed(1)} M€`, order: 'desc' },
                     { key: 'annualWages', label: 'Yıllık Maaş', format: (v: number) => `${v.toFixed(1)} M€`, order: 'desc' },
                     { key: 'budget', label: 'Kalan Transfer Bütçesi', format: (v: number) => `${v.toFixed(1)} M€`, order: 'desc' },
                 ];
            default:
                return [];
        }
    };

    // --- PLAYER CATEGORY CONFIGURATION (UPDATED) ---
    const getPlayerModalItems = () => {
        switch(activePlayerCategory) {
            case 'GENERAL':
                return [
                    { key: 'matches', label: 'Çıktığı Maç', format: (v: number) => v.toString() },
                    { key: 'starts', label: 'İlk 11 Başlama', format: (v: number) => v.toString() },
                    { key: 'wonMatches', label: 'Kazanılan Maç', format: (v: number) => v.toString() },
                    { key: 'lostMatches', label: 'Kaybedilen Maç', format: (v: number) => v.toString() },
                    { key: 'yellow', label: 'Sarı Kart', format: (v: number) => v.toString() },
                    { key: 'red', label: 'Kırmızı Kart', format: (v: number) => v.toString() },
                    { key: 'mvps', label: 'Maçın Oyuncusu', format: (v: number) => v.toString() },
                    { key: 'avgRating', label: 'Ortalama Puan', format: (v: number) => v.toFixed(2) },
                    { key: 'aerialsWon', label: 'Başarılı Kafa Topu', format: (v: number) => v.toString() },
                    { key: 'interceptions', label: 'Top Kazanma', format: (v: number) => v.toString() },
                    { key: 'possessionLost', label: 'Top Kaybı', format: (v: number) => v.toString() },
                    { key: 'offsides', label: 'Ofsayt', format: (v: number) => v.toString() },
                ];
            case 'ATTACK':
                return [
                    { key: 'goals', label: 'Gol', format: (v: number) => v.toString() },
                    { key: 'xG', label: 'Gol beklentisi xG', format: (v: number) => v.toFixed(2) },
                    { key: 'minsPerGoal', label: 'Dakika başına gol', format: (v: number) => Math.round(v).toString() },
                    { key: 'shots', label: 'Şutlar', format: (v: number) => v.toString() },
                    { key: 'shotsOnTarget', label: 'İsabetli şut', format: (v: number) => v.toString() },
                    { key: 'shotAcc', label: 'Kaleyi bulan şut %', format: (v: number) => `%${Math.round(v)}` },
                    { key: 'convRate', label: 'Gole dönüşme oranı %', format: (v: number) => `%${Math.round(v)}` },
                    { key: 'shotsPerGame', label: 'Şut/90 Dakika', format: (v: number) => v.toFixed(2) },
                    { key: 'freeKickGoals', label: 'Serbest vuruş golleri', format: (v: number) => v.toString() },
                    { key: 'penaltyGoals', label: 'Penaltılar', format: (v: number) => v.toString() },
                    { key: 'assists', label: 'Asist', format: (v: number) => v.toString() },
                    { key: 'assistsPer90', label: 'Asist/90 Dakika', format: (v: number) => v.toFixed(2) },
                    { key: 'avgPassAcc', label: 'Pas isabeti %', format: (v: number) => `%${Math.round(v)}` },
                    { key: 'dribbles', label: 'Başarılı Çalım', format: (v: number) => v.toString() },
                    { key: 'offsides', label: 'Ofsayt', format: (v: number) => v.toString() },
                    { key: 'foulsWon', label: 'Faul Kazanma', format: (v: number) => v.toString() },
                    { key: 'xA', label: 'Asist Beklentisi', format: (v: number) => v.toFixed(2) },
                    { key: 'npxG', label: 'Penaltı Hariç xG', format: (v: number) => v.toFixed(2) },
                ];
            case 'DEFENSE':
                return [
                    { key: 'goalsConceded', label: 'Takımın Yediği Gol', format: (v: number) => v.toString() },
                    { key: 'tackles', label: 'Başarılı Topa Müdahale', format: (v: number) => v.toString() },
                    { key: 'aerialsWon', label: 'Kritik Hava Topu', format: (v: number) => v.toString() },
                    { key: 'interceptions', label: 'Başarılı Top Kesme', format: (v: number) => v.toString() },
                    { key: 'blocks', label: 'Şut Engelleme', format: (v: number) => v.toString() },
                    { key: 'clearances', label: 'Uzaklaştırma', format: (v: number) => v.toString() },
                    { key: 'shotsBlocked', label: 'Engellenen Şutlar', format: (v: number) => v.toString() },
                    { key: 'fouls', label: 'Yapılan Faul', format: (v: number) => v.toString() },
                ];
            case 'GOALKEEPING':
                return [
                    { key: 'cleanSheets', label: 'Gol Yememe', format: (v: number) => v.toString() },
                    { key: 'saves', label: 'Kurtarış', format: (v: number) => v.toString() },
                    { key: 'goalsConceded', label: 'Yediği Gol', format: (v: number) => v.toString() },
                    { key: 'matches', label: 'Maç', format: (v: number) => v.toString() },
                ];
            default: 
                return [];
        }
    };

    // Reset Selected Key when Category Changes
    const handleCategoryChange = (cat: keyof typeof CATEGORIES) => {
        setActiveCategory(cat);
        setIsCategoryMenuOpen(false);
        // Set first item of new category as selected
        const items = getModalItems(); 
        
        let firstKey = '';
        if (cat === 'GENERAL') firstKey = 'avgPossession';
        else if (cat === 'FORM') firstKey = 'formLast5';
        else if (cat === 'ATTACK') firstKey = 'goalsFor';
        else if (cat === 'DEFENSE') firstKey = 'goalsAgainst';
        else if (cat === 'ATTENDANCE') firstKey = 'avgAttendance';
        else if (cat === 'FINANCE') firstKey = 'squadValue';
        
        setSelectedStatKey(firstKey);
    };

    // Reset Selected Player Key when Category Changes
    const handlePlayerCategoryChange = (cat: keyof typeof PLAYER_CATEGORIES) => {
        setActivePlayerCategory(cat);
        setIsPlayerCategoryMenuOpen(false);
        
        let firstKey = '';
        if (cat === 'GENERAL') firstKey = 'avgRating';
        else if (cat === 'ATTACK') firstKey = 'goals';
        else if (cat === 'DEFENSE') firstKey = 'tackles';
        else if (cat === 'GOALKEEPING') firstKey = 'cleanSheets';
        
        setSelectedPlayerStatKey(firstKey);
    };

    const modalItems = getModalItems();
    const playerModalItems = getPlayerModalItems();

    return (
        <div className="h-full flex flex-col bg-[#1b1b1b]">
            
            {showInjuryModal && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowInjuryModal(false)}>
                    <div className="bg-[#1e232e] w-full max-w-4xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl relative flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-700 bg-[#161a1f] flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <Activity size={28} className="text-red-500"/>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wider font-teko">Detaylı Sakatlık Raporu</h2>
                            </div>
                            <button onClick={() => setShowInjuryModal(false)} className="p-2 bg-slate-800 hover:bg-red-600 rounded-full text-white transition border border-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            {injuredPlayers.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 italic">
                                    Şu anda sakat oyuncu bulunmuyor.
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="bg-[#15191e] text-xs uppercase text-slate-500 font-bold border-b border-[#333]">
                                        <tr>
                                            <th className="p-3 pl-4">İsim</th>
                                            <th className="p-3">Takım</th>
                                            <th className="p-3 text-center">Ülke</th>
                                            <th className="p-3 text-right pr-4">Tahmini Dönüş</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#333]">
                                        {injuredPlayers.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-[#252a30] transition-colors cursor-pointer group" onClick={() => onPlayerClick(item.player)}>
                                                <td className="p-3 pl-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 overflow-hidden shrink-0 group-hover:border-red-500 transition-colors">
                                                            <PlayerFace player={item.player} />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-[#2c333a] border border-[#3c444d] rounded px-2 py-0.5 font-bold text-slate-200 group-hover:text-white transition-colors">
                                                                {item.player.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2 cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onTeamClick(item.team.id); }}>
                                                        {item.team.logo ? <img src={item.team.logo} className="w-5 h-5 object-contain"/> : <div className={`w-5 h-5 rounded-full ${item.team.colors[0]}`}></div>}
                                                        <div className="bg-[#2c333a] border border-[#3c444d] rounded px-2 py-0.5 text-xs text-slate-300 font-bold">
                                                            {item.team.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <img 
                                                            src={`https://flagcdn.com/w20/${COUNTRY_CODES[item.player.nationality] || 'un'}.png`} 
                                                            className="w-4 h-3 object-contain opacity-70"
                                                            alt={item.player.nationality}
                                                            onError={(e) => e.currentTarget.style.display='none'} 
                                                        />
                                                        <span className="text-xs text-slate-400 font-mono uppercase">{COUNTRY_CODES[item.player.nationality] ? item.player.nationality.substring(0,3).toUpperCase() : item.player.nationality}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right pr-4 text-slate-200 font-medium">
                                                    <span className="text-red-500 font-bold">{item.player.injury?.daysRemaining} Gün</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TOGGLE HEADER */}
            <div className="flex items-center justify-center p-4 border-b border-[#333] bg-[#222]">
                <div className="flex bg-[#111] p-1 rounded-lg border border-[#333]">
                    <button 
                        onClick={() => setViewMode('TEAM')}
                        className={`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${viewMode === 'TEAM' ? 'bg-[#ff9f43] text-black shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <ShieldCheck size={16}/> TAKIM
                    </button>
                    <button 
                        onClick={() => setViewMode('PLAYER')}
                        className={`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${viewMode === 'PLAYER' ? 'bg-[#ff9f43] text-black shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <User size={16}/> OYUNCU
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                
                {viewMode === 'TEAM' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                        <div 
                            className="flex justify-between items-center mb-4 border-l-4 border-fuchsia-400 pl-3 cursor-pointer group hover:bg-white/5 rounded-r transition-colors"
                            onClick={() => setShowTeamStatsModal(true)}
                        >
                            <h3 className="text-lg font-bold text-fuchsia-400 uppercase tracking-widest group-hover:text-fuchsia-300 transition-colors">Takım İstatistikleri</h3>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowTeamStatsModal(true); }}
                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 border border-blue-400 transition shadow-sm font-bold"
                            >
                                <Maximize2 size={14}/>
                                Detaylı Gör
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 bg-[#1e232e] p-6 rounded-xl border border-[#333] shadow-lg">
                            <div className="flex flex-col gap-1">
                                {renderStatRow('En Fazla Gol Atan', 'goalsFor')}
                                {renderStatRow('En Fazla Topla Oynama', 'avgPossession', (v) => `%${v.toFixed(1)}`)}
                                {renderStatRow('En Fazla Sarı Kart', 'yellows')}
                                {renderStatRow('En Fazla Şut Çeken', 'shots')}
                                {renderStatRow('En Fazla Kalesinde Gol Görmeme', 'cleanSheets')}
                            </div>
                            <div className="flex flex-col gap-1">
                                {renderStatRow('Kalesine En Az Şut Çekilen', 'shotsConceded', (v) => v.toString(), 'asc')}
                                {renderStatRow('En Fazla Başarılı Çalım', 'dribbles')}
                                {renderStatRow('En Yüksek Pas İsabeti', 'avgPassAccuracy', (v) => `%${v.toFixed(1)}`)}
                                {renderStatRow('En Fazla Başarılı Topa Müdahale', 'tackles')}
                                {renderStatRow('En Az Gol Yiyen', 'goalsAgainst', (v) => v.toString(), 'asc')}
                            </div>
                        </div>

                        {/* SUSPENDED PLAYERS SECTION */}
                        <div className="mt-8">
                             <div className="flex justify-between items-center mb-4 border-l-4 border-red-500 pl-3">
                                <h3 className="text-lg font-bold text-red-500 uppercase tracking-widest">Mevcut Cezalılar</h3>
                             </div>

                             <div className="bg-[#1e232e] rounded-xl border border-[#333] shadow-lg overflow-hidden">
                                 {suspendedPlayers.length === 0 ? (
                                     <div className="p-8 text-center text-slate-500 italic">
                                         Şu anda cezalı oyuncu bulunmuyor.
                                     </div>
                                 ) : (
                                     <table className="w-full text-left text-sm text-slate-300">
                                         <thead className="bg-[#15191e] text-xs uppercase text-slate-500 font-bold border-b border-[#333]">
                                             <tr>
                                                 <th className="p-3 pl-4">İsim</th>
                                                 <th className="p-3">Takım</th>
                                                 <th className="p-3 text-center">Başlangıç Tarihi</th>
                                                 <th className="p-3 text-center">Maçlar</th>
                                                 <th className="p-3 text-center">Kapsam</th>
                                                 <th className="p-3 text-right pr-4">Sebep</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-[#333]">
                                             {suspendedPlayers.map((item, idx) => (
                                                 <tr key={idx} className="hover:bg-[#252a30] transition-colors cursor-pointer group" onClick={() => onPlayerClick(item.player)}>
                                                     <td className="p-3 pl-4">
                                                         <div className="flex items-center gap-3">
                                                             <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 overflow-hidden shrink-0 group-hover:border-red-500 transition-colors">
                                                                 <PlayerFace player={item.player} />
                                                             </div>
                                                             <div className="flex items-center gap-2">
                                                                <Ban size={14} className="text-red-500"/>
                                                                <div className="bg-[#2c333a] border border-[#3c444d] rounded px-2 py-0.5 font-bold text-slate-200 group-hover:text-white transition-colors">
                                                                    {item.player.name}
                                                                </div>
                                                             </div>
                                                         </div>
                                                     </td>
                                                     <td className="p-3">
                                                         <div className="flex items-center gap-2 cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onTeamClick(item.team.id); }}>
                                                             {item.team.logo ? <img src={item.team.logo} className="w-5 h-5 object-contain"/> : <div className={`w-5 h-5 rounded-full ${item.team.colors[0]}`}></div>}
                                                             <div className="bg-[#2c333a] border border-[#3c444d] rounded px-2 py-0.5 text-xs text-slate-300 font-bold">
                                                                {item.team.name}
                                                             </div>
                                                         </div>
                                                     </td>
                                                     <td className="p-3 text-center text-slate-400">{item.startDate}</td>
                                                     <td className="p-3 text-center font-mono font-bold text-white">0/{item.remaining}</td>
                                                     <td className="p-3 text-center text-slate-400">Lig/Kupa</td>
                                                     <td className="p-3 text-right pr-4 text-slate-200 font-medium">{item.reason}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 )}
                             </div>
                        </div>

                        {teamStats.length === 0 && (
                            <div className="text-center text-slate-500 italic py-10">Henüz veri oluşmadı.</div>
                        )}
                    </div>
                )}

                {viewMode === 'PLAYER' && (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
                        <div 
                            className="flex justify-between items-center mb-4 border-l-4 border-fuchsia-400 pl-3 cursor-pointer group hover:bg-white/5 rounded-r transition-colors"
                            onClick={() => setShowPlayerStatsModal(true)}
                        >
                            <h3 className="text-lg font-bold text-fuchsia-400 uppercase tracking-widest group-hover:text-fuchsia-300 transition-colors">Oyuncu İstatistikleri</h3>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowPlayerStatsModal(true); }}
                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 border border-blue-400 transition shadow-sm font-bold"
                            >
                                <Maximize2 size={14}/>
                                Detaylı Gör
                            </button>
                        </div>

                        {playerStatsRaw.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 bg-[#1e232e] p-6 rounded-xl border border-[#333] shadow-lg">
                                {/* Left Column: Offensive / General */}
                                <div className="flex flex-col gap-1">
                                    {renderPlayerStatRow(getPItem(1))} {/* Gol */}
                                    {renderPlayerStatRow(getPItem(9))} {/* Asist */}
                                    {renderPlayerStatRow(getPItem(10))} {/* Rating */}
                                    {renderPlayerStatRow(getPItem(7))} {/* Shots */}
                                    {renderPlayerStatRow(getPItem(4))} {/* Dribbles */}
                                </div>
                                {/* Right Column: Defensive / Other */}
                                <div className="flex flex-col gap-1">
                                    {renderPlayerStatRow(getPItem(2))} {/* Clean Sheets */}
                                    {renderPlayerStatRow(getPItem(8))} {/* Tackles */}
                                    {renderPlayerStatRow(getPItem(6))} {/* Pass Acc */}
                                    {renderPlayerStatRow(getPItem(3))} {/* Possession (Derived) */}
                                    {renderPlayerStatRow(getPItem(5))} {/* Yellow Cards */}
                                </div>
                            </div>
                        ) : (
                             <div className="text-center text-slate-500 italic py-10 bg-[#1e232e] rounded-xl border border-[#333]">
                                 Yeterli veri oluşmadığı için istatistikler henüz hesaplanamıyor.
                             </div>
                        )}

                        {/* --- NEW INJURY TABLE --- */}
                        <div className="mt-8">
                             <div 
                                className="flex justify-between items-center mb-4 border-l-4 border-red-500 pl-3 cursor-pointer group hover:bg-white/5 rounded-r transition-colors"
                                onClick={() => setShowInjuryModal(true)}
                             >
                                <h3 className="text-lg font-bold text-red-500 uppercase tracking-widest group-hover:text-red-400 transition-colors">Sakatlık Raporu</h3>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowInjuryModal(true); }}
                                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 border border-blue-400 transition shadow-sm font-bold"
                                >
                                    <Maximize2 size={14}/>
                                    Detaylı Gör
                                </button>
                             </div>

                             <div className="bg-[#1e232e] rounded-xl border border-[#333] shadow-lg overflow-hidden">
                                 {injuredPlayers.length === 0 ? (
                                     <div className="p-8 text-center text-slate-500 italic">
                                         Şu anda sakat oyuncu bulunmuyor.
                                     </div>
                                 ) : (
                                     <table className="w-full text-left text-sm text-slate-300">
                                         <thead className="bg-[#15191e] text-xs uppercase text-slate-500 font-bold border-b border-[#333]">
                                             <tr>
                                                 <th className="p-3 pl-4">İsim</th>
                                                 <th className="p-3">Takım</th>
                                                 <th className="p-3 text-center">Ülke</th>
                                                 <th className="p-3 text-right pr-4">Tahmini Dönüş</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-[#333]">
                                             {injuredPlayers.slice(0, 5).map((item, idx) => (
                                                 <tr key={idx} className="hover:bg-[#252a30] transition-colors cursor-pointer group" onClick={() => onPlayerClick(item.player)}>
                                                     <td className="p-3 pl-4">
                                                         <div className="flex items-center gap-3">
                                                             <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 overflow-hidden shrink-0 group-hover:border-red-500 transition-colors">
                                                                 <PlayerFace player={item.player} />
                                                             </div>
                                                             <div className="flex items-center gap-2">
                                                                <div className="bg-[#2c333a] border border-[#3c444d] rounded px-2 py-0.5 font-bold text-slate-200 group-hover:text-white transition-colors">
                                                                    {item.player.name}
                                                                </div>
                                                             </div>
                                                         </div>
                                                     </td>
                                                     <td className="p-3">
                                                         <div className="flex items-center gap-2 cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onTeamClick(item.team.id); }}>
                                                             {item.team.logo ? <img src={item.team.logo} className="w-5 h-5 object-contain"/> : <div className={`w-5 h-5 rounded-full ${item.team.colors[0]}`}></div>}
                                                             <div className="bg-[#2c333a] border border-[#3c444d] rounded px-2 py-0.5 text-xs text-slate-300 font-bold">
                                                                {item.team.name}
                                                             </div>
                                                         </div>
                                                     </td>
                                                     <td className="p-3 text-center">
                                                          <div className="flex items-center justify-center gap-1">
                                                              <img 
                                                                    src={`https://flagcdn.com/w20/${COUNTRY_CODES[item.player.nationality] || 'un'}.png`} 
                                                                    className="w-4 h-3 object-contain opacity-70"
                                                                    alt={item.player.nationality}
                                                                    onError={(e) => e.currentTarget.style.display='none'} 
                                                                />
                                                              <span className="text-xs text-slate-400 font-mono uppercase">{COUNTRY_CODES[item.player.nationality] ? item.player.nationality.substring(0,3).toUpperCase() : item.player.nationality}</span>
                                                          </div>
                                                     </td>
                                                     <td className="p-3 text-right pr-4 text-slate-200 font-medium">
                                                         <span className="text-red-500 font-bold">{item.player.injury?.daysRemaining} Gün</span>
                                                     </td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 )}
                             </div>
                        </div>

                    </div>
                )}
            </div>

            {/* TEAM STATS MODAL (DETAILED) */}
            {showTeamStatsModal && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowTeamStatsModal(false)}>
                    <div className="bg-[#1e232e] w-full max-w-6xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl relative flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="p-4 border-b border-slate-700 bg-[#161a1f] flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={28} className="text-blue-500"/>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wider font-teko">Detaylı Takım İstatistikleri</h2>
                            </div>
                            <button onClick={() => setShowTeamStatsModal(false)} className="p-2 bg-slate-800 hover:bg-red-600 rounded-full text-white transition border border-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex flex-1 overflow-hidden">
                            {/* LEFT MENU - NEW DROPDOWN STYLE */}
                            <div className="w-1/3 md:w-1/4 bg-[#161a1f] border-r border-slate-700 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-4">
                                
                                {/* Category Dropdown */}
                                <div className="relative mb-4 px-2 mt-2">
                                    <button 
                                        onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                                        className="w-full bg-[#2a3038] text-white px-4 py-3 rounded-lg border border-slate-600 flex justify-between items-center font-bold text-sm uppercase tracking-wider hover:bg-[#333a44] transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {React.createElement(CATEGORIES[activeCategory].icon, { size: 16, className: 'text-[#ff9f43]' })}
                                            {CATEGORIES[activeCategory].label}
                                        </div>
                                        {isCategoryMenuOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                    </button>

                                    {isCategoryMenuOpen && (
                                        <div className="absolute top-full left-2 right-2 mt-1 bg-[#252a33] border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                            {Object.entries(CATEGORIES).map(([key, info]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => handleCategoryChange(key as keyof typeof CATEGORIES)}
                                                    className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-colors ${activeCategory === key ? 'bg-[#ff9f43] text-black' : 'text-slate-300 hover:bg-[#333a44]'}`}
                                                >
                                                    <info.icon size={16}/>
                                                    {info.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Items List (Filtered by Category) */}
                                <div className="space-y-1">
                                    {modalItems.map(item => (
                                        <button
                                            key={item.key}
                                            onClick={() => setSelectedStatKey(item.key)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center justify-between transition-colors group ${selectedStatKey === item.key ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                        >
                                            {item.label}
                                            {selectedStatKey === item.key && <ChevronRight size={14}/>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT TABLE */}
                            <div className="flex-1 bg-[#1e232e] overflow-y-auto custom-scrollbar p-4 md:p-6">
                                <div className="bg-[#242931] border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                                    <div className="p-4 bg-[#2a3038] border-b border-slate-700 flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-300 uppercase">
                                            {modalItems.find(i => i.key === selectedStatKey)?.label}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Sıralama</span>
                                    </div>
                                    
                                    <div className="divide-y divide-slate-700/50">
                                        {(() => {
                                            const statConfig = modalItems.find(i => i.key === selectedStatKey);
                                            if (!statConfig) return null;

                                            // Sort Data
                                            const sortedTeams = [...teamStats].sort((a, b) => {
                                                const valA = (a as any)[selectedStatKey];
                                                const valB = (b as any)[selectedStatKey];
                                                
                                                // Handle Array for sorting (e.g. Form Last 5)
                                                if (Array.isArray(valA)) {
                                                    // Fallback sort by points
                                                    return b.points - a.points;
                                                }
                                                
                                                return statConfig.order === 'asc' ? valA - valB : valB - valA;
                                            });

                                            return sortedTeams.map((t, idx) => {
                                                const val = (t as any)[selectedStatKey];
                                                
                                                // Highlighting top 3
                                                let rankClass = "text-slate-500";
                                                if (idx === 0) rankClass = "text-yellow-500 scale-110";
                                                if (idx === 1) rankClass = "text-slate-300";
                                                if (idx === 2) rankClass = "text-orange-400";

                                                return (
                                                    <div 
                                                        key={t.id} 
                                                        className="flex justify-between items-center p-3 hover:bg-[#2e343d] transition-colors cursor-pointer group"
                                                        onClick={() => onTeamClick(t.id)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`font-black font-mono w-6 text-center ${rankClass}`}>{idx + 1}</div>
                                                            <div className="flex items-center gap-3">
                                                                {t.logo ? <img src={t.logo} className="w-8 h-8 object-contain drop-shadow-md"/> : <div className={`w-8 h-8 rounded-full ${t.colors[0]} border border-slate-600`}></div>}
                                                                <span className="font-bold text-slate-200 text-sm group-hover:text-blue-400 transition-colors">{t.name}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* RENDER VALUE OR VISUALS */}
                                                        {Array.isArray(val) ? (
                                                            // Form Dots Renderer
                                                            <div className="flex gap-1.5">
                                                                {val.map((res: string, i: number) => (
                                                                    <div 
                                                                        key={i} 
                                                                        className={`w-3 h-3 rounded-full ${res === 'W' ? 'bg-green-500' : res === 'D' ? 'bg-slate-500' : 'bg-red-500'} shadow-sm`}
                                                                        title={res === 'W' ? 'Galibiyet' : res === 'D' ? 'Beraberlik' : 'Mağlubiyet'}
                                                                    ></div>
                                                                ))}
                                                                {val.length === 0 && <span className="text-xs text-slate-600">-</span>}
                                                            </div>
                                                        ) : (
                                                            // Standard Text Renderer
                                                            <div className="font-mono font-black text-white text-lg">
                                                                {statConfig.format(val)}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* PLAYER STATS MODAL (DETAILED) */}
            {showPlayerStatsModal && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowPlayerStatsModal(false)}>
                    <div className="bg-[#1e232e] w-full max-w-6xl h-[85vh] rounded-2xl border border-slate-700 shadow-2xl relative flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="p-4 border-b border-slate-700 bg-[#161a1f] flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <User size={28} className="text-blue-500"/>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-wider font-teko">Detaylı Oyuncu İstatistikleri</h2>
                            </div>
                            <button onClick={() => setShowPlayerStatsModal(false)} className="p-2 bg-slate-800 hover:bg-red-600 rounded-full text-white transition border border-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex flex-1 overflow-hidden">
                            {/* LEFT MENU */}
                            <div className="w-1/3 md:w-1/4 bg-[#161a1f] border-r border-slate-700 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-4">
                                
                                {/* Category Dropdown */}
                                <div className="relative mb-4 px-2 mt-2">
                                    <button 
                                        onClick={() => setIsPlayerCategoryMenuOpen(!isPlayerCategoryMenuOpen)}
                                        className="w-full bg-[#2a3038] text-white px-4 py-3 rounded-lg border border-slate-600 flex justify-between items-center font-bold text-sm uppercase tracking-wider hover:bg-[#333a44] transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {React.createElement(PLAYER_CATEGORIES[activePlayerCategory].icon, { size: 16, className: 'text-[#ff9f43]' })}
                                            {PLAYER_CATEGORIES[activePlayerCategory].label}
                                        </div>
                                        {isPlayerCategoryMenuOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                    </button>

                                    {isPlayerCategoryMenuOpen && (
                                        <div className="absolute top-full left-2 right-2 mt-1 bg-[#252a33] border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                            {Object.entries(PLAYER_CATEGORIES).map(([key, info]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => handlePlayerCategoryChange(key as keyof typeof PLAYER_CATEGORIES)}
                                                    className={`w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-colors ${activePlayerCategory === key ? 'bg-[#ff9f43] text-black' : 'text-slate-300 hover:bg-[#333a44]'}`}
                                                >
                                                    <info.icon size={16}/>
                                                    {info.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Items List */}
                                <div className="space-y-1">
                                    {playerModalItems.map(item => (
                                        <button
                                            key={item.key}
                                            onClick={() => setSelectedPlayerStatKey(item.key)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center justify-between transition-colors group ${selectedPlayerStatKey === item.key ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                        >
                                            {item.label}
                                            {selectedPlayerStatKey === item.key && <ChevronRight size={14}/>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT TABLE */}
                            <div className="flex-1 bg-[#1e232e] overflow-y-auto custom-scrollbar p-4 md:p-6">
                                <div className="bg-[#242931] border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                                    <div className="p-4 bg-[#2a3038] border-b border-slate-700 flex justify-between items-center">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Sıralama</span>
                                        <span className="text-sm font-bold text-slate-300 uppercase">
                                            {playerModalItems.find(i => i.key === selectedPlayerStatKey)?.label}
                                        </span>
                                    </div>
                                    
                                    <div className="divide-y divide-slate-700/50">
                                        {(() => {
                                            const statConfig = playerModalItems.find(i => i.key === selectedPlayerStatKey);
                                            if (!statConfig) return null;

                                            // Sort Data (playerStatsRaw is already computed)
                                            const sortedPlayers = [...playerStatsRaw].sort((a, b) => {
                                                const valA = (a as any)[selectedPlayerStatKey];
                                                const valB = (b as any)[selectedPlayerStatKey];
                                                // Descending sort for stats
                                                return valB - valA;
                                            });

                                            // Take top 50 to avoid rendering too many
                                            const top50 = sortedPlayers.slice(0, 50);

                                            return top50.map((p, idx) => {
                                                const val = (p as any)[selectedPlayerStatKey];
                                                
                                                // Highlighting top 3
                                                let rankClass = "text-slate-500";
                                                if (idx === 0) rankClass = "text-yellow-500 scale-110";
                                                if (idx === 1) rankClass = "text-slate-300";
                                                if (idx === 2) rankClass = "text-orange-400";

                                                return (
                                                    <div 
                                                        key={p.player.id} 
                                                        className="flex items-center p-3 hover:bg-[#2e343d] transition-colors cursor-pointer group border-b border-slate-700/50 last:border-0"
                                                        onClick={() => onPlayerClick(p.player)}
                                                    >
                                                        {/* Rank */}
                                                        <div className={`font-black font-mono w-8 text-center shrink-0 ${rankClass}`}>{idx + 1}</div>

                                                        {/* Player Info */}
                                                        <div className="flex items-center gap-3 w-64 shrink-0 pl-2">
                                                             <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 overflow-hidden shrink-0">
                                                                 <PlayerFace player={p.player} />
                                                             </div>
                                                             <div className="flex flex-col min-w-0">
                                                                 <span className="font-bold text-slate-200 text-sm group-hover:text-blue-400 transition-colors truncate">{p.player.name}</span>
                                                                 <span className="text-[10px] text-slate-500 font-bold uppercase">{p.player.position}</span>
                                                             </div>
                                                        </div>

                                                        {/* Team Column */}
                                                        <div className="flex-1 px-4 flex flex-col justify-center border-l border-slate-700/30">
                                                             <span className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">Takım</span>
                                                             <div className="flex items-center gap-2">
                                                                 {p.team.logo ? <img src={p.team.logo} className="w-4 h-4 object-contain opacity-90"/> : <div className={`w-3 h-3 rounded-full ${p.team.colors[0]}`}></div>}
                                                                 <span className="text-xs font-bold text-white truncate">{p.team.name}</span>
                                                             </div>
                                                        </div>

                                                        {/* Country Column */}
                                                        <div className="flex-1 px-4 flex flex-col justify-center border-l border-slate-700/30">
                                                             <span className="text-[9px] text-slate-500 font-bold uppercase mb-0.5">Ülke</span>
                                                             <div className="flex items-center gap-2">
                                                                 <img 
                                                                    src={`https://flagcdn.com/w20/${COUNTRY_CODES[p.player.nationality] || 'un'}.png`} 
                                                                    className="w-4 h-auto object-contain opacity-90"
                                                                    alt={p.player.nationality}
                                                                    onError={(e) => e.currentTarget.style.display='none'} 
                                                                 />
                                                                 <span className="text-xs font-bold text-white truncate">{p.player.nationality}</span>
                                                             </div>
                                                        </div>

                                                        {/* Stat Value */}
                                                        <div className="font-mono font-black text-white text-xl pr-4 text-right min-w-[80px]">
                                                            {statConfig.format(val)}
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default CompetitionStatsTab;
