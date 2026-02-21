
import React, { useState, useEffect } from 'react';
import { Team, TrainingConfig, TrainingType, TrainingIntensity, Player, ManagerProfile, TrainingReportItem } from '../types';
import { Check, Swords, Shield, Dumbbell, Brain, Crosshair, Zap, Activity, Users, AlertTriangle, Calendar, Info, Play, ClipboardList, TrendingUp, Target, UserCheck, ToggleLeft, ToggleRight, Lock, Trophy, Frown, Heart, Smile } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';

interface TrainingViewProps {
    onTrain: (config: TrainingConfig) => void;
    performed: boolean;
    team: Team;
    manager: ManagerProfile;
    onGoToDevelopment?: () => void;
    onToggleDelegation?: () => void;
    lastReport: TrainingReportItem[];
    onPlayerClick?: (player: Player) => void; // Added prop
}

const TrainingView: React.FC<TrainingViewProps> = ({ onTrain, performed, team, manager, onGoToDevelopment, onToggleDelegation, lastReport, onPlayerClick }) => {
    
    // Initialize state with existing team config or defaults
    const [mainFocus, setMainFocus] = useState<TrainingType>((team.trainingConfig?.mainFocus as TrainingType) || TrainingType.TACTICAL);
    const [subFocus, setSubFocus] = useState<TrainingType>((team.trainingConfig?.subFocus as TrainingType) || TrainingType.PHYSICAL);
    const [intensity, setIntensity] = useState<TrainingIntensity>((team.trainingConfig?.intensity as TrainingIntensity) || TrainingIntensity.STANDARD);
    
    // Check delegation status
    const isDelegated = team.isTrainingDelegated || false;

    // Derived Staff Quality (Mock or Real)
    // We use staffRelations to simulate coach quality
    const assistant = manager.staffRelations.find(s => s.role === 'Yardımcı Antrenör');
    const fitnessCoach = manager.staffRelations.find(s => s.role === 'Kondisyoner');
    
    const assistantQuality = assistant ? assistant.value : 50;
    const fitnessQuality = fitnessCoach ? fitnessCoach.value : 50;

    // Calculate Team Averages for new Panel
    const avgMorale = Math.round(team.players.reduce((acc, p) => acc + p.morale, 0) / team.players.length);
    const avgCondition = Math.round(team.players.reduce((acc, p) => acc + (p.condition !== undefined ? p.condition : p.stats.stamina), 0) / team.players.length);

    const getStatusColor = (val: number) => {
        if (val >= 80) return 'bg-green-500 text-green-500';
        if (val >= 50) return 'bg-yellow-500 text-yellow-500';
        return 'bg-red-500 text-red-500';
    };

    const trainingOptions = [
        { 
            id: TrainingType.ATTACK, 
            label: 'HÜCUM',
            icon: Swords, 
            color: 'text-purple-500', 
            bg: 'bg-purple-500/10 border-purple-500/50',
            desc: 'Bitiricilik, topsuz alan ve soğukkanlılık artar.',
            sideEffect: 'Savunma organizasyonu zayıflar.',
            link: 'Ofansif taktiklerde gol yollarını açar.'
        },
        { 
            id: TrainingType.DEFENSE, 
            label: 'SAVUNMA',
            icon: Shield, 
            color: 'text-blue-500', 
            bg: 'bg-blue-500/10 border-blue-500/50',
            desc: 'Pozisyon alma, markaj ve top kapma artar.',
            sideEffect: 'Hücum yaratıcılığı düşer.',
            link: 'Otobüs taktiklerinde duvar örer.'
        },
        { 
            id: TrainingType.PHYSICAL, 
            label: 'FİZİKSEL',
            icon: Dumbbell, 
            color: 'text-green-500', 
            bg: 'bg-green-500/10 border-green-500/50',
            desc: 'Dayanıklılık, güç ve hız artar.',
            sideEffect: 'Sakatlık riski ve yorgunluk.',
            link: 'Yüksek tempo cezasını azaltır.'
        },
        { 
            id: TrainingType.TACTICAL, 
            label: 'TAKTİKSEL',
            icon: Brain, 
            color: 'text-yellow-500', 
            bg: 'bg-yellow-500/10 border-yellow-500/50',
            desc: 'Takım uyumu ve karar alma artar.',
            sideEffect: 'Yok. (Kritik önem)',
            link: 'Pas hatalarını ve ofsayt riskini azaltır.'
        },
        { 
            id: TrainingType.MATCH_PREP, 
            label: 'MAÇ HAZIRLIĞI',
            icon: Crosshair, 
            color: 'text-slate-400', 
            bg: 'bg-slate-500/10 border-slate-500/50',
            desc: 'Konsantrasyon ve maç başı performansı.',
            sideEffect: 'Uzun vadeli gelişim yok.',
            link: 'Derbi öncesi ekstra odak sağlar.'
        },
        { 
            id: TrainingType.SET_PIECES, // ADDED
            label: 'DURAN TOPLAR',
            icon: Target, 
            color: 'text-orange-500', 
            bg: 'bg-orange-500/10 border-orange-500/50',
            desc: 'Frikik, korner ve penaltı organizasyonları.',
            sideEffect: 'Akan oyunda tempo düşer.',
            link: 'Kilitlenen maçları duran topla çözer.'
        }
    ];

    const getIntensityColor = (i: TrainingIntensity) => {
        if (i === TrainingIntensity.LOW) return 'text-blue-400';
        if (i === TrainingIntensity.STANDARD) return 'text-yellow-400';
        return 'text-red-500';
    };

    const getIntensityLabel = (i: TrainingIntensity) => {
        if (i === TrainingIntensity.LOW) return 'DÜŞÜK';
        if (i === TrainingIntensity.STANDARD) return 'STANDART';
        return 'YÜKSEK';
    };

    const handleConfirm = () => {
        onTrain({
            mainFocus,
            subFocus,
            intensity
        });
    };

    // New Delegation Logic
    const handleToggleDelegation = () => {
        if (onToggleDelegation) {
            onToggleDelegation();
        }
    };

    // Filter Logic for Report
    const topPerformers = [...lastReport]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 3);

    // Filter logic: Score must be < 7 to appear in worst list
    const worstPerformers = [...lastReport]
        .filter(r => (r.score || 0) < 7)
        .sort((a, b) => (a.score || 0) - (b.score || 0))
        .slice(0, 3);

    return (
        <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden relative">
            
            {/* Header: Overview & Controls */}
            <div className="p-6 border-b border-slate-800 bg-slate-900 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Activity className="text-yellow-500"/> Haftalık Antrenman Programı
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Takımın fiziksel ve taktiksel gelişimini planla.</p>
                </div>

                <div className={`flex items-center gap-6 bg-slate-800 p-2 rounded-lg border border-slate-700 transition-opacity ${isDelegated ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="text-right px-2">
                        <div className="text-xs font-bold text-slate-500 uppercase">Antrenman Yoğunluğu</div>
                        <div className={`text-lg font-black ${getIntensityColor(intensity)}`}>{getIntensityLabel(intensity)}</div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => setIntensity(TrainingIntensity.LOW)} className={`p-2 rounded ${intensity === TrainingIntensity.LOW ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`} title="Düşük"><Zap size={16} className={intensity === TrainingIntensity.LOW ? 'fill-white' : ''}/></button>
                        <button onClick={() => setIntensity(TrainingIntensity.STANDARD)} className={`p-2 rounded ${intensity === TrainingIntensity.STANDARD ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-400'}`} title="Standart"><Zap size={16} className={intensity === TrainingIntensity.STANDARD ? 'fill-white' : ''}/></button>
                        <button onClick={() => setIntensity(TrainingIntensity.HIGH)} className={`p-2 rounded ${intensity === TrainingIntensity.HIGH ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400'}`} title="Yüksek"><Zap size={16} className={intensity === TrainingIntensity.HIGH ? 'fill-white' : ''}/></button>
                    </div>
                </div>
            </div>

            {/* Delegation Banner Overlay if Active */}
            {isDelegated && (
                <div className="absolute top-[88px] left-0 right-0 z-20 flex justify-center pointer-events-none">
                    <div className="bg-blue-600 text-white px-6 py-2 rounded-b-lg shadow-lg flex items-center gap-2 font-bold text-sm border-x border-b border-blue-400">
                        <UserCheck size={18} />
                        Antrenman programı teknik heyet tarafından otomatik olarak yönetiliyor.
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 custom-scrollbar relative">
                
                {/* Overlay Disable Interaction if Delegated */}
                {isDelegated && (
                    <div className="absolute inset-0 bg-slate-900/60 z-10 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                        <div className="bg-slate-800 p-8 rounded-xl border border-slate-600 shadow-2xl text-center max-w-md">
                            <Lock size={48} className="mx-auto text-blue-500 mb-4"/>
                            <h3 className="text-xl font-bold text-white mb-2">Otomatik Yönetim Aktif</h3>
                            <p className="text-slate-400 mb-6">
                                Antrenman programı şu anda teknik direktör yardımcısı ve antrenör ekibi tarafından belirleniyor. Manuel müdahale yapmak için yönetimi devralın.
                            </p>
                            <button 
                                onClick={handleToggleDelegation}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 w-full transition pointer-events-auto"
                            >
                                <ToggleLeft size={20}/> Yönetimi Devral (İptal Et)
                            </button>
                        </div>
                    </div>
                )}

                {/* LEFT: SCHEDULE SELECTOR (Col 8) */}
                <div className={`lg:col-span-8 space-y-6 ${isDelegated ? 'blur-sm' : ''}`}>
                    
                    {/* Focus Selection Cards */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                            <Calendar size={16}/> Odak Alanları
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Main Focus */}
                            <div>
                                <div className="text-xs font-bold text-yellow-500 mb-2 uppercase tracking-wider">Ana Odak (Sabah)</div>
                                <div className="space-y-2">
                                    {trainingOptions.map(opt => (
                                        <button
                                            key={`main-${opt.id}`}
                                            onClick={() => setMainFocus(opt.id)}
                                            disabled={performed}
                                            className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 relative overflow-hidden group ${mainFocus === opt.id ? `${opt.bg} shadow-lg` : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'}`}
                                        >
                                            <div className={`p-2 rounded-full bg-slate-900 ${opt.color}`}>
                                                <opt.icon size={20}/>
                                            </div>
                                            <div className="flex-1 z-10">
                                                <div className={`font-bold ${opt.color}`}>{opt.label}</div>
                                                <div className="text-[10px] text-slate-400">{opt.desc}</div>
                                            </div>
                                            {mainFocus === opt.id && <Check className={`ml-auto ${opt.color}`} size={20}/>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sub Focus */}
                            <div>
                                <div className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-wider">Yan Odak (Öğleden Sonra)</div>
                                <div className="space-y-2">
                                    {trainingOptions.map(opt => (
                                        <button
                                            key={`sub-${opt.id}`}
                                            onClick={() => setSubFocus(opt.id)}
                                            disabled={performed}
                                            className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 relative overflow-hidden group ${subFocus === opt.id ? `${opt.bg} shadow-lg` : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'}`}
                                        >
                                            <div className={`p-2 rounded-full bg-slate-900 ${opt.color} opacity-70`}>
                                                <opt.icon size={16}/>
                                            </div>
                                            <div className="flex-1 z-10">
                                                <div className={`font-bold ${opt.color} opacity-90`}>{opt.label}</div>
                                            </div>
                                            {subFocus === opt.id && <Check className={`ml-auto ${opt.color}`} size={16}/>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Effects Panel */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <h3 className="text-xs font-bold text-green-500 uppercase mb-3 flex items-center gap-1"><Zap size={14}/> Taktiksel Bağlantı (Bonus)</h3>
                            <div className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded border-l-4 border-green-500">
                                {trainingOptions.find(o => o.id === mainFocus)?.link}
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xs font-bold text-red-500 uppercase mb-3 flex items-center gap-1"><AlertTriangle size={14}/> Yan Etkiler (Risk)</h3>
                            <div className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded border-l-4 border-red-500">
                                {trainingOptions.find(o => o.id === mainFocus)?.sideEffect}
                            </div>
                        </div>
                    </div>

                    {/* NEW: TEAM STATUS PANEL (MORALE & CONDITION) */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 min-h-[240px] flex flex-col justify-center">
                        <h3 className="text-sm font-bold text-slate-400 uppercase mb-5 flex items-center gap-2">
                           <Users size={16} className="text-blue-500"/> Takım Genel Durumu
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Morale Bar */}
                            <div>
                                 <div className="flex justify-between items-end mb-2">
                                     <div className="flex items-center gap-2 font-bold text-slate-300 text-xs uppercase">
                                         <Smile size={16} className={getStatusColor(avgMorale).split(' ')[1]}/> Takım Morali
                                     </div>
                                     <span className={`font-black text-lg ${getStatusColor(avgMorale).split(' ')[1]}`}>%{avgMorale}</span>
                                 </div>
                                 <div className="h-3 bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                     <div className={`h-full ${getStatusColor(avgMorale).split(' ')[0]} transition-all duration-1000 ease-out`} style={{width: `${avgMorale}%`}}></div>
                                 </div>
                                 <p className="text-[10px] text-slate-500 mt-1.5 italic">
                                     {avgMorale > 80 ? "Oyuncuların morali çok yüksek, antrenman verimi artıyor." : avgMorale < 50 ? "Takımda mutsuzluk hakim, gelişim yavaşlıyor." : "Moral seviyesi dengeli."}
                                 </p>
                            </div>
                            
                            {/* Condition Bar */}
                            <div>
                                 <div className="flex justify-between items-end mb-2">
                                     <div className="flex items-center gap-2 font-bold text-slate-300 text-xs uppercase">
                                         <Heart size={16} className={getStatusColor(avgCondition).split(' ')[1]} fill="currentColor"/> Fiziksel Kondisyon
                                     </div>
                                     <span className={`font-black text-lg ${getStatusColor(avgCondition).split(' ')[1]}`}>%{avgCondition}</span>
                                 </div>
                                 <div className="h-3 bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                     <div className={`h-full ${getStatusColor(avgCondition).split(' ')[0]} transition-all duration-1000 ease-out`} style={{width: `${avgCondition}%`}}></div>
                                 </div>
                                 <p className="text-[10px] text-slate-500 mt-1.5 italic">
                                     {avgCondition > 85 ? "Takım zinde, ağır antrenmanları kaldırabilir." : avgCondition < 60 ? "Oyuncular yorgun, dinlenme veya hafif antrenman önerilir." : "Kondisyon seviyesi maç temposu için ideal."}
                                 </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT: STAFF & PLAYERS (Col 4) */}
                <div className={`lg:col-span-4 space-y-6 ${isDelegated ? 'blur-sm' : ''}`}>
                    
                    {/* Action Buttons */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 text-center space-y-3">
                        {performed ? (
                            <div className="text-green-500 font-bold flex flex-col items-center gap-2">
                                <Check size={48} className="bg-green-900/20 p-2 rounded-full"/>
                                <span>Bugünkü Antrenman Tamamlandı</span>
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={handleConfirm}
                                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black text-lg py-4 rounded-xl shadow-lg shadow-yellow-900/20 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
                                >
                                    <Play size={24} fill="black"/> Programı Uygula
                                </button>
                                
                                <button 
                                    onClick={handleToggleDelegation}
                                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all border border-slate-600 hover:border-slate-500 text-sm"
                                    title="Siz iptal edene kadar antrenmanları teknik heyet otomatik yönetir."
                                >
                                    <ToggleRight size={18} className="text-green-400"/> Otomatik Antrenman (Aç)
                                </button>
                            </>
                        )}
                    </div>

                    {/* Last Training Report (Feedback) */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex flex-col h-[450px]">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 shrink-0 border-b border-slate-700 pb-2">
                            <ClipboardList size={14}/> Antrenman Özeti
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
                            {lastReport.length === 0 ? (
                                <div className="text-slate-500 text-xs italic text-center py-4">Henüz rapor yok.</div>
                            ) : (
                                <>
                                    {/* BEST PERFORMERS */}
                                    <div>
                                        <h4 className="text-[10px] font-black text-green-400 uppercase mb-2 flex items-center gap-1">
                                            <Trophy size={12} className="text-green-500"/> EN İYİ PERFORMANS
                                        </h4>
                                        <div className="space-y-2">
                                            {topPerformers.map((item, idx) => {
                                                const player = team.players.find(p => p.id === item.playerId);
                                                return (
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => player && onPlayerClick && onPlayerClick(player)}
                                                        className="p-2 rounded bg-green-900/20 border-l-2 border-green-500 flex items-center gap-3 cursor-pointer hover:bg-green-900/40 transition-colors group"
                                                    >
                                                        {player && (
                                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600 bg-slate-200 shrink-0">
                                                                <PlayerFace player={player} />
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center w-full mb-0.5">
                                                                <div className="font-bold text-green-100 flex items-center gap-1 group-hover:text-white transition-colors">
                                                                    {item.playerName}
                                                                </div>
                                                                {item.score && (
                                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black font-mono bg-green-600 text-white">
                                                                        {item.score.toFixed(1)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* WORST PERFORMERS (Only if score < 7) */}
                                    {worstPerformers.length > 0 && (
                                        <div className="pt-2 border-t border-slate-700/50">
                                            <h4 className="text-[10px] font-black text-red-400 uppercase mb-2 flex items-center gap-1">
                                                <Frown size={12} className="text-red-500"/> EN KÖTÜ (7.0 ALTI)
                                            </h4>
                                            <div className="space-y-2">
                                                {worstPerformers.map((item, idx) => {
                                                    const player = team.players.find(p => p.id === item.playerId);
                                                    return (
                                                        <div 
                                                            key={idx} 
                                                            onClick={() => player && onPlayerClick && onPlayerClick(player)}
                                                            className="p-2 rounded bg-red-900/20 border-l-2 border-red-500 flex items-center gap-3 cursor-pointer hover:bg-red-900/40 transition-colors group"
                                                        >
                                                             {player && (
                                                                <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600 bg-slate-200 shrink-0">
                                                                    <PlayerFace player={player} />
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <div className="flex justify-between items-center w-full mb-0.5">
                                                                    <div className="font-bold text-red-100 flex items-center gap-1 group-hover:text-white transition-colors">
                                                                        {item.playerName}
                                                                    </div>
                                                                    {item.score && (
                                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black font-mono bg-red-600 text-white">
                                                                            {item.score.toFixed(1)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Development Center Link */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col items-center text-center justify-center min-h-[240px]">
                        <div className="bg-blue-900/30 p-3 rounded-full mb-3 text-blue-400">
                            <TrendingUp size={32}/>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Bireysel Gelişim</h3>
                        <p className="text-xs text-slate-400 mb-4">
                            Oyuncularınıza özel programlar hazırlayın ve gelişimlerini yakından takip edin.
                        </p>
                        <button 
                            onClick={onGoToDevelopment}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition border border-slate-600 flex items-center justify-center gap-2 text-sm pointer-events-auto"
                        >
                            Gelişim Merkezine Git <Play size={12}/>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TrainingView;
