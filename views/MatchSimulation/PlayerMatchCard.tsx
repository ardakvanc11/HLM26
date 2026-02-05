
import React from 'react';
import { Player } from '../../types';
import { Smile, Meh, Frown, Heart, RectangleVertical, AlertCircle } from 'lucide-react';
import PlayerFace from '../../components/shared/PlayerFace';

interface PlayerMatchCardProps {
    player: Player;
    rating: number;
    onClick: (e: React.MouseEvent) => void;
    isRedCarded?: boolean;
}

const PlayerMatchCard: React.FC<PlayerMatchCardProps> = ({ player, rating, onClick, isRedCarded = false }) => {
    const cond = player.condition !== undefined ? player.condition : 100;
    const morale = player.morale;
    
    let heartColor = 'text-green-500';
    if (cond < 75) heartColor = 'text-orange-500';
    if (cond < 50) heartColor = 'text-red-500';

    let moraleIcon = <Smile size={14} className="text-green-500"/>;
    if (morale < 70) moraleIcon = <Meh size={14} className="text-yellow-500"/>;
    if (morale < 40) moraleIcon = <Frown size={14} className="text-red-500"/>;

    let ratingColor = 'bg-slate-600';
    if (rating >= 7.5) ratingColor = 'bg-green-600';
    else if (rating >= 7.0) ratingColor = 'bg-green-500';
    else if (rating >= 6.5) ratingColor = 'bg-yellow-600';
    else if (rating < 6.0) ratingColor = 'bg-red-600';

    const isMinorInjury = player.injury && player.injury.daysRemaining < 10;
    const isMajorInjury = player.injury && player.injury.daysRemaining >= 10;

    return (
        <div 
            onClick={onClick}
            className={`flex flex-col items-center justify-between bg-[#242832] p-2 rounded-xl border border-slate-700 w-28 h-[90%] shrink-0 relative group shadow-lg transition-all cursor-pointer 
            ${isRedCarded ? 'grayscale opacity-75 border-red-900 bg-red-950/30' : 'hover:border-white hover:bg-[#2f333d] hover:-translate-y-1'}`}
        >
            {/* Position Badge */}
            <div className="absolute top-2 left-2 bg-slate-900 text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-slate-600 shadow-sm z-10">
                {player.position}
            </div>

            {/* Red Card Indicator */}
            {isRedCarded && (
                <div className="absolute top-2 right-2 z-20 animate-pulse">
                    <div className="bg-red-600 w-4 h-5 rounded-[2px] border border-white shadow-md flex items-center justify-center">
                        <RectangleVertical size={10} className="fill-red-800 text-red-800" />
                    </div>
                </div>
            )}

            {/* Injury Indicator */}
            {player.injury && !isRedCarded && (
                <div className={`absolute top-2 right-2 z-20 flex items-center justify-center w-5 h-5 rounded-full ${isMinorInjury ? 'bg-orange-500 text-white' : 'bg-red-600 text-white'} shadow-md border border-white/20 animate-pulse`}>
                    <AlertCircle size={12} />
                </div>
            )}

            {/* Face - Bigger */}
            <div className={`w-16 h-16 rounded-full border-2 border-slate-500 bg-slate-400 overflow-hidden shadow-inner mt-2 pointer-events-none ${isRedCarded ? 'opacity-80' : ''}`}>
                <PlayerFace player={player} />
            </div>

            {/* Name */}
            <div className="text-xs font-bold text-slate-100 truncate w-full text-center px-1 pointer-events-none">
                {player.name.split(' ').pop()}
            </div>
            
            {/* Stats (Cond/Morale) */}
            <div className="flex items-center justify-center gap-3 w-full px-1 pointer-events-none">
                <div className="flex items-center gap-1" title={`Kondisyon: %${Math.round(cond)}`}>
                    <Heart size={14} className={heartColor} fill="currentColor"/>
                    <span className={`text-[10px] font-mono ${heartColor}`}>{Math.round(cond)}%</span>
                </div>
                <div className="flex items-center gap-1" title={`Moral: %${Math.round(morale)}`}>
                    {moraleIcon}
                </div>
            </div>

            {/* Rating - Bigger bar */}
            <div className={`w-full text-center text-sm font-black text-white rounded py-1 ${ratingColor} shadow-sm pointer-events-none`}>
                {rating.toFixed(1)}
            </div>
        </div>
    );
};

export default PlayerMatchCard;
