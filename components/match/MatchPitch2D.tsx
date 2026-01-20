
import React, { useEffect, useState, useRef } from 'react';
import { Player, Position, Team } from '../../types';

interface MatchPitch2DProps {
    homeTeam: Team;
    awayTeam: Team;
    ballPosition: { x: number, y: number };
    possessionTeamId: string | null;
    lastAction: string;
}

// Formations mapped to percentages (Left 0-100, Bottom 0-100)
// Home plays Bottom -> Up. Away plays Top -> Down (Mirrored).
const FORMATIONS: Record<string, { left: number, bottom: number }[]> = {
    '4-4-2': [
        { left: 50, bottom: 5 },   // GK
        { left: 15, bottom: 20 },  // LB
        { left: 35, bottom: 20 },  // LCB
        { left: 65, bottom: 20 },  // RCB
        { left: 85, bottom: 20 },  // RB
        { left: 15, bottom: 50 },  // LM
        { left: 35, bottom: 45 },  // LCM
        { left: 65, bottom: 45 },  // RCM
        { left: 85, bottom: 50 },  // RM
        { left: 35, bottom: 75 },  // LST
        { left: 65, bottom: 75 }   // RST
    ],
    '4-3-3': [
        { left: 50, bottom: 5 },   // GK
        { left: 15, bottom: 20 },  // LB
        { left: 35, bottom: 20 },  // LCB
        { left: 65, bottom: 20 },  // RCB
        { left: 85, bottom: 20 },  // RB
        { left: 50, bottom: 35 },  // DM
        { left: 30, bottom: 55 },  // LCM
        { left: 70, bottom: 55 },  // RCM
        { left: 15, bottom: 75 },  // LW
        { left: 85, bottom: 75 },  // RW
        { left: 50, bottom: 80 }   // ST
    ],
    '4-2-3-1': [
        { left: 50, bottom: 5 },   // GK
        { left: 15, bottom: 20 },  // LB
        { left: 35, bottom: 20 },  // LCB
        { left: 65, bottom: 20 },  // RCB
        { left: 85, bottom: 20 },  // RB
        { left: 35, bottom: 35 },  // LDM
        { left: 65, bottom: 35 },  // RDM
        { left: 20, bottom: 60 },  // LAM
        { left: 50, bottom: 60 },  // CAM
        { left: 80, bottom: 60 },  // RAM
        { left: 50, bottom: 80 }   // ST
    ],
    // Fallback
    '4-1-4-1': [
        { left: 50, bottom: 5 },
        { left: 15, bottom: 20 }, { left: 35, bottom: 20 }, { left: 65, bottom: 20 }, { left: 85, bottom: 20 },
        { left: 50, bottom: 35 },
        { left: 15, bottom: 55 }, { left: 35, bottom: 55 }, { left: 65, bottom: 55 }, { left: 85, bottom: 55 },
        { left: 50, bottom: 80 }
    ]
};

// Helper to determine role based on index in array
const getRole = (index: number): 'GK' | 'DEF' | 'MID' | 'FWD' => {
    if (index === 0) return 'GK';
    if (index <= 4) return 'DEF';
    if (index <= 8) return 'MID';
    return 'FWD';
};

// Helper for Linear Interpolation
const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
};

const MatchPitch2D: React.FC<MatchPitch2DProps> = ({ homeTeam, awayTeam, ballPosition, possessionTeamId, lastAction }) => {
    
    // Positions State: Stores current X/Y for all players
    // Key: `${teamId}_${playerIndex}`
    const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({});
    
    // Refs for animation loop to avoid dependency staleness
    const requestRef = useRef<number>(0);
    const ballRef = useRef(ballPosition);
    const possessionRef = useRef(possessionTeamId);

    // Update refs when props change
    useEffect(() => { ballRef.current = ballPosition; }, [ballPosition]);
    useEffect(() => { possessionRef.current = possessionTeamId; }, [possessionTeamId]);

    // --- MAIN CALCULATION LOGIC ---
    const calculateTargetPos = (
        anchor: { left: number, bottom: number },
        ball: { x: number, y: number },
        role: 'GK' | 'DEF' | 'MID' | 'FWD',
        isHome: boolean,
        isAttacking: boolean
    ) => {
        let targetX = anchor.left;
        let targetY = anchor.bottom;

        // Coordinates normalization:
        // Home Anchor: Bottom-Up (0-100)
        // Away Anchor: Top-Down (needs mirror for calculation relative to pitch 0-100 bottom-up)
        let baseY = isHome ? anchor.bottom : (100 - anchor.bottom);
        let baseX = isHome ? anchor.left : (100 - anchor.left);

        // Vector to ball
        const dx = ball.x - baseX;
        const dy = ball.y - baseY;
        const distToBall = Math.sqrt(dx * dx + dy * dy);

        // --- BOUNDING BOX & BEHAVIOR LOGIC ---

        if (role === 'GK') {
            // GK stays in box, mirrors ball x slightly
            targetX = baseX + (dx * 0.15); 
            // GK Y: Moves up slightly if ball is far
            targetY = baseY + (ball.y > 50 ? (isHome ? 10 : -10) : 0);
            
            // Clamp to penalty area
            targetX = Math.max(35, Math.min(65, targetX));
            targetY = isHome ? Math.max(2, Math.min(15, targetY)) : Math.max(85, Math.min(98, targetY));
        } 
        else if (role === 'DEF') {
            if (isAttacking) {
                // High Line: Push up to midfield but stay behind ball
                const pushUpLimit = isHome ? 55 : 45; 
                // Move towards ball X slightly
                targetX = baseX + (dx * 0.3);
                // Push Y up but respect limit
                targetY = baseY + (isHome ? 20 : -20);
                
                // Clamp
                if (isHome) targetY = Math.min(Math.min(ball.y - 10, pushUpLimit), targetY);
                else targetY = Math.max(Math.max(ball.y + 10, pushUpLimit), targetY);

            } else {
                // Defending: Get Tight
                // Move heavily towards ball X
                targetX = baseX + (dx * 0.6);
                // Drop back towards goal relative to ball
                targetY = ball.y + (isHome ? -15 : 15);
                
                // Don't drop BEHIND anchor too much (don't sit on goalkeeper)
                if (isHome) targetY = Math.max(10, targetY);
                else targetY = Math.min(90, targetY);
            }
        } 
        else if (role === 'MID') {
            // Box-to-Box: Follow ball aggressively
            // 70% towards ball X, 60% towards ball Y
            targetX = baseX + (dx * 0.5);
            targetY = baseY + (dy * 0.5);

            // If defending, stay between ball and goal
            if (!isAttacking) {
                targetY = ball.y + (isHome ? -10 : 10);
            }
        }
        else { // FWD
            if (isAttacking) {
                // Find space: Mirror ball X to find gap, push high
                targetX = baseX + (dx * 0.4); 
                targetY = Math.max(10, Math.min(90, ball.y + (isHome ? 15 : -15)));
                
                // Offside trap logic (stay just onside? simplified)
                // Just stay high
            } else {
                // Press high or drop slightly
                targetX = baseX + (dx * 0.2);
                targetY = baseY + (dy * 0.2); // Stay relative to anchor
            }
        }
        
        return { x: targetX, y: targetY };
    };

    // --- ANIMATION LOOP ---
    const animate = () => {
        const ball = ballRef.current;
        const possessionId = possessionRef.current;

        setPositions(prev => {
            const nextPositions = { ...prev };
            
            // Function to process a team
            const processTeam = (team: Team, isHome: boolean) => {
                const anchors = FORMATIONS[team.formation || '4-4-2'] || FORMATIONS['4-4-2'];
                const isAttacking = possessionId === team.id;
                
                // Only process first 11 players
                team.players.slice(0, 11).forEach((p, idx) => {
                    const key = `${team.id}_${idx}`;
                    const anchor = anchors[idx] || { left: 50, bottom: 50 };
                    const role = getRole(idx);
                    
                    const target = calculateTargetPos(anchor, ball, role, isHome, isAttacking);
                    
                    // Current Pos
                    const current = prev[key] || { 
                        x: isHome ? anchor.left : (100 - anchor.left), 
                        y: isHome ? anchor.bottom : (100 - anchor.bottom) 
                    };
                    
                    // Interpolate
                    const speed = 0.05 + (Math.random() * 0.02); // 5-7% per frame
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
    }, []); // Run once on mount

    const renderTeam = (team: Team, isHome: boolean) => {
        return team.players.slice(0, 11).map((p, idx) => {
            const key = `${team.id}_${idx}`;
            const pos = positions[key];
            if (!pos) return null;

            // UPDATED: Hide injured players if they are still technically "on pitch"
            if (p.injury && p.injury.daysRemaining > 0) return null;

            const isGK = idx === 0;
            
            // Color Logic
            // Tailwind classes can't be interpolated easily in style without full map.
            // Using inline styles for colors for simplicity in this canvas-like logic.
            // Assuming team.colors = ['bg-red-600', 'text-white']
            const bgColorClass = isGK ? 'bg-yellow-500' : team.colors[0]; 
            // We need the actual Hex or RGB for style if class not sufficient, but className works fine for div.

            return (
                <div 
                    key={p.id}
                    className={`absolute w-3 h-3 md:w-4 md:h-4 rounded-full border border-white shadow-sm flex items-center justify-center text-[6px] md:text-[8px] font-bold text-white transition-transform duration-75 select-none ${bgColorClass} z-10`}
                    style={{ 
                        left: `${pos.x}%`, 
                        bottom: `${pos.y}%`, 
                        transform: 'translate(-50%, 50%)',
                    }}
                    title={p.name}
                >
                    {/* Optional: Number or Initial */}
                </div>
            );
        });
    };

    return (
        <div className="h-full w-full bg-[#1a4a35] relative overflow-hidden shadow-inner border-r border-slate-800">
            {/* Field Markings */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                 {/* Grass Pattern */}
                 <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_19px,#000000_20px,#000000_21px)] opacity-10"></div>
                 
                 {/* Center Circle */}
                 <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                 <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white -translate-y-1/2"></div>
                 
                 {/* Penalty Areas */}
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-24 border-2 border-b-0 border-white"></div>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-24 border-2 border-t-0 border-white"></div>
                 
                 {/* Goal Areas */}
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/4 h-8 border-2 border-b-0 border-white"></div>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-8 border-2 border-t-0 border-white"></div>
            </div>

            {/* Players */}
            {renderTeam(homeTeam, true)}
            {renderTeam(awayTeam, false)}

            {/* Ball */}
            <div 
                className="absolute w-2 h-2 md:w-3 md:h-3 bg-white rounded-full shadow-[0_0_10px_white] z-20 transition-all duration-75"
                style={{ 
                    left: `${ballPosition.x}%`, 
                    bottom: `${ballPosition.y}%`, 
                    transform: 'translate(-50%, 50%)' 
                }}
            ></div>
            
            {/* Status Overlay */}
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
