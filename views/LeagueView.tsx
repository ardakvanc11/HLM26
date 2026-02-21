import React, { useState } from 'react';
import { Team, Player, Fixture } from '../types';
import StandingsTable from '../components/shared/StandingsTable';
import { Trophy, Goal, Zap, Star, Filter } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';

interface LeagueViewProps {
    teams: Team[];
    fixtures: Fixture[];
    myTeamId: string | null;
    currentWeek: number;
    onPlayerClick: (p: Player) => void;
    onTeamClick: (id: string) => void;
}

const LeagueView: React.FC<LeagueViewProps> = ({ teams, fixtures, myTeamId, currentWeek, onPlayerClick, onTeamClick }) => {
    const [tab, setTab] = useState<'STANDINGS' | 'STATS'>('STANDINGS');
    const [statType, setStatType] = useState<'GOALS' | 'ASSISTS' | 'RATING'>('GOALS');

    // Flatten all players for stats
    const allPlayers = teams.flatMap(t => t.players.map(p => ({
        ...p,
        teamName: t.name,
        teamId: t.id,
        teamColors: t.colors,
        teamLogo: t.logo
    })));

    const getTopPlayers = () => {
        let sorted = [...allPlayers];
        // Filter out players with 0 stats to keep list clean
        if (statType === 'GOALS') {
            sorted = sorted.filter(p => p.seasonStats.goals > 0).sort((a, b) => {
                if (b.seasonStats.goals !== a.seasonStats.goals) return b.seasonStats.goals - a.seasonStats.goals;
                return a.seasonStats.matchesPlayed - b.seasonStats.matchesPlayed; // Less matches = better
            });
        } else if (statType === 'ASSISTS') {
            sorted = sorted.filter(p => p.seasonStats.assists > 0).sort((a, b) => {
                if (b.seasonStats.assists !== a.seasonStats.assists) return b.seasonStats.assists - a.seasonStats.assists;
                return a.seasonStats.matchesPlayed - b.seasonStats.matchesPlayed;
            });
        } else if (statType === 'RATING') {
            sorted = sorted.filter(p => p.seasonStats.matchesPlayed >= 3).sort((a, b) => (b.seasonStats.averageRating || 0) - (a.seasonStats.averageRating || 0));
        }
        return sorted.slice(0, 20);
    };

    const topPlayers = getTopPlayers();

    return (
        <div className="h-full bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
            {/* Header / Tab Bar */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700/50 px-4 pt-4 shrink-0 bg-white dark:bg-slate-800">
                <button
                    onClick={() => setTab('STANDINGS')}
                    className={`flex items-center gap-2 px-6 py-3 text-base font-bold transition-all relative rounded-t-lg group ${
                        tab === 'STANDINGS'
                        ? 'text-yellow-600 dark:text-yellow-400 bg-slate-50 dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-700' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    {tab === 'STANDINGS' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow-500 dark:bg-yellow-400 rounded-t-full"></div>}
                    <Trophy size={18} />
                    <span>Puan Durumu</span>
                </button>
                <button
                    onClick={() => setTab('STATS')}
                    className={`flex items-center gap-2 px-6 py-3 text-base font-bold transition-all relative rounded-t-lg group ${
                        tab === 'STATS'
                        ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-900 border-t border-x border-slate-200 dark:border-slate-700' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    {tab === 'STATS' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500 dark:bg-blue-400 rounded-t-full"></div>}
                    <Filter size={18} />
                    <span>İstatistikler</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                
                {tab === 'STANDINGS' && (
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Trophy className="text-yellow-500" /> Süper Toto Hayvanlar Ligi
                            </h2>
                            <StandingsTable 
                                teams={teams} 
                                myTeamId={myTeamId} 
                                fixtures={fixtures} 
                                onTeamClick={onTeamClick}
                            />
                        </div>
                    </div>
                )}

                {tab === 'STATS' && (
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Sub-Tabs for Stats */}
                        <div className="flex gap-2 mb-4 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg self-start inline-flex">
                            <button 
                                onClick={() => setStatType('GOALS')} 
                                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${statType === 'GOALS' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                <Goal size={16}/> Gol Krallığı
                            </button>
                            <button 
                                onClick={() => setStatType('ASSISTS')} 
                                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${statType === 'ASSISTS' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                <Zap size={16}/> Asist Krallığı
                            </button>
                            <button 
                                onClick={() => setStatType('RATING')} 
                                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${statType === 'RATING' ? 'bg-white dark:bg-slate-700 text-yellow-600 dark:text-yellow-400 shadow' : 'text-slate-500 dark:text-slate-400'}`}
                            >
                                <Star size={16}/> Reyting
                            </button>
                        </div>

                        {/* Stats List */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-500 uppercase">
                                    <tr>
                                        <th className="p-4 w-12 text-center">#</th>
                                        <th className="p-4">Oyuncu</th>
                                        <th className="p-4">Takım</th>
                                        <th className="p-4 text-center">Maç</th>
                                        <th className="p-4 text-right">
                                            {statType === 'GOALS' ? 'Gol' : statType === 'ASSISTS' ? 'Asist' : 'Ort. Reyting'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {topPlayers.map((p, idx) => (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => onPlayerClick(p as any)}>
                                            <td className="p-4 text-center font-bold text-slate-400">{idx + 1}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-200 shrink-0">
                                                        <PlayerFace player={p as any} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                                                        <div className="text-[10px] uppercase font-bold text-slate-500">{p.position}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onTeamClick(p.teamId); }}>
                                                    {p.teamLogo && <img src={p.teamLogo} className="w-5 h-5 object-contain" alt="" />}
                                                    <span className="text-slate-600 dark:text-slate-300 font-medium">{p.teamName}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center text-slate-500 font-mono">{p.seasonStats.matchesPlayed}</td>
                                            <td className="p-4 text-right">
                                                <span className={`text-lg font-black font-mono ${
                                                    statType === 'GOALS' ? 'text-green-600 dark:text-green-400' : 
                                                    statType === 'ASSISTS' ? 'text-blue-600 dark:text-blue-400' : 
                                                    'text-yellow-600 dark:text-yellow-400'
                                                }`}>
                                                    {statType === 'GOALS' ? p.seasonStats.goals : statType === 'ASSISTS' ? p.seasonStats.assists : p.seasonStats.averageRating}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {topPlayers.length === 0 && (
                                <div className="p-12 text-center text-slate-400 italic">
                                    Henüz istatistik verisi bulunmuyor.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeagueView;