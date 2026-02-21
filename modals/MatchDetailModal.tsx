import React, { useState } from 'react';
import { Fixture, Team, MatchEvent } from '../types';
import { X, Star, Users, BarChart2, Disc, Syringe, MonitorPlay, RefreshCw } from 'lucide-react';

const MatchDetailModal = ({ fixture, teams, onClose, allFixtures }: { fixture: Fixture, teams: Team[], onClose: () => void, allFixtures?: Fixture[] }) => {
    const [statsTab, setStatsTab] = useState<'STATS' | 'RATINGS'>('STATS');

    const home = teams.find(t => t.id === fixture.homeTeamId);
    const away = teams.find(t => t.id === fixture.awayTeamId);

    if (!home || !away || !fixture.stats || !fixture.matchEvents) return null;

    const stats = fixture.stats;
    const events = fixture.matchEvents;

    // Calculate Half Time Score
    const halfTimeHomeScore = events.filter(e => e.type === 'GOAL' && e.teamName === home.name && e.minute <= 45).length;
    const halfTimeAwayScore = events.filter(e => e.type === 'GOAL' && e.teamName === away.name && e.minute <= 45).length;

    // Filter events for timeline
    const timelineEvents = events.filter(e => 
        e.type === 'GOAL' || 
        e.type === 'CARD_YELLOW' || 
        e.type === 'CARD_RED' || 
        e.type === 'INJURY' || 
        e.type === 'SUBSTITUTION' ||
        e.type === 'VAR' || 
        e.type === 'MISS'
    ).sort((a,b) => a.minute - b.minute);

    // --- AGGREGATE SCORE CALCULATION ---
    let aggregateInfo = null;
    // Check if it is a 2nd leg match in Europe (Weeks 210, 212, 214, 216)
    if (allFixtures && fixture.competitionId === 'EUROPE' && [210, 212, 214, 216].includes(fixture.week)) {
        const prevWeek = fixture.week - 1;
        // Find the first leg where Home/Away were swapped
        const prevMatch = allFixtures.find(f => 
            f.competitionId === 'EUROPE' &&
            f.week === prevWeek &&
            f.homeTeamId === fixture.awayTeamId &&
            f.awayTeamId === fixture.homeTeamId &&
            f.played
        );

        if (prevMatch) {
            // Current Home Team (e.g. A) Score = Current Match Home Score (A) + Prev Match Away Score (A)
            const aggHome = (fixture.homeScore || 0) + (prevMatch.awayScore || 0);
            // Current Away Team (e.g. B) Score = Current Match Away Score (B) + Prev Match Home Score (B)
            const aggAway = (fixture.awayScore || 0) + (prevMatch.homeScore || 0);
            
            aggregateInfo = `${aggHome}-${aggAway}`;
        }
    }

    // --- PENALTY LOGIC ---
    const pkHome = fixture.pkHome !== undefined ? fixture.pkHome : stats?.pkHome;
    const pkAway = fixture.pkAway !== undefined ? fixture.pkAway : stats?.pkAway;
    // Show PK if values exist AND matches ended in a draw OR it's a cup final/knockout requiring a winner
    // Ideally check if pkHome/pkAway are defined and valid numbers
    const showPK = pkHome !== undefined && pkAway !== undefined;
    
    let penaltyWinnerName = "";
    if (showPK) {
        if ((pkHome || 0) > (pkAway || 0)) penaltyWinnerName = home.name;
        else penaltyWinnerName = away.name;
    }

    const getEventIcon = (type: MatchEvent['type']) => {
        switch(type) {
            case 'GOAL': return <Disc size={14} className="text-white fill-white"/>;
            case 'CARD_YELLOW': return <div className="w-2.5 h-3.5 bg-yellow-500 rounded-sm border border-yellow-600 shadow-sm"></div>;
            case 'CARD_RED': return <div className="w-2.5 h-3.5 bg-red-600 rounded-sm border border-red-700 shadow-sm"></div>;
            case 'INJURY': return <Syringe size={14} className="text-red-400"/>;
            case 'VAR': return <MonitorPlay size={14} className="text-purple-400"/>;
            case 'SUBSTITUTION': return <RefreshCw size={14} className="text-green-400"/>;
            default: return null;
        }
    };

    const getPlayerName = (event: MatchEvent) => {
        if (event.scorer) return event.scorer;
        if (event.playerId) {
            const player = home.players.find(p => p.id === event.playerId) || away.players.find(p => p.id === event.playerId);
            if (player) return player.name;
        }
        return null;
    };

    const getPosBadgeColor = (pos: string) => {
        if (pos === 'GK') return 'bg-yellow-600';
        if (['SLB', 'STP', 'SGB'].includes(pos)) return 'bg-blue-600';
        if (['OS', 'OOS'].includes(pos)) return 'bg-green-600';
        return 'bg-red-600';
    };

    const renderPlayerRatings = (ratings: any[], teamName: string, teamColors: [string, string]) => (
        <div className="mb-4 last:mb-0">
            <div className="text-xs font-bold text-slate-400 uppercase mb-2 border-b border-slate-700 pb-1 flex justify-between">
                <span className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${teamColors[0]}`}></div>
                    {teamName}
                </span>
                <span className="flex gap-3 text-[10px]"><span>Puan</span><span>Gol</span><span>Asist</span></span>
            </div>
            <div className="space-y-1">
                {ratings.sort((a:any, b:any) => b.rating - a.rating).map((p:any, i:number) => {
                    const goalCount = events.filter(e => e.type === 'GOAL' && e.scorer === p.name).length;
                    const assistCount = events.filter(e => e.type === 'GOAL' && e.assist === p.name).length;
                    
                    return (
                        <div key={i} className="flex justify-between items-center text-xs p-1 hover:bg-slate-700/50 rounded transition">
                             <div className="flex items-center gap-2">
                                 <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white ${getPosBadgeColor(p.position)}`}>
                                     {p.position}
                                 </div>
                                 <span className="text-slate-200 font-medium truncate max-w-[100px]">{p.name}</span>
                                 {stats.mvpPlayerName === p.name && <Star size={10} className="text-yellow-400 fill-yellow-400"/>}
                             </div>
                             <div className="flex gap-3 font-mono text-center">
                                 <span className={`font-bold w-8 ${p.rating >= 8.0 ? 'text-green-400' : p.rating >= 6.0 ? 'text-yellow-400' : 'text-red-400'}`}>{p.rating}</span>
                                 <span className={`w-6 ${goalCount > 0 ? 'text-green-400 font-bold' : 'text-slate-600'}`}>{goalCount > 0 ? goalCount : '-'}</span>
                                 <span className={`w-6 ${assistCount > 0 ? 'text-blue-400 font-bold' : 'text-slate-600'}`}>{assistCount > 0 ? assistCount : '-'}</span>
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
             <div 
                className="relative w-full max-w-3xl bg-slate-900 rounded-xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
             >
                 {/* Close Button Top Right (Inside) */}
                 <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-slate-400 hover:text-white bg-slate-800 hover:bg-red-600 rounded-full p-1.5 transition z-50 border border-slate-600"
                 >
                    <X size={20} />
                 </button>

                 {/* Compact Header */}
                 <div className="p-4 border-b border-slate-800 bg-slate-950/50 rounded-t-xl shrink-0">
                     <div className="flex items-center justify-center gap-8 md:gap-12 relative">
                         <div className="flex flex-col items-center w-24">
                            <img src={home.logo} className="w-12 h-12 object-contain mb-1 drop-shadow-md"/>
                            <span className="text-xs font-bold text-slate-300 truncate w-full text-center">{home.name}</span>
                         </div>
                         
                         <div className="flex flex-col items-center">
                            <span className="text-3xl md:text-4xl font-mono font-black text-white tracking-widest">{fixture.homeScore} - {fixture.awayScore}</span>
                            
                            {/* AGGREGATE SCORE DISPLAY */}
                            {aggregateInfo && (
                                <div className="mt-1 animate-in fade-in slide-in-from-top-1">
                                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                        TOPLAM: {aggregateInfo}
                                    </span>
                                </div>
                            )}

                            {/* Penalty Score Display */}
                            {showPK && (
                                <div className="flex flex-col items-center bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-lg animate-in zoom-in mt-2 mb-1">
                                    <span className="text-sm md:text-base text-yellow-500 font-bold tracking-tight">
                                        (PEN: {pkHome}-{pkAway})
                                    </span>
                                    <span className="text-[9px] text-yellow-600 font-bold uppercase mt-0.5 tracking-wide text-center">
                                        {penaltyWinnerName} penaltılarla tur atladı
                                    </span>
                                </div>
                            )}

                            <span className="text-[10px] text-slate-500 font-bold bg-slate-900 px-2 py-0.5 rounded mt-2 border border-slate-800 uppercase tracking-wider">İY: {halfTimeHomeScore}-{halfTimeAwayScore}</span>
                         </div>
                         
                         <div className="flex flex-col items-center w-24">
                            <img src={away.logo} className="w-12 h-12 object-contain mb-1 drop-shadow-md"/>
                            <span className="text-xs font-bold text-slate-300 truncate w-full text-center">{away.name}</span>
                         </div>
                     </div>
                 </div>
                 
                 {/* Content Area */}
                 <div className="flex-1 overflow-hidden p-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                         
                         {/* LEFT COLUMN: MATCH FLOW TIMELINE */}
                         <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 flex flex-col h-[350px] md:h-[400px] overflow-hidden shadow-inner">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest p-2 border-b border-slate-700/50 text-center bg-slate-800">
                                Maç Akışı
                            </h3>
                            <div className="flex-1 overflow-y-auto relative px-3 py-3 custom-scrollbar">
                                 <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700/50 -translate-x-1/2"></div>
                                 
                                 {timelineEvents.length === 0 && (
                                     <div className="text-center text-slate-500 text-xs mt-10 italic">Önemli bir olay yaşanmadı.</div>
                                 )}

                                 {timelineEvents.map((e, i) => {
                                     const isHome = e.teamName === home.name;
                                     const isGoal = e.type === 'GOAL';
                                     const playerName = getPlayerName(e);
                                     
                                     return (
                                         <div key={i} className="flex items-center justify-between mb-2 relative w-full group hover:bg-white/5 rounded-lg transition-colors py-0.5">
                                             <div className="flex-1 pr-4 flex justify-end">
                                                 {isHome ? (
                                                     <div className="flex flex-col items-end text-right">
                                                         <div className="flex items-center gap-1.5 justify-end">
                                                            {playerName && <span className={`text-xs font-bold truncate max-w-[80px] ${isGoal ? 'text-green-400' : 'text-slate-300'}`}>{playerName}</span>}
                                                            {getEventIcon(e.type)}
                                                         </div>
                                                         {isGoal && e.assist && (
                                                             <span className="text-[9px] text-slate-500">Asist: {e.assist}</span>
                                                         )}
                                                     </div>
                                                 ) : <div className="w-full h-1"></div>}
                                             </div>

                                             <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center text-[10px] font-bold text-slate-300 z-10 shrink-0 shadow group-hover:border-slate-300 group-hover:text-white transition-colors">
                                                 {e.minute}'
                                             </div>

                                             <div className="flex-1 pl-4 flex justify-start">
                                                 {!isHome ? (
                                                     <div className="flex flex-col items-start text-left">
                                                         <div className="flex items-center gap-1.5">
                                                            {getEventIcon(e.type)}
                                                            {playerName && <span className={`text-xs font-bold truncate max-w-[80px] ${isGoal ? 'text-green-400' : 'text-slate-300'}`}>{playerName}</span>}
                                                         </div>
                                                         {isGoal && e.assist && (
                                                             <span className="text-[9px] text-slate-500">Asist: {e.assist}</span>
                                                         )}
                                                     </div>
                                                 ) : <div className="w-full h-1"></div>}
                                             </div>
                                         </div>
                                     );
                                 })}
                            </div>
                         </div>

                         {/* RIGHT COLUMN: STATS OR RATINGS */}
                         <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 flex flex-col h-[350px] md:h-[400px] overflow-hidden shadow-inner">
                            <div className="flex border-b border-slate-700/50 shrink-0">
                                 <button 
                                    onClick={() => setStatsTab('STATS')}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition ${statsTab === 'STATS' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                 >
                                     <BarChart2 size={12}/> İstatistik
                                 </button>
                                 <button 
                                    onClick={() => setStatsTab('RATINGS')}
                                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition ${statsTab === 'RATINGS' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                 >
                                     <Users size={12}/> Kadro
                                 </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {statsTab === 'STATS' ? (
                                    <div className="space-y-4 text-xs">
                                         <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`font-bold ${stats.homePossession > stats.awayPossession ? 'text-white' : 'text-slate-400'}`}>%{stats.homePossession}</span>
                                                <span className="text-slate-500 uppercase text-[9px]">Topla Oynama</span>
                                                <span className={`font-bold ${stats.awayPossession > stats.homePossession ? 'text-white' : 'text-slate-400'}`}>%{stats.awayPossession}</span>
                                            </div>
                                            <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-900">
                                                <div className="bg-blue-500 h-full" style={{width: `${stats.homePossession}%`}}></div>
                                                <div className="bg-red-500 h-full" style={{width: `${stats.awayPossession}%`}}></div>
                                            </div>
                                        </div>

                                        {[
                                            { label: 'Şut', h: stats.homeShots, a: stats.awayShots },
                                            { label: 'İsabetli Şut', h: stats.homeShotsOnTarget, a: stats.awayShotsOnTarget },
                                            { label: 'Korner', h: stats.homeCorners, a: stats.awayCorners },
                                            { label: 'Faul', h: stats.homeFouls, a: stats.awayFouls },
                                        ].map((s, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-700/30 last:border-0">
                                                <span className={`font-bold ${s.h > s.a ? 'text-green-400' : 'text-slate-300'}`}>{s.h}</span>
                                                <span className="text-slate-500 uppercase text-[9px]">{s.label}</span>
                                                <span className={`font-bold ${s.a > s.h ? 'text-green-400' : 'text-slate-300'}`}>{s.a}</span>
                                            </div>
                                        ))}

                                         <div className="flex justify-between items-center py-1.5">
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-3 bg-yellow-500 rounded-[1px]"></div>
                                                <span className="font-bold text-white">{stats.homeYellowCards}</span>
                                                <div className="w-2 h-3 bg-red-600 rounded-[1px]"></div>
                                                <span className="font-bold text-white">{stats.homeRedCards}</span>
                                            </div>
                                            <span className="text-slate-500 uppercase text-[9px]">Kartlar</span>
                                            <div className="flex items-center gap-1">
                                                <span className="font-bold text-white">{stats.awayYellowCards}</span>
                                                <div className="w-2 h-3 bg-yellow-500 rounded-[1px]"></div>
                                                <span className="font-bold text-white">{stats.awayRedCards}</span>
                                                <div className="w-2 h-3 bg-red-600 rounded-[1px]"></div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-700/50 text-center">
                                            <div className="text-slate-500 uppercase text-[9px] mb-1">Maçın Adamı</div>
                                            <div className="flex items-center justify-center gap-1.5 text-yellow-400 font-bold text-base">
                                                <Star size={14} className="fill-yellow-400"/>
                                                {stats.mvpPlayerName}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {renderPlayerRatings(stats.homeRatings, home.name, home.colors)}
                                        {renderPlayerRatings(stats.awayRatings, away.name, away.colors)}
                                    </div>
                                )}
                            </div>
                         </div>

                     </div>
                 </div>
             </div>
        </div>
    );
};

export default MatchDetailModal;