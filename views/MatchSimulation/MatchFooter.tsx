
import React from 'react';
import { Team, Mentality, Player } from '../../types';
import { Settings, Megaphone, Mic, Users, RefreshCw } from 'lucide-react';
import PlayerMatchCard from './PlayerMatchCard';

interface MatchFooterProps {
    myTeamCurrent: Team;
    handleQuickMentalityChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    managerDiscipline: string;
    setIsTacticsOpen: (v: boolean) => void;
    isOwnGoal: boolean;
    handleObjection: () => void;
    phase: string;
    hasHalftimeTalkBeenGiven: boolean;
    setIsHalftimeTalkOpen: (v: boolean) => void;
    speed: number;
    setSpeed: (s: number) => void;
    showBenchInBottomBar: boolean;
    setShowBenchInBottomBar: (v: boolean) => void;
    handlePlayerClick: (e: React.MouseEvent, p: Player) => void;
    getPlayerRating: (p: Player) => number;
}

const MatchFooter: React.FC<MatchFooterProps> = ({
    myTeamCurrent,
    handleQuickMentalityChange,
    managerDiscipline,
    setIsTacticsOpen,
    isOwnGoal,
    handleObjection,
    phase,
    hasHalftimeTalkBeenGiven,
    setIsHalftimeTalkOpen,
    speed,
    setSpeed,
    showBenchInBottomBar,
    setShowBenchInBottomBar,
    handlePlayerClick,
    getPlayerRating
}) => {
    return (
        <div className="h-48 bg-[#1b1e26] border-t border-slate-700 flex shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-20">
            {/* Left Side: Tactical Controls */}
            <div className="w-1/3 md:w-1/4 lg:w-1/3 border-r border-slate-700 p-3 flex flex-col gap-2 bg-[#21242c]">
                
                {/* Mentality + Speed Row */}
                <div className="flex gap-2 h-14">
                    {/* Mentality Selector */}
                    <div className="bg-[#16181d] rounded border border-slate-600 p-1 flex flex-col w-[307px] min-w-[307px]">
                        <label className="text-[9px] text-slate-500 font-bold uppercase pl-1 truncate">Oyun Anlayışı</label>
                        <select 
                            value={myTeamCurrent.mentality} 
                            onChange={handleQuickMentalityChange}
                            disabled={managerDiscipline === 'RED'}
                            className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer w-full h-full"
                        >
                            {Object.values(Mentality).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    {/* Speed Controls */}
                    <div className="bg-[#16181d] rounded border border-slate-600 p-1 flex flex-1 items-center gap-3 px-3">
                        <div className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">Oyun Hızı</div>
                        <div className="flex gap-1 flex-1 h-full">
                            {[1, 2, 4].map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => setSpeed(s)} 
                                    className={`flex-1 h-full flex items-center justify-center rounded text-sm md:text-base font-bold transition-colors ${speed === s ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 flex-1">
                    <button 
                        disabled={managerDiscipline === 'RED'} 
                        onClick={() => setIsTacticsOpen(true)}
                        className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition disabled:opacity-50"
                    >
                        <Settings size={16}/>
                        <span className="text-[10px] font-bold uppercase">Talimatlar</span>
                    </button>
                    <button 
                        disabled={isOwnGoal || managerDiscipline === 'RED'} 
                        onClick={handleObjection}
                        className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition disabled:opacity-50"
                    >
                        <Megaphone size={16}/>
                        <span className="text-[10px] font-bold uppercase">İtiraz Et</span>
                    </button>
                    <button
                        disabled={phase !== 'HALFTIME' || managerDiscipline === 'RED' || hasHalftimeTalkBeenGiven}
                        onClick={() => setIsHalftimeTalkOpen(true)}
                        className={`border border-slate-600 rounded flex flex-col items-center justify-center gap-1 transition disabled:opacity-50 col-span-2 ${phase === 'HALFTIME' && managerDiscipline !== 'RED' && !hasHalftimeTalkBeenGiven ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                    >
                        <Mic size={16}/>
                        <span className="text-[10px] font-bold uppercase">Devre Arası Konuşması</span>
                    </button>
                </div>
            </div>

            {/* Right Side: Live Player Ratings & Status */}
            <div className="flex-1 flex flex-row h-full overflow-hidden">
                {/* Horizontal Player Scroll */}
                <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center px-4 gap-3 bg-[#1b1e26] py-2">
                    {myTeamCurrent.players.slice(showBenchInBottomBar ? 11 : 0, showBenchInBottomBar ? 18 : 11).map(p => (
                        <PlayerMatchCard 
                            key={p.id} 
                            player={p} 
                            rating={getPlayerRating(p)} 
                            onClick={(e) => handlePlayerClick(e, p)}
                        />
                    ))}
                     {/* Empty state if no subs */}
                     {showBenchInBottomBar && myTeamCurrent.players.length <= 11 && (
                        <div className="text-slate-500 text-xs italic w-full text-center">Yedek oyuncu yok.</div>
                     )}
                </div>

                {/* Toggle Button */}
                <button 
                    onClick={() => setShowBenchInBottomBar(!showBenchInBottomBar)}
                    className="w-16 h-full bg-[#252830] border-l border-slate-700 hover:bg-[#2f333d] flex items-center justify-center transition-colors cursor-pointer group shadow-[-10px_0_20px_rgba(0,0,0,0.2)] z-10"
                    title={showBenchInBottomBar ? "İlk 11'i Göster" : "Yedekleri Göster"}
                >
                    <div className="flex flex-col items-center gap-3">
                         {showBenchInBottomBar ? <Users size={20} className="text-yellow-500"/> : <RefreshCw size={20} className="text-blue-500"/>}
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest writing-vertical-rl">
                            {showBenchInBottomBar ? 'İLK 11' : 'YEDEKLER'}
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default MatchFooter;
