
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Fixture, Team, HolidayConfig, HolidayType } from '../types';
import { Trophy, Calendar, Info, Star, Shield, TrendingUp, Globe, ChevronLeft, ChevronRight, Plane } from 'lucide-react';
import FixtureDetailPanel from '../components/shared/FixtureDetailPanel';
import HolidayModal from '../modals/HolidayModal';

const FixturesView = ({ 
    fixtures, 
    teams, 
    myTeamId, 
    currentWeek, 
    onTeamClick, 
    onFixtureClick,
    onFixtureInfoClick,
    onCompetitionClick,
    currentDate,
    onGoOnHoliday // Added Prop
}: { 
    fixtures: Fixture[], 
    teams: Team[], 
    myTeamId: string, 
    currentWeek: number, 
    onTeamClick: (id: string) => void, 
    onFixtureClick: (f: Fixture) => void,
    onFixtureInfoClick: (f: Fixture) => void,
    onCompetitionClick: (compId: string) => void,
    currentDate: string,
    onGoOnHoliday?: (config: HolidayConfig) => void;
}) => {
    
    // --- SEASON YEAR LOGIC ---
    const currentSeasonStartYear = useMemo(() => {
        const d = new Date(currentDate);
        return d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    }, [currentDate]);

    // State to track which season we are viewing
    const [displaySeasonYear, setDisplaySeasonYear] = useState(currentSeasonStartYear);
    const [showHolidayModal, setShowHolidayModal] = useState(false);

    // Reset to current season if currentDate changes significantly (e.g. new game load)
    useEffect(() => {
        setDisplaySeasonYear(currentSeasonStartYear);
    }, [currentSeasonStartYear]);

    const myFixtures = useMemo(() => {
        return fixtures
            .filter(f => {
                // Team Filter
                const isMyMatch = f.homeTeamId === myTeamId || f.awayTeamId === myTeamId;
                if (!isMyMatch) return false;

                // Season Filter
                const d = new Date(f.date);
                const fSeason = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
                return fSeason === displaySeasonYear;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [fixtures, myTeamId, displaySeasonYear]);

    const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);

    // Auto-select current match only if viewing the CURRENT season
    useEffect(() => {
        if (!selectedFixtureId && myFixtures.length > 0 && displaySeasonYear === currentSeasonStartYear) {
            const currentMatch = myFixtures.find(f => f.week === currentWeek) || myFixtures.find(f => !f.played) || myFixtures[myFixtures.length - 1];
            if (currentMatch) {
                setSelectedFixtureId(currentMatch.id);
            }
        }
    }, [currentWeek, myFixtures, selectedFixtureId, displaySeasonYear, currentSeasonStartYear]);

    const groupedFixtures: Record<string, Fixture[]> = {};
    
    myFixtures.forEach(f => {
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

    const getResultStatus = (f: Fixture, isHome: boolean) => {
        if (!f.played || f.homeScore === null || f.awayScore === null) return null;
        
        let myScore = isHome ? f.homeScore : f.awayScore;
        let oppScore = isHome ? f.awayScore : f.homeScore;

        // Check Penalties - Only for relevant competitions
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

    const getCompetitionDetails = (compId?: string) => {
        switch (compId) {
            case 'SUPER_CUP': return { name: 'Süper Kupa', icon: Star, color: 'text-yellow-500' };
            case 'CUP': return { name: 'Türkiye Kupası', icon: Shield, color: 'text-red-500' };
            case 'LEAGUE_1': return { name: '1. Lig', icon: TrendingUp, color: 'text-orange-500' };
            case 'EUROPE': return { name: 'Avrupa', icon: Globe, color: 'text-blue-500' };
            default: return { name: 'Lig', icon: Trophy, color: 'text-slate-600' };
        }
    };

    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [displaySeasonYear]); 

    const activeFixture = fixtures.find(f => f.id === selectedFixtureId);
    const activeHome = activeFixture ? teams.find(t => t.id === activeFixture.homeTeamId) : null;
    const activeAway = activeFixture ? teams.find(t => t.id === activeFixture.awayTeamId) : null;

    // Season Navigation Handlers
    const canGoBack = displaySeasonYear > 2025; 
    const canGoForward = displaySeasonYear < currentSeasonStartYear;

    const seasonLabel = `${displaySeasonYear}/${(displaySeasonYear + 1).toString().slice(2)}`;

    // Calculate Next Match Date for Holiday Modal
    const nextMatch = fixtures
        .filter(f => (f.homeTeamId === myTeamId || f.awayTeamId === myTeamId) && !f.played)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    const handleHolidayConfirm = (config: HolidayConfig) => {
        setShowHolidayModal(false);
        if(onGoOnHoliday) onGoOnHoliday(config);
    };

    return (
        <div className="flex h-full bg-slate-900 overflow-hidden relative">
            <HolidayModal 
                isOpen={showHolidayModal} 
                onClose={() => setShowHolidayModal(false)}
                onConfirm={handleHolidayConfirm}
                currentDate={currentDate}
                nextMatchDate={nextMatch?.date}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                
                {/* FIXED HEADER AREA */}
                <div className="w-full px-4 md:px-6 py-4 flex justify-between items-center bg-slate-900 border-b border-slate-800 shrink-0 z-30 shadow-sm">
                    
                    {/* LEFT: HOLIDAY BUTTON */}
                    <button 
                        onClick={() => setShowHolidayModal(true)}
                        className="bg-[#1C2739] hover:bg-[#232f42] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-bold text-sm transition-all border border-[#2a364d]"
                    >
                        <Plane size={18} />
                        <span className="hidden sm:inline">Tatile Çık</span>
                    </button>

                    {/* RIGHT: SEASON NAV */}
                    <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-lg shadow-xl flex items-center p-1 gap-1">
                        <button 
                            onClick={() => canGoBack && setDisplaySeasonYear(prev => prev - 1)}
                            disabled={!canGoBack}
                            className={`p-1.5 rounded-md transition ${canGoBack ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-700 cursor-not-allowed'}`}
                        >
                            <ChevronLeft size={16}/>
                        </button>

                        <div className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white font-mono px-2 select-none shadow-black drop-shadow-sm">
                            {seasonLabel}
                        </div>

                        <button 
                            onClick={() => canGoForward && setDisplaySeasonYear(prev => prev + 1)}
                            disabled={!canGoForward}
                            className={`p-1.5 rounded-md transition ${canGoForward ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-700 cursor-not-allowed'}`}
                        >
                            <ChevronRight size={16}/>
                        </button>
                    </div>
                </div>

                {/* SCROLLABLE FIXTURE LIST */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-6 pt-2">
                    <div className="w-full space-y-6 pb-10">
                        {Object.keys(groupedFixtures).length === 0 ? (
                             <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                                 <Calendar size={48} className="mx-auto text-slate-600 mb-4"/>
                                 <p className="text-slate-400 font-bold">Bu sezona ait fikstür kaydı bulunamadı.</p>
                             </div>
                        ) : (
                            Object.entries(groupedFixtures).map(([monthLabel, matches], groupIndex) => (
                                <div key={groupIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
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
                                            const isHome = f.homeTeamId === myTeamId;
                                            const opponentId = isHome ? f.awayTeamId : f.homeTeamId;
                                            const opponent = teams.find(t => t.id === opponentId);
                                            const resultStatus = getResultStatus(f, isHome);
                                            // Only highlight current week if viewing CURRENT season
                                            const isCurrentWeek = f.week === currentWeek && displaySeasonYear === currentSeasonStartYear;
                                            const isSelected = f.id === selectedFixtureId;
                                            const compDetails = getCompetitionDetails(f.competitionId);
                                            const CompIcon = compDetails.icon;
                                            
                                            // Calculate Sub Info (Penalties or Aggregate)
                                            let subInfoText = "";

                                            // 1. Penalties check
                                            const showPK = f.played && f.pkHome !== undefined && f.pkAway !== undefined;

                                            if (showPK) {
                                                subInfoText = `P(${f.pkHome}-${f.pkAway})`;
                                            } 
                                            // 2. Aggregate check (Only for 2nd Legs in Europe)
                                            else if (f.competitionId === 'EUROPE' && [210, 212, 214, 216].includes(f.week) && f.played) {
                                                // Previous leg is week - 1. Home was Away, Away was Home.
                                                const prevWeek = f.week - 1;
                                                const prevFixture = fixtures.find(pf => 
                                                    pf.competitionId === 'EUROPE' &&
                                                    pf.week === prevWeek &&
                                                    pf.homeTeamId === f.awayTeamId &&
                                                    pf.awayTeamId === f.homeTeamId &&
                                                    pf.played
                                                );

                                                if (prevFixture) {
                                                    const aggHome = (f.homeScore || 0) + (prevFixture.awayScore || 0);
                                                    const aggAway = (f.awayScore || 0) + (prevFixture.homeScore || 0);
                                                    subInfoText = `(${aggHome}-${aggAway})`;
                                                }
                                            }

                                            let scorersText = "";
                                            if (f.played && f.matchEvents) {
                                                const goals = f.matchEvents.filter(e => e.type === 'GOAL');
                                                scorersText = goals.map(g => `${g.scorer?.split(' ').pop()} ${g.minute}'`).join(', ');
                                                if (scorersText.length > 40) scorersText = scorersText.substring(0, 37) + "...";
                                            }

                                            return (
                                                <div 
                                                    key={f.id}
                                                    ref={isCurrentWeek ? scrollRef : null}
                                                    onClick={() => {
                                                        setSelectedFixtureId(f.id);
                                                        if (window.innerWidth < 1024) { 
                                                            onFixtureInfoClick(f);
                                                        }
                                                    }}
                                                    className={`
                                                        grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center 
                                                        p-4 rounded-lg border transition-all duration-200
                                                        cursor-pointer
                                                        ${isSelected 
                                                            ? 'bg-slate-800 border-yellow-500 ring-1 ring-yellow-500/50 shadow-lg' 
                                                            : isCurrentWeek 
                                                                ? 'bg-slate-800/60 border-slate-700 ring-1 ring-blue-500/30' 
                                                                : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                                                        }
                                                    `}
                                                >
                                                    <div className={`col-span-3 text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                                        {getFullDate(f.date)}
                                                    </div>
                                                    <div className="col-span-1 text-sm font-mono text-slate-400">20:00</div>
                                                    
                                                    {/* Competition Name - CLICKABLE */}
                                                    <div 
                                                        className="col-span-2 flex items-center gap-2 text-slate-400 text-sm cursor-pointer group/comp hover:bg-white/5 p-1 rounded -ml-1 transition-colors"
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            onCompetitionClick(f.competitionId || 'LEAGUE'); 
                                                        }}
                                                        title="Turnuva detaylarını görüntüle"
                                                    >
                                                        <CompIcon size={14} className={compDetails.color} />
                                                        <span className={`truncate font-bold group-hover/comp:text-white group-hover/comp:underline transition-colors ${isSelected ? 'text-white' : ''}`}>
                                                            {compDetails.name}
                                                        </span>
                                                    </div>

                                                    <div 
                                                        className="col-span-2 flex items-center gap-3 cursor-pointer group hover:bg-white/5 p-1 rounded -ml-1 transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); if(opponent) onTeamClick(opponent.id); }}
                                                        title="Takım profiline git"
                                                    >
                                                        {opponent?.logo ? (<img src={opponent.logo} className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" alt={opponent.name} />) : (<div className={`w-8 h-8 rounded-full ${opponent?.colors[0]}`}></div>)}
                                                        <span className={`font-bold truncate group-hover:underline ${isSelected ? 'text-yellow-400' : 'text-slate-200'}`}>{opponent?.name}</span>
                                                    </div>
                                                    <div className="col-span-1 text-sm text-slate-500">{isHome ? 'İç Saha' : 'Deplasman'}</div>
                                                    <div 
                                                        className="col-span-1 flex justify-center cursor-pointer hover:scale-105 transition-transform"
                                                        onClick={(e) => { e.stopPropagation(); if(f.played) onFixtureClick(f); }}
                                                        title={f.played ? "Maç istatistiklerini görüntüle" : ""}
                                                    >
                                                        {f.played ? (
                                                            <div className={`flex flex-col items-center justify-center`}>
                                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold text-sm shadow-sm ${resultStatus?.color}`}>
                                                                    {f.homeScore} - {f.awayScore}
                                                                </div>
                                                                {subInfoText && (
                                                                    <span className="text-[9px] font-mono text-slate-400 mt-1 font-bold">
                                                                        {subInfoText}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (<span className="text-slate-600 font-mono">- : -</span>)}
                                                    </div>
                                                    <div className="col-span-2 flex justify-between items-center">
                                                        <div className="text-xs text-slate-500 truncate max-w-[100px]" title={scorersText}>{scorersText}</div>
                                                        <Info size={16} className={`lg:hidden ${isSelected ? 'text-yellow-500' : 'text-slate-600'}`}/>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="hidden lg:block w-[320px] xl:w-[380px] shrink-0 border-l border-slate-700 bg-slate-900 shadow-2xl relative z-10">
                {activeFixture && activeHome && activeAway ? (
                    <FixtureDetailPanel 
                        fixture={activeFixture}
                        homeTeam={activeHome}
                        awayTeam={activeAway}
                        allFixtures={fixtures}
                        variant="embedded"
                        myTeamId={myTeamId}
                        onTeamClick={onTeamClick}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-4">
                        <Trophy size={48} className="opacity-20"/>
                        <p>Detayları görmek için bir maç seçin.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default FixturesView;
