
import React, { useEffect, useState, useRef } from 'react';
import { Player, Position, Team } from '../../types';

interface MatchPitch2DProps {
    homeTeam: Team;
    awayTeam: Team;
    ballPosition: { x: number, y: number };
    possessionTeamId: string | null;
    lastAction: string;
}

// Saha koordinatları (0-100 ölçeğinde)
const FORMATIONS: Record<string, { left: number, bottom: number }[]> = {
    '4-4-2': [
        { left: 50, bottom: 5 },   // GK
        { left: 15, bottom: 20 },  // LB
        { left: 35, bottom: 20 },  // LCB
        { left: 65, bottom: 20 },  // RCB
        { left: 85, bottom: 20 },  // RB
        { left: 15, bottom: 50 },  // LM
        { left: 38, bottom: 45 },  // LCM
        { left: 62, bottom: 45 },  // RCM
        { left: 85, bottom: 50 },  // RM
        { left: 35, bottom: 78 },  // LST
        { left: 65, bottom: 78 }   // RST
    ],
    '4-3-3': [
        { left: 50, bottom: 5 },   // GK
        { left: 15, bottom: 20 },  // LB
        { left: 35, bottom: 20 },  // LCB
        { left: 65, bottom: 20 },  // RCB
        { left: 85, bottom: 20 },  // RB
        { left: 50, bottom: 40 },  // CM
        { left: 28, bottom: 50 },  // LCM
        { left: 72, bottom: 50 },  // RCM
        { left: 18, bottom: 72 },  // LW
        { left: 82, bottom: 72 },  // RW
        { left: 50, bottom: 82 }   // ST
    ],
    '4-2-3-1': [
        { left: 50, bottom: 5 },   // GK
        { left: 15, bottom: 20 },  // LB
        { left: 35, bottom: 20 },  // LCB
        { left: 65, bottom: 20 },  // RCB
        { left: 85, bottom: 20 },  // RB
        { left: 35, bottom: 38 },  // LDM
        { left: 65, bottom: 38 },  // RDM
        { left: 20, bottom: 62 },  // LAM
        { left: 50, bottom: 62 },  // CAM
        { left: 80, bottom: 62 },  // RAM
        { left: 50, bottom: 82 }   // ST
    ],
    '4-1-4-1': [
        { left: 50, bottom: 5 },   // GK
        { left: 15, bottom: 20 },  // LB
        { left: 35, bottom: 20 },  // LCB
        { left: 65, bottom: 20 },  // RCB
        { left: 85, bottom: 20 },  // RB
        { left: 50, bottom: 35 },  // DM
        { left: 15, bottom: 58 },  // LM
        { left: 35, bottom: 55 },  // LCM
        { left: 65, bottom: 55 },  // RCM
        { left: 85, bottom: 58 },  // RM
        { left: 50, bottom: 82 }   // ST
    ],
    '3-5-2': [
        { left: 50, bottom: 5 },   // GK
        { left: 25, bottom: 22 },  // LCB
        { left: 50, bottom: 20 },  // CB
        { left: 75, bottom: 22 },  // RCB
        { left: 12, bottom: 48 },  // LWB
        { left: 88, bottom: 48 },  // RWB
        { left: 35, bottom: 42 },  // LCM
        { left: 65, bottom: 42 },  // RCM
        { left: 50, bottom: 58 },  // CAM
        { left: 38, bottom: 80 },  // LST
        { left: 62, bottom: 80 }   // RST
    ],
    '5-3-2': [
        { left: 50, bottom: 5 },   // GK
        { left: 12, bottom: 28 },  // LWB
        { left: 30, bottom: 20 },  // LCB
        { left: 50, bottom: 20 },  // CB
        { left: 70, bottom: 20 },  // RCB
        { left: 88, bottom: 28 },  // RWB
        { left: 35, bottom: 45 },  // LCM
        { left: 50, bottom: 40 },  // CM
        { left: 65, bottom: 45 },  // RCM
        { left: 40, bottom: 80 },  // LST
        { left: 60, bottom: 80 }   // RST
    ]
};

const getRole = (index: number): 'GK' | 'DEF' | 'MID' | 'FWD' => {
    if (index === 0) return 'GK';
    if (index <= 4) return 'DEF';
    if (index <= 8) return 'MID';
    return 'FWD';
};

const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
};

const MatchPitch2D: React.FC<MatchPitch2DProps> = ({ homeTeam, awayTeam, ballPosition, possessionTeamId, lastAction }) => {
    const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({});
    const requestRef = useRef<number>(0);
    const ballRef = useRef(ballPosition);
    const possessionRef = useRef(possessionTeamId);

    useEffect(() => { ballRef.current = ballPosition; }, [ballPosition]);
    useEffect(() => { possessionRef.current = possessionTeamId; }, [possessionTeamId]);

    const calculateTargetPos = (
        anchor: { left: number, bottom: number },
        ball: { x: number, y: number },
        role: 'GK' | 'DEF' | 'MID' | 'FWD',
        isHome: boolean,
        isAttacking: boolean
    ) => {
        let targetX = anchor.left;
        let targetY = anchor.bottom;

        let baseY = isHome ? anchor.bottom : (100 - anchor.bottom);
        let baseX = isHome ? anchor.left : (100 - anchor.left);

        const dx = ball.x - baseX;
        const dy = ball.y - baseY;

        if (role === 'GK') {
            targetX = baseX + (dx * 0.15); 
            targetY = baseY + (ball.y > 50 ? (isHome ? 10 : -10) : 0);
            targetX = Math.max(35, Math.min(65, targetX));
            targetY = isHome ? Math.max(2, Math.min(15, targetY)) : Math.max(85, Math.min(98, targetY));
        } 
        else if (role === 'DEF') {
            if (isAttacking) {
                const pushUpLimit = isHome ? 55 : 45; 
                targetX = baseX + (dx * 0.3);
                targetY = baseY + (isHome ? 20 : -20);
                if (isHome) targetY = Math.min(Math.min(ball.y - 10, pushUpLimit), targetY);
                else targetY = Math.max(Math.max(ball.y + 10, pushUpLimit), targetY);
            } else {
                targetX = baseX + (dx * 0.6);
                targetY = ball.y + (isHome ? -15 : 15);
                if (isHome) targetY = Math.max(10, targetY);
                else targetY = Math.min(90, targetY);
            }
        } 
        else if (role === 'MID') {
            targetX = baseX + (dx * 0.5);
            targetY = baseY + (dy * 0.5);
            if (!isAttacking) targetY = ball.y + (isHome ? -10 : 10);
        }
        else {
            if (isAttacking) {
                targetX = baseX + (dx * 0.4); 
                targetY = Math.max(10, Math.min(90, ball.y + (isHome ? 15 : -15)));
            } else {
                targetX = baseX + (dx * 0.2);
                targetY = baseY + (dy * 0.2);
            }
        }
        
        return { x: targetX, y: targetY };
    };

    const animate = () => {
        const ball = ballRef.current;
        const possessionId = possessionRef.current;

        setPositions(prev => {
            const nextPositions = { ...prev };
            
            const processTeam = (team: Team, isHome: boolean) => {
                const anchors = FORMATIONS[team.formation || '4-4-2'] || FORMATIONS['4-4-2'];
                const isAttacking = possessionId === team.id;
                
                team.players.slice(0, 11).forEach((p, idx) => {
                    const key = `${team.id}_${idx}`;
                    const anchor = anchors[idx] || { left: 50, bottom: 50 };
                    const role = getRole(idx);
                    
                    const target = calculateTargetPos(anchor, ball, role, isHome, isAttacking);
                    
                    const current = prev[key] || { 
                        x: isHome ? anchor.left : (100 - anchor.left), 
                        y: isHome ? anchor.bottom : (100 - anchor.bottom) 
                    };
                    
                    const speed = 0.05 + (Math.random() * 0.02);
                    nextPositions[key] = {
                        x: lerp(current.x, target.x, speed),
                        y: lerp(current.y, target.y, speed)
                    };
                });
            };

            processTeam(homeTeam, true);
            processTeam(awayTeam, false);
            
            return nextPositions;
        });

        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    const renderTeam = (team: Team, isHome: boolean) => {
        return team.players.slice(0, 11).map((p, idx) => {
            const key = `${team.id}_${idx}`;
            const pos = positions[key];
            if (!pos) return null;
            if (p.injury && p.injury.daysRemaining > 0) return null;

            const isGK = idx === 0;
            const bgColorClass = isGK ? 'bg-yellow-500' : team.colors[0]; 

            return (
                <div 
                    key={p.id}
                    className={`absolute w-3 h-3 md:w-4 md:h-4 rounded-full border border-white shadow-sm flex items-center justify-center text-[6px] md:text-[8px] font-bold text-white transition-all duration-75 select-none ${bgColorClass} z-10`}
                    style={{ 
                        left: `${pos.x}%`, 
                        bottom: `${pos.y}%`, 
                        transform: 'translate(-50%, 50%)',
                    }}
                    title={p.name}
                >
                </div>
            );
        });
    };

    return (
        <div className="h-full w-full bg-[#1a4a35] relative overflow-hidden shadow-inner border-r border-slate-800">
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                 <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_19px,#000000_20px,#000000_21px)] opacity-10"></div>
                 <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                 <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white -translate-y-1/2"></div>
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-24 border-2 border-b-0 border-white"></div>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-24 border-2 border-t-0 border-white"></div>
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/4 h-8 border-2 border-b-0 border-white"></div>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-8 border-2 border-t-0 border-white"></div>
            </div>

            {renderTeam(homeTeam, true)}
            {renderTeam(awayTeam, false)}

            <div 
                className="absolute w-2 h-2 md:w-3 md:h-3 bg-white rounded-full shadow-[0_0_10px_white] z-20 transition-all duration-75"
                style={{ 
                    left: `${ballPosition.x}%`, 
                    bottom: `${ballPosition.y}%`, 
                    transform: 'translate(-50%, 50%)' 
                }}
            ></div>
            
            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm border border-white/10">
                {lastAction || "Oyun Devam Ediyor"}
            </div>
            {possessionTeamId && (
                <div className={`absolute bottom-2 right-2 text-[10px] px-2 py-1 rounded font-bold uppercase backdrop-blur-sm border border-white/20 ${possessionTeamId === homeTeam.id ? 'bg-blue-600/80 text-white' : 'bg-red-600/80 text-white'}`}>
                    Top: {possessionTeamId === homeTeam.id ? homeTeam.name : awayTeam.name}
                </div>
            )}
        </div>
    );
};

export default MatchPitch2D;
