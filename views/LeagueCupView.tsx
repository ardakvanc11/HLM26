
import React, { useMemo, useState, useEffect } from 'react';
import { Team, Fixture, Player, CompetitionViewState } from '../types';
import { Trophy, Globe, Shield, Star, Calendar, Eye, TrendingUp, BarChart, Clock, Swords, List, X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getFormattedDate } from '../utils/calendarAndFixtures';
import CompetitionDetailModal from '../modals/CompetitionDetailModal';

interface LeagueCupViewProps {
    teams: Team[];
    fixtures: Fixture[];
    myTeamId: string;
    currentWeek: number;
    currentDate: string;
    onTeamClick: (id: string) => void;
    onFixtureClick: (f: Fixture) => void;
    myTeam: Team;
    onPlayerClick: (p: Player) => void; 
    initialCompetitionId?: string | null; 
    savedState?: CompetitionViewState | null; // SAVED STATE
    onSaveState?: (state: CompetitionViewState) => void; // SAVE HANDLER
}

const COMPETITIONS = [
    { 
        id: 'LEAGUE', 
        name: 'TÜRKİYE HAYVANLAR LİGİ', 
        icon: Trophy, 
        headerColor: 'bg-[#d11515]', 
        start: new Date(2025, 7, 8),
        shortName: 'Hayvanlar Ligi'
    },
    { 
        id: 'LEAGUE_1', 
        name: 'HAYVANLAR 1. LİGİ', 
        icon: TrendingUp, 
        headerColor: 'bg-[#ea580c]', 
        start: new Date(2025, 7, 15),
        shortName: '1. Lig'
    },
    { 
        id: 'PLAYOFF', 
        name: '1. LİG PLAY-OFF', 
        icon: Swords, 
        headerColor: 'bg-[#7c3aed]', 
        start: new Date(2026, 4, 25), 
        shortName: 'Play-Off'
    },
    { 
        id: 'CUP', 
        name: 'HAYVANLAR KUPASI', 
        icon: Shield, 
        headerColor: 'bg-[#15803d]', // Green-700 for readability
        start: new Date(2025, 9, 20),
        shortName: 'Hayvanlar Kupası'
    },
    { 
        id: 'SUPER_CUP', 
        name: 'HAYVANLAR SÜPER KUPASI', 
        icon: Star, 
        headerColor: 'bg-[#ca8a04]', // Yellow-700 (Gold) for readability with white text
        start: new Date(2026, 0, 5),
        shortName: 'Süper Kupa'
    },
    { 
        id: 'EUROPE', 
        name: 'AVRUPA HAYVANLAR LİGİ', 
        icon: Globe, 
        headerColor: 'bg-[#1e3a8a]',
        start: new Date(2025, 8, 15),
        shortName: 'Avrupa Ligi'
    }
];

const LeagueCupView: React.FC<LeagueCupViewProps> = ({ teams, fixtures, myTeamId, currentWeek, currentDate, myTeam, onTeamClick, onPlayerClick, initialCompetitionId, savedState, onSaveState }) => {
    // Initialize State from Props or Default
    const [selectedCompId, setSelectedCompId] = useState<string | null>(initialCompetitionId || savedState?.selectedCompId || null);
    const [showOtherCompetitions, setShowOtherCompetitions] = useState(false);
    
    // Update global state when local selection changes
    useEffect(() => {
        if (onSaveState) {
            onSaveState({
                selectedCompId,
                activeTab: savedState?.activeTab || 'OVERVIEW' // Preserve existing tab or default
            });
        }
    }, [selectedCompId]); // Only trigger when ID changes here. Tab updates handled via callback.

    const handleTabChange = (tab: string) => {
        if (onSaveState) {
            onSaveState({
                selectedCompId,
                activeTab: tab
            });
        }
    };

    // Auto-open specific competition if passed via props (from player stats click) - this overrides saved state temporarily
    useEffect(() => {
        if (initialCompetitionId) {
            setSelectedCompId(initialCompetitionId);
        }
    }, [initialCompetitionId]);

    const getDaysRemaining = (targetDate: Date) => {
        const today = new Date(currentDate);
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getBoardExpectation = (compId: string, strength: number) => {
        if (compId === 'LEAGUE') {
            return strength >= 80 ? 'Şampiyonluk' : strength >= 75 ? 'Avrupa Kupaları' : 'Ligde Kalmak';
        } else if (compId === 'CUP') {
            return strength >= 75 ? 'Final' : 'Çeyrek Final';
        } else if (compId === 'EUROPE') {
            return strength >= 80 ? 'Yarı Final' : 'Gruplar';
        } else if (compId === 'LEAGUE_1') {
            return 'Üst Sıralar';
        } else if (compId === 'PLAYOFF') {
            return 'Süper Lig';
        } else {
            return strength >= 80 ? 'Kupayı Kazanmak' : 'Final';
        }
    };

    // Helper to check if user participates in this competition
    const isUserParticipating = (compId: string) => {
        if (compId === 'LEAGUE') {
            return myTeam.leagueId === 'LEAGUE' || !myTeam.leagueId;
        }
        if (compId === 'LEAGUE_1') {
            return myTeam.leagueId === 'LEAGUE_1';
        }
        if (compId === 'CUP') {
            return true; // Assume all teams play cup
        }
        
        if (compId === 'EUROPE') {
             // 1. Check existing fixtures
             const hasFixtures = fixtures.some(f => 
                 f.competitionId === 'EUROPE' && 
                 (f.homeTeamId === myTeamId || f.awayTeamId === myTeamId)
             );
             if (hasFixtures) return true;

             // 2. Check predefined list for Season 1 (before fixtures are generated)
             // These 5 teams are hardcoded to participate in the first season
             const predefinedEuroTeams = ['Ayıboğanspor SK', 'Arıspor', 'Kedispor', 'Eşşekboğanspor FK', 'Köpekspor'];
             if (predefinedEuroTeams.includes(myTeam.name)) return true;

             return false;
        }

        // For Super Cup and Playoff, check if there are any fixtures involving myTeam
        return fixtures.some(f => 
            (f.competitionId === compId || (compId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL')) && 
            (f.homeTeamId === myTeamId || f.awayTeamId === myTeamId)
        );
    };

    const getPerformancePercentage = (compId: string) => {
        // Calculate performance 0-100 based on current standing vs expectation
        if (compId === 'LEAGUE' || compId === 'LEAGUE_1') {
            // Get league specific rank
            const leagueTeams = teams.filter(t => 
                compId === 'LEAGUE' ? (t.leagueId === 'LEAGUE' || !t.leagueId) : t.leagueId === 'LEAGUE_1'
            ).sort((a, b) => b.stats.points - a.stats.points);
            
            const myRank = leagueTeams.findIndex(t => t.id === myTeamId) + 1;
            const total = leagueTeams.length || 18;
            
            // Simple logic: Rank 1 = 100%, Last Rank = 0%
            const score = Math.max(0, Math.min(100, ((total - myRank + 1) / total) * 100));
            return Math.round(score);
        }
        return 50; 
    };

    const getPerformanceColor = (pct: number) => {
        if (pct >= 80) return 'bg-green-500';
        if (pct >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    // Separate competitions into "My Competitions" and "Others"
    const myCompetitions = useMemo(() => COMPETITIONS.filter(c => isUserParticipating(c.id)), [myTeamId, fixtures, myTeam.leagueId, myTeam.name]);
    const otherCompetitions = useMemo(() => COMPETITIONS.filter(c => !isUserParticipating(c.id)), [myTeamId, fixtures, myTeam.leagueId, myTeam.name]);

    const selectedComp = COMPETITIONS.find(c => c.id === selectedCompId);

    // If a competition is selected, render it embedded within this view container
    if (selectedComp) {
        return (
            <CompetitionDetailModal 
                competitionId={selectedComp.id}
                competitionName={selectedComp.name}
                teams={teams}
                fixtures={fixtures}
                currentWeek={currentWeek}
                currentDate={currentDate} // Added Prop
                onClose={() => setSelectedCompId(null)}
                onTeamClick={onTeamClick}
                onPlayerClick={onPlayerClick}
                variant="embedded"
                initialTab={savedState?.activeTab || 'OVERVIEW'} // Pass saved tab
                onTabChange={handleTabChange} // Handle tab change to save state
                myTeamId={myTeamId} // Pass myTeamId
            />
        );
    }

    return (
        <div className="h-full bg-[#1a1f26] p-4 flex flex-col overflow-hidden relative">
            
            {/* OTHER COMPETITIONS MODAL */}
            {showOtherCompetitions && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowOtherCompetitions(false)}>
                    <div className="bg-slate-800 w-full max-w-lg rounded-xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Globe className="text-blue-500"/> Diğer Organizasyonlar
                                </h3>
                                <p className="text-slate-400 text-xs mt-1">Takımınızın yer almadığı diğer turnuvaları inceleyin.</p>
                            </div>
                            <button onClick={() => setShowOtherCompetitions(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                            {otherCompetitions.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 italic">Görüntülenecek başka turnuva yok.</div>
                            ) : (
                                otherCompetitions.map(comp => (
                                    <button 
                                        key={comp.id}
                                        onClick={() => { setSelectedCompId(comp.id); setShowOtherCompetitions(false); }}
                                        className="w-full flex items-center gap-4 bg-slate-700 hover:bg-slate-600 p-4 rounded-xl border border-slate-600 hover:border-slate-500 transition group text-left"
                                    >
                                        <div className={`p-3 rounded-full ${comp.headerColor} text-white shadow-lg`}>
                                            <comp.icon size={24}/>
                                        </div>
                                        <div>
                                            <div className="text-base font-bold text-white group-hover:text-yellow-400 transition-colors">{comp.name}</div>
                                            <div className="text-xs text-slate-400">Detayları Görüntüle</div>
                                        </div>
                                        <ChevronRight size={20} className="ml-auto text-slate-500 group-hover:text-white"/>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center pb-4">
                <div className="flex flex-row gap-4 h-full min-h-[500px] px-2">
                    {myCompetitions.map((comp) => {
                        const daysLeft = getDaysRemaining(comp.start);
                        const hasStarted = daysLeft <= 0;
                        const expectation = getBoardExpectation(comp.id, myTeam.strength);
                        const formattedDate = getFormattedDate(comp.start.toISOString()).label;
                        const performancePct = getPerformancePercentage(comp.id);

                        // --- FIX: DYNAMIC FIXTURE LOGIC FOR CUPS ---
                        let displayFixtures: Fixture[] = [];
                        
                        if (comp.id !== 'LEAGUE' && comp.id !== 'LEAGUE_1') {
                            const compFixtures = fixtures
                                .filter(f => f.competitionId === comp.id || (comp.id === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL'))
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                            
                            // Show recent results first, then upcoming
                            const played = compFixtures.filter(f => f.played).reverse(); // Newest first
                            const upcoming = compFixtures.filter(f => !f.played);

                            if (upcoming.length > 0) {
                                displayFixtures = upcoming.slice(0, 3);
                            } else if (played.length > 0) {
                                displayFixtures = played.slice(0, 3);
                            }
                        } else {
                            // League Preview: Show Recent or Next Match
                            const leagueFilter = comp.id === 'LEAGUE' ? 'LEAGUE' : 'LEAGUE_1';
                            const leagueFixtures = fixtures.filter(f => (f.competitionId === leagueFilter || !f.competitionId) && (f.homeTeamId === myTeamId || f.awayTeamId === myTeamId));
                             // Show last played and next upcoming
                            const played = leagueFixtures.filter(f => f.played).reverse();
                            const upcoming = leagueFixtures.filter(f => !f.played);
                             if (upcoming.length > 0) displayFixtures = [...played.slice(0,1), ...upcoming.slice(0, 2)];
                             else displayFixtures = played.slice(0,3);
                        }

                        // Determine league teams for mini table
                        const leagueFilter = comp.id === 'LEAGUE' ? 'LEAGUE' : comp.id === 'LEAGUE_1' ? 'LEAGUE_1' : null;
                        const leagueTeams = leagueFilter ? teams.filter(t => t.leagueId === leagueFilter).sort((a,b) => b.stats.points - a.stats.points) : [];

                        // --- SPECIAL EUROPE LOGIC (Status Box vs Fixtures) ---
                        let europeStatusNode = null;
                        let europeTableNode = null;
                        let europeRankNode = null;

                        if (comp.id === 'EUROPE') {
                            const euroFixtures = fixtures.filter(f => f.competitionId === 'EUROPE');
                            const myEuroFixtures = euroFixtures
                                .filter(f => f.homeTeamId === myTeamId || f.awayTeamId === myTeamId)
                                .sort((a, b) => a.week - b.week); // SORTING FIX: Ensure chronological order by week

                            const nextMatch = myEuroFixtures.find(f => !f.played);
                            const lastMatch = [...myEuroFixtures].filter(f => f.played).sort((a,b) => b.week - a.week)[0];
                            
                            // --- EUROPE LEAGUE TABLE CALCULATIONS ---
                            const leaguePhaseFixtures = fixtures.filter(f => f.competitionId === 'EUROPE' && f.week >= 201 && f.week <= 208 && f.played);
                            const statsMap = new Map<string, { id: string, name: string, points: number, gf: number, ga: number }>();
                            
                            // Find participating teams
                            const euroTeamsList = teams.filter(t => {
                                return fixtures.some(f => f.competitionId === 'EUROPE' && (f.homeTeamId === t.id || f.awayTeamId === t.id));
                            });

                            euroTeamsList.forEach(t => {
                                statsMap.set(t.id, { id: t.id, name: t.name, points: 0, gf: 0, ga: 0 });
                            });

                            leaguePhaseFixtures.forEach(f => {
                                const h = statsMap.get(f.homeTeamId);
                                const a = statsMap.get(f.awayTeamId);
                                if (h && a) {
                                    if (f.homeScore! > f.awayScore!) { h.points += 3; }
                                    else if (f.homeScore! < f.awayScore!) { a.points += 3; }
                                    else { h.points += 1; a.points += 1; }
                                    h.gf += f.homeScore!; h.ga += f.awayScore!;
                                    a.gf += f.awayScore!; a.ga += f.homeScore!;
                                }
                            });

                            const euroSorted = Array.from(statsMap.values()).sort((a, b) => {
                                if (b.points !== a.points) return b.points - a.points;
                                return (b.gf - b.ga) - (a.gf - a.ga);
                            });

                            // --- MODIFIED: HIDE TABLE IF KNOCKOUT PHASE (Week > 208) ---
                            if (euroSorted.length > 0 && currentWeek <= 208) {
                                const myRank = euroSorted.findIndex(t => t.id === myTeamId) + 1;
                                if (myRank > 0) {
                                    europeRankNode = (
                                        <div className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center mb-4">
                                            <span className="text-xs text-slate-400">Sıralamanız</span>
                                            <span className="text-xl font-black text-white">{myRank}.</span>
                                        </div>
                                    );
                                }
                                europeTableNode = (
                                    <div className="mb-4">
                                        <div className="text-xs font-bold text-slate-500 uppercase mb-2">Liderlik Tablosu</div>
                                        {euroSorted.slice(0, 5).map((t, i) => (
                                            <div key={t.id} className={`flex justify-between text-xs py-1 ${t.id === myTeamId ? 'text-yellow-400 font-bold' : 'text-slate-400'}`}>
                                                <span className="truncate max-w-[180px]">{i+1}. {t.name}</span>
                                                <span>{t.points}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            }

                            // 1. Next Match (Draw Done)
                            if (nextMatch) {
                                 const opponentId = nextMatch.homeTeamId === myTeamId ? nextMatch.awayTeamId : nextMatch.homeTeamId;
                                 const opponent = teams.find(t => t.id === opponentId);
                                 
                                 europeStatusNode = (
                                     <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 mb-3 flex flex-col items-center">
                                         <div className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2">Sıradaki Rakip</div>
                                         <div className="flex items-center justify-between w-full">
                                              <div className="flex flex-col items-center w-1/3">
                                                  {myTeam.logo ? <img src={myTeam.logo} className="w-8 h-8 object-contain"/> : <div className={`w-8 h-8 rounded-full ${myTeam.colors[0]}`}></div>}
                                                  <span className="text-[10px] font-bold text-white mt-1 truncate w-full text-center">{myTeam.name}</span>
                                              </div>
                                              <div className="text-xl font-black text-slate-500">VS</div>
                                              <div className="flex flex-col items-center w-1/3">
                                                  {opponent?.logo ? <img src={opponent.logo} className="w-8 h-8 object-contain"/> : <div className={`w-8 h-8 rounded-full ${opponent ? opponent.colors[0] : 'bg-gray-500'}`}></div>}
                                                  <span className="text-[10px] font-bold text-white mt-1 truncate w-full text-center">{opponent?.name}</span>
                                              </div>
                                         </div>
                                         <div className="mt-2 text-[9px] text-slate-400">
                                            {getFormattedDate(nextMatch.date).label}
                                         </div>
                                     </div>
                                 );
                            } 
                            // 2. Status Logic (Eliminated or Waiting)
                            else {
                                let statusText = "";
                                let statusColor = "";
                                let nextDateText = "";
                                
                                if (currentWeek > 208) {
                                    // KNOCKOUT PHASE - Check if eliminated or waiting
                                    if (lastMatch && lastMatch.week <= 208) {
                                        // Just finished league, waiting for draw or elim
                                        statusText = "Play-Off Kurası Bekleniyor";
                                        statusColor = "text-yellow-500";
                                    } else {
                                        // Specific Round Text
                                        if (currentWeek >= 209 && currentWeek <= 210) statusText = "Play-Off Turu";
                                        else if (currentWeek >= 211 && currentWeek <= 212) statusText = "Son 16 Turu";
                                        else if (currentWeek >= 213 && currentWeek <= 214) statusText = "Çeyrek Final";
                                        else if (currentWeek >= 215 && currentWeek <= 216) statusText = "Yarı Final";
                                        else if (currentWeek === 217) statusText = "Avrupa Ligi Finali";
                                        else statusText = "Avrupa Macerası Sona Erdi";
                                        
                                        statusColor = statusText.includes('Sona') ? "text-red-500" : "text-blue-400";
                                    }
                                } else {
                                    statusText = "Lig Aşaması Devam Ediyor";
                                    statusColor = "text-blue-400";
                                }

                                if (currentWeek === 209 && !nextMatch) {
                                     // Placeholder logic for qualification simulation
                                     if (myTeam.strength > 80) {
                                         statusText = "Son 16 Turuna Kalındı";
                                         statusColor = "text-green-500";
                                         nextDateText = "Kura Tarihi: Bekleniyor";
                                     } else {
                                         statusText = "Play-Off Turuna Kalındı";
                                         statusColor = "text-green-500";
                                         nextDateText = "Maç Tarihi: 19 Şubat 2026";
                                     }
                                }

                                // Initial Status before any matches
                                if (!lastMatch && !nextMatch) {
                                     statusText = "Grup Kuraları Bekleniyor";
                                     statusColor = "text-slate-400";
                                }
                                
                                europeStatusNode = (
                                    <div className={`bg-slate-800 p-4 rounded-lg border border-slate-700 mb-3 flex flex-col items-center justify-center text-center`}>
                                        {statusColor.includes('red') ? <AlertCircle size={24} className="text-red-500 mb-2"/> : <CheckCircle2 size={24} className="text-green-500 mb-2"/>}
                                        <div className={`text-lg font-black uppercase tracking-wide ${statusColor}`}>
                                            {statusText}
                                        </div>
                                        {nextDateText && (
                                            <div className="text-xs text-slate-400 mt-1 font-bold">
                                                {nextDateText}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        }

                        return (
                            <div 
                                key={comp.id} 
                                onClick={() => setSelectedCompId(comp.id)}
                                className="flex flex-col bg-[#1e242b] rounded-lg overflow-hidden border border-slate-700 shadow-xl h-full w-[260px] md:w-[300px] shrink-0 transition hover:border-[#ff9f43] snap-center cursor-pointer group"
                            >
                                {/* Header */}
                                <div className={`${comp.headerColor} p-4 flex items-center gap-3 border-b border-black/20 shrink-0 h-16 md:h-20`}>
                                    <div className="bg-white/20 p-1.5 md:p-2 rounded-full backdrop-blur-sm">
                                        <comp.icon size={20} className="text-white md:w-6 md:h-6" />
                                    </div>
                                    <h3 className="font-black text-white text-base md:text-lg leading-tight uppercase tracking-wide truncate">
                                        {comp.name}
                                    </h3>
                                </div>

                                {/* Body */}
                                <div className="p-4 md:p-5 flex-1 flex flex-col text-slate-300">
                                    <div className="mb-6">
                                        <div className="flex justify-between items-end mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                            <span>Yönetim Beklentisi</span>
                                            <span className="text-white normal-case text-xs md:text-sm font-bold truncate max-w-[120px]" title={expectation}>
                                                {expectation}
                                            </span>
                                        </div>
                                        
                                        {/* Performance Bar */}
                                        {hasStarted && (
                                            <div className="relative pt-1">
                                                <div className="flex mb-1 items-center justify-between">
                                                    <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                                        <BarChart size={10} /> Performans
                                                    </div>
                                                    <div className={`text-[10px] font-bold ${performancePct >= 80 ? 'text-green-500' : performancePct >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                                        %{performancePct}
                                                    </div>
                                                </div>
                                                <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-slate-700">
                                                    <div style={{ width: `${performancePct}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getPerformanceColor(performancePct)} transition-all duration-500`}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex-1 flex flex-col">
                                        {!hasStarted ? (
                                            <div className="text-sm text-slate-400 mt-2">
                                                Bu organizasyon <span className="text-white font-bold">{formattedDate}</span> tarihinde başlayacak 
                                                <span className="text-yellow-500 font-bold ml-1">({daysLeft} gün kaldı)</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {(comp.id === 'LEAGUE' || comp.id === 'LEAGUE_1') ? (
                                                    <div className="space-y-2">
                                                        <div className="bg-slate-800 p-3 rounded border border-slate-700 flex justify-between items-center">
                                                            <span className="text-xs text-slate-400">Sıralamanız</span>
                                                            <span className="text-xl font-black text-white">
                                                                {leagueTeams.findIndex(t => t.id === myTeamId) + 1}.
                                                            </span>
                                                        </div>
                                                        {/* Mini Table Snippet */}
                                                        <div className="mt-4">
                                                            <div className="text-xs font-bold text-slate-500 uppercase mb-2">Liderlik Tablosu</div>
                                                            {leagueTeams.slice(0, 5).map((t, i) => (
                                                                <div key={t.id} className={`flex justify-between text-xs py-1 ${t.id === myTeamId ? 'text-yellow-400 font-bold' : 'text-slate-400'}`}>
                                                                    <span className="truncate max-w-[180px]">{i+1}. {t.name}</span>
                                                                    <span>{t.stats.points}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-slate-400">
                                                        {/* EUROPE SPECIFIC: RANK & TABLE BEFORE STATUS */}
                                                        {comp.id === 'EUROPE' && (
                                                            <>
                                                                {europeRankNode}
                                                                {europeTableNode}
                                                            </>
                                                        )}
                                                        
                                                        {europeStatusNode}

                                                        {/* HIDE RESULTS FOR EUROPE DURING LEAGUE PHASE (WEEKS 201-208) */}
                                                        {(comp.id !== 'EUROPE' || currentWeek > 208) && (
                                                            <>
                                                                <div className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-700 pb-1">Sonuçlar & Fikstür</div>
                                                                
                                                                {displayFixtures.length > 0 ? (
                                                                    <div className="space-y-2 font-mono text-xs">
                                                                        {displayFixtures.map(f => {
                                                                            const h = teams.find(t => t.id === f.homeTeamId);
                                                                            const a = teams.find(t => t.id === f.awayTeamId);
                                                                            const isUserMatch = f.homeTeamId === myTeamId || f.awayTeamId === myTeamId;

                                                                            // Stage Logic
                                                                            let stage = '';
                                                                            if (f.week === 91 || f.competitionId === 'PLAYOFF_FINAL') stage = 'Final';
                                                                            else if (f.week === 90 || f.competitionId === 'PLAYOFF') stage = 'Yarı Final';
                                                                            // FIX: Specific round names for Europe in card
                                                                            else if (comp.id === 'EUROPE') {
                                                                                if (f.week <= 208) stage = `${f.week - 200}. Hafta`;
                                                                                else if (f.week <= 210) stage = 'Play-Off';
                                                                                else if (f.week <= 212) stage = 'Son 16';
                                                                                else if (f.week <= 214) stage = 'Çeyrek Final';
                                                                                else if (f.week <= 216) stage = 'Yarı Final';
                                                                                else stage = 'Final';
                                                                            }

                                                                            // Penalty Display Condition
                                                                            const showPK = f.played && f.pkHome !== undefined && f.pkAway !== undefined && f.homeScore === f.awayScore && ['CUP', 'SUPER_CUP', 'PLAYOFF', 'PLAYOFF_FINAL', 'EUROPE'].includes(f.competitionId || '');

                                                                            return (
                                                                                <div key={f.id} className={`flex flex-col gap-1 p-2 rounded ${isUserMatch ? 'bg-slate-800 border border-slate-600' : 'bg-slate-800/30'}`}>
                                                                                    {stage && <div className="text-[9px] text-yellow-500 font-bold uppercase mb-0.5">{stage}</div>}
                                                                                    <div className="flex justify-between items-center">
                                                                                        <span className={`truncate w-24 text-right ${h?.id === myTeamId ? 'text-white font-bold' : 'text-slate-400'}`}>{h?.name.split(' ')[0]}</span>
                                                                                        <div className="flex flex-col items-center">
                                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.played ? 'bg-slate-700 text-white' : 'bg-slate-700/50 text-slate-500'}`}>
                                                                                                {f.played ? `${f.homeScore}-${f.awayScore}` : 'VS'}
                                                                                            </span>
                                                                                            {showPK && <span className="text-[8px] text-yellow-500 font-bold mt-0.5">P: {f.pkHome}-{f.pkAway}</span>}
                                                                                        </div>
                                                                                        <span className={`truncate w-24 text-left ${a?.id === myTeamId ? 'text-white font-bold' : 'text-slate-400'}`}>{a?.name.split(' ')[0]}</span>
                                                                                    </div>
                                                                                    {!f.played && (
                                                                                        <div className="flex items-center justify-center gap-1 text-[9px] text-slate-600 mt-0.5">
                                                                                            <Clock size={8}/> {getFormattedDate(f.date).label}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    !europeStatusNode && <div className="text-center italic opacity-50 py-4">Fikstür veya sonuç bekleniyor...</div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Info / Action */}
                                    <div className="mt-6 pt-4 border-t border-slate-800">
                                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 text-center">Aktif Turnuva</div>
                                        <button 
                                            // The button is still here as a visual CTA but the click logic bubbles up from parent div
                                            className="w-full bg-slate-800 group-hover:bg-slate-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition shadow-sm border border-slate-700 group-hover:border-slate-500"
                                        >
                                            <Eye size={16} className="text-blue-400"/>
                                            Detayları Gör
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* OTHER LEAGUES CARD (ALWAYS AT THE END) */}
                    <div className="flex flex-col bg-[#161a1f] rounded-lg overflow-hidden border border-slate-800 shadow-xl h-full w-[260px] md:w-[300px] shrink-0 transition hover:border-slate-600 snap-center group cursor-pointer" onClick={() => setShowOtherCompetitions(true)}>
                        <div className="bg-slate-800 p-4 flex items-center gap-3 border-b border-black/20 shrink-0 h-16 md:h-20 group-hover:bg-slate-700 transition-colors">
                            <div className="bg-slate-600 p-1.5 md:p-2 rounded-full">
                                <List size={20} className="text-slate-300 md:w-6 md:h-6" />
                            </div>
                            <h3 className="font-black text-slate-300 text-base md:text-lg leading-tight uppercase tracking-wide truncate group-hover:text-white">
                                Diğer Ligler
                            </h3>
                        </div>
                        <div className="p-4 md:p-5 flex-1 flex flex-col items-center justify-center text-center">
                            <Globe size={64} className="text-slate-700 mb-4 group-hover:text-blue-500 transition-colors duration-500 group-hover:scale-110 transform"/>
                            <p className="text-slate-400 text-sm mb-4">Takımınızın yer almadığı diğer organizasyonları ve puan durumlarını incelemek için tıklayın.</p>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full group-hover:text-white group-hover:bg-slate-700 transition-colors">
                                {otherCompetitions.length} Turnuva Mevcut
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeagueCupView;
