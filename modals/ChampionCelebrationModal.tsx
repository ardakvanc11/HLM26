
import React, { useEffect, useState } from 'react';
import { Trophy, Star, X } from 'lucide-react';
import { SeasonChampion } from '../types';

interface ChampionCelebrationModalProps {
    champion: SeasonChampion;
    onClose: () => void;
    isUserChampion: boolean;
}

const ChampionCelebrationModal: React.FC<ChampionCelebrationModalProps> = ({ champion, onClose, isUserChampion }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Trigger animation
        setTimeout(() => setVisible(true), 100);
    }, []);

    // Extract colors for gradient
    const fromColor = champion.colors[0].replace('bg-', 'from-');
    const toColor = champion.colors[1].replace('text-', 'to-'); // Basic fallback, usually text color

    // Confetti pieces
    const confettiCount = 50;
    const confetti = Array.from({ length: confettiCount }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2,
        color: ['bg-yellow-500', 'bg-blue-500', 'bg-red-500', 'bg-white'][Math.floor(Math.random() * 4)]
    }));

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 overflow-hidden" onClick={onClose}>
            {/* Animated Background Rays */}
            <div className="absolute inset-0 animate-[spin_20s_linear_infinite] opacity-30">
                <div className={`absolute top-[-50%] left-[-50%] right-[-50%] bottom-[-50%] bg-[conic-gradient(from_0deg,transparent_0_20deg,${champion.colors[0].replace('bg-','').replace('-600','-500')}_20deg_40deg,transparent_40deg_60deg,${champion.colors[0].replace('bg-','').replace('-600','-500')}_60deg_80deg,transparent_80deg_100deg,${champion.colors[0].replace('bg-','').replace('-600','-500')}_100deg_120deg,transparent_120deg_140deg,${champion.colors[0].replace('bg-','').replace('-600','-500')}_140deg_160deg,transparent_160deg_180deg,${champion.colors[0].replace('bg-','').replace('-600','-500')}_180deg_200deg,transparent_200deg_220deg,${champion.colors[0].replace('bg-','').replace('-600','-500')}_220deg_240deg,transparent_240deg_260deg,${champion.colors[0].replace('bg-','').replace('-600','-500')}_260deg_280deg,transparent_280deg_300deg,${champion.colors[0].replace('bg-','').replace('-600','-500')}_300deg_320deg,transparent_320deg_340deg,${champion.colors[0].replace('bg-','').replace('-600','-500')}_340deg_360deg)]`}></div>
            </div>

            {/* Falling Confetti */}
            {confetti.map((c) => (
                <div 
                    key={c.id}
                    className={`absolute top-[-10px] w-3 h-3 ${c.color} rounded-sm animate-fall`}
                    style={{
                        left: `${c.left}%`,
                        animationDuration: `${c.duration}s`,
                        animationDelay: `${c.delay}s`,
                        animationIterationCount: 'infinite'
                    }}
                />
            ))}

            <style>
                {`
                @keyframes fall {
                    0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                }
                `}
            </style>

            {/* Main Card */}
            <div 
                className={`relative w-full max-w-4xl bg-slate-900 border-4 border-yellow-500 rounded-3xl p-8 md:p-12 text-center shadow-[0_0_100px_rgba(234,179,8,0.5)] transform transition-all duration-1000 ${visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition bg-slate-800 p-2 rounded-full z-50">
                    <X size={24} />
                </button>

                {/* Trophy Icon */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <Trophy size={140} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] animate-bounce" />
                        <Star size={40} className="text-white absolute -top-4 -right-4 animate-ping" />
                        <Star size={30} className="text-white absolute top-10 -left-8 animate-pulse" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-300 uppercase tracking-[0.2em] font-teko">
                        {champion.season} SEZONU
                    </h3>
                    
                    <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 font-teko tracking-tight drop-shadow-sm uppercase">
                        ŞAMPİYON
                    </h1>

                    {/* Team Display */}
                    <div className={`inline-flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-b ${fromColor} to-black border-2 border-yellow-500/50 shadow-2xl mt-4 min-w-[300px]`}>
                        {champion.logo ? (
                            <img src={champion.logo} className="w-32 h-32 object-contain drop-shadow-2xl mb-4 animate-[spin_10s_linear_infinite_reverse]" alt="" />
                        ) : (
                            <div className={`w-32 h-32 rounded-full ${champion.colors[0]} flex items-center justify-center text-6xl font-bold text-white border-4 border-white mb-4 shadow-lg`}>
                                {champion.teamName.charAt(0)}
                            </div>
                        )}
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider drop-shadow-md">
                            {champion.teamName}
                        </h2>
                    </div>
                </div>

                {isUserChampion && (
                    <div className="mt-10">
                        <button 
                            onClick={onClose}
                            className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl px-12 py-4 rounded-full shadow-[0_0_30px_rgba(234,179,8,0.6)] hover:shadow-[0_0_50px_rgba(234,179,8,0.8)] transition-all transform hover:scale-105 uppercase tracking-widest"
                        >
                            KUTLAMALARA KATIL
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChampionCelebrationModal;
