import React from 'react';
import { Player } from '../../types';
import { Syringe, Heart } from 'lucide-react';
import PlayerFace from './PlayerFace';

const PlayerRow: React.FC<{ p: Player, index: number, onClick: (p: Player) => void, currentWeek?: number }> = ({ p, index, onClick, currentWeek }) => {
    // UPDATED: Using `p.condition` instead of `p.stats.stamina`
    const currentCondition = p.condition !== undefined ? p.condition : p.stats.stamina;
    const getConditionColor = (cond: number) => cond >= 80 ? 'text-green-500 fill-green-500' : cond >= 50 ? 'text-yellow-500 fill-yellow-500' : 'text-red-500 fill-red-500';

    const getPosBadgeColor = (pos: string) => {
        if (pos === 'GK') return 'bg-yellow-600';
        if (['SLB', 'STP', 'SGB'].includes(pos)) return 'bg-blue-600';
        if (['OS', 'OOS'].includes(pos)) return 'bg-green-600';
        return 'bg-red-600'; // SLK, SGK, SNT
    };

    // Correctly check suspension status against current week
    const isSuspended = p.suspendedUntilWeek && currentWeek ? p.suspendedUntilWeek > currentWeek : !!p.suspendedUntilWeek;

    return (
        <tr onClick={() => onClick(p)} className="hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-200 dark:border-slate-700/50 last:border-0 group transition-colors">
            <td className="px-2 md:px-4 py-2 text-slate-500 dark:text-slate-400 w-8 text-center text-xs">{index !== undefined ? index + 1 : '-'}</td>
            <td className="px-2 md:px-4 py-2 font-bold text-slate-900 dark:text-white">
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Small Face Preview */}
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-200 shrink-0 hidden sm:block">
                        <PlayerFace player={p} />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="truncate max-w-[120px] md:max-w-none">{p.name}</span>
                            {p.injury && <Syringe size={14} className="text-red-500 animate-pulse shrink-0"/>}
                            {isSuspended && <div className="w-3 h-4 bg-red-600 rounded-[2px] shrink-0" title="Cezalı"/>}
                        </div>
                        <div className="flex gap-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded w-fit text-white font-bold ${getPosBadgeColor(p.position)}`}>
                                {p.position}
                            </span>
                            {p.secondaryPosition && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded w-fit text-white font-bold opacity-75 ${getPosBadgeColor(p.secondaryPosition)}`}>
                                    {p.secondaryPosition}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-2 md:px-4 py-2 text-center font-black text-base md:text-lg text-indigo-700 dark:text-indigo-400">{p.skill}</td>
            <td className="px-2 md:px-4 py-2 text-center text-slate-600 dark:text-slate-300 text-sm hidden sm:table-cell">{p.age}</td>
            <td className="px-2 md:px-4 py-2 text-center hidden md:table-cell"><div className="flex items-center justify-center gap-1 group-hover:scale-110 transition-transform"><Heart size={16} className={getConditionColor(Math.round(currentCondition))} /><span className="text-xs text-slate-400 hidden group-hover:inline">{Math.round(currentCondition)}</span></div></td>
            <td className="px-2 md:px-4 py-2 text-center font-bold text-yellow-600 dark:text-yellow-500 text-sm hidden md:table-cell">{p.morale}</td>
            <td className="px-2 md:px-4 py-2 text-center font-mono text-green-600 dark:text-green-400 text-sm">{p.seasonStats.goals}</td>
            <td className="px-2 md:px-4 py-2 text-center font-mono text-blue-600 dark:text-blue-400 text-sm">{p.seasonStats.assists}</td>
            <td className="px-2 md:px-4 py-2 text-center font-bold text-slate-900 dark:text-white text-sm hidden sm:table-cell">{p.seasonStats.averageRating || '-'}</td>
            <td className="px-2 md:px-4 py-2 text-right text-green-600 dark:text-green-400 font-bold text-xs md:text-sm">{p.value} M€</td>
        </tr>
    );
};

export default PlayerRow;