import React, { useState } from 'react';
import { Team, Player } from '../types';
import { Mic, Flame, Anchor, ThumbsDown, Zap, X, CheckCircle2 } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';

interface HalftimeTalkModalProps {
    team: Team;
    opponent: Team; // Opponent Team for difficulty calculation
    scoreDiff: number;
    onComplete: (moraleChange: number) => void;
    onClose: () => void;
}

const HalftimeTalkModal: React.FC<HalftimeTalkModalProps> = ({ team, opponent, scoreDiff, onComplete, onClose }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);

    const getMoodLabel = (morale: number) => {
        if (morale >= 90) return 'Hayat Dolu';
        if (morale >= 75) return 'Çok Mutlu';
        if (morale >= 60) return 'Mutlu';
        if (morale >= 45) return 'Nötr';
        if (morale >= 30) return 'Üzgün';
        if (morale >= 15) return 'Hayal Kırıklığı';
        return 'Demoralize';
    };

    const getMoodColor = (morale: number) => {
        if (morale >= 90) return 'text-purple-400';
        if (morale >= 75) return 'text-green-400';
        if (morale >= 60) return 'text-emerald-400';
        if (morale >= 45) return 'text-slate-300';
        if (morale >= 30) return 'text-orange-400';
        if (morale >= 15) return 'text-red-400';
        return 'text-red-600';
    };

    // Calculate Opponent Difficulty
    const myStrength = team.strength;
    const oppStrength = opponent.strength;
    let difficulty: 'HARD' | 'EQUAL' | 'EASY' = 'EQUAL';
    
    if (oppStrength > myStrength + 4) difficulty = 'HARD';
    else if (oppStrength < myStrength - 4) difficulty = 'EASY';

    // Calculate Dynamic Morale Effect
    const calculateMoraleChange = (type: 'RELAXED' | 'BALANCED' | 'DEMANDING') => {
        let change = -4; // Default negative impact (Wrong choice penalty)

        if (type === 'RELAXED') {
            // Rahatlatıcı: Only good if winning big (3+ diff)
            if (scoreDiff >= 3) change = 5;
        } 
        else if (type === 'BALANCED') {
            // Dengeli
            if (scoreDiff === 0 && (difficulty === 'HARD' || difficulty === 'EQUAL')) change = 4; // Draw vs Hard/Equal
            else if (scoreDiff > 0 && scoreDiff < 3) change = 4; // Winning narrow (Any Opponent)
        } 
        else if (type === 'DEMANDING') {
            // Talepkar
            if (scoreDiff === 0 && difficulty === 'EASY') change = 6; // Draw vs Easy (Should be winning)
            else if (scoreDiff < 0 && (difficulty === 'EQUAL' || difficulty === 'EASY')) change = 6; // Losing vs Equal/Easy (Unacceptable)
            else if (scoreDiff < 0 && difficulty === 'HARD') change = 2; // Losing vs Hard (Demand effort, small positive)
        }

        return change;
    };

    const options = [
        { 
            id: 'RELAXED', 
            title: 'Rahatlatıcı', 
            icon: Zap, 
            color: 'text-green-400',
            getText: () => {
                if (scoreDiff >= 3) return "Harika iş çıkardınız, skoru aldık. İkinci yarı keyfini çıkarın ama gevşemeyin.";
                if (scoreDiff > 0) return "İyi gidiyoruz, baskı yapmanıza gerek yok. Topu tutun ve skoru koruyun.";
                return "Henüz bir şey bitmedi, üzerinizdeki baskıyı atın ve oyununuzu oynayın.";
            },
            moraleChange: calculateMoraleChange('RELAXED')
        },
        { 
            id: 'BALANCED', 
            title: 'Dengeli', 
            icon: Anchor, 
            color: 'text-blue-400',
            getText: () => {
                if (scoreDiff > 0) return "Disiplini elden bırakmadan aynı ciddiyetle devam etmenizi istiyorum.";
                if (scoreDiff === 0) return "Maç ortada, sabırlı oynarsak ibre bize dönecektir. Plana sadık kalın.";
                return "Maçı çevirebiliriz. Paniğe gerek yok, organize olursak golleri buluruz.";
            },
            moraleChange: calculateMoraleChange('BALANCED')
        },
        { 
            id: 'DEMANDING', 
            title: 'Talepkar', 
            icon: Flame, 
            color: 'text-red-500',
            getText: () => {
                if (scoreDiff > 0) return "Bu skor yetmez! Rakibi sahadan silmenizi ve daha fazla atmanızı istiyorum!";
                if (scoreDiff === 0) return "Beraberlik bizim için başarı değil! Sahaya çıkın ve bu maçı alın!";
                return "Bu futbol size yakışmıyor! İkinci yarıda bambaşka bir takım görmek istiyorum!";
            },
            moraleChange: calculateMoraleChange('DEMANDING')
        }
    ];

    const handleConfirm = () => {
        if (!selectedId) return;
        const option = options.find(o => o.id === selectedId);
        if (option) {
            onComplete(option.moraleChange);
            setIsConfirmed(true);
            setTimeout(() => onClose(), 1500);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1a1c23] w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
                <div className="p-6 border-b border-slate-800 bg-[#21242c] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Mic size={24} className="text-blue-500 animate-pulse" />
                        <div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-widest">Devre Arası Konuşması</h3>
                            <p className="text-xs text-slate-500">
                                Skor: {scoreDiff > 0 ? `+${scoreDiff} (Öndesiniz)` : scoreDiff < 0 ? `${scoreDiff} (Geridesiniz)` : 'Beraberlik'} • Rakip: {difficulty === 'HARD' ? 'Zorlu' : difficulty === 'EASY' ? 'Zayıf' : 'Denk'}
                            </p>
                        </div>
                    </div>
                    {!isConfirmed && (
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition p-2 bg-slate-800 rounded-full">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    <div className="w-full md:w-1/3 bg-black/20 p-4 overflow-y-auto custom-scrollbar border-r border-slate-800">
                        <div className="grid grid-cols-2 gap-2">
                            {team.players.slice(0, 11).map(p => (
                                <div key={p.id} className="flex flex-col items-center gap-1 bg-slate-800/40 p-2 rounded border border-slate-700">
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600">
                                        <PlayerFace player={p} />
                                    </div>
                                    <span className="text-[10px] font-bold text-white truncate w-full text-center">{p.name.split(' ').pop()}</span>
                                    <div className="text-[8px] font-black uppercase tracking-tighter text-center w-full truncate">
                                        <span className={getMoodColor(p.morale)}>{getMoodLabel(p.morale)}</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden mt-1">
                                        <div className={`h-full transition-all duration-1000 ${p.morale >= 90 ? 'bg-purple-500' : p.morale >= 60 ? 'bg-green-500' : p.morale >= 45 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${p.morale}%`}}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 p-6 flex flex-col justify-center bg-[#16181d]">
                        {!isConfirmed ? (
                            <div className="space-y-4">
                                {options.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSelectedId(opt.id)}
                                        className={`w-full p-5 rounded-xl border-2 text-left transition-all group flex flex-col gap-2 ${
                                            selectedId === opt.id 
                                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-750'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <opt.icon size={18} className={selectedId === opt.id ? 'text-white' : opt.color} />
                                            <span className="text-sm font-black uppercase tracking-wider">{opt.title}</span>
                                        </div>
                                        <p className="text-sm italic opacity-90 leading-tight">"{opt.getText()}"</p>
                                    </button>
                                ))}

                                <div className="pt-6 mt-4 border-t border-slate-800 flex justify-end">
                                    <button 
                                        disabled={!selectedId}
                                        onClick={handleConfirm}
                                        className="bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black px-10 py-4 rounded-xl shadow-xl flex items-center gap-3 transition-transform active:scale-95"
                                    >
                                        KONUŞMAYI YAP <Mic size={20}/>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-500 text-green-500 mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                    <CheckCircle2 size={56} />
                                </div>
                                <h4 className="text-2xl font-black text-white mb-2">Konuşma Etkili Oldu</h4>
                                <p className="text-slate-400">Takım reaksiyon gösterdi. İkinci yarı başlamak üzere!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HalftimeTalkModal;