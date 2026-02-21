import React, { useState, useEffect, useRef } from 'react';
import { Team, Player, Mentality, PassingStyle, Tempo, Width, AttackingTransition, CreativeFreedom, SetPiecePlay, PlayStrategy, GoalKickType, GKDistributionTarget, SupportRuns, Dribbling, FocusArea, PassTarget, Patience, LongShots, CrossingType, GKDistributionSpeed, PressingLine, DefensiveLine, DefLineMobility, PressIntensity, DefensiveTransition, Tackling, PreventCrosses, PressingFocus, Position, SetPieceTakers, TimeWasting, GameSystem } from '../types';
import PitchVisual from '../components/shared/PitchVisual';
import { Syringe, Ban, Zap, Users, Target, Goal, Shield, Activity, Star, AlertTriangle, MoveRight, Gauge, Timer, MoveHorizontal, Flag, Sparkles, ArrowUpFromLine, GitCommit, MousePointerClick, Anchor, ArrowLeftRight, Crosshair, FastForward, ScanLine, ChevronUp, ChevronDown, Minus, RefreshCw, LayoutTemplate, RectangleVertical, Swords, Grid, ShieldCheck, TrendingUp, Settings, Heart, User } from 'lucide-react';
import TacticDetailModal from '../modals/TacticDetailModal';
import { TACTICAL_DESCRIPTIONS } from '../data/tacticalDescriptions';
import PlayerFace from '../components/shared/PlayerFace';
import { TACTICAL_PRESETS } from '../data/tacticalPresets';

const GAME_SYSTEM_LABELS: Record<GameSystem, string> = {
    [GameSystem.POSSESSION]: 'Topa Sahip Olma',
    [GameSystem.GEGENPRESS]: 'Gegenpress',
    [GameSystem.TIKI_TAKA]: 'Tiki-Taka',
    [GameSystem.VERTICAL_TIKI_TAKA]: 'Dikine Tiki-Taka',
    [GameSystem.WING_PLAY]: 'Kanat Oyunu',
    [GameSystem.LONG_BALL]: 'Uzun Top',
    [GameSystem.HARAMBALL]: 'Haram-Ball',
    [GameSystem.CUSTOM]: 'Özel Sistem'
};

// --- MENTALITY DATA ---
const MENTALITY_INFO: Record<Mentality, { label: string, desc: string, color: string, icon: any }> = {
    [Mentality.VERY_DEFENSIVE]: {
        label: "Aşırı Savunma",
        desc: "Takım tamamen kendi yarı sahasına çekilir. Öncelik kesinlikle gol yememektir. Risk alınmaz.",
        color: "text-blue-500",
        icon: Shield
    },
    [Mentality.DEFENSIVE]: {
        label: "Savunma Ağırlıklı",
        desc: "Kontrollü ve temkinli oyun. Bekler ileri çıkmaz, rakibi karşılayıp hata yapmalarını bekleriz.",
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
        desc: "Dengeli oyun anlayışı. Maçın gidişatına göre esneklik sağlar.",
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
        desc: "Rakip yarı alanda baskı. Bekler bindirme yapar, gol ararken savunmada risk alınabilir.",
        color: "text-orange-500",
        icon: Swords
    },
    [Mentality.VERY_ATTACKING]: {
        label: "Aşırı Hücum",
        desc: "Tüm hatlarla saldır! Savunma güvenliği ikinci plandadır. Gol atmak zorundaysak kullanılır.",
        color: "text-red-600",
        icon: Zap
    }
};

// --- FORMATION DATA ---
const FORMATION_INFO: Record<string, { label: string, desc: string, color: string, icon: any }> = {
    '4-4-2': { label: "4-4-2", desc: "", color: "text-emerald-400", icon: LayoutTemplate },
    '4-3-3': { label: "4-3-3", desc: "", color: "text-blue-400", icon: LayoutTemplate },
    '4-2-3-1': { label: "4-2-3-1", desc: "", color: "text-purple-400", icon: LayoutTemplate },
    '4-1-4-1': { label: "4-1-4-1", desc: "", color: "text-yellow-400", icon: LayoutTemplate },
    '3-5-2': { label: "3-5-2", desc: "", color: "text-orange-400", icon: Grid },
    '5-3-2': { label: "5-3-2", desc: "", color: "text-slate-400", icon: Shield },
    '3-2-4-1': { label: "3-2-4-1", desc: "", color: "text-teal-400", icon: Grid },
    '4-2-2-2': { label: "4-2-2-2", desc: "", color: "text-indigo-400", icon: LayoutTemplate },
    '4-2-4': { label: "4-2-4", desc: "", color: "text-red-400", icon: Zap },
    '4-3-2-1': { label: "4-3-2-1", desc: "", color: "text-green-500", icon: LayoutTemplate },
    '3-4-3': { label: "3-4-3", desc: "", color: "text-cyan-500", icon: Grid },
};

// --- HELPERS FOR EMPTY SLOTS ---
const getPositionFullName = (pos: string) => {
    const map: Record<string, string> = {
        'GK': 'KALECİ', 'STP': 'STOPER', 'SLB': 'SOL BEK', 'SGB': 'SAĞ BEK',
        'OS': 'ORTA SAHA (MERKEZ)', 'OOS': 'OFANSİF ORTA SAHA',
        'SLK': 'SOL KANAT', 'SGK': 'SAĞ KANAT', 'SNT': 'FORVET'
    };
    return map[pos] || pos;
};

const createEmptySlot = (pos: string): Player => ({
    id: `empty_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: 'Oyuncu Seç',
    position: pos as Position,
    skill: 0,
    potential: 0,
    stats: {
        finishing: 0, composure: 0, firstTouch: 0, passing: 0, vision: 0, decisions: 0, dribbling: 0, balance: 0, acceleration: 0, concentration: 0, leadership: 0, determination: 0, teamwork: 0, stamina: 0, naturalFitness: 0, pace: 0, physical: 0, aggression: 0, agility: 0, positioning: 0, anticipation: 0, marking: 0, tackling: 0, crossing: 0, heading: 0, longShots: 0, penalty: 0, freeKick: 0, corners: 0, longThrows: 0, bravery: 0, workRate: 0, flair: 0, offTheBall: 0, jumping: 0, technique: 0
    },
    seasonStats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, ratings: [], averageRating: 0, matchesPlayed: 0, processedMatchIds: [] },
    face: { skin: '', brows: '', eyes: '', hair: '' },
    age: 0,
    contractExpiry: 0,
    value: 0,
    nationality: 'Türkiye',
    teamId: '',
    morale: 0,
    condition: 0
});

interface TacticsViewProps {
    team: Team;
    setTeam: (t: Team) => void;
    compact?: boolean;
    isMatchActive?: boolean;
    subsUsed?: number;
    maxSubs?: number;
    onSubstitution?: (inPlayer: Player, outPlayer: Player) => void;
    currentMinute?: number;
    currentWeek?: number;
    forcedSubstitutionPlayerId?: string | null;
    matchCompetitionId?: string; 
    redCardedPlayerIds?: string[]; 
    initialTab?: 'XI' | 'TACTICS'; 
}

const MentalitySelector = ({ value, onChange, disabled }: { value: Mentality, onChange: (val: Mentality) => void, disabled?: boolean }) => {
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
        <div className="relative w-48" ref={menuRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full bg-slate-800 border ${isOpen ? 'border-yellow-500' : 'border-slate-600'} rounded px-3 py-1.5 flex items-center justify-between transition-colors hover:bg-slate-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Oyun Anlayışı</span>
                    <div className={`flex items-center gap-2 text-xs font-bold truncate ${currentInfo.color}`}>
                        <currentInfo.icon size={14} className="shrink-0" />
                        <span className="truncate">{currentInfo.label}</span>
                    </div>
                </div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-[340px] md:w-[400px] max-w-[90vw] bg-[#1b1e26]/95 backdrop-blur-md border border-slate-600 rounded-lg shadow-2xl flex overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
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
                                    className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-bold text-left transition-all
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
                        <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                            {activeInfo.desc}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const FormationSelector = ({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
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

    const currentInfo = FORMATION_INFO[value] || FORMATION_INFO['4-4-2'];
    const availableFormations = Object.keys(FORMATION_INFO);

    return (
        <div className="relative w-48" ref={menuRef}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full bg-slate-800 border ${isOpen ? 'border-yellow-500' : 'border-slate-600'} rounded px-3 py-1.5 flex items-center justify-between transition-colors hover:bg-slate-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Diziliş</span>
                    <div className={`flex items-center gap-2 text-xs font-bold truncate ${currentInfo.color}`}>
                        <currentInfo.icon size={14} className="shrink-0" />
                        <span className="truncate">{value}</span>
                    </div>
                </div>
                <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#1b1e26]/95 backdrop-blur-md border border-slate-600 rounded-lg shadow-2xl flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-1 flex flex-col gap-0.5">
                        {availableFormations.map((f) => {
                            const info = FORMATION_INFO[f];
                            const isSelected = value === f;
                            return (
                                <button
                                    key={f}
                                    onClick={() => { onChange(f); setIsOpen(false); }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-bold text-left transition-all
                                        ${isSelected ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                                    `}
                                >
                                    <info.icon size={14} className={isSelected ? info.color : 'text-slate-500'} />
                                    {f}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const TacticalInstructionCard = ({ 
    title, 
    value, 
    icon: Icon, 
    options, 
    tacticKey, 
    onOpenModal,
    colorClass = "text-fuchsia-400" 
}: { 
    title: string, 
    value: string, 
    icon: any, 
    options: string[],
    tacticKey: string, 
    onOpenModal: (key: string, title: string, currentVal: string, opts: string[]) => void,
    colorClass?: string
}) => {
    let displayValue = value;
    let dataKey = tacticKey;
    if (TACTICAL_DESCRIPTIONS[dataKey] && TACTICAL_DESCRIPTIONS[dataKey][value]) {
        displayValue = TACTICAL_DESCRIPTIONS[dataKey][value].label;
    }

    return (
        <div 
            onClick={() => onOpenModal(tacticKey, title, value, options)}
            className="bg-[#1e232e] border border-slate-700 rounded-xl p-4 flex flex-col justify-between h-40 shadow-lg hover:border-white/50 cursor-pointer transition-all group relative overflow-hidden active:scale-95"
        >
            <Icon size={80} className={`absolute -right-4 -bottom-4 opacity-5 ${colorClass} group-hover:scale-110 transition-transform duration-500`} />
            <div className={`text-xs font-bold uppercase tracking-wider ${colorClass} mb-2`}>{title}</div>
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                <Icon size={32} className="text-slate-300 mb-2 group-hover:text-white transition-colors" />
                <div className="text-center">
                    <div className="text-white font-bold text-sm leading-tight group-hover:text-yellow-400 transition-colors">{displayValue}</div>
                </div>
            </div>
            <div className="mt-3 flex justify-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700 group-hover:border-slate-500 transition-colors">
                    Değiştir
                </div>
            </div>
        </div>
    );
};

interface CompactPlayerRowProps {
    p: Player;
    index: number;
    onClick: (p: Player) => void;
    isSelected: boolean;
    label?: string;
    currentWeek?: number;
    isReserve?: boolean;
    isForcedSub?: boolean;
    competitionId?: string;
    isRedCarded?: boolean;
    onQuickSwapToggle?: (playerId: string, e: React.MouseEvent) => void;
}

const CompactPlayerRow: React.FC<CompactPlayerRowProps> = ({ p, index, onClick, isSelected, label, currentWeek, isReserve, isForcedSub, competitionId, isRedCarded, onQuickSwapToggle }) => {
    const isEmptySlot = p.id.startsWith('empty_');
    let isSuspended = false;
    const effectiveCompId = competitionId || 'LEAGUE';

    if (!isEmptySlot) {
        if (p.suspensions && p.suspensions[effectiveCompId] && p.suspensions[effectiveCompId] > 0) {
            isSuspended = true;
        } else {
            if (currentWeek && p.suspendedUntilWeek) {
                isSuspended = p.suspendedUntilWeek > currentWeek;
            } 
        }
    }

    const isInjured = !isEmptySlot && p.injury && p.injury.daysRemaining > 0;
    const isUnavailable = isInjured || isSuspended || isRedCarded;

    const currentCondition = !isEmptySlot ? (p.condition !== undefined ? p.condition : p.stats.stamina) : 0;
    const getConditionColor = (cond: number) => cond >= 90 ? 'bg-green-500' : cond >= 75 ? 'bg-green-400' : cond >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    const getMoraleIcon = (morale: number) => {
        if (morale >= 90) return <ChevronUp size={14} className="text-green-500" strokeWidth={4} />;
        if (morale >= 75) return <ChevronUp size={14} className="text-green-400" />;
        if (morale >= 50) return <Minus size={14} className="text-yellow-500" />;
        return <ChevronDown size={14} className="text-red-500" />;
    };
    const getPosColor = (pos: string) => {
        if (pos === 'GK') return 'bg-yellow-600 text-black';
        if (['STP', 'SLB', 'SGB'].includes(pos)) return 'bg-blue-600 text-white';
        if (['OS', 'OOS'].includes(pos)) return 'bg-green-600 text-white';
        return 'bg-red-600 text-white';
    };
    const ratingColor = (r: number) => {
        if (r >= 8.0) return 'bg-green-600 text-white';
        if (r >= 7.0) return 'bg-green-500/20 text-green-400 border border-green-500/50';
        if (r >= 6.0) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
        return 'bg-slate-700 text-slate-400';
    };
    const getSkillColorClass = (skill: number) => {
        if (skill >= 85) return 'text-green-400';
        if (skill >= 75) return 'text-blue-400';
        if (skill >= 65) return 'text-yellow-400';
        return 'text-slate-400';
    };

    return (
        <div 
            onClick={() => onClick(p)} 
            className={`flex items-center gap-2 p-1.5 border-b transition-all cursor-pointer group 
                ${isEmptySlot ? 'bg-slate-900/80 border-dashed border-slate-700 hover:bg-slate-800' :
                  isForcedSub ? 'bg-red-900/40 border-red-500 animate-pulse ring-1 ring-red-500' : 
                  isSelected ? 'bg-yellow-600/20 border-slate-800/50' : 
                  isRedCarded ? 'bg-red-950/60 border-red-900 opacity-80 grayscale-[50%]' :
                  isUnavailable ? 'bg-red-500/20 border-red-500/40' : 
                  'hover:bg-slate-800 bg-slate-900 border-slate-800/50'} 
                ${isUnavailable && !isRedCarded ? 'opacity-95' : ''}
            `}
        >
            <div className="w-8 shrink-0 flex justify-center"><span className={`w-7 h-5 flex items-center justify-center text-[9px] font-black rounded ${isEmptySlot ? 'bg-slate-700 text-slate-400' : getPosColor(p.position)}`}>{p.position}</span></div>
            <div className="w-8 shrink-0 flex justify-center items-center font-black text-sm md:text-base">
                {!isEmptySlot && <span className={getSkillColorClass(p.skill)}>{p.skill}</span>}
            </div>
            <div className={`w-8 h-8 shrink-0 rounded-full overflow-hidden border ${isEmptySlot ? 'border-dashed border-slate-600 bg-slate-800 flex items-center justify-center' : 'border-slate-600 bg-slate-700 shadow-sm relative'}`}>
                {isEmptySlot ? <User size={14} className="text-slate-500"/> : <PlayerFace player={p} />}
                {!isEmptySlot && p.injury && <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center backdrop-blur-[1px]"><Syringe size={14} className="text-white drop-shadow-md" /></div>}
                {!isEmptySlot && isSuspended && !isRedCarded && <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center backdrop-blur-[1px]"><Ban size={14} className="text-white drop-shadow-md" /></div>}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold truncate ${isEmptySlot ? 'text-slate-500 italic' : isForcedSub ? 'text-red-400' : isRedCarded ? 'text-red-500 line-through' : isUnavailable ? 'text-red-400' : isSelected ? 'text-yellow-400' : 'text-slate-300 group-hover:text-white'}`}>{p.name}</span>
                    {isRedCarded && <div className="w-2.5 h-3.5 bg-red-600 rounded-[1px] border border-red-800 shadow-sm" title="Kırmızı Kart"></div>}
                    {onQuickSwapToggle && !isRedCarded && (
                        <button 
                            onClick={(e) => onQuickSwapToggle(p.id, e)}
                            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-500 hover:text-white"
                            title="Hızlı Değiştir"
                        >
                            <ChevronDown size={14} />
                        </button>
                    )}
                </div>
                {isForcedSub ? (
                    <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">Değiştirilmeli!</span>
                ) : isRedCarded ? (
                    <span className="text-[9px] text-red-600 font-black uppercase flex items-center gap-1"><RectangleVertical size={8} className="fill-red-600"/> ATILDI</span>
                ) : isUnavailable ? (
                    <span className="text-[9px] text-red-500 font-bold uppercase">{isInjured ? 'SAKAT' : 'CEZALI'}</span>
                ) : null}
            </div>
            {!isEmptySlot ? (
                <>
                    <div className="w-12 shrink-0 flex flex-col gap-0.5 justify-center"><div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700"><div className={`h-full ${getConditionColor(currentCondition)}`} style={{ width: `${currentCondition}%` }}></div></div><span className="text-[9px] text-right text-slate-500 font-mono leading-none">{Math.round(currentCondition)}%</span></div>
                    <div className="w-10 shrink-0 flex justify-center items-center gap-0.5" title={`Moral: ${p.morale}`}>
                        {getMoraleIcon(p.morale)}
                        <span className="text-[9px] font-mono text-slate-500">{Math.floor(p.morale)}</span>
                    </div>
                    <div className="w-10 shrink-0 flex justify-center gap-1 text-[10px] font-mono"><span className={`${p.seasonStats.goals > 0 ? 'text-green-400 font-bold' : 'text-slate-600'}`}>{p.seasonStats.goals}</span><span className="text-slate-700">/</span><span className={`${p.seasonStats.assists > 0 ? 'text-blue-400 font-bold' : 'text-slate-600'}`}>{p.seasonStats.assists}</span></div>
                    <div className="w-10 shrink-0 flex justify-center"><div className={`px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[28px] text-center ${ratingColor(p.seasonStats.averageRating || 0)}`}>{p.seasonStats.averageRating ? p.seasonStats.averageRating.toFixed(1) : '-'}</div></div>
                </>
            ) : (
                <>
                    <div className="w-12 shrink-0"></div>
                    <div className="w-10 shrink-0"></div>
                    <div className="w-10 shrink-0"></div>
                    <div className="w-10 shrink-0"></div>
                </>
            )}
        </div>
    );
};

const PlayerListHeader = () => (
    <div className="flex items-center gap-2 p-2 px-3 bg-slate-950 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
        <div className="w-8 text-center">Poz</div><div className="w-8 text-center">Güç</div><div className="w-8 text-center"></div><div className="flex-1 pl-1">Oyuncu İsmi</div><div className="w-12 text-center">Knd</div><div className="w-10 text-center">Mor</div><div className="w-10 text-center">G/A</div><div className="w-10 text-center">Ort</div>
    </div>
);

const SystemSelectionModal = ({ onClose, onSelect }: { onClose: () => void, onSelect: (sys: GameSystem) => void }) => {
    return (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 bg-slate-800 border-b border-slate-700"><h2 className="text-3xl font-bold text-white mb-1 uppercase tracking-widest font-teko">Oyun Sistemi Seçimi</h2><p className="text-slate-400 text-sm">Takımının futbol felsefesini belirle. Formasyon ve talimatlar buna göre ayarlanacak.</p></div>
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Object.values(GameSystem).map(sys => {
                        let icon = <Activity size={32}/>; let desc = ""; let color = "bg-slate-700";
                        switch(sys) {
                            case GameSystem.POSSESSION: icon = <RefreshCw size={32}/>; desc = "Topu kontrol et, rakibi koştur."; color = "bg-blue-600"; break;
                            case GameSystem.GEGENPRESS: icon = <Zap size={32}/>; desc = "Kaybettiğin an bas, nefes aldırma."; color = "bg-red-600"; break;
                            case GameSystem.TIKI_TAKA: icon = <LayoutTemplate size={32}/>; desc = "Kısa paslarla sabırlı hücum."; color = "bg-cyan-600"; break;
                            case GameSystem.VERTICAL_TIKI_TAKA: icon = <ArrowUpFromLine size={32}/>; desc = "Merkezden hızlı ve teknik geçişler."; color = "bg-indigo-600"; break;
                            case GameSystem.WING_PLAY: icon = <MoveHorizontal size={32}/>; desc = "Çizgiye in ve orta aç."; color = "bg-green-600"; break;
                            case GameSystem.LONG_BALL: icon = <ArrowUpFromLine size={32} className="rotate-45"/>; desc = "Risk alma, forvetlere şişir."; color = "bg-orange-600"; break;
                            case GameSystem.HARAMBALL: icon = <Shield size={32}/>; desc = "Otobüsü çek, 0-0'a yat."; color = "bg-slate-500 border-2 border-slate-400"; break;
                            case GameSystem.CUSTOM: icon = <Settings size={32}/>; desc = "Kendi oyun felsefeni sıfırdan yarat."; color = "bg-slate-600"; break;
                        }
                        return (
                            <button key={sys} onClick={() => onSelect(sys)} className="relative group overflow-hidden rounded-xl border border-slate-700 hover:border-yellow-500 transition-all shadow-lg hover:shadow-yellow-900/20 text-left bg-slate-800"><div className={`h-24 ${color} flex items-center justify-center text-white group-hover:scale-105 transition-transform duration-500`}>{icon}</div><div className="p-4"><h3 className="font-bold text-white text-lg leading-tight mb-1">{GAME_SYSTEM_LABELS[sys]}</h3><p className="text-xs text-slate-400">{desc}</p></div></button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const TacticsView = ({ team, setTeam, compact = false, isMatchActive = false, subsUsed = 0, maxSubs = 5, onSubstitution, currentMinute, currentWeek, forcedSubstitutionPlayerId, matchCompetitionId, redCardedPlayerIds = [], initialTab = 'XI' }: TacticsViewProps) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'XI' | 'TACTICS'>(initialTab);
    const [tacticalSubTab, setTacticalSubTab] = useState<'POSSESSION' | 'DEFENSE' | 'KEEPER' | 'SET_PIECES'>('POSSESSION');
    const [showSystemSelector, setShowSystemSelector] = useState(false);
    const [modalData, setModalData] = useState<{isOpen: boolean; key: string; title: string; currentVal: string; options: string[];}>({ isOpen: false, key: '', title: '', currentVal: '', options: [] });

    // Quick Swap State
    const [quickSwapSourceId, setQuickSwapSourceId] = useState<string | null>(null);
    const [quickSwapPos, setQuickSwapPos] = useState<{ top: number, left: number } | null>(null);

    // Ensure we have a valid competition ID
    const effectiveCompId = matchCompetitionId || 'LEAGUE';

    useEffect(() => { if (!team.gameSystem && !isMatchActive) setShowSystemSelector(true); }, [team.gameSystem, isMatchActive]);

    // DERIVED STATS FOR HEADER BARS
    const startingXI = team.players.slice(0, 11);
    const teamChemistry = Math.round((team.morale + team.strength) / 2);
    const avgCondition = Math.round(startingXI.reduce((sum, p) => sum + (p.condition !== undefined ? p.condition : p.stats.stamina), 0) / 11);
    const avgFamiliarity = Math.round(team.morale * 0.8 + (team.strength / 100) * 20);

    const openTacticModal = (key: string, title: string, currentVal: string, options: string[]) => setModalData({ isOpen: true, key, title, currentVal, options });
    const handleApplySystem = (system: GameSystem) => { const preset = TACTICAL_PRESETS[system]; if (preset) { setTeam({ ...team, ...preset }); setShowSystemSelector(false); } };

    const handleTacticChange = (newVal: string) => {
        const key = modalData.key; let update = {};
        switch(key) {
            case 'PASSING': update = { passing: newVal }; break;
            case 'TEMPO': update = { tempo: newVal }; break;
            case 'WIDTH': update = { width: newVal }; break;
            case 'ATTACK_TRANSITION': update = { attackingTransition: newVal }; break;
            case 'CREATIVE': update = { creative: newVal }; break;
            case 'SET_PIECE': update = { setPiecePlay: newVal }; break;
            case 'PLAY_STRATEGY': update = { playStrategy: newVal }; break;
            case 'GOAL_KICK': update = { goalKickType: newVal }; break;
            case 'GK_DIST_TARGET': update = { gkDistributionTarget: newVal }; break;
            case 'SUPPORT_RUNS': update = { supportRuns: newVal }; break;
            case 'DRIBBLING': update = { dribbling: newVal }; break;
            case 'FOCUS_AREA': update = { focusArea: newVal }; break;
            case 'PASS_TARGET': update = { passTarget: newVal }; break;
            case 'PATIENCE': update = { patience: newVal }; break;
            case 'LONG_SHOTS': update = { longShots: newVal }; break;
            case 'CROSSING': update = { crossing: newVal }; break;
            case 'GK_SPEED': update = { gkDistSpeed: newVal }; break;
            case 'PRESS_LINE': update = { pressingLine: newVal }; break;
            case 'DEF_LINE': update = { defLine: newVal }; break;
            case 'DEF_MOBILITY': update = { defLineMobility: newVal }; break;
            case 'PRESS_INTENSITY': update = { pressIntensity: newVal }; break;
            case 'DEF_TRANSITION': update = { defensiveTransition: newVal }; break;
            case 'TACKLING': update = { tackling: newVal }; break;
            case 'PREVENT_CROSS': update = { preventCrosses: newVal }; break;
            case 'PRESS_FOCUS': update = { pressFocus: newVal }; break;
        }
        setTeam({ ...team, ...update });
    };

    const getFormationPosRequirements = (formation: string): Position[] => {
        switch(formation) {
            case '4-4-2': return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.SGB, Position.SLK, Position.OS, Position.OS, Position.SGK, Position.SNT, Position.SNT];
            case '4-3-3': return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.SGB, Position.OS, Position.OS, Position.OS, Position.SLK, Position.SGK, Position.SNT];
            case '4-2-3-1': return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.SGB, Position.OS, Position.OS, Position.SLK, Position.OOS, Position.SGK, Position.SNT];
            case '4-1-4-1': return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.SGB, Position.OS, Position.SLK, Position.OS, Position.OS, Position.SGK, Position.SNT];
            case '3-5-2': return [Position.GK, Position.STP, Position.STP, Position.STP, Position.SLB, Position.OS, Position.OS, Position.OS, Position.SGB, Position.SNT, Position.SNT];
            case '5-3-2': return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.STP, Position.SGB, Position.OS, Position.OS, Position.OS, Position.SNT, Position.SNT];
            case '3-2-4-1': return [Position.GK, Position.STP, Position.STP, Position.STP, Position.OS, Position.OS, Position.SLK, Position.OOS, Position.OOS, Position.SGK, Position.SNT];
            case '4-2-2-2': return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.SGB, Position.OS, Position.OS, Position.OOS, Position.OOS, Position.SNT, Position.SNT];
            case '4-2-4': return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.SGB, Position.OS, Position.OS, Position.SLK, Position.SGK, Position.SNT, Position.SNT];
            case '4-3-2-1': return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.SGB, Position.OS, Position.OS, Position.OS, Position.OOS, Position.OOS, Position.SNT];
            case '3-4-3': return [Position.GK, Position.STP, Position.STP, Position.STP, Position.SLK, Position.OS, Position.OS, Position.SGK, Position.SLK, Position.SNT, Position.SGK];
            default: return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.SGB, Position.SLK, Position.OS, Position.OS, Position.SGK, Position.SNT, Position.SNT];
        }
    };

    const handleAutoPick = () => {
        const unavailablePlayers: Player[] = [];
        const availablePool: Player[] = [];
        team.players.forEach(p => {
            if (p.id.startsWith('empty_')) return; // Ignore dummies
            const isInjured = p.injury && p.injury.daysRemaining > 0;
            let isSuspended = false;
            if (p.suspensions && p.suspensions[effectiveCompId] && p.suspensions[effectiveCompId] > 0) isSuspended = true;
            else if (p.suspendedUntilWeek && currentWeek && p.suspendedUntilWeek > currentWeek) isSuspended = true;
            const isRed = redCardedPlayerIds.includes(p.id);
            if (isInjured || isSuspended || isRed) unavailablePlayers.push(p); else availablePool.push(p);
        });
        availablePool.sort((a, b) => b.skill - a.skill);
        const newStartingXI: (Player | null)[] = new Array(11).fill(null);
        const requirements = getFormationPosRequirements(team.formation);
        requirements.forEach((reqPos, index) => {
            let candidateIndex = availablePool.findIndex(p => p.position === reqPos);
            if (candidateIndex !== -1) {
                newStartingXI[index] = availablePool[candidateIndex];
                availablePool.splice(candidateIndex, 1);
            }
        });
        newStartingXI.forEach((slot, index) => {
            if (slot === null) {
                const reqPos = requirements[index];
                let candidateIndex = availablePool.findIndex(p => p.secondaryPosition === reqPos);
                if (candidateIndex !== -1) {
                    newStartingXI[index] = availablePool[candidateIndex];
                    availablePool.splice(candidateIndex, 1);
                }
            }
        });
        newStartingXI.forEach((slot, index) => {
            if (slot === null && availablePool.length > 0) {
                newStartingXI[index] = availablePool[0];
                availablePool.shift();
            }
        });
        const bench = availablePool.splice(0, 7);
        const finalRoster = [...(newStartingXI.filter(p => p !== null) as Player[]), ...bench, ...availablePool, ...unavailablePlayers];
        setTeam({ ...team, players: finalRoster });
    };

    const handleRemoveFromPosition = (playerId: string) => {
        const newPlayers = [...team.players];
        const idx = newPlayers.findIndex(p => p.id === playerId);
        if (idx !== -1 && idx < 18) {
            const player = newPlayers[idx];
            const dummy = createEmptySlot(player.position);
            newPlayers[idx] = dummy;
            newPlayers.push(player);
            
            const cleanedPlayers = newPlayers.filter((p, index) => {
                if (index < 18) return true;
                return !p.id.startsWith('empty_');
            });
            
            setTeam({ ...team, players: cleanedPlayers });
        }
        setQuickSwapSourceId(null);
        setQuickSwapPos(null);
    };

    const executeSwap = (id1: string, id2: string) => {
        const idx1 = team.players.findIndex(p => p.id === id1);
        const idx2 = team.players.findIndex(p => p.id === id2);
        if (idx1 !== -1 && idx2 !== -1) {
            const p1 = team.players[idx1]; const p2 = team.players[idx2];
            if (isMatchActive) {
                const isPitch1 = idx1 < 11; const isPitch2 = idx2 < 11; const isBench1 = idx1 >= 11 && idx1 < 18; const isBench2 = idx2 >= 11 && idx2 < 18;
                const playerComingOn = (idx1 >= 11 && idx2 < 11) ? p1 : (idx2 >= 11 && idx1 < 11) ? p2 : null;
                if (playerComingOn && playerComingOn.injury && playerComingOn.injury.daysRemaining > 0) { alert("Sakatlanan oyuncu oyuna tekrar giremez!"); return; }
                const isRed1 = redCardedPlayerIds.includes(p1.id); const isRed2 = redCardedPlayerIds.includes(p2.id);
                if (isRed1 || isRed2) {
                    if (isPitch1 && isPitch2) {
                         const newPlayers = [...team.players]; [newPlayers[idx1], newPlayers[idx2]] = [newPlayers[idx2], newPlayers[idx1]]; setTeam({ ...team, players: newPlayers });
                    } else alert("Kırmızı kart gören oyuncu değiştirilemez!");
                    return;
                }
                if ((isPitch1 && isBench2) || (isPitch2 && isBench1)) {
                    if (forcedSubstitutionPlayerId && p1.id !== forcedSubstitutionPlayerId && p2.id !== forcedSubstitutionPlayerId) { alert("Önce sakatlanan oyuncuyu değiştirmelisiniz!"); return; }
                    if (subsUsed !== undefined && maxSubs !== undefined && subsUsed >= maxSubs) { alert(`Değişiklik hakkınız doldu! (Max: ${maxSubs})`); return; }
                    if (onSubstitution) onSubstitution(isPitch1 ? p2 : p1, isPitch1 ? p1 : p2);
                    const newPlayers = [...team.players]; [newPlayers[idx1], newPlayers[idx2]] = [newPlayers[idx2], newPlayers[idx1]]; setTeam({ ...team, players: newPlayers });
                } else if (isPitch1 && isPitch2) { 
                     const newPlayers = [...team.players]; [newPlayers[idx1], newPlayers[idx2]] = [newPlayers[idx2], newPlayers[idx1]]; setTeam({ ...team, players: newPlayers }); 
                } 
                else { if (idx1 >= 18 || idx2 >= 18) alert("Maç sırasında kadro dışı oyuncularla işlem yapamazsınız."); }
            } else {
                const checkSuspension = (p: Player) => {
                    if (p.id.startsWith('empty_')) return false;
                    if (p.suspensions && p.suspensions[effectiveCompId] && p.suspensions[effectiveCompId] > 0) return true;
                    return p.suspendedUntilWeek && currentWeek && p.suspendedUntilWeek > currentWeek;
                }
                if (idx2 < 18 && checkSuspension(p1)) { alert(`UYARI: ${p1.name} cezalı!`); return; }
                if (idx1 < 18 && checkSuspension(p2)) { alert(`UYARI: ${p2.name} cezalı!`); return; }
                if (idx2 < 18 && p1.injury && p1.injury.daysRemaining > 0 && !p1.id.startsWith('empty_')) { alert(`UYARI: ${p1.name} sakat!`); return; }
                if (idx1 < 18 && p2.injury && p2.injury.daysRemaining > 0 && !p2.id.startsWith('empty_')) { alert(`UYARI: ${p2.name} sakat!`); return; }
                
                const newPlayers = [...team.players]; 
                [newPlayers[idx1], newPlayers[idx2]] = [newPlayers[idx2], newPlayers[idx1]];
                
                const cleanedPlayers = newPlayers.filter((p, index) => {
                    if (index < 18) return true;
                    return !p.id.startsWith('empty_');
                });

                setTeam({ ...team, players: cleanedPlayers });
            }
        }
    };

    const handlePlayerClick = (clickedPlayer: Player) => {
        if (!selectedPlayerId) setSelectedPlayerId(clickedPlayer.id); 
        else {
            if (selectedPlayerId === clickedPlayer.id) { setSelectedPlayerId(null); return; }
            executeSwap(selectedPlayerId, clickedPlayer.id);
            setSelectedPlayerId(null);
        }
    };

    // --- QUICK SWAP LOGIC ---
    const handleQuickSwapToggle = (playerId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (quickSwapSourceId === playerId) {
            setQuickSwapSourceId(null);
            setQuickSwapPos(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            let top = rect.bottom + 4;
            let left = rect.left; 
            
            const menuHeight = 350;
            const menuWidth = Math.min(window.innerWidth * 0.9, 550);
            
            if (left + menuWidth > window.innerWidth) {
                left = window.innerWidth - menuWidth - 20;
            }
            if (left < 10) left = 10;

            if (top + menuHeight > window.innerHeight) {
                top = rect.top - menuHeight - 4;
            }
            
            setQuickSwapPos({ top, left });
            setQuickSwapSourceId(playerId);
        }
    };

    const handleQuickSwapExecute = (targetId: string) => {
        if (quickSwapSourceId) {
            executeSwap(quickSwapSourceId, targetId);
        }
        setQuickSwapSourceId(null);
        setQuickSwapPos(null);
    };

    const SetPieceSelector = ({ type, icon: Icon, title }: { type: keyof SetPieceTakers, icon: any, title: string }) => {
        const selectedId = team.setPieceTakers?.[type];
        const sortedCandidates = [...team.players].sort((a, b) => {
            if (type === 'penalty') return b.stats.penalty - a.stats.penalty; if (type === 'freeKick') return b.stats.freeKick - a.stats.freeKick; if (type === 'corner') return b.stats.corners - a.stats.corners; return b.stats.leadership - a.stats.leadership;
        });
        return (
            <div className="bg-[#1e232e] rounded-xl border border-slate-700 p-4 shadow-lg hover:border-slate-500 transition-colors">
                <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2"><h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wide"><Icon size={16} className="text-green-400"/> {title}</h3><div className="text-[10px] text-slate-400 font-bold uppercase">{selectedId ? 'Seçildi' : 'Seçilmedi'}</div></div>
                <div className="h-64 overflow-y-auto custom-scrollbar space-y-1 pr-1">{sortedCandidates.filter(p => !p.id.startsWith('empty_')).map(p => { const isChosen = p.id === selectedId; let statVal = type === 'penalty' ? p.stats.penalty : type === 'freeKick' ? p.stats.freeKick : type === 'corner' ? p.stats.corners : p.stats.leadership; return (<div key={p.id} onClick={() => setTeam({...team, setPieceTakers: { ...team.setPieceTakers, [type]: p.id }})} className={`flex items-center justify-between p-2 rounded cursor-pointer transition border ${isChosen ? 'bg-green-900/30 border-green-500' : 'bg-slate-800/50 border-transparent hover:bg-slate-700'}`}><div className="flex items-center gap-2"><div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white ${p.position === 'GK' ? 'bg-yellow-600' : 'bg-blue-600'}`}>{p.position}</div><span className={`text-sm font-medium ${isChosen ? 'text-green-400 font-bold' : 'text-slate-300'}`}>{p.name}</span></div><div className={`text-sm font-black font-mono ${statVal >= 15 ? 'text-green-500' : statVal >= 10 ? 'text-yellow-500' : 'text-slate-500'}`}>{statVal}</div></div>); })}</div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white relative">
            {showSystemSelector && !isMatchActive && (<SystemSelectionModal onClose={() => setShowSystemSelector(false)} onSelect={handleApplySystem} />)}
            {modalData.isOpen && <TacticDetailModal title={modalData.title} tacticKey={modalData.key} currentValue={modalData.currentVal} options={modalData.options} onSelect={handleTacticChange} onClose={() => setModalData({ ...modalData, isOpen: false })} />}
            
            {/* QUICK SWAP MENU */}
            {quickSwapSourceId && (
                <div className="fixed inset-0 z-[200]" onClick={() => { setQuickSwapSourceId(null); setQuickSwapPos(null); }} onContextMenu={(e) => { e.preventDefault(); setQuickSwapSourceId(null); setQuickSwapPos(null); }}>
                    <div 
                        className="absolute bg-[#1a1e24] border border-slate-600 rounded-lg shadow-[0_10px_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: quickSwapPos?.top, left: quickSwapPos?.left, width: 'min(90vw, 550px)', maxHeight: '350px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* NEW HEADER FOR QUICK SWAP */}
                        {(() => {
                            const sourcePlayer = team.players.find((p: Player) => p.id === quickSwapSourceId);
                            if (!sourcePlayer) return null;
                            const sourcePosName = getPositionFullName(sourcePlayer.position);
                            const isSourceDummy = sourcePlayer.id.startsWith('empty_');
                            const firstName = sourcePlayer.name.split(' ')[0];

                            return (
                                <div className="flex items-center justify-between px-4 py-3 bg-[#111318] border-b border-slate-700 gap-4 shrink-0">
                                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                        <span className="text-[#ff9f43] font-bold text-[11px] uppercase whitespace-nowrap">{sourcePosName}</span>
                                        <span className="text-white font-bold text-[11px] uppercase truncate">
                                            {isSourceDummy ? 'BU MEVKİ İÇİN OYUNCU SEÇİN:' : `${firstName.toUpperCase()}'Yİ ŞU OYUNCUYLA DEĞİŞTİR:`}
                                        </span>
                                    </div>
                                    {!isSourceDummy && (
                                        <button
                                            onClick={() => handleRemoveFromPosition(sourcePlayer.id)}
                                            className="border border-slate-500 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded text-[10px] uppercase font-bold transition shrink-0"
                                        >
                                            {firstName}'yi bu mevkiden çıkar
                                        </button>
                                    )}
                                </div>
                            );
                        })()}

                        <div className="flex items-center px-3 py-2 bg-[#101216] border-b border-slate-700 text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                            <div className="w-8 text-center">Durum</div>
                            <div className="w-8 text-center"></div>
                            <div className="flex-1 pl-2">Oyuncu</div>
                            <div className="w-10 text-center">Güç</div>
                            <div className="w-10 text-center">Knd</div>
                            <div className="w-10 text-center">Mor</div>
                            <div className="w-14 text-center">Mevki</div>
                            <div className="w-12 text-center">Ort P</div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                            {(() => {
                                const sourcePlayer = team.players.find((p: Player) => p.id === quickSwapSourceId);
                                if (!sourcePlayer) return null;

                                const sortedCandidates = [...team.players]
                                    .filter((p: Player) => p.id !== quickSwapSourceId && !p.id.startsWith('empty_'))
                                    .sort((a: Player, b: Player) => {
                                        const isAMatch = a.position === sourcePlayer.position;
                                        const isBMatch = b.position === sourcePlayer.position;
                                        if (isAMatch && !isBMatch) return -1;
                                        if (!isAMatch && isBMatch) return 1;

                                        const isASecondaryMatch = a.secondaryPosition === sourcePlayer.position;
                                        const isBSecondaryMatch = b.secondaryPosition === sourcePlayer.position;
                                        if (isASecondaryMatch && !isBSecondaryMatch) return -1;
                                        if (!isASecondaryMatch && isBSecondaryMatch) return 1;

                                        return b.skill - a.skill;
                                    });

                                return sortedCandidates.map((p: Player) => {
                                    const idx = team.players.findIndex((x: Player) => x.id === p.id);
                                    const label = idx < 11 ? p.position : idx < 18 ? `Y${idx - 10}` : 'REZ';
                                    const cond = p.condition !== undefined ? p.condition : p.stats.stamina;
                                    const getConditionColor = (c: number) => c >= 80 ? 'text-green-500 fill-green-500' : c >= 50 ? 'text-yellow-500 fill-yellow-500' : 'text-red-500 fill-red-500';
                                    const getMoraleIcon = (m: number) => {
                                        if (m >= 90) return <ChevronUp size={14} className="text-green-500" strokeWidth={4} />;
                                        if (m >= 75) return <ChevronUp size={14} className="text-green-400" />;
                                        if (m >= 50) return <Minus size={14} className="text-yellow-500" />;
                                        return <ChevronDown size={14} className="text-red-500" />;
                                    };

                                    return (
                                        <div key={p.id} onClick={() => handleQuickSwapExecute(p.id)} className="flex items-center px-2 py-1.5 border-b border-slate-700/30 hover:bg-[#252a33] cursor-pointer group transition-colors rounded">
                                            <div className="w-8 text-center text-[10px] font-bold text-slate-500 group-hover:text-white transition-colors">{label}</div>
                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600 bg-slate-700 shrink-0 shadow-sm group-hover:border-yellow-500 transition-colors">
                                                <PlayerFace player={p} />
                                            </div>
                                            <div className="flex-1 min-w-0 px-3">
                                                <div className="text-xs font-bold text-slate-300 group-hover:text-yellow-400 truncate transition-colors">{p.name}</div>
                                            </div>
                                            <div className="w-10 text-center font-black text-xs text-white">{p.skill}</div>
                                            <div className="w-10 flex justify-center"><Heart size={14} className={getConditionColor(cond)} fill="currentColor" /></div>
                                            <div className="w-10 flex justify-center">{getMoraleIcon(p.morale)}</div>
                                            <div className="w-14 text-center text-[10px] font-bold text-slate-400">{p.position}</div>
                                            <div className="w-12 text-center font-bold text-xs text-yellow-500">{p.seasonStats.averageRating ? p.seasonStats.averageRating.toFixed(2) : '-'}</div>
                                        </div>
                                    )
                                });
                            })()}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-slate-800 border-b border-slate-700 shrink-0 shadow-lg z-20">
                <div className="px-6 py-4 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
                        <div className="flex items-center gap-2"><Activity className="text-yellow-500" size={24}/><div><h2 className="text-xl font-bold text-white uppercase tracking-wider leading-none">Taktik Merkezi</h2>{team.gameSystem && <span className="text-[10px] text-slate-400 font-bold uppercase">{GAME_SYSTEM_LABELS[team.gameSystem]}</span>}</div></div>
                        {!isMatchActive && (<button onClick={() => setShowSystemSelector(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-all"><LayoutTemplate size={14}/> Sistem Değiştir</button>)}
                        {isMatchActive && (<div className="bg-slate-700 px-4 py-1.5 rounded-full border border-slate-600 text-xs font-bold text-slate-300 flex items-center gap-2"><Timer size={14} className="text-red-500"/>{currentMinute}' / Değişiklik: <span className={`${subsUsed >= maxSubs ? 'text-red-500' : 'text-green-500'}`}>{subsUsed}/{maxSubs}</span></div>)}
                    </div>
                    {activeTab === 'XI' && (
                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-center lg:justify-end bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                            
                            <FormationSelector 
                                value={team.formation}
                                onChange={(val) => setTeam({...team, formation: val})}
                                disabled={isMatchActive && !!forcedSubstitutionPlayerId}
                            />

                            <MentalitySelector 
                                value={team.mentality}
                                onChange={(val) => setTeam({...team, mentality: val})}
                                disabled={false}
                            />
                            
                            <div className="w-px h-10 bg-slate-700 mx-2 hidden sm:block"></div>

                            {/* DYNAMIC HEADER BARS - ENLARGED & REORDERED */}
                            <div className="flex items-center gap-6 px-2">
                                {/* Familiarity (Yatkınlık) - Moved to first position */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center px-0.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Yatkınlık</span>
                                        <span className="text-xs font-black text-blue-400">%{avgFamiliarity}</span>
                                    </div>
                                    <div className="w-20 sm:w-28 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                                        <div className={`h-full ${avgFamiliarity > 80 ? 'bg-blue-500' : avgFamiliarity > 60 ? 'bg-blue-600' : 'bg-slate-600'} transition-all duration-700`} style={{width: `${avgFamiliarity}%`}}></div>
                                    </div>
                                </div>
                                
                                {/* Condition - Stays in middle */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center px-0.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Kondisyon</span>
                                        <span className="text-xs font-black text-green-400">%{avgCondition}</span>
                                    </div>
                                    <div className="w-20 sm:w-28 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                                        <div className={`h-full ${avgCondition > 85 ? 'bg-green-500' : avgCondition > 70 ? 'bg-green-600' : 'bg-red-500'} transition-all duration-700`} style={{width: `${avgCondition}%`}}></div>
                                    </div>
                                </div>

                                {/* Chemistry (Kimya) - Moved to third position */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-center px-0.5">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Kimya</span>
                                        <span className="text-xs font-black text-slate-200">%{teamChemistry}</span>
                                    </div>
                                    <div className="w-20 sm:w-28 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                                        <div className={`h-full ${teamChemistry > 80 ? 'bg-yellow-500' : teamChemistry > 60 ? 'bg-yellow-600' : 'bg-red-500'} transition-all duration-700`} style={{width: `${teamChemistry}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex px-6 gap-6">
                    <button onClick={() => setActiveTab('XI')} className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-4 transition-all ${activeTab === 'XI' ? 'border-yellow-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><Users size={16} className="inline mr-2 mb-0.5"/> Kadro & Saha</button>
                    <button onClick={() => setActiveTab('TACTICS')} className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-4 transition-all ${activeTab === 'TACTICS' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><Shield size={16} className="inline mr-2 mb-0.5"/> Taktik Talimatlar</button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'XI' && (
                    <div className="h-full flex flex-col md:flex-row">
                        <div className="w-full md:w-[65%] h-1/2 md:h-full bg-slate-900 border-r border-slate-800 relative shadow-inner p-4 md:p-8 flex items-center justify-center">
                            <PitchVisual 
                                players={team.players} 
                                onPlayerClick={handlePlayerClick} 
                                selectedPlayerId={selectedPlayerId} 
                                formation={team.formation} 
                                matchCompetitionId={effectiveCompId} 
                                currentWeek={currentWeek} 
                                redCardedPlayerIds={redCardedPlayerIds}
                                onQuickSwapToggle={handleQuickSwapToggle}
                            />
                        </div>
                        <div className="w-full md:w-[35%] h-1/2 md:h-full bg-slate-900 flex flex-col border-l border-slate-800 shadow-xl z-10">
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900">
                                <div><div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-green-600/50 sticky top-0 z-20"><h4 className="text-xs font-black text-green-500 uppercase tracking-wider">İLK 11</h4><span className="text-[9px] font-bold text-slate-500">11 Oyuncu</span></div><PlayerListHeader /><div className="divide-y divide-slate-800/50">{team.players.slice(0, 11).map((p, i) => <CompactPlayerRow key={p.id} p={p} index={i} onClick={handlePlayerClick} isSelected={selectedPlayerId === p.id} currentWeek={currentWeek} isForcedSub={forcedSubstitutionPlayerId === p.id} competitionId={effectiveCompId} isRedCarded={redCardedPlayerIds.includes(p.id)} onQuickSwapToggle={handleQuickSwapToggle} />)}</div></div>
                                <div><div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-blue-600/50 mt-4 sticky top-0 z-20"><h4 className="text-xs font-black text-blue-500 uppercase tracking-wider">YEDEKLER</h4><span className="text-[9px] font-bold text-slate-500">7 Oyuncu</span></div><PlayerListHeader /><div className="divide-y divide-slate-800/50">{team.players.slice(11, 18).map((p, i) => <CompactPlayerRow key={p.id} p={p} index={i} onClick={handlePlayerClick} isSelected={selectedPlayerId === p.id} label={`Y${i+1}`} currentWeek={currentWeek} isForcedSub={forcedSubstitutionPlayerId === p.id} competitionId={effectiveCompId} isRedCarded={redCardedPlayerIds.includes(p.id)} onQuickSwapToggle={handleQuickSwapToggle} />)}</div></div>
                                {!isMatchActive && (<div><div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-600/50 mt-4 sticky top-0 z-20"><h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">KADRO DIŞI</h4><span className="text-[9px] font-bold text-slate-500">{team.players.length - 18} Oyuncu</span></div><PlayerListHeader /><div className="divide-y divide-slate-800/50">{team.players.slice(18).filter(p => !p.id.startsWith('empty_')).map((p, i) => <CompactPlayerRow key={p.id} p={p} index={i} onClick={handlePlayerClick} isSelected={selectedPlayerId === p.id} label="REZ" currentWeek={currentWeek} isReserve isForcedSub={forcedSubstitutionPlayerId === p.id} competitionId={effectiveCompId} isRedCarded={redCardedPlayerIds.includes(p.id)} onQuickSwapToggle={handleQuickSwapToggle} />)}</div></div>)}
                            </div>
                            {!isMatchActive && (<div className="p-4 bg-slate-800 border-t border-slate-700 shadow-lg"><button onClick={handleAutoPick} className="w-full bg-blue-800 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 group"><Zap size={18} className="fill-white group-hover:scale-110 transition-transform"/> HIZLI SEÇİM</button></div>)}
                        </div>
                    </div>
                )}
                {activeTab === 'TACTICS' && (
                    <div className="flex flex-col h-full bg-[#121519]">
                        <div className="flex items-center justify-center p-4 gap-2 md:gap-4 bg-[#161a1f] border-b border-slate-700 overflow-x-auto no-scrollbar"><button onClick={() => setTacticalSubTab('POSSESSION')} className={`px-4 md:px-6 py-2 rounded-full font-bold text-xs md:text-sm transition-all whitespace-nowrap ${tacticalSubTab === 'POSSESSION' ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>TOPA SAHİPKEN</button><button onClick={() => setTacticalSubTab('DEFENSE')} className={`px-4 md:px-6 py-2 rounded-full font-bold text-xs md:text-sm transition-all whitespace-nowrap ${tacticalSubTab === 'DEFENSE' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>TOP RAKİPTEYKEN</button><button onClick={() => setTacticalSubTab('KEEPER')} className={`px-4 md:px-6 py-2 rounded-full font-bold text-xs md:text-sm transition-all whitespace-nowrap ${tacticalSubTab === 'KEEPER' ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>KALECİ</button><button onClick={() => setTacticalSubTab('SET_PIECES')} className={`px-4 md:px-6 py-2 rounded-full font-bold text-xs md:text-sm transition-all whitespace-nowrap ${tacticalSubTab === 'SET_PIECES' ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(22,163,74,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>DURAN TOPLAR</button></div>
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                            {tacticalSubTab === 'POSSESSION' && (<div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4"><TacticalInstructionCard title="Pas Anlayışı" icon={MoveRight} value={team.passing} options={Object.values(PassingStyle)} tacticKey="PASSING" onOpenModal={openTacticModal} /><TacticalInstructionCard title="Tempo" icon={Gauge} value={team.tempo} options={Object.values(Tempo)} tacticKey="TEMPO" onOpenModal={openTacticModal} /><TacticalInstructionCard title="Hücum Genişliği" icon={MoveHorizontal} value={team.width} options={Object.values(Width)} tacticKey="WIDTH" onOpenModal={openTacticModal} /><TacticalInstructionCard title="Hücum Geçişi" icon={FastForward} value={team.attackingTransition} options={Object.values(AttackingTransition)} tacticKey="ATTACK_TRANSITION" onOpenModal={openTacticModal} /><TacticalInstructionCard title="Yaratıcılık" icon={Sparkles} value={team.creative} options={Object.values(CreativeFreedom)} tacticKey="CREATIVE" onOpenModal={openTacticModal} /><TacticalInstructionCard title="Oyun Stratejisi" icon={Crosshair} value={team.playStrategy || PlayStrategy.STANDARD} options={Object.values(PlayStrategy)} tacticKey="PLAY_STRATEGY" onOpenModal={openTacticModal} /><TacticalInstructionCard title="Destek Koşuları" icon={ArrowUpFromLine} value={team.supportRuns || SupportRuns.BALANCED} options={Object.values(SupportRuns)} tacticKey="SUPPORT_RUNS" onOpenModal={openTacticModal} /><TacticalInstructionCard title="Dripling" icon={MoveRight} value={team.dribbling || Dribbling.STANDARD} options={Object.values(Dribbling)} tacticKey="DRIBBLING" onOpenModal={openTacticModal} /><TacticalInstructionCard title="Oynanacak Bölge" icon={ScanLine} value={team.focusArea || FocusArea.STANDARD} options={Object.values(FocusArea)} tacticKey="FOCUS_AREA" onOpenModal={openTacticModal} /><TacticalInstructionCard title="Pas Karşılama" icon={Target} value={team.passTarget || PassTarget.STANDARD} options={Object.values(PassTarget)} tacticKey="PASS_TARGET" onOpenModal={openTacticModal} /><TacticalInstructionCard title="Sabır (Son Bölge)" icon={Timer} value={team.patience || Patience.STANDARD} options={Object.values(Patience)} tacticKey="PATIENCE" onOpenModal={openTacticModal} /><TacticalInstructionCard title="Uzaktan Şutlar" icon={Goal} value={team.longShots || LongShots.STANDARD} options={Object.values(LongShots)} tacticKey="LONG_SHOTS" onOpenModal={openTacticModal} /><TacticalInstructionCard title="Orta Açış Şekli" icon={GitCommit} value={team.crossing} options={Object.values(CrossingType)} tacticKey="CROSSING" onOpenModal={openTacticModal} /></div>)}
                            {tacticalSubTab === 'DEFENSE' && (<div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4"><TacticalInstructionCard title="Baskı Hattı" icon={Users} value={team.pressingLine || PressingLine.MID} options={Object.values(PressingLine)} tacticKey="PRESS_LINE" onOpenModal={openTacticModal} colorClass="text-blue-400" /><TacticalInstructionCard title="Savunma Hattı" icon={Anchor} value={team.defLine} options={Object.values(DefensiveLine)} tacticKey="DEF_LINE" onOpenModal={openTacticModal} colorClass="text-blue-400" /><TacticalInstructionCard title="Hat Hareketliliği" icon={MoveHorizontal} value={team.defLineMobility || DefLineMobility.BALANCED} options={Object.values(DefLineMobility)} tacticKey="DEF_MOBILITY" onOpenModal={openTacticModal} colorClass="text-blue-400" /><TacticalInstructionCard title="Pres Şiddeti" icon={Zap} value={team.pressIntensity || PressIntensity.STANDARD} options={Object.values(PressIntensity)} tacticKey="PRESS_INTENSITY" onOpenModal={openTacticModal} colorClass="text-blue-400" /><TacticalInstructionCard title="Savunma Geçişi" icon={Shield} value={team.defensiveTransition || DefensiveTransition.STANDARD} options={Object.values(DefensiveTransition)} tacticKey="DEF_TRANSITION" onOpenModal={openTacticModal} colorClass="text-blue-400" /><TacticalInstructionCard title="Topa Müdahale" icon={AlertTriangle} value={team.tackling} options={Object.values(Tackling)} tacticKey="TACKLING" onOpenModal={openTacticModal} colorClass="text-blue-400" /><TacticalInstructionCard title="Rakibe Orta Fırsatı" icon={Ban} value={team.preventCrosses || PreventCrosses.STANDARD} options={Object.values(PreventCrosses)} tacticKey="PREVENT_CROSS" onOpenModal={openTacticModal} colorClass="text-blue-400" /><TacticalInstructionCard title="Pres Odağı" icon={Target} value={team.pressFocus} options={Object.values(PressingFocus)} tacticKey="PRESS_FOCUS" onOpenModal={openTacticModal} colorClass="text-blue-400" /></div>)}
                            {tacticalSubTab === 'KEEPER' && (<div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4"><TacticalInstructionCard title="Aut Atışı" icon={Goal} value={team.goalKickType || GoalKickType.STANDARD} options={Object.values(GoalKickType)} tacticKey="GOAL_KICK" onOpenModal={openTacticModal} colorClass="text-orange-400" /><TacticalInstructionCard title="Oyun Kurulumu Hedefi" icon={Target} value={team.gkDistributionTarget || GKDistributionTarget.CBS} options={Object.values(GKDistributionTarget)} tacticKey="GK_DIST_TARGET" onOpenModal={openTacticModal} colorClass="text-orange-400" /><TacticalInstructionCard title="Oyuna Sokma Hızı" icon={Timer} value={team.gkDistSpeed || GKDistributionSpeed.STANDARD} options={Object.values(GKDistributionSpeed)} tacticKey="GK_SPEED" onOpenModal={openTacticModal} colorClass="text-orange-400" /></div>)}
                            {tacticalSubTab === 'SET_PIECES' && (<div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4"><TacticalInstructionCard title="Duran Top Stratejisi" icon={Activity} value={team.setPiecePlay || SetPiecePlay.RECYCLE} options={Object.values(SetPiecePlay)} tacticKey="SET_PIECE" onOpenModal={openTacticModal} colorClass="text-green-400" /><SetPieceSelector type="freeKick" icon={Target} title="Serbest Vuruşçu" /><SetPieceSelector type="corner" icon={Activity} title="Kornerci" /><SetPieceSelector type="captain" icon={Star} title="Takım Kaptanı" /><SetPieceSelector type="penalty" icon={Goal} title="Penaltıcı" /></div>)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TacticsView;