
import React, { useMemo } from 'react';
import { Award, Maximize2, Clock, Lock, Star, Goal, Briefcase, Hand, Shield, Activity, Target } from 'lucide-react';
import { Team, Player } from '../../../types';
import PlayerFace from '../../shared/PlayerFace';

interface AwardsCardProps {
    onOpenDetail: () => void;
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

// Geçmiş Sezon Verileri (Başlangıçta Boş)
const PAST_WINNERS: { year: string, name: string, team: string, rating: string, category: string }[] = [
    // Sezon tamamlandıkça buraya veriler dinamik olarak eklenecek veya oyun motorundan çekilecek.
];

export const AwardsCard: React.FC<AwardsCardProps> = ({ onOpenDetail, teams }) => {
    
    // Calculate current leaders for the 3 main awards
    const leaders = useMemo(() => {
        const allPlayers = teams.flatMap(t => t.players.map(p => ({
            ...p,
            teamName: t.name,
            teamLogo: t.logo,
            teamColors: t.colors
        })));

        // 1. Player of the Year (Avg Rating)
        const playerWinner = allPlayers
            .filter(p => p.seasonStats.matchesPlayed >= 3) // Min matches filter to avoid noise
            .sort((a, b) => (b.seasonStats.averageRating || 0) - (a.seasonStats.averageRating || 0))[0];

        // 2. Top Scorer (Goals)
        const scorerWinner = allPlayers
            .filter(p => p.seasonStats.goals > 0)
            .sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)[0];

        // 3. Manager of the Year (Team Points/Rank)
        const managerWinnerTeam = [...teams].sort((a, b) => {
            if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
            return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
        })[0];

        return {
            player: playerWinner,
            scorer: scorerWinner,
            managerTeam: managerWinnerTeam
        };
    }, [teams]);

    // Calculate max games played by any team to determine if season is mature enough
    const maxGamesPlayed = useMemo(() => {
        return teams.reduce((max, t) => Math.max(max, t.stats.played), 0);
    }, [teams]);

    // Condition: Data exists AND at least 10 games played
    const hasData = maxGamesPlayed >= 10 && (leaders.player || leaders.scorer || leaders.managerTeam);

    const AwardRow = ({ icon: Icon, title, winnerName, subText, imageNode, value, colorClass }: any) => (
        <div className="flex items-center gap-3 p-3 bg-[#1f1f1f] rounded-xl border border-[#333] relative overflow-hidden group/row hover:bg-[#282828] transition-colors">
            {/* Icon Background */}
            <div className={`absolute right-[-10px] bottom-[-10px] opacity-5 group-hover/row:opacity-10 transition-opacity`}>
                <Icon size={64} />
            </div>

            {/* Avatar / Logo */}
            <div className="w-10 h-10 rounded-full bg-[#151515] border border-[#444] overflow-hidden shrink-0 relative flex items-center justify-center shadow-sm">
                {imageNode}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 z-10">
                <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${colorClass}`}>{title}</div>
                <div className="text-sm font-bold text-white truncate">{winnerName}</div>
                <div className="text-[10px] text-slate-500 truncate">{subText}</div>
            </div>

            {/* Value */}
            <div className="z-10 bg-[#151515] px-2 py-1 rounded text-xs font-black text-white border border-[#333]">
                {value}
            </div>
        </div>
    );

    return (
        <div 
            onClick={onOpenDetail}
            className="bg-[#252525] rounded-2xl border border-[#333] overflow-hidden shadow-lg group hover:border-purple-500/50 transition-all duration-300 relative cursor-pointer hover:scale-[1.01] min-h-[397px] flex flex-col"
        >
            <button className="absolute top-4 right-4 z-20 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-transform hover:scale-105 pointer-events-none">
                <Maximize2 size={14} /> Detaylı Gör
            </button>

            <div className="bg-[#2a2f38] p-4 border-b border-[#333] flex items-center gap-3 shrink-0">
                <div className="bg-purple-500/20 p-2 rounded-lg text-purple-500">
                    <Award size={20}/>
                </div>
                <h4 className="text-white font-bold text-lg uppercase tracking-wider">Ödül Kazananlar</h4>
            </div>
            
            <div className="flex-1 p-5 flex flex-col justify-center gap-3 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>

                {!hasData ? (
                    <div className="flex flex-col items-center justify-center text-center">
                         <div className="bg-slate-800 p-4 rounded-full border-2 border-slate-700 mb-4 shadow-xl z-10">
                            <Lock size={40} className="text-slate-500"/>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 z-10">Ödüller Henüz Belirlenmedi</h3>
                        <p className="text-slate-400 text-sm max-w-xs leading-relaxed z-10">
                            Sezon istatistikleri ve performans verileri oluştukça adaylar burada listelenecektir. Ödüller sezon sonunda (1 Temmuz) verilir.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-xs font-bold text-purple-400 bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-500/30 z-10">
                            <Clock size={14} /> {maxGamesPlayed < 10 ? `${10 - maxGamesPlayed} Hafta Kaldı` : 'Sonuçlar Bekleniyor'}
                        </div>
                    </div>
                ) : (
                    <div className="z-10 flex flex-col gap-3 h-full justify-center">
                        
                        {/* 1. PLAYER OF THE YEAR */}
                        <AwardRow 
                            icon={Star}
                            title="Yılın Futbolcusu"
                            winnerName={leaders.player ? leaders.player.name : "Belirleniyor..."}
                            subText={leaders.player ? leaders.player.teamName : "-"}
                            value={leaders.player ? leaders.player.seasonStats.averageRating.toFixed(2) : "-"}
                            colorClass="text-yellow-400"
                            imageNode={leaders.player ? <PlayerFace player={leaders.player} /> : <div className="text-xs text-slate-500">?</div>}
                        />

                        {/* 2. TOP SCORER */}
                        <AwardRow 
                            icon={Goal}
                            title="Gol Kralı"
                            winnerName={leaders.scorer ? leaders.scorer.name : "Belirleniyor..."}
                            subText={leaders.scorer ? leaders.scorer.teamName : "-"}
                            value={leaders.scorer ? `${leaders.scorer.seasonStats.goals} Gol` : "-"}
                            colorClass="text-green-400"
                            imageNode={leaders.scorer ? <PlayerFace player={leaders.scorer} /> : <div className="text-xs text-slate-500">?</div>}
                        />

                        {/* 3. MANAGER OF THE YEAR */}
                        <AwardRow 
                            icon={Briefcase}
                            title="Yılın Menajeri"
                            winnerName={leaders.managerTeam ? `Teknik Direktör` : "Belirleniyor..."}
                            subText={leaders.managerTeam ? leaders.managerTeam.name : "-"}
                            value={leaders.managerTeam ? `${leaders.managerTeam.stats.points} P` : "-"}
                            colorClass="text-blue-400"
                            imageNode={leaders.managerTeam ? (
                                leaders.managerTeam.logo ? <img src={leaders.managerTeam.logo} className="w-full h-full object-contain p-1" /> : <div className={`w-full h-full ${leaders.managerTeam.colors[0]}`}></div>
                            ) : <div className="text-xs text-slate-500">?</div>}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
