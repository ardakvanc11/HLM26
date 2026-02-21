import React, { useMemo } from 'react';
import { Fixture, Team, PlayerPerformance } from '../../types';
import { X, Calendar, MapPin, Trophy, Users, History, Clock, Ticket, Star, Disc } from 'lucide-react';
import { getFormattedDate } from '../../utils/calendarAndFixtures';
import { RIVALRIES } from '../../constants';

interface FixtureDetailPanelProps {
    fixture: Fixture;
    homeTeam: Team;
    awayTeam: Team;
    allFixtures: Fixture[];
    onClose?: () => void;
    variant?: 'modal' | 'embedded'; // New Prop
    myTeamId?: string; // Added to identify user team
    onTeamClick?: (teamId: string) => void; // NEW: Callback for clicking teams
}

const FixtureDetailPanel: React.FC<FixtureDetailPanelProps> = ({ fixture, homeTeam, awayTeam, allFixtures, onClose, variant = 'modal', myTeamId, onTeamClick }) => {
    const dateInfo = getFormattedDate(fixture.date);
    const time = "20:00"; // Standart saat

    // Önceki Karşılaşmaları Bul (Head-to-Head)
    const history = allFixtures.filter(f => 
        f.played && 
        f.id !== fixture.id && // Kendisi hariç
        (
            (f.homeTeamId === homeTeam.id && f.awayTeamId === awayTeam.id) || 
            (f.homeTeamId === awayTeam.id && f.awayTeamId === homeTeam.id)
        )
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // En yeniden en eskiye

    const isModal = variant === 'modal';

    // Container Classes based on Variant
    const containerClass = isModal 
        ? "fixed inset-0 z-50 flex justify-end" 
        : "h-full w-full flex flex-col bg-slate-900 border-l border-slate-700";

    const panelClass = isModal
        ? "relative w-full max-w-md h-full bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        : "flex-1 flex flex-col w-full h-full bg-slate-900"; // No animation, full height

    // --- GOAL SCORERS LOGIC ---
    const homeGoals = fixture.matchEvents?.filter(e => e.type === 'GOAL' && e.teamName === homeTeam.name) || [];
    const awayGoals = fixture.matchEvents?.filter(e => e.type === 'GOAL' && e.teamName === awayTeam.name) || [];

    // --- ATTENDANCE LOGIC ---
    const attendance = useMemo(() => {
        if (!fixture.played) return null;

        const cap = homeTeam.stadiumCapacity;
        const hFans = homeTeam.fanBase;
        const aFans = awayTeam.fanBase;

        // Derby Check
        const isDerby = RIVALRIES.some(pair => 
            (pair.includes(homeTeam.name) && pair.includes(awayTeam.name))
        );

        let fillRate = 0.15; // Base low

        if (isDerby) {
            fillRate = 0.99;
        } else {
            // Home Fan Impact
            if (hFans > 15000000) fillRate = 0.90; // Big 3 level
            else if (hFans > 2000000) fillRate = 0.50; // Mid tier
            else if (hFans < 500000) fillRate = 0.10; // Low tier
            else fillRate = 0.30; // Average

            // Opponent Impact (Playing against popular teams boosts attendance)
            if (aFans > 15000000) fillRate += 0.25;
            else if (aFans > 5000000) fillRate += 0.15;
            
            // Random Fluctuation (Weather, Day, etc.) - +/- 5%
            fillRate += (Math.random() * 0.10 - 0.05);
        }

        // Clamp
        fillRate = Math.min(0.998, Math.max(0.02, fillRate));

        // Calculate exact number (Pseudo-realistic randomness)
        const seed = fixture.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const randomVariation = (seed % 1000) - 500; // -500 to +500
        
        let exactAttendance = Math.floor(cap * fillRate) + randomVariation;
        exactAttendance = Math.min(cap, Math.max(0, exactAttendance));

        return exactAttendance;
    }, [fixture.id, fixture.played, homeTeam, awayTeam]);

    // Determine if penalties should be shown
    const showPenalties = fixture.played && 
                          fixture.pkHome !== undefined && 
                          fixture.pkAway !== undefined;

    const renderRatings = (ratings: PlayerPerformance[], teamName: string, colors: [string, string]) => (
        <div className="mb-4">
            <div className={`text-xs font-bold uppercase mb-2 pb-1 border-b border-slate-700 flex justify-between ${colors[1] === 'text-black' ? 'text-slate-300' : colors[1].replace('text-', 'text-')}`}>
                <span className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${colors[0]}`}></div>
                    {teamName}
                </span>
                <span className="flex gap-3 text-slate-500">
                    <span>Puan</span>
                    <span>Gol</span>
                </span>
            </div>
            <div className="space-y-1">
                {ratings.sort((a, b) => b.rating - a.rating).map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-xs p-1.5 hover:bg-slate-800 rounded transition group">
                        <div className="flex items-center gap-2">
                            <span className={`font-bold w-4 text-right ${
                                ['GK'].includes(p.position) ? 'text-yellow-500' :
                                ['STP', 'SLB', 'SGB'].includes(p.position) ? 'text-blue-400' :
                                ['OS', 'OOS'].includes(p.position) ? 'text-green-400' : 'text-red-400'
                            }`}>{p.position}</span>
                            <span className="text-slate-300 font-medium truncate max-w-[120px]">{p.name}</span>
                            {fixture.stats?.mvpPlayerId === p.playerId && <Star size={10} className="text-yellow-400 fill-yellow-400"/>}
                        </div>
                        <div className="flex gap-4 font-mono text-center">
                            <span className={`font-bold w-6 ${p.rating >= 8.0 ? 'text-green-400' : p.rating >= 6.0 ? 'text-yellow-400' : 'text-red-400'}`}>{p.rating}</span>
                            {p.goals > 0 ? (
                                <span className="font-bold text-green-400 flex items-center gap-1">
                                    {p.goals} <Disc size={10} className="fill-green-400"/>
                                </span>
                            ) : <span className="text-slate-700 w-4">-</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className={isModal ? containerClass : "contents"}>
            {isModal && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            )}

            <div className={panelClass}>
                {isModal && onClose && (
                    <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-red-600 transition">
                        <X size={20} />
                    </button>
                )}

                <div className={`relative bg-gradient-to-br from-red-900 via-slate-900 to-black p-4 flex flex-col justify-center items-center text-center border-b-4 border-yellow-500 overflow-hidden shrink-0`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    
                    <div className="relative z-10 flex flex-col items-center mb-4 mt-4">
                        <span className="text-yellow-500 font-bold text-sm tracking-widest uppercase mb-1 flex items-center gap-1">
                            <Trophy size={14} /> Süper Toto Hayvanlar Ligi
                        </span>
                        <div className="text-slate-300 text-xs flex items-center gap-2">
                            <span className="flex items-center gap-1"><Calendar size={12}/> {dateInfo.label}</span>
                            <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                            <span className="flex items-center gap-1"><Clock size={12}/> {time}</span>
                        </div>
                    </div>

                    <div className="relative z-10 w-full flex items-start justify-between px-1">
                        <div 
                            className="flex flex-col items-center w-1/3 cursor-pointer hover:scale-105 transition-transform group"
                            onClick={() => onTeamClick && onTeamClick(homeTeam.id)}
                            title={`${homeTeam.name} profiline git`}
                        >
                            <img src={homeTeam.logo} className="w-16 h-16 object-contain drop-shadow-xl mb-2 group-hover:brightness-110" />
                            <span className="text-white font-bold text-sm md:text-base leading-tight truncate w-full mb-2 group-hover:text-yellow-400 transition-colors">{homeTeam.name}</span>
                            {fixture.played && (
                                <div className="flex flex-col gap-0.5 w-full items-center">
                                    {homeGoals.map((g, i) => (
                                        <div key={i} className="text-[10px] text-green-400 font-mono whitespace-nowrap">
                                            {g.scorer?.split(' ').pop()} {g.minute}'
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-center justify-start w-1/3 pt-4">
                            {fixture.played ? (
                                <>
                                    <span className="text-4xl font-mono font-black text-white tracking-widest bg-black/40 px-3 py-1 rounded border border-white/10 shadow-lg">
                                        {fixture.homeScore}-{fixture.awayScore}
                                    </span>
                                    {showPenalties && (
                                        <span className="text-xs text-slate-400 font-mono mt-2 bg-black/50 px-2 py-0.5 rounded">
                                            PEN: {fixture.pkHome}-{fixture.pkAway}
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span className="text-3xl font-black text-slate-500 italic">VS</span>
                            )}
                        </div>

                        <div 
                            className="flex flex-col items-center w-1/3 cursor-pointer hover:scale-105 transition-transform group"
                            onClick={() => onTeamClick && onTeamClick(awayTeam.id)}
                            title={`${awayTeam.name} profiline git`}
                        >
                            <img src={awayTeam.logo} className="w-16 h-16 object-contain drop-shadow-xl mb-2 group-hover:brightness-110" />
                            <span className="text-white font-bold text-sm md:text-base leading-tight truncate w-full mb-2 group-hover:text-yellow-400 transition-colors">{awayTeam.name}</span>
                            {fixture.played && (
                                <div className="flex flex-col gap-0.5 w-full items-center">
                                    {awayGoals.map((g, i) => (
                                        <div key={i} className="text-[10px] text-green-400 font-mono whitespace-nowrap">
                                            {g.scorer?.split(' ').pop()} {g.minute}'
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900">
                    <div className="p-6 border-b border-slate-800">
                        <div className="flex items-start gap-4">
                            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                <MapPin size={24} className="text-red-500" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Stadyum Bilgileri</h4>
                                <div className="text-white font-bold text-lg">{homeTeam.stadiumName}</div>
                                <div className="flex flex-col gap-1 mt-2">
                                    <div className="text-slate-500 text-xs flex items-center gap-2">
                                        <Users size={14} className="text-slate-400"/> 
                                        <span>Kapasite: <span className="text-slate-300 font-mono">{homeTeam.stadiumCapacity.toLocaleString()}</span></span>
                                    </div>
                                    {fixture.played && attendance && (
                                        <div className="text-slate-500 text-xs flex items-center gap-2">
                                            <Ticket size={14} className="text-green-500"/> 
                                            <span>Biletli Seyirci: <span className="text-green-400 font-mono font-bold">{attendance.toLocaleString()}</span></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {fixture.played && fixture.stats && (
                        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Users size={16} className="text-yellow-500"/> Maç Performansları
                            </h4>
                            
                            {fixture.stats.homeRatings && fixture.stats.homeRatings.length > 0 && homeTeam.id === myTeamId &&
                                renderRatings(fixture.stats.homeRatings, homeTeam.name, homeTeam.colors)
                            }
                            
                            {fixture.stats.awayRatings && fixture.stats.awayRatings.length > 0 && awayTeam.id === myTeamId &&
                                renderRatings(fixture.stats.awayRatings, awayTeam.name, awayTeam.colors)
                            }

                            {(!myTeamId || (homeTeam.id !== myTeamId && awayTeam.id !== myTeamId)) && (
                                <div className="text-slate-500 italic text-xs">
                                    Sadece kendi takımınızın detaylı performans verilerini görebilirsiniz.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-6">
                        <h4 className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-4 flex items-center gap-2">
                            <History size={16} /> Önceki Karşılaşmalar
                        </h4>

                        <div className="space-y-3">
                            {history.length === 0 ? (
                                <div className="text-slate-600 italic text-center py-4 bg-slate-800/50 rounded-lg">
                                    İki takım arasında kayıtlı maç bulunamadı.
                                </div>
                            ) : (
                                history.map(h => {
                                    const wasContextHome = h.homeTeamId === homeTeam.id;
                                    const contextScore = wasContextHome ? h.homeScore! : h.awayScore!;
                                    const opponentScore = wasContextHome ? h.awayScore! : h.homeScore!;
                                    
                                    let resultBadge = "bg-slate-700 text-slate-300";
                                    let resultText = "B";
                                    
                                    if (contextScore > opponentScore) {
                                        resultBadge = "bg-green-600 text-white";
                                        resultText = "G";
                                    } else if (contextScore < opponentScore) {
                                        resultBadge = "bg-red-600 text-white";
                                        resultText = "M";
                                    }

                                    return (
                                        <div key={h.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700/50">
                                            <div className="text-xs text-slate-500 w-16">
                                                {getFormattedDate(h.date).label.split(' ').slice(1).join(' ')}
                                            </div>
                                            <div className="flex-1 flex items-center justify-center gap-3">
                                                <span className={`text-sm font-bold ${h.homeTeamId === homeTeam.id ? 'text-white' : 'text-slate-400'}`}>
                                                    {h.homeTeamId === homeTeam.id ? homeTeam.name : awayTeam.name}
                                                </span>
                                                <span className="bg-black/50 text-white font-mono font-bold px-2 py-1 rounded text-sm border border-slate-600">
                                                    {h.homeScore}-{h.awayScore}
                                                    {h.pkHome !== undefined && (
                                                        <span className="text-[9px] text-slate-400 ml-1">(P)</span>
                                                    )}
                                                </span>
                                                <span className={`text-sm font-bold ${h.awayTeamId === awayTeam.id ? 'text-white' : 'text-slate-400'}`}>
                                                    {h.awayTeamId === awayTeam.id ? awayTeam.name : homeTeam.name}
                                                </span>
                                            </div>
                                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ml-2 ${resultBadge}`}>
                                                {resultText}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default FixtureDetailPanel;