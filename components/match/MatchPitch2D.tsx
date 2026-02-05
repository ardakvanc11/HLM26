
import React from 'react';
import { Team } from '../../types';

interface MatchPitch2DProps {
    homeTeam: Team;
    awayTeam: Team;
    ballPosition: { x: number, y: number };
    possessionTeamId: string | null;
    lastAction: string; // Prop kept for interface compatibility but ignored in render
    isSecondHalf: boolean; // New prop for side swapping
}

const MatchPitch2D: React.FC<MatchPitch2DProps> = ({ homeTeam, awayTeam, ballPosition, possessionTeamId, isSecondHalf }) => {
    
    // --- COLOR CONFLICT RESOLUTION ---
    const getBaseColorFamily = (colorClass: string) => {
        // Extract 'red' from 'bg-red-600'
        return colorClass.replace('bg-', '').split('-')[0];
    };

    const homePrimary = homeTeam.colors[0];
    const awayPrimary = awayTeam.colors[0];

    let homeVisualColor = homePrimary;
    let awayVisualColor = awayPrimary;

    // Check if color families match (e.g. both are 'red' or 'blue')
    // Also handle dark colors grouping (slate, gray, zinc, neutral, stone, black)
    const isDark = (f: string) => ['slate', 'gray', 'zinc', 'neutral', 'stone', 'black'].includes(f);
    const homeFam = getBaseColorFamily(homePrimary);
    const awayFam = getBaseColorFamily(awayPrimary);

    if (homeFam === awayFam || (isDark(homeFam) && isDark(awayFam))) {
        // Conflict detected! Use Away Team's secondary color.
        // Secondary color is usually text color (e.g., 'text-white', 'text-yellow-400').
        // We need to convert it to a background color (e.g., 'bg-white', 'bg-yellow-400').
        const secColor = awayTeam.colors[1];
        awayVisualColor = secColor.replace('text-', 'bg-');
        
        // Edge case adjustment: If secondary was white/black, ensure contrast if needed
        // But usually secondary provides good contrast by definition.
    }

    // Helper to ensure text visibility on light backgrounds
    const getTextColor = (bgClass: string) => {
        if (
            bgClass.includes('white') || 
            bgClass.includes('yellow') || 
            bgClass.includes('cyan') || 
            bgClass.includes('lime') || 
            bgClass.includes('amber-300') || 
            bgClass.includes('amber-400') ||
            bgClass.includes('slate-100') ||
            bgClass.includes('slate-200')
        ) {
            return 'text-black';
        }
        return 'text-white';
    };

    // VISUAL SIDE SWAPPING LOGIC
    // Simulation Logic: Home Attacks towards Y=100 (Top), Away Attacks towards Y=0 (Bottom)
    // Visual Logic: 
    // 1st Half: Home Defends Bottom (0-30), Attacks Top (70-100).
    // 2nd Half: We flip Y. Home Defends Top, Attacks Bottom.

    const displayY = isSecondHalf ? 100 - ballPosition.y : ballPosition.y;

    // Determine active zone based on Visual Y position (0-100)
    // 0-33: Bottom (Zone 1)
    // 33-66: Middle (Zone 2)
    // 66-100: Top (Zone 3)
    let activeZoneIndex = 1; // Default Midfield
    if (displayY < 35) activeZoneIndex = 0;
    else if (displayY > 65) activeZoneIndex = 2;

    const getZoneStyle = (zoneIndex: number) => {
        const isActive = activeZoneIndex === zoneIndex;
        
        // Base Grass Styles for inactive zones
        if (!isActive) {
            // Alternating grass shades for aesthetic
            return zoneIndex === 1 ? 'bg-[#1e5c42]/40' : 'bg-[#1a4a35]/40';
        }

        // Active Zone Logic
        if (possessionTeamId) {
            const isHomePossession = possessionTeamId === homeTeam.id;
            // Use the RESOLVED visual color
            const activeColor = isHomePossession ? homeVisualColor : awayVisualColor;
            
            return `${activeColor} opacity-90 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]`;
        }
        
        // Fallback if no possession data
        return 'bg-slate-500';
    };

    // Determine which team defends which side
    // 1st Half: Home defends Bottom, Away defends Top
    // 2nd Half: Away defends Bottom, Home defends Top
    const bottomTeam = isSecondHalf ? awayTeam : homeTeam;
    const topTeam = isSecondHalf ? homeTeam : awayTeam;
    
    // Resolve labels colors as well based on side
    const bottomTeamColor = isSecondHalf ? awayVisualColor : homeVisualColor;
    const topTeamColor = isSecondHalf ? homeVisualColor : awayVisualColor;

    // Helper to identify the team currently holding the ball
    const activePossessionTeam = possessionTeamId ? (possessionTeamId === homeTeam.id ? homeTeam : awayTeam) : null;
    const activePossessionColor = possessionTeamId === homeTeam.id ? homeVisualColor : awayVisualColor;

    const renderPossessionLabel = () => {
        if (!activePossessionTeam) return null;
        
        const textColor = getTextColor(activePossessionColor);

        return (
            <div className="z-20 flex flex-col items-center justify-center animate-in zoom-in duration-300 pointer-events-none">
                <div className={`bg-black/60 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full flex items-center gap-2 shadow-xl transform transition-transform`}>
                    {activePossessionTeam.logo ? (
                        <img src={activePossessionTeam.logo} className="w-5 h-5 object-contain drop-shadow-md" />
                    ) : (
                        <div className={`w-5 h-5 rounded-full ${activePossessionColor} border border-white`}></div>
                    )}
                    <span className="text-xs font-black text-white uppercase tracking-wider drop-shadow-md">
                        {activePossessionTeam.name}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full bg-[#12221b] relative flex flex-col-reverse overflow-hidden rounded-2xl">
             
             {/* TOP LABEL (Defending Team Top) */}
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="flex flex-col items-center">
                    <div className={`px-4 py-1 rounded-b-lg shadow-lg border-x border-b border-white/20 flex items-center gap-2 ${topTeamColor} ${getTextColor(topTeamColor)}`}>
                        {topTeam.logo && <img src={topTeam.logo} className="w-4 h-4 object-contain" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{topTeam.name}</span>
                    </div>
                    <div className="text-[8px] font-bold text-white/50 uppercase mt-0.5 tracking-wider bg-black/40 px-2 rounded-full">KALE</div>
                </div>
             </div>

             {/* ZONE 1 (Bottom) */}
             <div className={`flex-1 transition-all duration-700 ease-in-out border-t border-white/5 relative flex items-center justify-center ${getZoneStyle(0)}`}>
                 {activeZoneIndex === 0 && renderPossessionLabel()}
             </div>

             {/* ZONE 2 (Middle) */}
             <div className={`flex-1 transition-all duration-700 ease-in-out border-y border-white/5 relative flex items-center justify-center ${getZoneStyle(1)}`}>
                 {activeZoneIndex === 1 && renderPossessionLabel()}
             </div>

             {/* ZONE 3 (Top) */}
             <div className={`flex-1 transition-all duration-700 ease-in-out border-b border-white/5 relative flex items-center justify-center ${getZoneStyle(2)}`}>
                 {activeZoneIndex === 2 && renderPossessionLabel()}
             </div>

             {/* BOTTOM LABEL (Defending Team Bottom) */}
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="flex flex-col-reverse items-center">
                    <div className={`px-4 py-1 rounded-t-lg shadow-lg border-x border-t border-white/20 flex items-center gap-2 ${bottomTeamColor} ${getTextColor(bottomTeamColor)}`}>
                        {bottomTeam.logo && <img src={bottomTeam.logo} className="w-4 h-4 object-contain" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{bottomTeam.name}</span>
                    </div>
                    <div className="text-[8px] font-bold text-white/50 uppercase mb-0.5 tracking-wider bg-black/40 px-2 rounded-full">KALE</div>
                </div>
             </div>

             {/* Static Pitch Markings Overlay */}
             <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 w-32 h-32 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-white -translate-y-1/2"></div>
                
                {/* Penalty Areas */}
                <div className="absolute bottom-0 left-1/4 right-1/4 h-24 border-4 border-b-0 border-white"></div>
                <div className="absolute top-0 left-1/4 right-1/4 h-24 border-4 border-t-0 border-white"></div>
                
                {/* Goals */}
                <div className="absolute bottom-0 left-[45%] right-[45%] h-6 border-x-4 border-t-4 border-white bg-white/10"></div>
                <div className="absolute top-0 left-[45%] right-[45%] h-6 border-x-4 border-b-4 border-white bg-white/10"></div>
             </div>
        </div>
    );
};

export default MatchPitch2D;
