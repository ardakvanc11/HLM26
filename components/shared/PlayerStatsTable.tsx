
import React from 'react';
import { Player, Fixture } from '../../types';
import { Trophy, Globe, Shield, Star, ChevronRight } from 'lucide-react';

interface PlayerStatsTableProps {
    player: Player;
    fixtures?: Fixture[];
    onCompetitionClick?: (compId: string) => void;
}

const PlayerStatsTable: React.FC<PlayerStatsTableProps> = ({ player, fixtures, onCompetitionClick }) => {
    // Helper to render rating badge
    const renderRating = (rating: number) => {
        if (rating === 0 || isNaN(rating)) return <span className="text-slate-400 dark:text-slate-600">-</span>;
        const colorClass = rating >= 7.5 ? 'bg-green-600 text-white' : rating >= 7.0 ? 'bg-green-500/80 text-white' : rating >= 6.0 ? 'bg-yellow-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
        return (
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${colorClass}`}>
                {rating.toFixed(2)}
            </span>
        );
    };

    // Dinamik İstatistik Hesaplayıcı
    const calculateStats = (competitionId: string | string[]) => {
        if (!fixtures) return { apps: 0, goals: 0, assists: 0, yel: 0, red: 0, rating: 0 };

        const relevantFixtures = fixtures.filter(f => {
            if (!f.played || !f.stats) return false;
            
            // Competition Check
            if (Array.isArray(competitionId)) {
                if (!f.competitionId && competitionId.includes('LEAGUE')) return true; // Default to league
                return f.competitionId && competitionId.includes(f.competitionId);
            } else {
                if (competitionId === 'LEAGUE' && !f.competitionId) return true;
                return f.competitionId === competitionId;
            }
        });

        let apps = 0;
        let goals = 0;
        let assists = 0;
        let yel = 0;
        let red = 0;
        let ratingSum = 0;

        relevantFixtures.forEach(f => {
            // Rating tablosundan oyuncuyu bul
            const allRatings = [...(f.stats?.homeRatings || []), ...(f.stats?.awayRatings || [])];
            const pStats = allRatings.find(r => r.playerId === player.id);

            if (pStats) {
                apps++;
                goals += pStats.goals;
                assists += pStats.assists;
                ratingSum += pStats.rating;
            }

            // Kartlar için eventleri tara
            if (f.matchEvents) {
                const cardEvents = f.matchEvents.filter(e => e.playerId === player.id);
                yel += cardEvents.filter(e => e.type === 'CARD_YELLOW').length;
                red += cardEvents.filter(e => e.type === 'CARD_RED').length;
            }
        });

        return {
            apps,
            goals,
            assists,
            yel,
            red,
            rating: apps > 0 ? ratingSum / apps : 0
        };
    };

    // Fallback to SeasonStats if fixtures not provided
    const statsLeague = fixtures ? calculateStats(['LEAGUE', 'LEAGUE_1', 'PLAYOFF', 'PLAYOFF_FINAL']) : {
        apps: player.seasonStats.matchesPlayed,
        goals: player.seasonStats.goals,
        assists: player.seasonStats.assists,
        yel: player.seasonStats.yellowCards,
        red: player.seasonStats.redCards,
        rating: player.seasonStats.averageRating || 0
    };

    const statsCup = calculateStats('CUP');
    const statsSuper = calculateStats('SUPER_CUP');
    const statsEuro = calculateStats('EUROPE');

    // Helper to determine if a row should be shown
    const hasParticipation = (compId: string | string[], stats: any) => {
        // 1. If player has stats (played matches), always show
        if (stats.apps > 0) return true;

        // 2. If fixtures exist for the player's CURRENT team in this competition, show (even if not played yet)
        if (fixtures) {
            return fixtures.some(f => {
                const isMyTeam = f.homeTeamId === player.teamId || f.awayTeamId === player.teamId;
                if (!isMyTeam) return false;

                if (Array.isArray(compId)) {
                    return compId.some(c => c === f.competitionId || (c === 'LEAGUE' && !f.competitionId));
                }
                
                return f.competitionId === compId || (compId === 'LEAGUE' && !f.competitionId);
            });
        }
        return false;
    };

    // Data Rows - Filtered based on participation
    const rows = [
        {
            id: 'LEAGUE',
            name: 'Türkiye Hayvanlar Ligi',
            icon: <Trophy size={14} className="text-yellow-600 dark:text-yellow-500" />,
            stats: statsLeague,
            visible: hasParticipation(['LEAGUE', 'LEAGUE_1', 'PLAYOFF', 'PLAYOFF_FINAL'], statsLeague)
        },
        {
            id: 'CUP',
            name: 'Hayvanlar Kupası',
            icon: <Shield size={14} className="text-blue-600 dark:text-blue-500" />,
            stats: statsCup,
            visible: hasParticipation('CUP', statsCup)
        },
        {
            id: 'SUPER',
            name: 'Hayvanlar Süper Kupası',
            icon: <Star size={14} className="text-red-600 dark:text-red-500" />,
            stats: statsSuper,
            visible: hasParticipation('SUPER_CUP', statsSuper)
        },
        {
            id: 'EURO',
            name: 'Avrupa Hayvanlar Ligi',
            icon: <Globe size={14} className="text-purple-600 dark:text-purple-500" />,
            stats: statsEuro,
            visible: hasParticipation('EUROPE', statsEuro)
        }
    ].filter(r => r.visible);

    const totalApps = rows.reduce((sum, r) => sum + r.stats.apps, 0);
    const totalGoals = rows.reduce((sum, r) => sum + r.stats.goals, 0);
    const totalAssists = rows.reduce((sum, r) => sum + r.stats.assists, 0);
    const totalYel = rows.reduce((sum, r) => sum + r.stats.yel, 0);
    const totalRed = rows.reduce((sum, r) => sum + r.stats.red, 0);
    
    // Weighted Average Rating
    let totalRating = 0;
    if (totalApps > 0) {
        totalRating = rows.reduce((sum, r) => sum + (r.stats.rating * r.stats.apps), 0) / totalApps;
    }

    const handleRowClick = (id: string) => {
        if (!onCompetitionClick) return;
        
        // Map internal table IDs to Global Competition IDs
        let targetId = id;
        if (id === 'SUPER') targetId = 'SUPER_CUP';
        if (id === 'EURO') targetId = 'EUROPE';
        // LEAGUE and CUP match exactly (mostly)
        
        onCompetitionClick(targetId);
    };

    return (
        <div className="w-full overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] md:text-xs tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="py-3 pl-2">Organizasyon</th>
                            <th className="py-3 text-center" title="Maç">Maç</th>
                            <th className="py-3 text-center" title="Gol">Gol</th>
                            <th className="py-3 text-center" title="Asist">Ast</th>
                            <th className="py-3 text-center hidden sm:table-cell" title="Sarı Kart">Sar</th>
                            <th className="py-3 text-center hidden sm:table-cell" title="Kırmızı Kart">Kır</th>
                            <th className="py-3 text-center" title="Ortalama Puan">Ort</th>
                            <th className="py-3 w-6"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {rows.map((row) => (
                            <tr 
                                key={row.id} 
                                onClick={() => handleRowClick(row.id)}
                                className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                            >
                                <td className="py-3 pl-2 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3">
                                    <div className="bg-slate-200 dark:bg-slate-800 p-1.5 rounded-full border border-slate-300 dark:border-slate-600">
                                        {row.icon}
                                    </div>
                                    <span className="group-hover:text-blue-500 transition-colors">{row.name}</span>
                                </td>
                                <td className="py-3 text-center text-slate-500 dark:text-slate-400 font-medium">{row.stats.apps > 0 ? row.stats.apps : '-'}</td>
                                <td className="py-3 text-center font-bold text-slate-900 dark:text-white">{row.stats.goals > 0 ? row.stats.goals : '-'}</td>
                                <td className="py-3 text-center text-slate-600 dark:text-slate-300">{row.stats.assists > 0 ? row.stats.assists : '-'}</td>
                                <td className="py-3 text-center text-yellow-600 dark:text-yellow-500 hidden sm:table-cell">{row.stats.yel > 0 ? row.stats.yel : '-'}</td>
                                <td className="py-3 text-center text-red-600 dark:text-red-500 hidden sm:table-cell">{row.stats.red > 0 ? row.stats.red : '-'}</td>
                                <td className="py-3 text-center font-mono">
                                    {renderRating(row.stats.rating)}
                                </td>
                                <td className="py-3 text-center">
                                    <ChevronRight size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                        <tr>
                            <td className="py-3 pl-2 uppercase text-xs tracking-wider text-slate-500 dark:text-slate-400">Genel Toplam</td>
                            <td className="py-3 text-center">{totalApps}</td>
                            <td className="py-3 text-center text-slate-900 dark:text-white">{totalGoals}</td>
                            <td className="py-3 text-center">{totalAssists}</td>
                            <td className="py-3 text-center text-yellow-600 dark:text-yellow-500 hidden sm:table-cell">{totalYel}</td>
                            <td className="py-3 text-center text-red-600 dark:text-red-500 hidden sm:table-cell">{totalRed}</td>
                            <td className="py-3 text-center font-mono">
                                {renderRating(totalRating)}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default PlayerStatsTable;
