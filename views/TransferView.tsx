
import React, { useState, useMemo } from 'react';
import { Player, Team, IncomingOffer } from '../types';
import { Lock, ChevronLeft, ChevronRight, ArrowUpDown, Filter, Search, X, Check, AlertCircle, Plane, Coins, Maximize2, Minimize2, Unlock, List, Wallet, Briefcase, Mail, Handshake, ArrowRight } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';
import { calculatePlayerWage } from '../utils/teamCalculations';

interface TransferViewProps {
    transferList: Player[];
    team: Team;
    budget: number;
    isWindowOpen: boolean;
    onBuy: (p: Player) => void;
    onSell: (p: Player) => void; 
    onPlayerClick: (p: Player) => void;
    incomingOffers: IncomingOffer[];
    onAcceptOffer: (offer: IncomingOffer) => void;
    onRejectOffer: (offer: IncomingOffer) => void;
    onNegotiateOffer?: (offer: IncomingOffer) => void; // NEW
}

const TransferView: React.FC<TransferViewProps> = ({ transferList, team, budget, isWindowOpen, onBuy, onPlayerClick, incomingOffers, onAcceptOffer, onRejectOffer, onNegotiateOffer }) => {
    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'value', direction: 'desc' });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
    
    // Allow viewing list even if window is closed
    const [isListReviewMode, setIsListReviewMode] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        minSkill: 0,
        maxAge: 40,
        position: 'ALL',
        onlyAffordable: false
    });

    // --- LOGIC ---

    const getInterestLevel = (player: Player) => {
        if (player.value > budget * 3) return 'NONE';
        if (player.skill > team.strength + 10) return 'LOW';
        if (player.clubName === 'Serbest' || !player.clubName) return 'HIGH';
        return 'MEDIUM';
    };

    const renderInterestIcon = (level: string) => {
        switch (level) {
            case 'HIGH': return <span className="bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">İstiyor</span>;
            case 'MEDIUM': return <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">Belki</span>;
            case 'LOW': return <span className="bg-orange-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">Zor</span>;
            default: return <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Hayır</span>;
        }
    };

    const getPosBadgeColor = (pos: string) => {
        if (pos === 'GK') return 'bg-yellow-600';
        if (['SLB', 'STP', 'SGB'].includes(pos)) return 'bg-blue-600';
        if (['OS', 'OOS'].includes(pos)) return 'bg-green-600';
        return 'bg-red-600';
    };

    const getSkillColor = (val: number) => {
        if (val >= 85) return 'text-green-400';
        if (val >= 75) return 'text-blue-400';
        if (val >= 65) return 'text-yellow-400';
        return 'text-slate-400';
    };

    // --- FILTERING & SORTING ---

    const filteredList = useMemo(() => {
        return transferList.filter(p => {
            if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (p.skill < filters.minSkill) return false;
            if (p.age > filters.maxAge) return false;
            if (filters.position !== 'ALL' && p.position !== filters.position) return false;
            if (filters.onlyAffordable && p.value > budget) return false;
            return true;
        }).sort((a, b) => {
            const { key, direction } = sortConfig;
            let valA: any = (a as any)[key];
            let valB: any = (b as any)[key];
            if (key === 'wage') {
                valA = a.wage !== undefined ? a.wage : calculatePlayerWage(a);
                valB = b.wage !== undefined ? b.wage : calculatePlayerWage(b);
            }
            if (typeof valA === 'string') {
                return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [transferList, searchTerm, filters, sortConfig, budget]);

    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const currentData = filteredList.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const totalWages = team.players.reduce((sum, p) => sum + (p.wage !== undefined ? p.wage : calculatePlayerWage(p)), 0);
    const wageBudget = team.wageBudget || totalWages * 1.1; 
    const remainingWageBudget = Math.max(0, wageBudget - totalWages);

    const SortHeader = ({ label, sKey, className = "" }: { label: string, sKey: string, className?: string }) => (
        <th 
            onClick={() => handleSort(sKey)}
            className={`p-3 text-left cursor-pointer hover:bg-slate-700/50 transition select-none ${className}`}
        >
            <div className="flex items-center gap-1 text-slate-400 font-bold text-xs uppercase">
                {label}
                <ArrowUpDown size={12} className={sortConfig.key === sKey ? 'text-yellow-500 opacity-100' : 'opacity-30'}/>
            </div>
        </th>
    );

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-200 relative overflow-hidden">
            
            {/* INCOMING OFFERS MODAL */}
            {isOffersModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsOffersModalOpen(false)}>
                    <div className="bg-slate-800 w-full max-w-3xl rounded-xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Mail className="text-blue-500"/> Gelen Teklifler ({incomingOffers.length})
                            </h3>
                            <button onClick={() => setIsOffersModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                            {incomingOffers.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 italic">Şu an için gelen bir teklif bulunmuyor.</div>
                            ) : (
                                incomingOffers.map(offer => {
                                    // Find player object for click handler
                                    const playerObj = team.players.find(p => p.id === offer.playerId);
                                    const isLoan = offer.type === 'LOAN';
                                    
                                    return (
                                        <div key={offer.id} className={`border rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 ${isLoan ? 'bg-slate-700/50 border-cyan-700/50' : 'bg-slate-700 border-slate-600'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-full border ${isLoan ? 'bg-cyan-900/30 border-cyan-600 text-cyan-400' : 'bg-slate-800 border-slate-500 text-blue-400'}`}>
                                                    {isLoan ? <ArrowRight size={24}/> : <Briefcase size={24}/>}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-300">
                                                        {isLoan && <span className="text-[10px] bg-cyan-600 text-white px-2 py-0.5 rounded font-black uppercase mr-2 tracking-wider">KİRALIK</span>}
                                                        Oyuncu: 
                                                        <span 
                                                            className={`text-white text-lg ml-1 ${playerObj ? 'cursor-pointer hover:text-blue-400 hover:underline transition-colors' : ''}`}
                                                            onClick={(e) => {
                                                                if (playerObj) {
                                                                    e.stopPropagation();
                                                                    onPlayerClick(playerObj);
                                                                }
                                                            }}
                                                            title={playerObj ? "Oyuncu profiline git" : ""}
                                                        >
                                                            {offer.playerName}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-1">Talip Olan: <span className="font-bold text-white">{offer.fromTeamName}</span></div>
                                                    {isLoan && offer.loanDetails && (
                                                        <div className="mt-2 text-xs text-cyan-200 bg-cyan-900/20 px-2 py-1 rounded inline-block border border-cyan-800">
                                                            Maaş Katkısı: <span className="font-bold text-white">%{offer.loanDetails.wageContribution}</span> • Süre: <span className="font-bold text-white">{offer.loanDetails.duration}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="text-xs text-slate-400 uppercase font-bold">{isLoan ? 'Aylık Kiralama' : 'Bonservis Bedeli'}</div>
                                                    <div className="text-2xl font-black font-mono text-green-400">
                                                        {isLoan && offer.loanDetails 
                                                            ? formatLoanFee(offer.loanDetails.monthlyFee) 
                                                            : `${offer.amount.toFixed(1)} M€`
                                                        }
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => onAcceptOffer(offer)} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow"><Check size={14}/> Kabul</button>
                                                        {onNegotiateOffer && (
                                                            <button onClick={() => onNegotiateOffer(offer)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow"><Handshake size={14}/> Görüş</button>
                                                        )}
                                                    </div>
                                                    <button onClick={() => onRejectOffer(offer)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow justify-center"><X size={14}/> Reddet</button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!isWindowOpen && !isListReviewMode && (
                <div className="absolute inset-0 z-30 bg-slate-900/90 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm pointer-events-none">
                    <Lock size={64} className="text-slate-600 mb-4"/>
                    <h2 className="text-2xl font-bold text-white mb-2">Transfer Dönemi Kapalı</h2>
                    <p className="text-slate-400">Transfer sezonu dışında oyuncu alıp satamazsınız.</p>
                    <button 
                        onClick={() => setIsListReviewMode(true)} 
                        className="pointer-events-auto mt-6 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold transition"
                    >
                        Listeyi İncele
                    </button>
                </div>
            )}

            {/* --- TOP BAR: SEARCH & FILTERS --- */}
            <div className={`p-4 bg-slate-800 border-b border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0 transition-all duration-300 ${isExpanded ? '-mt-20 opacity-0 pointer-events-none absolute w-full' : ''}`}>
                <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                    <h2 className="text-xl font-bold text-white whitespace-nowrap hidden md:block">Transfer Merkezi</h2>
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                        <input 
                            type="text" 
                            placeholder="Oyuncu ara..." 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="text-xs text-slate-400 hidden md:block mr-2">
                        <span className="font-bold text-white">{totalItems}</span> Oyuncu Bulundu
                    </div>
                    
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition ${isFilterOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}
                    >
                        <Filter size={16}/> Filtreler
                    </button>
                </div>
            </div>

            {/* --- FILTER PANEL (Collapsible) --- */}
            {isFilterOpen && !isExpanded && (
                <div className="bg-slate-800 border-b border-slate-700 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shrink-0 animate-in slide-in-from-top-2">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mevki</label>
                        <select 
                            value={filters.position} 
                            onChange={(e) => { setFilters(prev => ({ ...prev, position: e.target.value })); setCurrentPage(1); }}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white outline-none"
                        >
                            <option value="ALL">Tümü</option>
                            <option value="GK">Kaleci</option>
                            <option value="STP">Stoper</option>
                            <option value="SLB">Sol Bek</option>
                            <option value="SGB">Sağ Bek</option>
                            <option value="OS">Orta Saha</option>
                            <option value="OOS">Ofansif OS</option>
                            <option value="SLK">Sol Kanat</option>
                            <option value="SGK">Sağ Kanat</option>
                            <option value="SNT">Forvet</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Min. Güç</label>
                        <input 
                            type="range" min="40" max="99" 
                            value={filters.minSkill} 
                            onChange={(e) => { setFilters(prev => ({ ...prev, minSkill: parseInt(e.target.value) })); setCurrentPage(1); }}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
                        />
                        <div className="text-right text-xs text-white mt-1">{filters.minSkill}+</div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Maks. Yaş</label>
                        <input 
                            type="range" min="16" max="40" 
                            value={filters.maxAge} 
                            onChange={(e) => { setFilters(prev => ({ ...prev, maxAge: parseInt(e.target.value) })); setCurrentPage(1); }}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
                        />
                        <div className="text-right text-xs text-white mt-1">{filters.maxAge}</div>
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer w-full p-2 bg-slate-900 border border-slate-700 rounded hover:bg-slate-700 transition">
                            <input 
                                type="checkbox" 
                                checked={filters.onlyAffordable}
                                onChange={(e) => { setFilters(prev => ({ ...prev, onlyAffordable: e.target.checked })); setCurrentPage(1); }}
                                className="w-4 h-4 accent-blue-500"
                            />
                            <span className="text-sm font-bold text-slate-300">Sadece Bütçeme Uygun</span>
                        </label>
                    </div>
                </div>
            )}

            {/* --- MAIN TABLE --- */}
            <div className={`flex-1 overflow-auto custom-scrollbar relative transition-all duration-500 ${isExpanded ? 'bg-slate-950' : ''}`}>
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-950 sticky top-0 z-10 shadow-md">
                        <tr>
                            <th className="p-3 w-10 text-center text-slate-500 font-bold">Bil</th>
                            <SortHeader label="Oyuncu" sKey="name" />
                            <SortHeader label="Ülke" sKey="nationality" />
                            <SortHeader label="Kulüp" sKey="clubName" />
                            <SortHeader label="Mevki" sKey="position" />
                            <SortHeader label="Yaş" sKey="age" />
                            <SortHeader label="Güç" sKey="skill" />
                            <SortHeader label="Potansiyel" sKey="potential" />
                            <SortHeader label="Piyasa Değeri" sKey="value" className="text-right"/>
                            <SortHeader label="Maaş" sKey="wage" className="text-right"/>
                            <th className="p-3 text-center text-slate-500 font-bold uppercase text-xs">İlgi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {currentData.map(p => {
                            const wage = p.wage !== undefined ? p.wage : calculatePlayerWage(p);
                            const interest = getInterestLevel(p);
                            const displayClub = p.clubName || (p.teamId === 'free_agent' ? 'Serbest' : 'Yurt Dışı Kulübü');

                            return (
                                <tr 
                                    key={p.id} 
                                    onClick={() => onPlayerClick(p)}
                                    className="bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer group"
                                >
                                    <td className="p-3 text-center">
                                        <div className="flex flex-col gap-1 items-center">
                                            {p.id === 'placeholder' && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600 shrink-0">
                                                <PlayerFace player={p} />
                                            </div>
                                            <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className="text-slate-400 text-xs font-mono uppercase">{p.nationality.substring(0, 3)}</span>
                                    </td>
                                    <td className="p-3 text-slate-300 text-xs truncate max-w-[120px]">
                                        {displayClub}
                                    </td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${getPosBadgeColor(p.position)}`}>
                                            {p.position}
                                        </span>
                                    </td>
                                    <td className="p-3 text-slate-300 font-mono">{p.age}</td>
                                    <td className="p-3">
                                        <span className={`font-black text-lg ${getSkillColor(p.skill)}`}>
                                            {p.skill}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`font-bold text-base ${getSkillColor(p.potential)}`}>
                                            {p.potential}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right font-mono font-bold text-slate-200">
                                        {p.value.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} M€
                                    </td>
                                    <td className="p-3 text-right font-mono text-slate-400 text-xs">
                                        {wage.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} M€/yıl
                                    </td>
                                    <td className="p-3 text-center">
                                        {renderInterestIcon(interest)}
                                    </td>
                                </tr>
                            );
                        })}
                        
                        {currentData.length === 0 && (
                            <tr>
                                <td colSpan={11} className="p-12 text-center text-slate-500 italic">
                                    Aradığınız kriterlere uygun oyuncu bulunamadı.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- PAGINATION & FOOTER --- */}
            {isExpanded && (
                <div className="absolute bottom-6 right-6 z-50 animate-in zoom-in">
                    <button 
                        onClick={() => setIsExpanded(false)}
                        className="bg-slate-800 text-white px-5 py-3 rounded-full border border-slate-600 shadow-2xl font-bold flex items-center gap-2 hover:bg-slate-700 hover:scale-105 transition hover:text-yellow-400"
                    >
                        <Minimize2 size={18}/> Paneli Göster
                    </button>
                </div>
            )}

            {!isExpanded && (
                <div className="bg-slate-950 border-t border-slate-800 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-20 relative">
                    
                    <div className="absolute -top-8 right-4">
                        <button 
                            onClick={() => setIsExpanded(true)}
                            className="bg-slate-800 text-slate-300 px-4 py-1.5 rounded-t-lg border-t border-x border-slate-700 text-xs font-bold flex items-center gap-2 hover:bg-slate-700 hover:text-white transition shadow-lg"
                        >
                            <Maximize2 size={14}/> Tabloyu Genişlet
                        </button>
                    </div>

                    <div className="flex justify-between items-center p-2 px-4 bg-slate-900/50 border-b border-slate-800">
                        <div className="text-xs text-slate-500">Sayfa {currentPage} / {totalPages}</div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"><ChevronLeft size={16} /></button>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300"><ChevronRight size={16} /></button>
                        </div>
                    </div>

                    {/* STATUS BAR GRID */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        
                        {/* 1. Transfer Dönemi */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden group">
                            <div className={`absolute top-0 left-0 w-1 h-full ${isWindowOpen ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-600 shadow-[0_0_10px_#dc2626]'}`}></div>
                            <h4 className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Transfer Dönemi</h4>
                            <div className={`text-xl font-black flex items-center gap-2 ${isWindowOpen ? 'text-green-500' : 'text-red-500'}`}>
                                {isWindowOpen ? <Unlock size={20}/> : <Lock size={20}/>}
                                {isWindowOpen ? 'AÇIK' : 'KAPALI'}
                            </div>
                        </div>

                        {/* 2. Takip Listesi */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
                            <h4 className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Takip Listesi</h4>
                            <div className="text-xl font-black text-white flex items-center gap-2">
                                <List size={20} className="text-blue-500"/>
                                0 <span className="text-xs font-bold text-slate-600 uppercase mt-1">Oyuncu</span>
                            </div>
                        </div>

                        {/* 3. Gelen Teklifler (NEW) */}
                        <div 
                            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden cursor-pointer hover:bg-slate-800 transition group"
                            onClick={() => setIsOffersModalOpen(true)}
                        >
                            <h4 className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Gelen Teklifler</h4>
                            <div className="flex items-center gap-3">
                                <div className="text-xl font-black text-white flex items-center gap-2">
                                    <Mail size={20} className="text-purple-500"/>
                                    {incomingOffers.length}
                                </div>
                                {incomingOffers.length > 0 && (
                                    <AlertCircle size={20} className="text-red-500 animate-bounce"/>
                                )}
                            </div>
                        </div>

                        {/* 4. Bütçeler */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-center gap-2 relative">
                            <div className="flex justify-between items-center border-b border-slate-800/80 pb-1">
                                <span className="text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1.5"><Briefcase size={12} className="text-yellow-600"/> Transfer</span>
                                <span className="text-green-400 font-mono font-bold text-sm">{budget.toFixed(1)} M€</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 text-[10px] font-bold uppercase flex items-center gap-1.5"><Wallet size={12} className="text-purple-600"/> Maaş (Yıl)</span>
                                <span className="text-slate-200 font-mono font-bold text-sm">
                                    {remainingWageBudget.toFixed(1)} M€ 
                                    <span className="text-[9px] text-green-600 ml-1 bg-green-900/30 px-1 rounded">Uygun</span>
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

// Helper for formatting small loan fees
const formatLoanFee = (fee: number) => {
    if (fee < 1) return `${(fee * 1000).toFixed(0)} Bin €`;
    return `${fee.toFixed(2)} M€`;
}

export default TransferView;
