
import React from 'react';
import { Team, Player, ManagerProfile, PlayerPersonality } from '../types';
import { Users, AlertTriangle, Smile, Frown, Activity, Crown, Shield, User } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';

interface TeamDynamicsViewProps {
    team: Team;
    manager: ManagerProfile;
    onPlayerClick: (p: Player) => void;
    currentWeek: number; // Added currentWeek
}

const TeamDynamicsView: React.FC<TeamDynamicsViewProps> = ({ team, manager, onPlayerClick, currentWeek }) => {
    // 1. Calculate Metrics
    const avgMorale = Math.round(team.players.reduce((sum, p) => sum + p.morale, 0) / team.players.length);
    const managerSupport = manager.trust.players;
    
    // Cohesion approximation: Based on avg morale and recent wins (simulated via morale for now) + randomness
    const teamCohesion = Math.min(100, Math.max(0, Math.round((avgMorale + managerSupport) / 2)));

    // 2. Identify Hierarchy
    // Sort by Leadership qualities (Age + Skill + Mental stats approximation)
    const sortedByInfluence = [...team.players].sort((a, b) => {
        const scoreA = a.skill + (a.age * 2) + (a.squadStatus === 'STAR' ? 20 : 0);
        const scoreB = b.skill + (b.age * 2) + (b.squadStatus === 'STAR' ? 20 : 0);
        return scoreB - scoreA;
    });

    const leaders = sortedByInfluence.slice(0, 3);
    const influential = sortedByInfluence.slice(3, 10);
    const others = sortedByInfluence.slice(10);

    // 3. Identify Issues (Unhappy Players)
    // Updated Logic: Context-aware reasons
    const unhappyPlayers = team.players.filter(p => p.morale < 50).map(p => {
        let reason = "Kişisel sebepler";
        
        const isStar = p.skill >= 80;
        const isYoung = p.age < 22;
        const lowTrust = managerSupport < 40;

        // SEZON BAŞI (İlk 4 Hafta) - Süre şikayeti olmaz
        if (currentWeek <= 4) {
            if (p.transferListed) reason = "Transfer listesine konulduğu için tepkili";
            else if (isStar && team.reputation < 3.5) reason = "Kulübün vizyonunu yetersiz buluyor";
            else if (p.contractExpiry <= 2025) reason = "Sözleşme yenileme görüşmesi bekliyor";
            else if (lowTrust) reason = "Yeni teknik direktöre henüz güvenmiyor";
            else if (p.personality === PlayerPersonality.AMBITIOUS) reason = "Daha büyük bir kulübe gitmek istiyor";
            else reason = "Şehre ve kulübe uyum sürecinde zorlanıyor";
        } 
        // SEZON ORTASI
        else {
            const expectedApps = currentWeek * 0.5; // Beklenen maç sayısı (Yarısı)
            const actualApps = p.seasonStats.matchesPlayed;

            if (actualApps < expectedApps && ['STAR', 'IMPORTANT', 'FIRST_XI'].includes(p.squadStatus || '')) {
                reason = "Yeterli forma şansı bulamadığını düşünüyor";
            }
            else if (p.seasonStats.averageRating < 6.0 && actualApps > 3) {
                reason = "Kötü performansı nedeniyle baskı hissediyor";
            }
            else if (team.stats.points < (currentWeek * 1)) { // Kötü gidişat (Hafta başına 1 puandan az)
                reason = "Takımın ligdeki konumundan endişeli";
            }
            else if (lowTrust) {
                reason = "Menajerin kararlarını sorguluyor";
            }
            else {
                reason = "Antrenman temposundan ve rolünden memnun değil";
            }
        }
        
        return { player: p, reason };
    });

    const renderProgressBar = (label: string, value: number, descGood: string, descBad: string) => {
        let color = 'bg-green-500';
        let textColor = 'text-green-500';
        let desc = descGood;

        if (value < 40) {
            color = 'bg-red-500';
            textColor = 'text-red-500';
            desc = descBad;
        } else if (value < 70) {
            color = 'bg-yellow-500';
            textColor = 'text-yellow-500';
            desc = "İdare eder durumda.";
        }

        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-end mb-2">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase">{label}</h4>
                    <span className={`font-black text-lg ${textColor}`}>%{value}</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div className={`h-full ${color} transition-all duration-1000`} style={{width: `${value}%`}}></div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderProgressBar("Takım Uyumu", teamCohesion, "Oyuncular sahada birbirini çok iyi anlıyor.", "Takım içi kopukluklar saha içine yansıyor.")}
                {renderProgressBar("Kulüp Atmosferi", avgMorale, "Soyunma odasında hava gayet olumlu.", "Oyuncular arasında gerginlik hakim.")}
                {renderProgressBar("Menajere Destek", managerSupport, "Oyuncular sizin için savaşmaya hazır.", "Oyuncular otoritenizi sorguluyor ve arkanızda değiller.")}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Hierarchy Pyramid */}
                <div className="lg:col-span-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Activity className="text-blue-500"/> Hiyerarşi & Nüfuz
                    </h3>
                    
                    <div className="space-y-4">
                        {/* Leaders */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-yellow-500/30 shadow-sm">
                            <h4 className="text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase mb-3 flex items-center gap-1">
                                <Crown size={14}/> Takım Liderleri
                            </h4>
                            <div className="flex flex-wrap gap-4">
                                {leaders.map(p => (
                                    <div key={p.id} onClick={() => onPlayerClick(p)} className="flex items-center gap-3 cursor-pointer group">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-yellow-500">
                                            <PlayerFace player={p} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-500">{p.name}</div>
                                            <div className="text-[10px] text-slate-500">Kaptan</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Influential */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-3 flex items-center gap-1">
                                <Shield size={14}/> Nüfuzlu Oyuncular
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {influential.map(p => (
                                    <div key={p.id} onClick={() => onPlayerClick(p)} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1 rounded transition">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                                            <PlayerFace player={p} />
                                        </div>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{p.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Others */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm opacity-80">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                <Users size={14}/> Diğerleri
                            </h4>
                            <div className="text-xs text-slate-500">
                                {others.length} oyuncu (Gençler ve yeni transferler)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Issues Panel */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-red-50 dark:bg-red-900/10">
                        <h3 className="text-lg font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                            <AlertTriangle size={20}/> Sıkıntılar ({unhappyPlayers.length})
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[300px]">
                        {unhappyPlayers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                                <Smile size={48} className="mb-2 text-green-500 opacity-50"/>
                                <p className="text-sm">Şu an takımda mutsuz oyuncu bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {unhappyPlayers.map(({player, reason}, i) => (
                                    <div key={i} onClick={() => onPlayerClick(player)} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-l-4 border-red-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                            <PlayerFace player={player} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-slate-900 dark:text-white">{player.name}</div>
                                            <div className="text-xs text-red-600 dark:text-red-400 font-medium mt-0.5">{reason}</div>
                                            {reason.includes('Menajer') && (
                                                <div className="text-[9px] text-slate-500 mt-1 italic">
                                                    "Hocanın bizi yönetme şeklinden memnun değilim."
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {managerSupport < 30 && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-bold border-t border-red-200 dark:border-red-800 flex items-center gap-2">
                            <AlertTriangle size={16}/> 
                            UYARI: Düşük destek nedeniyle oyuncular maçlarda isteksiz oynayabilir!
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default TeamDynamicsView;
