
import React, { useState, useRef, useEffect } from 'react';
import { Team, Mentality, Player } from '../../types';
import { Settings, Megaphone, Mic, Users, RefreshCw, Shield, Swords, Anchor, Zap, ChevronUp, MessageSquare, ShieldCheck, TrendingUp } from 'lucide-react';
import PlayerMatchCard from './PlayerMatchCard';

interface MatchFooterProps {
    myTeamCurrent: Team;
    handleQuickMentalityChange: (e: React.ChangeEvent<HTMLSelectElement> | any) => void;
    managerDiscipline: string;
    onOpenTactics: (tab: 'XI' | 'TACTICS') => void;
    isOwnGoal: boolean;
    handleObjection: () => void;
    phase: string;
    hasHalftimeTalkBeenGiven: boolean;
    setIsHalftimeTalkOpen: (v: boolean) => void;
    speed: number;
    setSpeed: (s: number) => void;
    showBenchInBottomBar: boolean;
    setShowBenchInBottomBar: (v: boolean) => void;
    handlePlayerClick: (e: React.MouseEvent, p: Player) => void;
    getPlayerRating: (p: Player) => number;
    isMatchOver: boolean;
    redCardedPlayerIds: string[]; // Added Prop
}

// --- MENTALITY DATA & CONFIGURATION ---
const MENTALITY_INFO: Record<Mentality, { label: string, desc: string, color: string, icon: any }> = {
    [Mentality.VERY_DEFENSIVE]: {
        label: "Aşırı Savunma Ağırlıklı",
        desc: "Takım tamamen kendi yarı sahasına çekilir. Öncelik kesinlikle gol yememektir. Oyuncular risk almaz, topu uzaklaştırır ve zaman geçirmeye oynar. Skoru korumak için son dakikalarda idealdir.",
        color: "text-blue-500",
        icon: Shield
    },
    [Mentality.DEFENSIVE]: {
        label: "Savunma Ağırlıklı",
        desc: "Kontrollü ve temkinli bir oyun. Bekler ileri çıkmaz, orta saha savunmaya yakın oynar. Rakibi karşılayıp hata yapmalarını bekleriz. Zorlu deplasmanlar için uygundur.",
        color: "text-cyan-400",
        icon: Shield
    },
    [Mentality.CAUTIOUS]: {
        label: "Temkinli",
        desc: "Risk almadan, güvenli paslarla oynanan kontrollü oyun. Savunma güvenliği ön plandadır, kontra fırsatları kovalanır.",
        color: "text-emerald-400",
        icon: ShieldCheck
    },
    [Mentality.STANDARD]: {
        label: "Dengeli",
        desc: "Dengeli oyun anlayışı, diğer oyun anlayışlarına göre belki de en önemli olanıdır. Menajer, bu oyun anlayışı ile maça başlayarak, karşılaşmanın gidişatına ve oyuncularının performansına bakarak taktiksel planını daha detaylı şekillendirebilir.",
        color: "text-yellow-500",
        icon: Anchor
    },
    [Mentality.POSITIVE]: {
        label: "Pozitif Futbol",
        desc: "Kazanmaya odaklı, topa sahip olmayı seven oyun. Savunma disiplinini bozmadan hücumu düşünür.",
        color: "text-lime-400",
        icon: TrendingUp
    },
    [Mentality.ATTACKING]: {
        label: "Hücum Ağırlıklı",
        desc: "Rakip yarı alanda baskı kurmayı hedefleriz. Bekler bindirme yapar, pas temposu artar. Gol ararken savunmada az da olsa boşluklar verebiliriz.",
        color: "text-orange-500",
        icon: Swords
    },
    [Mentality.VERY_ATTACKING]: {
        label: "Aşırı Hücum Ağırlıklı",
        desc: "Tüm hatlarla saldır! Savunma güvenliği ikinci plandadır. Stoperler bile ileri çıkar. Gol atmak zorundaysak veya kaybedecek bir şeyimiz kalmadıysa kullanılır.",
        color: "text-red-600",
        icon: Zap
    }
};

const MentalitySelector = ({ value, onChange, disabled }: { value: Mentality, onChange: (val: Mentality) => void, disabled: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hovered, setHovered] = useState<Mentality | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const activeInfo = MENTALITY_INFO[hovered || value];
    const currentInfo = MENTALITY_INFO[value];

    return (
        <div className="relative w-[307px] min-w-[307px]" ref={menuRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full h-14 bg-[#16181d] border ${isOpen ? 'border-yellow-500' : 'border-slate-600'} rounded p-2 flex items-center justify-between transition-colors hover:bg-[#1f2229] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <div className="flex flex-col items-start">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Oyun Anlayışı</span>
                    <div className={`flex items-center gap-2 text-sm font-bold ${currentInfo.color}`}>
                        <currentInfo.icon size={16} />
                        {currentInfo.label}
                    </div>
                </div>
                <ChevronUp size={16} className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-[500px] bg-[#1b1e26]/95 backdrop-blur-md border border-slate-600 rounded-lg shadow-2xl flex overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-1/2 border-r border-slate-700 p-1 flex flex-col gap-0.5">
                        {Object.values(Mentality).map((m) => {
                            const info = MENTALITY_INFO[m];
                            const isSelected = value === m;
                            return (
                                <button
                                    key={m}
                                    onClick={() => { onChange(m); setIsOpen(false); }}
                                    onMouseEnter={() => setHovered(m)}
                                    onMouseLeave={() => setHovered(null)}
                                    className={`flex items-center gap-2 px-3 py-3 rounded text-xs font-bold text-left transition-all
                                        ${isSelected ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                                    `}
                                >
                                    <info.icon size={14} className={isSelected ? info.color : 'text-slate-500'} />
                                    {info.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="w-1/2 p-4 flex flex-col justify-center bg-black/20">
                        <div className={`flex items-center gap-2 mb-2 text-sm font-black uppercase ${activeInfo.color}`}>
                            <activeInfo.icon size={18} />
                            {activeInfo.label}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            {activeInfo.desc}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const MatchFooter: React.FC<MatchFooterProps> = ({
    myTeamCurrent,
    handleQuickMentalityChange,
    managerDiscipline,
    onOpenTactics,
    isOwnGoal,
    handleObjection,
    phase,
    hasHalftimeTalkBeenGiven,
    setIsHalftimeTalkOpen,
    speed,
    setSpeed,
    showBenchInBottomBar,
    setShowBenchInBottomBar,
    handlePlayerClick,
    getPlayerRating,
    isMatchOver,
    redCardedPlayerIds
}) => {
    return (
        <div className="h-48 bg-[#1b1e26] border-t border-slate-700 flex shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-40">
            {/* Left Side: Tactical Controls */}
            <div className="w-1/3 md:w-1/4 lg:w-1/3 border-r border-slate-700 p-3 flex flex-col gap-2 bg-[#21242c]">
                
                {/* Mentality + Speed Row */}
                <div className="flex gap-2 h-14 relative">
                    <MentalitySelector 
                        value={myTeamCurrent.mentality}
                        onChange={(val) => handleQuickMentalityChange({ target: { value: val } } as any)}
                        disabled={managerDiscipline === 'RED' || isMatchOver}
                    />

                    <div className="bg-[#16181d] rounded border border-slate-600 p-1 flex flex-1 items-center gap-3 px-3">
                        <div className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">Oyun Hızı</div>
                        <div className="flex gap-1 flex-1 h-full">
                            {[1, 2, 4].map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => setSpeed(s)} 
                                    className={`flex-1 h-full flex items-center justify-center rounded text-sm md:text-base font-bold transition-colors ${speed === s ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Control Grid - 2x2 Layout */}
                <div className="grid grid-cols-2 gap-2 flex-1">
                    <button 
                        disabled={managerDiscipline === 'RED' || isMatchOver} 
                        onClick={() => onOpenTactics('XI')}
                        className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Settings size={16}/>
                        <span className="text-[10px] font-bold uppercase">Taktikler</span>
                    </button>

                    <button 
                        disabled={isOwnGoal || managerDiscipline === 'RED' || isMatchOver} 
                        onClick={handleObjection}
                        className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Megaphone size={16}/>
                        <span className="text-[10px] font-bold uppercase">İtiraz Et</span>
                    </button>

                    <button 
                        disabled={managerDiscipline === 'RED' || isMatchOver} 
                        onClick={() => onOpenTactics('TACTICS')}
                        className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MessageSquare size={16}/>
                        <span className="text-[10px] font-bold uppercase">Talimatlar</span>
                    </button>

                    <button
                        disabled={phase !== 'HALFTIME' || managerDiscipline === 'RED' || hasHalftimeTalkBeenGiven || isMatchOver}
                        onClick={() => setIsHalftimeTalkOpen(true)}
                        className={`border border-slate-600 rounded flex flex-col items-center justify-center gap-1 transition disabled:opacity-50 ${phase === 'HALFTIME' && managerDiscipline !== 'RED' && !hasHalftimeTalkBeenGiven && !isMatchOver ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                    >
                        <Mic size={16}/>
                        <span className="text-[10px] font-bold uppercase">Devre Arası</span>
                    </button>
                </div>
            </div>

            {/* Right Side: Live Player Ratings & Status */}
            <div className="flex-1 flex flex-row h-full overflow-hidden">
                <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center px-4 gap-3 bg-[#1b1e26] py-2">
                    {myTeamCurrent.players.slice(showBenchInBottomBar ? 11 : 0, showBenchInBottomBar ? 18 : 11).map(p => (
                        <PlayerMatchCard 
                            key={p.id} 
                            player={p} 
                            rating={getPlayerRating(p)} 
                            onClick={(e) => handlePlayerClick(e, p)}
                            isRedCarded={redCardedPlayerIds.includes(p.id)}
                        />
                    ))}
                     {showBenchInBottomBar && myTeamCurrent.players.length <= 11 && (
                        <div className="text-slate-500 text-xs italic w-full text-center">Yedek oyuncu yok.</div>
                     )}
                </div>

                <button 
                    onClick={() => setShowBenchInBottomBar(!showBenchInBottomBar)}
                    className="w-16 h-full bg-[#252830] border-l border-slate-700 hover:bg-[#2f333d] flex items-center justify-center transition-colors cursor-pointer group shadow-[-10px_0_20px_rgba(0,0,0,0.2)] z-10"
                    title={showBenchInBottomBar ? "İlk 11'i Göster" : "Yedekleri Göster"}
                >
                    <div className="flex flex-col items-center gap-3">
                         {showBenchInBottomBar ? <Users size={20} className="text-yellow-500"/> : <RefreshCw size={20} className="text-blue-500"/>}
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest writing-vertical-rl">
                            {showBenchInBottomBar ? 'İLK 11' : 'YEDEKLER'}
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default MatchFooter;
