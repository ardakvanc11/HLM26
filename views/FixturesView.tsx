
import React, { useRef, useEffect, useState } from 'react';
import { Fixture, Team } from '../types';
import { Trophy, Calendar, Info, Star, Shield, TrendingUp, Globe } from 'lucide-react';
import FixtureDetailPanel from '../components/shared/FixtureDetailPanel';

const FixturesView = ({ 
    fixtures, 
    teams, 
    myTeamId, 
    currentWeek, 
    onTeamClick, 
    onFixtureClick,
    onFixtureInfoClick,
    onCompetitionClick // NEW PROP
}: { 
    fixtures: Fixture[], 
    teams: Team[], 
    myTeamId: string, 
    currentWeek: number, 
    onTeamClick: (id: string) => void, 
    onFixtureClick: (f: Fixture) => void,
    onFixtureInfoClick: (f: Fixture) => void,
    onCompetitionClick: (compId: string) => void // Type definition
}) => {
    
    const myFixtures = fixtures
        .filter(f => f.homeTeamId === myTeamId || f.awayTeamId === myTeamId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedFixtureId && myFixtures.length > 0) {
            const currentMatch = myFixtures.find(f => f.week === currentWeek) || myFixtures.find(f => !f.played) || myFixtures[myFixtures.length - 1];
            if (currentMatch) {
                setSelectedFixtureId(currentMatch.id);
            }
        }
    }, [currentWeek, myFixtures, selectedFixtureId]);

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

        // Check Penalties
        if (myScore === oppScore && f.pkHome !== undefined && f.pkAway !== undefined) {
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
    }, []);

    const activeFixture = fixtures.find(f => f.id === selectedFixtureId);
    const activeHome = activeFixture ? teams.find(t => t.id === activeFixture.homeTeamId) : null;
    const activeAway = activeFixture ? teams.find(t => t.id === activeFixture.awayTeamId) : null;

    return (
        <div className="flex h-full bg-slate-900 overflow-hidden">
            <div className="flex-1 h-full overflow-y-auto custom-scrollbar p-2 md:p-6">
                <div className="max-w-5xl mx-auto space-y-8 pb-10">
                    {Object.entries(groupedFixtures).map(([monthLabel, matches], groupIndex) => (
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
                                    const isCurrentWeek = f.week === currentWeek;
                                    const isSelected = f.id === selectedFixtureId;
                                    const compDetails = getCompetitionDetails(f.competitionId);
                                    const CompIcon = compDetails.icon;

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
                                                        {f.pkHome !== undefined && (
                                                            <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                                                                (P: {f.pkHome}-{f.pkAway})
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
                    ))}
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
