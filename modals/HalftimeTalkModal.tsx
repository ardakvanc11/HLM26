import React, { useState } from 'react';
import { Team, Player } from '../types';
import { Mic, Flame, Anchor, ThumbsDown, Zap, X, CheckCircle2, Heart, Smile, Meh, Frown, AlertCircle } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';

interface HalftimeTalkModalProps {
    team: Team;
    scoreDiff: number;
    onComplete: (moraleChange: number) => void;
    onClose: () => void;
}

const HalftimeTalkModal: React.FC<HalftimeTalkModalProps> = ({ team, scoreDiff, onComplete, onClose }) => {
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

    const getOptions = () => {
        if (scoreDiff > 0) {
            return [
                { id: '1', title: 'Disiplin', text: "Harika gidiyoruz beyler! Rehavete kapılmayın, aynısı ciddiyetle devam.", icon: Anchor, color: 'text-blue-400', moraleChange: 2 },
                { id: '2', title: 'Saldırgan', text: "Yetmez! Daha fazla gol istiyorum, rakibi sahadan silelim!", icon: Flame, color: 'text-orange-500', moraleChange: 5 },
                { id: '3', title: 'Sakin', text: "Topu ayağımızda tutalım, skoru kontrol edelim. Risk almayın.", icon: Zap, color: 'text-yellow-400', moraleChange: 1 }
            ];
        } else if (scoreDiff < 0) {
            return [
                { id: '1', title: 'Sert', text: "Bu futbol size yakışmıyor! Kendinize gelin ve savaşın!", icon: ThumbsDown, color: 'text-red-500', moraleChange: -5 },
                { id: '2', title: 'Motive Edici', text: "Hala vaktimiz var. Bir gol maçı çevirir. Size inanıyorum!", icon: Flame, color: 'text-green-400', moraleChange: 8 },
                { id: '3', title: 'Analitik', text: "Sakin olun, taktiğe sadık kalın. Fırsatlar mutlaka gelecek.", icon: Anchor, color: 'text-blue-400', moraleChange: 3 }
            ];
        } else {
            return [
                { id: '1', title: 'Motive Edici', text: "Maçı kazanabiliriz. Biraz daha baskı kurarsak gol gelecek.", icon: Flame, color: 'text-green-400', moraleChange: 5 },
                { id: '2', title: 'Dikkatli', text: "Hata yapan kaybeder. Kontrollü oyundan taviz vermeyin.", icon: Anchor, color: 'text-blue-400', moraleChange: 2 },
                { id: '3', title: 'Agresif', text: "Rakip yoruldu! Tempoyu arttırın ve onları boğun!", icon: Zap, color: 'text-orange-500', moraleChange: 4 }
            ];
        }
    };

    const options = getOptions();

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
                            <p className="text-xs text-slate-500">Skor: {scoreDiff > 0 ? 'Öndesiniz' : scoreDiff < 0 ? 'Geridesiniz' : 'Beraberlik'}</p>
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
                                        <p className="text-sm italic opacity-90 leading-tight">"{opt.text}"</p>
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
                                <p className="text-slate-400">Takım moral kazandı. İkinci yarı başlamak üzere!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HalftimeTalkModal;