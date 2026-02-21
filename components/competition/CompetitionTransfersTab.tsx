
import React, { useState, useMemo } from 'react';
import { Team, Player } from '../../types';
import { ArrowLeftCircle, ArrowRightCircle, ArrowUpDown, ArrowUp, ArrowDown, Clock, Handshake, Globe, Coins, Wallet, ArrowRightLeft, ArrowRight } from 'lucide-react';
import PlayerFace from '../shared/PlayerFace';

interface TransferItem {
    date: string;
    playerName: string;
    teamName: string; // The team belonging to this competition context
    teamLogo?: string;
    teamColors: [string, string];
    counterparty: string;
    price: string;
    type: 'BOUGHT' | 'SOLD' | 'LOAN_IN' | 'LOAN_OUT';
}

interface CompetitionTransfersTabProps {
    transfers: TransferItem[];
    teams: Team[];
    onPlayerClick: (p: Player) => void;
    onTeamClick: (id: string) => void;
    currentDate: string; // Added Prop
}

const CompetitionTransfersTab: React.FC<CompetitionTransfersTabProps> = ({ transfers, teams, onPlayerClick, onTeamClick, currentDate }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // Helper to find player by name (Best effort since ID isn't in historic transfer record)
    const handlePlayerClick = (name: string) => {
        // Search through all teams to find the player
        for (const team of teams) {
            const player = team.players.find(p => p.name === name);
            if (player) {
                onPlayerClick(player);
                return;
            }
        }
    };

    // Helper to get Player Object for UI (Face/Age/Pos)
    const getPlayerObj = (name: string) => {
        for (const t of teams) {
            const p = t.players.find(player => player.name === name);
            if (p) return p;
        }
        return null;
    };

    // Helper to find team by name
    const handleTeamClick = (name: string) => {
        const team = teams.find(t => t.name === name);
        if (team) {
            onTeamClick(team.id);
        }
    };

    // Helper for date parsing (e.g. "15 Ağu")
    const parseDateValue = (dateStr: string) => {
        const parts = dateStr.split(' ');
        if (parts.length < 2) return 0;
        const day = parseInt(parts[0]) || 0;
        const monthStr = parts[1];
        
        const months = ['Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara', 'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz'];
        const monthIndex = months.indexOf(monthStr);
        
        // Return a comparable number: Month * 100 + Day
        return (monthIndex * 100) + day;
    };

    // Helper for price parsing (e.g. "12.5 M€", "500 Bin €")
    const parsePriceValue = (priceStr: string) => {
        // Remove currency symbols and +/- signs
        const cleanStr = priceStr.replace(/[^\d.,KMmBb]/g, '').replace(',', '.');
        let val = parseFloat(cleanStr);
        
        if (isNaN(val)) return 0;

        if (priceStr.includes('Bin')) {
            val = val / 1000; // Convert to Millions
        }
        return val;
    };

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        
        // Smart defaults
        if (!sortConfig || sortConfig.key !== key) {
            if (key === 'price' || key === 'date') direction = 'desc';
            else direction = 'asc';
        } else {
            // Toggle
            direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        }
        
        setSortConfig({ key, direction });
    };

    const sortedTransfers = useMemo(() => {
        if (!sortConfig) return transfers;

        return [...transfers].sort((a, b) => {
            let valA: any = a[sortConfig.key as keyof TransferItem];
            let valB: any = b[sortConfig.key as keyof TransferItem];

            if (sortConfig.key === 'date') {
                valA = parseDateValue(valA);
                valB = parseDateValue(valB);
            } else if (sortConfig.key === 'price') {
                valA = parsePriceValue(valA);
                valB = parsePriceValue(valB);
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [transfers, sortConfig]);

    // --- STATISTICS CALCULATION ---
    const stats = useMemo(() => {
        let totalCount = 0;
        let foreignCount = 0;
        let totalSpent = 0;
        let totalIncome = 0;
        let boughtCount = 0;

        transfers.forEach(t => {
            totalCount++;
            const val = parsePriceValue(t.price);

            // Try to find player to check nationality
            let playerRef: Player | undefined;
            for (const team of teams) {
                const found = team.players.find(p => p.name === t.playerName);
                if (found) {
                    playerRef = found;
                    break;
                }
            }

            // Estimate nationality if player not found (simple logic or skip)
            if (playerRef && playerRef.nationality !== 'Türkiye') {
                foreignCount++;
            }

            if (t.type === 'BOUGHT' || t.type === 'LOAN_IN') {
                totalSpent += val;
                if (t.type === 'BOUGHT') boughtCount++;
            } else {
                totalIncome += val;
            }
        });

        return {
            totalCount,
            foreignRatio: totalCount > 0 ? Math.round((foreignCount / totalCount) * 100) : 0,
            avgFee: boughtCount > 0 ? totalSpent / boughtCount : 0,
            totalSpent,
            netSpend: totalSpent - totalIncome
        };
    }, [transfers, teams]);

    // --- TOP 4 BIGGEST TRANSFERS ---
    const topTransfers = useMemo(() => {
        return [...transfers]
            .sort((a, b) => parsePriceValue(b.price) - parsePriceValue(a.price))
            .slice(0, 4);
    }, [transfers]);


    // --- DEADLINE CALCULATION ---
    const getTransferStatus = () => {
        const now = new Date(currentDate);
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-indexed

        let targetDate = null;
        let label = "Transfer Dönemi Kapalı";
        let isOpen = false;

        // Summer Window: July (6), August (7) -> Target Sept 1
        if (month === 6 || month === 7) {
            targetDate = new Date(year, 8, 1); // 1 Sept
            isOpen = true;
        }
        // Winter Window: Jan (0) -> Target Feb 1
        else if (month === 0) {
            targetDate = new Date(year, 1, 1); // 1 Feb
            isOpen = true;
        }
        // Late Summer Deadline day (1 Sept)
        else if (month === 8 && now.getDate() <= 1) {
            targetDate = new Date(year, 8, 2); // End of day 1
            isOpen = true;
        }
        // Late Winter Deadline day (1 Feb)
        else if (month === 1 && now.getDate() <= 1) {
            targetDate = new Date(year, 1, 2); // End of day 1
            isOpen = true;
        }

        if (isOpen && targetDate) {
            const diffTime = targetDate.getTime() - now.getTime();
            if (diffTime > 0) {
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const weeks = Math.floor(diffDays / 7);
                const remainingDays = diffDays % 7;
                
                if (diffDays === 0) label = "Transfer döneminin bitmesine: Son Gün!";
                else label = `Transfer döneminin bitmesine: ${weeks > 0 ? `${weeks} hafta ` : ''}${remainingDays} gün`;
            }
        }

        return { label, isOpen };
    };

    const statusInfo = getTransferStatus();

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown size={12} className="text-slate-600 ml-1 opacity-50 group-hover:opacity-100" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-yellow-500 ml-1" /> : <ArrowDown size={12} className="text-yellow-500 ml-1" />;
    };

    // Helper to format money for the summary box
    const formatStatMoney = (val: number) => {
        if (Math.abs(val) >= 1000) return `${(val/1000).toFixed(1)} MR €`;
        return `${val.toFixed(1)} M €`;
    };

    return (
        <div className="flex flex-col h-full bg-[#1b1b1b]">
            
            {/* --- TOP WIDGETS CONTAINER --- */}
            <div className="p-4 space-y-4 shrink-0 pb-2">
                
                {/* 1. SUMMARY CARD (SEPARATED WIDGET) */}
                <div className="bg-[#242931] border border-slate-700/50 rounded-xl overflow-hidden shadow-md">
                    {/* Card Header */}
                    <div className="p-3 border-b border-slate-700 bg-[#21242c] flex items-center justify-between">
                         <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Clock size={16} className="text-blue-500"/> Transfer Dönemi Özeti
                        </h3>
                        <div className={`flex items-center gap-2 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${statusInfo.isOpen ? 'bg-[#ff9f43]/10 border-[#ff9f43]/30 text-[#ff9f43]' : 'bg-red-900/10 border-red-800/30 text-red-500'}`}>
                            {statusInfo.isOpen && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>}
                            {statusInfo.label}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-700 bg-[#1e232e]">
                        {/* Stat 1: Biten Transferler */}
                        <div className="p-3 flex flex-col items-center justify-center gap-1 group hover:bg-[#2a3038] transition-colors">
                            <div className="flex items-center gap-2 text-cyan-400 group-hover:scale-110 transition-transform">
                                <div className="bg-cyan-500/20 p-1.5 rounded-full">
                                    <Handshake size={18} />
                                </div>
                                <span className="text-xl font-black text-white">{stats.totalCount}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center">BİTEN TRANSFERLER</span>
                        </div>

                        {/* Stat 2: Yabancı Oyuncu */}
                        <div className="p-3 flex flex-col items-center justify-center gap-1 group hover:bg-[#2a3038] transition-colors">
                            <div className="flex items-center gap-2 text-indigo-400 group-hover:scale-110 transition-transform">
                                <div className="bg-indigo-500/20 p-1.5 rounded-full">
                                    <Globe size={18} />
                                </div>
                                <span className="text-xl font-black text-white">%{stats.foreignRatio}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center">YABANCI OYUNCU</span>
                        </div>

                        {/* Stat 3: Ortalama Bonservis */}
                        <div className="p-3 flex flex-col items-center justify-center gap-1 group hover:bg-[#2a3038] transition-colors">
                            <div className="flex items-center gap-2 text-yellow-400 group-hover:scale-110 transition-transform">
                                <div className="bg-yellow-500/20 p-1.5 rounded-full">
                                    <Coins size={18} />
                                </div>
                                <span className="text-lg font-black text-white">{formatStatMoney(stats.avgFee)}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center">ORT. BONSERVİS</span>
                        </div>

                        {/* Stat 4: Toplam Harcanan */}
                        <div className="p-3 flex flex-col items-center justify-center gap-1 group hover:bg-[#2a3038] transition-colors">
                            <div className="flex items-center gap-2 text-red-400 group-hover:scale-110 transition-transform">
                                <div className="bg-red-500/20 p-1.5 rounded-full">
                                    <Wallet size={18} />
                                </div>
                                <span className="text-lg font-black text-white">{formatStatMoney(stats.totalSpent)}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center">HARCANAN</span>
                        </div>

                        {/* Stat 5: Net Harcanan */}
                        <div className="p-3 flex flex-col items-center justify-center gap-1 col-span-2 md:col-span-1 group hover:bg-[#2a3038] transition-colors">
                            <div className={`flex items-center gap-2 group-hover:scale-110 transition-transform ${stats.netSpend > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                                <div className={`${stats.netSpend > 0 ? 'bg-orange-500/20' : 'bg-green-500/20'} p-1.5 rounded-full`}>
                                    <ArrowRightLeft size={18} />
                                </div>
                                <span className="text-lg font-black text-white">{formatStatMoney(stats.netSpend)}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center">NET AKIŞ</span>
                        </div>
                    </div>
                </div>

                {/* 2. BIGGEST TRANSFERS CARD (SEPARATED WIDGET) */}
                {topTransfers.length > 0 && (
                    <div className="bg-[#242931] border border-slate-700/50 rounded-xl overflow-hidden shadow-md">
                        <div className="p-3 border-b border-slate-700 bg-[#21242c] flex items-center gap-2">
                            <ArrowUp size={18} className="text-green-500" />
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">En Büyük Transferler</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/50 bg-[#1e232e]">
                            {topTransfers.map((t, i) => {
                                const playerObj = getPlayerObj(t.playerName);
                                
                                const isArrival = t.type === 'BOUGHT' || t.type === 'LOAN_IN';
                                const fromTeam = isArrival ? t.counterparty : t.teamName;
                                const toTeam = isArrival ? t.teamName : t.counterparty;
                                const isLoan = t.type === 'LOAN_IN' || t.type === 'LOAN_OUT';

                                return (
                                    <div 
                                        key={i} 
                                        className="p-3 flex items-center gap-3 hover:bg-[#252a30] transition cursor-pointer group" 
                                        onClick={() => handlePlayerClick(t.playerName)}
                                    >
                                        {/* Face */}
                                        <div className="w-12 h-12 rounded-full bg-slate-700 border-2 border-slate-600 overflow-hidden shrink-0 shadow-lg group-hover:border-yellow-500 transition-colors">
                                            {playerObj ? <PlayerFace player={playerObj} /> : <div className="w-full h-full bg-slate-500 flex items-center justify-center text-white font-bold">{t.playerName.charAt(0)}</div>}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <div>
                                                    <div className="text-white font-bold text-xs truncate max-w-[100px] group-hover:text-yellow-400 transition-colors">{t.playerName}</div>
                                                    <div className="text-[9px] text-slate-400">
                                                        {playerObj ? `${playerObj.age} yaş, ${playerObj.position}` : 'Oyuncu Bilgisi Yok'}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="text-green-400 font-black font-mono text-xs mb-1.5">{t.price}</div>

                                            {/* Transfer Path */}
                                            <div className="flex items-center gap-2 text-[9px] text-slate-300 bg-black/20 p-1 rounded border border-slate-700/50">
                                                <span className="truncate flex-1 text-right text-slate-400">{fromTeam}</span>
                                                <ArrowRight size={10} className="text-slate-500 shrink-0"/>
                                                <span className="truncate flex-1 text-left font-bold text-white">{toTeam}</span>
                                            </div>
                                            {isLoan && <div className="text-[8px] text-blue-300 font-bold uppercase mt-1 text-center bg-blue-900/20 py-0.5 rounded">Kiralık</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* --- MAIN TABLE --- */}
            <div className="flex-1 overflow-y-auto custom-scrollbar border-t border-slate-700 bg-[#1b1b1b]">
                {transfers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 italic">Transfer bulunamadı.</div>
                ) : (
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-[#111] text-xs uppercase text-slate-500 font-bold sticky top-0 z-10 shadow-md">
                            <tr>
                                <th className="p-3 w-24 cursor-pointer hover:bg-[#222] group select-none transition-colors" onClick={() => requestSort('date')}>
                                    <div className="flex items-center">Tarih <SortIcon columnKey="date"/></div>
                                </th>
                                <th className="p-3 w-10 text-center cursor-pointer hover:bg-[#222] group select-none transition-colors" onClick={() => requestSort('type')}>
                                    <div className="flex items-center justify-center">İşlem <SortIcon columnKey="type"/></div>
                                </th>
                                <th className="p-3 cursor-pointer hover:bg-[#222] group select-none transition-colors" onClick={() => requestSort('playerName')}>
                                    <div className="flex items-center">Oyuncu <SortIcon columnKey="playerName"/></div>
                                </th>
                                <th className="p-3 cursor-pointer hover:bg-[#222] group select-none transition-colors" onClick={() => requestSort('teamName')}>
                                    <div className="flex items-center">Kulüp <SortIcon columnKey="teamName"/></div>
                                </th>
                                <th className="p-3 cursor-pointer hover:bg-[#222] group select-none transition-colors" onClick={() => requestSort('counterparty')}>
                                    <div className="flex items-center">Karşı Kulüp <SortIcon columnKey="counterparty"/></div>
                                </th>
                                <th className="p-3 text-right cursor-pointer hover:bg-[#222] group select-none transition-colors" onClick={() => requestSort('price')}>
                                    <div className="flex items-center justify-end">Bedel <SortIcon columnKey="price"/></div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#333]">
                            {sortedTransfers.map((t, i) => {
                                const isArrival = t.type === 'BOUGHT' || t.type === 'LOAN_IN';
                                const isLoan = t.type === 'LOAN_IN' || t.type === 'LOAN_OUT';

                                return (
                                    <tr key={i} className="hover:bg-[#252525] transition">
                                        <td className="p-3 text-xs text-slate-500">{t.date}</td>
                                        <td className="p-3 text-center">
                                            <div className="flex justify-center" title={isArrival ? 'Gelen Transfer' : 'Giden Transfer'}>
                                                {isArrival ? (
                                                    <ArrowRightCircle size={18} className="text-green-500"/>
                                                ) : (
                                                    <ArrowLeftCircle size={18} className="text-red-500"/>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 font-bold text-white">
                                            <span 
                                                onClick={() => handlePlayerClick(t.playerName)}
                                                className="hover:text-yellow-400 hover:underline cursor-pointer transition-colors"
                                            >
                                                {t.playerName}
                                            </span>
                                            {isLoan && <span className="ml-2 text-[9px] bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Kiralık</span>}
                                        </td>
                                        <td className="p-3 font-bold text-slate-200">
                                            <span 
                                                onClick={() => handleTeamClick(t.teamName)}
                                                className="hover:text-white hover:underline cursor-pointer transition-colors"
                                            >
                                                {t.teamName}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-400">
                                            <span 
                                                onClick={() => handleTeamClick(t.counterparty)}
                                                className="hover:text-slate-200 hover:underline cursor-pointer transition-colors"
                                            >
                                                {t.counterparty}
                                            </span>
                                        </td>
                                        <td className={`p-3 text-right font-mono font-bold ${isArrival ? 'text-red-400' : 'text-green-400'}`}>
                                            {isArrival ? '-' : '+'}{t.price.replace('-', '')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CompetitionTransfersTab;
