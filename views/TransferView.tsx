
import React, { useState, useMemo, useEffect } from 'react';
import { Player, Team, IncomingOffer, TransferViewState } from '../types';
import { Lock, ChevronLeft, ChevronRight, ArrowUpDown, Filter, Search, X, Check, AlertCircle, Plane, Coins, Maximize2, Minimize2, Unlock, List, Wallet, Briefcase, Mail, Handshake, ArrowRight, UserPlus, Globe, Plus, Trash2, Settings, UserMinus, Eye } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';
import { calculatePlayerWage } from '../utils/teamCalculations';
import { STAT_TRANSLATIONS } from '../data/playerConstants';
import { COUNTRY_CODES } from '../data/uiConstants';

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
    onNegotiateOffer?: (offer: IncomingOffer) => void;
    savedState?: TransferViewState | null;
    onSaveState?: (state: TransferViewState) => void;
    allTeams?: Team[]; // Added prop for Shortlist lookup
    shortlist?: string[]; // Added prop
}

// Filter Types
interface AttributeFilter {
    key: string;
    min: number;
}

const TransferView: React.FC<TransferViewProps> = ({ transferList, team, budget, isWindowOpen, onBuy, onPlayerClick, incomingOffers, onAcceptOffer, onRejectOffer, onNegotiateOffer, savedState, onSaveState, allTeams, shortlist = [] }) => {
    // Initialize State with Saved State if available, else defaults
    const [searchTerm, setSearchTerm] = useState(savedState?.searchTerm || '');
    const [currentPage, setCurrentPage] = useState(savedState?.currentPage || 1);
    const [itemsPerPage] = useState(20);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>(savedState?.sortConfig || { key: 'value', direction: 'desc' });
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(savedState?.isFilterOpen || false); // Renamed and used for modal
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
    const [isShortlistModalOpen, setIsShortlistModalOpen] = useState(false); // NEW STATE
    
    // Quick Filters State
    const [quickFilters, setQuickFilters] = useState<{ transfer: boolean, loan: boolean }>(savedState?.quickFilters || { transfer: false, loan: false });
    const [interestFilter, setInterestFilter] = useState<string>(savedState?.interestFilter || 'ALL');
    const [isInterestSettingsOpen, setIsInterestSettingsOpen] = useState(false);

    // Allow viewing list even if window is closed
    const [isListReviewMode, setIsListReviewMode] = useState(false);

    // Filters State - Extended structure
    const [filters, setFilters] = useState(savedState?.filters || {
        minSkill: 0,
        maxAge: 40,
        position: 'ALL',
        minValue: 0,
        maxValue: 200,
        nationality: 'ALL',
        contractStatus: 'ALL', // 'ALL', 'FREE', 'LISTED'
        attributes: [] as AttributeFilter[]
    });

    // Temporary filter state for modal (to apply only on save)
    const [tempFilters, setTempFilters] = useState(filters);
    
    // State for adding new attribute filter inside modal
    const [newAttrKey, setNewAttrKey] = useState<string>('finishing');
    const [newAttrVal, setNewAttrVal] = useState<number>(10);

    // --- SAVE STATE EFFECT ---
    useEffect(() => {
        if (onSaveState) {
            onSaveState({
                searchTerm,
                currentPage,
                sortConfig,
                filters,
                isFilterOpen: isFilterModalOpen,
                quickFilters,
                interestFilter
            });
        }
    }, [searchTerm, currentPage, sortConfig, filters, isFilterModalOpen, quickFilters, interestFilter, onSaveState]);

    // Sync temp filters when modal opens
    useEffect(() => {
        if (isFilterModalOpen) {
            setTempFilters(filters);
        }
    }, [isFilterModalOpen]);

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

    // --- SHORTLIST LOGIC ---
    const shortlistPlayers = useMemo(() => {
        if (!shortlist || shortlist.length === 0) return [];
        
        // Try to find player object from ALL possible sources
        // 1. Transfer List
        // 2. All Teams (if provided)
        const players: Player[] = [];
        
        shortlist.forEach(id => {
            // Check Transfer List first
            let p = transferList.find(x => x.id === id);
            
            // If not found, check teams
            if (!p && allTeams) {
                for (const t of allTeams) {
                    const found = t.players.find(x => x.id === id);
                    if (found) {
                        p = found;
                        break;
                    }
                }
            }

            if (p) players.push(p);
        });

        return players;
    }, [shortlist, transferList, allTeams]);

    // --- FILTERING & SORTING ---

    const filteredList = useMemo(() => {
        return transferList.filter(p => {
            // Text Search
            if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            
            // Basic Ranges
            if (p.skill < filters.minSkill) return false;
            if (p.age > filters.maxAge) return false;
            if (p.value < filters.minValue) return false;
            if (p.value > filters.maxValue) return false;
            
            // Position
            if (filters.position !== 'ALL' && p.position !== filters.position) return false;
            
            // Nationality
            if (filters.nationality !== 'ALL') {
                if (filters.nationality === 'Yerli' && p.nationality !== 'Türkiye') return false;
                if (filters.nationality === 'Yabancı' && p.nationality === 'Türkiye') return false;
            }

            // Contract Status (Modal Filter)
            if (filters.contractStatus === 'FREE' && p.teamId !== 'free_agent') return false;
            if (filters.contractStatus === 'LISTED' && !p.transferListed) return false;

            // Specific Attributes
            if (filters.attributes && filters.attributes.length > 0) {
                const meetsAllAttributes = filters.attributes.every(attr => {
                    // @ts-ignore
                    const playerVal = p.stats[attr.key] || 0;
                    return playerVal >= attr.min;
                });
                if (!meetsAllAttributes) return false;
            }

            // --- QUICK FILTERS & INTEREST ---
            
            // Quick Filter: Transfer (Implies "Satılık" or "Free Agent")
            if (quickFilters.transfer && !p.transferListed && p.teamId !== 'free_agent') return false;

            // Quick Filter: Loan (Implies "Kiralık")
            if (quickFilters.loan && !p.loanListed) return false;

            // Interest Filter
            const interest = getInterestLevel(p);
            if (interestFilter !== 'ALL') {
                // Determine if interest matches
                // Values: HIGH (İstiyor), MEDIUM (Belki), LOW (Zor/Hayır)
                if (interestFilter === 'HIGH' && interest !== 'HIGH') return false;
                if (interestFilter === 'MEDIUM' && interest !== 'MEDIUM') return false;
                if (interestFilter === 'LOW' && (interest !== 'LOW' && interest !== 'NONE')) return false;
            }

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
    }, [transferList, searchTerm, filters, sortConfig, quickFilters, interestFilter]);

    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Ensure currentPage is valid if filter changed
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
    }
    
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

    // Modal Helpers
    const handleApplyFilters = () => {
        setFilters(tempFilters);
        setCurrentPage(1);
        setIsFilterModalOpen(false);
    };

    const handleAddAttribute = () => {
        // Prevent duplicate keys
        if (tempFilters.attributes.some(a => a.key === newAttrKey)) return;
        
        setTempFilters(prev => ({
            ...prev,
            attributes: [...prev.attributes, { key: newAttrKey, min: newAttrVal }]
        }));
    };

    const handleRemoveAttribute = (key: string) => {
        setTempFilters(prev => ({
            ...prev,
            attributes: prev.attributes.filter(a => a.key !== key)
        }));
    };

    const resetFilters = () => {
        setTempFilters({
            minSkill: 0,
            maxAge: 40,
            position: 'ALL',
            minValue: 0,
            maxValue: 200,
            nationality: 'ALL',
            contractStatus: 'ALL',
            attributes: []
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-200 relative overflow-hidden" onClick={() => setIsInterestSettingsOpen(false)}>
            
            {/* FILTER MODAL */}
            {isFilterModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsFilterModalOpen(false)}>
                    <div className="bg-[#1e232e] w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-700 bg-[#161a1f] flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Filter className="text-blue-500"/> Detaylı Oyuncu Arama
                                </h3>
                                <p className="text-slate-400 text-xs mt-1">Kriterlerinizi belirleyin ve hayalinizdeki oyuncuyu bulun.</p>
                            </div>
                            <button onClick={() => setIsFilterModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-full transition"><X size={24}/></button>
                        </div>
                        
                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#1e232e]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                
                                {/* Left Column: Basic Filters */}
                                <div className="space-y-6">
                                    <h4 className="text-sm font-bold text-slate-300 uppercase border-b border-slate-700 pb-2">Temel Kriterler</h4>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mevki</label>
                                            <select 
                                                value={tempFilters.position} 
                                                onChange={(e) => setTempFilters(prev => ({ ...prev, position: e.target.value }))}
                                                className="w-full bg-[#161a1f] border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-blue-500"
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
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Uyruk</label>
                                            <select 
                                                value={tempFilters.nationality} 
                                                onChange={(e) => setTempFilters(prev => ({ ...prev, nationality: e.target.value }))}
                                                className="w-full bg-[#161a1f] border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-blue-500"
                                            >
                                                <option value="ALL">Hepsi</option>
                                                <option value="Yerli">Yerli (Türkiye)</option>
                                                <option value="Yabancı">Yabancı</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Sözleşme Durumu</label>
                                        <div className="flex bg-[#161a1f] p-1 rounded-lg border border-slate-600">
                                            <button 
                                                onClick={() => setTempFilters(prev => ({ ...prev, contractStatus: 'ALL' }))}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded ${tempFilters.contractStatus === 'ALL' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                Hepsi
                                            </button>
                                            <button 
                                                onClick={() => setTempFilters(prev => ({ ...prev, contractStatus: 'FREE' }))}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded ${tempFilters.contractStatus === 'FREE' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                Serbest
                                            </button>
                                            <button 
                                                onClick={() => setTempFilters(prev => ({ ...prev, contractStatus: 'LISTED' }))}
                                                className={`flex-1 py-1.5 text-xs font-bold rounded ${tempFilters.contractStatus === 'LISTED' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                Satılık
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Maksimum Yaş</label>
                                            <span className="text-xs font-bold text-white">{tempFilters.maxAge}</span>
                                        </div>
                                        <input 
                                            type="range" min="16" max="40" 
                                            value={tempFilters.maxAge} 
                                            onChange={(e) => setTempFilters(prev => ({ ...prev, maxAge: parseInt(e.target.value) }))}
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Minimum Reyting</label>
                                            <span className="text-xs font-bold text-white">{tempFilters.minSkill}</span>
                                        </div>
                                        <input 
                                            type="range" min="40" max="99" 
                                            value={tempFilters.minSkill} 
                                            onChange={(e) => setTempFilters(prev => ({ ...prev, minSkill: parseInt(e.target.value) }))}
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Piyasa Değeri Aralığı</label>
                                            <span className="text-xs font-mono font-bold text-green-400">{tempFilters.minValue} - {tempFilters.maxValue} M€</span>
                                        </div>
                                        {/* Simplified Slider for UI consistency, assuming logic is fine */}
                                        <div className="relative w-full h-6 flex items-center">
                                            <div className="absolute w-full h-2 bg-slate-700 rounded-lg"></div>
                                            <div className="absolute h-2 bg-green-600 rounded-lg z-10" style={{ left: `${(tempFilters.minValue / 200) * 100}%`, right: `${100 - (tempFilters.maxValue / 200) * 100}%` }}></div>
                                            <input type="range" min="0" max="200" step="1" value={tempFilters.minValue} onChange={(e) => { const val = Math.min(Number(e.target.value), tempFilters.maxValue - 1); setTempFilters(prev => ({ ...prev, minValue: val })); }} className="absolute top-0 w-full h-full appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:rounded-full" />
                                            <input type="range" min="0" max="200" step="1" value={tempFilters.maxValue} onChange={(e) => { const val = Math.max(Number(e.target.value), tempFilters.minValue + 1); setTempFilters(prev => ({ ...prev, maxValue: val })); }} className="absolute top-0 w-full h-full appearance-none bg-transparent pointer-events-none z-30 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:rounded-full" />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Attribute Filters */}
                                <div className="space-y-6">
                                    <h4 className="text-sm font-bold text-slate-300 uppercase border-b border-slate-700 pb-2">Özellik Filtreleri</h4>
                                    
                                    <div className="bg-[#161a1f] p-4 rounded-xl border border-slate-700">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Yeni Özellik Kuralı Ekle</label>
                                        <div className="flex gap-2 mb-3">
                                            <select 
                                                value={newAttrKey}
                                                onChange={(e) => setNewAttrKey(e.target.value)}
                                                className="flex-1 bg-[#262c33] border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-yellow-500"
                                            >
                                                {Object.keys(STAT_TRANSLATIONS).sort().map(key => (
                                                    <option key={key} value={key}>{STAT_TRANSLATIONS[key]}</option>
                                                ))}
                                            </select>
                                            <input 
                                                type="number" min="1" max="20"
                                                value={newAttrVal}
                                                onChange={(e) => setNewAttrVal(parseInt(e.target.value))}
                                                className="w-16 bg-[#262c33] border border-slate-600 rounded p-2 text-sm text-center text-white outline-none focus:border-yellow-500 font-bold"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleAddAttribute}
                                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition"
                                        >
                                            <Plus size={16}/> Listeye Ekle
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase block">Aktif Özellik Filtreleri</label>
                                        {tempFilters.attributes.length === 0 && (
                                            <div className="text-slate-600 italic text-sm text-center py-4 bg-[#161a1f] rounded-lg border border-dashed border-slate-700">
                                                Henüz özellik filtresi eklenmedi.
                                            </div>
                                        )}
                                        {tempFilters.attributes.map((attr, idx) => (
                                            <div key={idx} className="flex items-center justify-between bg-[#262c33] p-3 rounded-lg border-l-4 border-yellow-500 animate-in slide-in-from-left-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-200">{STAT_TRANSLATIONS[attr.key]}</span>
                                                    <span className="text-xs text-slate-500 uppercase font-bold">En Az</span>
                                                    <span className="bg-yellow-600 text-black text-xs font-black px-2 py-0.5 rounded">{attr.min}</span>
                                                </div>
                                                <button onClick={() => handleRemoveAttribute(attr.key)} className="text-slate-500 hover:text-red-500 transition">
                                                    <Trash2 size={16}/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-700 bg-[#161a1f] flex justify-between items-center">
                            <button 
                                onClick={resetFilters}
                                className="text-slate-400 hover:text-white font-bold text-sm underline"
                            >
                                Filtreleri Temizle
                            </button>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setIsFilterModalOpen(false)} 
                                    className="px-6 py-2 rounded-lg font-bold bg-slate-700 text-white hover:bg-slate-600 transition"
                                >
                                    İptal
                                </button>
                                <button 
                                    onClick={handleApplyFilters} 
                                    className="px-8 py-2 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-500 transition shadow-lg shadow-blue-900/20"
                                >
                                    Sonuçları Göster
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* SHORTLIST MODAL */}
            {isShortlistModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsShortlistModalOpen(false)}>
                    <div className="bg-slate-800 w-full max-w-4xl rounded-xl border border-slate-700 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Eye className="text-blue-500"/> Takip Listesi ({shortlistPlayers.length})
                            </h3>
                            <button onClick={() => setIsShortlistModalOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-slate-950 sticky top-0 z-10 shadow-md">
                                    <tr>
                                        <th className="p-3 w-10 text-center text-slate-500 font-bold">Bil</th>
                                        <th className="p-3">Oyuncu</th>
                                        <th className="p-3 text-center">Ülke</th>
                                        <th className="p-3 text-center">Kulüp</th>
                                        <th className="p-3 text-center">Mevki</th>
                                        <th className="p-3 text-center">Yaş</th>
                                        <th className="p-3 text-center">Güç</th>
                                        <th className="p-3 text-right">Değer</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {shortlistPlayers.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-12 text-center text-slate-500 italic">
                                                Takip listenizde henüz oyuncu bulunmuyor.
                                            </td>
                                        </tr>
                                    ) : (
                                        shortlistPlayers.map(p => {
                                            const displayClub = p.clubName || (p.teamId === 'free_agent' ? 'Serbest' : 'Yurt Dışı Kulübü');
                                            
                                            // Find Team Name if ID is standard
                                            let teamName = displayClub;
                                            if (allTeams) {
                                                const foundTeam = allTeams.find(t => t.id === p.teamId);
                                                if (foundTeam) teamName = foundTeam.name;
                                            }

                                            return (
                                                <tr 
                                                    key={p.id} 
                                                    onClick={() => { onPlayerClick(p); setIsShortlistModalOpen(false); }}
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
                                                    <td className="p-3 text-center">
                                                        <span className="text-slate-400 text-xs font-mono uppercase">{p.nationality}</span>
                                                    </td>
                                                    <td className="p-3 text-center text-slate-300 text-xs truncate max-w-[120px]">
                                                        {teamName}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${getPosBadgeColor(p.position)}`}>
                                                            {p.position}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center text-slate-300 font-mono">{p.age}</td>
                                                    <td className="p-3 text-center">
                                                        <span className={`font-black text-lg ${getSkillColor(p.skill)}`}>
                                                            {p.skill}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-bold text-slate-200">
                                                        {p.value.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} M€
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

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

                    {/* NEW: QUICK FILTERS */}
                    <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
                        <button
                            onClick={() => setQuickFilters(prev => ({ ...prev, transfer: !prev.transfer }))}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${quickFilters.transfer ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Sadece bonservisi ile alınabilecek oyuncuları göster (Kiralık istemeyenler)"
                        >
                            {quickFilters.transfer ? <Check size={12}/> : null} Satılık
                        </button>
                        <div className="w-px h-4 bg-slate-700"></div>
                        <button
                            onClick={() => setQuickFilters(prev => ({ ...prev, loan: !prev.loan }))}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${quickFilters.loan ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Sadece kiralık olarak alınabilecek oyuncuları göster"
                        >
                            {quickFilters.loan ? <Check size={12}/> : null} Kiralık
                        </button>
                    </div>

                    {/* NEW: INTEREST SETTINGS BUTTON */}
                    <div className="relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsInterestSettingsOpen(!isInterestSettingsOpen); }}
                            className={`p-2 rounded-lg border border-slate-700 hover:bg-slate-700 transition ${interestFilter !== 'ALL' ? 'text-yellow-500 bg-slate-900' : 'text-slate-400'}`}
                            title="İlgi Düzeyi Filtresi"
                        >
                            <Settings size={18}/>
                        </button>

                        {isInterestSettingsOpen && (
                            <div className="absolute top-full right-0 mt-2 w-40 bg-[#1e232e] border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100" onClick={e => e.stopPropagation()}>
                                <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-2 bg-[#161a1f] border-b border-slate-700">
                                    İlgi Düzeyi
                                </div>
                                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
                                    <button
                                        key={lvl}
                                        onClick={() => { setInterestFilter(lvl); setIsInterestSettingsOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between hover:bg-slate-700 ${interestFilter === lvl ? 'text-white bg-slate-700' : 'text-slate-400'}`}
                                    >
                                        <span>{lvl === 'ALL' ? 'Tümü' : lvl === 'HIGH' ? 'İstiyor' : lvl === 'MEDIUM' ? 'Belki' : 'Hayır'}</span>
                                        {interestFilter === lvl && <Check size={12} className="text-green-500"/>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setIsFilterModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border bg-blue-600 border-blue-500 text-white hover:bg-blue-500 transition shadow-lg shadow-blue-900/20"
                    >
                        <Filter size={16}/> Detaylı Filtrele
                        {filters.attributes.length > 0 && (
                            <span className="bg-white text-blue-600 text-[10px] px-1.5 rounded-full font-black">
                                {filters.attributes.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

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
                                        <div className="flex items-center gap-2">
                                            <img 
                                                src={`https://flagcdn.com/w20/${COUNTRY_CODES[p.nationality] || 'un'}.png`} 
                                                className="w-4 h-3 object-contain opacity-70"
                                                onError={(e) => e.currentTarget.style.display='none'} 
                                            />
                                            <span className="text-slate-400 text-xs font-mono uppercase">{p.nationality}</span>
                                        </div>
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

                        {/* 2. Takip Listesi (EDITED: Clickable) */}
                        <div 
                            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden cursor-pointer hover:bg-slate-800 transition group"
                            onClick={() => setIsShortlistModalOpen(true)}
                        >
                            <h4 className="text-slate-500 text-[10px] uppercase font-bold mb-1 tracking-wider">Takip Listesi</h4>
                            <div className="text-xl font-black text-white flex items-center gap-2">
                                <List size={20} className="text-blue-500"/>
                                {shortlistPlayers.length} <span className="text-xs font-bold text-slate-600 uppercase mt-1">Oyuncu</span>
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
