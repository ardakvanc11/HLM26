
import React, { useState, useMemo } from 'react';
import { Team, Fixture } from '../../types';
import { Trophy, Globe, MapPin, Search, ChevronDown, Minus, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, Warehouse, Briefcase } from 'lucide-react';
import { COUNTRY_CODES } from '../../data/uiConstants';

interface CompetitionClubsTabProps {
    teams: Team[];
    onTeamClick: (id: string) => void;
    fixtures: Fixture[]; // Added fixtures to calculate live points
}

// 21/22 Sezonu Sabit Katsayı Verileri
const HISTORIC_COEFFS_21_22: Record<string, number> = {
    "Aslanspor SK": 17.5,
    "Gorilla United": 12.5,
    "Gorilla City": 8.0,
    "Eşşekboğanspor FK": 10.5,
    "El-Katir": 6.5,
    "Yılanspor FK": 6.5,
    "Kartalcelona": 6.5,
    "Kaplanspor SK": 4.0,
    "Köpekspor": 2.0,
    "Kedispor": 2.5,
    "Arıspor": 1.5,
    "Shefield Karakoçan": 2.5,
    "Ejderspor": 1.0,
    "Gergedanspor FK": 1.5,
    "Zirafaspor": 1.0,
    "Kediboğanspor": 1.0,
    "Boğaboğanspor": 1.5,
    "Çitaboğanspor": 2.0,
    "Pirhanakundakçısıspor": 1.5,
    "Keçiboğanspor": 1.5
};

// 22/23 Sezonu Sabit Katsayı Verileri
const HISTORIC_COEFFS_22_23: Record<string, number> = {
    "Aslanspor SK": 17.5,
    "Gorilla City": 12.5,
    "Gorilla United": 8.0,
    "Kaplanspor SK": 8.0,
    "Götten Tothennam": 6.5,
    "Ejderspor": 6.5,
    "Kartalcelona": 6.5,
    "Eşşekboğanspor FK": 6.5,
    "Shefield Karakoçan": 4.5,
    "El-Katir": 4.0,
    "Yılanspor FK": 3.5,
    "Ayıboğanspor SK": 3.0,
    "Kedispor": 2.5,
    "Arıspor": 2.0,
    "Köpekspor": 1.5,
    "Gergedanspor FK": 1.5,
    "Tezkeresport": 1.0,
    "Zirafaspor": 1.0,
    "Boğaboğanspor": 1.0,
    "Çitaboğanspor": 1.0
};

// 23/24 Sezonu Sabit Katsayı Verileri (YENİ)
const HISTORIC_COEFFS_23_24: Record<string, number> = {
    "Gorilla United": 17.5,
    "Kartalcelona": 15.0,
    "Aslanspor SK": 8.0,
    "Gorilla City": 8.0,
    "Arıspor": 6.5,
    "Yılanspor FK": 6.5,
    "El-Katir": 6.5,
    "Kaplanspor SK": 4.0,
    // Diğer güçlü takımların çok düşmemesi için 5.0 altı manuel eklemeler
    "Eşşekboğanspor FK": 4.5,
    "Ayıboğanspor SK": 4.0,
    "Kedispor": 3.5,
    "Götten Tothennam": 4.5,
    "Ejderspor": 3.5,
    "Shefield Karakoçan": 3.0
};

// 24/25 Sezonu Sabit Katsayı Verileri (GÜNCEL)
const HISTORIC_COEFFS_24_25: Record<string, number> = {
    "Gorilla United": 17.5,
    "Gorilla City": 12.5,
    "El-Katir": 10.5,
    "Kartalcelona": 8.0,
    "Arıspor": 6.5,
    "Yılanspor FK": 6.5,
    "Götten Tothennam": 6.5,
    "Aslanspor SK": 4.0
};

// Helper to deduce realistic stadium details based on team name/rep (Simulation)
const getStadiumDetails = (team: Team) => {
    const seed = team.id.charCodeAt(0);
    
    // City Simulation
    let city = 'İstanbul';
    if (team.name.includes('Eşşek') || team.name.includes('Anadolu')) city = 'Ankara';
    else if (team.name.includes('Kangal')) city = 'Sivas';
    else if (team.name.includes('Hamsi')) city = 'Trabzon';
    else if (team.name.includes('Timsah')) city = 'Bursa';
    else if (team.name.includes('Tekir')) city = 'Tekirdağ';
    else if (team.name.includes('Göz')) city = 'İzmir';
    else if (team.name.includes('07')) city = 'Antalya';
    else if (!team.leagueId || team.leagueId === 'EUROPE_LEAGUE') {
        // Foreign cities based on mock data
        if (team.name.includes('Gorilla')) city = 'Manchester';
        else if (team.name.includes('Aslan')) city = 'Madrid';
        else if (team.name.includes('Kaplan')) city = 'Valencia';
        else if (team.name.includes('Yılan')) city = 'Milano';
        else if (team.name.includes('El-Katir')) city = 'Riyad';
        else if (team.name.includes('Boğan')) city = 'Münih';
        else city = 'Avrupa';
    } else {
        // Random Turkish Cities for others
        const cities = ['İstanbul', 'İstanbul', 'İstanbul', 'İzmir', 'Adana', 'Konya', 'Kayseri', 'Gaziantep', 'Antalya'];
        city = cities[seed % cities.length];
    }

    // Pitch Dimensions (Standard 105x68 but vary slightly)
    const length = 100 + (seed % 10); // 100-110
    const width = 64 + (seed % 8);   // 64-72

    // Pitch Surface
    let surface = 'Doğal Çim';
    if (team.reputation >= 4.0) surface = 'Hibrit Çim';
    else if (team.reputation >= 3.0) surface = 'Çim / Yapay Karışımı';
    else if (team.reputation < 2.0) surface = 'Yapay Çim';

    return { city, length, width, surface };
};

const CompetitionClubsTab: React.FC<CompetitionClubsTabProps> = ({ teams, onTeamClick, fixtures }) => {
    const [activeSubTab, setActiveSubTab] = useState<'CLUB_COEFF' | 'COUNTRY_COEFF' | 'STADIUMS' | 'SPONSORS' | 'PLACEMENTS'>('CLUB_COEFF');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'total_current', direction: 'desc' });

    // Helper to determine team country
    const getTeamCountry = (team: Team) => {
        if (team.leagueId === 'LEAGUE' || team.leagueId === 'LEAGUE_1') return 'Türkiye';
        const players = team.players;
        if (!players || players.length === 0) return 'Avrupa';
        
        const counts: Record<string, number> = {};
        let maxCount = 0;
        let maxNation = 'Avrupa';
        
        players.forEach(p => {
            counts[p.nationality] = (counts[p.nationality] || 0) + 1;
            if (counts[p.nationality] > maxCount) {
                maxCount = counts[p.nationality];
                maxNation = p.nationality;
            }
        });
        
        return maxNation;
    };

    // 1. FILTER TEAMS FOR COEFFICIENTS
    const filteredTeams = useMemo(() => {
        return teams.filter(t => {
            // İsim Araması
            if (!t.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            
            // Allow all passed teams. The parent component is responsible for context filtering.
            // If activeSubTab === 'STADIUMS', we show all.
            // If 'CLUB_COEFF', we still show all passed teams (including L1 if passed).
            
            return true;
        });
    }, [teams, searchTerm, activeSubTab]);

    // 2. ENRICH WITH MOCK COEFFICIENT DATA & STADIUM DATA
    const teamsWithStats = useMemo(() => {
        return filteredTeams.map(t => {
            // ... (Coefficient logic same as before) ...
            const seed = t.id.charCodeAt(0) + (t.reputation * 100);
            
            let s1 = 0; if (HISTORIC_COEFFS_21_22[t.name] !== undefined) s1 = HISTORIC_COEFFS_21_22[t.name]; else s1 = Math.max(0, (t.reputation * 0.5) + (Math.sin(seed) * 0.5));
            let s2 = 0; if (HISTORIC_COEFFS_22_23[t.name] !== undefined) s2 = HISTORIC_COEFFS_22_23[t.name]; else s2 = Math.max(0, (t.reputation * 0.2) + (Math.cos(seed) * 0.5));
            let s3 = 0; if (HISTORIC_COEFFS_23_24[t.name] !== undefined) s3 = HISTORIC_COEFFS_23_24[t.name]; else { const r = (Math.sin(seed + 50) + 1) * 0.75; const rs = (t.reputation * 0.65) + r; s3 = Math.min(4.9, Math.max(0.1, rs)); }
            let s4 = 0; if (HISTORIC_COEFFS_24_25[t.name] !== undefined) s4 = HISTORIC_COEFFS_24_25[t.name]; else { const r = (Math.cos(seed + 100) + 1) * 0.5; const rs = (t.reputation * 0.8) + r; s4 = Math.min(4.9, Math.max(0.1, rs)); }
            let s5 = 0;
            const euroMatches = fixtures.filter(f => f.played && f.competitionId === 'EUROPE' && (f.homeTeamId === t.id || f.awayTeamId === t.id));
            euroMatches.forEach(f => {
                const isHome = f.homeTeamId === t.id;
                const myScore = isHome ? f.homeScore! : f.awayScore!;
                const oppScore = isHome ? f.awayScore! : f.homeScore!;
                if (myScore > oppScore) s5 += 2.0; else if (myScore === oppScore) s5 += 1.0;
            });

            const total_current = s1 + s2 + s3 + s4 + s5;
            const total_next = s2 + s3 + s4 + s5 + (s5 > 0 ? s5 * 1.5 : (t.strength / 100) * 5); 

            // Calculate Attendance
            const homeMatches = fixtures.filter(f => f.homeTeamId === t.id && f.played);
            let totalAtt = 0;
            homeMatches.forEach(f => {
                const fSeed = f.id.charCodeAt(0) + (f.homeScore || 0);
                const randomFill = 0.6 + ((fSeed % 35) / 100); 
                totalAtt += Math.floor(t.stadiumCapacity * randomFill);
            });
            const avgAttendance = homeMatches.length > 0 ? Math.floor(totalAtt / homeMatches.length) : 0;

            const stadiumInfo = getStadiumDetails(t);
            const mainSponsorVal = t.sponsors.main.yearlyValue;

            return {
                ...t,
                country: getTeamCountry(t),
                stadiumInfo: {
                    ...stadiumInfo,
                    avgAttendance
                },
                stats: {
                    s1: s1.toFixed(3),
                    s2: s2.toFixed(3),
                    s3: s3.toFixed(3),
                    s4: s4.toFixed(3),
                    s5: s5.toFixed(3),
                    total_current: total_current.toFixed(3),
                    total_next: total_next.toFixed(3)
                },
                sortValues: {
                    s1, s2, s3, s4, s5, total_current, total_next,
                    capacity: t.stadiumCapacity,
                    avgAttendance,
                    sponsorValue: mainSponsorVal
                }
            };
        });
    }, [filteredTeams, fixtures, activeSubTab]);

    // 3. AGGREGATE COUNTRY STATS
    const countryStats = useMemo(() => {
        if (activeSubTab !== 'COUNTRY_COEFF') return [];
        const map = new Map<string, { count: number, s1: number, s2: number, s3: number, s4: number, s5: number, total_current: number, total_next: number }>();

        teamsWithStats.forEach(t => {
            const country = t.country;
            if (!map.has(country)) {
                map.set(country, { count: 0, s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, total_current: 0, total_next: 0 });
            }
            const entry = map.get(country)!;
            entry.count++;
            entry.s1 += parseFloat(t.stats.s1);
            entry.s2 += parseFloat(t.stats.s2);
            entry.s3 += parseFloat(t.stats.s3);
            entry.s4 += parseFloat(t.stats.s4);
            entry.s5 += parseFloat(t.stats.s5);
            entry.total_current += parseFloat(t.stats.total_current);
            entry.total_next += parseFloat(t.stats.total_next);
        });

        return Array.from(map.entries()).map(([name, data]) => ({
            name,
            count: data.count,
            s1: (data.s1 / data.count).toFixed(3),
            s2: (data.s2 / data.count).toFixed(3),
            s3: (data.s3 / data.count).toFixed(3),
            s4: (data.s4 / data.count).toFixed(3),
            s5: (data.s5 / data.count).toFixed(3),
            total_current: (data.total_current / data.count).toFixed(3),
            total_next: (data.total_next / data.count).toFixed(3),
        }));
    }, [teamsWithStats, activeSubTab]);

    // 4. SORT LOGIC FOR CLUBS
    const sortedTeams = useMemo(() => {
        return [...teamsWithStats].sort((a, b) => {
            let valA: any;
            let valB: any;

            if (['s1', 's2', 's3', 's4', 's5', 'total_current', 'total_next', 'capacity', 'avgAttendance', 'sponsorValue'].includes(sortConfig.key)) {
                // @ts-ignore
                valA = a.sortValues[sortConfig.key];
                // @ts-ignore
                valB = b.sortValues[sortConfig.key];
            } else if (sortConfig.key === 'name') {
                valA = a.name;
                valB = b.name;
            } else if (sortConfig.key === 'country') {
                valA = a.country;
                valB = b.country;
            } else if (sortConfig.key === 'stadium') {
                valA = a.stadiumName;
                valB = b.stadiumName;
            } else if (sortConfig.key === 'city') {
                valA = a.stadiumInfo.city;
                valB = b.stadiumInfo.city;
            } else if (sortConfig.key === 'sponsorName') {
                valA = a.sponsors.main.name;
                valB = b.sponsors.main.name;
            } else {
                valA = a.reputation;
                valB = b.reputation;
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [teamsWithStats, sortConfig]);

    // 5. SORT LOGIC FOR COUNTRIES
    const sortedCountries = useMemo(() => {
        if (activeSubTab !== 'COUNTRY_COEFF') return [];
        return [...countryStats].sort((a, b) => {
            let valA: any = a[sortConfig.key as keyof typeof a];
            let valB: any = b[sortConfig.key as keyof typeof b];

            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
            
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [countryStats, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ colKey }: { colKey: string }) => {
        if (sortConfig.key !== colKey) return <ArrowUpDown size={12} className="opacity-30 ml-1 group-hover:opacity-100 transition-opacity" />;
        return sortConfig.direction === 'asc' 
            ? <ArrowUp size={12} className="text-[#ff9f43] ml-1" />
            : <ArrowDown size={12} className="text-[#ff9f43] ml-1" />;
    };

    const SortableHeader = ({ label, sKey, className = "" }: { label: React.ReactNode, sKey: string, className?: string }) => (
        <th 
            className={`p-3 cursor-pointer hover:bg-[#2e3540] transition-colors select-none group ${className}`}
            onClick={() => requestSort(sKey)}
        >
            <div className="flex items-center justify-center gap-1">
                {label}
                <SortIcon colKey={sKey} />
            </div>
        </th>
    );

    // Map technical sort keys to user friendly labels
    const getSortDisplayLabel = (key: string) => {
        const labels: Record<string, string> = {
            total_current: 'Toplam (Bu Sezon)',
            total_next: 'Toplam (Gelecek Sezon)',
            s1: '21/22 Sezonu',
            s2: '22/23 Sezonu',
            s3: '23/24 Sezonu',
            s4: '24/25 Sezonu',
            s5: '25/26 Sezonu',
            name: 'Kulüp İsmi',
            country: 'Ülke',
            stadium: 'Stadyum',
            city: 'Şehir',
            capacity: 'Kapasite',
            avgAttendance: 'Ort. Seyirci',
            sponsorValue: 'Sponsor Geliri',
            sponsorName: 'Sponsor Adı'
        };
        return labels[key] || key;
    };

    return (
        <div className="flex flex-col h-full bg-[#1b1b1b] text-slate-300">
            
            {/* Sub Navigation */}
            <div className="flex items-center gap-2 border-b border-[#333] px-4 pt-4 bg-[#222] overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => { setActiveSubTab('CLUB_COEFF'); setSortConfig({ key: 'total_current', direction: 'desc' }); }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors whitespace-nowrap ${activeSubTab === 'CLUB_COEFF' ? 'bg-[#ff9f43] text-black' : 'bg-[#333] text-slate-400 hover:bg-[#444]'}`}
                >
                    Kulüp Katsayıları
                </button>
                <button 
                    onClick={() => { setActiveSubTab('COUNTRY_COEFF'); setSortConfig({ key: 'total_current', direction: 'desc' }); }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors whitespace-nowrap ${activeSubTab === 'COUNTRY_COEFF' ? 'bg-[#ff9f43] text-black' : 'bg-[#333] text-slate-400 hover:bg-[#444]'}`}
                >
                    Ülke Katsayıları
                </button>
                <button 
                    onClick={() => { setActiveSubTab('STADIUMS'); setSortConfig({ key: 'capacity', direction: 'desc' }); }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors whitespace-nowrap ${activeSubTab === 'STADIUMS' ? 'bg-[#ff9f43] text-black' : 'bg-[#333] text-slate-400 hover:bg-[#444]'}`}
                >
                    Kulüp Stadyumları
                </button>
                <button 
                    onClick={() => { setActiveSubTab('SPONSORS'); setSortConfig({ key: 'sponsorValue', direction: 'desc' }); }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors whitespace-nowrap ${activeSubTab === 'SPONSORS' ? 'bg-[#ff9f43] text-black' : 'bg-[#333] text-slate-400 hover:bg-[#444]'}`}
                >
                    Kulüp Sponsorları
                </button>
                <button 
                    onClick={() => setActiveSubTab('PLACEMENTS')}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-colors whitespace-nowrap ${activeSubTab === 'PLACEMENTS' ? 'bg-[#ff9f43] text-black' : 'bg-[#333] text-slate-400 hover:bg-[#444]'}`}
                >
                    Kulüp Yerleşimleri
                </button>
            </div>

            {/* Filter Bar */}
            {(activeSubTab === 'CLUB_COEFF' || activeSubTab === 'STADIUMS' || activeSubTab === 'SPONSORS') && (
                <div className="p-3 border-b border-[#333] bg-[#1e232e] flex justify-between items-center">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Kulüp Ara..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#161a1f] border border-[#333] rounded-full pl-9 pr-4 py-1.5 text-xs text-white outline-none focus:border-[#ff9f43] w-64 transition-colors"
                        />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono hidden md:block">
                        Sıralama: {getSortDisplayLabel(sortConfig.key)} ({sortConfig.direction === 'desc' ? 'Azalan' : 'Artan'})
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                
                {activeSubTab === 'CLUB_COEFF' && (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-[#161a1f] text-slate-400 font-bold uppercase sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 w-12 text-center border-b border-[#333]">Poz.</th>
                                    <th 
                                        className="p-3 border-b border-[#333] cursor-pointer hover:bg-[#2e3540] group"
                                        onClick={() => requestSort('name')}
                                    >
                                        <div className="flex items-center gap-1">Kulüp <SortIcon colKey="name"/></div>
                                    </th>
                                    <th 
                                        className="p-3 border-b border-[#333] cursor-pointer hover:bg-[#2e3540] group"
                                        onClick={() => requestSort('country')}
                                    >
                                        <div className="flex items-center gap-1">Ülke <SortIcon colKey="country"/></div>
                                    </th>
                                    
                                    <SortableHeader label="21/22" sKey="s1" className="text-slate-500"/>
                                    <SortableHeader label="22/23" sKey="s2" className="text-slate-500"/>
                                    <SortableHeader label="23/24" sKey="s3" className="text-slate-500"/>
                                    <SortableHeader label="24/25" sKey="s4" className="text-slate-500"/>
                                    <SortableHeader label="25/26" sKey="s5" className="text-white bg-[#252a33]"/>
                                    
                                    <SortableHeader 
                                        label={<>Toplam<br/><span className="text-[9px] opacity-70">Bu Sezon</span></>} 
                                        sKey="total_current" 
                                        className="text-white bg-[#252a33]"
                                    />
                                    <SortableHeader 
                                        label={<>Toplam<br/><span className="text-[9px] opacity-70">Sonraki</span></>} 
                                        sKey="total_next" 
                                        className="text-yellow-500 bg-[#2a2f38]"
                                    />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2c333a]">
                                {sortedTeams.map((team, index) => {
                                    const countryCode = COUNTRY_CODES[team.country] || 'un';
                                    
                                    return (
                                        <tr 
                                            key={team.id} 
                                            onClick={() => onTeamClick(team.id)}
                                            className="hover:bg-[#252a33] transition-colors cursor-pointer group"
                                        >
                                            <td className="p-3 text-center font-mono font-black text-slate-500 group-hover:text-white">
                                                {index + 1}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    {team.logo ? (
                                                        <img src={team.logo} className="w-6 h-6 object-contain" alt="" />
                                                    ) : (
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${team.colors[0]}`}>
                                                            {team.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span className="font-bold text-slate-300 group-hover:text-white transition-colors">{team.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <img 
                                                        src={`https://flagcdn.com/w20/${countryCode}.png`} 
                                                        className="w-4 h-auto object-contain rounded-[1px] shadow-sm opacity-80"
                                                        alt={team.country}
                                                        onError={(e) => e.currentTarget.style.display='none'} 
                                                    />
                                                    <span className="text-slate-400 text-[11px] font-bold uppercase">{team.country}</span>
                                                </div>
                                            </td>
                                            
                                            <td className="p-3 text-center font-mono text-slate-500">{team.stats.s1}</td>
                                            <td className="p-3 text-center font-mono text-slate-500">{team.stats.s2}</td>
                                            <td className="p-3 text-center font-mono text-slate-500">{team.stats.s3}</td>
                                            <td className="p-3 text-center font-mono text-slate-500">{team.stats.s4}</td>
                                            <td className="p-3 text-center font-mono font-black text-white bg-[#252a33]">{team.stats.s5}</td>
                                            
                                            {/* Totals */}
                                            <td className="p-3 text-center font-mono font-black text-white bg-[#252a33] group-hover:bg-[#2e343d] transition-colors">
                                                {team.stats.total_current}
                                            </td>
                                            <td className="p-3 text-center font-mono font-black text-yellow-500 bg-[#2a2f38] group-hover:bg-[#343a45] transition-colors relative">
                                                {team.stats.total_next}
                                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeSubTab === 'STADIUMS' && (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                            <thead className="bg-[#161a1f] text-slate-400 font-bold uppercase sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 w-12 text-center border-b border-[#333]">Poz</th>
                                    <th className="p-3 border-b border-[#333] cursor-pointer hover:bg-[#2e3540] group" onClick={() => requestSort('stadium')}>
                                        <div className="flex items-center gap-1">Stadyum <SortIcon colKey="stadium"/></div>
                                    </th>
                                    <th className="p-3 border-b border-[#333] cursor-pointer hover:bg-[#2e3540] group" onClick={() => requestSort('name')}>
                                        <div className="flex items-center gap-1">Takım <SortIcon colKey="name"/></div>
                                    </th>
                                    <th className="p-3 border-b border-[#333] cursor-pointer hover:bg-[#2e3540] group" onClick={() => requestSort('city')}>
                                        <div className="flex items-center gap-1">Şehir <SortIcon colKey="city"/></div>
                                    </th>
                                    <th className="p-3 text-center border-b border-[#333]">Zemin Uzn</th>
                                    <th className="p-3 text-center border-b border-[#333]">Zemin Gnş</th>
                                    <th className="p-3 text-right border-b border-[#333] cursor-pointer hover:bg-[#2e3540] group" onClick={() => requestSort('capacity')}>
                                        <div className="flex items-center justify-end gap-1">Kapasite <SortIcon colKey="capacity"/></div>
                                    </th>
                                    <th className="p-3 text-right border-b border-[#333] cursor-pointer hover:bg-[#2e3540] group" onClick={() => requestSort('avgAttendance')}>
                                        <div className="flex items-center justify-end gap-1">Ort. Seyirci <SortIcon colKey="avgAttendance"/></div>
                                    </th>
                                    <th className="p-3 border-b border-[#333]">Saha Zemini</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2c333a]">
                                {sortedTeams.map((team, index) => (
                                    <tr key={team.id} className="hover:bg-[#252a33] transition-colors cursor-pointer group" onClick={() => onTeamClick(team.id)}>
                                        <td className="p-3 text-center font-mono text-slate-500">{index + 1}.</td>
                                        <td className="p-3 font-bold text-white flex items-center gap-2">
                                            <Warehouse size={14} className="text-slate-500"/>
                                            {team.stadiumName}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                {team.logo ? <img src={team.logo} className="w-5 h-5 object-contain" alt="" /> : <div className={`w-5 h-5 rounded-full ${team.colors[0]}`}></div>}
                                                <span className="font-bold text-[#ff9f43]">{team.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-slate-300">{team.stadiumInfo.city}</td>
                                        <td className="p-3 text-center text-slate-400 font-mono">{team.stadiumInfo.length}m</td>
                                        <td className="p-3 text-center text-slate-400 font-mono">{team.stadiumInfo.width}m</td>
                                        <td className="p-3 text-right text-slate-200 font-mono">{team.stadiumCapacity.toLocaleString()}</td>
                                        <td className="p-3 text-right text-white font-mono font-bold">{team.stadiumInfo.avgAttendance.toLocaleString()}</td>
                                        <td className="p-3 text-slate-400 italic">{team.stadiumInfo.surface}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeSubTab === 'SPONSORS' && (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                            <thead className="bg-[#161a1f] text-slate-400 font-bold uppercase sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 w-12 text-center border-b border-[#333]">Poz</th>
                                    <th className="p-3 border-b border-[#333] cursor-pointer hover:bg-[#2e3540] group" onClick={() => requestSort('name')}>
                                        <div className="flex items-center gap-1">Takım <SortIcon colKey="name"/></div>
                                    </th>
                                    <th className="p-3 border-b border-[#333] cursor-pointer hover:bg-[#2e3540] group" onClick={() => requestSort('sponsorName')}>
                                        <div className="flex items-center gap-1">Ana Sponsor <SortIcon colKey="sponsorName"/></div>
                                    </th>
                                    <th className="p-3 text-right border-b border-[#333] cursor-pointer hover:bg-[#2e3540] group" onClick={() => requestSort('sponsorValue')}>
                                        <div className="flex items-center justify-end gap-1">Yıllık Gelir <SortIcon colKey="sponsorValue"/></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2c333a]">
                                {sortedTeams.map((team, index) => (
                                    <tr key={team.id} className="hover:bg-[#252a33] transition-colors cursor-pointer group" onClick={() => onTeamClick(team.id)}>
                                        <td className="p-3 text-center font-mono text-slate-500">{index + 1}.</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                {team.logo ? <img src={team.logo} className="w-5 h-5 object-contain" alt="" /> : <div className={`w-5 h-5 rounded-full ${team.colors[0]}`}></div>}
                                                <span className="font-bold text-white group-hover:text-[#ff9f43] transition-colors">{team.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 font-bold text-slate-300 flex items-center gap-2">
                                            <Briefcase size={14} className="text-slate-500"/>
                                            {team.sponsors.main.name}
                                        </td>
                                        <td className="p-3 text-right text-green-400 font-mono font-bold">
                                            {team.sponsors.main.yearlyValue.toFixed(2)} M€
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeSubTab === 'COUNTRY_COEFF' && (
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-[#161a1f] text-slate-400 font-bold uppercase sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 w-12 text-center border-b border-[#333]">Poz.</th>
                                    <th 
                                        className="p-3 border-b border-[#333] cursor-pointer hover:bg-[#2e3540] group"
                                        onClick={() => requestSort('name')}
                                    >
                                        <div className="flex items-center gap-1">Ülke <SortIcon colKey="name"/></div>
                                    </th>
                                    <th className="p-3 text-center border-b border-[#333]">Takım</th>
                                    
                                    <SortableHeader label="21/22" sKey="s1" className="text-slate-500"/>
                                    <SortableHeader label="22/23" sKey="s2" className="text-slate-500"/>
                                    <SortableHeader label="23/24" sKey="s3" className="text-slate-500"/>
                                    <SortableHeader label="24/25" sKey="s4" className="text-slate-500"/>
                                    <SortableHeader label="25/26" sKey="s5" className="text-white bg-[#252a33]"/>
                                    
                                    <SortableHeader 
                                        label={<>Toplam<br/><span className="text-[9px] opacity-70">Bu Sezon</span></>} 
                                        sKey="total_current" 
                                        className="text-white bg-[#252a33]"
                                    />
                                    <SortableHeader 
                                        label={<>Toplam<br/><span className="text-[9px] opacity-70">Sonraki</span></>} 
                                        sKey="total_next" 
                                        className="text-yellow-500 bg-[#2a2f38]"
                                    />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2c333a]">
                                {sortedCountries.map((country, index) => {
                                    const countryCode = COUNTRY_CODES[country.name] || 'un';
                                    
                                    return (
                                        <tr key={country.name} className="hover:bg-[#252a33] transition-colors cursor-default group">
                                            <td className="p-3 text-center font-mono font-black text-slate-500 group-hover:text-white">
                                                {index + 1}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={`https://flagcdn.com/w40/${countryCode}.png`} 
                                                        className="w-6 h-auto object-contain rounded-[1px] shadow-sm"
                                                        alt={country.name}
                                                        onError={(e) => e.currentTarget.style.display='none'} 
                                                    />
                                                    <span className="font-bold text-slate-300 group-hover:text-white transition-colors">{country.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center text-slate-500 font-mono">
                                                {country.count}
                                            </td>
                                            
                                            <td className="p-3 text-center font-mono text-slate-500">{country.s1}</td>
                                            <td className="p-3 text-center font-mono text-slate-500">{country.s2}</td>
                                            <td className="p-3 text-center font-mono text-slate-500">{country.s3}</td>
                                            <td className="p-3 text-center font-mono text-slate-500">{country.s4}</td>
                                            <td className="p-3 text-center font-mono font-black text-white bg-[#252a33]">{country.s5}</td>
                                            
                                            {/* Totals */}
                                            <td className="p-3 text-center font-mono font-black text-white bg-[#252a33] group-hover:bg-[#2e343d] transition-colors">
                                                {country.total_current}
                                            </td>
                                            <td className="p-3 text-center font-mono font-black text-yellow-500 bg-[#2a2f38] group-hover:bg-[#343a45] transition-colors relative">
                                                {country.total_next}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeSubTab === 'PLACEMENTS' && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <MapPin size={48} className="mb-4 opacity-20" />
                        <h3 className="text-lg font-bold uppercase tracking-widest">Kulüp Yerleşimleri</h3>
                        <p className="text-xs mt-2">Turnuva katılım listesi henüz kesinleşmedi.</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CompetitionClubsTab;
