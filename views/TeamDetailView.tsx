
import React, { useState, useMemo } from 'react';
import { Team, Player, Fixture, ManagerProfile, Position } from '../types';
import { ChevronLeft, Trophy, Users, Home, Star, DollarSign, BarChart3, Wallet, Globe, TrendingUp, TrendingDown, Landmark, Scale, Activity, Calendar, Goal, Zap, Disc, AlertCircle, ArrowRight, ArrowLeft, History, Archive, ArrowRightLeft, Coins, CheckCircle, Building2, User, Briefcase, School, HardHat, Target, Sparkles, UserPlus, FileSignature, Wallet2, Building, ToggleLeft, ToggleRight, Bug, LayoutTemplate, StarHalf, ArrowUpDown, Shield, Clock, Info } from 'lucide-react';
import SquadView from './SquadView';
import PlayerFace from '../components/shared/PlayerFace';
import PitchVisual from '../components/shared/PitchVisual';
import { calculateForm, calculateMonthlyNetFlow } from '../utils/teamCalculations';
import { isSameDay, getFormattedDate } from '../utils/calendarAndFixtures';
import { GAME_CALENDAR } from '../data/gameConstants';
import StandingsTable from '../components/shared/StandingsTable';
import PlayerRow from '../components/shared/PlayerRow';
import { COUNTRY_CODES } from '../data/uiConstants';

interface TeamDetailViewProps {
    team: Team;
    allTeams: Team[];
    fixtures: Fixture[];
    currentDate: string;
    currentWeek: number;
    manager: ManagerProfile;
    myTeamId: string;
    onClose: () => void;
    onPlayerClick: (p: Player) => void;
    onTeamClick: (id: string) => void;
    onBoardRequest?: (type: string, isDebug?: boolean) => void; 
    yearsAtClub?: number; 
    lastSeasonGoalAchieved?: boolean; 
    consecutiveFfpYears?: number;
    onFixtureClick?: (f: Fixture) => void; 
    onCompetitionClick?: (compId: string) => void; 
}

// --- HELPER COMPONENTS ---

const StatCard = ({ label, value, icon: Icon, subValue, colorClass = "" }: any) => (
    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <Icon size={16} className="text-slate-500 dark:text-slate-400" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        <div>
            <div className={`text-xl md:text-2xl font-black ${colorClass || 'text-slate-900 dark:text-white'}`}>{value}</div>
            {subValue && <div className="text-[10px] text-slate-400 font-medium mt-0.5">{subValue}</div>}
        </div>
    </div>
);

const PlayerStatCard = ({ label, player, statValue, statLabel, icon: Icon, colorClass, onClick }: any) => {
    if (!player) return null;
    return (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-yellow-500 transition-all group cursor-pointer" onClick={() => onClick(player)}>
            <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-200 shrink-0 group-hover:scale-110 transition-transform">
                <PlayerFace player={player} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{player.name}</div>
            </div>
            <div className="text-right shrink-0">
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">{statValue}</div>
                <div className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1 justify-end">
                    <Icon size={10} className={colorClass} /> {statLabel}
                </div>
            </div>
        </div>
    );
};

const CheckCircleIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const generateLeagueHistory = (team: Team) => {
    const history = [];
    const currentYear = 2024;
    const baseRank = Math.max(1, Math.min(18, Math.floor(19 - (team.strength / 100 * 18))));
    
    for(let i = 1; i <= 20; i++) {
        const year = `${currentYear - i}/${currentYear - i + 1}`;
        let rank = baseRank + Math.floor(Math.random() * 6) - 3;
        rank = Math.max(1, Math.min(18, rank));
        history.push({ year, rank });
    }
    return history;
};

// --- STAR RATING LOGIC ---
const getTeamStarRating = (strength: number) => {
    if (strength >= 83) return 5;
    if (strength >= 79) return 4.5;
    if (strength >= 75) return 4;
    if (strength >= 71) return 3.5;
    if (strength >= 69) return 3;
    if (strength >= 67) return 2.5;
    if (strength === 66) return 2;
    if (strength >= 63) return 1.5;
    if (strength >= 60) return 1;
    return 0.5;
};

const renderTeamStars = (strength: number, size: number = 24) => {
    const rating = getTeamStarRating(strength);
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    return (
        <div className="flex gap-1">
            {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} size={size} className="fill-yellow-500 text-yellow-500 drop-shadow-sm" />)}
            {hasHalf && <StarHalf size={size} className="fill-yellow-500 text-yellow-500 drop-shadow-sm" />}
            {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} size={size} className="text-slate-600 dark:text-slate-700" />)}
        </div>
    );
};

// --- MAIN COMPONENT ---

const TeamDetailView = ({ team, allTeams, fixtures, currentDate, currentWeek, manager, myTeamId, onClose, onPlayerClick, onTeamClick, onBoardRequest, yearsAtClub = 0, lastSeasonGoalAchieved = false, consecutiveFfpYears = 0, onFixtureClick, onCompetitionClick }: TeamDetailViewProps) => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'SQUAD' | 'FIXTURES' | 'TRANSFERS' | 'HISTORY' | 'MANAGEMENT' | 'TACTICS'>('GENERAL');
    
    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // Filter teams based on the current league of the VIEWED team
    const currentLeagueId = team.leagueId || 'LEAGUE';
    const leagueTeams = allTeams.filter(t => t.leagueId === currentLeagueId || (!t.leagueId && currentLeagueId === 'LEAGUE'));

    const sortedTeams = [...leagueTeams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });
    const rank = sortedTeams.findIndex(t => t.id === team.id) + 1;
    
    const leagueName = currentLeagueId === 'LEAGUE_1' ? "Hayvanlar 1. Ligi" : (currentLeagueId === 'EUROPE_LEAGUE' ? "Avrupa Ligi" : "Süper Toto Ligi");

    const squadValue = team.players.reduce((sum, p) => sum + p.value, 0);
    const form = calculateForm(team.id, fixtures);
    const reputation = team.reputation || 1.0;
    
    // Determine Team Country
    const teamCountry = useMemo(() => {
        if (team.leagueId === 'LEAGUE' || team.leagueId === 'LEAGUE_1' || !team.leagueId) return 'Türkiye';
        
        // For European/Foreign teams, determine by majority player nationality
        if (!team.players || team.players.length === 0) return 'Avrupa';

        const counts: Record<string, number> = {};
        team.players.forEach(p => {
            counts[p.nationality] = (counts[p.nationality] || 0) + 1;
        });
        
        // Sort by frequency
        const topNation = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
        return topNation || 'Avrupa';
    }, [team]);

    const countryCode = COUNTRY_CODES[teamCountry] || 'un';
    
    // Use OPERATIONAL net flow (excludeTransfers=true) for status display
    const monthlyNet = calculateMonthlyNetFlow(team, fixtures, currentDate, manager, true);

    let financeStatus = "Dengeli";
    let financeColor = "text-yellow-600 dark:text-yellow-400";
    if (monthlyNet > 10) { financeStatus = "Zengin"; financeColor = "text-emerald-600 dark:text-emerald-400"; }
    else if (monthlyNet > 0) { financeStatus = "Güvende"; financeColor = "text-blue-600 dark:text-blue-400"; }
    else if (monthlyNet >= -5) { financeStatus = "Dengeli"; financeColor = "text-yellow-600 dark:text-yellow-400"; }
    else { financeStatus = "Riskli"; financeColor = "text-red-600 dark:text-red-400"; }

    const teamFixtures = fixtures
        .filter(f => f.homeTeamId === team.id || f.awayTeamId === team.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const pastMatches = teamFixtures.filter(f => f.played).reverse();
    const futureMatches = teamFixtures.filter(f => !f.played);

    // FIXTURE GROUPING LOGIC FOR TAB
    const groupedFixtures: Record<string, Fixture[]> = {};
    teamFixtures.forEach(f => {
        const date = new Date(f.date);
        const monthKey = date.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
        if (!groupedFixtures[monthKey]) {
            groupedFixtures[monthKey] = [];
        }
        groupedFixtures[monthKey].push(f);
    });

    const getFullDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    };

    const getCompetitionDetails = (compId?: string) => {
        switch (compId) {
            case 'SUPER_CUP': return { name: 'Süper Kupa', icon: Star, color: 'text-yellow-500' };
            case 'CUP': return { name: 'Türkiye Kupası', icon: Shield, color: 'text-red-500' };
            case 'LEAGUE_1': return { name: '1. Lig', icon: TrendingUp, color: 'text-orange-500' };
            case 'EUROPE': return { name: 'Avrupa', icon: Globe, color: 'text-blue-500' };
            default: return { name: 'Lig', icon: Trophy, color: 'text-slate-600' };
        }
    };
    
    const getResultStatus = (f: Fixture, isHome: boolean) => {
        if (!f.played || f.homeScore === null || f.awayScore === null) return null;
        let myScore = isHome ? f.homeScore : f.awayScore;
        let oppScore = isHome ? f.awayScore : f.homeScore;

        const isKnockout = ['CUP', 'SUPER_CUP', 'PLAYOFF', 'PLAYOFF_FINAL', 'EUROPE'].includes(f.competitionId || '');

        if (isKnockout && myScore === oppScore && f.pkHome !== undefined && f.pkAway !== undefined) {
             const myPk = isHome ? f.pkHome : f.pkAway;
             const oppPk = isHome ? f.pkAway : f.pkHome;
             if (myPk > oppPk) return { color: 'bg-green-600 text-white', label: 'G (P)' };
             else return { color: 'bg-red-600 text-white', label: 'M (P)' };
        }

        if (myScore > oppScore) return { color: 'bg-green-600 text-white', label: 'G' };
        if (myScore < oppScore) return { color: 'bg-red-600 text-white', label: 'M' };
        return { color: 'bg-orange-500 text-white', label: 'B' };
    };

    const getTopPlayer = (players: Player[], sortFn: (a: Player, b: Player) => number) => [...players].sort(sortFn)[0];
    const topScorer = getTopPlayer(team.players, (a, b) => b.seasonStats.goals - a.seasonStats.goals);
    const topAssister = getTopPlayer(team.players, (a, b) => b.seasonStats.assists - a.seasonStats.assists);
    const topRating = getTopPlayer(team.players, (a, b) => (b.seasonStats.averageRating || 0) - (a.seasonStats.averageRating || 0));

    const transfers = useMemo(() => {
        const history = team.transferHistory || [];
        const arrivals = history.filter(t => t.type === 'BOUGHT' || t.type === 'LOAN_IN').map(t => ({ date: t.date, name: t.playerName, from: t.counterparty, price: t.price }));
        const departures = history.filter(t => t.type === 'SOLD' || t.type === 'LOAN_OUT').map(t => ({ date: t.date, name: t.playerName, to: t.counterparty, price: t.price }));
        
        let totalSpent = 0;
        let totalIncome = 0;

        arrivals.forEach(a => {
            const val = parseFloat(a.price.replace(/[^0-9.-]+/g,""));
            if (!isNaN(val)) totalSpent += Math.abs(val);
        });

        departures.forEach(d => {
            const val = parseFloat(d.price.replace(/[^0-9.-]+/g,""));
            if (!isNaN(val)) totalIncome += Math.abs(val);
        });

        return { arrivals: arrivals.reverse(), departures: departures.reverse(), totalSpent, totalIncome, netBalance: totalIncome - totalSpent };
    }, [team.transferHistory]);
    
    const history = useMemo(() => {
        if (team.leagueHistory && team.leagueHistory.length > 0) return [...team.leagueHistory].reverse();
        return generateLeagueHistory(team);
    }, [team.id, team.leagueHistory]);

    // --- Format Season Helper ---
    const formatSeasonYear = (yearStr: string) => {
        if (yearStr.includes('/')) {
            const [start, end] = yearStr.split('/');
            // If end part is 4 digits (e.g. 2026), slice it to 2 digits
            if (end.length === 4) {
                return `${start}/${end.slice(2)}`;
            }
        }
        return yearStr;
    };

    const getPosBadgeColor = (pos: string) => {
        if (pos === 'GK') return 'bg-yellow-600';
        if (['SLB', 'STP', 'SGB'].includes(pos)) return 'bg-blue-600';
        if (['OS', 'OOS'].includes(pos)) return 'bg-green-600';
        return 'bg-red-600';
    };

    const tabs = [
        { id: 'GENERAL', label: 'Genel', icon: BarChart3 },
        { id: 'SQUAD', label: 'Oyuncular', icon: Users },
        { id: 'FIXTURES', label: 'Fikstür', icon: Calendar },
        { id: 'TRANSFERS', label: 'Transferler', icon: ArrowRightLeft },
        { id: 'TACTICS', label: 'Taktik', icon: LayoutTemplate },
        { id: 'MANAGEMENT', label: 'Yönetim', icon: Building2 },
        { id: 'HISTORY', label: 'Geçmiş', icon: History },
    ];

    // Request logic
    const canRequestStadium = yearsAtClub >= 3 && lastSeasonGoalAchieved && !team.boardRequests.stadiumBuilt;
    const canRequestTraining = (reputation - team.boardRequests.trainingLastRep) >= (0.4 * Math.pow(3, team.boardRequests.trainingUpgradesCount));
    const canRequestYouth = (reputation - team.boardRequests.youthLastRep) >= (0.3 * Math.pow(3, team.boardRequests.youthUpgradesCount));
    const canRequestBudget = manager.power > 65;
    const canRequestFfp = consecutiveFfpYears >= 2;
    const canRequestContract = lastSeasonGoalAchieved;

    // Display Championship Logic: Only Super League counts as "Major" championship in the header
    const displayChampionships = team.leagueId === 'LEAGUE_1' ? 0 : team.championships;

    // --- SQUAD GROUPING LOGIC (Exactly like SquadView) ---
    const startingXI = team.players.slice(0, 11);
    const substitutes = team.players.slice(11, 18);
    const reserves = team.players.slice(18);

    const playerGroups = [
        { title: 'İLK 11', players: startingXI, colorClass: 'text-green-600 dark:text-green-400', startIndex: 0 },
        { title: 'YEDEKLER', players: substitutes, colorClass: 'text-blue-600 dark:text-blue-400', startIndex: 11 },
        { title: 'KADRO DIŞI (REZERV)', players: reserves, colorClass: 'text-slate-500 dark:text-slate-400', startIndex: 18 }
    ];

    // --- SORTING HELPERS ---
    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortPlayers = (players: Player[]) => {
        if (!sortConfig) return players;
        return [...players].sort((a, b) => {
            let aValue: any = a[sortConfig.key as keyof Player];
            let bValue: any = b[sortConfig.key as keyof Player];
            // Handle complex objects or specific keys
            if (sortConfig.key === 'stamina') {
                 aValue = a.condition !== undefined ? a.condition : a.stats.stamina;
                 bValue = b.condition !== undefined ? b.condition : b.stats.stamina;
            }
            if (sortConfig.key === 'goals') { aValue = a.seasonStats.goals; bValue = b.seasonStats.goals; }
            if (sortConfig.key === 'assists') { aValue = a.seasonStats.assists; bValue = b.seasonStats.assists; }
            if (sortConfig.key === 'rating') { aValue = a.seasonStats.averageRating || 0; bValue = b.seasonStats.averageRating || 0; }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const SortableHeader = ({ label, sortKey, align = 'center', className = '' }: any) => (
        <th 
            className={`px-2 md:px-4 py-3 text-${align} cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition select-none group ${className}`} 
            onClick={() => requestSort(sortKey)}
        >
            <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
                {label} 
                <ArrowUpDown size={12} className={`text-slate-400 group-hover:text-yellow-600 ${sortConfig?.key === sortKey ? 'text-yellow-600' : ''}`}/>
            </div>
        </th>
    );

    return (
        <div className="h-full bg-slate-100 dark:bg-slate-900 overflow-y-auto custom-scrollbar flex flex-col">
            
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-30 shrink-0">
                <div className="max-w-7xl mx-auto px-2 flex items-center">
                    <button onClick={onClose} className="flex items-center gap-1 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors border-r border-slate-200 dark:border-slate-700 mr-2 shrink-0 group">
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs md:text-sm font-bold uppercase hidden sm:inline">Geri</span>
                    </button>
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2 flex-1">
                        {tabs.map((t) => {
                            const isActive = activeTab === t.id;
                            return (
                                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-2 px-4 md:px-6 py-3 text-sm md:text-base font-bold transition-all relative rounded-t-lg group whitespace-nowrap shrink-0 ${isActive ? 'text-yellow-600 dark:text-yellow-400 bg-white dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/30'}`}>
                                    {isActive && <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow-500 dark:bg-yellow-400 rounded-t-full shadow-[0_1px_8px_rgba(250,204,21,0.5)]"></div>}
                                    <t.icon size={18} className={`${isActive ? "text-yellow-600 dark:text-yellow-400" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`} />
                                    <span>{t.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm relative z-20 shrink-0">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                            {team.logo ? <img src={team.logo} className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl relative z-10" alt={team.name} /> : <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full ${team.colors[0]} flex items-center justify-center text-4xl font-bold text-white relative z-10 border-4 border-white dark:border-slate-800`}>{team.name.charAt(0)}</div>}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 font-teko tracking-tight uppercase">{team.name}</h2>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-600 dark:text-slate-300">
                                <div className="flex gap-1.5 items-center font-bold text-yellow-600 dark:text-yellow-500">
                                    <Trophy size={18} className="fill-yellow-500"/>
                                    <span className="text-lg">{displayChampionships} Şampiyonluk</span>
                                </div>
                                <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block"></div>
                                <div className="flex gap-1.5 items-center">
                                    <img 
                                        src={`https://flagcdn.com/w40/${countryCode}.png`} 
                                        className="w-5 h-auto object-contain rounded-[2px] shadow-sm" 
                                        alt={teamCountry} 
                                        onError={(e) => e.currentTarget.style.display='none'} 
                                    />
                                    <span className="font-bold">{teamCountry}</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden lg:flex flex-col items-center justify-center p-6 bg-slate-900 dark:bg-black rounded-2xl border-b-4 border-yellow-500 shadow-xl min-w-[140px]">
                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Reyting</div>
                            <div className="py-2">
                                {renderTeamStars(team.strength, 32)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {activeTab === 'GENERAL' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <StatCard label="Lig Sıralaması" value={`${rank}.`} subValue={leagueName} icon={TrendingUp} colorClass={rank === 1 ? 'text-yellow-500' : rank <= 3 ? 'text-green-500' : ''}/>
                            <StatCard label="Banka Bakiyesi" value={`${team.budget.toFixed(1)} M€`} subValue="Kullanılabilir Bütçe" icon={Landmark} colorClass="text-emerald-600 dark:text-emerald-400" />
                            <StatCard label="Piyasa Değeri" value={`${squadValue.toFixed(1)} M€`} subValue="Kadro Toplamı" icon={Wallet} />
                            <StatCard label="Mali Durum" value={financeStatus} subValue="Aylık Net Akış" icon={Scale} colorClass={financeColor} />
                            <StatCard label="Form Durumu" value={<div className="flex gap-1 items-center justify-start h-full">{form.length > 0 ? form.map((r, i) => (<div key={i} className={`w-3 h-3 rounded-full ${r === 'W' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : r === 'D' ? 'bg-slate-400' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} title={r}></div>)) : <span className="text-sm font-normal text-slate-400">Veri yok</span>}</div>} subValue="Son 5 Maç" icon={Activity} />
                            <StatCard label="Stadyum" value={team.stadiumName} subValue={`${team.stadiumCapacity.toLocaleString()} Kapasite`} icon={Home} />
                            <StatCard label="Taraftar" value={`${(team.fanBase / 1000000).toFixed(1)}M`} subValue="Global Destekçi" icon={Users} colorClass="text-blue-600 dark:text-blue-400" />
                            <StatCard label="Galibiyet" value={team.stats.won} subValue="Bu Sezon" icon={CheckCircleIcon} colorClass="text-green-600" />
                            <StatCard label="Puan" value={team.stats.points} subValue="Toplam Puan" icon={Trophy} colorClass="text-yellow-600" />
                            <StatCard label="İtibar" value={`${reputation.toFixed(1)}/5.0`} subValue="Popülerlik" icon={Star} colorClass="text-yellow-500" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><Users size={20} className="text-indigo-500" /> Öne Çıkan Oyuncular</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><PlayerStatCard label="Gol Kralı" player={topScorer} statValue={topScorer.seasonStats.goals} statLabel="Gol" icon={Goal} colorClass="text-green-500" onClick={onPlayerClick}/><PlayerStatCard label="Asist Kralı" player={topAssister} statValue={topAssister.seasonStats.assists} statLabel="Asist" icon={Zap} colorClass="text-blue-500" onClick={onPlayerClick}/><PlayerStatCard label="En Yüksek Reyting" player={topRating} statValue={topRating.seasonStats.averageRating || 0} statLabel="Reyting" icon={Star} colorClass="text-yellow-500" onClick={onPlayerClick}/></div></div>
                    </div>
                )}

                {/* --- SQUAD TAB IMPLEMENTATION --- */}
                {activeTab === 'SQUAD' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                        {playerGroups.map((group, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                <div className={`px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-bold flex justify-between ${group.colorClass}`}>
                                    <span>{group.title}</span>
                                    <span className="text-xs text-slate-500 font-normal">{group.players.length} Oyuncu</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead>
                                            <tr className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                                <th className="px-2 md:px-4 py-3 w-8 text-center">#</th>
                                                <SortableHeader label="Oyuncu" sortKey="name" align="left"/>
                                                <SortableHeader label="Güç" sortKey="skill"/>
                                                <SortableHeader label="Yaş" sortKey="age" className="hidden sm:table-cell"/>
                                                <SortableHeader label="Kondisyon" sortKey="stamina" className="hidden md:table-cell"/>
                                                <SortableHeader label="Moral" sortKey="morale" className="hidden md:table-cell"/>
                                                <SortableHeader label="Gol" sortKey="goals"/>
                                                <SortableHeader label="Asist" sortKey="assists"/>
                                                <SortableHeader label="Form (5)" sortKey="rating" className="hidden sm:table-cell"/>
                                                <SortableHeader label="Değer" sortKey="value" align="right"/>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.players.length > 0 ? (
                                                sortPlayers(group.players).map((p, i) => (
                                                    <PlayerRow 
                                                        key={p.id} 
                                                        p={p} 
                                                        index={group.startIndex + i} 
                                                        onClick={onPlayerClick} 
                                                        currentWeek={currentWeek}
                                                    />
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400 italic">Bu bölümde oyuncu yok.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* --- TRANSFERS TAB IMPLEMENTATION --- */}
                {activeTab === 'TRANSFERS' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        {/* Top Cards: Spent & Income */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Expense Card */}
                            <div className="bg-[#121519] border border-red-900/30 p-6 rounded-xl relative overflow-hidden group shadow-lg">
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-600 text-white p-3 rounded-lg shadow-lg shadow-red-900/50">
                                    <ArrowRight size={24} />
                                </div>
                                <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">TOPLAM HARCAMA</div>
                                <div className="text-4xl font-black text-white font-mono">{Math.abs(transfers.totalSpent).toFixed(1)} M€</div>
                            </div>
                            {/* Income Card */}
                            <div className="bg-[#121519] border border-green-900/30 p-6 rounded-xl relative overflow-hidden group shadow-lg">
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-600 text-white p-3 rounded-lg shadow-lg shadow-green-900/50">
                                    <ArrowLeft size={24} />
                                </div>
                                <div className="text-xs font-bold text-green-500 uppercase tracking-widest mb-1">TOPLAM GELİR</div>
                                <div className="text-4xl font-black text-white font-mono">+{transfers.totalIncome.toFixed(1)} M€</div>
                            </div>
                        </div>

                        {/* Lists: Arrivals & Departures */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Arrivals List */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-full">
                                <div className="p-3 bg-emerald-900/20 border-b border-emerald-900/50 flex justify-between items-center">
                                    <h3 className="text-emerald-500 font-black uppercase tracking-wider text-sm flex items-center gap-2">
                                        <ArrowRight size={16}/> Gelenler
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Bu Sezon</span>
                                </div>
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left text-xs whitespace-nowrap">
                                        <thead className="bg-slate-100 dark:bg-slate-900/50 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-3 py-2 w-16">Tarih</th>
                                                <th className="px-3 py-2">Oyuncu</th>
                                                <th className="px-3 py-2">Geldiği Takım</th>
                                                <th className="px-3 py-2 text-right">Bedel</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                            {transfers.arrivals.length > 0 ? (
                                                transfers.arrivals.map((t, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                                        <td className="px-3 py-2 text-slate-500">{t.date}</td>
                                                        <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{t.name}</td>
                                                        <td className="px-3 py-2 text-emerald-600 dark:text-emerald-400 font-medium">{t.from}</td>
                                                        <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300 font-bold">{t.price}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-900/20">
                                                        Henüz gelen oyuncu yok.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Departures List */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-full">
                                <div className="p-3 bg-red-900/20 border-b border-red-900/50 flex justify-between items-center">
                                    <h3 className="text-red-500 font-black uppercase tracking-wider text-sm flex items-center gap-2">
                                        <ArrowLeft size={16}/> Gidenler
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Bu Sezon</span>
                                </div>
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left text-xs whitespace-nowrap">
                                        <thead className="bg-slate-100 dark:bg-slate-900/50 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-3 py-2 w-16">Tarih</th>
                                                <th className="px-3 py-2">Oyuncu</th>
                                                <th className="px-3 py-2">Gittiği Takım</th>
                                                <th className="px-3 py-2 text-right">Bedel</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                            {transfers.departures.length > 0 ? (
                                                transfers.departures.map((t, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                                        <td className="px-3 py-2 text-slate-500">{t.date}</td>
                                                        <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{t.name}</td>
                                                        <td className="px-3 py-2 text-red-600 dark:text-red-400 font-medium">{t.to}</td>
                                                        <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300 font-bold">{t.price}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-900/20">
                                                        Henüz giden oyuncu yok.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'FIXTURES' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                         {Object.entries(groupedFixtures).map(([monthLabel, matches], groupIndex) => (
                            <div key={groupIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 flex items-center gap-2">
                                    <Calendar className="text-slate-400" />
                                    {monthLabel}
                                </h3>

                                <div className="flex flex-col gap-1">
                                    <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="col-span-3">Tarih</div>
                                        <div className="col-span-1">Saat</div>
                                        <div className="col-span-2">Organizasyon</div>
                                        <div className="col-span-2">Rakip</div>
                                        <div className="col-span-1">Yer</div>
                                        <div className="col-span-1 text-center">Sonuç</div>
                                        <div className="col-span-2">Golcüler</div>
                                    </div>

                                    {matches.map(f => {
                                        const isHome = f.homeTeamId === team.id;
                                        const opponentId = isHome ? f.awayTeamId : f.homeTeamId;
                                        const opponent = allTeams.find(t => t.id === opponentId);
                                        const resultStatus = getResultStatus(f, isHome);
                                        const isCurrentWeek = f.week === currentWeek;
                                        const compDetails = getCompetitionDetails(f.competitionId);
                                        const CompIcon = compDetails.icon;
                                        
                                        // Penalty Display Check
                                        const showPK = f.played && f.pkHome !== undefined && f.pkAway !== undefined && f.homeScore === f.awayScore && ['CUP', 'SUPER_CUP', 'PLAYOFF', 'PLAYOFF_FINAL', 'EUROPE'].includes(f.competitionId || '');

                                        let scorersText = "";
                                        if (f.played && f.matchEvents) {
                                            const goals = f.matchEvents.filter(e => e.type === 'GOAL');
                                            scorersText = goals.map(g => `${g.scorer?.split(' ').pop()} ${g.minute}'`).join(', ');
                                            if (scorersText.length > 40) scorersText = scorersText.substring(0, 37) + "...";
                                        }

                                        return (
                                            <div 
                                                key={f.id}
                                                className={`
                                                    grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center 
                                                    p-4 rounded-lg border transition-all duration-200
                                                    ${isCurrentWeek 
                                                            ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 ring-1 ring-blue-500/30' 
                                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }
                                                `}
                                            >
                                                <div className="col-span-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                                                    {getFullDate(f.date)}
                                                </div>
                                                <div className="col-span-1 text-sm font-mono text-slate-400">20:00</div>
                                                
                                                {/* Competition Name - CLICKABLE */}
                                                <div 
                                                    className="col-span-2 flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm cursor-pointer group/comp hover:bg-slate-200 dark:hover:bg-white/5 p-1 rounded -ml-1 transition-colors"
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        if (onCompetitionClick) onCompetitionClick(f.competitionId || 'LEAGUE'); 
                                                    }}
                                                    title="Turnuva detaylarını görüntüle"
                                                >
                                                    <CompIcon size={14} className={compDetails.color} />
                                                    <span className="truncate font-bold group-hover/comp:text-slate-900 dark:group-hover/comp:text-white group-hover/comp:underline transition-colors">
                                                        {compDetails.name}
                                                    </span>
                                                </div>

                                                <div 
                                                    className="col-span-2 flex items-center gap-3 cursor-pointer group hover:bg-slate-200 dark:hover:bg-white/5 p-1 rounded -ml-1 transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); if(opponent) onTeamClick(opponent.id); }}
                                                    title="Takım profiline git"
                                                >
                                                    {opponent?.logo ? (<img src={opponent.logo} className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" alt={opponent.name} />) : (<div className={`w-8 h-8 rounded-full ${opponent?.colors[0]}`}></div>)}
                                                    <span className="font-bold truncate group-hover:underline text-slate-900 dark:text-slate-200">{opponent?.name}</span>
                                                </div>
                                                <div className="col-span-1 text-sm text-slate-500">{isHome ? 'İç Saha' : 'Deplasman'}</div>
                                                <div 
                                                    className="col-span-1 flex justify-center cursor-pointer hover:scale-105 transition-transform"
                                                    onClick={(e) => { e.stopPropagation(); if(f.played && onFixtureClick) onFixtureClick(f); }}
                                                    title={f.played ? "Maç istatistiklerini görüntüle" : ""}
                                                >
                                                    {f.played ? (
                                                        <div className={`flex flex-col items-center justify-center`}>
                                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold text-sm shadow-sm ${resultStatus?.color}`}>
                                                                {f.homeScore} - {f.awayScore}
                                                            </div>
                                                            {showPK && (
                                                                <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                                                                    (P: {f.pkHome}-{f.pkAway})
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (<span className="text-slate-400 font-mono">- : -</span>)}
                                                </div>
                                                <div className="col-span-2 flex justify-between items-center">
                                                    <div className="text-xs text-slate-500 truncate max-w-[100px]" title={scorersText}>{scorersText}</div>
                                                    <Info size={16} className="lg:hidden text-slate-400"/>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        {teamFixtures.length === 0 && (
                            <div className="text-center py-12 text-slate-400 italic">Fikstür bilgisi bulunamadı.</div>
                        )}
                    </div>
                )}

                {activeTab === 'TACTICS' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-widest"><LayoutTemplate size={20} className="text-yellow-500" /> Oyun Karakteri</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Diziliş</div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">{team.formation}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Anlayış</div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">{team.mentality}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Pas Tarzı</div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">{team.passing}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Tempo</div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white">{team.tempo}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-[500px]">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Trophy className="text-yellow-500" size={20}/> Muhtemel Saha Dizilimi</h3>
                                </div>
                                <div className="flex-1 bg-slate-900 p-4">
                                    <PitchVisual 
                                        players={team.players} 
                                        onPlayerClick={onPlayerClick} 
                                        selectedPlayerId={null} 
                                        formation={team.formation} 
                                        currentWeek={currentWeek}
                                    />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-[500px]">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users className="text-indigo-500" size={20}/> Muhtemel İlk 11 Kadrosu</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 custom-scrollbar">
                                    {team.players.slice(0, 11).map((p, i) => (
                                        <div key={p.id} onClick={() => onPlayerClick(p)} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-200 shrink-0">
                                                    <PlayerFace player={p} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold text-white ${getPosBadgeColor(p.position)}`}>{p.position}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-slate-900 dark:text-white">{p.skill}</div>
                                                <div className="text-[9px] uppercase text-slate-500">Güç</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'MANAGEMENT' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-2">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 border-4 border-slate-100 dark:border-slate-600 flex items-center justify-center shadow-lg"><User size={48} className="text-slate-600"/></div>
                                    <div className="mt-3 text-center"><div className="text-sm font-bold text-slate-500 uppercase tracking-wider">Kulüp Başkanı</div><div className="text-xl font-black text-slate-900 dark:text-white">{team.board.presidentName}</div></div>
                                </div>
                                {team.id === myTeamId && (
                                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-1 gap-6">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="text-sm font-black text-yellow-600 dark:text-yellow-500 uppercase flex items-center gap-2"><Sparkles size={18}/> Yönetim Talepleri</div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {[
                                                    { id: 'NEW_STADIUM', label: 'Yeni Stadyum İnşası', icon: Home, can: canRequestStadium, cond: '3 Yıl Görev & Hedef' },
                                                    { id: 'UPGRADE_TRAINING', label: 'Antrenman Geliştir', icon: Zap, can: canRequestTraining, cond: `+${(0.4 * Math.pow(3, team.boardRequests.trainingUpgradesCount)).toFixed(1)} İtibar` },
                                                    { id: 'UPGRADE_YOUTH', label: 'Altyapı Geliştir', icon: School, can: canRequestYouth, cond: `+${(0.3 * Math.pow(3, team.boardRequests.youthUpgradesCount)).toFixed(1)} İtibar` },
                                                    { id: 'INC_TRANSFER_BUDGET', label: 'Ek Transfer Bütçesi', icon: Wallet2, can: canRequestBudget, cond: 'Menajer Gücü > 65' },
                                                    { id: 'WAGE_PERCENTAGE', label: 'Maaş Bütçesi Artışı', icon: Coins, can: canRequestFfp, cond: '2 Yıl FFP Uyumu' },
                                                    { id: 'NEW_CONTRACT', label: 'Yeni Sözleşme Görüşmesi', icon: FileSignature, can: canRequestContract, cond: 'Hedef Gerçekleştirme' }
                                                ].map(req => (
                                                    <button 
                                                        key={req.id}
                                                        disabled={!req.can}
                                                        onClick={() => req.can && onBoardRequest && onBoardRequest(req.id)}
                                                        className={`p-4 rounded-lg border-2 text-left transition-all flex flex-col justify-between h-32 ${req.can ? 'bg-white dark:bg-slate-800 border-yellow-500/50 hover:border-yellow-500 shadow-md hover:scale-[1.02]' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'}`}
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <req.icon size={20} className={req.can ? 'text-yellow-600' : 'text-slate-400'}/>
                                                            {req.can && <CheckCircle className="text-green-500" size={16}/>}
                                                        </div>
                                                        <div>
                                                            <div className={`text-xs font-bold ${req.can ? 'text-slate-900 dark:text-white' : 'text-slate-50'}`}>{req.label}</div>
                                                            <div className="text-[10px] text-slate-400 mt-1 font-mono uppercase">{req.cond}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><HardHat size={80}/></div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Zap size={16} className="text-yellow-500"/> Antrenman Tesisleri</h3>
                                <div className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">{team.facilities.trainingCenterName}</div>
                                <div className="flex items-center gap-2 mb-2"><div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${team.facilities.trainingLevel >= 18 ? 'bg-purple-500' : team.facilities.trainingLevel >= 14 ? 'bg-green-500' : team.facilities.trainingLevel >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${(team.facilities.trainingLevel / 20) * 100}%`}}></div></div><span className="text-xs font-mono font-bold text-slate-500">{team.facilities.trainingLevel}/20</span></div>
                                <div className="text-xs text-slate-400">{team.facilities.trainingLevel >= 18 ? 'Dünya Standartlarında' : team.facilities.trainingLevel >= 14 ? 'Üst Düzey' : team.facilities.trainingLevel >= 10 ? 'Yeterli' : 'Yetersiz'}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><School size={80}/></div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Briefcase size={16} className="text-blue-500"/> Altyapı Akademisi</h3>
                                <div className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">{team.facilities.youthAcademyName}</div>
                                <div className="flex items-center gap-2 mb-2"><div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${team.facilities.youthLevel >= 18 ? 'bg-purple-500' : team.facilities.youthLevel >= 14 ? 'bg-green-500' : team.facilities.youthLevel >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${(team.facilities.youthLevel / 20) * 100}%`}}></div></div><span className="text-xs font-mono font-bold text-slate-500">{team.facilities.youthLevel}/20</span></div>
                                <div className="text-xs text-slate-400">{team.facilities.youthLevel >= 18 ? 'Fabrika Gibi' : team.facilities.youthLevel >= 14 ? 'Verimli' : team.facilities.youthLevel >= 10 ? 'Ortalama' : 'Geliştirilmeli'}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Building size={80}/></div>
                                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Building2 size={16} className="text-green-500"/> Kurumsal Yapı</h3>
                                <div className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-tight">Yönetim Binası & Ofisler</div>
                                <div className="flex items-center gap-2 mb-2"><div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${team.facilities.corporateLevel >= 18 ? 'bg-purple-500' : team.facilities.corporateLevel >= 14 ? 'bg-green-500' : team.facilities.corporateLevel >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${(team.facilities.corporateLevel / 20) * 100}%`}}></div></div><span className="text-xs font-mono font-bold text-slate-500">{team.facilities.corporateLevel}/20</span></div>
                                <div className="text-xs text-slate-400">{team.facilities.corporateLevel >= 18 ? 'Profesyonel' : team.facilities.corporateLevel >= 14 ? 'İyi Yönetilen' : 'Standart'}</div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"><h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users className="text-indigo-500"/> Teknik Heyet</h3></div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {team.staff && team.staff.length > 0 ? team.staff.map((staff, i) => (<div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-lg">{staff.name.charAt(0)}</div><div><div className="font-bold text-slate-900 dark:text-white">{staff.name}</div><div className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{staff.role}</div></div></div><div className="flex flex-col items-end"><div className={`font-black text-lg ${staff.rating >= 80 ? 'text-green-500' : staff.rating >= 60 ? 'text-yellow-500' : 'text-slate-500'}`}>{staff.rating}</div><div className="text-[10px] uppercase text-slate-400">Yetenek</div></div></div>)) : (<div className="p-8 text-center text-slate-500 italic">Personel verisi yüklenemedi.</div>)}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'HISTORY' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-center border border-slate-700 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5"><Archive size={200} className="text-white"/></div>
                            <h3 className="text-xl font-bold text-yellow-500 uppercase tracking-widest mb-8 relative z-10 flex justify-center items-center gap-3"><Trophy size={24}/> Kulüp Müzesi</h3>
                            <div className="flex justify-center gap-12 flex-wrap relative z-10">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]"><Trophy size={48} className="text-yellow-400 fill-yellow-400"/></div>
                                    <div className="text-4xl font-black text-white">{team.championships}</div>
                                    <div className="text-xs uppercase text-slate-400 font-bold tracking-wider">
                                        {team.leagueId === 'LEAGUE_1' ? '1. Lig Şampiyonluğu' : 'Şampiyonluk'}
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-2"><div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]"><Trophy size={48} className="text-blue-400 fill-blue-400"/></div><div className="text-4xl font-black text-white">{team.domesticCups || 0}</div><div className="text-xs uppercase text-slate-400 font-bold tracking-wider">Türkiye Kupası</div></div>
                                <div className="flex flex-col items-center gap-2"><div className="w-24 h-24 bg-slate-500/10 rounded-full flex items-center justify-center border-2 border-slate-500 shadow-[0_0_20px_rgba(148,163,184,0.3)]"><Trophy size={48} className="text-slate-300 fill-slate-300"/></div><div className="text-4xl font-black text-white">{team.superCups || 0}</div><div className="text-xs uppercase text-slate-400 font-bold tracking-wider">Süper Kupa</div></div>
                                <div className="flex flex-col items-center gap-2"><div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]"><Trophy size={48} className="text-purple-400 fill-purple-400"/></div><div className="text-4xl font-black text-white">{team.europeanCups || 0}</div><div className="text-xs uppercase text-slate-400 font-bold tracking-wider">Avrupa Kupası</div></div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"><div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700"><h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><History className="text-slate-500" size={20}/> Lig Geçmişi</h3></div><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-100 dark:bg-slate-900 text-xs text-slate-500 uppercase font-bold"><tr><th className="px-6 py-3">Sezon</th><th className="px-6 py-3">Lig</th><th className="px-6 py-3 text-center">Sıralama</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{history.map((h, i) => (<tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition ${h.rank === 1 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}><td className="px-6 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{formatSeasonYear(h.year)}</td><td className="px-6 py-3 text-slate-600 dark:text-slate-400">{leagueName}</td><td className="px-6 py-3 text-center">{h.rank === 1 ? (<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 font-bold text-xs border border-yellow-200 dark:border-yellow-700"><Trophy size={10} className="fill-yellow-600"/> ŞAMPİYON</span>) : (<span className={`font-bold ${h.rank <= 4 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>{h.rank}.</span>)}</td></tr>))}</tbody></table></div></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDetailView;
