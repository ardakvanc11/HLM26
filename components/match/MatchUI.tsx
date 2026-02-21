
import React, { useRef, useEffect, useState } from 'react';
import { Team, MatchEvent, MatchStats } from '../../types';
import { Timer, MonitorPlay, Target, Lock, AlertOctagon, Megaphone, Settings, PlayCircle, Syringe, Disc, AlertCircle, RefreshCw, XCircle, Swords, Users, Siren, Flag } from 'lucide-react';
import PitchVisual from '../shared/PitchVisual';
import TacticsView from '../../views/TacticsView';

export const MatchScoreboard = ({ homeTeam, awayTeam, homeScore, awayScore, minute, homeRedCards, awayRedCards, homeSubsUsed, awaySubsUsed, addedTime, speed }: { homeTeam: Team, awayTeam: Team, homeScore: number, awayScore: number, minute: number, homeRedCards: number, awayRedCards: number, homeSubsUsed: number, awaySubsUsed: number, addedTime: number, speed?: number }) => {
    
    // --- SECOND INTERPOLATION LOGIC ---
    // Smoothly interpolates 0-59 seconds between minute updates
    const [seconds, setSeconds] = useState(0);
    const lastMinuteRef = useRef(minute);

    useEffect(() => {
        let animationFrameId: number;
        let startTimestamp: number | null = null;
        
        // At 1x speed, 1 game minute = 1000ms real time.
        // At 2x speed, 1 game minute = 500ms real time.
        const duration = 1000 / Math.max(1, speed || 1);

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = timestamp - startTimestamp;
            
            // Calculate current second (0-59) based on elapsed time vs total minute duration
            // Clamp at 59 so it doesn't overflow before the minute updates
            const currentSec = Math.min(59, Math.floor((progress / duration) * 60));
            setSeconds(currentSec);

            if (progress < duration) {
                animationFrameId = window.requestAnimationFrame(step);
            } else {
                // Keep it at 59 until parent updates the minute
                setSeconds(59);
            }
        };

        // Reset animation when minute changes
        if (minute !== lastMinuteRef.current) {
            lastMinuteRef.current = minute;
            setSeconds(0); // Reset to :00
            startTimestamp = null; 
            animationFrameId = window.requestAnimationFrame(step);
        } else {
            // If component remounts but minute hasn't changed, continue if needed (or just start fresh from 0 for simplicity)
            animationFrameId = window.requestAnimationFrame(step);
        }

        return () => {
            if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
        };
    }, [minute, speed]);

    // Format Logic: MM:SS
    const formattedMinute = minute.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    const displayTime = `${formattedMinute}:${formattedSeconds}`;

    return (
        <div className="bg-[#1b1e26]/95 backdrop-blur-md text-white p-3 md:p-4 rounded-2xl shadow-xl flex items-center justify-between shrink-0 h-24 md:h-28 border border-slate-700/50">
            <div className="flex items-center gap-3 w-1/3 pl-2">
                <img src={homeTeam.logo} className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-lg" />
                <div className="flex flex-col min-w-0">
                    <span className="text-sm md:text-xl font-black truncate block uppercase tracking-tight">{homeTeam.name}</span>
                    {homeRedCards > 0 && (<div className="flex gap-1 mt-1">{[...Array(homeRedCards)].map((_, i) => <div key={i} className="w-2 h-3 bg-red-600 rounded-[1px] border border-white/50 shadow-md" title="Kırmızı Kart" />)}</div>)}
                </div>
            </div>

            <div className="flex flex-col items-center justify-center w-1/3 relative">
                <div className="flex items-center gap-4">
                    <div className="text-4xl md:text-6xl font-mono font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{homeScore}</div>
                    <div className="text-xl md:text-2xl font-bold text-slate-500">-</div>
                    <div className="text-4xl md:text-6xl font-mono font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{awayScore}</div>
                </div>
                
                <div className="bg-black/40 px-3 py-0.5 rounded-full border border-white/10 flex items-center gap-2 mt-1">
                    <Timer size={12} className="text-red-500 animate-pulse"/>
                    <span className="text-xs md:text-sm font-mono font-bold text-slate-200 tabular-nums">{displayTime}</span>
                    {addedTime > 0 && (
                        <span className="text-[10px] text-yellow-500 font-bold">+{addedTime}</span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 w-1/3 justify-end pr-2">
                <div className="flex flex-col items-end min-w-0">
                    <span className="text-sm md:text-xl font-black truncate block text-right uppercase tracking-tight">{awayTeam.name}</span>
                    {awayRedCards > 0 && (<div className="flex gap-1 mt-1">{[...Array(awayRedCards)].map((_, i) => <div key={i} className="w-2 h-3 bg-red-600 rounded-[1px] border border-white/50 shadow-md" title="Kırmızı Kart" />)}</div>)}
                </div>
                <img src={awayTeam.logo} className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-lg" />
            </div>
        </div>
    );
};

export const MatchOverlays = ({ isVarActive, varMessage, isPenaltyActive, penaltyMessage, activePenaltyTeam, isTacticsOpen, forcedSubstitutionPlayerId, myTeamCurrent, handleTacticsUpdate, userIsHome, homeSubsUsed, awaySubsUsed, handleUserSubstitution, minute, onCloseTactics, redCardedPlayerIds, tacticsInitialTab }: any) => (
    <>
        {isTacticsOpen && (
            <div className="absolute inset-0 z-[100] bg-slate-900 flex flex-col">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl md:text-2xl font-bold text-white">Canlı Taktik</h2>
                        {forcedSubstitutionPlayerId && (
                            <div className="bg-red-600 text-white px-2 py-1 md:px-4 md:py-1 rounded-full text-xs md:text-sm font-bold animate-pulse flex items-center gap-2 shadow-lg border-2 border-red-400">
                                <Syringe size={16}/> <span className="uppercase">SAKATLIK MÜDAHALESİ GEREKLİ!</span>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={onCloseTactics} 
                        disabled={!!forcedSubstitutionPlayerId} 
                        className={`px-4 py-2 rounded font-bold flex items-center gap-2 transition-all ${forcedSubstitutionPlayerId ? 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'}`}
                    >
                        {forcedSubstitutionPlayerId ? <Lock size={20}/> : <PlayCircle size={20}/>} 
                        <span className="hidden md:inline">{forcedSubstitutionPlayerId ? 'DEĞİŞİKLİK YAPIN' : 'MAÇA DÖN'}</span>
                    </button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    <TacticsView team={myTeamCurrent} setTeam={handleTacticsUpdate} isMatchActive={true} subsUsed={userIsHome ? homeSubsUsed : awaySubsUsed} maxSubs={5} onSubstitution={handleUserSubstitution} currentMinute={minute} compact={window.innerWidth < 768} forcedSubstitutionPlayerId={forcedSubstitutionPlayerId} redCardedPlayerIds={redCardedPlayerIds} initialTab={tacticsInitialTab} />
                </div>
            </div>
        )}
        {isVarActive && (<div className="absolute inset-0 z-[100] bg-black/60 flex items-center justify-center backdrop-blur-sm"><div className="bg-slate-900 p-8 rounded-xl border-2 border-purple-500 text-center animate-pulse shadow-2xl shadow-purple-900/50"><MonitorPlay size={80} className="text-purple-500 mx-auto mb-6"/><h2 className="text-4xl font-bold text-white mb-4 tracking-widest">VAR KONTROLÜ</h2><p className="text-purple-300 text-xl font-mono">{varMessage}</p></div></div>)}
        {isPenaltyActive && (
            <div className="absolute inset-0 z-[100] bg-black/70 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-slate-900 p-10 rounded-xl border-4 border-green-600 text-center shadow-2xl shadow-green-900/50 animate-in zoom-in duration-300 flex flex-col items-center">
                    <div className="flex justify-center mb-6"><Target size={100} className="text-green-500 animate-pulse"/></div>
                    <h2 className="text-5xl font-bold text-white mb-6 tracking-widest uppercase">PENALTI!</h2>
                    {activePenaltyTeam && (<div className="bg-white text-black px-6 py-3 rounded-full font-bold mb-6 flex items-center gap-3 animate-bounce shadow-lg">{activePenaltyTeam.logo ? (<img src={activePenaltyTeam.logo} alt="" className="w-8 h-8 object-contain"/>) : (<div className={`w-8 h-8 rounded-full ${activePenaltyTeam.colors[0]}`} />)}<span className="uppercase tracking-wide">{activePenaltyTeam.name} Kullanıyor</span></div>)}
                    <p className="text-green-400 text-2xl font-mono font-bold">{penaltyMessage}</p>
                </div>
            </div>
        )}
    </>
);

export const LiveMatchTimeline = ({ events, homeTeam, awayTeam }: { events: MatchEvent[], homeTeam: Team, awayTeam: Team }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when events change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [events.length]);

    // Filter relevant events for the visual timeline
    const timelineEvents = events.filter(e => 
        ['GOAL', 'CARD_RED', 'CARD_YELLOW', 'SUBSTITUTION', 'INJURY'].includes(e.type)
    );

    const getEventStyle = (type: string, isHome: boolean) => {
        if (type === 'GOAL') return 'bg-[#252830] border-green-500';
        if (type === 'CARD_RED') return 'bg-[#252830] border-red-500';
        if (type === 'CARD_YELLOW') return 'bg-[#252830] border-yellow-500';
        if (type === 'INJURY') return 'bg-[#252830] border-red-400';
        return 'bg-[#252830] border-slate-600';
    };

    const getIcon = (type: string, isSecondYellow: boolean = false) => {
        if (type === 'GOAL') return <Disc size={14} className="text-green-500 fill-current animate-pulse"/>;
        if (type === 'CARD_RED') {
            if (isSecondYellow) {
                // Display Both Cards Overlapping
                return (
                    <div className="flex items-center -space-x-1.5">
                        <div className="w-3 h-4 bg-yellow-500 rounded-[1px] border border-yellow-600 shadow-sm transform -rotate-6 z-0"></div>
                        <div className="w-3 h-4 bg-red-600 rounded-[1px] border border-red-800 shadow-sm transform rotate-12 z-10"></div>
                    </div>
                );
            }
            return <div className="w-3 h-4 bg-red-600 rounded-[1px] border border-red-800 shadow-sm"></div>;
        }
        if (type === 'CARD_YELLOW') return <div className="w-3 h-4 bg-yellow-500 rounded-[1px] border border-yellow-600 shadow-sm"></div>;
        if (type === 'SUBSTITUTION') return <RefreshCw size={14} className="text-blue-400"/>;
        if (type === 'INJURY') return <Syringe size={14} className="text-red-400"/>;
        return null;
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#16181d] relative" ref={scrollRef}>
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-800/50 -translate-x-1/2"></div>
            
            {timelineEvents.length === 0 && (
                <div className="text-center text-slate-500 text-xs italic mt-4">Henüz önemli bir olay yaşanmadı.</div>
            )}

            {timelineEvents.map((e, i) => {
                const isHome = e.teamName === homeTeam.name;
                const isGoal = e.type === 'GOAL';
                const isSecondYellow = e.type === 'CARD_RED' && e.description.toLowerCase().includes('ikinci sarı');
                
                let primaryText = "";
                let subText = "";

                if (e.type === 'GOAL') {
                    primaryText = e.scorer || "Gol";
                    subText = e.assist ? `Asist: ${e.assist}` : "Gol";
                } else if (e.type === 'SUBSTITUTION') {
                    const parts = e.description.split('🔄');
                    primaryText = parts[1] ? parts[1].trim() : "Oyuncu Değişikliği";
                    subText = parts[0] ? parts[0].trim() : "";
                } else if (e.type === 'INJURY') {
                    const parts = e.description.split(' ');
                    primaryText = parts[0] + ' ' + (parts[1] || '');
                    subText = "Sakatlık";
                } else if (e.playerId) {
                    const team = isHome ? homeTeam : awayTeam;
                    const p = team.players.find(pl => pl.id === e.playerId);
                    primaryText = p ? p.name : (e.description.split(' ')[0] || "Oyuncu");
                    subText = e.type === 'CARD_RED' ? (isSecondYellow ? '2. Sarıdan Kırmızı' : 'Kırmızı Kart') : e.type === 'CARD_YELLOW' ? 'Sarı Kart' : '';
                } else {
                     primaryText = e.description;
                }

                return (
                    <div key={i} className="flex items-center justify-between mb-3 relative w-full group">
                        {/* LEFT SIDE (HOME) */}
                        <div className="flex-1 pr-6 flex justify-end">
                            {isHome ? (
                                <div className={`relative px-3 py-2 rounded-lg border-l-4 shadow-md min-w-[140px] flex items-center justify-between ${getEventStyle(e.type, true)}`}>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-xs font-bold ${isGoal ? 'text-green-400' : 'text-slate-200'} truncate max-w-[110px]`}>{primaryText}</span>
                                        {subText && <span className="text-[9px] text-slate-500 font-bold uppercase">{subText}</span>}
                                    </div>
                                    <div className="ml-3 shrink-0">
                                        {getIcon(e.type, isSecondYellow)}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* CENTER (TIME) */}
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 shrink-0 shadow-md ${isGoal ? 'bg-green-900 border-green-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-300'}`}>
                            {e.minute}'
                        </div>

                        {/* RIGHT SIDE (AWAY) */}
                        <div className="flex-1 pl-6 flex justify-start">
                            {!isHome ? (
                                <div className={`relative px-3 py-2 rounded-lg border-r-4 shadow-md min-w-[140px] flex items-center justify-between ${getEventStyle(e.type, false)}`}>
                                    <div className="mr-3 shrink-0">
                                        {getIcon(e.type, isSecondYellow)}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className={`text-xs font-bold ${isGoal ? 'text-green-400' : 'text-slate-200'} truncate max-w-[110px]`}>{primaryText}</span>
                                        {subText && <span className="text-[9px] text-slate-500 font-bold uppercase">{subText}</span>}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const MatchEventFeed = ({ events, allTeams, homeTeam, awayTeam, scrollRef }: { events: MatchEvent[], allTeams: Team[], homeTeam: Team, awayTeam: Team, scrollRef: any }) => (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#16181d]" ref={scrollRef}>
        {events.map((e, i) => {
            const eventTeam = allTeams.find(t => t.name === e.teamName);
            let borderClass = 'border-slate-700';
            let bgClass = 'bg-[#21242c]';
            let activeColorClass = 'bg-slate-600';
            let activeTextClass = 'text-white';
            const isHighImpactEvent = ['GOAL', 'INJURY', 'CARD_RED', 'PITCH_INVASION', 'FIGHT', 'ARGUMENT'].includes(e.type);
            const isSecondYellow = e.type === 'CARD_RED' && e.description.toLowerCase().includes('ikinci sarı');

            if (eventTeam) {
                if (isHighImpactEvent) {
                    const fromColor = eventTeam.colors[0].replace('bg-', 'from-');
                    const toColor = eventTeam.colors[1].replace('text-', 'to-');
                    bgClass = `bg-gradient-to-r ${fromColor} ${toColor}`;
                    borderClass = 'border-black/20'; 
                    activeTextClass = 'text-black font-bold';
                    activeColorClass = '';
                    
                    if (e.type === 'CARD_RED' || e.type === 'FIGHT' || e.type === 'ARGUMENT') {
                        bgClass = 'bg-gradient-to-r from-red-900 to-red-600';
                        activeTextClass = 'text-white font-bold';
                    }
                } else {
                    const isHome = eventTeam.id === homeTeam.id;
                    const conflict = homeTeam.colors[0] === awayTeam.colors[0];
                    if (!isHome && conflict) activeColorClass = eventTeam.colors[1].replace('text-', 'bg-');
                    else activeColorClass = eventTeam.colors[0];
                    if (activeColorClass.includes('black') || activeColorClass.includes('slate-900')) activeColorClass = 'bg-slate-400';
                    borderClass = activeColorClass.replace('bg-', 'border-');
                    
                    bgClass = 'bg-[#21242c]';
                    
                    const isLightBg = activeColorClass.includes('white') || activeColorClass.includes('yellow') || activeColorClass.includes('cyan') || activeColorClass.includes('lime') || activeColorClass.includes('slate-200');
                    activeTextClass = isLightBg ? 'text-black' : 'text-white';
                }
            } else {
                if (e.type === 'VAR' || (e.type === 'INFO' && e.description.includes('VAR'))) { bgClass = 'bg-purple-900/30'; borderClass = 'border-purple-500'; } 
                else if (e.description.includes('Teknik direktör')) { bgClass = 'bg-orange-900/30'; borderClass = 'border-orange-500'; }
                else if (e.type === 'PITCH_INVASION') { bgClass = 'bg-red-900/50'; borderClass = 'border-red-500 animate-pulse'; }
            }
            if (e.type === 'SUBSTITUTION') { bgClass = 'bg-blue-900/20'; borderClass = 'border-blue-800'; }

            let displayMinute = e.minute.toString();
            if (e.minute > 90) displayMinute = `90+${e.minute - 90}`;
            
            return (
                <div key={i} className={`p-3 rounded-lg border-l-4 animate-in fade-in slide-in-from-bottom-2 shadow-sm ${bgClass} ${borderClass}`}>
                    <div className="flex items-start gap-3">
                        <span className={`font-mono font-bold min-w-[35px] text-sm ${isHighImpactEvent ? 'text-white/80' : 'text-slate-500'}`}>{displayMinute}'</span>
                        <div className="flex-1">
                            {e.type === 'GOAL' ? (
                                <><div className="flex items-center gap-3 mb-2">{eventTeam?.logo ? (<img src={eventTeam.logo} className="w-10 h-10 object-contain bg-white rounded-full p-1 shadow-sm" alt="" />) : (<div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm border-2 border-white ${eventTeam?.colors[0]}`}>{eventTeam?.name.charAt(0)}</div>)}<span className={`font-black inline-block px-3 py-0.5 rounded text-xl tracking-widest bg-black/40 text-white shadow-sm border border-white/20`}>GOOOOL!</span></div><span className={`${activeTextClass} block mt-1 text-lg font-bold drop-shadow-md`}>{e.description.replace('GOOOOL!', '').trim()}</span>{e.assist && (<span className={`${isHighImpactEvent ? 'text-black opacity-75' : 'text-blue-300'} text-xs block mt-1 font-bold`}>Asist: {e.assist}</span>)}</>
                            ) : (
                                <div className={`text-sm ${isHighImpactEvent ? 'text-white font-bold' : 'text-slate-300'} flex items-center flex-wrap gap-2`}>
                                    {e.type === 'SUBSTITUTION' && eventTeam && (<span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded text-white ${eventTeam.id === homeTeam.id ? 'bg-blue-600' : 'bg-red-600'}`}>{eventTeam.name}</span>)}
                                    {e.type === 'CARD_YELLOW' && (<span className="inline-block w-2.5 h-3.5 bg-yellow-500 border border-yellow-600 rounded-[1px] shadow-sm"></span>)}
                                    {e.type === 'INJURY' && (<AlertCircle size={16} className="inline-block text-red-700" />)}
                                    {e.type === 'SUBSTITUTION' && (<RefreshCw size={16} className="inline-block text-green-500" />)}
                                    
                                    {e.type === 'CARD_RED' && (
                                        isSecondYellow ? (
                                            <span className="inline-flex items-center gap-0.5">
                                                 <span className="inline-block w-2.5 h-3.5 bg-yellow-500 border border-yellow-600 rounded-[1px] shadow-sm"></span>
                                                 <span className="inline-block w-2.5 h-3.5 bg-red-600 border border-red-800 rounded-[1px] shadow-sm"></span>
                                            </span>
                                        ) : (
                                            <span className="inline-block w-2.5 h-3.5 bg-red-600 border border-red-800 rounded-[1px] shadow-sm"></span>
                                        )
                                    )}

                                    {e.type === 'FIGHT' && (<Swords size={18} className="inline-block text-white" />)}
                                    {e.type === 'ARGUMENT' && (<XCircle size={18} className="inline-block text-white" />)}
                                    {e.type === 'PITCH_INVASION' && (<Siren size={18} className="inline-block text-red-500 animate-pulse" />)}

                                    <span className="leading-snug">{e.description}</span>
                                </div>
                            )}
                            {e.description.includes('(İPTAL)') && <span className="bg-red-600 text-white px-2 py-1 rounded font-bold inline-block mt-1 text-xs">GOL İPTAL EDİLDİ!</span>}
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
);
