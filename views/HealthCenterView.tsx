
import React, { useState } from 'react';
import { Team, Player } from '../types';
import { Activity, Thermometer, History, HeartPulse, AlertTriangle, ShieldCheck, User, Heart, Info, Calendar } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';
import { GAME_CALENDAR } from '../data/gameConstants';

const HealthCenterView = ({ team, currentWeek, onPlayerClick }: { team: Team, currentWeek: number, onPlayerClick: (p: Player) => void }) => {
    const [tab, setTab] = useState<'CURRENT' | 'RISK' | 'HISTORY'>('CURRENT');

    // Use daysRemaining > 0 for injuries
    const injuredPlayers = team.players.filter(p => p.injury && p.injury.daysRemaining > 0);
    
    const sortedByRisk = [...team.players].sort((a, b) => {
        // Calculate risk score: Susceptibility + (100 - Condition) / 2
        // Use `condition` instead of `stats.stamina`
        const condA = a.condition !== undefined ? a.condition : a.stats.stamina;
        const condB = b.condition !== undefined ? b.condition : b.stats.stamina;
        const riskA = (a.injurySusceptibility || 0) + (100 - condA) / 2;
        const riskB = (b.injurySusceptibility || 0) + (100 - condB) / 2;
        return riskB - riskA;
    });

    // Helper to get players with history
    const historyPlayers = team.players.filter(p => p.injuryHistory && p.injuryHistory.length > 0)
        .sort((a, b) => b.injuryHistory.length - a.injuryHistory.length);

    // Renk skalası mantığı: 0-40 Kırmızı (Bitik), 40-70 Sarı (Yorgun), 70-100 Yeşil (İyi)
    const getHeartColor = (val: number) => {
        if (val < 40) return 'text-red-500 fill-red-500 animate-pulse';
        if (val < 70) return 'text-yellow-500 fill-yellow-500';
        return 'text-green-500 fill-green-500';
    };

    const getRiskBg = (risk: number) => {
        if (risk > 70) return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
        if (risk > 40) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
        return 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Activity className="text-red-500" /> Sağlık Merkezi
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Takım sağlık raporu ve sakatlık analizleri.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Revir</div>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{injuredPlayers.length}</div>
                        </div>
                        <div className="text-center px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Yüksek Risk</div>
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                {team.players.filter(p => {
                                    const cond = p.condition !== undefined ? p.condition : p.stats.stamina;
                                    return ((p.injurySusceptibility || 0) + (100 - cond) / 2) > 70;
                                }).length}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-200 dark:bg-slate-700/50 p-1 rounded-lg shrink-0 overflow-x-auto">
                <button 
                    onClick={() => setTab('CURRENT')} 
                    className={`flex-1 py-2 px-4 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition ${tab === 'CURRENT' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <HeartPulse size={16} /> Revir Durumu
                </button>
                <button 
                    onClick={() => setTab('RISK')} 
                    className={`flex-1 py-2 px-4 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition ${tab === 'RISK' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <AlertTriangle size={16} /> Risk Analizi
                </button>
                <button 
                    onClick={() => setTab('HISTORY')} 
                    className={`flex-1 py-2 px-4 rounded-md font-bold text-sm flex items-center justify-center gap-2 transition ${tab === 'HISTORY' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    <History size={16} /> Sakatlık Geçmişi
                </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pb-10">
                {tab === 'CURRENT' && (
                    <div className="space-y-4">
                        {injuredPlayers.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                <ShieldCheck size={64} className="mb-4 opacity-50"/>
                                <p className="text-lg">Takımda sakat oyuncu bulunmuyor.</p>
                            </div>
                        ) : (
                            injuredPlayers.map(p => {
                                // Calculate Recovery Progress
                                const history = p.injuryHistory || [];
                                const lastInjury = history[history.length - 1];
                                
                                // Toplam süreyi bul (Geçmişten veya tahmini fallback)
                                const totalDuration = lastInjury 
                                    ? lastInjury.durationDays 
                                    : Math.max((p.injury?.daysRemaining || 0) + 1, 14); // Fallback

                                const daysLeft = p.injury?.daysRemaining || 0;
                                
                                // Yüzdelik hesap: (Geçen Süre / Toplam Süre) * 100
                                // Örnek: Toplam 10, Kalan 1 => Geçen 9 => %90
                                let progressPct = 0;
                                if (totalDuration > 0) {
                                    progressPct = ((totalDuration - daysLeft) / totalDuration) * 100;
                                }
                                // Sınırla (Min %5 görünsün, Max %100)
                                progressPct = Math.max(5, Math.min(100, progressPct));
                                
                                return (
                                    <div key={p.id} onClick={() => onPlayerClick(p)} className="bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-red-500 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-red-100 dark:border-red-900 shrink-0">
                                            <PlayerFace player={p} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{p.name}</h3>
                                                    <p className="text-red-600 dark:text-red-400 font-bold">{p.injury?.type}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white">{p.injury?.daysRemaining}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">Gün Kaldı</div>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                    <span className="flex items-center gap-1"><Calendar size={12}/> Tahmini Dönüş</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                                        {p.injury?.daysRemaining} Gün Sonra
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ease-out ${progressPct > 80 ? 'bg-green-500' : progressPct > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                        style={{width: `${progressPct}%`}}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{p.injury?.description}"</p>
                                                    <span className="text-[10px] font-bold text-slate-400">%{Math.round(progressPct)} İyileşme</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {tab === 'RISK' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Oyuncu</th>
                                    <th className="p-4 text-center">Yatkınlık</th>
                                    <th className="p-4 text-center">Kondisyon</th>
                                    <th className="p-4 text-center">Risk Seviyesi</th>
                                    <th className="p-4 text-center">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {sortedByRisk.map(p => {
                                    const susceptibility = p.injurySusceptibility || 0;
                                    const condition = p.condition !== undefined ? p.condition : p.stats.stamina;
                                    const fatigue = 100 - condition; 
                                    const riskScore = susceptibility + (fatigue / 2);
                                    
                                    let riskLabel = 'Düşük';
                                    let riskClass = 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
                                    
                                    if (riskScore > 70 || condition < 40) {
                                        riskLabel = 'Çok Yüksek';
                                        riskClass = 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
                                    } else if (riskScore > 40) {
                                        riskLabel = 'Orta';
                                        riskClass = 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
                                    }

                                    return (
                                        <tr key={p.id} onClick={() => onPlayerClick(p)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer">
                                            <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
                                                    <PlayerFace player={p} />
                                                </div>
                                                {p.name}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                                                    <div className={`h-full rounded-full ${susceptibility > 50 ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${susceptibility}%`}}></div>
                                                </div>
                                                <span className="text-xs text-slate-500">{susceptibility}/100</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Heart size={20} className={`${getHeartColor(Math.round(condition))}`} />
                                                    <span className={`text-sm font-bold ${condition < 40 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-slate-700 dark:text-slate-300'}`}>{Math.round(condition)}%</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${riskClass}`}>
                                                    {riskLabel}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-slate-500">
                                                {p.injury ? <span className="text-red-500 font-bold flex items-center justify-center gap-1"><Activity size={14}/> Sakat</span> : <span className="text-green-500 font-bold flex items-center justify-center gap-1"><ShieldCheck size={14}/> Sağlam</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'HISTORY' && (
                    <div className="space-y-4">
                        {historyPlayers.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 italic">
                                Henüz kaydedilmiş sakatlık geçmişi bulunmuyor.
                            </div>
                        ) : (
                            historyPlayers.map(p => (
                                <div key={p.id} onClick={() => onPlayerClick(p)} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200">
                                            <PlayerFace player={p} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{p.name}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Toplam {p.injuryHistory?.length || 0} sakatlık kaydı</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {p.injuryHistory?.map((h, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400">
                                                        <Thermometer size={16} />
                                                    </span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-200">{h.type}</span>
                                                </div>
                                                <div className="flex gap-6 text-slate-500 dark:text-slate-400">
                                                    <span>{h.week}. Hafta</span>
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{h.durationDays} Gün</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HealthCenterView;
