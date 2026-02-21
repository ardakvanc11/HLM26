import React from 'react';
import { Position, Player } from '../../types';

interface PlayerPositionPitchProps {
    player: Player;
}

const POSITION_MAP: Record<Position, { x: number, y: number }> = {
    [Position.GK]: { x: 8, y: 50 },
    [Position.SLB]: { x: 28, y: 20 },
    [Position.STP]: { x: 28, y: 50 },
    [Position.SGB]: { x: 28, y: 80 },
    [Position.OS]: { x: 50, y: 50 },
    [Position.OOS]: { x: 68, y: 50 },
    [Position.SLK]: { x: 78, y: 20 },
    [Position.SGK]: { x: 78, y: 80 },
    [Position.SNT]: { x: 88, y: 50 },
};

const PlayerPositionPitch: React.FC<PlayerPositionPitchProps> = ({ player }) => {
    return (
        <div className="w-full flex justify-center">
            {/* Pitch Container */}
            <div className="relative aspect-[16/10] bg-[#1a1f26] border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden w-full max-w-md shadow-inner">
                {/* Pitch Markings */}
                <div className="absolute inset-0 opacity-40 pointer-events-none">
                    {/* Middle Line */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-500"></div>
                    <div className="absolute top-1/2 left-1/2 w-12 h-12 border border-slate-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                    
                    {/* Goal Areas */}
                    <div className="absolute top-1/4 bottom-1/4 left-0 w-12 border-y border-r border-slate-500"></div>
                    <div className="absolute top-1/4 bottom-1/4 right-0 w-12 border-y border-l border-slate-500"></div>
                    <div className="absolute top-[40%] bottom-[40%] left-0 w-4 border-y border-r border-slate-500"></div>
                    <div className="absolute top-[40%] bottom-[40%] right-0 w-4 border-y border-l border-slate-500"></div>
                </div>

                {/* Position Nodes */}
                {Object.entries(POSITION_MAP).map(([pos, coords]) => {
                    const isMain = player.position === pos;
                    const isSecondary = player.secondaryPosition === pos;
                    const canPlay = isMain || isSecondary;

                    return (
                        <div 
                            key={pos}
                            className="absolute -translate-x-1/2 -translate-y-1/2 group"
                            style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                        >
                            <div className={`
                                w-3 h-3 rounded-full border-2 transition-all duration-300
                                ${isMain 
                                    ? 'bg-[#00ff88] border-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.6)] scale-150' 
                                    : isSecondary 
                                        ? 'bg-[#facc15] border-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.4)] scale-125' 
                                        : 'bg-[#000000]/40 border-slate-600 opacity-30'
                                }
                            `}></div>
                            
                            {/* Hover Tooltip (Only for playable positions) */}
                            {canPlay && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap z-20 shadow-lg">
                                    {pos}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PlayerPositionPitch;