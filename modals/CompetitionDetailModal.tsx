
import React, { useState, useMemo, useEffect } from 'react';
import { Team, Fixture, Player, Position } from '../types';
import { Trophy, X, ChevronLeft, ChevronRight, Star, Activity, Flame, ShieldAlert, History, Goal, Zap, Shield, Award, AlertTriangle, GitCommit, LayoutDashboard, ListTree, CalendarDays, BarChart2, ArrowRightLeft, Users, Info, ArrowRight, Filter, ChevronDown, Presentation } from 'lucide-react';
import StandingsTable from '../components/shared/StandingsTable';
import PlayerFace from '../components/shared/PlayerFace';
import { getFormattedDate } from '../utils/calendarAndFixtures';
import SeasonPreviewModal from './SeasonPreviewModal';

interface CompetitionDetailModalProps {
    competitionId: string;
    competitionName: string;
    teams: Team[];
    fixtures: Fixture[];
    currentWeek: number;
    onClose: () => void;
    onTeamClick: (id: string) => void;
    onPlayerClick: (p: Player) => void;
    variant?: 'modal' | 'embedded';
}

const PAST_SUPER_CUP_WINNERS = [
    { year: '2024/25', teamName: 'Kedispor' },
    { year: '2023/24', teamName: 'Ayıboğanspor SK' },
    { year: '2022/23', teamName: 'Eşşekboğanspor FK' },
    { year: '2021/22', teamName: 'Arıspor' },
    { year: '2020/21', teamName: 'Ayıboğanspor SK' },
    { year: '2019/20', teamName: 'Ayıboğanspor SK' }
];

const PAST_CUP_WINNERS = [
    { year: '2024/25', teamName: 'Kedispor' },
    { year: '2023/24', teamName: 'Ayıboğanspor SK' },
    { year: '2022/23', teamName: 'Ayıboğanspor SK' },
    { year: '2021/22', teamName: 'Ayıboğanspor SK' },
    { year: '2020/21', teamName: 'Ayıboğanspor SK' },
    { year: '2019/20', teamName: 'Maymunspor' }
];

const PAST_EURO_WINNERS = [
    { year: '2024/25', teamName: 'Gorilla United' },
    { year: '2023/24', teamName: 'Gorilla United' },
    { year: '2022/23', teamName: 'Aslanspor SK' },
    { year: '2021/22', teamName: 'Aslanspor SK' },
    { year: '2020/21', teamName: 'Aslanspor SK' },
    { year: '2019/20', teamName: 'Aslanspor SK' }
];

// Round Constants
const CUP_ROUNDS = [
    { id: 100, name: 'Son 32 Turu' },
    { id: 101, name: 'Son 16 Turu' },
    { id: 102, name: 'Çeyrek Final' },
    { id: 103, name: 'Yarı Final' },
    { id: 104, name: 'Final' }
];

const MatchBox: React.FC<{ f: Fixture, teams: Team[] }> = ({ f, teams }) => {
    const h = teams.find(t => t.id === f.homeTeamId);
    const a = teams.find(t => t.id === f.awayTeamId);
    const isFinished = f.played;

    let winnerId = null;
    if (isFinished) {
        if (f.homeScore! > f.awayScore!) winnerId = f.homeTeamId;
        else if (f.awayScore! > f.homeScore!) winnerId = f.awayTeamId;
        else if (f.pkHome! > f.pkAway!) winnerId = f.homeTeamId;
        else winnerId = f.awayTeamId;
    }

    return (
        <div className="bg-[#2c333a] border border-slate-700 rounded p-2 flex flex-col gap-1.5 relative group hover:border-[#ff9f43] transition-colors">
            {/* Match Date */}
            {!isFinished && <div className="text-[9px] text-slate-500 text-center mb-0.5">{getFormattedDate(f.date).label}</div>}
            
            {/* Home Team */}
            <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 truncate flex-1">
                    {h?.logo ? <img src={h.logo} className="w-4 h-4 object-contain"/> : <div className={`w-4 h-4 rounded-full ${h?.colors[0]}`}></div>}
                    <span className={`truncate ${winnerId === h?.id ? 'text-green-400 font-bold' : isFinished ? 'text-slate-500' : 'text-slate-300'}`}>{h?.name}</span>
                </div>
                <span className="font-mono font-bold text-white bg-black/40 px-1.5 rounded min-w-[20px] text-center">{isFinished ? f.homeScore : '-'}</span>
            </div>

            {/* Away Team */}
            <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 truncate flex-1">
                    {a?.logo ? <img src={a.logo} className="w-4 h-4 object-contain"/> : <div className={`w-4 h-4 rounded-full ${a?.colors[0]}`}></div>}
                    <span className={`truncate ${winnerId === a?.id ? 'text-green-400 font-bold' : isFinished ? 'text-slate-500' : 'text-slate-300'}`}>{a?.name}</span>
                </div>
                <span className="font-mono font-bold text-white bg-black/40 px-1.5 rounded min-w-[20px] text-center">{isFinished ? f.awayScore : '-'}</span>
            </div>

            {isFinished && f.pkHome !== undefined && (
                <div className="absolute top-1 right-1 text-[8px] text-yellow-500 font-bold bg-black/80 px-1 rounded">PEN</div>
            )}
        </div>
    );
};

// --- NEW DETAILED LEAGUE TABLE COMPONENT ---
const DetailedLeagueTable = ({ teams, fixtures, onTeamClick, competitionId, onShowPreview, minimal }: { teams: Team[], fixtures: Fixture[], onTeamClick: (id: string) => void, competitionId: string, onShowPreview: () => void, minimal?: boolean }) => {
    const [filter, setFilter] = useState<'OVERALL' | 'HOME' | 'AWAY' | 'FIRST_HALF' | 'SECOND_HALF'>('OVERALL');
    const [viewMode, setViewMode] = useState<'TABLE' | 'XG'>('TABLE'); // Placeholder for future xG

    // Calculate Table Data based on filter
    const tableData = useMemo(() => {
        const statsMap = new Map<string, {
            team: Team, played: number, won: number, drawn: number, lost: number, gf: number, ga: number, pts: number, form: string[]
        }>();

        // Initialize
        teams.forEach(t => {
            statsMap.set(t.id, {
                team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0, form: []
            });
        });

        // Filter Fixtures
        const relevantFixtures = fixtures.filter(f => {
            if (!f.played) return false;
            
            // Competition Check
            const isComp = competitionId === 'LEAGUE' ? (f.competitionId === 'LEAGUE' || !f.competitionId) : f.competitionId === competitionId;
            if (!isComp) return false;

            // Half Season Check
            if (filter === 'FIRST_HALF' && f.week > 17) return false;
            if (filter === 'SECOND_HALF' && f.week <= 17) return false;

            return true;
        }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date for form

        // Process Matches
        relevantFixtures.forEach(f => {
            const hStats = statsMap.get(f.homeTeamId);
            const aStats = statsMap.get(f.awayTeamId);

            // Process Home Team
            if (hStats && (filter === 'OVERALL' || filter === 'HOME' || filter === 'FIRST_HALF' || filter === 'SECOND_HALF')) {
                hStats.played++;
                hStats.gf += f.homeScore!;
                hStats.ga += f.awayScore!;
                if (f.homeScore! > f.awayScore!) { hStats.won++; hStats.pts += 3; hStats.form.push('W'); }
                else if (f.homeScore === f.awayScore!) { hStats.drawn++; hStats.pts += 1; hStats.form.push('D'); }
                else { hStats.lost++; hStats.form.push('L'); }
            }

            // Process Away Team
            if (aStats && (filter === 'OVERALL' || filter === 'AWAY' || filter === 'FIRST_HALF' || filter === 'SECOND_HALF')) {
                aStats.played++;
                aStats.gf += f.awayScore!;
                aStats.ga += f.homeScore!;
                if (f.awayScore! > f.homeScore!) { aStats.won++; aStats.pts += 3; aStats.form.push('W'); }
                else if (f.awayScore === f.homeScore!) { aStats.drawn++; aStats.pts += 1; aStats.form.push('D'); }
                else { aStats.lost++; aStats.form.push('L'); }
            }
        });

        return Array.from(statsMap.values()).sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if ((b.gf - b.ga) !== (a.gf - a.ga)) return (b.gf - b.ga) - (a.gf - a.ga);
            return b.gf - a.gf;
        });

    }, [teams, fixtures, filter, competitionId]);

    const isLeague1 = competitionId === 'LEAGUE_1';
    const isEurope = competitionId === 'EUROPE';

    // Custom Grid columns definition
    const gridColsClass = "grid-cols-[1.5rem_1.5rem_minmax(140px,3fr)_1.5rem_1.5rem_1.5rem_1.5rem_1.5rem_1.5rem_2rem_2rem_4rem]";

    return (
        <div className="flex flex-col h-full bg-[#1b1b1b] text-slate-300">
            {/* Control Bar - Only show if NOT minimal */}
            {!minimal && (
                <div className="flex items-center gap-4 p-4 border-b border-[#333] bg-[#222]">
                    {/* View Selector */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded text-sm font-bold transition">
                            <span>Lig Tablosu</span>
                            <ChevronDown size={14} className="text-slate-400"/>
                        </button>
                    </div>

                    {/* Filter Selector */}
                    <div className="relative group">
                        <button className="flex items-center gap-2 bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded text-sm font-bold transition">
                            <span>
                                {filter === 'OVERALL' ? 'Genel' : 
                                 filter === 'HOME' ? 'İç Saha' : 
                                 filter === 'AWAY' ? 'Dış Saha' : 
                                 filter === 'FIRST_HALF' ? 'İlk Yarı' : 'İkinci Yarı'}
                            </span>
                            <ChevronDown size={14} className="text-slate-400"/>
                        </button>
                        <div className="absolute top-full left-0 mt-2 w-40 bg-[#333] border border-[#444] rounded shadow-xl hidden group-hover:block z-50">
                            <button onClick={() => setFilter('OVERALL')} className="w-full text-left px-4 py-2 text-xs hover:bg-black hover:text-[#ff9f43] text-slate-300">Genel</button>
                            <button onClick={() => setFilter('HOME')} className="w-full text-left px-4 py-2 text-xs hover:bg-black hover:text-[#ff9f43] text-slate-300">İç Saha</button>
                            <button onClick={() => setFilter('AWAY')} className="w-full text-left px-4 py-2 text-xs hover:bg-black hover:text-[#ff9f43] text-slate-300">Dış Saha</button>
                            <div className="h-px bg-[#444] my-1"></div>
                            <button onClick={() => setFilter('FIRST_HALF')} className="w-full text-left px-4 py-2 text-xs hover:bg-black hover:text-[#ff9f43] text-slate-300">1. Yarı</button>
                            <button onClick={() => setFilter('SECOND_HALF')} className="w-full text-left px-4 py-2 text-xs hover:bg-black hover:text-[#ff9f43] text-slate-300">2. Yarı</button>
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={onShowPreview}
                            className="flex items-center gap-1 bg-[#ff9f43] text-black hover:bg-yellow-400 px-3 py-1.5 rounded text-xs font-bold transition mr-2 shadow-lg shadow-orange-900/20"
                        >
                            <Presentation size={14}/>
                            <span className="hidden sm:inline">Sezon Öncesi Bakış</span>
                        </button>
                        
                        <button className="p-1 text-slate-500 hover:text-white cursor-not-allowed"><ChevronLeft size={20}/></button>
                        <div className="text-xs font-bold text-white bg-[#333] px-3 py-1 rounded">2025/26</div>
                        <button className="p-1 text-slate-500 hover:text-white cursor-not-allowed"><ChevronRight size={20}/></button>
                    </div>
                </div>
            )}

            {/* Table Header */}
            <div className={`grid ${gridColsClass} gap-2 px-2 py-2 bg-[#252525] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#333] items-center`}>
                <div className="text-center">Poz</div>
                <div className="text-center">Bil</div>
                <div className="pl-2">Takım</div>
                <div className="text-center">O</div>
                <div className="text-center">G</div>
                <div className="text-center">B</div>
                <div className="text-center">M</div>
                <div className="text-center text-green-500">A</div>
                <div className="text-center text-red-500">Y</div>
                <div className="text-center">AV</div>
                <div className="text-center text-white">P</div>
                <div className="text-center">Form</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {tableData.map((row, index) => {
                    const rank = index + 1;
                    
                    // Qualification Colors
                    let barColor = '';
                    let infoText = '-';
                    
                    if (isEurope) {
                         if (rank <= 8) { barColor = 'border-green-500'; infoText = 'S16'; } // Round of 16
                         else if (rank <= 24) { barColor = 'border-blue-500'; infoText = 'PO'; } // Playoff
                         else { barColor = 'border-red-600'; infoText = 'E'; } // Eliminated
                    } else if (isLeague1) {
                         if (rank <= 2) { barColor = 'border-green-500'; infoText = 'Y'; } // Promotion (Upper League)
                         else if (rank <= 6) { barColor = 'border-blue-500'; infoText = 'PO'; } // Playoff
                         else if (rank >= tableData.length - 2) { barColor = 'border-red-600'; infoText = 'D'; } // Relegation
                    } else {
                         // Super League
                         if (rank <= 4) { barColor = 'border-green-500'; infoText = 'AVR'; } // Europe
                         else if (rank >= tableData.length - 2) { barColor = 'border-red-600'; infoText = 'D'; } // Relegation
                    }

                    // Form (Last 5)
                    const last5 = row.form.slice(-5);

                    return (
                        <div 
                            key={row.team.id} 
                            onClick={() => onTeamClick(row.team.id)}
                            className={`grid ${gridColsClass} gap-2 px-2 py-2 items-center hover:bg-[#2a2a2a] transition-colors border-b border-[#2c2c2c] cursor-pointer group ${barColor ? `border-l-4 ${barColor} pl-1` : 'border-l-4 border-transparent pl-1'}`}
                        >
                            <div className="text-center font-bold text-white text-xs">{rank}</div>
                            <div className="text-center text-[10px] font-bold text-slate-500">{infoText !== '-' ? infoText : ''}</div>
                            <div className="flex items-center gap-2 pl-2 overflow-hidden">
                                {row.team.logo ? <img src={row.team.logo} className="w-5 h-5 object-contain"/> : <div className={`w-5 h-5 rounded-full ${row.team.colors[0]}`}></div>}
                                <span className="font-bold text-slate-200 text-xs truncate group-hover:text-[#ff9f43] transition-colors">{row.team.name}</span>
                            </div>
                            <div className="text-center text-slate-400 text-xs">{row.played}</div>
                            <div className="text-center text-green-500 font-bold text-xs">{row.won}</div>
                            <div className="text-center text-slate-500 text-xs">{row.drawn}</div>
                            <div className="text-center text-red-500 text-xs">{row.lost}</div>
                            <div className="text-center text-slate-300 text-xs">{row.gf}</div>
                            <div className="text-center text-slate-300 text-xs">{row.ga}</div>
                            <div className="text-center text-slate-300 text-xs font-bold">{row.gf - row.ga}</div>
                            <div className="text-center text-white font-black text-sm bg-[#333] rounded py-0.5">{row.pts}</div>
                            
                            {/* Form display directly in row */}
                            <div className="flex items-center justify-center gap-1">
                                {last5.map((res, i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full ${res === 'W' ? 'bg-green-600' : res === 'D' ? 'bg-slate-500' : 'bg-red-600'}`} title={res}></div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const CompetitionDetailModal: React.FC<CompetitionDetailModalProps> = ({ 
    competitionId, 
    competitionName, 
    teams, 
    fixtures, 
    currentWeek, 
    onClose, 
    onTeamClick, 
    onPlayerClick, 
    variant = 'modal' 
}) => {
    // State for Fixture Navigation
    const [viewWeek, setViewWeek] = useState<number>(currentWeek);
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ROUNDS' | 'FIXTURES' | 'STATS' | 'TRANSFERS' | 'CLUBS' | 'ABOUT'>('OVERVIEW');
    const [showSeasonPreview, setShowSeasonPreview] = useState(false);

    // Initialize viewWeek based on Competition Type
    useEffect(() => {
        if (competitionId === 'CUP') {
            const cupFixtures = fixtures.filter(f => f.competitionId === 'CUP');
            if (cupFixtures.length > 0) {
                const unplayed = cupFixtures.find(f => !f.played);
                if (unplayed) setViewWeek(unplayed.week);
                else {
                    const lastPlayed = cupFixtures.sort((a,b) => b.week - a.week)[0];
                    setViewWeek(lastPlayed ? lastPlayed.week : 100);
                }
            } else setViewWeek(100);
        } else if (competitionId === 'EUROPE') {
            // Find current stage for Europe
            const euroFixtures = fixtures.filter(f => f.competitionId === 'EUROPE');
            if (euroFixtures.length > 0) {
                const unplayed = euroFixtures.find(f => !f.played);
                if (unplayed) setViewWeek(unplayed.week);
                else {
                     // Default to Round 1 if none found, or last played
                     const lastPlayed = euroFixtures.sort((a,b) => b.week - a.week)[0];
                     setViewWeek(lastPlayed ? lastPlayed.week : 201);
                }
            } else setViewWeek(201); // Start of League Phase
        } else if (competitionId === 'LEAGUE' || competitionId === 'LEAGUE_1') {
            setViewWeek(currentWeek);
        } else if (competitionId === 'SUPER_CUP') {
            setViewWeek(90); // Semi Finals
        }
    }, [competitionId, fixtures, currentWeek]);

    // State for Stats Tab
    const [statTab, setStatTab] = useState<'GOAL' | 'RATING' | 'ASSIST' | 'CLEANSHEET' | 'MVP' | 'CARD'>('GOAL');

    const isLeague = competitionId === 'LEAGUE' || competitionId === 'LEAGUE_1';
    // Europe is Hybrid: League Table (Phase 1) + Bracket (Phase 2)
    const isEurope = competitionId === 'EUROPE';
    // isEuropeLeaguePhase determines IF WE SHOW the table or the bracket UI
    const isEuropeLeaguePhase = isEurope && viewWeek >= 201 && viewWeek <= 208;
    // shouldShowStandings indicates if we need to calculate and display a table AT ALL
    const shouldShowStandings = isLeague || isEuropeLeaguePhase;

    // Filter teams based on competition participation
    const competitionTeams = useMemo(() => {
        if (competitionId === 'LEAGUE') {
            return teams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
        } else if (competitionId === 'LEAGUE_1') {
            return teams.filter(t => t.leagueId === 'LEAGUE_1');
        } else if (competitionId === 'CUP') {
            return teams; 
        } else if (competitionId === 'EUROPE') {
            const euroFixtures = fixtures.filter(f => f.competitionId === 'EUROPE');
            const teamIds = new Set<string>();
            euroFixtures.forEach(f => { teamIds.add(f.homeTeamId); teamIds.add(f.awayTeamId); });
            if (teamIds.size === 0) return teams.filter(t => t.leagueId === 'EUROPE_LEAGUE');
            return teams.filter(t => teamIds.has(t.id));
        } else if (competitionId === 'SUPER_CUP' || competitionId === 'PLAYOFF') {
             const compFixtures = fixtures.filter(f => f.competitionId === competitionId || (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL'));
             const teamIds = new Set<string>();
             compFixtures.forEach(f => { teamIds.add(f.homeTeamId); teamIds.add(f.awayTeamId); });
             return teams.filter(t => teamIds.has(t.id));
        }
        return teams;
    }, [teams, competitionId, fixtures]);

    // DYNAMIC STANDINGS CALCULATION (CRITICAL FIX FOR ISOLATING STATS)
    const teamsWithCompetitionStats = useMemo(() => {
        // We need stats for "Genel Bakış" (Overview)
        if (!shouldShowStandings && activeTab !== 'CLUBS') return [];

        return competitionTeams.map(t => {
            let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0, points = 0;

            const relevantFixtures = fixtures.filter(f => 
                f.played && 
                (f.homeTeamId === t.id || f.awayTeamId === t.id) &&
                (
                    (isLeague && (competitionId === 'LEAGUE' ? (f.competitionId === 'LEAGUE' || !f.competitionId) : f.competitionId === competitionId)) ||
                    (competitionId === 'EUROPE' && f.competitionId === 'EUROPE' && f.week >= 201 && f.week <= 208)
                )
            );

            relevantFixtures.forEach(f => {
                played++;
                const isHome = f.homeTeamId === t.id;
                const myScore = isHome ? f.homeScore! : f.awayScore!;
                const oppScore = isHome ? f.awayScore! : f.homeScore!;
                gf += myScore;
                ga += oppScore;

                if (myScore > oppScore) { won++; points += 3; }
                else if (myScore === oppScore) { drawn++; points += 1; }
                else { lost++; }
            });

            return {
                ...t,
                stats: { played, won, drawn, lost, gf, ga, points }
            };
        });
    }, [competitionTeams, fixtures, isLeague, shouldShowStandings, competitionId, activeTab]);

    // Calculate League History outside conditional render loop (Fix for Hook Error #300)
    const leagueHistory = useMemo(() => {
        if (!isLeague) return [];
        const hist: {year:string, team:Team}[] = [];
        const relevantTeams = teams.filter(t => t.leagueId === competitionId || (!t.leagueId && competitionId === 'LEAGUE'));
        relevantTeams.forEach(t => t.leagueHistory?.filter(h => h.rank===1).forEach(h => hist.push({year: h.year, team: t})));
        return hist.sort((a,b) => parseInt(b.year) - parseInt(a.year)).slice(0,6);
    }, [teams, competitionId, isLeague]);

    // Fixtures for the specific week/round
    const weekFixtures = useMemo(() => {
        return fixtures
            .filter(f => {
                const compMatch = f.competitionId === competitionId || (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL');
                const weekMatch = f.week === viewWeek;
                if (isLeague) {
                    // Filter League matches to only show correct division
                    const h = teams.find(t => t.id === f.homeTeamId);
                    const correctLeague = h && (competitionId === 'LEAGUE' ? (h.leagueId === 'LEAGUE' || !h.leagueId) : h.leagueId === 'LEAGUE_1');
                    return compMatch && weekMatch && correctLeague;
                }
                return compMatch && weekMatch;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [fixtures, viewWeek, competitionId, isLeague, teams]);

    // All Competition Fixtures (For Fixtures Tab)
    const allCompetitionFixtures = useMemo(() => {
        return fixtures
            .filter(f => {
                const compMatch = f.competitionId === competitionId || (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL');
                if (isLeague) {
                    const h = teams.find(t => t.id === f.homeTeamId);
                    const correctLeague = h && (competitionId === 'LEAGUE' ? (h.leagueId === 'LEAGUE' || !h.leagueId) : h.leagueId === 'LEAGUE_1');
                    return compMatch && correctLeague;
                }
                return compMatch;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first
    }, [fixtures, competitionId, isLeague, teams]);

    // Player Stats Logic (Same as before)
    const statsList = useMemo(() => {
        const playerStatsMap: Record<string, {
            goals: number, assists: number, yellow: number, red: number, 
            ratingsSum: number, matches: number, cleanSheets: number, mvps: number
        }> = {};

        const compFixtures = fixtures.filter(f => 
            f.competitionId === competitionId || 
            (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL')
        );

        compFixtures.forEach(f => {
            if (!f.played || !f.matchEvents) return;
            
            f.matchEvents.forEach(e => {
                if (e.playerId) {
                    if (!playerStatsMap[e.playerId]) playerStatsMap[e.playerId] = { goals: 0, assists: 0, yellow: 0, red: 0, ratingsSum: 0, matches: 0, cleanSheets: 0, mvps: 0 };
                    if (e.type === 'GOAL') playerStatsMap[e.playerId].goals++;
                    if (e.type === 'CARD_YELLOW') playerStatsMap[e.playerId].yellow++;
                    if (e.type === 'CARD_RED') playerStatsMap[e.playerId].red++;
                }
                if (e.type === 'GOAL' && e.assist) {
                    const h = teams.find(t => t.id === f.homeTeamId);
                    const a = teams.find(t => t.id === f.awayTeamId);
                    const assistPlayer = h?.players.find(p => p.name === e.assist) || a?.players.find(p => p.name === e.assist);
                    if (assistPlayer) {
                        if (!playerStatsMap[assistPlayer.id]) playerStatsMap[assistPlayer.id] = { goals: 0, assists: 0, yellow: 0, red: 0, ratingsSum: 0, matches: 0, cleanSheets: 0, mvps: 0 };
                        playerStatsMap[assistPlayer.id].assists++;
                    }
                }
            });

            if (f.stats?.mvpPlayerId) {
                if (!playerStatsMap[f.stats.mvpPlayerId]) playerStatsMap[f.stats.mvpPlayerId] = { goals: 0, assists: 0, yellow: 0, red: 0, ratingsSum: 0, matches: 0, cleanSheets: 0, mvps: 0 };
                playerStatsMap[f.stats.mvpPlayerId].mvps++;
            }

            const processRatings = (ratings: any[], teamId: string, conceded: number) => {
                ratings.forEach(r => {
                    if (!playerStatsMap[r.playerId]) playerStatsMap[r.playerId] = { goals: 0, assists: 0, yellow: 0, red: 0, ratingsSum: 0, matches: 0, cleanSheets: 0, mvps: 0 };
                    playerStatsMap[r.playerId].ratingsSum += r.rating;
                    playerStatsMap[r.playerId].matches++;
                    if (r.position === 'GK' && conceded === 0) {
                        playerStatsMap[r.playerId].cleanSheets++;
                    }
                });
            };

            if (f.stats?.homeRatings) processRatings(f.stats.homeRatings, f.homeTeamId, f.awayScore!);
            if (f.stats?.awayRatings) processRatings(f.stats.awayRatings, f.awayTeamId, f.homeScore!);
        });

        const allPlayers = Object.entries(playerStatsMap).map(([pid, s]) => {
            let player: Player | undefined;
            let team: Team | undefined;
            
            for (const t of competitionTeams) {
                const found = t.players.find(p => p.id === pid);
                if (found) { player = found; team = t; break; }
            }
            if (!player) {
                for (const t of teams) {
                    const found = t.players.find(p => p.id === pid);
                    if (found) { player = found; team = t; break; }
                }
            }
            
            if (!player || !team) return null;

            return {
                ...player,
                teamName: team.name,
                teamLogo: team.logo,
                compStats: {
                    ...s,
                    averageRating: s.matches > 0 ? s.ratingsSum / s.matches : 0
                }
            };
        }).filter(Boolean) as (Player & { teamName: string, teamLogo?: string, compStats: any })[];

        let sorted = [];
        let valueKey = (p: any) => 0;
        let displayFormat = (val: number) => val.toString();

        switch(statTab) {
            case 'GOAL':
                sorted = allPlayers.filter(p => p.compStats.goals > 0).sort((a,b) => b.compStats.goals - a.compStats.goals);
                valueKey = (p) => p.compStats.goals;
                break;
            case 'ASSIST':
                sorted = allPlayers.filter(p => p.compStats.assists > 0).sort((a,b) => b.compStats.assists - a.compStats.assists);
                valueKey = (p) => p.compStats.assists;
                break;
            case 'RATING':
                sorted = allPlayers.filter(p => p.compStats.matches >= 3).sort((a,b) => b.compStats.averageRating - a.compStats.averageRating);
                valueKey = (p) => p.compStats.averageRating;
                displayFormat = (val) => val.toFixed(2);
                break;
            case 'MVP':
                sorted = allPlayers.filter(p => p.compStats.mvps > 0).sort((a,b) => b.compStats.mvps - a.compStats.mvps);
                valueKey = (p) => p.compStats.mvps;
                break;
            case 'CARD':
                sorted = allPlayers.filter(p => p.compStats.yellow > 0 || p.compStats.red > 0).sort((a,b) => (b.compStats.yellow + b.compStats.red*3) - (a.compStats.yellow + a.compStats.red*3));
                valueKey = (p) => p.compStats.yellow; 
                displayFormat = (val) => val.toString(); 
                break;
            case 'CLEANSHEET':
                sorted = allPlayers.filter(p => p.compStats.cleanSheets > 0).sort((a,b) => b.compStats.cleanSheets - a.compStats.cleanSheets);
                valueKey = (p) => p.compStats.cleanSheets;
                break;
        }

        // Return full list for Stats Tab, Slice 5 for Overview
        return {
            full: sorted.map(p => ({ ...p, displayValue: displayFormat(valueKey(p)) })),
            top5: sorted.slice(0, 5).map(p => ({ ...p, displayValue: displayFormat(valueKey(p)) }))
        };

    }, [teams, fixtures, statTab, competitionId, competitionTeams]);

    // Transfers Logic
    const competitionTransfers = useMemo(() => {
        const transfers: any[] = [];
        competitionTeams.forEach(t => {
            if (t.transferHistory) {
                t.transferHistory.filter(th => th.type === 'BOUGHT' || th.type === 'LOAN_IN').forEach(th => {
                    transfers.push({
                        ...th,
                        teamName: t.name,
                        teamLogo: t.logo,
                        teamColors: t.colors
                    });
                });
            }
        });
        return transfers.reverse();
    }, [competitionTeams]);

    const containerClass = variant === 'modal' 
        ? "fixed inset-0 z-[150] bg-black/95 flex flex-col animate-in fade-in duration-300"
        : "flex-1 flex flex-col h-full bg-[#1b1b1b] overflow-hidden"; 

    const renderBracket = () => {
        if (weekFixtures.length === 0) {
            return (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                    Bu tur için eşleşme bulunamadı veya kura çekilmedi.
                </div>
            );
        }
        
        let gridCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-2";
        if (viewWeek === 104 || viewWeek === 91 || viewWeek === 217 || competitionId === 'PLAYOFF_FINAL') gridCols = "grid-cols-1 justify-center max-w-sm mx-auto";

        return (
            <div className="h-full overflow-y-auto custom-scrollbar p-4 relative">
                <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>
                
                <div className="text-center mb-6">
                    <span className="inline-block bg-[#ff9f43]/10 text-[#ff9f43] border border-[#ff9f43]/50 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                        {competitionId === 'CUP' ? CUP_ROUNDS.find(r => r.id === viewWeek)?.name || 'Bilinmeyen Tur' : 
                         competitionId === 'EUROPE' ? (
                             viewWeek === 209 ? 'Play-Off Turu 1. Maç' :
                             viewWeek === 210 ? 'Play-Off Turu 2. Maç' :
                             viewWeek === 211 ? 'Son 16 Turu 1. Maç' :
                             viewWeek === 212 ? 'Son 16 Turu 2. Maç' :
                             viewWeek === 213 ? 'Çeyrek Final 1. Maç' :
                             viewWeek === 214 ? 'Çeyrek Final 2. Maç' :
                             viewWeek === 215 ? 'Yarı Final 1. Maç' :
                             viewWeek === 216 ? 'Yarı Final 2. Maç' :
                             'Final'
                         ) :
                         competitionId === 'SUPER_CUP' && viewWeek === 90 ? 'YARI FİNAL' :
                         competitionId === 'SUPER_CUP' && viewWeek === 91 ? 'Süper Kupa Finali' :
                         competitionId === 'PLAYOFF' ? 'Play-Off Yarı Final' : 'Play-Off Finali'}
                    </span>
                </div>

                <div className={`grid ${gridCols} gap-4 relative z-10`}>
                    {weekFixtures.map(f => (
                        <MatchBox key={f.id} f={f} teams={teams} />
                    ))}
                </div>

                {(viewWeek === 104 || viewWeek === 91 || viewWeek === 217 || competitionId === 'PLAYOFF_FINAL') && weekFixtures[0]?.played && (
                     <div className="mt-8 text-center animate-in zoom-in duration-700">
                        <Trophy size={48} className="mx-auto text-yellow-500 mb-2 drop-shadow-lg"/>
                        <div className="text-sm text-slate-400 uppercase font-bold mb-1">ŞAMPİYON</div>
                        {(() => {
                            const f = weekFixtures[0];
                            const winnerId = f.homeScore! > f.awayScore! ? f.homeTeamId : (f.awayScore! > f.homeScore! ? f.awayTeamId : (f.pkHome! > f.pkAway! ? f.homeTeamId : f.awayTeamId));
                            const winner = teams.find(t => t.id === winnerId);
                            return (
                                <div className="flex flex-col items-center">
                                    <div className="text-2xl font-black text-white uppercase tracking-wider">{winner?.name}</div>
                                </div>
                            )
                        })()}
                     </div>
                )}
            </div>
        );
    };

    const handlePrevRound = () => {
        if (competitionId === 'CUP') {
            const idx = CUP_ROUNDS.findIndex(r => r.id === viewWeek);
            if (idx > 0) setViewWeek(CUP_ROUNDS[idx - 1].id);
        } else if (isLeague) {
            setViewWeek(Math.max(1, viewWeek - 1));
        } else if (competitionId === 'SUPER_CUP' && viewWeek === 91) {
            setViewWeek(90);
        } else if (isEurope) {
            setViewWeek(Math.max(201, viewWeek - 1));
        }
    };

    const handleNextRound = () => {
        if (competitionId === 'CUP') {
            const idx = CUP_ROUNDS.findIndex(r => r.id === viewWeek);
            if (idx < CUP_ROUNDS.length - 1) setViewWeek(CUP_ROUNDS[idx + 1].id);
        } else if (isLeague) {
            setViewWeek(Math.min(34, viewWeek + 1));
        } else if (competitionId === 'SUPER_CUP' && viewWeek === 90) {
            setViewWeek(91);
        } else if (isEurope) {
            setViewWeek(Math.min(217, viewWeek + 1));
        }
    };

    const getRoundLabel = () => {
        if (competitionId === 'CUP') return CUP_ROUNDS.find(r => r.id === viewWeek)?.name;
        if (isLeague) return `${viewWeek}. HAFTA`;
        if (competitionId === 'SUPER_CUP') return viewWeek === 90 ? 'YARI FİNAL' : 'FİNAL';
        if (competitionId === 'EUROPE') {
            if (viewWeek <= 208) return `LİG AŞAMASI ${viewWeek - 200}. MAÇ`;
            if (viewWeek === 209) return 'PLAY-OFF TURU 1';
            if (viewWeek === 210) return 'PLAY-OFF TURU 2';
            if (viewWeek === 211) return 'SON 16 - 1. MAÇ';
            if (viewWeek === 212) return 'SON 16 - 2. MAÇ';
            if (viewWeek === 213) return 'ÇEYREK FİNAL 1';
            if (viewWeek === 214) return 'ÇEYREK FİNAL 2';
            if (viewWeek === 215) return 'YARI FİNAL 1';
            if (viewWeek === 216) return 'YARI FİNAL 2';
            if (viewWeek === 217) return 'FİNAL';
        }
        return 'MAÇLAR';
    };

    // --- RENDER TAB CONTENT HELPERS ---

    const renderFixtureList = () => {
        if (allCompetitionFixtures.length === 0) return <div className="p-8 text-center text-slate-500 italic">Fikstür bulunamadı.</div>;
        
        return (
            <div className="overflow-y-auto custom-scrollbar h-full">
                <div className="divide-y divide-[#333]">
                    {allCompetitionFixtures.map(f => {
                         const h = teams.find(t => t.id === f.homeTeamId);
                         const a = teams.find(t => t.id === f.awayTeamId);
                         const date = getFormattedDate(f.date).label;
                         const resultClass = f.played ? 'text-white font-bold' : 'text-slate-500';
                         
                         return (
                             <div key={f.id} className="flex items-center justify-between p-3 px-4 hover:bg-[#252525] transition-colors">
                                 <div className="text-xs text-slate-500 w-24">{date}</div>
                                 <div className="flex-1 flex justify-center items-center gap-4">
                                     <div className="flex items-center gap-2 text-right justify-end w-1/3" onClick={() => h && onTeamClick(h.id)}>
                                         <span className="text-sm font-bold text-slate-300 truncate cursor-pointer hover:text-white">{h?.name}</span>
                                         {h?.logo && <img src={h.logo} className="w-5 h-5 object-contain"/>}
                                     </div>
                                     <div className={`w-12 text-center bg-[#111] py-1 rounded text-xs font-mono ${resultClass}`}>
                                         {f.played ? `${f.homeScore}-${f.awayScore}` : 'v'}
                                     </div>
                                     <div className="flex items-center gap-2 text-left justify-start w-1/3" onClick={() => a && onTeamClick(a.id)}>
                                         {a?.logo && <img src={a.logo} className="w-5 h-5 object-contain"/>}
                                         <span className="text-sm font-bold text-slate-300 truncate cursor-pointer hover:text-white">{a?.name}</span>
                                     </div>
                                 </div>
                                 <div className="w-12 text-right text-[10px] text-slate-600 font-bold">{f.week}. HF</div>
                             </div>
                         )
                    })}
                </div>
            </div>
        );
    };

    const renderFullStats = () => {
        return (
            <div className="h-full flex flex-col">
                <div className="bg-[#252525] border-b border-[#333] p-2 flex gap-2 overflow-x-auto no-scrollbar">
                    {['GOAL', 'ASSIST', 'RATING', 'CLEANSHEET', 'MVP', 'CARD'].map(t => (
                        <button 
                            key={t}
                            onClick={() => setStatTab(t as any)} 
                            className={`px-4 py-2 rounded text-xs font-bold transition ${statTab === t ? 'bg-[#ff9f43] text-black' : 'bg-[#333] text-slate-400 border-[#444] hover:bg-[#444]'}`}
                        >
                            {t === 'GOAL' ? 'Gol Krallığı' : t === 'ASSIST' ? 'Asist Krallığı' : t === 'RATING' ? 'Reyting' : t === 'CLEANSHEET' ? 'Gol Yememe' : t === 'MVP' ? 'Maçın Adamı' : 'Kartlar'}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-[#111] text-xs uppercase text-slate-500 font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-3 w-12 text-center">#</th>
                                <th className="p-3">Oyuncu</th>
                                <th className="p-3">Takım</th>
                                <th className="p-3 text-center">Maç</th>
                                <th className="p-3 text-right text-[#ff9f43]">Değer</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#333]">
                            {statsList.full.map((p, i) => (
                                <tr key={p.id} className="hover:bg-[#252525] transition cursor-pointer" onClick={() => onPlayerClick(p)}>
                                    <td className="p-3 text-center font-mono text-slate-500">{i+1}</td>
                                    <td className="p-3 font-bold text-white flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-600"><PlayerFace player={p} /></div>
                                        {p.name}
                                    </td>
                                    <td className="p-3 text-slate-400">{p.teamName}</td>
                                    <td className="p-3 text-center font-mono text-slate-500">{p.compStats.matches}</td>
                                    <td className="p-3 text-right font-black text-[#ff9f43] text-lg font-mono">{p.displayValue}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderTransfers = () => {
        if (competitionTransfers.length === 0) return <div className="p-8 text-center text-slate-500 italic">Transfer bulunamadı.</div>;
        return (
            <div className="overflow-y-auto custom-scrollbar h-full">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-[#111] text-xs uppercase text-slate-500 font-bold sticky top-0 z-10">
                        <tr>
                            <th className="p-3">Tarih</th>
                            <th className="p-3">Oyuncu</th>
                            <th className="p-3">Alan Takım</th>
                            <th className="p-3">Eski Takım</th>
                            <th className="p-3 text-right">Bedel</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333]">
                        {competitionTransfers.map((t, i) => (
                            <tr key={i} className="hover:bg-[#252525] transition">
                                <td className="p-3 text-xs text-slate-500">{t.date}</td>
                                <td className="p-3 font-bold text-white">{t.playerName}</td>
                                <td className="p-3 text-emerald-400 font-bold">{t.teamName}</td>
                                <td className="p-3 text-slate-400">{t.counterparty}</td>
                                <td className="p-3 text-right font-mono font-bold text-white">{t.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderClubs = () => (
        <div className="overflow-y-auto custom-scrollbar h-full p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {competitionTeams.map(t => (
                    <div 
                        key={t.id} 
                        onClick={() => onTeamClick(t.id)}
                        className="bg-[#2c333a] border border-slate-700 hover:border-[#ff9f43] rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition group"
                    >
                        {t.logo ? <img src={t.logo} className="w-16 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform"/> : <div className={`w-16 h-16 rounded-full ${t.colors[0]} flex items-center justify-center text-2xl font-bold text-white`}>{t.name.charAt(0)}</div>}
                        <div className="text-center">
                            <div className="font-bold text-white text-sm group-hover:text-[#ff9f43] transition-colors">{t.name}</div>
                            <div className="text-xs text-slate-500 mt-1">{t.stadiumName}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAbout = () => (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-[#1b1b1b] text-slate-300">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2 font-teko uppercase tracking-wide border-b border-[#333] pb-2">{competitionName} Hakkında</h3>
                    <p className="leading-relaxed text-sm">
                        {competitionId === 'LEAGUE' && "Türkiye'nin en üst düzey futbol ligidir. 18 takımın mücadele ettiği ligde şampiyon olan takım ve ilk sıraları alan takımlar Avrupa kupalarına katılmaya hak kazanır. Son 3 sıradaki takımlar 1. Lig'e düşer."}
                        {competitionId === 'LEAGUE_1' && "Türkiye futbol sisteminin ikinci seviyesidir. İlk 2 takım doğrudan Süper Lig'e yükselirken, 3., 4., 5. ve 6. sıradaki takımlar Play-Off oynar."}
                        {competitionId === 'CUP' && "Türkiye'deki tüm profesyonel takımların katıldığı eleme usulü turnuvadır. Kazanan takım Avrupa kupalarına katılma hakkı ve Süper Kupa finali oynama hakkı elde eder."}
                        {competitionId === 'SUPER_CUP' && "Lig şampiyonu ile Türkiye Kupası şampiyonunun karşılaştığı, sezonun en prestijli tek maçlık finalidir."}
                        {competitionId === 'EUROPE' && "Kıtanın en iyi takımlarının mücadele ettiği en büyük organizasyon. Lig usulü grup aşaması ve ardından gelen eleme turları ile şampiyon belirlenir."}
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#252525] p-6 rounded-xl border border-[#333]">
                        <h4 className="text-[#ff9f43] font-bold text-sm uppercase mb-4 flex items-center gap-2"><Trophy size={16}/> Ödüller & Kurallar</h4>
                        <ul className="space-y-2 text-xs">
                            <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5"></div><span>3 Puan Sistemi uygulanır.</span></li>
                            <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5"></div><span>Eşitlik halinde ikili averaj, sonra genel averaj.</span></li>
                            <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5"></div><span>Sarı kart cezası sınırı 4 karttır.</span></li>
                            <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5"></div><span>Devre arası ve sezon sonu transfer dönemleri vardır.</span></li>
                        </ul>
                    </div>

                    <div className="bg-[#252525] p-6 rounded-xl border border-[#333]">
                        <h4 className="text-[#ff9f43] font-bold text-sm uppercase mb-4 flex items-center gap-2"><History size={16}/> Tarihçe</h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between border-b border-[#333] pb-1"><span>Kuruluş</span> <span className="text-white">1959</span></div>
                            <div className="flex justify-between border-b border-[#333] pb-1"><span>En Çok Şampiyon</span> <span className="text-white">Eşşekboğanspor FK</span></div>
                            <div className="flex justify-between border-b border-[#333] pb-1"><span>Son Şampiyon</span> <span className="text-white text-right">Ayıboğanspor SK</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render Logic for Overview Tab (The Original Complex Grid)
    const renderOverview = () => (
        <div className="grid grid-cols-12 gap-4 h-full p-4 overflow-hidden">
            {/* LEFT COLUMN: STANDINGS OR BRACKET (Col Span 4) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col h-full overflow-hidden">
                <div className="bg-[#252525] rounded border border-[#333] flex flex-col h-full">
                    <div className="p-3 border-b border-[#333]">
                        <div className="flex items-center justify-between text-[#ff9f43] font-bold text-xs uppercase mb-2 pl-2 border-l-4 border-[#ff9f43]">
                            <span>{shouldShowStandings ? "Puan Durumu" : "Turnuva Yolu"}</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {shouldShowStandings ? (
                            <DetailedLeagueTable 
                                teams={teamsWithCompetitionStats} 
                                fixtures={fixtures} 
                                onTeamClick={onTeamClick} 
                                competitionId={competitionId} 
                                onShowPreview={() => setShowSeasonPreview(true)}
                                minimal={true}
                            />
                        ) : (
                            renderBracket()
                        )}
                    </div>
                </div>
            </div>

            {/* MIDDLE COLUMN: FIXTURES WITH NAV (Col Span 5) */}
            <div className="col-span-12 lg:col-span-5 flex flex-col h-full overflow-hidden">
                <div className="bg-[#252525] rounded border border-[#333] flex flex-col h-full">
                    <div className="p-3 border-b border-[#333]">
                        <div className="flex items-center justify-between text-[#ff9f43] font-bold text-xs uppercase mb-2 pl-2 border-l-4 border-[#ff9f43]">
                            <span>Fikstür & Sonuçlar</span>
                            <div className="flex items-center gap-4 text-white bg-[#111] px-3 py-1 rounded-full border border-[#444]">
                                <button onClick={handlePrevRound} className="hover:text-[#ff9f43] transition"><ChevronLeft size={16}/></button>
                                <span className="text-xs font-bold text-slate-200 w-28 text-center truncate">
                                    {getRoundLabel()}
                                </span>
                                <button onClick={handleNextRound} className="hover:text-[#ff9f43] transition"><ChevronRight size={16}/></button>
                            </div>
                        </div>
                        {(shouldShowStandings) && <div className="text-[10px] text-slate-500 font-bold mt-1 px-2 text-center">{weekFixtures.length > 0 ? getFormattedDate(weekFixtures[0].date).label : 'Maç Yok'}</div>}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {weekFixtures.length === 0 ? (
                            <div className="text-center text-slate-500 text-xs py-10">Bu turda maç bulunmuyor.</div>
                        ) : (
                            <div className="divide-y divide-[#333]">
                                {weekFixtures.map(f => {
                                    const h = teams.find(t => t.id === f.homeTeamId);
                                    const a = teams.find(t => t.id === f.awayTeamId);
                                    
                                    return (
                                        <div key={f.id} className="flex items-center justify-between py-3 px-4 hover:bg-[#333] group transition-colors relative">
                                            <div 
                                                className="flex-1 text-right flex items-center justify-end gap-3 cursor-pointer group/team"
                                                onClick={(e) => { e.stopPropagation(); if(h) onTeamClick(h.id); }}
                                            >
                                                <span className="text-sm font-bold text-slate-300 truncate group-hover/team:text-[#ff9f43] transition-colors">{h?.name}</span>
                                                {h?.logo && <img src={h.logo} className="w-6 h-6 object-contain" />}
                                            </div>
                                            
                                            <div className="px-4 text-center min-w-[80px] flex flex-col items-center">
                                                {f.played ? (
                                                    <>
                                                        <span className="text-white font-mono font-black text-lg tracking-widest">{f.homeScore}-{f.awayScore}</span>
                                                        {f.pkHome !== undefined && (
                                                            <span className="text-[9px] text-yellow-500 font-mono">P: {f.pkHome}-{f.pkAway}</span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-slate-600 text-xs font-mono">-</span>
                                                )}
                                            </div>
                                            
                                            <div 
                                                className="flex-1 text-left flex items-center justify-start gap-3 cursor-pointer group/team"
                                                onClick={(e) => { e.stopPropagation(); if(a) onTeamClick(a.id); }}
                                            >
                                                {a?.logo && <img src={a.logo} className="w-6 h-6 object-contain" />}
                                                <span className="text-sm font-bold text-slate-300 truncate group-hover/team:text-[#ff9f43] transition-colors">{a?.name}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: STATS & HISTORY (Col Span 3) */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full overflow-hidden">
                
                {(isLeague || competitionId === 'SUPER_CUP' || competitionId === 'CUP' || competitionId === 'EUROPE') && (
                    <div className="bg-[#252525] rounded border border-[#333] p-0 shrink-0 h-1/3 flex flex-col">
                        <div className="p-3 border-b border-[#333]">
                            <div className="flex items-center justify-between text-[#ff9f43] font-bold text-xs uppercase mb-2 pl-2 border-l-4 border-[#ff9f43]">
                                <span>{isLeague ? "Geçmiş Şampiyonlar" : "Kupa Şampiyonları"}</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="divide-y divide-[#333]">
                                {isLeague && leagueHistory.map((h, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 px-3 hover:bg-[#333] cursor-pointer" onClick={() => onTeamClick(h.team.id)}>
                                        <div className="text-xs text-[#ff9f43] font-mono font-bold w-16">{h.year}</div>
                                        <div className="flex-1 flex items-center gap-2">
                                            {h.team.logo && <img src={h.team.logo} className="w-5 h-5 object-contain"/>}
                                            <span className="text-xs font-bold text-white truncate">{h.team.name}</span>
                                        </div>
                                        <Trophy size={12} className="text-yellow-500"/>
                                    </div>
                                ))}
                                
                                {!isLeague && (
                                    competitionId === 'CUP' ? PAST_CUP_WINNERS :
                                    competitionId === 'SUPER_CUP' ? PAST_SUPER_CUP_WINNERS :
                                    competitionId === 'EUROPE' ? PAST_EURO_WINNERS : []
                                ).map((w, i) => {
                                        const t = teams.find(tm => tm.name === w.teamName);
                                        return (
                                            <div key={i} className="flex justify-between items-center p-2 px-3 hover:bg-[#333] cursor-pointer" onClick={() => t && onTeamClick(t.id)}>
                                            <div className="text-xs text-[#ff9f43] font-mono font-bold w-16">{w.year}</div>
                                            <div className="flex-1 flex items-center gap-2">
                                                {t?.logo ? <img src={t.logo} className="w-5 h-5 object-contain"/> : <div className={`w-4 h-4 rounded-full ${t ? t.colors[0] : 'bg-gray-500'}`}></div>}
                                                <span className="text-xs font-bold text-white truncate">{w.teamName}</span>
                                            </div>
                                            <Trophy size={12} className="text-yellow-500"/>
                                            </div>
                                        );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-[#252525] rounded border border-[#333] p-0 flex-1 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-[#333]">
                        <div className="flex items-center justify-between text-[#ff9f43] font-bold text-xs uppercase mb-2 pl-2 border-l-4 border-[#ff9f43]">
                            <span>Oyuncu İstatistikleri</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 mt-2">
                            {[
                                { id: 'GOAL', label: 'GOL', icon: Goal },
                                { id: 'RATING', label: 'PUAN', icon: Star },
                                { id: 'ASSIST', label: 'ASİST', icon: Zap },
                                { id: 'CLEANSHEET', label: 'GOL YEMEME', icon: Shield },
                                { id: 'MVP', label: 'MVP', icon: Award },
                                { id: 'CARD', label: 'KART', icon: AlertTriangle }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setStatTab(tab.id as any)}
                                    className={`flex items-center justify-center gap-1 py-1.5 text-[9px] font-bold uppercase rounded border transition-all ${statTab === tab.id ? 'bg-[#ff9f43] text-black border-[#ff9f43]' : 'bg-[#333] text-slate-400 border-[#444] hover:bg-[#444]'}`}
                                >
                                    <tab.icon size={10} /> {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {statsList.top5.length === 0 ? (
                            <div className="text-center text-slate-500 text-xs py-10">Veri yok.</div>
                        ) : (
                            <div className="divide-y divide-[#333]">
                                {statsList.top5.map((p, i) => (
                                    <div key={p.id} className="flex items-center p-3 hover:bg-[#333] cursor-pointer group" onClick={() => onPlayerClick(p)}>
                                        <div className="w-6 text-center font-mono text-slate-500 text-xs">{i+1}</div>
                                        <div className="w-8 h-8 rounded-full border border-[#444] overflow-hidden bg-slate-200 shrink-0">
                                            <PlayerFace player={p} />
                                        </div>
                                        <div className="flex-1 ml-3 min-w-0">
                                            <div className="text-xs font-bold text-white truncate group-hover:text-[#ff9f43] transition-colors">{p.name}</div>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                {p.teamLogo && <img src={p.teamLogo} className="w-3 h-3 object-contain"/>}
                                                <span className="truncate">{p.teamName}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-[#ff9f43] font-mono">{p.displayValue}</div>
                                            {statTab === 'CARD' && p.compStats.red > 0 && <span className="text-[8px] bg-red-600 text-white px-1 rounded ml-1">{p.compStats.red}K</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );

    const menuItems = [
        { id: 'OVERVIEW', label: 'Genel Bakış', icon: LayoutDashboard },
        { id: 'ROUNDS', label: 'Turlar', icon: ListTree },
        { id: 'FIXTURES', label: 'Fikstürler', icon: CalendarDays },
        { id: 'STATS', label: 'İstatistikler', icon: BarChart2 },
        { id: 'TRANSFERS', label: 'Transferler', icon: ArrowRightLeft },
        { id: 'CLUBS', label: 'Klüpler', icon: Users },
        { id: 'ABOUT', label: 'Hakkında', icon: Info },
    ];

    return (
        <div className={containerClass}>
            {showSeasonPreview && (
                <SeasonPreviewModal 
                    competitionName={competitionName}
                    teams={competitionTeams}
                    onClose={() => setShowSeasonPreview(false)}
                    onPlayerClick={onPlayerClick}
                    onTeamClick={onTeamClick}
                />
            )}

            {/* Main Header */}
            {variant === 'modal' && (
                <div className="bg-[#252525] border-b border-[#333] p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        {competitionName.includes('Süper') ? <Star size={24} className="text-yellow-500"/> : <Trophy size={24} className="text-[#ff9f43]" />}
                        <h2 className="text-xl font-bold text-white uppercase font-teko tracking-wide">{competitionName}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-[#333] hover:bg-red-600 rounded text-white transition">
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* Navigation Tabs (UPDATED DESIGN) */}
            <div className="flex items-center gap-1 border-b border-slate-700/50 px-2 pt-2 bg-[#121519] overflow-x-auto no-scrollbar shrink-0">
                 {menuItems.map(item => {
                     const isActive = activeTab === item.id;
                     return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`
                                flex items-center gap-2 px-4 md:px-6 py-3 text-sm font-bold transition-all relative rounded-t-lg group whitespace-nowrap shrink-0
                                ${isActive
                                    ? 'text-yellow-500 bg-[#1b1b1b] border-t-2 border-x border-yellow-500/20 shadow-[0_-5px_15px_rgba(234,179,8,0.1)]' // Active: Tab-like, glowing text
                                    : 'text-slate-500 hover:text-slate-200 hover:bg-[#1b1b1b]/50'
                                }
                            `}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-0 right-0 h-[2px] bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
                            )}
                            <item.icon size={18} className={isActive ? "text-yellow-500" : "text-slate-500 group-hover:text-slate-300"} />
                            <span>{item.label}</span>
                        </button>
                     );
                 })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden bg-[#1b1b1b]">
                {activeTab === 'OVERVIEW' && renderOverview()}
                
                {activeTab === 'ROUNDS' && (
                    <div className="h-full p-0 overflow-y-auto">
                        {isLeague ? (
                            <DetailedLeagueTable 
                                teams={teamsWithCompetitionStats} 
                                fixtures={fixtures} 
                                onTeamClick={onTeamClick} 
                                competitionId={competitionId} 
                                onShowPreview={() => setShowSeasonPreview(true)}
                                minimal={false}
                            />
                        ) : (
                            renderBracket()
                        )}
                    </div>
                )}

                {activeTab === 'FIXTURES' && (
                    <div className="h-full p-0">
                        {renderFixtureList()}
                    </div>
                )}

                {activeTab === 'STATS' && (
                    <div className="h-full p-4">
                        {renderFullStats()}
                    </div>
                )}

                {activeTab === 'TRANSFERS' && (
                    <div className="h-full p-0">
                        {renderTransfers()}
                    </div>
                )}

                {activeTab === 'CLUBS' && (
                    <div className="h-full p-0">
                        {renderClubs()}
                    </div>
                )}

                {activeTab === 'ABOUT' && (
                    <div className="h-full p-0">
                        {renderAbout()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompetitionDetailModal;
