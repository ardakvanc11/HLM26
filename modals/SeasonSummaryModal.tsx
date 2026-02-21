
import React, { useState } from 'react';
import { SeasonSummary } from '../types';
import { Trophy, Star, TrendingUp, TrendingDown, ArrowRight, Zap, Goal, X } from 'lucide-react';
import PitchVisual from '../components/shared/PitchVisual';
import PlayerFace from '../components/shared/PlayerFace';

interface SeasonSummaryModalProps {
    summary: SeasonSummary;
    onClose: () => void;
}

const SeasonSummaryModal: React.FC<SeasonSummaryModalProps> = ({ summary, onClose }) => {
    const [tab, setTab] = useState<'OVERVIEW' | 'BEST_XI' | 'TRANSFERS'>('OVERVIEW');

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 overflow-hidden animate-in fade-in duration-500">
            <div className="w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-widest font-teko">Sezon Özeti: {summary.season}</h2>
                        <p className="text-slate-400 text-sm">{summary.teamName} Performans Raporu</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-yellow-900/20 animate-pulse"
                    >
                        Yeni Sezona Başla <ArrowRight size={20}/>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-950 border-b border-slate-800 shrink-0">
                    <button onClick={() => setTab('OVERVIEW')} className={`flex-1 py-4 font-bold uppercase tracking-wider transition ${tab === 'OVERVIEW' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}>Genel Bakış</button>
                    <button onClick={() => setTab('BEST_XI')} className={`flex-1 py-4 font-bold uppercase tracking-wider transition ${tab === 'BEST_XI' ? 'text-green-500 border-b-2 border-green-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}>Sezonun En İyileri</button>
                    <button onClick={() => setTab('TRANSFERS')} className={`flex-1 py-4 font-bold uppercase tracking-wider transition ${tab === 'TRANSFERS' ? 'text-blue-500 border-b-2 border-blue-500 bg-slate-800' : 'text-slate-500 hover:text-slate-300'}`}>Transfer Raporu</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-900 relative">
                    
                    {tab === 'OVERVIEW' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4">
                            {/* Ranking & Trophies */}
                            <div className="flex flex-col md:flex-row gap-8 items-center justify-center text-center">
                                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 w-full md:w-1/3 h-48 flex flex-col justify-center items-center shadow-lg">
                                    <div className="text-sm text-slate-400 uppercase font-bold mb-2">Lig Sıralaması</div>
                                    <div className={`text-6xl font-black ${summary.rank === 1 ? 'text-yellow-500' : summary.rank <= 4 ? 'text-green-500' : 'text-white'}`}>{summary.rank}.</div>
                                    {summary.rank === 1 && <div className="text-yellow-500 font-bold mt-2 flex items-center gap-1"><Trophy size={16}/> ŞAMPİYON</div>}
                                </div>

                                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 w-full md:w-2/3 h-48 flex flex-col justify-center items-center shadow-lg relative overflow-hidden">
                                    <div className="text-sm text-slate-400 uppercase font-bold mb-4 relative z-10">Müze</div>
                                    {summary.trophiesWon.length > 0 ? (
                                        <div className="flex gap-6 relative z-10">
                                            {summary.trophiesWon.map((t, i) => (
                                                <div key={i} className="flex flex-col items-center gap-2">
                                                    <Trophy size={48} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]"/>
                                                    <span className="text-white font-bold text-sm">{t}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-slate-600 italic relative z-10">Bu sezon kupa kazanılamadı.</div>
                                    )}
                                    {/* Background Decor */}
                                    <Trophy size={200} className="absolute -right-10 -bottom-10 text-white/5 rotate-12"/>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-green-900/20 border border-green-800 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-black text-green-500">{summary.stats.wins}</div>
                                    <div className="text-xs font-bold text-green-700 uppercase mt-1">Galibiyet</div>
                                </div>
                                <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-black text-slate-300">{summary.stats.draws}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase mt-1">Beraberlik</div>
                                </div>
                                <div className="bg-red-900/20 border border-red-800 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-black text-red-500">{summary.stats.losses}</div>
                                    <div className="text-xs font-bold text-red-700 uppercase mt-1">Mağlubiyet</div>
                                </div>
                                <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-black text-white">{summary.stats.points}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase mt-1">Puan</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-black text-white">{summary.stats.goalsFor}</div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">Atılan Gol</div>
                                    </div>
                                    <TrendingUp size={32} className="text-green-500"/>
                                </div>
                                <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-black text-white">{summary.stats.goalsAgainst}</div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">Yenilen Gol</div>
                                    </div>
                                    <TrendingDown size={32} className="text-red-500"/>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'BEST_XI' && (
                        <div className="flex flex-col md:flex-row gap-8 h-full animate-in slide-in-from-right-4">
                            {/* Pitch */}
                            <div className="flex-1 flex justify-center items-center bg-slate-950 rounded-xl border border-slate-800 p-4 shadow-inner relative overflow-hidden">
                                <div className="absolute inset-0 opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                <PitchVisual players={summary.bestXI} onPlayerClick={() => {}} selectedPlayerId={null}/>
                            </div>

                            {/* Top Performers List */}
                            <div className="w-full md:w-80 space-y-4 shrink-0">
                                <h3 className="text-sm font-bold text-slate-400 uppercase border-b border-slate-700 pb-2">İstatistik Liderleri</h3>
                                
                                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                                    <div className="bg-green-500/20 p-3 rounded-full text-green-500"><Goal size={24}/></div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Gol Kralı</div>
                                        <div className="font-bold text-white text-lg">{summary.topScorer.name}</div>
                                        <div className="text-green-400 font-mono font-bold">{summary.topScorer.count} Gol</div>
                                    </div>
                                </div>

                                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                                    <div className="bg-blue-500/20 p-3 rounded-full text-blue-500"><Zap size={24}/></div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Asist Kralı</div>
                                        <div className="font-bold text-white text-lg">{summary.topAssister.name}</div>
                                        <div className="text-blue-400 font-mono font-bold">{summary.topAssister.count} Asist</div>
                                    </div>
                                </div>

                                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center gap-4">
                                    <div className="bg-yellow-500/20 p-3 rounded-full text-yellow-500"><Star size={24}/></div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">En Yüksek Reyting</div>
                                        <div className="font-bold text-white text-lg">{summary.topRated.name}</div>
                                        <div className="text-yellow-400 font-mono font-bold">{summary.topRated.rating} Ort.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'TRANSFERS' && (
                        <div className="animate-in slide-in-from-right-4">
                            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                                <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                                    <h3 className="font-bold text-white">Bu Sezon Transfer Edilenler</h3>
                                    <div className="text-xs text-slate-400 font-mono">Toplam: {summary.transfersIn.length} Oyuncu</div>
                                </div>
                                {summary.transfersIn.length === 0 ? (
                                    <div className="p-12 text-center text-slate-500 italic">Bu sezon transfer yapılmadı.</div>
                                ) : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-950 text-slate-500 uppercase text-xs font-bold">
                                            <tr>
                                                <th className="p-4">Oyuncu</th>
                                                <th className="p-4 text-right">Bonservis</th>
                                                <th className="p-4 text-center">Maç/Gol/Asist</th>
                                                <th className="p-4 text-center">Reyting</th>
                                                <th className="p-4 text-center">Verim</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {summary.transfersIn.map((t, i) => {
                                                // Simple efficiency calculation
                                                let efficiency = 'Düşük';
                                                let effColor = 'text-red-500';
                                                
                                                if (t.rating > 7.0) { efficiency = 'Yüksek'; effColor = 'text-green-500'; }
                                                else if (t.rating > 6.5) { efficiency = 'Orta'; effColor = 'text-yellow-500'; }

                                                return (
                                                    <tr key={i} className="hover:bg-slate-700/50 transition">
                                                        <td className="p-4 font-bold text-white">{t.name}</td>
                                                        <td className="p-4 text-right font-mono text-red-400">-{t.fee} M€</td>
                                                        <td className="p-4 text-center text-slate-300 font-mono">
                                                            ? / <span className="text-green-400">{t.goals}</span> / <span className="text-blue-400">{t.assists}</span>
                                                        </td>
                                                        <td className="p-4 text-center font-bold text-yellow-500">{t.rating || '-'}</td>
                                                        <td className={`p-4 text-center font-bold ${effColor} uppercase text-xs`}>{efficiency}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default SeasonSummaryModal;
