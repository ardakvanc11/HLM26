
import React from 'react';
import { Player, MatchEvent } from '../../types';
import PlayerFace from '../shared/PlayerFace';
import { Disc, AlertCircle } from 'lucide-react';

interface LiveFormationPitchProps {
    team: {
        name: string;
        players: Player[];
        formation: string;
    };
    getPlayerRating: (p: Player) => number;
    events: MatchEvent[];
}

const FORMATIONS: Record<string, { left: string, bottom: string }[]> = {
    '4-4-2': [
        { left: '50%', bottom: '5%' },   // GK
        { left: '15%', bottom: '18%' },  // LB
        { left: '38%', bottom: '18%' },  // LCB
        { left: '62%', bottom: '18%' },  // RCB
        { left: '85%', bottom: '18%' },  // RB
        { left: '15%', bottom: '45%' },  // LM
        { left: '38%', bottom: '40%' },  // LCM
        { left: '62%', bottom: '40%' },  // RCM
        { left: '85%', bottom: '45%' },  // RM
        { left: '35%', bottom: '70%' },  // LST
        { left: '65%', bottom: '70%' }   // RST
    ],
    '4-3-3': [
        { left: '50%', bottom: '5%' },   // GK
        { left: '15%', bottom: '18%' },  // LB
        { left: '38%', bottom: '18%' },  // LCB
        { left: '62%', bottom: '18%' },  // RCB
        { left: '85%', bottom: '18%' },  // RB
        { left: '50%', bottom: '35%' },  // CM
        { left: '28%', bottom: '45%' },  // LCM
        { left: '72%', bottom: '45%' },  // RCM
        { left: '18%', bottom: '65%' },  // LW
        { left: '82%', bottom: '65%' },  // RW
        { left: '50%', bottom: '75%' }   // ST
    ],
    '4-2-3-1': [
        { left: '50%', bottom: '5%' },   // GK
        { left: '15%', bottom: '18%' },  // LB
        { left: '38%', bottom: '18%' },  // LCB
        { left: '62%', bottom: '18%' },  // RCB
        { left: '85%', bottom: '18%' },  // RB
        { left: '35%', bottom: '35%' },  // LDM
        { left: '65%', bottom: '35%' },  // RDM
        { left: '20%', bottom: '55%' },  // LAM
        { left: '50%', bottom: '55%' },  // CAM
        { left: '80%', bottom: '55%' },  // RAM
        { left: '50%', bottom: '75%' }   // ST
    ],
    '4-1-4-1': [
        { left: '50%', bottom: '5%' },   // GK
        { left: '15%', bottom: '18%' },  // LB
        { left: '38%', bottom: '18%' },  // LCB
        { left: '62%', bottom: '18%' },  // RCB
        { left: '85%', bottom: '18%' },  // RB
        { left: '50%', bottom: '32%' },  // DM
        { left: '15%', bottom: '52%' },  // LM
        { left: '35%', bottom: '50%' },  // LCM
        { left: '65%', bottom: '50%' },  // RCM
        { left: '85%', bottom: '52%' },  // RM
        { left: '50%', bottom: '75%' }   // ST
    ],
    '3-5-2': [
        { left: '50%', bottom: '5%' },   // GK
        { left: '25%', bottom: '18%' },  // LCB
        { left: '50%', bottom: '16%' },  // CB
        { left: '75%', bottom: '18%' },  // RCB
        { left: '12%', bottom: '42%' },  // LWB
        { left: '88%', bottom: '42%' },  // RWB
        { left: '35%', bottom: '38%' },  // LCM
        { left: '65%', bottom: '38%' },  // RCM
        { left: '50%', bottom: '55%' },  // CAM
        { left: '35%', bottom: '75%' },  // LST
        { left: '65%', bottom: '75%' }   // RST
    ],
    '5-3-2': [
        { left: '50%', bottom: '5%' },   // GK
        { left: '12%', bottom: '25%' },  // LWB
        { left: '30%', bottom: '18%' },  // LCB
        { left: '50%', bottom: '16%' },  // CB
        { left: '70%', bottom: '18%' },  // RCB
        { left: '88%', bottom: '25%' },  // RWB
        { left: '35%', bottom: '42%' },  // LCM
        { left: '50%', bottom: '38%' },  // CM
        { left: '65%', bottom: '42%' },  // RCM
        { left: '38%', bottom: '75%' },  // LST
        { left: '62%', bottom: '75%' }   // RST
    ],
    // NEW FORMATIONS
    '3-2-4-1': [
        { left: '50%', bottom: '5%' },   // GK
        { left: '25%', bottom: '18%' },  // LCB
        { left: '50%', bottom: '16%' },  // CB
        { left: '75%', bottom: '18%' },  // RCB
        { left: '35%', bottom: '35%' },  // LDM
        { left: '65%', bottom: '35%' },  // RDM
        { left: '10%', bottom: '55%' },  // LM
        { left: '35%', bottom: '60%' },  // LAM
        { left: '65%', bottom: '60%' },  // RAM
        { left: '90%', bottom: '55%' },  // RM
        { left: '50%', bottom: '78%' }   // ST
    ],
    '4-2-2-2': [
        { left: '50%', bottom: '5%' },   // GK
        { left: '15%', bottom: '18%' },  // LB
        { left: '38%', bottom: '18%' },  // LCB
        { left: '62%', bottom: '18%' },  // RCB
        { left: '85%', bottom: '18%' },  // RB
        { left: '35%', bottom: '35%' },  // LDM
        { left: '65%', bottom: '35%' },  // RDM
        { left: '25%', bottom: '55%' },  // LAM
        { left: '75%', bottom: '55%' },  // RAM
        { left: '35%', bottom: '75%' },  // LST
        { left: '65%', bottom: '75%' }   // RST
    ],
    '4-2-4': [
        { left: '50%', bottom: '5%' },   // GK
        { left: '15%', bottom: '18%' },  // LB
        { left: '38%', bottom: '18%' },  // LCB
        { left: '62%', bottom: '18%' },  // RCB
        { left: '85%', bottom: '18%' },  // RB
        { left: '35%', bottom: '35%' },  // LCM
        { left: '65%', bottom: '35%' },  // RCM
        { left: '10%', bottom: '60%' },  // LW
        { left: '90%', bottom: '60%' },  // RW
        { left: '35%', bottom: '75%' },  // LST
        { left: '65%', bottom: '75%' }   // RST
    ],
    '4-3-2-1': [
        { left: '50%', bottom: '5%' },   // GK
        { left: '15%', bottom: '18%' },  // LB
        { left: '38%', bottom: '18%' },  // LCB
        { left: '62%', bottom: '18%' },  // RCB
        { left: '85%', bottom: '18%' },  // RB
        { left: '30%', bottom: '35%' },  // LCM
        { left: '50%', bottom: '32%' },  // CM
        { left: '70%', bottom: '35%' },  // RCM
        { left: '35%', bottom: '55%' },  // LAM
        { left: '65%', bottom: '55%' },  // RAM
        { left: '50%', bottom: '75%' }   // ST
    ],
    '3-4-3': [
        { left: '50%', bottom: '5%' },   // GK
        { left: '25%', bottom: '18%' },  // LCB
        { left: '50%', bottom: '16%' },  // CB
        { left: '75%', bottom: '18%' },  // RCB
        { left: '10%', bottom: '45%' },  // LM
        { left: '35%', bottom: '40%' },  // LCM
        { left: '65%', bottom: '40%' },  // RCM
        { left: '90%', bottom: '45%' },  // RM
        { left: '20%', bottom: '65%' },  // LW
        { left: '50%', bottom: '75%' },  // ST
        { left: '80%', bottom: '65%' }   // RW
    ]
};

const LiveFormationPitch: React.FC<LiveFormationPitchProps> = ({ team, getPlayerRating, events }) => {
    const anchors = FORMATIONS[team.formation] || FORMATIONS['4-4-2'];
    const starters = team.players.slice(0, 11);

    return (
        <div className="relative w-full h-full bg-[#162a21] rounded-lg border border-slate-800 overflow-hidden shadow-inner">
            {/* Saha Çizgileri */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white"></div>
                <div className="absolute top-1/2 left-1/2 w-20 h-20 border border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-1/4 right-1/4 h-12 border-t border-x border-white"></div>
                <div className="absolute top-0 left-1/4 right-1/4 h-12 border-b border-x border-white"></div>
            </div>

            {starters.map((p, i) => {
                const pos = anchors[i] || { left: '50%', bottom: '50%' };
                const rating = getPlayerRating(p);
                
                const goals = events.filter(e => e.type === 'GOAL' && (e.scorer === p.name || e.playerId === p.id)).length;
                const yellow = events.some(e => e.type === 'CARD_YELLOW' && e.playerId === p.id);
                const red = events.some(e => (e.type === 'CARD_RED' || e.type === 'FIGHT' || e.type === 'ARGUMENT') && e.playerId === p.id);
                const injured = p.injury && p.injury.daysRemaining > 0;
                const isMinor = injured && p.injury!.daysRemaining < 10;

                const ratingColor = rating >= 8.0 ? 'bg-green-600' : rating >= 7.0 ? 'bg-green-500' : rating >= 6.0 ? 'bg-yellow-600' : 'bg-red-600';

                return (
                    <div 
                        key={p.id}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-700 ease-out ${red ? 'opacity-40 grayscale' : ''}`}
                        style={{ left: pos.left, bottom: pos.bottom }}
                    >
                        <div className="relative">
                            <div className="absolute -left-5 top-0 flex flex-col gap-0.5">
                                {goals > 0 && Array.from({length: Math.min(goals, 3)}).map((_, idx) => (
                                    <Disc key={idx} size={10} className="text-white fill-white drop-shadow-md" />
                                ))}
                                {yellow && !red && <div className="w-1.5 h-2 bg-yellow-500 rounded-sm border border-yellow-700 shadow-sm"></div>}
                                {red && <div className="w-1.5 h-2 bg-red-600 rounded-sm border border-red-900 shadow-sm"></div>}
                            </div>

                            <div className="relative">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-slate-500 bg-slate-400 shadow-lg">
                                    <PlayerFace player={p} />
                                    {injured && (
                                        <div className={`absolute inset-0 flex items-center justify-center ${isMinor ? 'bg-orange-500/40' : 'bg-red-500/40'}`}>
                                            <AlertCircle size={16} className="text-white drop-shadow-md" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full ${ratingColor} text-[8px] font-black text-white shadow-md border border-black/20 z-20`}>
                                    {rating.toFixed(1)}
                                </div>
                            </div>

                            <div className="mt-2 flex flex-col items-center">
                                <div className="bg-black/60 px-1 rounded text-[7px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">
                                    {p.position}
                                </div>
                                <div className="text-[9px] font-bold text-white whitespace-nowrap drop-shadow-md max-w-[60px] truncate">
                                    {p.name.split(' ').pop()}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default LiveFormationPitch;
