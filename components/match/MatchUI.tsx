
import React from 'react';
import { Team, MatchEvent, MatchStats } from '../../types';
import { Timer, MonitorPlay, Target, Lock, AlertOctagon, Megaphone, Settings, PlayCircle, Syringe, Disc, AlertCircle, RefreshCw } from 'lucide-react';
import PitchVisual from '../shared/PitchVisual';
import TacticsView from '../../views/TacticsView';

export const MatchScoreboard = ({ homeTeam, awayTeam, homeScore, awayScore, minute, homeRedCards, awayRedCards, homeSubsUsed, awaySubsUsed }: { homeTeam: Team, awayTeam: Team, homeScore: number, awayScore: number, minute: number, homeRedCards: number, awayRedCards: number, homeSubsUsed: number, awaySubsUsed: number }) => (
    <div className="bg-black text-white p-2 md:p-4 border-b border-slate-800 flex items-center justify-between shrink-0 h-24 md:h-32">
        <div className="flex items-center gap-2 md:gap-4 w-1/3">
            <img src={homeTeam.logo} className="w-10 h-10 md:w-16 md:h-16 object-contain" />
            <div className="flex flex-col">
                <span className="text-sm md:text-3xl font-bold truncate block">{homeTeam.name}</span>
                {homeRedCards > 0 && (<div className="flex gap-1 mt-1">{[...Array(homeRedCards)].map((_, i) => <div key={i} className="w-2 h-3 md:w-3 md:h-4 bg-red-600 rounded-[1px] border border-white/50 shadow-md" title="Kırmızı Kart" />)}</div>)}
                <span className="text-[10px] md:text-xs text-slate-500 mt-1">Değişiklik: {homeSubsUsed}/5</span>
            </div>
        </div>
        <div className="flex flex-col items-center w-1/3">
            <div className="text-3xl md:text-5xl font-mono font-bold bg-slate-900 px-4 md:px-8 py-1 md:py-2 rounded border border-slate-700 tracking-widest shadow-lg shadow-black whitespace-nowrap">{homeScore} - {awayScore}</div>
            <div className="mt-1 md:mt-2 text-red-500 font-bold animate-pulse flex items-center gap-1 md:gap-2 text-base md:text-xl"><Timer size={16} className="md:w-5 md:h-5"/> {minute}'</div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 w-1/3 justify-end">
            <div className="flex flex-col items-end">
                <span className="text-sm md:text-3xl font-bold truncate block text-right">{awayTeam.name}</span>
                {awayRedCards > 0 && (<div className="flex gap-1 mt-1">{[...Array(awayRedCards)].map((_, i) => <div key={i} className="w-2 h-3 md:w-3 md:h-4 bg-red-600 rounded-[1px] border border-white/50 shadow-md" title="Kırmızı Kart" />)}</div>)}
                <span className="text-[10px] md:text-xs text-slate-500 mt-1">Değişiklik: {awaySubsUsed}/5</span>
            </div>
            <img src={awayTeam.logo} className="w-10 h-10 md:w-16 md:h-16 object-contain" />
        </div>
    </div>
);

export const MatchOverlays = ({ isVarActive, varMessage, isPenaltyActive, penaltyMessage, activePenaltyTeam, isTacticsOpen, forcedSubstitutionPlayerId, myTeamCurrent, handleTacticsUpdate, userIsHome, homeSubsUsed, awaySubsUsed, handleUserSubstitution, minute, onCloseTactics }: any) => (
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
                    <TacticsView team={myTeamCurrent} setTeam={handleTacticsUpdate} isMatchActive={true} subsUsed={userIsHome ? homeSubsUsed : awaySubsUsed} maxSubs={5} onSubstitution={handleUserSubstitution} currentMinute={minute} compact={window.innerWidth < 768} forcedSubstitutionPlayerId={forcedSubstitutionPlayerId} />
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

export const MatchEventFeed = ({ events, allTeams, homeTeam, awayTeam, scrollRef }: { events: MatchEvent[], allTeams: Team[], homeTeam: Team, awayTeam: Team, scrollRef: any }) => (
    <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3" ref={scrollRef}>
        {events.map((e, i) => {
            const eventTeam = allTeams.find(t => t.name === e.teamName);
            let borderClass = 'border-slate-600';
            let bgClass = 'bg-slate-800';
            let activeColorClass = 'bg-slate-500';
            let activeTextClass = 'text-white';
            const isHighImpactEvent = ['GOAL', 'INJURY', 'CARD_RED'].includes(e.type);

            if (eventTeam) {
                if (isHighImpactEvent) {
                    const fromColor = eventTeam.colors[0].replace('bg-', 'from-');
                    const toColor = eventTeam.colors[1].replace('text-', 'to-');
                    bgClass = `bg-gradient-to-r ${fromColor} ${toColor}`;
                    borderClass = 'border-black'; 
                    activeTextClass = 'text-black font-bold';
                    activeColorClass = '';
                } else {
                    const isHome = eventTeam.id === homeTeam.id;
                    const conflict = homeTeam.colors[0] === awayTeam.colors[0];
                    if (!isHome && conflict) activeColorClass = eventTeam.colors[1].replace('text-', 'bg-');
                    else activeColorClass = eventTeam.colors[0];
                    if (activeColorClass.includes('black') || activeColorClass.includes('slate-900')) activeColorClass = 'bg-slate-200';
                    borderClass = activeColorClass.replace('bg-', 'border-');
                    if (activeColorClass.includes('white') || activeColorClass.includes('slate-200')) bgClass = 'bg-slate-200/10';
                    else {
                        let darkBg = activeColorClass.replace('400', '900').replace('500', '900').replace('600', '900').replace('700', '950').replace('800', '950');
                        if(darkBg === activeColorClass && !activeColorClass.includes('900')) darkBg = 'bg-slate-900';
                        bgClass = `${darkBg}/40`;
                    }
                    const isLightBg = activeColorClass.includes('white') || activeColorClass.includes('yellow') || activeColorClass.includes('cyan') || activeColorClass.includes('lime') || activeColorClass.includes('slate-200');
                    activeTextClass = isLightBg ? 'text-black' : 'text-white';
                }
            } else {
                if (e.type === 'VAR' || (e.type === 'INFO' && e.description.includes('VAR'))) { bgClass = 'bg-purple-900/30'; borderClass = 'border-purple-500'; } 
                else if (e.description.includes('Teknik direktör')) { bgClass = 'bg-orange-900/30'; borderClass = 'border-orange-500'; }
            }
            if (e.type === 'SUBSTITUTION') { bgClass = 'bg-green-900/40'; borderClass = 'border-green-500'; }

            return (
                <div key={i} className={`p-2 md:p-3 rounded border-l-4 animate-in fade-in slide-in-from-bottom-2 ${bgClass} ${borderClass}`}>
                    <div className="flex items-start gap-3">
                        <span className={`font-mono font-bold min-w-[25px] md:min-w-[30px] ${isHighImpactEvent ? 'text-black' : 'text-slate-400'}`}>{e.minute}'</span>
                        <div className="flex-1">
                            {e.type === 'GOAL' ? (
                                <><div className="flex items-center gap-3 mb-2">{eventTeam?.logo ? (<img src={eventTeam.logo} className="w-8 h-8 md:w-10 md:h-10 object-contain bg-white rounded-full p-1 shadow-sm" alt="" />) : (<div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm border-2 border-white ${eventTeam?.colors[0]}`}>{eventTeam?.name.charAt(0)}</div>)}<span className={`font-bold inline-block px-2 py-0.5 md:px-3 md:py-1 rounded text-lg md:text-xl tracking-widest ${isHighImpactEvent ? 'bg-black text-white' : `${activeColorClass} ${activeTextClass}`}`}>GOOOOL!</span></div><span className={`${activeTextClass} block mt-1 text-base md:text-lg font-bold`}>{e.description.replace('GOOOOL!', '').trim()}</span>{e.assist && (<span className={`${isHighImpactEvent ? 'text-black opacity-75' : 'text-blue-300'} text-xs block mt-1 font-bold`}>Asist: {e.assist}</span>)}</>
                            ) : (
                                <div className={`text-sm ${isHighImpactEvent ? 'text-black font-bold' : 'text-slate-200'} flex items-center flex-wrap gap-2`}>
                                    {e.type === 'SUBSTITUTION' && eventTeam && (<span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded text-white ${eventTeam.id === homeTeam.id ? 'bg-blue-600' : 'bg-red-600'}`}>{eventTeam.name}</span>)}
                                    {e.type === 'CARD_YELLOW' && (<span className="inline-block w-2.5 h-3.5 bg-yellow-500 border border-yellow-600 rounded-[1px] shadow-sm"></span>)}
                                    {e.type === 'INJURY' && (<AlertCircle size={16} className="inline-block text-red-700" />)}
                                    {e.type === 'SUBSTITUTION' && (<RefreshCw size={16} className="inline-block text-green-400" />)}
                                    <span>{e.description}</span>
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
