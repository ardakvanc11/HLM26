
import React from 'react';
import { Player } from '../../types';
import { Smile, Heart, UserCheck, MessageCircle, ChevronRight, ArrowRightLeft, RefreshCw } from 'lucide-react';

interface PlayerContextMenuProps {
    player: Player;
    bench: Player[];
    position: { x: number, y: number };
    onClose: () => void;
    onSubstitute: (inPlayer: Player) => void;
    onShout: (type: string) => void;
    onInstruction: () => void;
    subsLeft: number;
}

const PlayerContextMenu: React.FC<PlayerContextMenuProps> = ({ 
    player, 
    bench, 
    position, 
    onClose, 
    onSubstitute, 
    onShout, 
    onInstruction, 
    subsLeft 
}) => {
    // Determine status icons/text
    const cond = player.condition !== undefined ? player.condition : 100;
    let condColor = 'text-green-500';
    let condText = 'Tam Fit';
    if(cond < 90) { condColor = 'text-green-400'; condText = 'Zinde'; }
    if(cond < 75) { condColor = 'text-yellow-500'; condText = 'Yorgun'; }
    if(cond < 50) { condColor = 'text-red-500'; condText = 'Bitkin'; }

    let moraleColor = 'text-purple-400';
    let moraleText = 'Harika';
    if(player.morale < 90) { moraleColor = 'text-green-400'; moraleText = 'Mutlu'; }
    if(player.morale < 60) { moraleColor = 'text-yellow-500'; moraleText = 'Normal'; }
    if(player.morale < 40) { moraleColor = 'text-red-500'; moraleText = 'Mutsuz'; }

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose}></div>
            <div 
                className="absolute z-50 bg-[#1e232e] border border-slate-600 rounded-lg shadow-2xl w-64 text-sm text-slate-200 overflow-visible animate-in fade-in zoom-in-95 duration-200"
                style={{ left: Math.min(window.innerWidth - 270, Math.max(10, position.x - 100)), bottom: 100 }} // Fixed bottom offset from bar
            >
                {/* Header */}
                <div className="p-3 border-b border-slate-700 bg-slate-900/50 rounded-t-lg">
                    <div className="font-bold text-white text-base">{player.name}</div>
                    <div className="flex justify-between mt-2 text-xs">
                        <div className="flex items-center gap-1.5">
                            <Smile size={14} className={moraleColor}/>
                            <span>{moraleText} <span className="opacity-70 font-mono">(%{Math.floor(player.morale)})</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Heart size={14} className={condColor}/>
                            <span>{condText} <span className="opacity-70 font-mono">(%{Math.floor(cond)})</span></span>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                    {/* Instructions */}
                    <button onClick={onInstruction} className="w-full text-left px-4 py-2.5 hover:bg-slate-700 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <UserCheck size={16} className="text-slate-400"/>
                            <span>Oyuncu Talimatları</span>
                        </div>
                        {/* Placeholder for now */}
                    </button>

                    {/* Shouts Submenu */}
                    <div className="relative group/item">
                        <button className="w-full text-left px-4 py-2.5 hover:bg-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MessageCircle size={16} className="text-blue-400"/>
                                <span>Oyunculara Seslen</span>
                            </div>
                            <ChevronRight size={14} className="text-slate-500"/>
                        </button>
                        
                        {/* Submenu Dropdown */}
                        <div className="absolute left-full bottom-0 ml-1 w-48 bg-[#1e232e] border border-slate-600 rounded-lg shadow-xl hidden group-hover/item:block">
                            <button onClick={() => onShout('PRAISE')} className="w-full text-left px-4 py-2 hover:bg-slate-700 text-green-400 font-bold border-b border-slate-700/50">Aferin!</button>
                            <button onClick={() => onShout('ENCOURAGE')} className="w-full text-left px-4 py-2 hover:bg-slate-700 text-blue-400 font-bold border-b border-slate-700/50">Başarabilirsiniz</button>
                            <button onClick={() => onShout('CALM')} className="w-full text-left px-4 py-2 hover:bg-slate-700 text-yellow-500 font-bold border-b border-slate-700/50">Sakin Olun</button>
                            <button onClick={() => onShout('DEMAND')} className="w-full text-left px-4 py-2 hover:bg-slate-700 text-red-500 font-bold">Daha İyisini Yap!</button>
                        </div>
                    </div>

                    {/* Substitution Submenu */}
                    <div className="relative group/item">
                        <button className="w-full text-left px-4 py-2.5 hover:bg-slate-700 flex items-center justify-between border-t border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <ArrowRightLeft size={16} className="text-red-400"/>
                                <span>Oyuncu Değişikliği</span>
                            </div>
                            <ChevronRight size={14} className="text-slate-500"/>
                        </button>

                        {/* Bench List */}
                        <div className="absolute left-full bottom-0 ml-1 w-56 bg-[#1e232e] border border-slate-600 rounded-lg shadow-xl hidden group-hover/item:block max-h-64 overflow-y-auto custom-scrollbar">
                            <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-500 bg-slate-900/50 border-b border-slate-700">Yedekler ({5 - subsLeft} hak kullanıldı)</div>
                            {subsLeft > 0 ? (
                                bench.map(sub => (
                                    <button 
                                        key={sub.id} 
                                        onClick={() => onSubstitute(sub)}
                                        className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center gap-2 border-b border-slate-700/50 last:border-0"
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-slate-600`}>
                                            {sub.position}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold truncate">{sub.name}</div>
                                            <div className="text-[10px] text-slate-400">Güç: {sub.skill} • Knd: %{Math.round(sub.condition || 100)}</div>
                                        </div>
                                        <RefreshCw size={12} className="text-green-500"/>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-xs text-red-500 italic text-center">Değişiklik hakkı kalmadı.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PlayerContextMenu;
    