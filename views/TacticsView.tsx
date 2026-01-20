

import React, { useState, useEffect } from 'react';
import { Team, Player, Mentality, PassingStyle, Tempo, Width, AttackingTransition, CreativeFreedom, SetPiecePlay, PlayStrategy, GoalKickType, GKDistributionTarget, SupportRuns, Dribbling, FocusArea, PassTarget, Patience, LongShots, CrossingType, GKDistributionSpeed, PressingLine, DefensiveLine, DefLineMobility, PressIntensity, DefensiveTransition, Tackling, PreventCrosses, PressingFocus, Position, SetPieceTakers, TimeWasting, GameSystem } from '../types';
import PitchVisual from '../components/shared/PitchVisual';
import { Syringe, Ban, Zap, Users, Target, Goal, Shield, Activity, Star, AlertTriangle, MoveRight, Gauge, Timer, MoveHorizontal, Flag, Sparkles, ArrowUpFromLine, GitCommit, MousePointerClick, Anchor, ArrowLeftRight, Crosshair, FastForward, ScanLine, ChevronUp, ChevronDown, Minus, RefreshCw, LayoutTemplate } from 'lucide-react';
import TacticDetailModal from '../modals/TacticDetailModal';
import { TACTICAL_DESCRIPTIONS } from '../data/tacticalDescriptions';
import PlayerFace from '../components/shared/PlayerFace';
import { TACTICAL_PRESETS } from '../data/tacticalPresets';

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
}

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
}

const CompactPlayerRow: React.FC<CompactPlayerRowProps> = ({ p, index, onClick, isSelected, label, currentWeek, isReserve, isForcedSub }) => {
    const isSuspended = p.suspendedUntilWeek && currentWeek && p.suspendedUntilWeek > currentWeek;
    const currentCondition = p.condition !== undefined ? p.condition : p.stats.stamina;
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
                ${isForcedSub ? 'bg-red-900/40 border-red-500 animate-pulse ring-1 ring-red-500' : isSelected ? 'bg-yellow-600/20 border-slate-800/50' : 'hover:bg-slate-800 bg-slate-900 border-slate-800/50'} 
                ${(p.injury || isSuspended) ? 'opacity-75' : ''}
            `}
        >
            <div className="w-8 shrink-0 flex justify-center"><span className={`w-7 h-5 flex items-center justify-center text-[9px] font-black rounded ${getPosColor(p.position)}`}>{p.position}</span></div>
            <div className="w-8 shrink-0 flex justify-center items-center font-black text-sm md:text-base"><span className={getSkillColorClass(p.skill)}>{p.skill}</span></div>
            <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden border border-slate-600 bg-slate-700 shadow-sm relative"><PlayerFace player={p} />{p.injury && <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center backdrop-blur-[1px]"><Syringe size={14} className="text-white drop-shadow-md" /></div>}{isSuspended && <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center backdrop-blur-[1px]"><Ban size={14} className="text-white drop-shadow-md" /></div>}</div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className={`text-xs font-bold truncate ${isForcedSub ? 'text-red-400' : isSelected ? 'text-yellow-400' : 'text-slate-300 group-hover:text-white'}`}>{p.name}</span>
                {isForcedSub && <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">Değiştirilmeli!</span>}
            </div>
            <div className="w-12 shrink-0 flex flex-col gap-0.5 justify-center"><div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700"><div className={`h-full ${getConditionColor(currentCondition)}`} style={{ width: `${currentCondition}%` }}></div></div><span className="text-[9px] text-right text-slate-500 font-mono leading-none">{Math.round(currentCondition)}%</span></div>
            <div className="w-6 shrink-0 flex justify-center items-center" title={`Moral: ${p.morale}`}>{getMoraleIcon(p.morale)}</div>
            <div className="w-10 shrink-0 flex justify-center gap-1 text-[10px] font-mono"><span className={`${p.seasonStats.goals > 0 ? 'text-green-400 font-bold' : 'text-slate-600'}`}>{p.seasonStats.goals}</span><span className="text-slate-700">/</span><span className={`${p.seasonStats.assists > 0 ? 'text-blue-400 font-bold' : 'text-slate-600'}`}>{p.seasonStats.assists}</span></div>
            <div className="w-10 shrink-0 flex justify-center"><div className={`px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[28px] text-center ${ratingColor(p.seasonStats.averageRating || 0)}`}>{p.seasonStats.averageRating ? p.seasonStats.averageRating.toFixed(1) : '-'}</div></div>
        </div>
    );
};

const PlayerListHeader = () => (
    <div className="flex items-center gap-2 p-2 px-3 bg-slate-950 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 z-10">
        <div className="w-8 text-center">Poz</div><div className="w-8 text-center">Güç</div><div className="w-8 text-center"></div><div className="flex-1 pl-1">Oyuncu İsmi</div><div className="w-12 text-center">Knd</div><div className="w-6 text-center">Mor</div><div className="w-10 text-center">G/A</div><div className="w-10 text-center">Ort</div>
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
                        }
                        return (
                            <button key={sys} onClick={() => onSelect(sys)} className="relative group overflow-hidden rounded-xl border border-slate-700 hover:border-yellow-500 transition-all shadow-lg hover:shadow-yellow-900/20 text-left bg-slate-800"><div className={`h-24 ${color} flex items-center justify-center text-white group-hover:scale-105 transition-transform duration-500`}>{icon}</div><div className="p-4"><h3 className="font-bold text-white text-lg leading-tight mb-1">{sys}</h3><p className="text-xs text-slate-400">{desc}</p></div></button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const TacticsView = ({ team, setTeam, compact = false, isMatchActive = false, subsUsed = 0, maxSubs = 5, onSubstitution, currentMinute, currentWeek, forcedSubstitutionPlayerId }: TacticsViewProps) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'XI' | 'TACTICS'>('XI');
    const [tacticalSubTab, setTacticalSubTab] = useState<'POSSESSION' | 'DEFENSE' | 'KEEPER' | 'SET_PIECES'>('POSSESSION');
    const [showSystemSelector, setShowSystemSelector] = useState(false);
    const [modalData, setModalData] = useState<{isOpen: boolean; key: string; title: string; currentVal: string; options: string[];}>({ isOpen: false, key: '', title: '', currentVal: '', options: [] });

    useEffect(() => { if (!team.gameSystem && !isMatchActive) setShowSystemSelector(true); }, [team.gameSystem, isMatchActive]);

    const teamChemistry = Math.round((team.morale + team.strength) / 2);
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

    // FORMASYON BAZLI MEVKİ GEREKSİNİMLERİ (DİNAMİK SEÇİM İÇİN)
    const getFormationPosRequirements = (formation: string): Position[] => {
        switch(formation) {
            case '4-4-2': return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.SGB, Position.SLK, Position.OS, Position.OS, Position.SGK, Position.SNT, Position.SNT];
            case '4-3-3': return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.SGB, Position.OS, Position.OS, Position.OS, Position.SLK, Position.SGK, Position.SNT];
            case '4-2-3-1': return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.SGB, Position.OS, Position.OS, Position.SLK, Position.OOS, Position.SGK, Position.SNT];
            case '4-1-4-1': return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.SGB, Position.OS, Position.SLK, Position.OS, Position.OS, Position.SGK, Position.SNT];
            case '3-5-2': return [Position.GK, Position.STP, Position.STP, Position.STP, Position.SLB, Position.OS, Position.OS, Position.OS, Position.SGB, Position.SNT, Position.SNT];
            case '5-3-2': return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.STP, Position.SGB, Position.OS, Position.OS, Position.OS, Position.SNT, Position.SNT];
            default: return [Position.GK, Position.SLB, Position.STP, Position.STP, Position.SGB, Position.SLK, Position.OS, Position.OS, Position.SGK, Position.SNT, Position.SNT];
        }
    };

    const handleAutoPick = () => {
        const unavailablePlayers: Player[] = [];
        const availablePool: Player[] = [];
        team.players.forEach(p => {
            const isInjured = p.injury && p.injury.daysRemaining > 0;
            const isSuspended = p.suspendedUntilWeek && currentWeek && p.suspendedUntilWeek > currentWeek;
            if (isInjured || isSuspended) unavailablePlayers.push(p); else availablePool.push(p);
        });

        // Havuzu güce göre sırala (En iyiler en başta)
        availablePool.sort((a, b) => b.skill - a.skill);

        const newStartingXI: (Player | null)[] = new Array(11).fill(null);
        const requirements = getFormationPosRequirements(team.formation);

        // AŞAMA 1: Ana mevkilerine göre yerleştir (Öncelik SLK'nın SLK olması gibi)
        requirements.forEach((reqPos, index) => {
            let candidateIndex = availablePool.findIndex(p => p.position === reqPos);
            if (candidateIndex !== -1) {
                newStartingXI[index] = availablePool[candidateIndex];
                availablePool.splice(candidateIndex, 1);
            }
        });

        // AŞAMA 2: Boş kalan yerlere ikincil mevkilerine göre yerleştir
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

        // AŞAMA 3: Hala boş yer varsa en iyi kalan oyuncuları sıradan yerleştir (Zorunlu doluluk)
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

    const handlePlayerClick = (clickedPlayer: Player) => {
        if (!selectedPlayerId) setSelectedPlayerId(clickedPlayer.id); 
        else {
            if (selectedPlayerId === clickedPlayer.id) { setSelectedPlayerId(null); return; }
            const idx1 = team.players.findIndex(p => p.id === selectedPlayerId);
            const idx2 = team.players.findIndex(p => p.id === clickedPlayer.id);
            if (idx1 !== -1 && idx2 !== -1) {
                const p1 = team.players[idx1]; const p2 = team.players[idx2];
                if (isMatchActive) {
                    const isPitch1 = idx1 < 11; const isPitch2 = idx2 < 11; const isBench1 = idx1 >= 11 && idx1 < 18; const isBench2 = idx2 >= 11 && idx2 < 18;
                    
                    // Determine who is coming ONTO the pitch
                    const playerComingOn = (idx1 >= 11 && idx2 < 11) ? p1 : (idx2 >= 11 && idx1 < 11) ? p2 : null;
                    
                    if (playerComingOn) {
                        if (playerComingOn.injury && playerComingOn.injury.daysRemaining > 0) {
                             alert("Sakatlanan oyuncu oyuna tekrar giremez!");
                             setSelectedPlayerId(null);
                             return;
                        }
                    }

                    // Allow swapping only if at least one is on pitch and other on bench/pitch
                    if ((isPitch1 && isBench2) || (isPitch2 && isBench1)) {
                        // FORCE SUB LOGIC: If a forced sub is pending, one of the players MUST be the injured one
                        if (forcedSubstitutionPlayerId) {
                            if (p1.id !== forcedSubstitutionPlayerId && p2.id !== forcedSubstitutionPlayerId) {
                                alert("Önce sakatlanan oyuncuyu değiştirmelisiniz!");
                                setSelectedPlayerId(null);
                                return;
                            }
                        }

                        if (subsUsed >= maxSubs) { alert(`Değişiklik hakkınız doldu! (Max: ${maxSubs})`); setSelectedPlayerId(null); return; }
                        if (onSubstitution) onSubstitution(isPitch1 ? p2 : p1, isPitch1 ? p1 : p2);
                        const newPlayers = [...team.players]; [newPlayers[idx1], newPlayers[idx2]] = [newPlayers[idx2], newPlayers[idx1]]; setTeam({ ...team, players: newPlayers });
                    } else if (isPitch1 && isPitch2) { 
                         // Position swap on pitch is allowed even during forced sub
                         const newPlayers = [...team.players]; [newPlayers[idx1], newPlayers[idx2]] = [newPlayers[idx2], newPlayers[idx1]]; setTeam({ ...team, players: newPlayers }); 
                    } 
                    else { if (idx1 >= 18 || idx2 >= 18) alert("Maç sırasında kadro dışı oyuncularla işlem yapamazsınız."); }
                } else {
                    if (idx2 < 18 && p1.suspendedUntilWeek && currentWeek && p1.suspendedUntilWeek > currentWeek) { alert(`UYARI: ${p1.name} cezalı!`); setSelectedPlayerId(null); return; }
                    if (idx1 < 18 && p2.suspendedUntilWeek && currentWeek && p2.suspendedUntilWeek > currentWeek) { alert(`UYARI: ${p2.name} cezalı!`); setSelectedPlayerId(null); return; }
                    if (idx2 < 18 && p1.injury && p1.injury.daysRemaining > 0) { alert(`UYARI: ${p1.name} sakat!`); setSelectedPlayerId(null); return; }
                    if (idx1 < 18 && p2.injury && p2.injury.daysRemaining > 0) { alert(`UYARI: ${p2.name} sakat!`); setSelectedPlayerId(null); return; }
                    const newPlayers = [...team.players]; [newPlayers[idx1], newPlayers[idx2]] = [newPlayers[idx2], newPlayers[idx1]]; setTeam({ ...team, players: newPlayers });
                }
            }
            setSelectedPlayerId(null);
        }
    };

    const SetPieceSelector = ({ type, icon: Icon, title }: { type: keyof SetPieceTakers, icon: any, title: string }) => {
        const selectedId = team.setPieceTakers?.[type];
        const sortedCandidates = [...team.players].sort((a, b) => {
            if (type === 'penalty') return b.stats.penalty - a.stats.penalty; if (type === 'freeKick') return b.stats.freeKick - a.stats.freeKick; if (type === 'corner') return b.stats.corners - a.stats.corners; return b.stats.leadership - a.stats.leadership;
        });
        return (
            <div className="bg-[#1e232e] rounded-xl border border-slate-700 p-4 shadow-lg hover:border-slate-500 transition-colors">
                <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2"><h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wide"><Icon size={16} className="text-green-400"/> {title}</h3><div className="text-[10px] text-slate-400 font-bold uppercase">{selectedId ? 'Seçildi' : 'Seçilmedi'}</div></div>
                <div className="h-64 overflow-y-auto custom-scrollbar space-y-1 pr-1">{sortedCandidates.map(p => { const isChosen = p.id === selectedId; let statVal = type === 'penalty' ? p.stats.penalty : type === 'freeKick' ? p.stats.freeKick : type === 'corner' ? p.stats.corners : p.stats.leadership; return (<div key={p.id} onClick={() => setTeam({...team, setPieceTakers: { ...team.setPieceTakers, [type]: p.id }})} className={`flex items-center justify-between p-2 rounded cursor-pointer transition border ${isChosen ? 'bg-green-900/30 border-green-500' : 'bg-slate-800/50 border-transparent hover:bg-slate-700'}`}><div className="flex items-center gap-2"><div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white ${p.position === 'GK' ? 'bg-yellow-600' : 'bg-blue-600'}`}>{p.position}</div><span className={`text-sm font-medium ${isChosen ? 'text-green-400 font-bold' : 'text-slate-300'}`}>{p.name}</span></div><div className={`text-sm font-black font-mono ${statVal >= 15 ? 'text-green-500' : statVal >= 10 ? 'text-yellow-500' : 'text-slate-500'}`}>{statVal}</div></div>); })}</div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white relative">
            {showSystemSelector && !isMatchActive && (<SystemSelectionModal onClose={() => setShowSystemSelector(false)} onSelect={handleApplySystem} />)}
            {modalData.isOpen && <TacticDetailModal title={modalData.title} tacticKey={modalData.key} currentValue={modalData.currentVal} options={modalData.options} onSelect={handleTacticChange} onClose={() => setModalData({ ...modalData, isOpen: false })} />}
            <div className="bg-slate-800 border-b border-slate-700 shrink-0 shadow-lg z-20">
                <div className="px-6 py-4 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
                        <div className="flex items-center gap-2"><Activity className="text-yellow-500" size={24}/><div><h2 className="text-xl font-bold text-white uppercase tracking-wider leading-none">Taktik Merkezi</h2>{team.gameSystem && <span className="text-[10px] text-slate-400 font-bold uppercase">{team.gameSystem}</span>}</div></div>
                        {!isMatchActive && (<button onClick={() => setShowSystemSelector(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-all"><LayoutTemplate size={14}/> Sistem Değiştir</button>)}
                        {isMatchActive && (<div className="bg-slate-700 px-4 py-1.5 rounded-full border border-slate-600 text-xs font-bold text-slate-300 flex items-center gap-2"><Timer size={14} className="text-red-500"/>{currentMinute}' / Değişiklik: <span className={`${subsUsed >= maxSubs ? 'text-red-500' : 'text-green-500'}`}>{subsUsed}/{maxSubs}</span></div>)}
                    </div>
                    {activeTab === 'XI' && (
                        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-center lg:justify-end bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-500 uppercase">Diziliş</span><select value={team.formation} onChange={(e) => setTeam({...team, formation: e.target.value})} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs font-bold text-white outline-none hover:border-yellow-500 transition-colors"><option value="4-4-2">4-4-2</option><option value="4-3-3">4-3-3</option><option value="4-2-3-1">4-2-3-1</option><option value="4-1-4-1">4-1-4-1</option><option value="3-5-2">3-5-2</option><option value="5-3-2">5-3-2</option></select></div>
                            <div className="w-px h-6 bg-slate-700 mx-2"></div>
                            <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-500 uppercase">Anlayış</span><select value={team.mentality} onChange={(e) => setTeam({...team, mentality: e.target.value as any})} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs font-bold text-white outline-none hover:border-yellow-500 transition-colors">{Object.values(Mentality).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                            <div className="w-px h-6 bg-slate-700 mx-2"></div>
                            <div className="flex items-center gap-3 pr-2"><div className="text-right"><div className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-0.5">Kimya</div><div className={`text-sm font-black leading-none ${teamChemistry > 80 ? 'text-green-500' : teamChemistry > 60 ? 'text-yellow-500' : 'text-red-500'}`}>{teamChemistry}%</div></div><div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${teamChemistry > 80 ? 'bg-green-500' : teamChemistry > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${teamChemistry}%`}}></div></div></div>
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
                        <div className="w-full md:w-[65%] h-1/2 md:h-full bg-slate-900 border-r border-slate-800 relative shadow-inner p-4 md:p-8 flex items-center justify-center"><PitchVisual players={team.players} onPlayerClick={handlePlayerClick} selectedPlayerId={selectedPlayerId} formation={team.formation} /></div>
                        <div className="w-full md:w-[35%] h-1/2 md:h-full bg-slate-900 flex flex-col border-l border-slate-800 shadow-xl z-10">
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900">
                                <div><div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-green-600/50 sticky top-0 z-20"><h4 className="text-xs font-black text-green-500 uppercase tracking-wider">İLK 11</h4><span className="text-[9px] font-bold text-slate-500">11 Oyuncu</span></div><PlayerListHeader /><div className="divide-y divide-slate-800/50">{team.players.slice(0, 11).map((p, i) => <CompactPlayerRow key={p.id} p={p} index={i} onClick={handlePlayerClick} isSelected={selectedPlayerId === p.id} currentWeek={currentWeek} isForcedSub={forcedSubstitutionPlayerId === p.id} />)}</div></div>
                                <div><div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-blue-600/50 mt-4 sticky top-0 z-20"><h4 className="text-xs font-black text-blue-500 uppercase tracking-wider">YEDEKLER</h4><span className="text-[9px] font-bold text-slate-500">7 Oyuncu</span></div><PlayerListHeader /><div className="divide-y divide-slate-800/50">{team.players.slice(11, 18).map((p, i) => <CompactPlayerRow key={p.id} p={p} index={i} onClick={handlePlayerClick} isSelected={selectedPlayerId === p.id} label={`Y${i+1}`} currentWeek={currentWeek} isForcedSub={forcedSubstitutionPlayerId === p.id} />)}</div></div>
                                {!isMatchActive && (<div><div className="flex items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-600/50 mt-4 sticky top-0 z-20"><h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">KADRO DIŞI</h4><span className="text-[9px] font-bold text-slate-500">{team.players.length - 18} Oyuncu</span></div><PlayerListHeader /><div className="divide-y divide-slate-800/50">{team.players.slice(18).map((p, i) => <CompactPlayerRow key={p.id} p={p} index={i} onClick={handlePlayerClick} isSelected={selectedPlayerId === p.id} label="REZ" currentWeek={currentWeek} isReserve isForcedSub={forcedSubstitutionPlayerId === p.id} />)}</div></div>)}
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
