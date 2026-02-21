
import React, { useState, useMemo, useEffect } from 'react';
import { Team, Fixture, Player, Position } from '../types';
import { Trophy, X, ChevronLeft, ChevronRight, Star, Activity, Flame, ShieldAlert, History, Goal, Zap, Shield, Award, AlertTriangle, GitCommit, LayoutDashboard, ListTree, CalendarDays, BarChart2, ArrowRightLeft, Users, Info, ArrowRight, Filter, ChevronDown, Presentation, Calendar, Clock, Disc, List, Grid } from 'lucide-react';
import StandingsTable from '../components/shared/StandingsTable';
import PlayerFace from '../components/shared/PlayerFace';
import { getFormattedDate } from '../utils/calendarAndFixtures';
import SeasonPreviewModal from './SeasonPreviewModal';
import MatchDetailModal from './MatchDetailModal';

// New Component Imports
import CompetitionStatsTab from '../components/competition/CompetitionStatsTab';
import CompetitionTransfersTab from '../components/competition/CompetitionTransfersTab';
import CompetitionClubsTab from '../components/competition/CompetitionClubsTab';
import CompetitionAboutTab from '../components/competition/CompetitionAboutTab';

interface CompetitionDetailModalProps {
    competitionId: string;
    competitionName: string;
    teams: Team[];
    fixtures: Fixture[];
    currentWeek: number;
    currentDate: string; 
    onClose: () => void;
    onTeamClick: (id: string) => void;
    onPlayerClick: (p: Player) => void;
    variant?: 'modal' | 'embedded';
    initialTab?: string; 
    onTabChange?: (tab: string) => void; 
    myTeamId: string; // Added Prop
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

const MatchBox: React.FC<{ f: Fixture, teams: Team[], onScoreClick: (f: Fixture) => void }> = ({ f, teams, onScoreClick }) => {
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

    // Strict Penalty Check: Only show if penalties exist
    const showPenalties = isFinished && 
                          f.pkHome !== undefined && 
                          f.pkAway !== undefined;

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
                <span 
                    onClick={(e) => { e.stopPropagation(); if(isFinished) onScoreClick(f); }}
                    className={`font-mono font-bold text-white bg-black/40 px-1.5 rounded min-w-[20px] text-center ${isFinished ? 'cursor-pointer hover:bg-yellow-500 hover:text-black transition-colors' : ''}`}
                >
                    {isFinished ? f.homeScore : '-'}
                </span>
            </div>

            {/* Away Team */}
            <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 truncate flex-1">
                    {a?.logo ? <img src={a.logo} className="w-4 h-4 object-contain"/> : <div className={`w-4 h-4 rounded-full ${a?.colors[0]}`}></div>}
                    <span className={`truncate ${winnerId === a?.id ? 'text-green-400 font-bold' : isFinished ? 'text-slate-500' : 'text-slate-300'}`}>{a?.name}</span>
                </div>
                <span 
                    onClick={(e) => { e.stopPropagation(); if(isFinished) onScoreClick(f); }}
                    className={`font-mono font-bold text-white bg-black/40 px-1.5 rounded min-w-[20px] text-center ${isFinished ? 'cursor-pointer hover:bg-yellow-500 hover:text-black transition-colors' : ''}`}
                >
                    {isFinished ? f.awayScore : '-'}
                </span>
            </div>

            {showPenalties && (
                <div className="absolute top-1 right-1 text-[8px] text-yellow-500 font-bold bg-black/80 px-1 rounded">
                    P: {f.pkHome}-{f.pkAway}
                </div>
            )}
        </div>
    );
};

// --- DETAILED LEAGUE TABLE COMPONENT ---
const DetailedLeagueTable = ({ 
    teams, // THIS IS NOW "ALL TEAMS"
    fixtures, 
    onTeamClick, 
    competitionId, 
    onShowPreview, 
    minimal, 
    myTeamId,
    displaySeasonYear,
    currentGameSeasonYear,
    onChangeSeason
}: { 
    teams: Team[], 
    fixtures: Fixture[], 
    onTeamClick: (id: string) => void, 
    competitionId: string, 
    onShowPreview: () => void, 
    minimal?: boolean, 
    myTeamId: string,
    displaySeasonYear: number,
    currentGameSeasonYear: number,
    onChangeSeason: (year: number) => void
}) => {
    const [filter, setFilter] = useState<'OVERALL' | 'HOME' | 'AWAY' | 'FIRST_HALF' | 'SECOND_HALF'>('OVERALL');

    // Calculate Table Data based on filter
    const tableData = useMemo(() => {
        // 1. Identify Participants for this Season/Competition
        // Get all fixtures for this comp & season (played or not) to find who is in it.
        const seasonFixtures = fixtures.filter(f => {
            const d = new Date(f.date);
            const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
            
            // Comp check
            const isComp = competitionId === 'LEAGUE' ? (f.competitionId === 'LEAGUE' || !f.competitionId) : f.competitionId === competitionId;
            // Europe Phase Check
            if (competitionId === 'EUROPE') {
                if (f.week < 201 || f.week > 208) return false;
            }
            
            return isComp && y === displaySeasonYear;
        });

        const participantIds = new Set<string>();
        seasonFixtures.forEach(f => {
            participantIds.add(f.homeTeamId);
            participantIds.add(f.awayTeamId);
        });

        // Fallback: If no fixtures found (e.g. current season but fixtures not generated or something - unlikely but possible in some states), 
        // AND it is the current season, use the teams' current leagueId.
        if (participantIds.size === 0 && displaySeasonYear === currentGameSeasonYear) {
             teams.forEach(t => {
                 if (competitionId === 'LEAGUE' && (t.leagueId === 'LEAGUE' || !t.leagueId)) participantIds.add(t.id);
                 if (competitionId === 'LEAGUE_1' && t.leagueId === 'LEAGUE_1') participantIds.add(t.id);
                 if (competitionId === 'EUROPE' && t.leagueId === 'EUROPE_LEAGUE') participantIds.add(t.id);
             });
        }

        const participants = teams.filter(t => participantIds.has(t.id));

        const statsMap = new Map<string, {
            team: Team, played: number, won: number, drawn: number, lost: number, gf: number, ga: number, pts: number, form: string[]
        }>();

        // Initialize
        participants.forEach(t => {
            statsMap.set(t.id, {
                team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0, form: []
            });
        });

        // Filter PLAYED Fixtures for Stats Calculation
        const playedFixtures = seasonFixtures.filter(f => {
            if (!f.played) return false;

            // Half Season Check (Only relevant for League)
            if (competitionId !== 'EUROPE') {
                if (filter === 'FIRST_HALF' && f.week > 17) return false;
                if (filter === 'SECOND_HALF' && f.week <= 17) return false;
            }

            return true;
        }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); 

        // Process Matches
        playedFixtures.forEach(f => {
            const hStats = statsMap.get(f.homeTeamId);
            const aStats = statsMap.get(f.awayTeamId);

            if (hStats && filter !== 'AWAY') {
                hStats.played++;
                hStats.gf += f.homeScore!;
                hStats.ga += f.awayScore!;
                if (f.homeScore! > f.awayScore!) { hStats.won++; hStats.pts += 3; hStats.form.push('W'); }
                else if (f.homeScore === f.awayScore!) { hStats.drawn++; hStats.pts += 1; hStats.form.push('D'); }
                else { hStats.lost++; hStats.form.push('L'); }
            }

            if (aStats && filter !== 'HOME') {
                aStats.played++;
                aStats.gf += f.awayScore!;
                aStats.ga += f.homeScore!;
                if (f.awayScore! > f.homeScore!) { aStats.won++; aStats.pts += 3; aStats.form.push('W'); }
                else if (f.awayScore === f.homeScore!) { aStats.drawn++; aStats.pts += 1; aStats.form.push('D'); }
                else { aStats.lost++; aStats.form.push('L'); }
            }
        });

        // Filter out teams with 0 games played if it's Europe (to clean up non-participants who might be in list but eliminated before groups)
        // For League, we keep them all.
        let finalMap = Array.from(statsMap.values());
        if (competitionId === 'EUROPE') {
            finalMap = finalMap.filter(x => x.played > 0);
        }

        return finalMap.sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if ((b.gf - b.ga) !== (a.gf - a.ga)) return (b.gf - b.ga) - (a.gf - a.ga);
            return b.gf - a.gf;
        });

    }, [teams, fixtures, filter, competitionId, displaySeasonYear, currentGameSeasonYear]);

    const isLeague1 = competitionId === 'LEAGUE_1';
    const isEurope = competitionId === 'EUROPE';

    const gridColsClass = "grid-cols-[1.5rem_1.5rem_minmax(140px,3fr)_1.5rem_1.5rem_1.5rem_1.5rem_1.5rem_1.5rem_2rem_2rem_4rem]";

    // Format season label: 2025 -> 2025/26
    const seasonLabel = `${displaySeasonYear}/${(displaySeasonYear + 1).toString().slice(2)}`;
    const canGoBack = displaySeasonYear > 2025; // Game starts 2025
    const canGoForward = displaySeasonYear < currentGameSeasonYear;

    return (
        <div className="flex flex-col h-full bg-[#1b1b1b] text-slate-300">
            {!minimal && (
                <div className="flex items-center gap-4 p-4 border-b border-[#333] bg-[#222]">
                    <div className="relative group">
                        <button className="flex items-center gap-2 bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded text-sm font-bold transition">
                            <span>
                                {filter === 'OVERALL' ? 'Genel Puan Durumu' : 
                                 filter === 'HOME' ? 'İç Saha Puan Durumu' : 
                                 filter === 'AWAY' ? 'Dış Saha Puan Durumu' : 
                                 filter === 'FIRST_HALF' ? '1. Yarı Puan Durumu' : '2. Yarı Puan Durumu'}
                            </span>
                            <ChevronDown size={14} className="text-slate-400"/>
                        </button>
                        <div className="absolute top-full left-0 w-48 bg-[#333] border border-[#444] rounded-b shadow-xl hidden group-hover:block z-50">
                            <button onClick={() => setFilter('OVERALL')} className="w-full text-left px-4 py-2 text-xs hover:bg-black hover:text-[#ff9f43] text-slate-300">Genel</button>
                            <button onClick={() => setFilter('HOME')} className="w-full text-left px-4 py-2 text-xs hover:bg-black hover:text-[#ff9f43] text-slate-300">İç Saha</button>
                            <button onClick={() => setFilter('AWAY')} className="w-full text-left px-4 py-2 text-xs hover:bg-black hover:text-[#ff9f43] text-slate-300">Dış Saha</button>
                            <div className="h-px bg-[#444] my-1"></div>
                            {competitionId !== 'EUROPE' && (
                                <>
                                    <button onClick={() => setFilter('FIRST_HALF')} className="w-full text-left px-4 py-2 text-xs hover:bg-black hover:text-[#ff9f43] text-slate-300">1. Yarı (İlk 17 Hafta)</button>
                                    <button onClick={() => setFilter('SECOND_HALF')} className="w-full text-left px-4 py-2 text-xs hover:bg-black hover:text-[#ff9f43] text-slate-300">2. Yarı (18-34. Hafta)</button>
                                </>
                            )}
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
                        
                        <button 
                            onClick={() => canGoBack && onChangeSeason(displaySeasonYear - 1)}
                            disabled={!canGoBack}
                            className={`p-1 transition ${canGoBack ? 'text-white hover:bg-white/10 rounded cursor-pointer' : 'text-slate-600 cursor-not-allowed'}`}
                        >
                            <ChevronLeft size={20}/>
                        </button>
                        <div className="text-xs font-bold text-white bg-[#333] px-3 py-1 rounded min-w-[80px] text-center">
                            {seasonLabel}
                        </div>
                        <button 
                            onClick={() => canGoForward && onChangeSeason(displaySeasonYear + 1)}
                            disabled={!canGoForward}
                            className={`p-1 transition ${canGoForward ? 'text-white hover:bg-white/10 rounded cursor-pointer' : 'text-slate-600 cursor-not-allowed'}`}
                        >
                            <ChevronRight size={20}/>
                        </button>
                    </div>
                </div>
            )}

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

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {tableData.map((row, index) => {
                    const rank = index + 1;
                    const isMyTeam = row.team.id === myTeamId;
                    
                    let barColor = '';
                    let infoText = '-';
                    
                    if (isEurope) {
                         if (rank <= 8) { barColor = 'border-green-500'; infoText = 'S16'; }
                         else if (rank <= 24) { barColor = 'border-blue-500'; infoText = 'PO'; }
                         else { barColor = 'border-red-600'; infoText = 'E'; }
                    } else if (isLeague1) {
                         if (rank <= 2) { barColor = 'border-green-500'; infoText = 'Y'; }
                         else if (rank <= 6) { barColor = 'border-blue-500'; infoText = 'PO'; }
                         else if (rank >= tableData.length - 2) { barColor = 'border-red-600'; infoText = 'D'; }
                    } else {
                         if (rank <= 4) { barColor = 'border-green-500'; infoText = 'AVR'; }
                         else if (rank >= tableData.length - 2) { barColor = 'border-red-600'; infoText = 'D'; }
                    }

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
                                <span className={`font-bold text-xs truncate transition-colors ${isMyTeam ? 'text-yellow-500' : 'text-slate-200 group-hover:text-[#ff9f43]'}`}>{row.team.name}</span>
                            </div>
                            <div className="text-center text-slate-400 text-xs">{row.played}</div>
                            <div className="text-center text-green-500 font-bold text-xs">{row.won}</div>
                            <div className="text-center text-slate-500 text-xs">{row.drawn}</div>
                            <div className="text-center text-red-500 text-xs">{row.lost}</div>
                            <div className="text-center text-slate-300 text-xs">{row.gf}</div>
                            <div className="text-center text-slate-300 text-xs">{row.ga}</div>
                            <div className="text-center text-slate-300 text-xs font-bold">{row.gf - row.ga}</div>
                            <div className="text-center text-white font-black text-sm bg-[#333] rounded py-0.5">{row.pts}</div>
                            
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
    currentDate,
    onClose, 
    onTeamClick, 
    onPlayerClick, 
    variant = 'modal',
    initialTab = 'OVERVIEW',
    onTabChange,
    myTeamId // Added Prop
}) => {
    const [viewWeek, setViewWeek] = useState<number>(currentWeek);
    const [activeTab, setActiveTab] = useState<string>(initialTab);
    const [showSeasonPreview, setShowSeasonPreview] = useState(false);
    const [selectedMatchForDetail, setSelectedMatchForDetail] = useState<Fixture | null>(null);
    const [overviewStatTab, setOverviewStatTab] = useState<'GOAL' | 'RATING' | 'ASSIST' | 'CLEANSHEET' | 'MVP' | 'CARD'>('GOAL');

    // --- EUROPE VIEW STATE ---
    // Controls if we show the "League Table" or "Knockout Bracket" in the ROUNDS tab for Europe
    const [euroDisplayMode, setEuroDisplayMode] = useState<'LEAGUE' | 'KNOCKOUT'>('LEAGUE');

    // Automatically switch to knockout view if weeks > 208 for Europe
    useEffect(() => {
        if (competitionId === 'EUROPE' && currentWeek > 208) {
            setEuroDisplayMode('KNOCKOUT');
        }
    }, [competitionId]); // Intentionally not depending on currentWeek to prevent override if user manually toggles

    // Calculate current game season year (e.g. 2025)
    const currentGameSeasonYear = useMemo(() => {
        const d = new Date(currentDate);
        return d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    }, [currentDate]);

    // State for selected season in league table (default to current)
    const [displaySeasonYear, setDisplaySeasonYear] = useState<number>(currentGameSeasonYear);

    // Update display year when current date changes (new season start)
    useEffect(() => {
        setDisplaySeasonYear(currentGameSeasonYear);
    }, [currentGameSeasonYear]);

    // Handle tab change with callback
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        if (onTabChange) onTabChange(tab);
    };

    // Helper function to format season years (e.g. "2025/2026" -> "2025/26", "2026" -> "2025/26")
    const formatSeasonString = (yearStr: string) => {
        // If format is YYYY/YYYY (e.g. 2025/2026) -> convert to 2025/26
        if (yearStr.includes('/')) {
            const [start, end] = yearStr.split('/');
            if (end.length === 4) return `${start}/${end.slice(2)}`;
            return yearStr;
        }
        // If format is YYYY (e.g. 2026) -> convert to 2025/26 (User request)
        const y = parseInt(yearStr);
        if (!isNaN(y) && y > 1000) {
             return `${y-1}/${y.toString().slice(2)}`;
        }
        return yearStr;
    };

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
            const euroFixtures = fixtures.filter(f => f.competitionId === 'EUROPE');
            if (euroFixtures.length > 0) {
                const unplayed = euroFixtures.find(f => !f.played);
                if (unplayed) setViewWeek(unplayed.week);
                else {
                     const lastPlayed = euroFixtures.sort((a,b) => b.week - a.week)[0];
                     setViewWeek(lastPlayed ? lastPlayed.week : 201);
                }
            } else setViewWeek(201);
        } else if (competitionId === 'LEAGUE' || competitionId === 'LEAGUE_1') {
            setViewWeek(currentWeek);
        } else if (competitionId === 'SUPER_CUP') {
            setViewWeek(90);
        }
    }, [competitionId, fixtures, currentWeek]);

    const isLeague = competitionId === 'LEAGUE' || competitionId === 'LEAGUE_1';
    const isEurope = competitionId === 'EUROPE';
    const isEuropeLeaguePhase = isEurope && viewWeek >= 201 && viewWeek <= 208;
    const shouldShowStandings = isLeague || isEuropeLeaguePhase;

    // Filter teams based on competition participation
    const competitionTeams = useMemo(() => {
        if (competitionId === 'LEAGUE') return teams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
        if (competitionId === 'LEAGUE_1') return teams.filter(t => t.leagueId === 'LEAGUE_1');
        
        // FIX: Ensure only domestic teams are in the Turkish Cup
        // STRICT FILTER: Exclude any team with leagueId 'EUROPE_LEAGUE'
        if (competitionId === 'CUP') {
            return teams.filter(t => 
                (t.leagueId === 'LEAGUE' || t.leagueId === 'LEAGUE_1' || !t.leagueId) && 
                t.leagueId !== 'EUROPE_LEAGUE'
            );
        }
        
        if (competitionId === 'EUROPE') {
            const euroFixtures = fixtures.filter(f => f.competitionId === 'EUROPE');
            const teamIds = new Set<string>();
            euroFixtures.forEach(f => { teamIds.add(f.homeTeamId); teamIds.add(f.awayTeamId); });
            
            // FIX: If no fixtures (start of game), include TOP 5 Turkish + Foreign teams
            if (teamIds.size === 0) {
                 const foreignTeams = teams.filter(t => t.leagueId === 'EUROPE_LEAGUE');
                 const turkishTeams = teams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
                 // Predict Top 5 by strength (mimic draw logic)
                 const projectedQualifiers = [...turkishTeams].sort((a, b) => b.strength - a.strength).slice(0, 5);
                 return [...foreignTeams, ...projectedQualifiers];
            }
            
            return teams.filter(t => teamIds.has(t.id));
        }

        if (competitionId === 'SUPER_CUP' || competitionId === 'PLAYOFF') {
             const compFixtures = fixtures.filter(f => f.competitionId === competitionId || (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL'));
             const teamIds = new Set<string>();
             compFixtures.forEach(f => { teamIds.add(f.homeTeamId); teamIds.add(f.awayTeamId); });
             // If no fixtures yet, return empty to avoid random teams showing up
             if (teamIds.size === 0) return [];
             return teams.filter(t => teamIds.has(t.id));
        }
        
        // Fallback: Return empty array instead of all teams to prevent leakage in unknown cases
        return [];
    }, [teams, competitionId, fixtures]);

    // DYNAMIC STANDINGS CALCULATION
    const teamsWithCompetitionStats = useMemo(() => {
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
                gf += myScore; ga += oppScore;
                if (myScore > oppScore) { won++; points += 3; }
                else if (myScore === oppScore) { drawn++; points += 1; }
                else { lost++; }
            });

            return { ...t, stats: { played, won, drawn, lost, gf, ga, points } };
        });
    }, [competitionTeams, fixtures, isLeague, shouldShowStandings, competitionId, activeTab]);

    // --- NEW: UNIFIED HISTORY LOGIC FOR SIDEBAR ---
    const sidebarHistory = useMemo(() => {
        let historyEntries: { year: string, teamName: string, team?: Team }[] = [];

        if (competitionId === 'LEAGUE' || competitionId === 'LEAGUE_1') {
            // League Logic: Scrape from team histories (Checking correct competition ID in history)
            teams.forEach(t => {
                if (t.leagueHistory) {
                    t.leagueHistory.forEach(h => {
                         // Fallback for legacy saves where competitionId might be missing in history
                         // If missing, assume 'LEAGUE' (Super Lig)
                         const hComp = h.competitionId || 'LEAGUE';
                         
                         if (hComp === competitionId && h.rank === 1) {
                             historyEntries.push({
                                 year: h.year,
                                 teamName: t.name,
                                 team: t
                             });
                         }
                    });
                }
            });
        } else {
            // Cup Logic: Static Lists
            let source: { year: string, teamName: string }[] = [];
            if (competitionId === 'CUP') source = PAST_CUP_WINNERS;
            else if (competitionId === 'SUPER_CUP') source = PAST_SUPER_CUP_WINNERS;
            else if (competitionId === 'EUROPE') source = PAST_EURO_WINNERS;

            historyEntries = source.map(s => {
                const t = teams.find(team => team.name === s.teamName);
                return { year: s.year, teamName: s.teamName, team: t };
            });
        }

        // --- NEW LOGIC: DETECT CURRENT SEASON CHAMPION ---
        const currentSeasonChampion = (() => {
            if (isLeague) return null; // Leagues handled via history array in team object

            let finalWeek = 0;
            if (competitionId === 'CUP') finalWeek = 104;
            else if (competitionId === 'SUPER_CUP') finalWeek = 91;
            else if (competitionId === 'EUROPE') finalWeek = 217;

            const finalFixture = fixtures.find(f => f.competitionId === competitionId && f.week === finalWeek && f.played);
            
            if (finalFixture) {
                let winnerId = finalFixture.homeTeamId;
                if (finalFixture.awayScore! > finalFixture.homeScore!) winnerId = finalFixture.awayTeamId;
                else if (finalFixture.homeScore === finalFixture.awayScore) {
                     if ((finalFixture.pkAway || 0) > (finalFixture.pkHome || 0)) winnerId = finalFixture.awayTeamId;
                }
                
                const winner = teams.find(t => t.id === winnerId);
                if (winner) {
                     const d = new Date(finalFixture.date);
                     const year = d.getFullYear();
                     // User specific format: 2025/26 (Calculated by looking at year, e.g. 2026 -> 2025/26)
                     const seasonLabel = `${year-1}/${year.toString().slice(2)}`;
                     return { year: seasonLabel, teamName: winner.name, team: winner };
                }
            }
            return null;
        })();

        // Add current season champion if exists and not duplicate
        if (currentSeasonChampion) {
             const exists = historyEntries.some(h => h.year === currentSeasonChampion.year);
             if (!exists) {
                 historyEntries.push(currentSeasonChampion);
             }
        }

        // Sort Descending by Year (e.g. 2024/25 -> 2024)
        return historyEntries.sort((a,b) => {
             const yearA = parseInt(a.year.split('/')[0]);
             const yearB = parseInt(b.year.split('/')[0]);
             return yearB - yearA;
        }).slice(0, 10); // Show top 10

    }, [teams, competitionId, fixtures, isLeague]);


    const weekFixtures = useMemo(() => {
        return fixtures
            .filter(f => {
                const compMatch = f.competitionId === competitionId || (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL');
                const weekMatch = f.week === viewWeek;
                
                const d = new Date(f.date);
                const fSeason = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
                const isSeasonMatch = fSeason === displaySeasonYear;

                if (isLeague) {
                    const h = teams.find(t => t.id === f.homeTeamId);
                    const correctLeague = h && (competitionId === 'LEAGUE' ? (h.leagueId === 'LEAGUE' || !h.leagueId) : h.leagueId === 'LEAGUE_1');
                    return compMatch && weekMatch && correctLeague && isSeasonMatch;
                }
                return compMatch && weekMatch && isSeasonMatch;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [fixtures, viewWeek, competitionId, isLeague, teams, displaySeasonYear]);

    // Player Stats Logic for Mini List (Top Scorers)
    const overviewPlayerStats = useMemo(() => {
        const playerStatsMap = new Map<string, {
            player: Player, team: Team,
            ratingSum: number, matches: number, 
            goals: number, assists: number, 
            cleanSheets: number, mvps: number,
            tackles: number, shots: number, keyPasses: number, dribbles: number, passAccSum: number,
            yellow: number, red: number
        }>();

        // Fix Filter to include undefined competitionId for LEAGUE
        const compFixtures = fixtures.filter(f => 
            f.played &&
            (
                f.competitionId === competitionId || 
                (competitionId === 'LEAGUE' && !f.competitionId) ||
                (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL')
            )
        );

        compFixtures.forEach(f => {
            // Helper to get or create entry
            const getEntry = (pid: string, tId: string) => {
                let entry = playerStatsMap.get(pid);
                if (!entry) {
                    const t = teams.find(team => team.id === tId);
                    const p = t?.players.find(player => player.id === pid);
                    if (t && p) {
                        entry = {
                            player: p, team: t,
                            ratingSum: 0, matches: 0, goals: 0, assists: 0, cleanSheets: 0, mvps: 0,
                            tackles: 0, shots: 0, keyPasses: 0, dribbles: 0, passAccSum: 0,
                            yellow: 0, red: 0
                        };
                        playerStatsMap.set(pid, entry);
                    }
                }
                return entry;
            };

            // 1. Process Stats (Reliable for Goals/Assists/Rating)
            const processTeamStats = (ratings: any[], teamId: string, conceded: number) => {
                if (!ratings) return;
                ratings.forEach(r => {
                    const entry = getEntry(r.playerId, teamId);
                    if (entry) {
                        entry.ratingSum += r.rating;
                        entry.matches++;
                        entry.goals += r.goals;
                        entry.assists += r.assists;
                        
                        if (r.position === 'GK' && conceded === 0) entry.cleanSheets++;
                        if (f.stats?.mvpPlayerId === r.playerId) entry.mvps++;

                        // Simulated Extra Stats
                        const isFwd = ['SNT', 'SLK', 'SGK'].includes(r.position);
                        const isMid = ['OS', 'OOS'].includes(r.position);
                        entry.shots += r.goals * 2 + (isFwd ? 1.5 : isMid ? 0.5 : 0.1); 
                        entry.keyPasses += r.assists * 2 + (isMid ? 1.5 : 0.5);
                        
                        // Pass Acc
                        const baseAcc = r.position === 'STP' ? 88 : r.position === 'OS' ? 85 : 75;
                        entry.passAccSum += Math.min(100, baseAcc + (r.rating - 6)*5);
                    }
                });
            };

            if (f.stats) {
                processTeamStats(f.stats.homeRatings || [], f.homeTeamId, f.awayScore!);
                processTeamStats(f.stats.awayRatings || [], f.awayTeamId, f.homeScore!);
            }

            // 2. Process Cards from Events (Since not in stats)
            if (f.matchEvents) {
                f.matchEvents.forEach(e => {
                    if ((e.type === 'CARD_YELLOW' || e.type === 'CARD_RED') && e.playerId) {
                         // We need to find which team this player belongs to
                         // Try home then away
                         const h = teams.find(t => t.id === f.homeTeamId);
                         let p = h?.players.find(pl => pl.id === e.playerId);
                         let tId = f.homeTeamId;
                         
                         if (!p) {
                             const a = teams.find(t => t.id === f.awayTeamId);
                             p = a?.players.find(pl => pl.id === e.playerId);
                             tId = f.awayTeamId;
                         }

                         if (p) {
                             const entry = getEntry(e.playerId, tId);
                             if (entry) {
                                 if (e.type === 'CARD_YELLOW') entry.yellow++;
                                 if (e.type === 'CARD_RED') entry.red++;
                             }
                         }
                    }
                });
            }
        });

        return Array.from(playerStatsMap.values()).map(x => ({
            ...x.player, // Keep original 'stats' (Attributes)
            teamName: x.team.name,
            teamLogo: x.team.logo,
            teamColors: x.team.colors,
            compStats: { // RENAMED FROM stats TO compStats
                ...x,
                averageRating: x.matches > 0 ? x.ratingSum / x.matches : 0,
                avgPassAcc: x.matches > 0 ? x.passAccSum / x.matches : 0
            }
        }));
    }, [fixtures, teams, competitionId]);

    const getOverviewTopPlayers = () => {
        let sorted = [];
        let valueKey = (p: any) => 0;
        let displayFormat = (val: number) => val.toString();

        switch(overviewStatTab) {
            case 'GOAL':
                sorted = overviewPlayerStats.filter(p => p.compStats.goals > 0).sort((a,b) => b.compStats.goals - a.compStats.goals);
                valueKey = (p) => p.compStats.goals;
                break;
            case 'ASSIST':
                sorted = overviewPlayerStats.filter(p => p.compStats.assists > 0).sort((a,b) => b.compStats.assists - a.compStats.assists);
                valueKey = (p) => p.compStats.assists;
                break;
            case 'RATING':
                sorted = overviewPlayerStats.filter(p => p.compStats.matches >= 2).sort((a,b) => b.compStats.averageRating - a.compStats.averageRating);
                valueKey = (p) => p.compStats.averageRating;
                displayFormat = (val) => val.toFixed(2);
                break;
            case 'MVP':
                sorted = overviewPlayerStats.filter(p => p.compStats.mvps > 0).sort((a,b) => b.compStats.mvps - a.compStats.mvps);
                valueKey = (p) => p.compStats.mvps;
                break;
            case 'CARD':
                sorted = overviewPlayerStats.filter(p => p.compStats.yellow > 0 || p.compStats.red > 0).sort((a,b) => (b.compStats.yellow + b.compStats.red*3) - (a.compStats.yellow + a.compStats.red*3));
                valueKey = (p) => p.compStats.yellow + p.compStats.red; 
                break;
            case 'CLEANSHEET':
                sorted = overviewPlayerStats.filter(p => p.compStats.cleanSheets > 0).sort((a,b) => b.compStats.cleanSheets - a.compStats.cleanSheets);
                valueKey = (p) => p.compStats.cleanSheets;
                break;
        }

        return sorted.slice(0, 5).map(p => ({ ...p, displayValue: displayFormat(valueKey(p)) }));
    };

    // Transfers Logic - UPDATED TO INCLUDE ALL TRANSFER TYPES
    const competitionTransfers = useMemo(() => {
        const transfers: any[] = [];
        competitionTeams.forEach(t => {
            if (t.transferHistory) {
                // Include all types of transfers
                t.transferHistory.forEach(th => {
                    transfers.push({
                        ...th,
                        teamName: t.name,
                        teamLogo: t.logo,
                        teamColors: t.colors,
                        type: th.type // Ensure type is passed
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
                        <MatchBox 
                            key={f.id} 
                            f={f} 
                            teams={teams} 
                            onScoreClick={(fix) => setSelectedMatchForDetail(fix)}
                        />
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
            if (viewWeek <= 208) return `${viewWeek - 200}. HAFTA`;
            if (viewWeek === 209) return 'PLAY-OFF 1';
            if (viewWeek === 210) return 'PLAY-OFF 2';
            if (viewWeek === 211) return 'SON 16 - 1';
            if (viewWeek === 212) return 'SON 16 - 2';
            if (viewWeek === 213) return 'ÇEYREK FİNAL 1';
            if (viewWeek === 214) return 'ÇEYREK FİNAL 2';
            if (viewWeek === 215) return 'YARI FİNAL 1';
            if (viewWeek === 216) return 'YARI FİNAL 2';
            if (viewWeek === 217) return 'FİNAL';
        }
        return 'MAÇLAR';
    };

    const renderFixtureList = () => {
        if (weekFixtures.length === 0) return (
            <div className="h-full flex flex-col bg-[#1b1b1b]">
                 <div className="bg-[#252525] p-3 border-b border-[#333] flex items-center justify-between sticky top-0 z-20">
                    <button onClick={handlePrevRound} className="p-2 bg-[#111] hover:bg-[#ff9f43] hover:text-black text-white rounded transition"><ChevronLeft size={16}/></button>
                    <span className="text-[#ff9f43] font-bold text-sm uppercase tracking-wider">{getRoundLabel()}</span>
                    <button onClick={handleNextRound} className="p-2 bg-[#111] hover:bg-[#ff9f43] hover:text-black text-white rounded transition"><ChevronRight size={16}/></button>
                </div>
                <div className="flex-1 flex items-center justify-center text-slate-500 italic">Bu hafta/tur için fikstür bulunamadı.</div>
            </div>
        );

        const grouped: Record<string, Fixture[]> = {};
        weekFixtures.forEach(f => {
            const dateKey = f.date.split('T')[0]; 
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(f);
        });

        const sortedDates = Object.keys(grouped).sort();

        return (
            <div className="h-full flex flex-col bg-[#1b1b1b]">
                <div className="bg-[#252525] p-3 border-b border-[#333] flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-lg">
                    <button onClick={handlePrevRound} className="p-2 bg-[#111] hover:bg-[#ff9f43] hover:text-black text-white rounded transition"><ChevronLeft size={16}/></button>
                    <span className="text-[#ff9f43] font-bold text-sm uppercase tracking-wider">{getRoundLabel()}</span>
                    <button onClick={handleNextRound} className="p-2 bg-[#111] hover:bg-[#ff9f43] hover:text-black text-white rounded transition"><ChevronRight size={16}/></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {sortedDates.map(dateKey => {
                        const dateFixtures = grouped[dateKey];
                        const dateLabel = getFormattedDate(dateFixtures[0].date).label;

                        return (
                            <div key={dateKey} className="mb-6 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 mb-2 px-1">
                                    <div className="bg-[#333] text-slate-300 px-3 py-1 rounded text-sm font-bold border border-[#444] shadow-sm flex items-center gap-2">
                                        <Calendar size={14} />
                                        {dateLabel}
                                    </div>
                                    <div className="h-px bg-[#333] flex-1"></div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {dateFixtures.map(f => {
                                        const h = teams.find(t => t.id === f.homeTeamId);
                                        const a = teams.find(t => t.id === f.awayTeamId);
                                        const time = "20:00"; 
                                        const goals = f.matchEvents?.filter(e => e.type === 'GOAL') || [];
                                        const homeGoals = goals.filter(g => g.teamName === h?.name);
                                        const awayGoals = goals.filter(g => g.teamName === a?.name);
                                        
                                        // Penalties Check: Check pkHome existence
                                        const showPK = f.played && f.pkHome !== undefined && f.pkAway !== undefined;

                                        return (
                                            <div key={f.id} className="bg-[#252525] border border-[#333] rounded-lg p-3 hover:border-[#555] transition-colors relative overflow-hidden group">
                                                <div className="flex items-center justify-between text-sm">
                                                    <div className="w-16 flex flex-col justify-center text-slate-500 font-mono text-xs border-r border-[#333] pr-2 mr-2">
                                                        <span className="text-white font-bold">{time}</span>
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-end gap-3 cursor-pointer" onClick={() => h && onTeamClick(h.id)}>
                                                        <span className={`font-bold truncate transition-colors ${h?.id === myTeamId ? 'text-yellow-500' : f.played && (f.homeScore! > f.awayScore!) ? 'text-white' : 'text-slate-300'}`}>{h?.name}</span>
                                                        {h?.logo ? <img src={h.logo} className="w-6 h-6 object-contain"/> : <div className={`w-6 h-6 rounded-full ${h?.colors[0]}`}></div>}
                                                    </div>
                                                    <div className="px-4 flex justify-center" onClick={(e) => { e.stopPropagation(); if(f.played) setSelectedMatchForDetail(f); }}>
                                                        <div className={`bg-[#111] px-3 py-1 rounded text-base font-black font-mono border border-[#444] min-w-[60px] text-center ${f.played ? 'text-white cursor-pointer hover:scale-110 hover:border-yellow-500 transition-all shadow-lg' : 'text-slate-500'}`}>
                                                            {f.played ? `${f.homeScore} - ${f.awayScore}` : '-'}
                                                            {showPK && <span className="block text-[8px] text-yellow-500 mt-0.5 border-t border-white/10 pt-0.5">P: {f.pkHome}-{f.pkAway}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-start gap-3 cursor-pointer" onClick={() => a && onTeamClick(a.id)}>
                                                        {a?.logo ? (
                                                            <img src={a.logo} className="w-6 h-6 object-contain"/> 
                                                        ) : (
                                                            <div className={`w-6 h-6 rounded-full ${a?.colors[0]}`}></div>
                                                        )}
                                                        <span className={`font-bold truncate transition-colors ${a?.id === myTeamId ? 'text-yellow-500' : f.played && (f.awayScore! > f.homeScore!) ? 'text-white' : 'text-slate-300'}`}>{a?.name}</span>
                                                    </div>
                                                </div>
                                                {f.played && goals.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-[#333] flex justify-between text-[10px] text-slate-400">
                                                        <div className="flex-1 text-right pr-14 space-y-0.5">
                                                            {homeGoals.map((g, i) => (
                                                                <div key={i} className="flex items-center justify-end gap-1">
                                                                    <span>{g.scorer} {g.minute}'</span>
                                                                    <Disc size={8} className="text-green-500 fill-current"/>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="w-[60px]"></div>
                                                        <div className="flex-1 text-left pl-14 space-y-0.5">
                                                            {awayGoals.map((g, i) => (
                                                                <div key={i} className="flex items-center justify-start gap-1">
                                                                    <Disc size={8} className="text-green-500 fill-current"/>
                                                                    <span>{g.scorer} {g.minute}'</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    const renderOverview = () => (
        <div className="grid grid-cols-12 gap-4 h-full p-4 overflow-hidden">
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
                                teams={teams} // CHANGED: Pass ALL teams, let component filter
                                fixtures={fixtures} 
                                onTeamClick={onTeamClick} 
                                competitionId={competitionId} 
                                onShowPreview={() => setShowSeasonPreview(true)}
                                minimal={true}
                                myTeamId={myTeamId} // Pass myTeamId
                                displaySeasonYear={displaySeasonYear}
                                currentGameSeasonYear={currentGameSeasonYear}
                                onChangeSeason={setDisplaySeasonYear}
                            />
                        ) : (
                            renderBracket()
                        )}
                    </div>
                </div>
            </div>

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
                                    
                                    // Penalties Check: check existence
                                    const showPK = f.played && f.pkHome !== undefined && f.pkAway !== undefined;
                                    
                                    return (
                                        <div key={f.id} className="flex items-center justify-between py-3 px-4 hover:bg-[#333] group transition-colors relative">
                                            <div 
                                                className="flex-1 text-right flex items-center justify-end gap-3 cursor-pointer group/team"
                                                onClick={(e) => { e.stopPropagation(); if(h) onTeamClick(h.id); }}
                                            >
                                                <span className={`text-sm font-bold truncate group-hover/team:text-[#ff9f43] transition-colors ${h?.id === myTeamId ? 'text-yellow-500' : 'text-slate-300'}`}>{h?.name}</span>
                                                {h?.logo && <img src={h.logo} className="w-6 h-6 object-contain" />}
                                            </div>
                                            
                                            <div 
                                                className="px-4 text-center min-w-[80px] flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                                                onClick={(e) => { e.stopPropagation(); if(f.played) setSelectedMatchForDetail(f); }}
                                            >
                                                {f.played ? (
                                                    <>
                                                        <span className="text-white font-mono font-black text-lg tracking-widest">{f.homeScore}-{f.awayScore}</span>
                                                        {showPK && (
                                                            <span className="text-[9px] text-yellow-500 font-mono mt-0.5">P: {f.pkHome}-{f.pkAway}</span>
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
                                                {a?.logo ? (
                                                    <img src={a.logo} className="w-6 h-6 object-contain" />
                                                ) : (
                                                    <div className={`w-6 h-6 rounded-full ${a?.colors[0]}`}></div>
                                                )}
                                                <span className={`text-sm font-bold truncate group-hover/team:text-[#ff9f43] transition-colors ${a?.id === myTeamId ? 'text-yellow-500' : 'text-slate-300'}`}>{a?.name}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
                                {sidebarHistory.map((h, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 px-3 hover:bg-[#333] cursor-pointer" onClick={() => h.team && onTeamClick(h.team.id)}>
                                        <div className="text-xs text-[#ff9f43] font-mono font-bold w-16">{formatSeasonString(h.year)}</div>
                                        <div className="flex-1 flex items-center gap-2">
                                            {/* Use team object from history if available for logo */}
                                            {h.team?.logo ? <img src={h.team.logo} className="w-5 h-5 object-contain"/> : h.team ? <div className={`w-4 h-4 rounded-full ${h.team.colors[0]}`}></div> : null}
                                            <span className="text-xs font-bold text-white truncate">{h.teamName}</span>
                                        </div>
                                        <Trophy size={12} className="text-yellow-500"/>
                                    </div>
                                ))}
                                {sidebarHistory.length === 0 && (
                                    <div className="p-4 text-center text-slate-500 text-xs italic">Kayıtlı şampiyonluk verisi bulunmuyor.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-[#252525] rounded border border-[#333] p-0 flex-1 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-[#333]">
                        <div className="flex items-center justify-between text-[#ff9f43] font-bold text-xs uppercase mb-2 pl-2 border-l-4 border-[#ff9f43]">
                            <span>Oyuncu İstatistikleri</span>
                        </div>
                        {/* Tab Buttons - UPDATED: SPLIT INTO TWO ROWS */}
                        <div className="flex flex-col gap-2 pb-1">
                            {/* Row 1 */}
                            <div className="flex gap-1">
                                {[
                                    { id: 'GOAL', label: 'Gol', icon: Goal },
                                    { id: 'RATING', label: 'Puan', icon: Star },
                                    { id: 'ASSIST', label: 'Asist', icon: Zap },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setOverviewStatTab(tab.id as any)}
                                        className={`flex-1 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition ${overviewStatTab === tab.id ? 'bg-[#ff9f43] text-black' : 'bg-[#333] text-slate-400 hover:text-white'}`}
                                    >
                                        <tab.icon size={12} /> {tab.label}
                                    </button>
                                ))}
                            </div>
                            {/* Row 2 */}
                            <div className="flex gap-1">
                                 {[
                                    { id: 'CLEANSHEET', label: 'Gol Yememe', icon: Shield },
                                    { id: 'MVP', label: 'MVP', icon: Award },
                                    { id: 'CARD', label: 'Kart', icon: AlertTriangle }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setOverviewStatTab(tab.id as any)}
                                        className={`flex-1 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition ${overviewStatTab === tab.id ? 'bg-[#ff9f43] text-black' : 'bg-[#333] text-slate-400 hover:text-white'}`}
                                    >
                                        <tab.icon size={12} /> {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Render Top 5 List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                         {getOverviewTopPlayers().length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-500 text-xs italic">
                                Veri yok.
                            </div>
                         ) : (
                            <div className="divide-y divide-[#333]">
                                {getOverviewTopPlayers().map((p, i) => (
                                    <div key={p.id} className="flex items-center justify-between p-2 hover:bg-[#333] cursor-pointer group" onClick={() => onPlayerClick(p)}>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`w-4 text-center font-bold text-xs ${i === 0 ? 'text-[#ff9f43]' : 'text-slate-500'}`}>{i + 1}</div>
                                            <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-600 shrink-0">
                                                <PlayerFace player={p} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-white truncate max-w-[100px] group-hover:text-[#ff9f43] transition-colors">{p.name}</span>
                                                <span className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                                                    {p.teamLogo && <img src={p.teamLogo} className="w-3 h-3 object-contain"/>}
                                                    {p.teamName}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-sm font-black text-[#ff9f43] font-mono px-2 bg-[#333] rounded ml-2 min-w-[40px] text-center">
                                            {p.displayValue}
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
        <div className={variant === 'modal' ? "fixed inset-0 z-[150] bg-black/95 flex flex-col animate-in fade-in duration-300" : "flex-1 flex flex-col h-full bg-[#1b1b1b] overflow-hidden"}>
            {selectedMatchForDetail && (
                <MatchDetailModal 
                    fixture={selectedMatchForDetail} 
                    teams={teams} 
                    onClose={() => setSelectedMatchForDetail(null)} 
                    allFixtures={fixtures} // PASS FIXTURES
                />
            )}

            {showSeasonPreview && (
                <SeasonPreviewModal 
                    competitionName={competitionName}
                    teams={competitionTeams}
                    onClose={() => setShowSeasonPreview(false)}
                    onPlayerClick={onPlayerClick}
                    onTeamClick={onTeamClick}
                />
            )}

            {variant === 'modal' && (
                <div className="bg-[#252525] border-b border-[#333] p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        {competitionName.includes('Süper') ? <Star size={24} className="text-yellow-500"/> : <Trophy size={24} className="text-[#ff9f43]" />}
                        <h2 className="text-xl font-bold text-white uppercase font-teko tracking-wide">
                            {competitionId === 'EUROPE' && viewWeek <= 208 ? `${viewWeek - 200}. HAFTA` : competitionName}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 bg-[#333] hover:bg-red-600 rounded text-white transition">
                        <X size={20} />
                    </button>
                </div>
            )}

            <div className="flex items-center gap-1 border-b border-slate-700/50 px-2 pt-2 bg-[#121519] overflow-x-auto no-scrollbar shrink-0">
                 {menuItems.map(item => {
                     const isActive = activeTab === item.id;
                     return (
                        <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id)} // Use Handler
                            className={`
                                flex items-center gap-2 px-4 md:px-6 py-3 text-sm font-bold transition-all relative rounded-t-lg group whitespace-nowrap shrink-0
                                ${isActive
                                    ? 'text-yellow-500 bg-[#1b1b1b] border-t-2 border-x border-yellow-500/20 shadow-[0_-5px_15px_rgba(234,179,8,0.1)]' 
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

            <div className="flex-1 overflow-hidden bg-[#1b1b1b]">
                {activeTab === 'OVERVIEW' && renderOverview()}
                
                {activeTab === 'ROUNDS' && (
                    <div className="h-full p-0 overflow-y-auto flex flex-col">
                        {competitionId === 'EUROPE' && (
                            <div className="flex justify-center p-2 bg-[#252525] border-b border-[#333] shrink-0 sticky top-0 z-30">
                                 <div className="flex bg-black/40 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setEuroDisplayMode('LEAGUE')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${euroDisplayMode === 'LEAGUE' ? 'bg-[#ff9f43] text-black shadow' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Lig Aşaması
                                    </button>
                                    <button 
                                        onClick={() => setEuroDisplayMode('KNOCKOUT')}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${euroDisplayMode === 'KNOCKOUT' ? 'bg-[#ff9f43] text-black shadow' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        Eleme Turları
                                    </button>
                                 </div>
                            </div>
                        )}

                        {/* RENDER LOGIC */}
                        {(isLeague || (competitionId === 'EUROPE' && euroDisplayMode === 'LEAGUE')) ? (
                            <DetailedLeagueTable 
                                teams={teams} // CHANGED: Pass ALL teams, let component filter
                                fixtures={fixtures} 
                                onTeamClick={onTeamClick} 
                                competitionId={competitionId} 
                                onShowPreview={() => setShowSeasonPreview(true)}
                                minimal={false}
                                myTeamId={myTeamId} // Pass myTeamId
                                displaySeasonYear={displaySeasonYear}
                                currentGameSeasonYear={currentGameSeasonYear}
                                onChangeSeason={setDisplaySeasonYear}
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
                        <CompetitionStatsTab 
                            teams={teams}
                            fixtures={fixtures}
                            competitionId={competitionId}
                            onPlayerClick={onPlayerClick}
                            onTeamClick={onTeamClick}
                            currentWeek={currentWeek} // Pass currentWeek
                            currentDate={currentDate} // Pass currentDate
                        />
                    </div>
                )}

                {activeTab === 'TRANSFERS' && (
                    <div className="h-full p-0">
                        <CompetitionTransfersTab 
                            transfers={competitionTransfers} 
                            teams={teams}
                            onPlayerClick={onPlayerClick}
                            onTeamClick={onTeamClick}
                            currentDate={currentDate} // Added Prop
                        />
                    </div>
                )}

                {activeTab === 'CLUBS' && (
                    <div className="h-full p-0">
                        <CompetitionClubsTab 
                            teams={competitionTeams} // FIX: Pass competitionTeams here!
                            onTeamClick={onTeamClick} 
                            fixtures={fixtures} // Pass fixtures
                        />
                    </div>
                )}

                {activeTab === 'ABOUT' && (
                    <div className="h-full p-0">
                        <CompetitionAboutTab 
                            competitionId={competitionId} 
                            competitionName={competitionName} 
                            teams={teams} // Pass Teams
                            fixtures={fixtures} // Pass Fixtures
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompetitionDetailModal;
