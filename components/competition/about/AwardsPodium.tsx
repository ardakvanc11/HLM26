
import React, { useState } from 'react';
import { Star, Goal, Hand, Shield, Activity, Target, Briefcase, ChevronDown, Trophy, History, ArrowRight, Lock } from 'lucide-react';
import { Team, Player, Position, PlayerPersonality } from '../../../types';
import PlayerFace from '../../shared/PlayerFace';
import { FACE_ASSETS } from '../../../data/uiConstants';

interface AwardsPodiumProps {
    teams: Team[];
}

const AWARD_CATEGORIES = [
    { id: 'PLAYER_OF_YEAR', label: 'Yılın Futbolcusu', icon: Star },
    { id: 'TOP_SCORER', label: 'Gol Kralı', icon: Goal },
    { id: 'GK_OF_YEAR', label: 'Yılın Kalecisi', icon: Hand },
    { id: 'DEF_OF_YEAR', label: 'Yılın Defansı', icon: Shield },
    { id: 'MID_OF_YEAR', label: 'Yılın Orta Sahası', icon: Activity },
    { id: 'FWD_OF_YEAR', label: 'Yılın Forveti', icon: Target },
    { id: 'MANAGER_OF_YEAR', label: 'Yılın Menajeri', icon: Briefcase },
];

// Geçmiş Kazananlar Veri Seti (Başlangıçta Boş)
const PAST_WINNERS: { year: string, name: string, team: string, rating: string, category: string }[] = [
   // Veriler sezon ilerledikçe buraya eklenecek
];

export const AwardsPodium: React.FC<AwardsPodiumProps> = ({ teams }) => {
    const [activeAwardCategory, setActiveAwardCategory] = useState<string>('PLAYER_OF_YEAR');
    const [isAwardDropdownOpen, setIsAwardDropdownOpen] = useState(false);

    // --- AWARD DATA CALCULATION ---
    const getAwardWinners = () => {
        // Şu anki sezon verilerine göre ödül adaylarını hesaplar.
        // Sezon başında istatistikler 0 olduğu için liste boş dönecektir.
        
        const allPlayers = teams.flatMap(t => t.players.map(p => ({
            ...p,
            teamName: t.name,
            teamLogo: t.logo,
            teamColors: t.colors
        })));

        // Helper for sorting
        const getTop3 = (filterFn: (p: any) => boolean, sortFn: (a: any, b: any) => number) => {
            const list = allPlayers.filter(filterFn).sort(sortFn);
            // Sadece kayda değer istatistiği olanları göster (Örn: 0 gol atan gol kralı olamaz)
            if (list.length > 0) {
                // Check if top player has valid stats (Basic check)
                const top = list[0];
                if (activeAwardCategory === 'TOP_SCORER' && top.seasonStats.goals === 0) return [];
                if (activeAwardCategory.includes('_OF_YEAR') && top.seasonStats.matchesPlayed < 5) return [];
            }
            return list.slice(0, 3);
        };

        let winners: any[] = [];
        let statLabel = "Puan";
        let isManager = false;

        switch (activeAwardCategory) {
            case 'PLAYER_OF_YEAR':
                winners = getTop3(
                    p => p.seasonStats.matchesPlayed > 10,
                    (a, b) => (b.seasonStats.averageRating || 0) - (a.seasonStats.averageRating || 0)
                );
                statLabel = "Ort. Puan";
                break;
            case 'TOP_SCORER':
                winners = getTop3(
                    p => p.seasonStats.goals > 0,
                    (a, b) => b.seasonStats.goals - a.seasonStats.goals
                );
                statLabel = "Gol";
                break;
            case 'GK_OF_YEAR':
                winners = getTop3(
                    p => p.position === Position.GK && p.seasonStats.matchesPlayed > 10,
                    (a, b) => (b.seasonStats.averageRating || 0) - (a.seasonStats.averageRating || 0)
                );
                statLabel = "Ort. Puan";
                break;
            case 'DEF_OF_YEAR':
                winners = getTop3(
                    p => ['STP', 'SLB', 'SGB'].includes(p.position) && p.seasonStats.matchesPlayed > 10,
                    (a, b) => (b.seasonStats.averageRating || 0) - (a.seasonStats.averageRating || 0)
                );
                statLabel = "Ort. Puan";
                break;
            case 'MID_OF_YEAR':
                winners = getTop3(
                    p => ['OS', 'OOS'].includes(p.position) && p.seasonStats.matchesPlayed > 10,
                    (a, b) => (b.seasonStats.averageRating || 0) - (a.seasonStats.averageRating || 0)
                );
                statLabel = "Ort. Puan";
                break;
            case 'FWD_OF_YEAR':
                winners = getTop3(
                    p => ['SNT', 'SLK', 'SGK'].includes(p.position) && p.seasonStats.matchesPlayed > 10,
                    (a, b) => (b.seasonStats.averageRating || 0) - (a.seasonStats.averageRating || 0)
                );
                statLabel = "Ort. Puan";
                break;
            case 'MANAGER_OF_YEAR':
                isManager = true;
                // Min 10 games to be considered
                const topTeams = [...teams].filter(t => t.stats.played > 10).sort((a, b) => {
                    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                    return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
                }).slice(0, 3);
                
                winners = topTeams.map(t => ({
                    id: t.id,
                    name: `Teknik Direktör`, 
                    teamName: t.name,
                    teamLogo: t.logo,
                    teamColors: t.colors,
                    value: t.stats.points, // Display Value
                    isManager: true
                }));
                statLabel = "Puan";
                break;
        }

        return { winners, statLabel, isManager };
    };

    // --- GET DISPLAY HISTORY ---
    const getDisplayHistory = () => {
        if (activeAwardCategory === 'MANAGER_OF_YEAR') {
            const managerHistory: { year: string, name: string, team: string, rating: string }[] = [];
            // Iterate all teams to find league winners
            // League history format: { year: '2024/25', rank: 1 }
            // We need to reverse map this: Find which team was rank 1 in which year
            
            // Create a map of Year -> Winner Team
            const winnersMap = new Map<string, Team>();
            teams.forEach(t => {
                if (t.leagueHistory) {
                    t.leagueHistory.forEach(h => {
                        if (h.rank === 1) {
                            winnersMap.set(h.year, t);
                        }
                    });
                }
            });

            // Convert map to array and sort by year descending
            Array.from(winnersMap.entries()).forEach(([year, team]) => {
                managerHistory.push({
                    year: year,
                    name: 'Teknik Direktör',
                    team: team.name,
                    rating: 'Şampiyon',
                });
            });

            return managerHistory.sort((a,b) => parseInt(b.year.split('/')[0]) - parseInt(a.year.split('/')[0]));
        } else {
            // Filter static list by active category
            return PAST_WINNERS.filter(w => w.category === activeAwardCategory);
        }
    };

    const awardData = getAwardWinners();
    const historyData = getDisplayHistory();

    const getVal = (w: any) => {
        if (awardData.isManager) return `${w.value}`;
        if (activeAwardCategory === 'PLAYER_OF_YEAR' || activeAwardCategory.endsWith('_OF_YEAR')) 
            return (w.seasonStats?.averageRating || 0).toFixed(2);
        if (activeAwardCategory === 'TOP_SCORER') return w.seasonStats?.goals;
        return '-';
    };

    const renderSimpleRow = (w: any, rank: number) => {
        if (!w) return null;
        
        let rankColor = 'text-slate-500';
        let borderColor = 'border-[#333]';
        let bgColor = 'bg-[#1f1f1f]';

        if (rank === 1) {
            rankColor = 'text-yellow-400';
            borderColor = 'border-yellow-600/30';
            bgColor = 'bg-yellow-900/10';
        } else if (rank === 2) {
            rankColor = 'text-slate-300';
        } else if (rank === 3) {
            rankColor = 'text-orange-400';
        }

        return (
            <div key={w.id} className={`flex items-center p-3 rounded-lg border ${borderColor} ${bgColor} mb-2 relative group hover:bg-[#252525] transition-colors`}>
                {/* Rank */}
                <div className={`font-black text-xl w-10 text-center ${rankColor}`}>{rank}.</div>

                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-600 mx-3 bg-slate-500 shrink-0 relative shadow-sm">
                    {awardData.isManager ? (
                         w.teamLogo ? <img src={w.teamLogo} className="w-full h-full object-contain p-2 bg-white" /> : <div className={`w-full h-full ${w.teamColors[0]}`}></div>
                    ) : (
                         <PlayerFace player={w} />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm truncate ${rank === 1 ? 'text-white' : 'text-slate-200'}`}>{w.name}</div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                         {w.teamLogo && <img src={w.teamLogo} className="w-3.5 h-3.5 object-contain" />}
                         <span className="truncate">{w.teamName}</span>
                    </div>
                </div>

                {/* Stat */}
                <div className="text-right px-4">
                    <div className={`text-lg font-black font-mono leading-none ${rankColor}`}>{getVal(w)}</div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">{awardData.statLabel}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col bg-[#1b1b1b] overflow-hidden">
            {/* Top Bar: Category Selector */}
            <div className="bg-[#21242c] p-4 border-b border-[#333] shrink-0 z-20">
                <div className="relative">
                    <button 
                        onClick={() => setIsAwardDropdownOpen(!isAwardDropdownOpen)}
                        className="w-full bg-[#111] text-white border border-[#444] px-4 py-3 rounded-lg flex justify-between items-center font-bold uppercase tracking-wider hover:bg-[#1a1a1a] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {(() => {
                                const active = AWARD_CATEGORIES.find(c => c.id === activeAwardCategory);
                                return active ? <><active.icon size={18} className="text-[#ff9f43]"/> {active.label}</> : 'Seçiniz';
                            })()}
                        </div>
                        <ChevronDown size={16} className={`text-slate-500 transition-transform ${isAwardDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isAwardDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#252a33] border border-[#444] rounded-lg shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2">
                            {AWARD_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => { setActiveAwardCategory(cat.id); setIsAwardDropdownOpen(false); }}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${activeAwardCategory === cat.id ? 'bg-[#ff9f43] text-black font-bold' : 'text-slate-300 hover:bg-[#333]'}`}
                                >
                                    <cat.icon size={16} />
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content: Simple List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="max-w-3xl mx-auto">
                    {awardData.winners.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center w-full border-2 border-dashed border-[#333] rounded-xl bg-[#1f1f1f]/50">
                            <Lock size={48} className="text-slate-600 mb-4"/>
                            <h3 className="text-lg font-bold text-slate-300">Ödüller Henüz Belirlenmedi</h3>
                            <p className="text-slate-500 text-sm mt-2 max-w-sm">
                                Sezon istatistikleri ve performans verileri oluştukça adaylar burada listelenecektir. Ödüller sezon sonunda (1 Temmuz) verilir.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <div className="mb-4 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest px-2">
                                <span>Sıralama (Tahmini)</span>
                                <span>İstatistik</span>
                            </div>
                            {awardData.winners.map((w, i) => renderSimpleRow(w, i + 1))}
                        </div>
                    )}

                    {/* Previous Winners List */}
                    <div className="mt-10 border-t border-[#333] pt-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <History size={14}/> Geçmiş Sezonlar
                        </h4>
                        
                        {historyData.length > 0 ? (
                            <div className="bg-[#1f1f1f] rounded-xl border border-[#333] overflow-hidden">
                                {historyData.map((winner, idx) => {
                                    // Try to find logo for past winner if team still exists
                                    const winnerTeam = teams.find(t => t.name === winner.team);
                                    
                                    return (
                                        <div key={idx} className="flex justify-between items-center p-3 border-b border-[#333] last:border-0 hover:bg-[#252525] transition-colors">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[#ff9f43] font-mono font-bold text-xs bg-[#111] px-2 py-0.5 rounded">{winner.year}</span>
                                                <span className="text-slate-200 font-bold text-sm">{winner.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 text-xs">
                                                     {winnerTeam?.logo ? <img src={winnerTeam.logo} className="w-4 h-4 object-contain" /> : winnerTeam ? <div className={`w-3 h-3 rounded-full ${winnerTeam.colors[0]}`}></div> : null}
                                                     <span className="text-slate-500 hidden sm:block">{winner.team}</span>
                                                </div>
                                                <div className="bg-[#333] px-2 py-0.5 rounded text-[10px] font-bold text-white border border-[#444]">{winner.rating}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center text-slate-600 text-xs italic py-4 bg-[#111] rounded border border-[#333] border-dashed">
                                Bu kategori için geçmiş sezon verisi bulunamadı.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
