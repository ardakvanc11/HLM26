
import React from 'react';
import { Team } from '../types';
import { Trophy } from 'lucide-react';

const TeamSelection = ({ teams, onSelect }: { teams: Team[], onSelect: (id: string) => void }) => {
    // Filter out European League Teams (Non-Playable)
    const playableTeams = teams.filter(t => t.leagueId === 'LEAGUE' || t.leagueId === 'LEAGUE_1' || !t.leagueId);

    return (
        <div className="h-screen bg-slate-50 dark:bg-slate-900 p-8 overflow-y-auto">
            <h2 className="text-4xl text-center text-slate-900 dark:text-white mb-8 font-bold">TAKIMINI SEÇ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto pb-10">
                {playableTeams.map(team => {
                    const gradientFrom = team.colors[0].replace('bg-', 'from-');
                    return (
                        <div 
                            key={team.id}
                            onClick={() => onSelect(team.id)}
                            className={`cursor-pointer group relative overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-yellow-500 transition-all duration-300 bg-white dark:bg-slate-800 shadow-xl`}
                        >
                            {/* Gradient Background Area */}
                            <div className={`h-32 w-full bg-gradient-to-b ${gradientFrom} to-white dark:to-slate-800 flex items-center justify-center py-4 relative`}>
                                <div className="absolute inset-0 bg-black/10"></div>
                                {team.logo ? (
                                    <img src={team.logo} alt={team.name} className="h-24 w-24 object-contain drop-shadow-2xl relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
                                ) : (
                                    <div className={`h-20 w-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 border border-white/30`}>
                                         <span className={`text-3xl font-bold text-white`}>{team.name.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 relative z-10">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{team.name}</h3>
                                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="flex justify-between">
                                        <span>Şampiyonluk:</span>
                                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 font-bold">
                                            <Trophy size={16} className="fill-yellow-500" />
                                            {team.leagueId === 'LEAGUE_1' ? 0 : team.championships}
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Bütçe:</span>
                                        <span className="text-green-600 dark:text-green-400">{team.budget} M€</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Taraftar:</span>
                                        <span>{(team.fanBase / 1000000).toFixed(1)}M</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Stadyum:</span>
                                        <span>{team.stadiumName} ({team.stadiumCapacity.toLocaleString()})</span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-black/10 transition-colors pointer-events-none" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TeamSelection;
