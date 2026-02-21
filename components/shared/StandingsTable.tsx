import React from 'react';
import { Team, Fixture } from '../../types';
import { calculateForm } from '../../utils/gameEngine';

interface StandingsTableProps {
    teams: Team[];
    myTeamId: string | null;
    compact?: boolean;
    onTeamClick?: (id: string) => void;
    liveScores?: { homeId: string, awayId: string, homeScore: number, awayScore: number };
    fixtures?: Fixture[]; 
    leagueName?: string; // Added prop for dynamic league name
}

const StandingsTable = ({ teams, myTeamId, compact, onTeamClick, liveScores, fixtures, leagueName }: StandingsTableProps) => {
    let displayTeams = [...teams];
    
    if (liveScores) {
        displayTeams = displayTeams.map(t => {
            const isHome = t.id === liveScores.homeId;
            const isAway = t.id === liveScores.awayId;
            if(!isHome && !isAway) return t;
            
            const newStats = { ...t.stats };
            newStats.played += 1;
            
            if(isHome) {
                newStats.gf += liveScores.homeScore;
                newStats.ga += liveScores.awayScore;
                if(liveScores.homeScore > liveScores.awayScore) { newStats.points += 3; newStats.won++; }
                else if(liveScores.homeScore === liveScores.awayScore) { newStats.points += 1; newStats.drawn++; }
                else { newStats.lost++; }
            } else {
                newStats.gf += liveScores.awayScore;
                newStats.ga += liveScores.homeScore;
                if(liveScores.awayScore > liveScores.homeScore) { newStats.points += 3; newStats.won++; }
                else if(liveScores.awayScore === liveScores.homeScore) { newStats.points += 1; newStats.drawn++; }
                else { newStats.lost++; }
            }
            return { ...t, stats: { ...newStats } };
        });
    }

    const sorted = displayTeams.sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });

    // Default name if not provided
    const displayLeagueName = leagueName || "Süper Toto Hayvanlar Ligi";
    const isLeague1 = displayLeagueName.includes('1. Lig');
    const isEurope = displayLeagueName.includes('Avrupa');

    // Determine competition ID filter based on league name context
    let competitionFilter = 'LEAGUE';
    if (isLeague1) competitionFilter = 'LEAGUE_1';
    else if (isEurope) competitionFilter = 'EUROPE';

    return (
        <div className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                        <tr>
                            <th className="px-3 py-3 w-8 text-center">#</th>
                            <th className="px-3 py-3">Takım</th>
                            {!compact && (
                                <>
                                    <th className="px-3 py-3 text-center" title="Oynanan">O</th>
                                    <th className="px-3 py-3 text-center" title="Galibiyet">G</th>
                                    <th className="px-3 py-3 text-center" title="Beraberlik">B</th>
                                    <th className="px-3 py-3 text-center" title="Mağlubiyet">M</th>
                                    <th className="px-3 py-3 text-center" title="Averaj">Av</th>
                                </>
                            )}
                            <th className="px-3 py-3 text-center font-black text-slate-900 dark:text-white">P</th>
                            {!compact && <th className="px-3 py-3 text-center w-24">Form</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sorted.map((team, index) => {
                            // Apply filter to calculateForm
                            const form = (!compact && fixtures) ? calculateForm(team.id, fixtures, competitionFilter) : [];
                            
                            let rankClass = '';
                            let barClass = '';

                            if (isEurope) {
                                if (index < 8) { // 1-8
                                    rankClass = 'text-green-600 dark:text-green-400';
                                    barClass = 'bg-green-500';
                                } else if (index < 24) { // 9-24
                                    rankClass = 'text-blue-600 dark:text-blue-400';
                                    barClass = 'bg-blue-500';
                                } else { // 25-36 (Elimination)
                                    rankClass = 'text-red-600 dark:text-red-400';
                                    barClass = 'bg-red-500';
                                }
                            } else if (isLeague1) {
                                if (index < 2) { // 1st & 2nd (Promotion)
                                    rankClass = 'text-green-600 dark:text-green-400';
                                    barClass = 'bg-green-500';
                                } else if (index < 6) { // 3rd - 6th (Playoff)
                                    rankClass = 'text-blue-600 dark:text-blue-400';
                                    barClass = 'bg-blue-500';
                                } else if (index > sorted.length - 4) { // Relegation
                                    rankClass = 'text-red-600 dark:text-red-400';
                                    barClass = 'bg-red-500';
                                }
                            } else {
                                // Super League
                                if (index < 4) { // Top 4 (Europe)
                                    rankClass = 'text-green-600 dark:text-green-400';
                                    barClass = 'bg-green-500';
                                } else if (index > sorted.length - 4) { // Relegation (Last 3)
                                    rankClass = 'text-red-600 dark:text-red-400';
                                    barClass = 'bg-red-500';
                                }
                            }

                            return (
                                <tr 
                                    key={team.id} 
                                    onClick={() => onTeamClick && onTeamClick(team.id)}
                                    className={`hover:bg-slate-200 dark:hover:bg-slate-700/50 cursor-pointer transition ${team.id === myTeamId ? 'bg-yellow-50 dark:bg-slate-800/80 ring-1 ring-inset ring-yellow-500/20' : ''}`}
                                >
                                    <td className={`px-3 py-3 text-center font-bold relative ${rankClass}`}>
                                        {/* Qualification Bar */}
                                        {barClass && <div className={`absolute left-0 top-0 bottom-0 w-1 ${barClass}`}></div>}
                                        {index + 1}
                                    </td>
                                    <td className="px-3 py-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                        {team.logo && <img src={team.logo} className="w-5 h-5 object-contain" alt="" />}
                                        <span className={compact ? 'truncate max-w-[100px]' : ''}>{team.name}</span>
                                    </td>
                                    
                                    {!compact && (
                                        <>
                                            <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-400">{team.stats.played}</td>
                                            <td className="px-3 py-3 text-center text-green-600 dark:text-green-500">{team.stats.won}</td>
                                            <td className="px-3 py-3 text-center text-slate-500">{team.stats.drawn}</td>
                                            <td className="px-3 py-3 text-center text-red-600 dark:text-red-400">{team.stats.lost}</td>
                                            <td className="px-3 py-3 text-center font-bold text-slate-700 dark:text-slate-300">{team.stats.gf - team.stats.ga}</td>
                                        </>
                                    )}
                                    
                                    <td className="px-3 py-3 text-center font-black text-base text-slate-900 dark:text-white">{team.stats.points}</td>

                                    {!compact && (
                                        <td className="px-3 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                {form.map((res, i) => (
                                                    <div 
                                                        key={i} 
                                                        className={`w-2.5 h-2.5 rounded-full ${
                                                            res === 'W' ? 'bg-green-500' : 
                                                            res === 'D' ? 'bg-slate-400' : 
                                                            'bg-red-500'
                                                        }`}
                                                    />
                                                ))}
                                                {form.length === 0 && <span className="text-xs text-slate-400">-</span>}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* League Legend */}
            {!compact && (
                <div className="flex flex-wrap gap-4 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {isEurope ? (
                        <>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div>
                                <span>Son 16</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div>
                                <span>Play-off</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
                                <span>Elenme</span>
                            </div>
                        </>
                    ) : isLeague1 ? (
                        <>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div>
                                <span>Üst Lig</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div>
                                <span>Play-off</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
                                <span>Küme Hattı</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-sm"></div>
                                <span>Avrupa Ligi</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
                                <span>Küme Hattı</span>
                            </div>
                        </>
                    )}

                    <div className="ml-auto italic opacity-60">{displayLeagueName} ({sorted.length} Takım)</div>
                </div>
            )}
        </div>
    );
};

export default StandingsTable;