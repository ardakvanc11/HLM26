import React, { useState, useMemo } from 'react';
import { Team, Player } from '../types';
import { Mic, ThumbsUp, ThumbsDown, Flame, Anchor, HeartPulse, ChevronRight, Users, User, ArrowUp, Smile, Meh, Frown, Trophy, MessageSquare, Heart, AlertCircle, Ghost } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';
import { TALK_PERSONALITIES_GROUPS } from '../data/playerConstants';
import { TALK_RESPONSES } from '../data/talkResponses';
import { STRONG_OPPONENT_TALKS, WEAK_OPPONENT_TALKS, BALANCED_OPPONENT_TALKS } from '../data/talkPhrases';
import { pick } from '../utils/helpers';

interface PreMatchTalkViewProps {
    team: Team;
    opponent: Team; 
    managerName: string;
    onComplete: (moraleChange: number) => void;
    onProceedToLockerRoom: () => void;
}

interface PlayerTalkCardProps {
    player: Player;
    isCaptain: boolean;
    talkPersonality: string;
}

const PlayerTalkCard: React.FC<PlayerTalkCardProps> = ({ player, isCaptain, talkPersonality }) => {
    const getMoodInfo = (morale: number) => {
        if (morale >= 90) return { label: 'Hayat Dolu', emoji: '✨', color: 'bg-purple-600/30 text-purple-400', icon: Heart };
        if (morale >= 75) return { label: 'Çok Mutlu', emoji: '🌟', color: 'bg-green-600/30 text-green-400', icon: Smile };
        if (morale >= 60) return { label: 'Mutlu', emoji: '😊', color: 'bg-emerald-600/20 text-emerald-400', icon: Smile };
        if (morale >= 45) return { label: 'Nötr', emoji: '😐', color: 'bg-slate-700 text-slate-300', icon: Meh };
        if (morale >= 30) return { label: 'Üzgün', emoji: '😟', color: 'bg-orange-600/20 text-orange-400', icon: Frown };
        if (morale >= 15) return { label: 'Hayal Kırıklığı', emoji: '😞', color: 'bg-red-600/20 text-red-400', icon: Frown };
        return { label: 'Demoralize', emoji: '💀', color: 'bg-red-900/40 text-red-500', icon: AlertCircle };
    };

    const mood = getMoodInfo(player.morale);

    return (
        <div className="bg-[#2a2d37] border border-slate-700 rounded-lg p-2 flex flex-col items-center gap-1 w-full shadow-lg relative group overflow-hidden transition-all duration-300">
            {isCaptain && (
                <div className="absolute top-1 left-1 z-30 w-5 h-5 bg-yellow-500 text-black text-[10px] font-black rounded-sm flex items-center justify-center border border-black shadow-md ring-1 ring-yellow-400/50" title="Takım Kaptanı">
                    C
                </div>
            )}
            
            <div className="absolute top-1 right-1 opacity-40">
                <ArrowUp size={10} className="text-purple-400" />
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-600 mb-1">
                <PlayerFace player={player} />
            </div>
            <div className="flex flex-col items-center gap-0 w-full">
                <div className="text-[11px] font-bold text-white truncate w-full text-center">
                    {player.name}
                </div>
                <div className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter truncate w-full text-center">
                    {talkPersonality}
                </div>
            </div>
            <div className={`mt-1 flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${mood.color}`}>
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
            </div>
        </div>
    );
};

const PreMatchTalkView: React.FC<PreMatchTalkViewProps> = ({ team, opponent, managerName, onComplete, onProceedToLockerRoom }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [responseMessage, setResponseMessage] = useState<string>("");

    const captainId = useMemo(() => {
        if (team.setPieceTakers?.captain) {
            const exists = team.players.some(p => p.id === team.setPieceTakers?.captain);
            if (exists) return team.setPieceTakers.captain;
        }
        const sorted = [...team.players].sort((a, b) => b.stats.leadership - a.stats.leadership);
        return sorted[0]?.id;
    }, [team]);

    const speakingCaptain = useMemo(() => {
        return team.players.find(p => p.id === captainId) || team.players[0];
    }, [team, captainId]);

    const getPlayerPersonalityLabel = (p: Player) => {
        if (p.id === captainId) return "Lider / Kaptan";
        if (p.age <= 22) {
            const pool = TALK_PERSONALITIES_GROUPS.YOUNG;
            const seed = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return pool[seed % pool.length];
        } 
        if (p.age >= 31) {
            if (p.skill >= 80) {
                const pool = TALK_PERSONALITIES_GROUPS.LEADER;
                const seed = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                return pool[seed % pool.length];
            } else {
                const pool = TALK_PERSONALITIES_GROUPS.VETERAN;
                const seed = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                return pool[seed % pool.length];
            }
        }
        const pool = TALK_PERSONALITIES_GROUPS.MATURE;
        const seed = p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return pool[seed % pool.length];
    };

    // Her render'da değişmemesi için butona basılınca değil, sayfa açılınca bir kez rastgele seçimler yaparız
    const chosenPhrases = useMemo(() => {
        return {
            strong: pick(STRONG_OPPONENT_TALKS),
            weak: pick(WEAK_OPPONENT_TALKS),
            balanced: pick(BALANCED_OPPONENT_TALKS)
        };
    }, []);

    const talkOptions = useMemo(() => {
        const diff = opponent.strength - team.strength;
        const isStrong = diff >= 3;
        const isWeak = diff <= -3;

        return [
            {
                id: 'RELAXED',
                title: 'Rahatlatıcı',
                icon: HeartPulse,
                color: 'text-green-500',
                bg: 'bg-green-500/10 border-green-500/50',
                selectedBg: 'bg-green-600 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]',
                text: isStrong 
                    ? chosenPhrases.strong 
                    : isWeak 
                        ? chosenPhrases.weak 
                        : chosenPhrases.balanced,
                moraleChange: isStrong ? 8 : (isWeak ? -5 : 2)
            },
            {
                id: 'CALM',
                title: 'Dengeli',
                icon: Anchor,
                color: 'text-yellow-500',
                bg: 'bg-yellow-500/10 border-yellow-500/50',
                selectedBg: 'bg-yellow-600 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]',
                text: chosenPhrases.balanced,
                moraleChange: 7
            },
            {
                id: 'DEMANDING',
                title: 'Talepkar',
                icon: ThumbsDown,
                color: 'text-red-500',
                bg: 'bg-red-500/10 border-red-500/50',
                selectedBg: 'bg-red-600 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]',
                text: isWeak 
                    ? "Bu maçı kazanmak zorundayız, hiçbir bahane kabul etmiyorum!" 
                    : "Sahada terinizin son damlasına kadar savaşmanızı bekliyorum.",
                moraleChange: isWeak ? 10 : (isStrong ? -8 : 1)
            }
        ];
    }, [team.strength, opponent.strength, chosenPhrases]);

    const handleConfirm = () => {
        if (!selectedId) return;
        const option = talkOptions.find(o => o.id === selectedId);
        if (option) {
            onComplete(option.moraleChange);
            let pool = TALK_RESPONSES.NEUTRAL;
            if (option.moraleChange > 0) pool = TALK_RESPONSES.POSITIVE;
            else if (option.moraleChange < 0) pool = TALK_RESPONSES.NEGATIVE;
            setResponseMessage(pick(pool));
            setIsConfirmed(true);
        }
    };

    const getMoodLabel = (morale: number) => {
        if (morale >= 90) return 'Hayat Dolu';
        if (morale >= 75) return 'Çok Mutlu';
        if (morale >= 60) return 'Mutlu';
        if (morale >= 45) return 'Nötr';
        if (morale >= 30) return 'Üzgün';
        if (morale >= 15) return 'Hayal Kırıklığı';
        return 'Demoralize';
    };

    return (
        <div className="h-full flex flex-col bg-[#111317] text-white overflow-hidden relative font-sans">
            <div className="h-12 bg-[#1a1c23] border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-800 p-1.5 rounded">
                        <Users size={18} className="text-slate-400" />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200">Maç Öncesi Konuşması</h2>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#16181d] relative">
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-[#1a1c23] border border-slate-700/50 px-12 py-4 rounded-xl shadow-2xl flex items-center justify-center min-w-[320px] md:min-w-[450px]">
                            <span className="text-slate-400 text-sm md:text-base font-medium tracking-wide uppercase font-teko">
                                {isConfirmed ? 'Kaptan Konuşuyor...' : 'Oyuncular cevabınızı bekliyor'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 mt-24">
                        {team.players.map((p) => (
                            <PlayerTalkCard 
                                key={p.id} 
                                player={p} 
                                isCaptain={p.id === captainId} 
                                talkPersonality={getPlayerPersonalityLabel(p)}
                            />
                        ))}
                    </div>

                    {isConfirmed && responseMessage && (
                        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-500 backdrop-blur-sm">
                            <div className="bg-[#161a1f] w-full max-w-2xl rounded-xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                                <div className="p-4 bg-slate-900/80 border-b border-slate-700 flex items-center gap-3">
                                    <div className="bg-yellow-500 p-1 rounded">
                                        <Trophy size={16} className="text-black" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Takım Tepkisi</span>
                                </div>
                                <div className="p-6 flex gap-6">
                                    <div className="flex flex-col items-center gap-2 shrink-0">
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-yellow-500 shadow-lg bg-slate-800">
                                            <PlayerFace player={speakingCaptain} />
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-bold text-white leading-tight">{speakingCaptain.name}</div>
                                            <div className="text-[10px] text-yellow-500 font-black uppercase tracking-tighter mt-0.5">Takım Lideri</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                <MessageSquare size={12} /> Yanıt
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                speakingCaptain.morale >= 90 ? 'bg-purple-500/20 text-purple-400' :
                                                speakingCaptain.morale >= 75 ? 'bg-green-500/20 text-green-400' :
                                                speakingCaptain.morale >= 45 ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                                 Durum: {getMoodLabel(speakingCaptain.morale)}
                                            </div>
                                        </div>
                                        <div className="relative bg-blue-600 text-white p-5 rounded-2xl rounded-tl-none shadow-xl border border-blue-400/30 min-h-[100px] flex items-center">
                                            <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-600 rotate-45 transform origin-top-left -z-10 border-l border-t border-blue-400/30"></div>
                                            <p className="text-sm md:text-base font-medium leading-relaxed italic">
                                                "{responseMessage}"
                                            </p>
                                        </div>
                                        <div className="mt-6 flex justify-end">
                                            <button 
                                                onClick={onProceedToLockerRoom}
                                                className="bg-white text-black font-black px-8 py-3 rounded-lg hover:bg-slate-200 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                                            >
                                                SOYUNMA ODASINA GEÇ <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-80 border-l border-slate-800 bg-[#1a1c23] flex flex-col shadow-2xl shrink-0">
                    <div className="p-4 border-b border-slate-800 bg-[#21242c] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 overflow-hidden">
                            <User size={20} className="text-slate-400" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">{managerName}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Menajer</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/20">
                        {!isConfirmed ? (
                            <>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Konuşma Seçenekleri</div>
                                {talkOptions.map((opt) => {
                                    const isSelected = selectedId === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => setSelectedId(opt.id)}
                                            className={`w-full p-4 rounded-xl border transition-all text-left flex flex-col gap-2 ${
                                                isSelected 
                                                    ? opt.selectedBg + ' text-white'
                                                    : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-500'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isSelected ? <Mic size={14} className="animate-pulse" /> : <opt.icon size={14} className={opt.color} />}
                                                <span className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-white' : opt.color}`}>{opt.title}</span>
                                            </div>
                                            <p className="text-[11px] leading-tight italic opacity-90">"{opt.text}"</p>
                                        </button>
                                    );
                                })}
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-6 py-10 animate-in fade-in zoom-in-95 duration-500">
                                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500 text-green-500">
                                    <ThumbsUp size={40} />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-white mb-2">Konuşma Tamamlandı</h3>
                                </div>
                                <div className="w-full h-px bg-slate-800"></div>
                            </div>
                        )}
                    </div>

                    {!isConfirmed && (
                        <div className="p-4 bg-[#1a1c23] border-t border-slate-800">
                            <button
                                onClick={handleConfirm}
                                disabled={!selectedId}
                                className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-30 disabled:cursor-not-allowed text-black font-black py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg uppercase tracking-widest text-xs"
                            >
                                KONUŞMAYI YAP <Mic size={16}/>
                            </button>
                            <button 
                                onClick={onProceedToLockerRoom}
                                className="w-full mt-3 text-slate-500 hover:text-slate-300 transition-colors text-[10px] font-bold uppercase tracking-widest"
                            >
                                Konuşma Yapmadan Geç
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreMatchTalkView;