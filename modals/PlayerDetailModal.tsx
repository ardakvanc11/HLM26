
import React from 'react';
import { Player } from '../types';
import { X, Heart, Swords, Shield, Zap } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';

const PlayerDetailModal = ({ player, onClose }: { player: Player, onClose: () => void }) => {
    if (!player) return null;

    const getPosBadgeColor = (pos: string) => {
        if (pos === 'GK') return 'bg-yellow-600';
        if (['SLB', 'STP', 'SGB'].includes(pos)) return 'bg-blue-600';
        if (['OS', 'OOS'].includes(pos)) return 'bg-green-600';
        return 'bg-red-600';
    };

    const currentCondition = player.condition !== undefined ? player.condition : player.stats.stamina;

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
                    <div className="flex gap-6 w-full">
                        <div className="w-24 h-24 shrink-0 rounded-full overflow-hidden shadow-lg border-4 border-white dark:border-slate-600 bg-slate-200">
                            <PlayerFace player={player} />
                        </div>
                        
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3 flex-wrap">
                                {player.name}
                                <div className="flex gap-1">
                                    <span className={`text-sm px-2 py-1 rounded font-bold text-white shadow-sm ${getPosBadgeColor(player.position)}`}>
                                        {player.position}
                                    </span>
                                </div>
                            </h2>
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1">
                                <span>{player.nationality}</span> • <span>{player.age} Yaşında</span>
                            </div>
                            <div className="mt-3 flex gap-3">
                                <span className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1 rounded text-xs text-green-700 dark:text-green-400 font-bold">Değer: {player.value} M€</span>
                                <span className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 px-3 py-1 rounded text-xs text-yellow-700 dark:text-yellow-400 font-bold">Moral: {Math.floor(player.morale)}</span>
                            </div>
                        </div>
                        
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition text-slate-500 dark:text-slate-400 self-start"><X size={24}/></button>
                    </div>
                </div>
                
                <div className="p-6 grid grid-cols-2 gap-8 text-slate-900 dark:text-white">
                    <div className="space-y-3">
                        <h4 className="text-red-600 dark:text-red-500 font-bold uppercase text-sm border-b border-slate-200 dark:border-slate-700 pb-1 mb-3 flex items-center gap-2"><Zap size={14}/> Fiziksel (1-20)</h4>
                        <div className="flex justify-between text-sm"><span>Hız</span><span className="font-bold">{Math.floor(player.stats.pace)}</span></div>
                        <div className="flex justify-between text-sm"><span>Güç</span><span className="font-bold">{Math.floor(player.stats.physical)}</span></div>
                        <div className="flex justify-between text-sm"><span>Çeviklik</span><span className="font-bold">{Math.floor(player.stats.agility)}</span></div>
                        <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                            <span className="flex items-center gap-1"><Heart size={14}/> Kondisyon (100)</span>
                            <span className="font-bold">{Math.floor(currentCondition)}%</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-blue-600 dark:text-blue-500 font-bold uppercase text-sm border-b border-slate-200 dark:border-slate-700 pb-1 mb-3 flex items-center gap-2"><Swords size={14}/> Teknik & Zihinsel (1-20)</h4>
                        <div className="flex justify-between text-sm"><span>Bitiricilik</span><span className="font-bold">{Math.floor(player.stats.finishing)}</span></div>
                        <div className="flex justify-between text-sm"><span>Pas</span><span className="font-bold">{Math.floor(player.stats.passing)}</span></div>
                        <div className="flex justify-between text-sm"><span>Vizyon</span><span className="font-bold">{Math.floor(player.stats.vision)}</span></div>
                        <div className="flex justify-between text-sm"><span>Top Kapma</span><span className="font-bold">{Math.floor(player.stats.tackling)}</span></div>
                    </div>
                </div>

                <div className="bg-slate-100 dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <button onClick={() => { onClose(); }} className="text-indigo-600 font-bold text-sm hover:underline">Tüm Özellikleri Gör</button>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">{Math.floor(player.skill)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">GENEL (100)</span></div>
                </div>
            </div>
        </div>
    );
};

export default PlayerDetailModal;
