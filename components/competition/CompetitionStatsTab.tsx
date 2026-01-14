
import React from 'react';
import { Player } from '../../types';
import { Goal, Star, Zap, Shield, Award, AlertTriangle } from 'lucide-react';
import PlayerFace from '../shared/PlayerFace';

interface CompetitionStatsTabProps {
    statTab: 'GOAL' | 'RATING' | 'ASSIST' | 'CLEANSHEET' | 'MVP' | 'CARD';
    setStatTab: (tab: 'GOAL' | 'RATING' | 'ASSIST' | 'CLEANSHEET' | 'MVP' | 'CARD') => void;
    players: (Player & { teamName: string, teamLogo?: string, compStats: any, displayValue: string })[];
    onPlayerClick: (p: Player) => void;
}

const CompetitionStatsTab: React.FC<CompetitionStatsTabProps> = ({ statTab, setStatTab, players, onPlayerClick }) => {
    return (
        <div className="h-full flex flex-col">
            <div className="bg-[#252525] border-b border-[#333] p-2 flex gap-2 overflow-x-auto no-scrollbar">
                {[
                    { id: 'GOAL', label: 'GOL', icon: Goal },
                    { id: 'RATING', label: 'PUAN', icon: Star },
                    { id: 'ASSIST', label: 'ASİST', icon: Zap },
                    { id: 'CLEANSHEET', label: 'GOL YEMEME', icon: Shield },
                    { id: 'MVP', label: 'MVP', icon: Award },
                    { id: 'CARD', label: 'KART', icon: AlertTriangle }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setStatTab(tab.id as any)} 
                        className={`px-4 py-2 rounded text-xs font-bold transition flex items-center gap-1 ${statTab === tab.id ? 'bg-[#ff9f43] text-black border-[#ff9f43]' : 'bg-[#333] text-slate-400 border-[#444] hover:bg-[#444]'}`}
                    >
                        <tab.icon size={10} /> {tab.label}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-[#111] text-xs uppercase text-slate-500 font-bold sticky top-0 z-10">
                        <tr>
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3">Oyuncu</th>
                            <th className="p-3">Takım</th>
                            <th className="p-3 text-center">Maç</th>
                            <th className="p-3 text-right text-[#ff9f43]">Değer</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333]">
                        {players.map((p, i) => (
                            <tr key={p.id} className="hover:bg-[#252525] transition cursor-pointer" onClick={() => onPlayerClick(p)}>
                                <td className="p-3 text-center font-mono text-slate-500">{i+1}</td>
                                <td className="p-3 font-bold text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-600"><PlayerFace player={p} /></div>
                                    {p.name}
                                </td>
                                <td className="p-3 text-slate-400">{p.teamName}</td>
                                <td className="p-3 text-center font-mono text-slate-500">{p.compStats.matches}</td>
                                <td className="p-3 text-right font-black text-[#ff9f43] text-lg font-mono">{p.displayValue}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CompetitionStatsTab;
