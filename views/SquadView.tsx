
import React, { useState, useEffect } from 'react';
import { Team, Player, ManagerProfile, SquadViewState } from '../types';
import PlayerRow from '../components/shared/PlayerRow';
import { ArrowUpDown, Users, Activity } from 'lucide-react';
import TeamDynamicsView from './TeamDynamicsView';

const SquadView = ({ team, onPlayerClick, manager, currentWeek, savedState, onSaveState }: { team: Team, onPlayerClick: (p: Player) => void, manager: ManagerProfile, currentWeek: number, savedState?: SquadViewState | null, onSaveState?: (s: SquadViewState) => void }) => {
    // Init state from saved props or default
    const [viewMode, setViewMode] = useState<'SQUAD' | 'DYNAMICS'>(savedState?.viewMode || 'SQUAD');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(savedState?.sortConfig || null);

    // Save state on change
    useEffect(() => {
        if (onSaveState) {
            onSaveState({ viewMode, sortConfig });
        }
    }, [viewMode, sortConfig, onSaveState]);

    const sortPlayers = (players: Player[]) => {
        if (!sortConfig) return players;
        return [...players].sort((a, b) => {
            let aValue: any = a[sortConfig.key as keyof Player];
            let bValue: any = b[sortConfig.key as keyof Player];
            if (sortConfig.key === 'stamina') { 
                // Use condition if available, fallback to stat
                aValue = a.condition !== undefined ? a.condition : a.stats.stamina; 
                bValue = b.condition !== undefined ? b.condition : b.stats.stamina; 
            }
            if (sortConfig.key === 'goals') { aValue = a.seasonStats.goals; bValue = b.seasonStats.goals; }
            if (sortConfig.key === 'assists') { aValue = a.seasonStats.assists; bValue = b.seasonStats.assists; }
            if (sortConfig.key === 'rating') { aValue = a.seasonStats.averageRating; bValue = b.seasonStats.averageRating; }
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ label, sortKey, align = 'center', className = '' }: { label: string, sortKey: string, align?: string, className?: string }) => (
        <th className={`px-2 md:px-4 py-2 text-${align} cursor-pointer hover:text-black dark:hover:text-white transition select-none group ${className}`} onClick={() => requestSort(sortKey)}>
            <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
                {label} <ArrowUpDown size={12} className={`text-slate-400 dark:text-slate-600 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 ${sortConfig?.key === sortKey ? 'text-yellow-600 dark:text-yellow-500' : ''}`}/>
            </div>
        </th>
    );

    // Slice Logic:
    // XI: 0-11
    // Subs: 11-18 (7 players)
    // Reserves: 18+ (Kadro Dışı)
    const startingXI = team.players.slice(0, 11);
    const substitutes = team.players.slice(11, 18);
    const reserves = team.players.slice(18);

    const groups = [
        { title: 'İLK 11', players: startingXI, colorClass: 'text-green-600 dark:text-green-400', startIndex: 0 },
        { title: 'YEDEKLER', players: substitutes, colorClass: 'text-blue-600 dark:text-blue-400', startIndex: 11 },
        { title: 'KADRO DIŞI (REZERV)', players: reserves, colorClass: 'text-slate-500 dark:text-slate-400', startIndex: 18 }
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Top Navigation Bar */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700/50 px-2 pt-2 shrink-0 bg-slate-50 dark:bg-slate-900 sticky top-0 z-20">
                <button
                    onClick={() => setViewMode('SQUAD')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm md:text-base font-bold transition-all relative rounded-t-lg group whitespace-nowrap ${
                        viewMode === 'SQUAD'
                        ? 'text-yellow-600 dark:text-yellow-400 bg-white dark:bg-slate-800 border-t border-x border-slate-200 dark:border-slate-700' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    {viewMode === 'SQUAD' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow-500 dark:bg-yellow-400 rounded-t-full"></div>}
                    <Users size={18} />
                    <span>Kadro Görünümü</span>
                </button>
                <button
                    onClick={() => setViewMode('DYNAMICS')}
                    className={`flex items-center gap-2 px-6 py-3 text-sm md:text-base font-bold transition-all relative rounded-t-lg group whitespace-nowrap ${
                        viewMode === 'DYNAMICS'
                        ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 border-t border-x border-slate-200 dark:border-slate-700' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    {viewMode === 'DYNAMICS' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500 dark:bg-blue-400 rounded-t-full"></div>}
                    <Activity size={18} />
                    <span>Takım Dinamikleri</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {viewMode === 'SQUAD' ? (
                    <div className="space-y-6 pb-10">
                        {groups.map((group, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                <div className={`px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-bold flex justify-between ${group.colorClass}`}>
                                    <span>{group.title}</span>
                                    {sortConfig && <span className="text-xs text-slate-500 font-normal">Sıralama: {sortConfig.key}</span>}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead>
                                            <tr className="text-xs text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700">
                                                <th className="px-2 md:px-4 py-2 w-8">#</th>
                                                <SortableHeader label="Oyuncu" sortKey="position" align="left" />
                                                <SortableHeader label="Güç" sortKey="skill" />
                                                <SortableHeader label="Yaş" sortKey="age" className="hidden sm:table-cell"/>
                                                <SortableHeader label="Kondisyon" sortKey="stamina" className="hidden md:table-cell"/>
                                                <SortableHeader label="Moral" sortKey="morale" className="hidden md:table-cell"/>
                                                <SortableHeader label="Gol" sortKey="goals" />
                                                <SortableHeader label="Asist" sortKey="assists" />
                                                <SortableHeader label="Form (5)" sortKey="rating" className="hidden sm:table-cell"/>
                                                <SortableHeader label="Değer" sortKey="value" align="right" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.players.length > 0 ? (
                                                sortPlayers(group.players).map((p, i) => <PlayerRow key={p.id} p={p} index={group.startIndex + i} onClick={onPlayerClick} currentWeek={currentWeek} />)
                                            ) : (
                                                <tr>
                                                    <td colSpan={10} className="px-4 py-8 text-center text-slate-400 italic">Bu bölümde oyuncu yok.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <TeamDynamicsView team={team} manager={manager} onPlayerClick={onPlayerClick} currentWeek={currentWeek} />
                )}
            </div>
        </div>
    );
};

export default SquadView;