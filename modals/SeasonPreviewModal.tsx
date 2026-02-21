
import React, { useMemo } from 'react';
import { Team, Player, Position } from '../types';
import { X, Trophy, TrendingUp, DollarSign, Users, Star, ArrowRightLeft, Shield, Briefcase } from 'lucide-react';
import PitchVisual from '../components/shared/PitchVisual';
import PlayerFace from '../components/shared/PlayerFace';
import { calculateRawTeamStrength } from '../utils/teamCalculations';

interface SeasonPreviewModalProps {
    competitionName: string;
    teams: Team[];
    onClose: () => void;
    onPlayerClick: (p: Player) => void;
    onTeamClick: (id: string) => void;
}

const SeasonPreviewModal: React.FC<SeasonPreviewModalProps> = ({ competitionName, teams, onClose, onPlayerClick, onTeamClick }) => {
    
    // --- 1. CALCULATE ODDS ---
    const oddsList = useMemo(() => {
        // Sort teams by strength descending
        const sorted = [...teams].sort((a, b) => b.strength - a.strength);
        
        // Base margin for odds
        const topStrength = sorted[0]?.strength || 100;
        
        return sorted.map((t, index) => {
            // Formula: Higher strength -> Lower odd
            // Diff from top team increases odd exponentially
            const diff = topStrength - t.strength;
            let odd = 0;
            
            if (index === 0) odd = 2.10; // Favorite base
            else if (index === 1) odd = 2.75;
            else if (index === 2) odd = 3.50;
            else {
                // Exponential growth for weaker teams
                odd = 4.00 + Math.pow(diff, 1.4) + (index * 2);
            }
            
            // Round nicely
            if (odd > 1000) odd = 1000;
            else if (odd > 100) odd = Math.ceil(odd / 10) * 10;
            else if (odd > 20) odd = Math.ceil(odd);
            else odd = Math.round(odd * 100) / 100;

            return { team: t, odd: odd.toFixed(2) };
        });
    }, [teams]);

    // --- 2. SELECT DREAM XI ---
    const dreamXI = useMemo(() => {
        // Map players and inject club name for the visualizer
        const allPlayers = teams.flatMap(t => t.players.map(p => ({ ...p, clubName: t.name })));
        
        const getBest = (pos: Position, excludeIds: string[], count: number = 1) => {
            return allPlayers
                .filter(p => p.position === pos && !excludeIds.includes(p.id))
                .sort((a, b) => b.skill - a.skill)
                .slice(0, count);
        };

        const selectedPlayers: Player[] = [];
        const ids: string[] = [];

        // 4-3-3 Formation
        const gk = getBest(Position.GK, ids)[0]; if(gk) { selectedPlayers.push(gk); ids.push(gk.id); }
        const lb = getBest(Position.SLB, ids)[0]; if(lb) { selectedPlayers.push(lb); ids.push(lb.id); }
        const cbs = getBest(Position.STP, ids, 2); cbs.forEach(p => { selectedPlayers.push(p); ids.push(p.id); });
        const rb = getBest(Position.SGB, ids)[0]; if(rb) { selectedPlayers.push(rb); ids.push(rb.id); }
        const dms = getBest(Position.OS, ids, 3); dms.forEach(p => { selectedPlayers.push(p); ids.push(p.id); }); // Midfield trio
        const lw = getBest(Position.SLK, ids)[0]; if(lw) { selectedPlayers.push(lw); ids.push(lw.id); }
        const st = getBest(Position.SNT, ids)[0]; if(st) { selectedPlayers.push(st); ids.push(st.id); }
        const rw = getBest(Position.SGK, ids)[0]; if(rw) { selectedPlayers.push(rw); ids.push(rw.id); }

        // Fallback filling if specific positions missing (rare but safe)
        while(selectedPlayers.length < 11) {
             const filler = allPlayers.find(p => !ids.includes(p.id));
             if(filler) { selectedPlayers.push(filler); ids.push(filler.id); }
             else break;
        }

        return selectedPlayers;
    }, [teams]);

    // --- 3. KEY PLAYERS & STATS ---
    const starPlayer = dreamXI.length > 0 ? [...dreamXI].sort((a,b) => b.skill - a.skill)[0] : null;
    const topKeyPlayers = dreamXI.filter(p => p.id !== starPlayer?.id).slice(0, 4);

    const transferStats = useMemo(() => {
        let totalSpent = 0;
        let incomingCount = 0;
        let foreignCount = 0;
        let totalPlayers = 0;

        // Helper to parse "12.5 M€" or "500 Bin €"
        const parsePrice = (priceStr: string) => {
             const cleanStr = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
             let val = parseFloat(cleanStr);
             if (isNaN(val)) return 0;
             if (priceStr.includes('Bin')) val = val / 1000;
             return val;
        };

        teams.forEach(t => {
            // Calculate Foreign Ratio based on current squad
            t.players.forEach(p => {
                totalPlayers++;
                if (p.nationality !== 'Türkiye') foreignCount++;
            });

            // Calculate Transfers based on history
            if (t.transferHistory) {
                t.transferHistory.forEach(h => {
                    // Count both BOUGHT and LOAN_IN
                    if (h.type === 'BOUGHT' || h.type === 'LOAN_IN') {
                        incomingCount++;
                        totalSpent += parsePrice(h.price);
                    }
                });
            }
        });

        const foreignRatio = totalPlayers > 0 ? Math.round((foreignCount / totalPlayers) * 100) : 0;

        return { totalSpent, incomingCount, foreignRatio };
    }, [teams]);

    return (
        <div className="fixed inset-0 z-[250] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-500 overflow-hidden">
            <div className="w-full max-w-7xl h-[90vh] bg-[#1a1f26] border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-50 p-2 bg-slate-800/80 hover:bg-red-600 rounded-full text-white transition border border-slate-600 hover:border-red-500 shadow-lg"
                >
                    <X size={24} />
                </button>

                {/* Content Grid */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                        
                        {/* LEFT COLUMN: ODDS (3 Cols) */}
                        <div className="lg:col-span-3 flex flex-col gap-4">
                            <div className="bg-[#242a33] rounded-xl border border-slate-700 overflow-hidden flex-1 flex flex-col">
                                <div className="p-4 bg-[#2d353f] border-b border-slate-700 flex justify-between items-center">
                                    <h3 className="font-bold text-white text-sm uppercase">Şampiyonluk Oranları</h3>
                                    <TrendingUp size={16} className="text-green-500"/>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-[#1f252b] text-slate-500 text-xs uppercase font-bold sticky top-0">
                                            <tr>
                                                <th className="p-3 w-8">#</th>
                                                <th className="p-3">Takım</th>
                                                <th className="p-3 text-right">Oran</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50">
                                            {oddsList.map((item, idx) => (
                                                <tr key={item.team.id} className="hover:bg-slate-700/30 transition cursor-pointer" onClick={() => onTeamClick(item.team.id)}>
                                                    <td className="p-3 text-slate-500 font-mono text-xs">{idx + 1}</td>
                                                    <td className="p-3 font-bold text-slate-200 flex items-center gap-2">
                                                        {item.team.logo && <img src={item.team.logo} className="w-4 h-4 object-contain"/>}
                                                        <span className="truncate max-w-[120px]">{item.team.name}</span>
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-black text-yellow-500">{item.odd}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* MIDDLE COLUMN: DREAM XI & STAR (6 Cols) */}
                        <div className="lg:col-span-6 flex flex-col gap-6">
                            
                            {/* Featured Star */}
                            {starPlayer && (
                                <div className="bg-gradient-to-r from-slate-800 to-[#2d353f] p-4 rounded-xl border border-slate-600 flex items-center gap-6 shadow-lg relative overflow-hidden group cursor-pointer" onClick={() => onPlayerClick(starPlayer)}>
                                    <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-yellow-500/10 to-transparent pointer-events-none"></div>
                                    <div className="w-20 h-20 rounded-full border-4 border-yellow-500 bg-slate-400 overflow-hidden shadow-2xl relative z-10 shrink-0">
                                        <PlayerFace player={starPlayer} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-yellow-500 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <Star size={12} fill="currentColor"/> Medyanın Favorisi
                                        </div>
                                        <div className="text-2xl font-black text-white leading-none mb-1">{starPlayer.name}</div>
                                        <div className="flex items-center gap-2 text-sm text-slate-300">
                                            <span className="bg-slate-900 px-2 py-0.5 rounded font-bold border border-slate-600">{starPlayer.position}</span>
                                            <span>{starPlayer.clubName || teams.find(t=>t.id===starPlayer.teamId)?.name}</span>
                                        </div>
                                    </div>
                                    <div className="ml-auto relative z-10 flex flex-col items-end">
                                        <div className="text-4xl font-black text-white opacity-20 group-hover:opacity-100 transition-opacity">{starPlayer.skill}</div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Genel Güç</div>
                                    </div>
                                </div>
                            )}

                            {/* Dream XI Pitch */}
                            <div className="flex-1 bg-[#242a33] rounded-xl border border-slate-700 overflow-hidden flex flex-col">
                                <div className="p-3 bg-[#2d353f] border-b border-slate-700 flex justify-between items-center">
                                    <h3 className="font-bold text-white text-sm uppercase flex items-center gap-2">
                                        <Shield size={16} className="text-blue-400"/> Basının Seçtiği Rüya Takım
                                    </h3>
                                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">4-3-3</span>
                                </div>
                                <div className="flex-1 relative bg-[#1a4a35] shadow-inner p-4">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                                    {/* Pitch Lines Overlay */}
                                    <div className="absolute inset-4 border-2 border-white/20 rounded-lg pointer-events-none"></div>
                                    <div className="absolute top-1/2 left-4 right-4 h-px bg-white/20 pointer-events-none"></div>
                                    <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                                    <div className="h-full w-full">
                                        <PitchVisual 
                                            players={dreamXI} 
                                            onPlayerClick={onPlayerClick} 
                                            selectedPlayerId={null}
                                            formation="4-3-3"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: KEY PLAYERS & TRANSFERS (3 Cols) */}
                        <div className="lg:col-span-3 flex flex-col gap-6">
                            
                            {/* Key Players List */}
                            <div className="bg-[#242a33] rounded-xl border border-slate-700 p-4 flex-1">
                                <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                                    <h3 className="font-bold text-slate-300 text-sm uppercase">Kilit Oyuncular</h3>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {topKeyPlayers.map(p => {
                                        const t = teams.find(tm => tm.id === p.teamId);
                                        return (
                                            <div key={p.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => onPlayerClick(p)}>
                                                <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-500 overflow-hidden shrink-0">
                                                    <PlayerFace player={p} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-white truncate group-hover:text-yellow-400 transition-colors">{p.name}</div>
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                        {t?.logo && <img src={t.logo} className="w-3 h-3 object-contain"/>}
                                                        <span className="truncate">{t?.name}</span>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-black text-slate-500">{p.skill}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Transfer Summary Card */}
                            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl border border-slate-700 p-5 shadow-lg">
                                <h3 className="font-bold text-pink-400 text-sm uppercase mb-4 border-b border-white/10 pb-2">Gelenler Gidenler</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-500/20 p-2 rounded-lg text-green-400"><Users size={18}/></div>
                                            <div>
                                                <div className="text-xl font-black text-white">{transferStats.incomingCount}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold">Gelen Transfer</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><Users size={18}/></div>
                                            <div>
                                                <div className="text-xl font-black text-white">%{transferStats.foreignRatio}</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold">Yabancı Oyuncu</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-400"><DollarSign size={18}/></div>
                                            <div>
                                                <div className="text-xl font-black text-white">{transferStats.totalSpent.toFixed(1)} M€</div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold">Toplam Harcama</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default SeasonPreviewModal;
