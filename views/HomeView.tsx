import React, { useState } from 'react';
import { ManagerProfile, Team, Fixture, StaffRelation, UIAlert } from '../types';
import { calculateForm, calculateManagerPower } from '../utils/gameEngine';
import { getFormattedDate } from '../utils/calendarAndFixtures';
// FIX: Added 'Users' to imports from lucide-react
import { Home, User, Users, FileText, Heart, Calendar, Star, StarHalf, Feather, AlertTriangle, Clock, Trophy, Wallet, BarChart3, Building2, ArrowRightLeft, TrendingUp, TrendingDown, Power, Check, X, Crown, LogOut, UserCircle2, Smile, Meh, Frown, FileSignature, CheckCircle, XCircle } from 'lucide-react';
import StandingsTable from '../components/shared/StandingsTable';
import HallOfFameModal from '../modals/HallOfFameModal';

interface HomeViewProps {
    manager: ManagerProfile;
    team: Team;
    teams: Team[];
    myTeamId: string;
    currentWeek: number;
    fixtures: Fixture[];
    onTeamClick: (id: string) => void;
    onFixtureClick?: (f: Fixture) => void;
    playTime: number;
    onRetire?: () => void;
    onTerminateContract?: () => void;
    onUpdateManagerContract?: (wage: number, years: number) => void; // New Prop
    onShowAlert: (alert: UIAlert) => void; // Added for visual feedback
}

const HomeView: React.FC<HomeViewProps> = ({ manager, team, teams, myTeamId, currentWeek, fixtures, onTeamClick, onFixtureClick, playTime, onRetire, onTerminateContract, onUpdateManagerContract, onShowAlert }) => {
    const [tab, setTab] = useState<'GENERAL' | 'PROFILE' | 'CONTRACT' | 'RELATIONS'>('GENERAL');
    const [retireConfirm, setRetireConfirm] = useState(false);
    const [terminateConfirm, setTerminateConfirm] = useState(false);
    const [showHallOfFame, setShowHallOfFame] = useState(false);
    
    // Contract Renewal State
    const [renewalOffer, setRenewalOffer] = useState<{ wage: number, years: number } | null>(null);
    
    // Calculate stats
    // FIX: Find next match based on Date (First unplayed), not strictly currentWeek ID to support cups
    const upcomingMatches = fixtures
        .filter(f => (f.homeTeamId === myTeamId || f.awayTeamId === myTeamId) && !f.played)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const nextMatch = upcomingMatches.length > 0 ? upcomingMatches[0] : null;
    
    const opponent = nextMatch ? teams.find(t => t.id === (nextMatch.homeTeamId === myTeamId ? nextMatch.awayTeamId : nextMatch.homeTeamId)) : null;
    const nextMatchDateDisplay = nextMatch ? getFormattedDate(nextMatch.date).label : '';

    // Match Calendar Logic
    const myFixtures = fixtures
        .filter(f => f.homeTeamId === myTeamId || f.awayTeamId === myTeamId)
        // FIX: Sort by Date instead of Week to handle Cup weeks (e.g. 100) correctly mixed with league
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Past 2 matches (played, reverse order for most recent first)
    const pastMatches = myFixtures.filter(f => f.played).reverse().slice(0, 2);
    // Next 4 matches (not played)
    const futureMatches = myFixtures.filter(f => !f.played).slice(0, 4);

    // Determine current league context
    const currentLeagueId = team.leagueId || 'LEAGUE';
    
    // Filter teams based on the current league of the user
    const leagueTeams = teams.filter(t => t.leagueId === currentLeagueId || (!t.leagueId && currentLeagueId === 'LEAGUE'));

    // Calculate Ranking within the specific league
    const sortedTeams = [...leagueTeams].sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });
    const rank = sortedTeams.findIndex(t => t.id === team.id) + 1;

    const leagueName = currentLeagueId === 'LEAGUE_1' ? "Hayvanlar 1. Ligi" : "Süper Toto Hayvanlar Ligi";

    // Calculate Form
    const form = calculateForm(team.id, fixtures);

    // Calculate Average Morale
    const averageMorale = team.players.length > 0 
        ? Math.round(team.players.reduce((acc, p) => acc + p.morale, 0) / team.players.length) 
        : 0;

    const getMatchResult = (f: Fixture) => {
        const isHome = f.homeTeamId === myTeamId;
        const myScore = isHome ? f.homeScore! : f.awayScore!;
        const oppScore = isHome ? f.awayScore! : f.homeScore!;
        
        // PK Logic - Only for knockouts or if penalties actually happened
        const isKnockout = ['CUP', 'SUPER_CUP', 'PLAYOFF', 'PLAYOFF_FINAL'].includes(f.competitionId || '') || (f.competitionId === 'EUROPE' && f.week > 208);
        
        if (isKnockout && myScore === oppScore && f.pkHome !== undefined && f.pkAway !== undefined) {
             const myPk = isHome ? f.pkHome : f.pkAway;
             const oppPk = isHome ? f.pkAway : f.pkHome;
             if (myPk > oppPk) return { label: 'G (P)', color: 'bg-green-600 text-white' };
             else return { label: 'M (P)', color: 'bg-red-600 text-white' };
        }

        if (myScore > oppScore) return { label: 'G', color: 'bg-green-600 text-white' };
        if (myScore < oppScore) return { label: 'M', color: 'bg-red-600 text-white' };
        return { label: 'B', color: 'bg-slate-500 text-white' };
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        
        if (h > 0) return `${h} Sa ${m} Dk`;
        return `${m} Dk`;
    };

    // --- HELPER FOR FIXTURE LABELS ---
    const getFixtureMeta = (f: Fixture) => {
        if (f.competitionId === 'CUP') {
            if (f.week === 100) return { label: 'S32', sub: 'KUPA' };
            if (f.week === 101) return { label: 'S16', sub: 'KUPA' };
            if (f.week === 102) return { label: 'ÇF', sub: 'KUPA' };
            if (f.week === 103) return { label: 'YF', sub: 'KUPA' };
            if (f.week === 104) return { label: 'FNL', sub: 'KUPA' };
            return { label: 'KUPA', sub: 'MAÇ' };
        }
        if (f.competitionId === 'SUPER_CUP') {
            if (f.week === 90) return { label: 'YF', sub: 'S.KP' };
            if (f.week === 91) return { label: 'FNL', sub: 'S.KP' };
            return { label: 'S.KP', sub: 'MAÇ' };
        }
        if (f.competitionId === 'PLAYOFF' || f.competitionId === 'PLAYOFF_FINAL') {
             if (f.week === 35) return { label: 'YF', sub: 'P.OF' };
             if (f.week === 36) return { label: 'FNL', sub: 'P.OF' };
             return { label: 'P.OF', sub: 'MAÇ' };
        }
        if (f.competitionId === 'EUROPE') {
            if (f.week <= 208) return { label: `${f.week - 200}.`, sub: 'AVR' };
            if (f.week <= 210) return { label: 'PO', sub: 'AVR' };
            if (f.week <= 212) return { label: 'S16', sub: 'AVR' };
            if (f.week <= 214) return { label: 'ÇF', sub: 'AVR' };
            if (f.week <= 216) return { label: 'YF', sub: 'AVR' };
            return { label: 'FNL', sub: 'AVR' };
        }
        
        // Default League
        return { label: `${f.week}.`, sub: 'HF' };
    };

    const tabs = [
        { id: 'GENERAL', label: 'Ana Sayfa', icon: Home },
        { id: 'PROFILE', label: 'Profilim', icon: User },
        { id: 'CONTRACT', label: 'Sözleşmem', icon: FileText },
        { id: 'RELATIONS', label: 'İlişkiler', icon: Heart },
    ];

    // Check for critical trust issues to display alert on tab
    const hasTrustIssue = manager.trust.board < 35 || manager.trust.fans < 40;

    // --- MANAGER POWER CALCULATION ---
    const currentManagerPower = calculateManagerPower(manager.stats);

    // --- WIN PERCENTAGE CALCULATION ---
    const winPercentage = manager.stats.matchesManaged > 0 
        ? ((manager.stats.wins / manager.stats.matchesManaged) * 100).toFixed(1) 
        : '0.0';

    const getRelationStatus = (val: number) => {
        if (val >= 80) return { label: 'Dostane', color: 'text-green-500', icon: Smile };
        if (val >= 60) return { label: 'İyi', color: 'text-emerald-400', icon: Smile };
        if (val >= 40) return { label: 'Normal', color: 'text-slate-400', icon: Meh };
        if (val >= 20) return { label: 'Soğuk', color: 'text-orange-400', icon: Meh };
        return { label: 'Gergin', color: 'text-red-500', icon: Frown };
    };

    // --- STAR RATING LOGIC ---
    
    // Team Rating (Existing Logic)
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

    // Manager Rating (NEW Logic requested)
    const getManagerStarRating = (power: number) => {
        if (power >= 90) return 5;
        if (power >= 85) return 4.5;
        if (power >= 80) return 4;
        if (power >= 75) return 3.5;
        if (power >= 70) return 3;
        if (power >= 65) return 2.5;
        if (power >= 60) return 2;
        if (power >= 55) return 1.5;
        if (power >= 52) return 1;
        return 0.5;
    };

    const renderTeamStars = (strength: number, size: number = 24, isManager: boolean = false) => {
        const rating = isManager ? getManagerStarRating(strength) : getTeamStarRating(strength);
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 !== 0;
        const emptyStars = 5 - Math.ceil(rating);

        return (
            <div className="flex gap-1 justify-center">
                {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} size={size} className="fill-yellow-500 text-yellow-500 drop-shadow-sm" />)}
                {hasHalf && <StarHalf size={size} className="fill-yellow-500 text-yellow-500 drop-shadow-sm" />}
                {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} size={size} className="text-slate-300 dark:text-slate-700" />)}
            </div>
        );
    };

    // --- CONTRACT RENEWAL LOGIC ---
    const handleRequestRenewal = () => {
        // Condition: Trust >= 80%
        if (manager.trust.board < 80) {
            onShowAlert({
                title: "Yönetim Talebi Reddetti",
                message: "Başkan: 'Henüz kendinizi tam olarak kanıtlamadınız. İlişkilerimiz %80 seviyesine ulaşmadan yeni sözleşme konuşamayız.'",
                type: 'error'
            });
            return;
        }

        // Generate Offer (Max 1.5x)
        const currentSalary = manager.contract.salary;
        const maxSalary = currentSalary * 1.5;
        const minMultiplier = 1.1;
        const maxMultiplier = 1.5;
        const randomMult = minMultiplier + (Math.random() * (maxMultiplier - minMultiplier));
        
        const offeredSalary = parseFloat((currentSalary * randomMult).toFixed(2));
        const extensionYears = 3; 

        onShowAlert({
            title: "Talep Kabul Edildi",
            message: "Yönetim performansınızdan memnun ve masaya oturmaya hazır. Görüşme odasına geçiliyor...",
            type: 'success'
        });

        setRenewalOffer({ wage: offeredSalary, years: extensionYears });
    };

    const handleAcceptRenewal = () => {
        if (renewalOffer && onUpdateManagerContract) {
            const newExpiry = 2025 + (manager.stats.matchesManaged > 0 ? Math.floor(manager.stats.matchesManaged/34) : 0) + renewalOffer.years; 
            // Simplified Expiry: Just add years to current year approx or use fixed logic
            // Since we don't have currentYear easily accessible as string, let's use manager.contract.expires + years
            const finalExpiry = manager.contract.expires + renewalOffer.years;

            onUpdateManagerContract(renewalOffer.wage, finalExpiry);
            setRenewalOffer(null);
            alert("TEBRİKLER!\n\nYeni sözleşme imzalandı. Yönetimle olan bağınız güçlendi.");
        }
    };

    return (
        <div className="space-y-6 pb-10">
            {showHallOfFame && <HallOfFameModal manager={manager} onClose={() => setShowHallOfFame(false)} />}
            
            {/* CONTRACT RENEWAL MODAL */}
            {renewalOffer && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-800 w-full max-w-md rounded-xl border-2 border-blue-500 shadow-2xl p-6 text-center animate-in zoom-in duration-200">
                        <div className="flex justify-center mb-4">
                            <div className="bg-blue-500/20 p-4 rounded-full border border-blue-500">
                                <FileSignature size={48} className="text-blue-500" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Sözleşme Yenileme Teklifi</h3>
                        <p className="text-slate-400 mb-6 text-sm">
                            Yönetim performansınızdan memnun ve sizinle devam etmek istiyor. İşte teklif:
                        </p>
                        
                        <div className="bg-slate-900/50 p-4 rounded-lg text-left mb-6 space-y-3 border border-slate-700">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Yeni Yıllık Ücret</span>
                                <span className="text-green-400 font-bold text-lg">{renewalOffer.wage} M€</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Sözleşme Süresi</span>
                                <span className="text-white font-bold">+{renewalOffer.years} Yıl</span>
                            </div>
                            <div className="h-px bg-slate-700 my-1"></div>
                            <div className="text-xs text-slate-500 italic text-center">
                                * Bu teklif son tekliftir ve pazarlığa kapalıdır.
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setRenewalOffer(null)} 
                                className="flex-1 py-3 rounded-lg font-bold bg-slate-700 text-white hover:bg-slate-600 transition flex items-center justify-center gap-2"
                            >
                                <XCircle size={18}/> Reddet
                            </button>
                            <button 
                                onClick={handleAcceptRenewal} 
                                className="flex-1 py-3 rounded-lg font-bold bg-green-600 text-white hover:bg-green-500 transition shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18}/> İmzala
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Tabs Style - Scrollable on mobile */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700/50 px-2 overflow-x-auto no-scrollbar">
                {tabs.map((t) => {
                    const isActive = tab === t.id;
                    const showAlert = t.id === 'RELATIONS' && hasTrustIssue;

                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`flex items-center gap-2 px-4 md:px-6 py-3 text-sm md:text-base font-bold transition-all relative rounded-t-lg group whitespace-nowrap shrink-0 ${
                                isActive 
                                ? 'text-yellow-600 dark:text-yellow-400 bg-white dark:bg-slate-800' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/30'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow-500 dark:bg-yellow-400 rounded-t-full shadow-[0_1px_8px_rgba(250,204,21,0.5)]"></div>
                            )}
                            <t.icon size={18} className={`${isActive ? "text-yellow-600 dark:text-yellow-400" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`} />
                            <span>{t.label}</span>
                            {showAlert && (
                                <AlertTriangle size={16} className="text-red-500 animate-pulse ml-1 fill-red-500/20" />
                            )}
                        </button>
                    );
                })}
            </div>

            {tab === 'GENERAL' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4">Takım Durumu</h2>
                            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
                                <div className="bg-slate-100 dark:bg-slate-700 p-2 md:p-4 rounded-lg text-center flex flex-col items-center justify-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs uppercase font-bold mb-1">Reyting</div>
                                    <div className="mt-1 md:mt-2">
                                        {renderTeamStars(team.strength)}
                                    </div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 p-2 md:p-4 rounded-lg text-center relative">
                                    <div className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs uppercase font-bold">Taraftar</div>
                                    <div className="text-xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1 md:mt-2">{(team.fanBase/1000000).toFixed(1)}M</div>
                                    {/* Fan Trust Warning on Home */}
                                    {manager.trust.fans < 40 && (
                                        <div className="absolute top-1 right-1 md:top-2 md:right-2" title="Güven Düşük!">
                                            <AlertTriangle size={12} className="text-red-500 animate-pulse"/>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 p-2 md:p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs uppercase font-bold">Moral</div>
                                    <div className="text-xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1 md:mt-2">%{averageMorale}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                                <div className="bg-slate-100 dark:bg-slate-700 p-2 md:p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs uppercase font-bold">Sıralama</div>
                                    <div className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1 md:mt-2">{rank}.</div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 p-2 md:p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs uppercase font-bold">Puan</div>
                                    <div className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white mt-1 md:mt-2">{team.stats.points}</div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-700 p-2 md:p-4 rounded-lg text-center">
                                    <div className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs uppercase font-bold">Form</div>
                                    <div className="flex justify-center gap-1 mt-2 md:mt-3">
                                        {form.length > 0 ? form.map((r, i) => (
                                            <span key={i} className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${r === 'W' ? 'bg-green-500' : r === 'D' ? 'bg-slate-400' : 'bg-red-500'}`}></span>
                                        )) : <span className="text-slate-500 text-sm">-</span>}
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2 flex justify-between items-end">
                                <span>Sonraki Maç</span>
                                <span className="text-xs text-slate-500 font-normal">{nextMatchDateDisplay}</span>
                            </h2>
                            {opponent ? (
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition" onClick={() => onTeamClick(opponent.id)}>
                                    <div className="flex items-center gap-3">
                                        {opponent.logo && <img src={opponent.logo} className="w-10 h-10 md:w-12 md:h-12 object-contain" />}
                                        <div className="flex flex-col">
                                            <span className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{opponent.name}</span>
                                            {nextMatch && nextMatch.played && (
                                                <span className="text-xs text-yellow-600 dark:text-yellow-500 font-bold">Maç Sonu: {nextMatch.homeScore} - {nextMatch.awayScore}</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded">{nextMatch?.homeTeamId === myTeamId ? 'İÇ SAHA' : 'DEPLASMAN'}</span>
                                </div>
                            ) : <div className="p-4 text-slate-500">Bay Haftası veya Sezon Arası</div>}
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        {/* MATCH CALENDAR BLOCK */}
                        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Calendar className="text-yellow-600 dark:text-yellow-500" size={20}/> Maç Takvimi
                            </h2>
                            
                            {/* Last Matches */}
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Son Sonuçlar</h3>
                                <div className="space-y-2">
                                    {pastMatches.length === 0 && <div className="text-slate-500 text-sm italic">Henüz maç oynanmadı.</div>}
                                    {pastMatches.map(f => {
                                        const isHome = f.homeTeamId === myTeamId;
                                        const opponentId = isHome ? f.awayTeamId : f.homeTeamId;
                                        const opp = teams.find(t => t.id === opponentId);
                                        const res = getMatchResult(f);
                                        const dateLabel = getFormattedDate(f.date).label;
                                        
                                        // Aggregate & Penalty Score Logic
                                        let subInfo = null;

                                        if (f.pkHome !== undefined && f.pkAway !== undefined) {
                                            subInfo = `P(${f.pkHome}-${f.pkAway})`;
                                        } else if (f.competitionId === 'EUROPE' && [210, 212, 214, 216].includes(f.week)) {
                                            // Calculate Aggregate
                                            const prevWeek = f.week - 1;
                                            const prevMatch = fixtures.find(fix =>
                                                fix.week === prevWeek &&
                                                fix.competitionId === 'EUROPE' &&
                                                fix.homeTeamId === f.awayTeamId &&
                                                fix.awayTeamId === f.homeTeamId &&
                                                fix.played
                                            );
                                            if (prevMatch) {
                                                const aggH = (f.homeScore || 0) + (prevMatch.awayScore || 0);
                                                const aggA = (f.awayScore || 0) + (prevMatch.homeScore || 0);
                                                subInfo = `(${aggH}-${aggA})`;
                                            }
                                        }
                                        
                                        return (
                                            <div key={f.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 transition">
                                                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTeamClick(opponentId)}>
                                                    <div className={`w-8 h-6 rounded flex items-center justify-center text-[10px] font-bold ${res.color}`}>
                                                        {res.label}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{opp?.name}</span>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{dateLabel}</span>
                                                    </div>
                                                </div>
                                                <div 
                                                    className="flex flex-col items-end cursor-pointer group"
                                                    onClick={() => onFixtureClick && onFixtureClick(f)}
                                                >
                                                    <div className="font-mono font-bold text-lg text-slate-700 dark:text-slate-200 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                                                        {f.homeScore} - {f.awayScore}
                                                    </div>
                                                    {subInfo && (
                                                         <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 -mt-1">
                                                            {subInfo}
                                                         </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Next Matches */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Gelecek Maçlar</h3>
                                <div className="space-y-2">
                                    {futureMatches.length === 0 && <div className="text-slate-500 text-sm italic">Sezon tamamlandı.</div>}
                                    {futureMatches.map(f => {
                                        const isHome = f.homeTeamId === myTeamId;
                                        const opponentId = isHome ? f.awayTeamId : f.homeTeamId;
                                        const opp = teams.find(t => t.id === opponentId);
                                        const dateLabel = getFormattedDate(f.date).label;
                                        const meta = getFixtureMeta(f); // USE HELPER
                                        
                                        return (
                                            <div key={f.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50 transition">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 text-center bg-white dark:bg-slate-800 rounded py-1 border border-slate-200 dark:border-slate-700">
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">{meta.label}</span>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">{meta.sub}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        {/* Clickable Opponent */}
                                                        <div 
                                                            className="flex items-center gap-2 cursor-pointer group"
                                                            onClick={() => onTeamClick(opponentId)}
                                                        >
                                                            {opp?.logo && <img src={opp.logo} className="w-4 h-4 object-contain group-hover:scale-110 transition-transform"/>}
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px] group-hover:text-yellow-500 transition-colors">{opp?.name}</span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{dateLabel}</span>
                                                    </div>
                                                </div>
                                                <div className={`text-xs font-bold px-2 py-1 rounded border ${isHome ? 'border-green-600/30 text-green-600 dark:text-green-400' : 'border-red-600/30 text-red-600 dark:text-red-400'}`}>
                                                    {isHome ? 'EV' : 'DEP'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Standings Table */}
                        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-4">{leagueName} Puan Durumu</h2>
                            <StandingsTable teams={leagueTeams} myTeamId={myTeamId} fixtures={fixtures} onTeamClick={onTeamClick} compact={window.innerWidth < 768} leagueName={leagueName}/>
                        </div>
                    </div>
                </div>
            )}
            
             {tab === 'PROFILE' && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative">
                     <div className="flex flex-col md:flex-row items-center gap-6 mb-8 text-center md:text-left">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center border-4 border-yellow-500 shrink-0 shadow-lg">
                            <User size={48} className="text-slate-400"/>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{manager.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{manager.nationality} • {manager.age} Yaşında</p>
                            <div className="flex flex-col items-center md:items-start mt-2">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Menajer Reytingi</span>
                                <div className="flex items-center gap-2">
                                    {renderTeamStars(currentManagerPower, 20, true)}
                                </div>
                            </div>
                        </div>
                        
                        {/* ACTION BUTTONS (RETIRE & HALL OF FAME) */}
                        <div className="md:ml-auto mt-4 md:mt-0 flex flex-col gap-2 w-full md:w-auto">
                            {!retireConfirm ? (
                                <button 
                                    onClick={() => setRetireConfirm(true)}
                                    className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-all w-full"
                                >
                                    <Power size={16}/> Emekli Ol
                                </button>
                            ) : (
                                <div className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 p-2 rounded-lg animate-in fade-in slide-in-from-right-2 w-full">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Emin misin?</span>
                                    <button onClick={onRetire} className="bg-green-500 hover:bg-green-600 text-white p-1 rounded"><Check size={16}/></button>
                                    <button onClick={() => setRetireConfirm(false)} className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"><X size={16}/></button>
                                </div>
                            )}
                            
                            <button 
                                onClick={() => setShowHallOfFame(true)}
                                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-yellow-900/20 w-full"
                            >
                                <Crown size={16}/> Onur Tablosu
                            </button>
                        </div>
                     </div>
                     
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Kariyer Özeti</h3>
                     
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                        
                        {/* ROW 1: Titles & Win Rate */}
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                                1 <Building2 size={16} className="text-slate-400"/>
                            </div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Kulüp</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border-2 border-yellow-500/20">
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1">
                                {manager.stats.leagueTitles} <Trophy size={16}/>
                            </div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Lig Şampiyonu</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border-2 border-blue-500/20">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                                {manager.stats.domesticCups} <Trophy size={16}/>
                            </div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Yerel Kupa</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border-2 border-purple-500/20">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1">
                                {manager.stats.europeanCups} <Trophy size={16}/>
                            </div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Avrupa Kupası</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border-2 border-green-500/20">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                                %{winPercentage} <BarChart3 size={16}/>
                            </div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Galibiyet %</div>
                        </div>

                        {/* ROW 2: Match Stats */}
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{manager.stats.wins}</div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Galibiyet</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-600 dark:text-slate-300">{manager.stats.draws}</div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Beraberlik</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{manager.stats.losses}</div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Mağlubiyet</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{manager.stats.goalsFor}</div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Atılan Gol</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{manager.stats.goalsAgainst}</div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Yenilen Gol</div>
                        </div>

                        {/* ROW 3: Transfers & Earnings */}
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                                {manager.stats.playersBought} <ArrowRightLeft size={14} className="rotate-45"/>
                            </div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Tr. Alınan</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-xl font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                                {manager.stats.playersSold} <ArrowRightLeft size={14} className="-rotate-45"/>
                            </div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Tr. Satılan</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-xl font-bold text-slate-900 dark:text-white">{manager.stats.recordTransferFee} M€</div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Rekor Tr.</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border-2 border-emerald-500/20">
                            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1">
                                <Wallet size={16}/> {manager.stats.careerEarnings.toFixed(1)} M€
                            </div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Menajer Kazancı</div>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg border-2 border-yellow-500/20">
                            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                                <Clock size={16}/> {formatTime(playTime)}
                            </div>
                            <div className="text-[9px] uppercase text-slate-500 dark:text-slate-400 mt-1 font-bold">Oynama Süresi</div>
                        </div>

                        {/* ROW 4: Financial Totals (Full Width Split) */}
                        <div className="col-span-full mt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex items-center justify-between border-l-4 border-l-red-500">
                                    <div className="text-left">
                                        <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Toplam Harcanan</div>
                                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{manager.stats.moneySpent.toFixed(1)} M€</div>
                                    </div>
                                    <TrendingDown size={32} className="text-red-200 dark:text-red-900"/>
                                </div>
                                <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex items-center justify-between border-l-4 border-l-green-500">
                                    <div className="text-left">
                                        <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Toplam Gelir</div>
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{manager.stats.moneyEarned.toFixed(1)} M€</div>
                                    </div>
                                    <TrendingUp size={32} className="text-green-200 dark:text-green-900"/>
                                </div>
                            </div>
                        </div>

                     </div>
                 </div>
            )}

            {tab === 'CONTRACT' && (
                <div className="flex justify-center items-center h-full p-4 flex-col gap-6">
                    <div className="bg-white text-slate-900 p-4 md:p-8 rounded shadow-2xl max-w-xl w-full relative border border-slate-200">
                        {/* Header */}
                        <div className="text-center border-b-2 border-slate-100 pb-4 mb-6 relative">
                            <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-800 tracking-wide uppercase">
                                Profesyonel Teknik Direktör<br/>Sözleşmesi
                            </h2>
                            <div className="absolute top-0 right-0 opacity-10">
                                <Feather size={48} className="text-slate-900" />
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4 font-serif text-base md:text-lg mb-12 px-2">
                            <div className="flex items-center justify-between border-b border-slate-200 py-3 border-dashed">
                                <span className="font-bold text-slate-700">Kulüp:</span>
                                <span className="text-slate-900 font-bold text-right">{manager.contract.teamName}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-200 py-3 border-dashed">
                                <span className="font-bold text-slate-700">Teknik Direktör:</span>
                                <span className="text-slate-900 font-bold text-right">{manager.name}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-200 py-3 border-dashed">
                                <span className="font-bold text-slate-700">Yıllık Ücret:</span>
                                <span className="font-bold text-green-700 font-mono text-xl">{manager.contract.salary} M€</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-200 py-3 border-dashed">
                                <span className="font-bold text-slate-700">Bitiş Tarihi:</span>
                                <span className="text-slate-900 font-bold">Haziran {manager.contract.expires}</span>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="flex justify-between items-end mt-12 px-2 md:px-6 relative pb-6">
                            {/* Club Sig */}
                            <div className="text-center relative z-10 w-24 md:w-32">
                                <div className="font-bold text-blue-900 text-sm md:text-lg mb-1 font-serif italic truncate">
                                    {manager.contract.teamName} Yk.
                                </div>
                                <div className="border-t border-slate-400 w-full mx-auto pt-1">
                                    <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">KULÜP BAŞKANI</p>
                                </div>
                            </div>
                            
                            {/* Stamp */}
                            <div className="absolute left-1/2 bottom-6 transform -translate-x-1/2 -rotate-12 opacity-90 z-0">
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-[3px] border-red-800 flex items-center justify-center p-1">
                                    <div className="w-full h-full rounded-full border border-red-800 flex items-center justify-center text-center">
                                        <div className="transform rotate-0">
                                            <span className="text-red-800 font-bold text-[8px] md:text-[10px] uppercase block mb-1">T.C. SPOR BAKANLIĞI</span>
                                            <span className="text-red-800 font-bold text-xs md:text-sm uppercase leading-tight block">RESMİ<br/>MÜHÜR</span>
                                            <span className="text-red-800 text-[8px] uppercase block mt-1">ONAYLANMIŞTIR</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Manager Sig */}
                            <div className="text-center relative z-10 w-24 md:w-32">
                                <div className="font-serif italic text-blue-900 text-base md:text-xl mb-1 signature-font truncate">
                                    {manager.name.toLowerCase()}
                                </div>
                                <div className="border-t border-slate-400 w-full mx-auto pt-1">
                                    <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">TEKNİK DİREKTÖR</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="w-full max-w-xl space-y-3">
                        {/* TERMINATE CONTRACT BUTTON */}
                        {!terminateConfirm ? (
                            <button 
                                onClick={() => setTerminateConfirm(true)}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all"
                            >
                                <LogOut size={20} /> Sözleşmeyi Tek Taraflı Feshet
                            </button>
                        ) : (
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border-2 border-red-500 text-center animate-in fade-in slide-in-from-bottom-4">
                                <p className="text-red-600 dark:text-red-400 font-bold text-lg mb-3">Bu işlem geri alınamaz! İstifa etmek istediğinize emin misiniz?</p>
                                <div className="flex gap-4 justify-center">
                                    <button 
                                        onClick={onTerminateContract}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold flex items-center gap-2"
                                    >
                                        <Check size={18} /> Evet, Feshet
                                    </button>
                                    <button 
                                        onClick={() => setTerminateConfirm(false)}
                                        className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white px-6 py-2 rounded font-bold flex items-center gap-2"
                                    >
                                        <X size={18} /> İptal
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* REQUEST RENEWAL BUTTON */}
                        <button 
                            onClick={handleRequestRenewal}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                            <FileSignature size={20} /> Sözleşme Yenileme Talebi
                        </button>
                    </div>

                </div>
            )}

            {tab === 'RELATIONS' && (
                 <div className="space-y-8 max-w-5xl mx-auto">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                             <TrendingUp className="text-blue-500" /> Genel Güven Seviyeleri
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                                        Yönetim Kurulu {manager.trust.board < 35 && <AlertTriangle size={14} className="text-red-500 animate-pulse"/>}
                                    </span>
                                    <span className={`font-black ${manager.trust.board < 35 ? 'text-red-500' : 'text-blue-500'}`}>{manager.trust.board}%</span>
                                </div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${manager.trust.board < 35 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500'}`} style={{width: `${manager.trust.board}%`}}/></div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                                        Taraftar Grubu {manager.trust.fans < 40 && <AlertTriangle size={14} className="text-red-500 animate-pulse"/>}
                                    </span>
                                    <span className={`font-black ${manager.trust.fans < 40 ? 'text-red-500' : 'text-green-500'}`}>{manager.trust.fans}%</span>
                                </div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${manager.trust.fans < 40 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-green-500'}`} style={{width: `${manager.trust.fans}%`}}/></div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1"><span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Oyuncu Grubu</span><span className="font-black text-yellow-500">{manager.trust.players}%</span></div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 transition-all duration-1000" style={{width: `${manager.trust.players}%`}}/></div>
                            </div>
                             <div>
                                <div className="flex justify-between mb-1"><span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Hakemler & Federasyon</span><span className="font-black text-red-500">{manager.trust.referees}%</span></div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-red-500 transition-all duration-1000" style={{width: `${manager.trust.referees}%`}}/></div>
                            </div>
                            <div>
                                <div className="flex justify-between mb-1"><span className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Basın & Medya</span><span className="font-black text-purple-500">{manager.trust.media || 50}%</span></div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-purple-500 transition-all duration-1000" style={{width: `${manager.trust.media || 50}%`}}/></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                             <Users className="text-yellow-500" /> Kurumsal İlişkiler & Personel Heyeti
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {manager.staffRelations && manager.staffRelations.map((staff: StaffRelation) => {
                                const status = getRelationStatus(staff.value);
                                return (
                                    <div key={staff.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-500/50 transition-all group">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-black shrink-0 shadow-inner ${staff.avatarColor}`}>
                                            {staff.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-black text-slate-900 dark:text-white truncate">{staff.name}</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tight mb-1">{staff.role}</div>
                                            <div className="flex items-center gap-1.5">
                                                <status.icon size={14} className={status.color} />
                                                <span className={`text-xs font-bold ${status.color}`}>{status.label}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-mono font-black text-slate-700 dark:text-slate-300">%{staff.value}</div>
                                            <div className="h-1 w-12 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                                                <div className={`h-full ${status.color.replace('text-', 'bg-')}`} style={{width: `${staff.value}%`}}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {(!manager.staffRelations || manager.staffRelations.length === 0) && (
                            <div className="text-center py-10 text-slate-500 italic">Personel verisi yüklenemedi.</div>
                        )}
                    </div>
                 </div>
            )}
        </div>
    );
};

export default HomeView;