
import React from 'react';
import { Player } from '../../types';
import { Syringe, Ban, Shirt } from 'lucide-react';
import PlayerFace from './PlayerFace';

interface PitchVisualProps {
    players: Player[];
    onPlayerClick: (p: Player) => void;
    selectedPlayerId: string | null;
    formation?: string;
    matchCompetitionId?: string; // New Prop for specific suspension check
    currentWeek?: number; // Added to check general suspension expiry
}

const FORMATIONS: Record<string, { left: string, bottom: string }[]> = {
    '4-4-2': [
        { left: '50%', bottom: '8%' },   // GK
        { left: '15%', bottom: '25%' },   // LB
        { left: '38%', bottom: '25%' },   // LCB
        { left: '62%', bottom: '25%' },   // RCB
        { left: '85%', bottom: '25%' },   // RB
        { left: '15%', bottom: '55%' },   // LM (Aşağı çekildi)
        { left: '38%', bottom: '45%' },   // LCM
        { left: '62%', bottom: '45%' },   // RCM
        { left: '85%', bottom: '55%' },   // RM (Aşağı çekildi)
        { left: '35%', bottom: '78%' },   // LST (Aşağı çekildi)
        { left: '65%', bottom: '78%' }    // RST (Aşağı çekildi)
    ],
    '4-3-3': [
        { left: '50%', bottom: '8%' },   // GK
        { left: '15%', bottom: '25%' },   // LB
        { left: '38%', bottom: '25%' },   // LCB
        { left: '62%', bottom: '25%' },   // RCB
        { left: '85%', bottom: '25%' },   // RB
        { left: '50%', bottom: '42%' },   // DM
        { left: '30%', bottom: '55%' },   // LCM
        { left: '70%', bottom: '55%' },   // RCM
        { left: '15%', bottom: '72%' },   // LW (Aşağı çekildi)
        { left: '85%', bottom: '72%' },   // RW (Aşağı çekildi)
        { left: '50%', bottom: '80%' }    // ST (Aşağı çekildi)
    ],
    '4-2-3-1': [
        { left: '50%', bottom: '8%' },   // GK
        { left: '15%', bottom: '25%' },   // LB
        { left: '38%', bottom: '25%' },   // LCB
        { left: '62%', bottom: '25%' },   // RCB
        { left: '85%', bottom: '25%' },   // RB
        { left: '35%', bottom: '42%' },   // LDM
        { left: '65%', bottom: '42%' },   // RDM
        { left: '15%', bottom: '65%' },   // LAM (Aşağı çekildi)
        { left: '50%', bottom: '65%' },   // CAM (Aşağı çekildi)
        { left: '85%', bottom: '65%' },   // RAM (Aşağı çekildi)
        { left: '50%', bottom: '80%' }    // ST (Aşağı çekildi)
    ],
    '4-1-4-1': [
        { left: '50%', bottom: '8%' },   // GK
        { left: '15%', bottom: '25%' },   // LB
        { left: '38%', bottom: '25%' },   // LCB
        { left: '62%', bottom: '25%' },   // RCB
        { left: '85%', bottom: '25%' },   // RB
        { left: '50%', bottom: '38%' },   // DM
        { left: '15%', bottom: '60%' },   // LM (Aşağı çekildi)
        { left: '35%', bottom: '55%' },   // LCM
        { left: '65%', bottom: '55%' },   // RCM
        { left: '85%', bottom: '60%' },   // RM (Aşağı çekildi)
        { left: '50%', bottom: '78%' }    // ST (Aşağı çekildi)
    ],
    '3-5-2': [
        { left: '50%', bottom: '8%' },   // GK
        { left: '25%', bottom: '22%' },   // LCB
        { left: '50%', bottom: '22%' },   // CB
        { left: '75%', bottom: '22%' },   // RCB
        { left: '10%', bottom: '50%' },   // LWB
        { left: '90%', bottom: '50%' },   // RWB
        { left: '35%', bottom: '42%' },   // LCM
        { left: '65%', bottom: '42%' },   // RCM
        { left: '50%', bottom: '60%' },   // AM (Aşağı çekildi)
        { left: '35%', bottom: '78%' },   // LST (Aşağı çekildi)
        { left: '65%', bottom: '78%' }    // RST (Aşağı çekildi)
    ],
    '5-3-2': [
        { left: '50%', bottom: '8%' },   // GK
        { left: '10%', bottom: '28%' },   // LWB
        { left: '30%', bottom: '22%' },   // LCB
        { left: '50%', bottom: '22%' },   // CB
        { left: '70%', bottom: '22%' },   // RCB
        { left: '90%', bottom: '28%' },   // RWB
        { left: '35%', bottom: '48%' },   // LCM
        { left: '50%', bottom: '42%' },   // CM
        { left: '65%', bottom: '48%' },   // RCM
        { left: '40%', bottom: '78%' },   // LST (Aşağı çekildi)
        { left: '60%', bottom: '78%' }    // RST (Aşağı çekildi)
    ]
};

const PitchVisual = ({ players, onPlayerClick, selectedPlayerId, formation = '4-4-2', matchCompetitionId, currentWeek }: PitchVisualProps) => {
    // Default to 4-4-2 if formation not found
    const positions = FORMATIONS[formation] || FORMATIONS['4-4-2'];

    const getPosBadgeColor = (pos: string) => {
        if (pos === 'GK') return 'bg-yellow-500 text-black border-yellow-300';
        if (['SLB', 'STP', 'SGB'].includes(pos)) return 'bg-blue-600 text-white border-blue-400';
        if (['OS', 'OOS'].includes(pos)) return 'bg-green-600 text-white border-green-400';
        return 'bg-red-600 text-white border-red-400';
    };

    return (
        <div className="relative w-full h-full bg-[#1a4a35] overflow-hidden rounded-xl border border-slate-700 shadow-2xl select-none">
             {/* Realistic Grass Pattern */}
             <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_49px,#143d2b_50px,#143d2b_99px)] opacity-50 pointer-events-none"></div>
             {/* Vignette Shadow */}
             <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.6)_100%)] pointer-events-none"></div>
             
             {/* Pitch Markings */}
             <div className="absolute inset-0 opacity-60 pointer-events-none">
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 -translate-x-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                {/* Penalty Area Top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-32 border-b-2 border-l-2 border-r-2 border-white/40"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-12 border-b-2 border-l-2 border-r-2 border-white/40"></div>
                {/* Penalty Area Bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-32 border-t-2 border-l-2 border-r-2 border-white/40"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/4 h-12 border-t-2 border-l-2 border-r-2 border-white/40"></div>
             </div>

             {/* Players */}
             {players.slice(0, 11).map((p, i) => {
                 const condition = p.condition !== undefined ? p.condition : p.stats.stamina;
                 const isSelected = selectedPlayerId === p.id;
                 const posCoords = positions[i] || { left: '50%', bottom: '50%' };
                 
                 let isSuspended = false;
                 // Use granular check if match context is provided, otherwise generic
                 if (matchCompetitionId) {
                     if (p.suspensions && p.suspensions[matchCompetitionId] && p.suspensions[matchCompetitionId] > 0) isSuspended = true;
                 } else {
                     // Check against currentWeek if provided, else fallback to simple existence (likely persisted view)
                     if (currentWeek && p.suspendedUntilWeek) {
                         isSuspended = p.suspendedUntilWeek > currentWeek;
                     } else if (p.suspendedUntilWeek) {
                         isSuspended = true; // Fallback if no week context
                     }
                 }

                 return (
                     <div key={p.id} onClick={() => onPlayerClick(p)}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all duration-300 z-10 group
                            ${isSelected ? 'scale-110 z-20' : 'hover:scale-105'}
                        `}
                        style={{ left: posCoords.left, bottom: posCoords.bottom }}
                     >
                         {/* Player Card Container */}
                         <div className={`relative flex flex-col items-center shadow-xl drop-shadow-2xl`}>
                            
                            {/* Position Badge (Top Left) */}
                            <div className={`absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-[9px] border-2 shadow-md z-30 ${getPosBadgeColor(p.position)}`}>
                                {p.position}
                            </div>

                            {/* Rating Badge (Top Right) */}
                            <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border-2 shadow-md z-30
                                ${p.skill >= 85 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black border-yellow-200' : 
                                  p.skill >= 75 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-black border-slate-100' :
                                  'bg-gradient-to-br from-orange-700 to-orange-900 text-white border-orange-400'}
                            `}>
                                {p.skill}
                            </div>

                            {/* Face Container */}
                            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 bg-slate-200 relative shadow-inner
                                ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400/50' : 'border-white'}
                            `}>
                                <PlayerFace player={p} />
                                {/* Injury / Suspension Overlays */}
                                {p.injury && (
                                    <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center backdrop-blur-[1px]">
                                        <Syringe className="text-white drop-shadow-md" size={24} />
                                    </div>
                                )}
                                {isSuspended && (
                                    <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center backdrop-blur-[1px]">
                                        <Ban className="text-white drop-shadow-md" size={24} />
                                    </div>
                                )}
                            </div>

                            {/* Info Plate */}
                            <div className="mt-[-8px] flex flex-col items-center z-20">
                                {/* Name & Number */}
                                <div className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md
                                    ${isSelected ? 'bg-yellow-500 text-black' : 'bg-slate-900 text-white border border-slate-600'}
                                `}>
                                    <span className="text-slate-400 font-mono mr-0.5">{i + 1}</span>
                                    {p.name.split(' ').pop()}
                                </div>
                                
                                {/* Condition Bar */}
                                <div className="w-12 h-1.5 bg-slate-900 rounded-full mt-0.5 border border-slate-700 overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 ${condition > 80 ? 'bg-green-500' : condition > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                        style={{ width: `${condition}%` }} 
                                    />
                                </div>

                                {/* Club Name Label (Optional - Used for All-Star/Dream teams, but hidden for own players if generic) */}
                                {p.clubName && p.clubName !== 'Serbest' && p.clubName !== 'Yurt Dışı Kulübü' && (
                                    <div className="text-[7px] md:text-[8px] text-white/80 bg-black/40 px-1.5 rounded-sm mt-0.5 leading-tight truncate max-w-[70px] shadow-sm backdrop-blur-[1px]">
                                        {p.clubName}
                                    </div>
                                )}
                            </div>

                         </div>
                         
                         {/* Selection Ring */}
                         {isSelected && (
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-yellow-400/50 rounded-full animate-ping pointer-events-none"></div>
                         )}
                     </div>
                 );
             })}
        </div>
    );
};

export default PitchVisual;