
import React, { useState } from 'react';
import { Player, IndividualTrainingType, Position, PlayerPersonality } from '../types';
import { INDIVIDUAL_PROGRAMS, POSITION_TRANSITION_TIME } from '../data/trainingData';
import PlayerFace from '../components/shared/PlayerFace';
import { Check, Info, TrendingUp, X, Flame, AlertTriangle, Clock, Target, Repeat, LayoutTemplate, Lock, ChevronRight } from 'lucide-react';
import { PERSONALITY_TRANSLATIONS } from '../data/playerConstants';

interface DevelopmentCenterViewProps {
    players: Player[];
    onAssignTraining: (playerId: string, type: IndividualTrainingType) => void;
    onAssignPositionTraining?: (playerId: string, target: Position, weeks: number) => void;
    currentWeek: number;
    onPlayerClick?: (player: Player) => void; // Added Prop
}

// Turkish Translations for Stat Keys
const STAT_TRANSLATIONS: Record<string, string> = {
    finishing: 'Bitiricilik',
    composure: 'Soğukkanlılık',
    firstTouch: 'İlk Kontrol',
    passing: 'Pas',
    vision: 'Vizyon',
    decisions: 'Karar Alma',
    dribbling: 'Dripling',
    balance: 'Denge',
    acceleration: 'Hızlanma',
    concentration: 'Konsantrasyon',
    leadership: 'Liderlik',
    determination: 'Kararlılık',
    teamwork: 'Takım Oyunu',
    stamina: 'Dayanıklılık',
    naturalFitness: 'Vücut Zindeliği',
    pace: 'Hız',
    physical: 'Güç',
    aggression: 'Agresiflik',
    agility: 'Çeviklik',
    positioning: 'Pozisyon Alma',
    anticipation: 'Önsezi',
    marking: 'Markaj',
    tackling: 'Top Kapma',
    crossing: 'Orta Yapma',
    heading: 'Kafa Vuruşu',
    longShots: 'Uzaktan Şut',
    penalty: 'Penaltı',
    freeKick: 'Serbest Vuruş'
};

const DevelopmentCenterView: React.FC<DevelopmentCenterViewProps> = ({ players, onAssignTraining, onAssignPositionTraining, currentWeek, onPlayerClick }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(players.length > 0 ? players[0].id : null);
    const [activeTab, setActiveTab] = useState<'PROGRAMS' | 'POSITION'>('PROGRAMS');
    
    const selectedPlayer = players.find(p => p.id === selectedPlayerId);

    // Group programs by category
    const categories = ['TEKNİK', 'ZİHİNSEL', 'FİZİKSEL', 'KALECİ'];

    const handleAssign = (type: IndividualTrainingType) => {
        if (selectedPlayerId) {
            onAssignTraining(selectedPlayerId, type);
        }
    };

    const handleAssignPos = (target: Position) => {
        if (selectedPlayerId && selectedPlayer && onAssignPositionTraining) {
            const weeks = POSITION_TRANSITION_TIME(selectedPlayer.position, target);
            if (weeks !== null) {
                onAssignPositionTraining(selectedPlayerId, target, weeks);
            }
        }
    };

    // Determine estimated duration based on personality (Returns Weeks)
    const getProgramDurationInWeeks = (personality?: PlayerPersonality) => {
        if (personality === PlayerPersonality.HARDWORKING || personality === PlayerPersonality.AMBITIOUS) return 8;
        if (personality === PlayerPersonality.PROFESSIONAL) return 9;
        if (personality === PlayerPersonality.LAZY) return 12;
        return 10;
    };

    return (
        <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900 shrink-0 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <TrendingUp className="text-blue-500"/> Gelişim Merkezi
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Oyuncularınıza özel bireysel antrenman programları veya yeni mevkiler atayın.</p>
                </div>
                
                <div className="flex bg-slate-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('PROGRAMS')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${activeTab === 'PROGRAMS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Target size={16}/> Bireysel Program
                    </button>
                    <button 
                        onClick={() => setActiveTab('POSITION')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${activeTab === 'POSITION' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Repeat size={16}/> Mevki Geliştirme
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Player List */}
                <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/50">
                    <div className="p-4 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase">Kadro Listesi</div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {players.map(p => {
                            const isSelected = p.id === selectedPlayerId;
                            
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPlayerId(p.id)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left group relative cursor-pointer ${isSelected ? 'bg-blue-900/30 border border-blue-500/50' : 'hover:bg-slate-800 border border-transparent'}`}
                                >
                                    {/* Active Indicators */}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                                        {p.activeTraining && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] border border-black/50" title="Bireysel Antrenman Aktif"></div>
                                        )}
                                        {p.positionTrainingTarget && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] border border-black/50" title="Mevki Geliştirme Aktif"></div>
                                        )}
                                    </div>

                                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700 shrink-0">
                                        <PlayerFace player={p} />
                                    </div>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{p.name}</div>
                                        <div className="flex justify-between items-center mt-0.5">
                                            <span className="text-[10px] text-slate-500 font-bold bg-slate-800 px-1.5 rounded">
                                                {p.position}{p.secondaryPosition ? ` / ${p.secondaryPosition}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Programs or Position Training */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#121519]">
                    {selectedPlayer ? (
                        <div className="max-w-5xl mx-auto">
                            {/* Player Header Card - Clickable for Profile */}
                            <div 
                                onClick={() => onPlayerClick && onPlayerClick(selectedPlayer)}
                                className="flex items-center gap-6 mb-8 bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative group cursor-pointer hover:border-blue-500 transition-colors"
                            >
                                <div className="absolute top-4 right-4 text-slate-500 group-hover:text-blue-400 transition-colors opacity-50 group-hover:opacity-100 flex items-center gap-1 text-xs font-bold uppercase">
                                    Profile Git <ChevronRight size={16}/>
                                </div>

                                <div className="w-20 h-20 rounded-full bg-slate-700 border-4 border-slate-600 overflow-hidden shrink-0 group-hover:border-blue-500 transition-colors">
                                    <PlayerFace player={selectedPlayer} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{selectedPlayer.name}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold border ${selectedPlayer.personality === PlayerPersonality.HARDWORKING || selectedPlayer.personality === PlayerPersonality.AMBITIOUS ? 'border-green-500 text-green-400 bg-green-900/20' : selectedPlayer.personality === PlayerPersonality.LAZY ? 'border-red-500 text-red-400 bg-red-900/20' : 'border-slate-500 text-slate-400 bg-slate-800'}`}>
                                            {PERSONALITY_TRANSLATIONS[selectedPlayer.personality || 'Normal'] || selectedPlayer.personality}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-4">{selectedPlayer.position} {selectedPlayer.secondaryPosition ? `(${selectedPlayer.secondaryPosition})` : ''} • {selectedPlayer.age} Yaş</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Bireysel Antrenman Progress */}
                                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                    <Target size={12}/> Bireysel Program
                                                </span>
                                                {selectedPlayer.activeTraining ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                        <span className="text-green-400 font-black text-xs">
                                                            {INDIVIDUAL_PROGRAMS.find(prog => prog.id === selectedPlayer.activeTraining)?.label}
                                                        </span>
                                                    </div>
                                                ) : <span className="text-slate-600 text-xs italic">Seçilmedi</span>}
                                            </div>
                                            {selectedPlayer.activeTraining ? (
                                                <>
                                                    {(() => {
                                                        const totalWeeks = getProgramDurationInWeeks(selectedPlayer.personality);
                                                        const totalDays = totalWeeks * 7;
                                                        // Calculate active days in CURRENT cycle (modulo)
                                                        const currentDays = (selectedPlayer.activeTrainingWeeks || 0) % totalDays;
                                                        const pct = Math.min(100, (currentDays / totalDays) * 100);
                                                        const currentWeekNum = Math.ceil((currentDays + 1) / 7);

                                                        return (
                                                            <div className="relative">
                                                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                                                                    <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                                                                </div>
                                                                <div className="flex justify-between text-[9px] text-slate-400">
                                                                    <span>Hafta {currentWeekNum} / {totalWeeks}</span>
                                                                    <span>%{Math.floor(pct)}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </>
                                            ) : (
                                                <div className="h-2 bg-slate-800 rounded-full"></div>
                                            )}
                                        </div>

                                        {/* Mevki Antrenman Progress */}
                                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                    <Repeat size={12}/> Mevki Hedefi
                                                </span>
                                                {selectedPlayer.positionTrainingTarget ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                        <span className="text-indigo-400 font-black text-xs">
                                                            {selectedPlayer.positionTrainingTarget}
                                                        </span>
                                                    </div>
                                                ) : <span className="text-slate-600 text-xs italic">Seçilmedi</span>}
                                            </div>
                                            {selectedPlayer.positionTrainingTarget ? (
                                                <>
                                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                                                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${((selectedPlayer.positionTrainingProgress || 0) / (selectedPlayer.positionTrainingRequired || 1)) * 100}%` }}></div>
                                                    </div>
                                                    <div className="flex justify-between text-[9px] text-slate-400">
                                                        <span>{Math.floor(selectedPlayer.positionTrainingProgress || 0)} / {selectedPlayer.positionTrainingRequired} Hafta</span>
                                                        <span>%{Math.floor(((selectedPlayer.positionTrainingProgress || 0) / (selectedPlayer.positionTrainingRequired || 1)) * 100)}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="h-2 bg-slate-800 rounded-full"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {activeTab === 'PROGRAMS' ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                                    {categories.map(cat => {
                                        const options = INDIVIDUAL_PROGRAMS.filter(p => p.category === cat);
                                        if (selectedPlayer.position === Position.GK && cat !== 'KALECİ') return null;
                                        if (selectedPlayer.position !== Position.GK && cat === 'KALECİ') return null;
                                        if (options.length === 0) return null;

                                        return (
                                            <div key={cat}>
                                                <h4 className="text-sm font-bold text-slate-500 uppercase mb-4 border-b border-slate-800 pb-2">{cat}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {options.map(prog => {
                                                        const isActive = selectedPlayer.activeTraining === prog.id;
                                                        let synergy = 80;
                                                        if (prog.target.includes(selectedPlayer.position) || prog.target.includes('ALL')) synergy = 120;
                                                        const isGoodFit = (selectedPlayer.personality === PlayerPersonality.HARDWORKING || selectedPlayer.personality === PlayerPersonality.AMBITIOUS);
                                                        const isBadFit = (selectedPlayer.personality === PlayerPersonality.LAZY);
                                                        
                                                        // CHECK COOLDOWN
                                                        const isOnCooldown = selectedPlayer.individualTrainingCooldownUntil && selectedPlayer.individualTrainingCooldownUntil > currentWeek;

                                                        return (
                                                            <div 
                                                                key={prog.id}
                                                                onClick={() => !isOnCooldown && handleAssign(prog.id)}
                                                                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[220px] 
                                                                    ${isActive ? 'bg-blue-900/20 border-blue-500 shadow-lg' : isOnCooldown ? 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed' : 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-750'}
                                                                `}
                                                            >
                                                                {isActive && <div className="absolute top-3 right-3 bg-blue-500 text-white rounded-full p-1"><Check size={16} /></div>}
                                                                
                                                                {isOnCooldown && (
                                                                    <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center text-center p-4 backdrop-blur-[1px] rounded-xl">
                                                                        <Lock size={32} className="text-slate-400 mb-2"/>
                                                                        <span className="text-white font-bold text-sm">Yenilenme Süreci</span>
                                                                        <span className="text-slate-400 text-xs">{selectedPlayer.individualTrainingCooldownUntil! - currentWeek} hafta kaldı</span>
                                                                    </div>
                                                                )}
                                                                
                                                                {!isActive && !isOnCooldown && <div className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded border font-bold ${synergy >= 120 ? 'bg-green-900/30 text-green-400 border-green-600' : 'bg-orange-900/30 text-orange-400 border-orange-600'}`}>Verim: %{synergy}</div>}

                                                                <div>
                                                                    <h5 className={`font-bold text-lg mb-1 flex items-center gap-2 ${isActive ? 'text-blue-400' : 'text-slate-200'}`}>
                                                                        {prog.label}
                                                                        {isGoodFit && <Flame size={14} className="text-orange-500 fill-orange-500" />}
                                                                        {isBadFit && <AlertTriangle size={14} className="text-yellow-500" />}
                                                                    </h5>
                                                                    <div className="mt-3 space-y-2">
                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Geliştirilenler</span>
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {prog.stats.map(s => <span key={s} className="text-xs bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-700 capitalize">{STAT_TRANSLATIONS[s] || s}</span>)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs space-y-2">
                                                                    <div className="flex gap-2"><span className="text-green-500 font-bold shrink-0">+</span><span className="text-slate-400">{prog.pros[0]}</span></div>
                                                                    <div className="flex gap-2"><span className="text-red-500 font-bold shrink-0">-</span><span className="text-slate-400">{prog.cons[0]}</span></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                    <div className="bg-indigo-900/10 border border-indigo-500/30 p-4 rounded-xl flex items-start gap-4 mb-6">
                                        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400"><Info size={24}/></div>
                                        <div>
                                            <h4 className="text-indigo-400 font-bold">Mevki Evrimi Nedir?</h4>
                                            <p className="text-sm text-slate-300 mt-1">Oyuncuları yeni bir mevkiye adapte edebilirsiniz. Mevkiler arası yakınlığa göre süreç 12 ile 36 hafta arası sürebilir. Kaleciler başka mevkiye devşirilemez.</p>
                                        </div>
                                    </div>

                                    {selectedPlayer.position === Position.GK ? (
                                        <div className="bg-red-900/20 border border-red-800 p-12 text-center rounded-xl">
                                            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4"/>
                                            <h3 className="text-xl font-bold">Kaleci Adaptasyonu İmkansız</h3>
                                            <p className="text-slate-400 mt-2">Kaleci mevkisindeki bir oyuncu başka bir saha içi mevkiye devşirilemez.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {Object.values(Position).filter(pos => pos !== Position.GK && pos !== selectedPlayer.position).map(pos => {
                                                const weeksRequired = POSITION_TRANSITION_TIME(selectedPlayer.position, pos);
                                                const isCurrentTarget = selectedPlayer.positionTrainingTarget === pos;
                                                const isSecondary = selectedPlayer.secondaryPosition === pos;

                                                let difficulty = "Zor";
                                                let difficultyColor = "text-red-400";
                                                if (weeksRequired && weeksRequired <= 12) { difficulty = "Kolay"; difficultyColor = "text-green-400"; }
                                                else if (weeksRequired && weeksRequired <= 20) { difficulty = "Normal"; difficultyColor = "text-yellow-400"; }

                                                return (
                                                    <div 
                                                        key={pos}
                                                        onClick={() => handleAssignPos(pos)}
                                                        className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${isCurrentTarget ? 'bg-indigo-900/30 border-indigo-500 shadow-xl' : 'bg-slate-800 border-slate-700 hover:border-indigo-500/50'}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-2xl font-black text-white">{pos}</span>
                                                                    {isSecondary && <span className="bg-green-900 text-green-400 text-[10px] px-1.5 rounded border border-green-800 font-bold">MEVCUT YEDEK</span>}
                                                                </div>
                                                                <span className={`text-xs font-bold ${difficultyColor} uppercase mt-1`}>{difficulty} Uyum</span>
                                                            </div>
                                                            {isCurrentTarget ? <CheckCircle2 className="text-indigo-500" size={24}/> : <div className="p-2 rounded-full bg-slate-700 text-slate-500"><Repeat size={18}/></div>}
                                                        </div>

                                                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 mb-4">
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className="text-slate-400">Gerekli Süre</span>
                                                                <span className="text-white font-bold">{weeksRequired} Hafta</span>
                                                            </div>
                                                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                                <div className="h-full bg-indigo-500" style={{ width: isCurrentTarget ? `${(selectedPlayer.positionTrainingProgress || 0) / (selectedPlayer.positionTrainingRequired || 1) * 100}%` : '0%' }}></div>
                                                            </div>
                                                        </div>

                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleAssignPos(pos); }}
                                                            className={`w-full py-2 rounded font-bold text-sm transition ${isCurrentTarget ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'}`}
                                                        >
                                                            {isCurrentTarget ? 'Eğitimi Sürdür' : 'Eğitimi Başlat'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            <p>Lütfen soldaki listeden bir oyuncu seçin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CheckCircle2 = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
);

export default DevelopmentCenterView;
