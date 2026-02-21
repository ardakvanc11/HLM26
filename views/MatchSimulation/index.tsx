
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Team, MatchEvent, MatchStats, Position, Player, Mentality } from '../../types';
import { simulateMatchStep, getEmptyMatchStats, getPenaltyTaker, calculatePenaltyOutcome, getSentOffPlayers, getWeightedInjury } from '../../utils/matchLogic';
import MatchPitch2D from '../../components/match/MatchPitch2D'; 
import { BarChart2, List, ChevronUp, PlayCircle, Maximize2, X, Activity, Trophy, Users, Shield, Minimize2, ChevronDown, Disc, BarChart, TrendingUp } from 'lucide-react';
import { MatchScoreboard, MatchEventFeed, LiveMatchTimeline } from '../../components/match/MatchUI';
import { PENALTY_GOAL_TEXTS, PENALTY_MISS_TEXTS } from '../../data/eventTexts';
import { pick, fillTemplate } from '../../utils/helpers';
import { calculateRating, determineMVP, calculateRatingsFromEvents } from '../../utils/ratingsAndStats';
import { processMatchPostGame } from '../../utils/gameEngine';
import { GOAL_SOUND, WHISTLE_SOUND, applyFatigueToTeam, calculateShoutEffect } from './MatchSimulationUtils';
import StandingsTable from '../../components/shared/StandingsTable';

// Sub Components
import PlayerContextMenu from './PlayerContextMenu';
import MatchFooter from './MatchFooter';
import MatchOverlaysSection from './MatchOverlaysSection';
import PlayerFace from '../../components/shared/PlayerFace';
import LiveFormationPitch from '../../components/match/LiveFormationPitch';

// --- HELPER: COLOR RESOLVER ---
const resolveMatchColors = (homeTeam: Team, awayTeam: Team) => {
    let hColor = homeTeam.colors[0];
    let aColor = awayTeam.colors[0];

    const getBaseColorFamily = (colorClass: string) => {
        // bg-red-600 -> red
        if (!colorClass) return '';
        return colorClass.replace('bg-', '').split('-')[0];
    };

    const hFamily = getBaseColorFamily(hColor);
    const aFamily = getBaseColorFamily(aColor);

    // If families match (e.g. Red vs Red) or both are dark/black
    const isDark = (f: string) => ['slate', 'gray', 'zinc', 'neutral', 'stone', 'black'].includes(f);
    
    if (hFamily === aFamily || (isDark(hFamily) && isDark(aFamily))) {
         // Use Away Team's secondary color
         // Usually text-yellow-400 -> bg-yellow-400
         let altColor = awayTeam.colors[1].replace('text-', 'bg-');
         
         // Fix edge cases where text color is weird for a bar
         if (altColor.includes('slate-900') || altColor.includes('black')) {
             altColor = 'bg-slate-400';
         }
         if (altColor.includes('white')) {
             altColor = 'bg-slate-200';
         }
         
         aColor = altColor;
    }

    return { hColor, aColor };
};

// --- DETAILED STATS MODAL COMPONENT ---
const DetailedStatsModal = ({ onClose, stats, homeTeam, awayTeam, minute, homeScore, awayScore, hXG, aXG }: { onClose: () => void, stats: MatchStats, homeTeam: Team, awayTeam: Team, minute: number, homeScore: number, awayScore: number, hXG: string, aXG: string }) => {
    
    const { hColor, aColor } = resolveMatchColors(homeTeam, awayTeam);

    // --- DERIVED / SIMULATED STATS FOR VISUALIZATION ---
    const hClearCut = Math.floor(stats.homeShotsOnTarget * 0.25) + (homeScore > 0 ? Math.floor(homeScore * 0.8) : 0);
    const aClearCut = Math.floor(stats.awayShotsOnTarget * 0.25) + (awayScore > 0 ? Math.floor(awayScore * 0.8) : 0);

    const hHeadersBase = 10 + stats.homeCorners * 2;
    const aHeadersBase = 10 + stats.awayCorners * 2;
    const totalHeaders = hHeadersBase + aHeadersBase;
    const hHeaderPct = totalHeaders > 0 ? Math.round((hHeadersBase / totalHeaders) * 100) : 50;
    const aHeaderPct = 100 - hHeaderPct;
    const hHeadersWon = Math.floor(hHeadersBase * 0.6);
    const aHeadersWon = Math.floor(aHeadersBase * 0.6);

    const hTackles = Math.floor(10 + (stats.awayPossession * 0.2) - (stats.homeFouls * 0.5));
    const aTackles = Math.floor(10 + (stats.homePossession * 0.2) - (stats.awayFouls * 0.5));
    const hTacklePct = Math.min(100, 60 + Math.floor(Math.random() * 30));
    const aTacklePct = Math.min(100, 60 + Math.floor(Math.random() * 30));

    const StatRow = ({ label, hVal, aVal, isPercent = false, customH, customA }: { label: string, hVal: number, aVal: number, isPercent?: boolean, customH?: string, customA?: string }) => {
        const total = hVal + aVal;
        const hPct = total === 0 ? 50 : (hVal / total) * 100;
        
        return (
            <div className="mb-4">
                <div className="flex justify-between items-end mb-1 px-1">
                    <span className="text-xl font-black text-white font-mono">{customH || (isPercent ? `%${hVal}` : hVal)}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                    <span className="text-xl font-black text-white font-mono">{customA || (isPercent ? `%${aVal}` : aVal)}</span>
                </div>
                <div className="flex h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div style={{ width: `${hPct}%` }} className={`h-full ${hColor} transition-all duration-500`}></div>
                    <div className="w-1 bg-black/50 h-full"></div>
                    <div className={`flex-1 h-full ${aColor} transition-all duration-500`}></div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#1b1e26] w-full max-w-2xl rounded-xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                
                <div className="p-4 border-b border-slate-700 bg-[#21242c] flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <Activity className="text-yellow-500" size={24} />
                        <div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest">Maç İstatistikleri</h3>
                            <p className="text-xs text-slate-500">{homeTeam.name} vs {awayTeam.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#16181d]">
                    <div className="space-y-2">
                        <StatRow label="Şutlar" hVal={stats.homeShots} aVal={stats.awayShots} />
                        <StatRow label="İsabetli Şutlar" hVal={stats.homeShotsOnTarget} aVal={stats.awayShotsOnTarget} />
                        <StatRow label="Gol Beklentisi (xG)" hVal={parseFloat(hXG)} aVal={parseFloat(aXG)} customH={hXG} customA={aXG} />
                        <StatRow label="Net Pozisyon" hVal={hClearCut} aVal={aClearCut} />
                        <StatRow label="Kornerler" hVal={stats.homeCorners} aVal={stats.awayCorners} />
                        
                        <div className="mb-4">
                            <div className="flex justify-between items-end mb-1 px-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 font-bold">%{hHeaderPct}</span>
                                    <span className="text-xl font-black text-white font-mono">{hHeadersWon} / {hHeadersBase}</span>
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kazanılan Hava Topu</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black text-white font-mono">{aHeadersWon} / {aHeadersBase}</span>
                                    <span className="text-xs text-slate-500 font-bold">%{aHeaderPct}</span>
                                </div>
                            </div>
                            <div className="flex h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div style={{ width: `${hHeaderPct}%` }} className={`h-full ${hColor}`}></div>
                                <div className="w-1 bg-black/50 h-full"></div>
                                <div className={`flex-1 h-full ${aColor}`}></div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex justify-between items-end mb-1 px-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 font-bold">%{hTacklePct}</span>
                                    <span className="text-xl font-black text-white font-mono">{hTackles}</span>
                                </div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kazanılan Top</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black text-white font-mono">{aTackles}</span>
                                    <span className="text-xs text-slate-500 font-bold">%{aTacklePct}</span>
                                </div>
                            </div>
                            <div className="flex h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div style={{ width: `50%` }} className={`h-full ${hColor}`}></div>
                                <div className="w-1 bg-black/50 h-full"></div>
                                <div className={`flex-1 h-full ${aColor}`}></div>
                            </div>
                        </div>

                        <StatRow label="Fauller" hVal={stats.homeFouls} aVal={stats.awayFouls} />
                        <StatRow label="Sarı Kart" hVal={stats.homeYellowCards} aVal={stats.awayYellowCards} />
                        <StatRow label="Kırmızı Kart" hVal={stats.homeRedCards} aVal={stats.awayRedCards} />
                        <StatRow label="Topla Oynama" hVal={stats.homePossession} aVal={stats.awayPossession} isPercent />
                        <StatRow label="Ofsaytlar" hVal={stats.homeOffsides} aVal={stats.awayOffsides} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- XG CHART COMPONENT ---
const XGChart = ({ data, events, homeTeam, awayTeam, homeColor, awayColor }: { data: {minute: number, h: number, a: number}[], events: MatchEvent[], homeTeam: Team, awayTeam: Team, homeColor: string, awayColor: string }) => {
    // Determine max values to scale graph
    const maxVal = Math.max(
        Math.max(...data.map(d => d.h), 0.5), 
        Math.max(...data.map(d => d.a), 0.5)
    );
    const maxY = maxVal * 1.1; // Add 10% padding
    
    // Scale helper
    const getX = (min: number) => (min / (data.length > 90 ? data.length : 90)) * 100;
    const getY = (val: number) => 100 - ((val / maxY) * 100);

    // Create Step Line Path
    const createStepPath = (teamKey: 'h' | 'a') => {
        let path = `M 0,${getY(0)} `;
        for(let i = 0; i < data.length; i++) {
            const point = data[i];
            const prevPoint = i > 0 ? data[i-1] : { minute: 0, h: 0, a: 0 };
            
            // Horizontal line to current time
            path += `L ${getX(point.minute)},${getY((prevPoint as any)[teamKey])} `;
            // Vertical jump to new value
            path += `L ${getX(point.minute)},${getY((point as any)[teamKey])} `;
        }
        return path;
    };

    const homePath = createStepPath('h');
    const awayPath = createStepPath('a');

    // Get color hex values roughly for stroke (Tailwind classes can't be used directly in stroke)
    // Simplified mapping for common classes
    const getColorHex = (cls: string) => {
        if(cls.includes('red')) return '#dc2626';
        if(cls.includes('blue')) return '#2563eb';
        if(cls.includes('green')) return '#16a34a';
        if(cls.includes('yellow')) return '#ca8a04';
        if(cls.includes('purple')) return '#9333ea';
        if(cls.includes('orange')) return '#ea580c';
        if(cls.includes('cyan')) return '#0891b2';
        if(cls.includes('black')) return '#ffffff'; // White for black background
        if(cls.includes('white')) return '#000000'; // Black for white background
        return '#94a3b8'; // Default slate
    };
    
    const hStroke = getColorHex(homeColor);
    const aStroke = getColorHex(awayColor);

    return (
        <div className="h-full w-full relative px-2 py-2 flex flex-col min-h-0">
            <div className="absolute inset-0 top-4 bottom-8 left-8 right-2 border-l border-b border-slate-700/50">
                {/* Horizontal Grid Lines */}
                {[0.25, 0.5, 0.75, 1].map(pct => (
                    <div key={pct} className="absolute w-full h-px bg-slate-700/20" style={{ top: `${pct * 100}%` }}></div>
                ))}
            </div>

            <div className="flex-1 relative ml-6 mb-2">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible z-10 relative">
                    {/* Home Line */}
                    <path d={homePath} fill="none" stroke={hStroke} strokeWidth="2" vectorEffect="non-scaling-stroke" className="opacity-90"/>
                    
                    {/* Away Line */}
                    <path d={awayPath} fill="none" stroke={aStroke} strokeWidth="2" strokeDasharray="4 2" vectorEffect="non-scaling-stroke" className="opacity-90"/>

                    {/* Goal Markers */}
                    {events.filter(e => e.type === 'GOAL').map((g, i) => {
                        const isHome = g.teamName === homeTeam.name;
                        const dataPoint = data.find(d => d.minute >= g.minute) || data[data.length-1];
                        if(!dataPoint) return null;
                        
                        const cx = getX(g.minute);
                        const cy = getY(isHome ? dataPoint.h : dataPoint.a);
                        
                        return (
                            <g key={i}>
                                <circle cx={cx} cy={cy} r="3" fill="white" stroke="black" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                                <image href="https://i.imgur.com/OgkjFsI.png" x={cx - 2} y={cy - 2} height="4" width="4" />
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-0 ml-8">
                <span>0'</span>
                <span>45'</span>
                <span>90'</span>
            </div>
            
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-1 shrink-0">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: hStroke}}></div>
                    <span className="text-[10px] text-slate-300 font-bold">{homeTeam.name}</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full border-2 border-dashed" style={{borderColor: aStroke}}></div>
                    <span className="text-[10px] text-slate-300 font-bold">{awayTeam.name}</span>
                </div>
            </div>
        </div>
    );
};

// --- MOMENTUM CHART COMPONENT ---
const MomentumChart = ({ data, homeColor, awayColor, events, homeTeamName }: { data: number[], homeColor: string, awayColor: string, events: MatchEvent[], homeTeamName: string }) => {
    
    // Fixed Grid: 90 minutes / 5 minutes interval = 18 bars.
    // If extra time, we expand, but start with 18 fixed slots.
    const fixedSlotCount = 18; 
    
    // Fill data into slots, use null for future slots
    const slots = Array.from({ length: Math.max(fixedSlotCount, data.length) }).map((_, i) => {
        return data[i] !== undefined ? data[i] : null;
    });

    return (
        <div className="h-full w-full flex flex-col justify-center relative px-4">
            {/* Center Line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-600/50 z-0"></div>
            
            {/* Bars Container */}
            <div className="flex items-center h-32 w-full gap-1">
                {slots.map((val, i) => {
                    if (val === null) {
                        // Empty Slot (Future)
                        return (
                            <div key={i} className="flex-1 h-full flex flex-col justify-center items-center opacity-20">
                                <div className="w-full h-1 bg-slate-700 rounded-full"></div>
                            </div>
                        );
                    }

                    const isHome = val > 0;
                    const heightPct = Math.min(100, Math.abs(val)); 
                    const barColor = isHome ? homeColor : awayColor;
                    
                    // Check for GOAL in this specific time slot
                    const timeStart = i * 5;
                    const timeEnd = (i + 1) * 5;
                    
                    const goalsInSlot = events.filter(e => 
                        e.type === 'GOAL' && 
                        e.minute > timeStart && 
                        e.minute <= timeEnd
                    );

                    const hasHomeGoal = goalsInSlot.some(g => g.teamName === homeTeamName);
                    const hasAwayGoal = goalsInSlot.some(g => g.teamName !== homeTeamName);

                    return (
                        <div key={i} className="flex-1 h-full flex flex-col justify-center items-center group relative min-w-[4px]">
                            {/* Bar */}
                            <div 
                                className={`w-full rounded-sm transition-all duration-300 ${barColor} opacity-90 group-hover:opacity-100 shadow-sm relative`} 
                                style={{ 
                                    height: `${Math.max(4, heightPct)}%`, 
                                    transform: isHome ? 'translateY(-50%)' : 'translateY(50%)',
                                    marginBottom: isHome ? '-50%' : '0',
                                    marginTop: isHome ? '0' : '-50%'
                                }}
                            >
                                {/* GOAL ICON INDICATOR - REPLACED DISC WITH IMAGE */}
                                {isHome && hasHomeGoal && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                                        <img 
                                            src="https://i.imgur.com/OgkjFsI.png" 
                                            alt="Goal" 
                                            className="w-4 h-4 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"
                                        />
                                    </div>
                                )}
                                {!isHome && hasAwayGoal && (
                                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                                        <img 
                                            src="https://i.imgur.com/OgkjFsI.png" 
                                            alt="Goal" 
                                            className="w-4 h-4 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"
                                        />
                                    </div>
                                )}
                            </div>
                            
                            {/* Tooltip on Hover */}
                            <div className="hidden group-hover:block absolute bottom-full mb-2 bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 font-bold border border-slate-600 shadow-xl">
                                {(i+1) * 5}'. Dk 
                                {goalsInSlot.length > 0 && <span className="text-green-400 ml-1">(GOL)</span>}
                            </div>
                        </div>
                    )
                })}
            </div>
            
            {/* Legend / Axis Labels */}
            <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 mt-2 px-1 border-t border-slate-700/30 pt-1">
                <span>0'</span>
                <span>45'</span>
                <span>90'</span>
            </div>
        </div>
    );
};

const MatchSimulation = ({ 
    homeTeam, 
    awayTeam, 
    userTeamId, 
    onFinish, 
    allTeams, 
    fixtures, 
    managerTrust, 
    fixtureId, 
    isPaused,
    isTacticsOpen, 
    setIsTacticsOpen, 
    onPhaseChange, 
    matchActionSignal, 
    onActionSignalHandled, 
    onMatchBlockingStateChange,
    previousLegScore // Added Prop
}: { 
    homeTeam: Team, 
    awayTeam: Team, 
    userTeamId: string, 
    onFinish: (h: number, a: number, events: MatchEvent[], stats: MatchStats, fid?: string) => void, 
    allTeams: Team[], 
    fixtures: any[], 
    managerTrust: number, 
    fixtureId?: string, 
    isPaused?: boolean,
    isTacticsOpen: boolean,
    setIsTacticsOpen: (v: boolean) => void,
    onPhaseChange?: (phase: string) => void,
    matchActionSignal?: string | null,
    onActionSignalHandled?: () => void,
    onMatchBlockingStateChange?: (blocked: boolean) => void,
    previousLegScore?: { home: number, away: number } // New Prop
}) => {
    const [minute, setMinute] = useState(0);
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [events, setEvents] = useState<MatchEvent[]>([]);
    const [stats, setStats] = useState<MatchStats>(getEmptyMatchStats());
    const [speed, setSpeed] = useState(1); 
    const [phase, setPhase] = useState<'FIRST_HALF' | 'HALFTIME' | 'SECOND_HALF' | 'FULL_TIME' | 'PENALTIES'>('FIRST_HALF');
    
    const [showDetailedStats, setShowDetailedStats] = useState(false);
    
    const [matchScreenExpanded, setMatchScreenExpanded] = useState(false);
    const [matchScreenTab, setMatchScreenTab] = useState<0 | 1 | 2>(0); 
    
    const [statsViewMode, setStatsViewMode] = useState<'SUMMARY' | 'MOMENTUM' | 'XG'>('SUMMARY');
    const [momentumData, setMomentumData] = useState<number[]>([]);
    // Accumulator to track momentum over 5 minutes intervals
    const momentumAccumulator = useRef<number[]>([]);

    // XG Timeline State
    const [xgTimeline, setXgTimeline] = useState<{minute: number, h: number, a: number}[]>([{minute: 0, h: 0, a: 0}]);

    // Expanded Feed State
    const [isFeedExpanded, setIsFeedExpanded] = useState(false);

    const [isHalftimeTalkOpen, setIsHalftimeTalkOpen] = useState(false);
    const [hasHalftimeTalkBeenGiven, setHasHalftimeTalkBeenGiven] = useState(false);

    const [addedTime, setAddedTime] = useState(0);
    const stoppageAccumulator = useRef(0);

    const [pkScore, setPkScore] = useState({ home: 0, away: 0 });
    const [currentKickerIndex, setCurrentKickerIndex] = useState(0);
    const [currentPkTeam, setCurrentPkTeam] = useState<'HOME' | 'AWAY'>('HOME');
    
    const [liveHomeTeam, setLiveHomeTeam] = useState(homeTeam);
    const [liveAwayTeam, setLiveAwayTeam] = useState(awayTeam);
    const [homeSubsUsed, setHomeSubsUsed] = useState(0);
    const [awaySubsUsed, setAwaySubsUsed] = useState(0);

    // Track players who have left the pitch to prevent re-entry
    const subbedOutPlayerIds = useRef<Set<string>>(new Set());
    
    // NEW: Track players who have entered the pitch to prevent immediate sub-out
    const subbedInPlayerIds = useRef<Set<string>>(new Set());
    
    // NEW: Track time of last AI substitution to prevent spam
    const lastAiSubTime = useRef<{home: number, away: number}>({home: -10, away: -10});

    const [isVarActive, setIsVarActive] = useState(false);
    const [varMessage, setVarMessage] = useState<string>('');
    const [isPenaltyActive, setIsPenaltyActive] = useState(false);
    const [penaltyMessage, setPenaltyMessage] = useState<string>('');
    const [penaltyTeamId, setPenaltyTeamId] = useState<string | null>(null);
    const [managerDiscipline, setManagerDiscipline] = useState<'NONE' | 'WARNED' | 'YELLOW' | 'RED'>('NONE');
    const [forcedSubstitutionPlayerId, setForcedSubstitutionPlayerId] = useState<string | null>(null);
    const [mobileTab, setMobileTab] = useState<'FEED' | 'STATS'>('FEED');

    // Visuals State
    const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
    const [possessionTeamId, setPossessionTeamId] = useState<string | null>(null);
    const [lastActionText, setLastActionText] = useState("Maç Başlıyor");

    const [showBenchInBottomBar, setShowBenchInBottomBar] = useState(false);

    const [activeMenuPlayerId, setActiveMenuPlayerId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const isSabotageActive = managerTrust < 30;
    const [sabotageTriggered, setSabotageTriggered] = useState(false);
    
    const [tacticsInitialTab, setTacticsInitialTab] = useState<'XI' | 'TACTICS'>('XI');
    const [hasFailedVarObjection, setHasFailedVarObjection] = useState(false);

    const userIsHome = homeTeam.id === userTeamId;
    const [myTeamCurrent, setMyTeamCurrent] = useState(userIsHome ? liveHomeTeam : liveAwayTeam); 
    const opponentTeamCurrent = userIsHome ? liveAwayTeam : liveHomeTeam;

    const isSecondHalf = phase === 'SECOND_HALF' || phase === 'FULL_TIME' || phase === 'PENALTIES';

    const { hColor: homeChartColor, aColor: awayChartColor } = resolveMatchColors(homeTeam, awayTeam);

    useEffect(() => { setMyTeamCurrent(userIsHome ? liveHomeTeam : liveAwayTeam); }, [liveHomeTeam, liveAwayTeam, userIsHome]);

    // xG Calculation Logic (Reused for live update)
    const calculateXGValues = (s: MatchStats, hScore: number, aScore: number) => {
        const hVal = (s.homeShots * 0.06) + (s.homeShotsOnTarget * 0.15) + ((s.pkHome||0) * 0.76) + (hScore * 0.10);
        const aVal = (s.awayShots * 0.06) + (s.awayShotsOnTarget * 0.15) + ((s.pkAway||0) * 0.76) + (aScore * 0.10);
        return {
            h: parseFloat(Math.max(hScore * 0.7, hVal).toFixed(2)),
            a: parseFloat(Math.max(aScore * 0.7, aVal).toFixed(2))
        };
    };

    const hXG = useMemo(() => calculateXGValues(stats, homeScore, awayScore).h.toFixed(2), [stats, homeScore]);
    const aXG = useMemo(() => calculateXGValues(stats, homeScore, awayScore).a.toFixed(2), [stats, awayScore]);

    const isMatchOver = phase === 'FULL_TIME';

    useEffect(() => {
        const { homeRatings, awayRatings } = calculateRatingsFromEvents(
            liveHomeTeam,
            liveAwayTeam,
            [], 
            0,
            0 
        );
        
        setStats(prev => ({
            ...prev,
            homeRatings,
            awayRatings
        }));
    }, []); 

    useEffect(() => {
        if (onPhaseChange) onPhaseChange(phase);
    }, [phase, onPhaseChange]);

    useEffect(() => {
        if (onMatchBlockingStateChange) {
            onMatchBlockingStateChange(!!forcedSubstitutionPlayerId);
        }
    }, [forcedSubstitutionPlayerId, onMatchBlockingStateChange]);

    const isManagerSentOff = managerDiscipline === 'RED';

    const startSecondHalf = () => {
        setPhase('SECOND_HALF'); 
        setAddedTime(0); 
        setMinute(45);
        // Do not reset momentum data array, just the accumulator, to keep first half history
        momentumAccumulator.current = [];
    };

    const finishMatch = () => {
        const finalStats = { ...stats, pkHome: pkScore.home, pkAway: pkScore.away };
        onFinish(homeScore, awayScore, events, finalStats, fixtureId);
    };

    useEffect(() => {
        if (matchActionSignal && onActionSignalHandled) {
            if (matchActionSignal === 'START_SECOND_HALF' && phase === 'HALFTIME') {
                startSecondHalf();
                onActionSignalHandled();
            } else if (matchActionSignal === 'FINISH_MATCH' && (phase === 'FULL_TIME' || (phase === 'HALFTIME' && isManagerSentOff))) {
                finishMatch();
                onActionSignalHandled();
            }
        }
    }, [matchActionSignal, phase, isManagerSentOff]);


    const redCardedPlayerIds = useMemo(() => {
        return events
            .filter(e => ['CARD_RED', 'FIGHT', 'ARGUMENT'].includes(e.type) && e.playerId)
            .map(e => e.playerId!);
    }, [events]);

    const lastGoalRealTime = useRef<number>(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef(stats);
    useEffect(() => { statsRef.current = stats; }, [stats]);
    useEffect(() => { if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [events]);

    const homeRedCards = events.filter(e => (e.type === 'CARD_RED' || e.type === 'FIGHT' || e.type === 'ARGUMENT') && e.teamName === homeTeam.name).length;
    const awayRedCards = events.filter(e => (e.type === 'CARD_RED' || e.type === 'FIGHT' || e.type === 'ARGUMENT') && e.teamName === awayTeam.name).length;
    
    const currentFixture = fixtures.find(f => f.id === fixtureId);
    
    // --- SECOND LEG IDENTIFICATION ---
    const isSecondLeg = useMemo(() => {
        if (!currentFixture) return false;
        // Europe 2nd legs
        if (currentFixture.competitionId === 'EUROPE' && [210, 212, 214, 216].includes(currentFixture.week)) {
            return true;
        }
        // Add logic here if Cup becomes 2-legged later
        return false;
    }, [currentFixture]);

    const isKnockout = useMemo(() => {
        if (!currentFixture) return false;
        const compId = currentFixture.competitionId;
        const week = currentFixture.week;
        if (['SUPER_CUP', 'CUP', 'PLAYOFF', 'PLAYOFF_FINAL'].includes(compId)) return true;
        
        // For Europe, only knockout stages AFTER group/league phase count as potential penalties
        // BUT 2-legged ties only have penalties in 2nd leg if aggregate tied.
        // Single leg final (217) always has penalties if tied.
        if (compId === 'EUROPE') {
             if (week === 217) return true; // Final
             if ([210, 212, 214, 216].includes(week)) return true; // 2nd Legs
             return false; // 1st Legs or League Phase
        }
        
        return false;
    }, [currentFixture]);

    const playSound = (path: string) => { const audio = new Audio(path); audio.volume = 0.6; audio.play().catch(e => console.warn("Audio play failed:", e)); };

    const addToStoppage = (minutes: number) => {
        stoppageAccumulator.current += minutes;
    };

    const applyGoalMoraleEffects = (scoringTeamName: string | undefined, scorerName?: string, assistName?: string) => {
        if (!scoringTeamName) return;
        const isHomeScoring = scoringTeamName === homeTeam.name;

        const updatePlayers = (players: Player[], isScoringTeam: boolean) => {
            return players.map(p => {
                let m = p.morale;
                
                if (isScoringTeam) {
                    if (scorerName && p.name === scorerName) m += 6;
                    else if (assistName && p.name === assistName) m += 4;
                    else m += 3;
                } else {
                    m -= 5;
                }
                return { ...p, morale: Math.max(0, Math.min(100, m)) };
            });
        };

        setLiveHomeTeam(prev => ({
            ...prev,
            players: updatePlayers(prev.players, isHomeScoring)
        }));

        setLiveAwayTeam(prev => ({
            ...prev,
            players: updatePlayers(prev.players, !isHomeScoring)
        }));
    };

    const handleUserSubstitution = (inPlayer: Player, outPlayer: Player) => {
        const teamName = myTeamCurrent.name;
        const event: MatchEvent = { minute, type: 'SUBSTITUTION', description: `${outPlayer.name} 🔄 ${inPlayer.name}`, teamName: teamName };
        setEvents(prev => [...prev, event]);
        
        // --- ADD OUT PLAYER TO SUBBED LIST ---
        subbedOutPlayerIds.current.add(outPlayer.id);
        
        // --- ADD IN PLAYER TO SUBBED IN LIST (User also shouldn't sub out immediately generally) ---
        subbedInPlayerIds.current.add(inPlayer.id);

        addToStoppage(0.5);

        if (forcedSubstitutionPlayerId && outPlayer.id === forcedSubstitutionPlayerId) {
            setForcedSubstitutionPlayerId(null);
        }
        
        if (userIsHome) { setHomeSubsUsed(h => h + 1); setLiveHomeTeam(myTeamCurrent); } else { setAwaySubsUsed(a => a + 1); setLiveAwayTeam(myTeamCurrent); }
    };

    const handleContextSubstitution = (targetPlayer: Player) => {
        if (!activeMenuPlayerId) return;
        
        const activeIdx = myTeamCurrent.players.findIndex(p => p.id === activeMenuPlayerId);
        const isActiveSub = activeIdx >= 11;

        const outPlayer = isActiveSub ? targetPlayer : myTeamCurrent.players[activeIdx];
        const inPlayer = isActiveSub ? myTeamCurrent.players[activeIdx] : targetPlayer;

        if (!outPlayer || !inPlayer) return;

        // Check if `inPlayer` has already been subbed out
        if (subbedOutPlayerIds.current.has(inPlayer.id)) {
            alert("Oyundan çıkan oyuncu tekrar giremez!");
            return;
        }

        const newPlayers = [...myTeamCurrent.players];
        const idxOut = newPlayers.findIndex(p => p.id === outPlayer.id);
        const idxIn = newPlayers.findIndex(p => p.id === inPlayer.id);

        if (idxOut !== -1 && idxIn !== -1) {
             [newPlayers[idxOut], newPlayers[idxIn]] = [newPlayers[idxIn], newPlayers[idxOut]];
             
             // TRACK SUBS
             subbedOutPlayerIds.current.add(outPlayer.id);
             subbedInPlayerIds.current.add(inPlayer.id);

             const updatedTeam = { ...myTeamCurrent, players: newPlayers };
             setMyTeamCurrent(updatedTeam);
             if(userIsHome) {
                 setLiveHomeTeam(updatedTeam);
                 setHomeSubsUsed(h => h + 1);
             } else {
                 setLiveAwayTeam(updatedTeam);
                 setAwaySubsUsed(a => a + 1);
             }

             const event: MatchEvent = { minute, type: 'SUBSTITUTION', description: `${outPlayer.name} 🔄 ${inPlayer.name}`, teamName: myTeamCurrent.name };
             setEvents(prev => [...prev, event]);
             addToStoppage(0.5);
        }

        setActiveMenuPlayerId(null);
    };

    const handleContextShout = (type: string) => {
        if (!activeMenuPlayerId) return;
        
        const scoreDiff = userIsHome ? (homeScore - awayScore) : (awayScore - homeScore);
        
        const updatedPlayers = myTeamCurrent.players.map(p => {
            if (p.id === activeMenuPlayerId) {
                const moraleChange = calculateShoutEffect(p, scoreDiff, type);
                return { ...p, morale: Math.min(100, Math.max(0, p.morale + moraleChange)) };
            }
            return p;
        });

        let shoutLabel = "";
        if (type === 'PRAISE') shoutLabel = "Aferin";
        else if (type === 'ENCOURAGE') shoutLabel = "Başarabilirsin";
        else if (type === 'CALM') shoutLabel = "Sakin Ol";
        else if (type === 'DEMAND') shoutLabel = "Daha İyisini Yap";

        const targetPlayer = myTeamCurrent.players.find(p => p.id === activeMenuPlayerId);

        setEvents(prev => [...prev, { 
            minute, 
            type: 'INFO', 
            description: `📢 Kenardan ${targetPlayer?.name} isimli oyuncuya seslendiniz: "${shoutLabel}"`, 
            teamName: myTeamCurrent.name 
        }]);

        const updatedTeam = { ...myTeamCurrent, players: updatedPlayers };
        setMyTeamCurrent(updatedTeam);
        if(userIsHome) setLiveHomeTeam(updatedTeam); else setLiveAwayTeam(updatedTeam);

        setActiveMenuPlayerId(null);
    };

    const handlePlayerClick = (e: React.MouseEvent, p: Player) => {
        if (isMatchOver) return; 
        const rect = e.currentTarget.getBoundingClientRect();
        const adjustedY = showBenchInBottomBar ? rect.top - 200 : rect.top;
        setMenuPosition({ x: rect.left + (rect.width / 2), y: adjustedY });
        setActiveMenuPlayerId(p.id);
    };

    const handleTacticsUpdate = (updatedTeam: Team) => {
        setMyTeamCurrent(updatedTeam);
        if (userIsHome) setLiveHomeTeam(updatedTeam); else setLiveAwayTeam(updatedTeam);
    };

    const handleOpenTactics = (tab: 'XI' | 'TACTICS') => {
        setTacticsInitialTab(tab);
        setIsTacticsOpen(true);
    };

    const handleQuickMentalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (isMatchOver) return; 
        const newMentality = e.target.value as Mentality;
        const updatedTeam = { ...myTeamCurrent, mentality: newMentality };
        setMyTeamCurrent(updatedTeam);
        if (userIsHome) {
            setLiveHomeTeam(updatedTeam);
        } else {
            setLiveAwayTeam(updatedTeam);
        }
        setEvents(prev => [...prev, {
            minute,
            type: 'INFO',
            description: `Taktik Değişikliği: ${newMentality}`,
            teamName: myTeamCurrent.name
        }]);
    };

    const performAiSubstitutions = (isHomeTeam: boolean) => {
        const aiTeam = isHomeTeam ? liveHomeTeam : liveAwayTeam;
        const currentSubs = isHomeTeam ? homeSubsUsed : awaySubsUsed;

        if (currentSubs >= 5) return;
        
        // Cooldown Check: Wait at least 8 minutes between tactical subs for this team
        const lastTime = isHomeTeam ? lastAiSubTime.current.home : lastAiSubTime.current.away;
        if (minute - lastTime < 8) return;

        // 1. Check for GK Red Card (CRITICAL) - Bypass cooldown
        const currentGK = aiTeam.players[0];
        const isGKRed = redCardedPlayerIds.includes(currentGK.id);
        
        if (isGKRed) {
            // Find a valid GK on bench
            const bench = aiTeam.players.slice(11, 18);
            const availableGK = bench.find(p => p.position === Position.GK && !p.injury && !subbedOutPlayerIds.current.has(p.id) && !redCardedPlayerIds.includes(p.id));
            
            if (availableGK) {
                const outfielders = aiTeam.players.slice(1, 11).filter(p => !redCardedPlayerIds.includes(p.id) && !p.injury);
                outfielders.sort((a,b) => a.skill - b.skill);
                const sacrifice = outfielders[0];
                
                if (sacrifice) {
                    const newPlayers = [...aiTeam.players];
                    const idxOut = newPlayers.findIndex(p => p.id === sacrifice.id);
                    const idxIn = newPlayers.findIndex(p => p.id === availableGK.id);
                    const idxRedGK = newPlayers.findIndex(p => p.id === currentGK.id);

                    if (idxOut !== -1 && idxIn !== -1) {
                         [newPlayers[idxOut], newPlayers[idxIn]] = [newPlayers[idxIn], newPlayers[idxOut]];
                         [newPlayers[idxOut], newPlayers[idxRedGK]] = [newPlayers[idxRedGK], newPlayers[idxOut]];

                         subbedOutPlayerIds.current.add(sacrifice.id); // Add sacrifice to subbed out
                         subbedInPlayerIds.current.add(availableGK.id);
                         
                         const updatedAiTeam = { ...aiTeam, players: newPlayers };
                         if (isHomeTeam) { 
                             setLiveHomeTeam(updatedAiTeam); 
                             setHomeSubsUsed(s => s + 1); 
                             lastAiSubTime.current.home = minute;
                         } else { 
                             setLiveAwayTeam(updatedAiTeam); 
                             setAwaySubsUsed(s => s + 1); 
                             lastAiSubTime.current.away = minute;
                         }

                         setEvents(prev => [...prev, {
                             minute: minute + 1,
                             type: 'SUBSTITUTION',
                             description: `${sacrifice.name} 🔄 ${availableGK.name} (Kaleci Kırmızı Kart Değişikliği)`,
                             teamName: aiTeam.name
                         }]);
                         addToStoppage(1.0);
                         return;
                    }
                }
            }
        }

        // 2. Regular Tactical/Fatigue Subs (Minute > 55)
        if (minute > 55 && Math.random() < 0.15) { 
             const onPitch = aiTeam.players.slice(0, 11).filter(p => !redCardedPlayerIds.includes(p.id) && !subbedOutPlayerIds.current.has(p.id));
             const bench = aiTeam.players.slice(11, 18).filter(p => !p.injury && !subbedOutPlayerIds.current.has(p.id) && !redCardedPlayerIds.includes(p.id));
             
             if (bench.length === 0) return;

             const isHome = isHomeTeam;
             const myScore = isHome ? homeScore : awayScore;
             const opScore = isHome ? awayScore : homeScore;
             const isLosing = myScore < opScore;
             
             // AI Contextual Rating Getter
             const getAiPlayerRating = (player: Player) => {
                const relevantRatings = isHomeTeam ? stats.homeRatings : stats.awayRatings;
                const pStat = relevantRatings.find(r => r.playerId === player.id);
                return pStat ? pStat.rating : 6.0;
             };

             const candidates = onPitch.filter(p => {
                 // CRITICAL FIX: Prevent re-subbing a player who just entered
                 if (subbedInPlayerIds.current.has(p.id)) return false;

                 const cond = p.condition !== undefined ? p.condition : 100;
                 const rating = getAiPlayerRating(p);
                 
                 if (cond < 70) return true;
                 if (rating < 6.0) return true;
                 if (minute > 70 && cond < 80) return true;
                 if (isLosing && minute > 65 && rating < 6.6) return true;

                 return false;
             });
             
             if (candidates.length > 0) {
                 candidates.sort((a, b) => {
                     const scoreA = ((a.condition || 100) * 0.5) + (getAiPlayerRating(a) * 10);
                     const scoreB = ((b.condition || 100) * 0.5) + (getAiPlayerRating(b) * 10);
                     return scoreA - scoreB;
                 });
                 const outPlayer = candidates[0];
                 
                 let inPlayer = bench.find(p => p.position === outPlayer.position);
                 if (!inPlayer) inPlayer = bench.find(p => p.secondaryPosition === outPlayer.position);
                 if (!inPlayer) inPlayer = bench.sort((a,b) => b.skill - a.skill)[0]; 

                 if (inPlayer) {
                    const newPlayers = [...aiTeam.players];
                    const idxOut = newPlayers.findIndex(p => p.id === outPlayer.id);
                    const idxIn = newPlayers.findIndex(p => p.id === inPlayer.id);

                    if (idxOut !== -1 && idxIn !== -1) {
                        [newPlayers[idxOut], newPlayers[idxIn]] = [newPlayers[idxIn], newPlayers[idxOut]];
                        
                        subbedOutPlayerIds.current.add(outPlayer.id);
                        subbedInPlayerIds.current.add(inPlayer.id); // Track entrant

                        const updatedAiTeam = { ...aiTeam, players: newPlayers };
                         if (isHomeTeam) { 
                             setLiveHomeTeam(updatedAiTeam); 
                             setHomeSubsUsed(s => s + 1); 
                             lastAiSubTime.current.home = minute;
                         } else { 
                             setLiveAwayTeam(updatedAiTeam); 
                             setAwaySubsUsed(s => s + 1); 
                             lastAiSubTime.current.away = minute;
                         }

                         setEvents(prev => [...prev, {
                             minute: minute + 1,
                             type: 'SUBSTITUTION',
                             description: `${outPlayer.name} 🔄 ${inPlayer.name}`,
                             teamName: aiTeam.name
                         }]);
                         addToStoppage(0.5);
                    }
                 }
             }
        }
    };

    const performAiInjurySub = (injuredPlayerId: string, isHomeTeam: boolean) => {
        const aiTeam = isHomeTeam ? liveHomeTeam : liveAwayTeam;
        const currentSubs = isHomeTeam ? homeSubsUsed : awaySubsUsed;

        if (currentSubs >= 5) return;

        const injuredPlayer = aiTeam.players.find(p => p.id === injuredPlayerId);
        if (!injuredPlayer) return;

        const bench = aiTeam.players.slice(11, 18);
        const availableBench = bench.filter(p => !p.injury && !redCardedPlayerIds.includes(p.id) && !subbedOutPlayerIds.current.has(p.id));

        if (availableBench.length === 0) return;

        let substitute = availableBench.find(p => p.position === injuredPlayer.position);
        if (!substitute) substitute = availableBench.find(p => p.secondaryPosition === injuredPlayer.position);
        if (!substitute) substitute = availableBench.sort((a,b) => b.skill - a.skill)[0];

        if (substitute) {
            const newPlayers = [...aiTeam.players];
            const idxOut = newPlayers.findIndex(p => p.id === injuredPlayer.id);
            const idxIn = newPlayers.findIndex(p => p.id === substitute!.id);
            
            if (idxOut !== -1 && idxIn !== -1) {
                [newPlayers[idxOut], newPlayers[idxIn]] = [newPlayers[idxIn], newPlayers[idxOut]];
                
                subbedOutPlayerIds.current.add(injuredPlayer.id);
                subbedInPlayerIds.current.add(substitute.id); // Track entrant

                const updatedAiTeam = { ...aiTeam, players: newPlayers };
                
                if (isHomeTeam) {
                    setLiveHomeTeam(updatedAiTeam);
                    setHomeSubsUsed(s => s + 1);
                    lastAiSubTime.current.home = minute;
                } else {
                    setLiveAwayTeam(updatedAiTeam);
                    setAwaySubsUsed(a => a + 1);
                    lastAiSubTime.current.away = minute;
                }

                setEvents(prev => [...prev, {
                    minute: minute + 1,
                    type: 'SUBSTITUTION',
                    description: `${injuredPlayer.name} 🔄 ${substitute!.name} (Sakatlık)`,
                    teamName: aiTeam.name
                }]);
                
                addToStoppage(0.5);
            }
        }
    };

    const getSimulateTeams = (h: Team, a: Team) => {
        let simHome = h;
        let simAway = a;
        if (isSabotageActive) {
            const debuffFactor = 0.75;
            if (userIsHome) {
                const sabotagedPlayers = simHome.players.map(p => ({ ...p, morale: 0 }));
                simHome = { ...simHome, players: sabotagedPlayers, strength: Math.floor(simHome.strength * debuffFactor) };
            } else {
                const sabotagedPlayers = simAway.players.map(p => ({ ...p, morale: 0 }));
                simAway = { ...simAway, players: sabotagedPlayers, strength: Math.floor(simAway.strength * debuffFactor) };
            }
        }
        return { simHome, simAway };
    };

    const handleObjection = () => {
        if (isMatchOver) return; 
        addToStoppage(0.2);

        if (hasFailedVarObjection) {
            if (managerDiscipline === 'NONE' || managerDiscipline === 'WARNED') {
                 setManagerDiscipline('YELLOW');
                 setStats(s => ({ ...s, managerCards: 'YELLOW' }));
                 setEvents(prev => [...prev, {
                     minute,
                     type: 'CARD_YELLOW',
                     description: "Hakem önceki haksız VAR talebinizden dolayı itirazınızı dinlemeden SARI KART gösterdi!",
                     teamName: myTeamCurrent.name
                 }]);
                 addToStoppage(0.5);
            } else if (managerDiscipline === 'YELLOW') {
                 setManagerDiscipline('RED');
                 setStats(s => ({ ...s, managerCards: 'RED' }));
                 setIsTacticsOpen(false);
                 setEvents(prev => [...prev, {
                     minute,
                     type: 'CARD_RED',
                     description: "Hakem sabrını taşıran itirazlarınız sonucu ikinci sarıdan KIRMIZI KART gösterdi ve tribüne gönderdi!",
                     teamName: myTeamCurrent.name
                 }]);
                 addToStoppage(0.5);
            }
            return;
        }

        const timeSinceGoal = Date.now() - lastGoalRealTime.current;
        const lastEvent = events[events.length - 1];
        
        const isOpponentGoal = lastEvent && lastEvent.type === 'GOAL' && lastEvent.teamName !== myTeamCurrent.name;

        if (isOpponentGoal && timeSinceGoal <= 3000) {
             if (Math.random() < 0.20) {
                 setIsVarActive(true);
                 setVarMessage("HAKEM MONİTÖRE GİDİYOR... (GOL İNCELENİYOR)");
                 playSound(WHISTLE_SOUND);
                 
                 addToStoppage(2.0);

                 setTimeout(() => {
                    setIsVarActive(false);
                    if (lastEvent.teamName === liveHomeTeam.name) setHomeScore(s => Math.max(0, s-1));
                    else setAwayScore(s => Math.max(0, s-1));

                    setEvents(prev => {
                        const newEvents = [...prev];
                        const targetIdx = newEvents.findIndex(e => e === lastEvent);
                        if (targetIdx !== -1) {
                            newEvents[targetIdx] = {
                                ...newEvents[targetIdx],
                                type: 'OFFSIDE',
                                description: `GOL İPTAL (VAR) - ${newEvents[targetIdx].description}`
                            };
                        }
                        return [...newEvents, {
                            minute,
                            type: 'INFO',
                            description: "VAR İncelemesi Sonucu: Hakem golü iptal etti. Başarılı itiraz!",
                            teamName: myTeamCurrent.name
                        }];
                    });
                 }, 2500);
             } else {
                 setEvents(prev => [...prev, { minute, type: 'INFO', description: "Hakem yoğun itirazlara rağmen santra noktasını gösterdi.", teamName: myTeamCurrent.name }]);
             }
             return;
        }

        const roll = Math.random();

        if (roll < 0.20) {
            setIsVarActive(true);
            setVarMessage("Hakem itiraz üzerine kulaklığını dinliyor...");
            addToStoppage(1.0);
            setTimeout(() => {
                setIsVarActive(false);
                setEvents(prev => [...prev, { 
                    minute, 
                    type: 'INFO', 
                    description: "VAR İncelemesi Sonucu: Karar değişmedi. Hakem itirazın yersiz olduğunu işaret etti.", 
                    teamName: myTeamCurrent.name 
                }]);
                setHasFailedVarObjection(true); 
            }, 2000);

        } else if (roll < 0.40) {
            escalateDiscipline("Hakem ısrarlı itirazlar nedeniyle kartına başvurdu.");

        } else {
            if (managerDiscipline !== 'NONE') {
                escalateDiscipline(); 
            } else {
                setEvents(prev => [...prev, { minute, type: 'INFO', description: "Hakem itirazları geçiştirdi.", teamName: myTeamCurrent.name }]);
            }
        }
    };

    const escalateDiscipline = (reasonOverride?: string) => {
         let newStatus = managerDiscipline;
         let desc = reasonOverride || "Hakem yedek kulübesine gelerek sözlü uyarıda bulundu.";
         let type: MatchEvent['type'] = 'INFO';
         const roll = Math.random();
         
         if (managerDiscipline === 'NONE') {
             if (roll < 0.4) { newStatus = 'WARNED'; desc = "Hakem teknik direktörü sert bir dille uyardı: 'Yerine geç hocam!'"; } 
             else if (roll < 0.1) { newStatus = 'YELLOW'; desc = "Teknik direktör aşırı itirazdan dolayı SARI KART gördü."; type = 'CARD_YELLOW'; }
         } else if (managerDiscipline === 'WARNED') {
             if (roll < 0.5) { newStatus = 'YELLOW'; desc = "Hakem itirazların dozunu kaçıran teknik direktöre SARI KART gösterdi."; type = 'CARD_YELLOW'; } 
             else { desc = "Hakem son kez uyardı: 'Bir daha olursa atarım!'"; }
         } else if (managerDiscipline === 'YELLOW') {
             if (roll < 0.6) { newStatus = 'RED'; desc = "Teknik direktör ikinci sarı karttan KIRMIZI KART gördü ve tribüne gönderildi!"; type = 'CARD_RED'; } 
             else { desc = "Hakem dördüncü hakemi yanına çağırdı, teknik direktör ipten döndü."; }
         }
         
         if (newStatus !== managerDiscipline) {
             setManagerDiscipline(newStatus); 
             setEvents(prev => [...prev, { minute, description: desc, type, teamName: myTeamCurrent.name }]);
             
             addToStoppage(0.5);

             if(newStatus === 'YELLOW') setStats(s => ({ ...s, managerCards: 'YELLOW' }));
             if(newStatus === 'RED') { setStats(s => ({ ...s, managerCards: 'RED' })); setIsTacticsOpen(false); }
         }
    };

    const handleHalftimeTalkComplete = (moraleChange: number) => {
        const updatedPlayers = myTeamCurrent.players.map(p => ({
            ...p,
            morale: Math.min(100, Math.max(0, p.morale + moraleChange))
        }));
        
        const updatedTeam = { ...myTeamCurrent, players: updatedPlayers };
        setMyTeamCurrent(updatedTeam);
        if (userIsHome) setLiveHomeTeam(updatedTeam); else setLiveAwayTeam(updatedTeam);
        
        setHasHalftimeTalkBeenGiven(true);
        setEvents(prev => [...prev, {
            minute: 45,
            type: 'INFO',
            description: "Devre arası konuşması yapıldı. Takım sahaya daha motive bir şekilde çıkıyor.",
            teamName: myTeamCurrent.name
        }]);
    };

    const updateMatchVisuals = (event: MatchEvent | null) => {
        let activeTeamId = possessionTeamId;
        let actionLabel = "Orta Saha Mücadelesi";
        
        let newX = 50 + (Math.random() * 40 - 20); 
        let newY = 50 + (Math.random() * 20 - 10); 

        if (event) {
            const isHomeEvent = event.teamName === homeTeam.name;
            
            if (['GOAL', 'MISS', 'SAVE', 'CORNER', 'OFFSIDE', 'PENALTY'].includes(event.type)) {
                activeTeamId = isHomeEvent ? homeTeam.id : awayTeam.id;
                actionLabel = "Hücum Organizasyonu";

                if (isHomeEvent) {
                    newY = 90 + (Math.random() * 8); 
                } else {
                    newY = 10 - (Math.random() * 8); 
                }

                if (event.type === 'CORNER') {
                    newX = Math.random() > 0.5 ? 5 : 95; 
                    newY = isHomeEvent ? 99 : 1;
                    actionLabel = "Köşe Vuruşu";
                } else if (event.type === 'PENALTY') {
                    newX = 50;
                    newY = isHomeEvent ? 88 : 12; 
                    actionLabel = "Penaltı Vuruşu";
                } else if (event.type === 'GOAL') {
                    actionLabel = "GOOOOL!";
                    newY = isHomeEvent ? 100 : 0; 
                    newX = 50;
                } else if (event.type === 'OFFSIDE') {
                    actionLabel = "Ofsayt";
                    newY = isHomeEvent ? 85 : 15; 
                }

            } else if (['FOUL', 'CARD_YELLOW', 'CARD_RED'].includes(event.type)) {
                activeTeamId = isHomeEvent ? awayTeam.id : homeTeam.id; 
                actionLabel = "Duran Top";
                
                if (isHomeEvent) {
                    newY = 20 + (Math.random() * 30); 
                } else {
                    newY = 80 - (Math.random() * 30);
                }
            } else if (event.type === 'SUBSTITUTION' || event.type === 'INJURY') {
                 actionLabel = "Oyun Durdu";
            }

        } else {
            const hPoss = stats.homePossession;
            const bias = (hPoss - 50) / 50; 
            
            const drift = bias * 30; 
            const randomY = Math.random() * 40 - 20; 
            
            newY = 50 + drift + randomY;
            newY = Math.max(10, Math.min(90, newY)); 

            if (newY > 60) activeTeamId = homeTeam.id;
            else if (newY < 40) activeTeamId = awayTeam.id;
            else {
                 activeTeamId = Math.random() < (hPoss/100) ? homeTeam.id : awayTeam.id;
            }
            
            if (activeTeamId === homeTeam.id) {
                actionLabel = newY > 70 ? "Hücumda" : "Oyun Kuruyor";
            } else {
                actionLabel = newY < 30 ? "Hücumda" : "Oyun Kuruyor";
            }
        }
        
        setBallPosition({ x: newX, y: newY });
        setPossessionTeamId(activeTeamId);
        setLastActionText(actionLabel);
    };

    useEffect(() => {
        if(isPaused || isTacticsOpen || isHalftimeTalkOpen || phase === 'HALFTIME' || phase === 'FULL_TIME' || phase === 'PENALTIES' || isVarActive || isPenaltyActive) return;
        const interval = setInterval(() => {
            setMinute(m => {
                const nextM = m + 1;
                
                const REGULATION_END = phase === 'FIRST_HALF' ? 45 : 90;
                
                if (nextM === REGULATION_END) {
                    const extra = Math.max(stoppageAccumulator.current > 0 ? 1 : 0, Math.ceil(stoppageAccumulator.current));
                    setAddedTime(extra);
                }

                if (nextM > REGULATION_END + addedTime) {
                    if (phase === 'FIRST_HALF') { 
                        setPhase('HALFTIME'); 
                        playSound(WHISTLE_SOUND); 
                        stoppageAccumulator.current = 0;
                        setAddedTime(0);
                        // Reset momentum accum for next half
                        momentumAccumulator.current = [];
                        return 45;
                    } else if (phase === 'SECOND_HALF') {
                        // Check aggregate for knockout penalties
                        let goesToPenalties = false;
                        
                        if (isKnockout) {
                            if (isSecondLeg) {
                                if (previousLegScore) {
                                    // STRICT AGGREGATE LOGIC
                                    // Current Home Team Agg = Current Home Score + Previous Away Score
                                    const aggHome = homeScore + previousLegScore.away;
                                    
                                    // Current Away Team Agg = Current Away Score + Previous Home Score
                                    const aggAway = awayScore + previousLegScore.home;

                                    if (aggHome === aggAway) {
                                        goesToPenalties = true;
                                    }
                                } else {
                                    console.error("HATALI DURUM: Çift ayaklı maçın 2. ayağında ilk maç skoru bulunamadı. Penaltılar tetiklenmedi.");
                                    // Fallback removed as per request. Treat as normal end.
                                }
                            } else {
                                // Single Leg Logic (Finals, Single Leg Cups)
                                if (homeScore === awayScore) goesToPenalties = true;
                            }
                        }

                        if (goesToPenalties) {
                            setPhase('PENALTIES');
                            setEvents(prev => [...prev, { minute: 90, type: 'INFO', description: "Toplam skor eşitliği nedeniyle seri penaltı atışlarına geçiliyor!", teamName: '' }]);
                            playSound(WHISTLE_SOUND);
                            return 90;
                        }
                        
                        setPhase('FULL_TIME'); 
                        playSound(WHISTLE_SOUND); 
                        return 90; 
                    }
                }

                if (isSabotageActive && !sabotageTriggered && nextM === 10) {
                    setSabotageTriggered(true);
                    setEvents(prev => [...prev, { minute: nextM, type: 'INFO', description: "⚠️ DİKKAT: Oyuncular sahada isteksiz görünüyor. Menajere olan tepkileri oyuna yansıyor!", teamName: myTeamCurrent.name }]);
                }

                // AI Substitution Logic Check
                if (!userIsHome) performAiSubstitutions(true); // AI Home
                performAiSubstitutions(false); // AI Away (if user is home, this runs, if user is away, this runs for AI opp)

                const fatiguedHome = applyFatigueToTeam(liveHomeTeam, homeScore - awayScore);
                const fatiguedAway = applyFatigueToTeam(liveAwayTeam, awayScore - homeScore);

                setLiveHomeTeam(fatiguedHome);
                setLiveAwayTeam(fatiguedAway);
                
                const { simHome, simAway } = getSimulateTeams(fatiguedHome, fatiguedAway);
                
                const event = simulateMatchStep(nextM, simHome, simAway, {h: homeScore, a: awayScore}, events, stats);
                
                updateMatchVisuals(event);

                // --- MOMENTUM UPDATE (UPDATED: 5-Min Accumulation Logic) ---
                let momentaryVal = (ballPosition.y - 50) * 1.5; 
                
                if (possessionTeamId === homeTeam.id) momentaryVal += 20;
                else if (possessionTeamId === awayTeam.id) momentaryVal -= 20;

                if (event) {
                    if (event.type === 'GOAL') {
                        momentaryVal += (event.teamName === homeTeam.name ? 60 : -60);
                    } else if (event.type === 'MISS' || event.type === 'SAVE' || event.type === 'CORNER' || event.type === 'PENALTY') {
                        momentaryVal += (event.teamName === homeTeam.name ? 30 : -30);
                    } else if (event.type === 'CARD_RED') {
                        momentaryVal += (event.teamName === homeTeam.name ? -40 : 40);
                    }
                }
                
                momentumAccumulator.current.push(momentaryVal);

                if (nextM % 5 === 0) {
                     const sum = momentumAccumulator.current.reduce((a, b) => a + b, 0);
                     const avg = momentumAccumulator.current.length > 0 ? sum / momentumAccumulator.current.length : 0;
                     const finalVal = Math.max(-100, Math.min(100, avg));
                     
                     setMomentumData(prev => [...prev, finalVal]);
                     momentumAccumulator.current = []; 
                }
                
                if(event) {
                    switch(event.type) {
                        case 'GOAL': addToStoppage(0.8); break;
                        case 'INJURY': addToStoppage(1.5); break;
                        case 'CARD_RED': addToStoppage(1.0); break;
                        case 'FIGHT': addToStoppage(2.0); break;
                        case 'ARGUMENT': addToStoppage(1.0); break;
                        case 'PITCH_INVASION': addToStoppage(4.0); break;
                        case 'CARD_YELLOW': addToStoppage(0.3); break;
                        case 'SUBSTITUTION': addToStoppage(0.5); break;
                        case 'VAR': addToStoppage(2.0); break;
                        case 'PENALTY': addToStoppage(2.0); break;
                        default: break;
                    }

                    const totalInjuries = events.filter(e => e.type === 'INJURY').length;
                    
                    if (event.type === 'INJURY' && totalInjuries >= 3) {
                    } else {
                        if (event.type === 'CARD_RED') {
                            if (Math.random() < 0.10) {
                                setIsVarActive(true);
                                setVarMessage("KIRMIZI KART İNCELENİYOR...");
                                addToStoppage(2.0);

                                setTimeout(() => {
                                    setIsVarActive(false);
                                    if (Math.random() < 0.80) {
                                        const newEvent = { ...event, type: 'CARD_YELLOW' as const, description: `VAR Kararı: Kırmızı Kart İptal, SARI KART - ${event.description.replace('KIRMIZI KART!', '').trim()}` };
                                        
                                        setStats(prev => {
                                            const s = { ...prev };
                                            const isHomeEvent = event.teamName === homeTeam.name;
                                            if (isHomeEvent) s.homeYellowCards++; else s.awayYellowCards++;
                                            return s;
                                        });

                                        setEvents(prev => [...prev, newEvent]);
                                    } else {
                                        const newEvent = { ...event, description: `VAR Kararı: Karar Geçerli, KIRMIZI KART!` };
                                        
                                        setStats(prev => {
                                            const s = { ...prev };
                                            const isHomeEvent = event.teamName === homeTeam.name;
                                            if (isHomeEvent) s.homeRedCards++; else s.awayRedCards++;
                                            if (event.description.toLowerCase().includes('ikinci sarı')) {
                                                if (isHomeEvent) s.homeYellowCards++; else s.awayYellowCards++;
                                            }
                                            return s;
                                        });

                                        setEvents(prev => [...prev, newEvent]);
                                    }
                                }, 2000);
                                return nextM;
                            }
                        }

                        if (event.type === 'PENALTY') {
                            const startPenaltySequence = (alreadyCheckedVar: boolean) => {
                                setIsPenaltyActive(true);
                                setPenaltyMessage("PENALTI KARARI! Hakem beyaz noktayı gösterdi.");
                                const eventTeam = [homeTeam, awayTeam].find(t => t.name === event.teamName);
                                setPenaltyTeamId(eventTeam?.id || null);
                                
                                updateMatchVisuals(event);

                                setTimeout(() => {
                                     const sentOff = getSentOffPlayers(events);
                                     const taker = getPenaltyTaker(eventTeam || (event.teamName === homeTeam.name ? liveHomeTeam : liveAwayTeam), sentOff);
                                     const isGoal = calculatePenaltyOutcome(taker.stats.penalty);
                                     
                                     if (isGoal && !alreadyCheckedVar && Math.random() < 0.15) {
                                         setIsPenaltyActive(false);
                                         setIsVarActive(true);
                                         setVarMessage("HAKEM MONİTÖRE GİDİYOR... (PENALTI İNCELENİYOR)");
                                         addToStoppage(2.0);
                                         
                                         setTimeout(() => {
                                             setIsVarActive(false);
                                             if (Math.random() < 0.90) {
                                                 setEvents(prev => [...prev, {
                                                     minute: nextM,
                                                     type: 'OFFSIDE',
                                                     description: `VAR Kararı: Penaltı İptal Edildi (Ofsayt/Faul).`,
                                                     teamName: event.teamName
                                                 }]);
                                             } else {
                                                 commitPenaltyGoal(event.teamName, taker, nextM);
                                             }
                                             setPenaltyTeamId(null);
                                         }, 2000);
                                         
                                     } else {
                                         if (isGoal) {
                                             commitPenaltyGoal(event.teamName, taker, nextM);
                                         } else {
                                            const defendingTeam = event.teamName === homeTeam.name ? liveAwayTeam : liveHomeTeam;
                                            const keeper = defendingTeam.players.find(p => p.position === Position.GK) || defendingTeam.players[0];
                                            const conc = keeper.stats.concentration !== undefined ? keeper.stats.concentration : 10;
                                            const retakeChance = conc < 15 ? 0.20 : 0.05;

                                            if (Math.random() < retakeChance) {
                                                setIsPenaltyActive(false);
                                                setIsVarActive(true);
                                                setVarMessage("KALECİ İHLALİ KONTROLÜ...");
                                                addToStoppage(1.0);

                                                setTimeout(() => {
                                                    setIsVarActive(false);
                                                    setEvents(prev => [...prev, {
                                                        minute: nextM,
                                                        type: 'INFO',
                                                        description: `PENALTI TEKRAR! Kaleci ${keeper.name} atıştan önce çizgi ihlali yaptı (Konsantrasyon: ${conc}).`,
                                                        teamName: event.teamName
                                                    }]);
                                                    
                                                    startPenaltySequence(true); 
                                                }, 2000);
                                                return;
                                            }

                                             setPenaltyMessage("KAÇTI! Kaleci çıkardı!");
                                             const template = pick(PENALTY_MISS_TEXTS);
                                             const desc = fillTemplate(template, { player: taker.name });
                                             
                                             setEvents(prev => [...prev, {
                                                 minute: nextM,
                                                 type: 'MISS',
                                                 description: desc,
                                                 teamName: event.teamName,
                                                 playerId: taker.id
                                             }]);

                                             setStats(prev => {
                                                const s = {...prev};
                                                const isHomeEvent = event.teamName === homeTeam.name;
                                                if (isHomeEvent) { s.homeShots++; } else { s.awayShots++; }
                                                return s;
                                             });

                                             setTimeout(() => {
                                                 setIsPenaltyActive(false);
                                                 setPenaltyTeamId(null);
                                             }, 2000);
                                         }
                                     }

                                }, 3000);
                            };

                            const commitPenaltyGoal = (teamName: string | undefined, taker: Player, time: number) => {
                                 setPenaltyMessage("GOOOOL!");
                                 playSound(GOAL_SOUND);
                                 if (teamName === homeTeam.name) setHomeScore(s => s + 1);
                                 else setAwayScore(s => s + 1);
                                 
                                 const template = pick(PENALTY_GOAL_TEXTS);
                                 const desc = fillTemplate(template, { player: taker.name });
                                 
                                 setEvents(prev => [...prev, {
                                     minute: time,
                                     type: 'GOAL',
                                     description: desc,
                                     teamName: teamName,
                                     scorer: taker.name,
                                     assist: 'Penaltı'
                                 }]);

                                 setStats(prev => {
                                    const s = {...prev};
                                    const isHomeEvent = teamName === homeTeam.name;
                                    if (isHomeEvent) { s.homeShots++; s.homeShotsOnTarget++; } 
                                    else { s.awayShots++; s.awayShotsOnTarget++; }
                                    return s;
                                 });

                                 applyGoalMoraleEffects(teamName, taker.name, 'Penaltı');

                                 setTimeout(() => {
                                     setIsPenaltyActive(false);
                                     setPenaltyTeamId(null);
                                 }, 2000);
                            }

                            if (Math.random() < 0.30) {
                                setIsVarActive(true);
                                setVarMessage("VAR KONTROLÜ: PENALTI POZİSYONU...");
                                addToStoppage(2.0);
                                
                                setTimeout(() => {
                                    setIsVarActive(false);
                                    setEvents(prev => [...prev, { minute: nextM, type: 'INFO', description: "VAR Kontrolü Sonrası: PENALTI!", teamName: event.teamName }]);
                                    startPenaltySequence(true);
                                }, 2000);
                            } else {
                                startPenaltySequence(false);
                            }

                            return nextM;
                        }

                        setEvents(prev => [...prev, event]);
                        
                        if (event.type === 'FIGHT' || event.type === 'ARGUMENT') {
                             setStats(prev => {
                                const s = { ...prev };
                                const isHomeEvent = event.teamName === homeTeam.name;
                                if (isHomeEvent) s.homeRedCards++; else s.awayRedCards++;
                                return s;
                             });
                             addToStoppage(1.0);
                        }

                        if (event.type === 'INJURY') {
                            const isHomeInjured = event.teamName === homeTeam.name;
                            const isUserInjured = (userIsHome && isHomeInjured) || (!userIsHome && !isHomeInjured);

                             const injuryTypeData = getWeightedInjury();
                             // NEW LOGIC: Check for aggravation
                             const currentTeamPlayers = isHomeInjured ? liveHomeTeam.players : liveAwayTeam.players;
                             const existingPlayer = currentTeamPlayers.find(p => p.id === event.playerId);
                             const isAggravation = existingPlayer?.injury && existingPlayer.injury.daysRemaining > 0;
                             
                             let duration;
                             if (isAggravation) {
                                 duration = 45 + Math.floor(Math.random() * 45); // Heavy injury: 45-90 days
                             } else {
                                 duration = Math.floor(Math.random() * (injuryTypeData.maxDays - injuryTypeData.minDays + 1)) + injuryTypeData.minDays;
                             }

                             if (userIsHome && event.teamName === homeTeam.name) {
                                setLiveHomeTeam(prev => ({
                                    ...prev,
                                    players: prev.players.map(p => p.id === event.playerId ? { ...p, injury: { type: isAggravation ? "Nükseden Sakatlık" : injuryTypeData.type, daysRemaining: duration, description: isAggravation ? 'Zorlama sonucu durumu ağırlaştı' : 'Maçta sakatlandı', occurredAtMinute: nextM } } : p)
                                }));
                            } else if (!userIsHome && event.teamName === awayTeam.name) {
                                setLiveAwayTeam(prev => ({
                                    ...prev,
                                    players: prev.players.map(p => p.id === event.playerId ? { ...p, injury: { type: isAggravation ? "Nükseden Sakatlık" : injuryTypeData.type, daysRemaining: duration, description: isAggravation ? 'Zorlama sonucu durumu ağırlaştı' : 'Maçta sakatlandı', occurredAtMinute: nextM } } : p)
                                }));
                            }

                            if (isUserInjured) {
                                const userSubs = isHomeInjured ? homeSubsUsed : awaySubsUsed;
                                
                                if (userSubs >= 5) {
                                    setEvents(prev => [...prev, { 
                                        minute: nextM, 
                                        type: 'INFO', 
                                        description: "❌ Değişiklik hakkı dolduğu için takım sahada bir kişi eksik mücadele edecek.", 
                                        teamName: myTeamCurrent.name 
                                    }]);
                                } else {
                                    if (event.playerId) {
                                        // Force sub if heavy injury (>10 days) OR aggravation
                                        if (duration >= 10) {
                                            setForcedSubstitutionPlayerId(event.playerId);
                                            setIsTacticsOpen(true);
                                        } else {
                                            setEvents(prev => [...prev, {
                                                minute: nextM,
                                                type: 'INFO',
                                                description: `🚑 ${event.description.split(' ')[0]} hafif bir sakatlık geçirdi, saha kenarında tedavi edildi ve oyuna devam ediyor.`,
                                                teamName: myTeamCurrent.name
                                            }]);
                                        }
                                    }
                                }
                            } else {
                                if (event.playerId) {
                                    setTimeout(() => performAiInjurySub(event.playerId!, isHomeInjured), 500);
                                }
                            }
                        }
                        
                        if(event.type === 'GOAL') {
                            if (event.teamName !== myTeamCurrent.name) {
                                lastGoalRealTime.current = Date.now();
                            }

                            if(event.varOutcome) {
                                playSound(GOAL_SOUND); 
                                if(event.teamName === homeTeam.name) setHomeScore(s => s + 1); else setAwayScore(s => s + 1);
                                setTimeout(() => {
                                    setIsVarActive(true); 
                                    setVarMessage("Hakem VAR ile görüşüyor..."); 
                                    addToStoppage(2.0);
                                    playSound(WHISTLE_SOUND); 
                                    setTimeout(() => {
                                        setIsVarActive(false);
                                        if(event.varOutcome === 'NO_GOAL') {
                                            if(event.teamName === homeTeam.name) setHomeScore(s => Math.max(0, s - 1)); else setAwayScore(s => Math.max(0, s - 1));
                                            const cancelEvent: MatchEvent = { minute: nextM, description: `GOL İPTAL ❌ ${event.scorer}`, type: 'INFO', teamName: event.teamName };
                                            setEvents(prev => {
                                                const updated = [...prev]; 
                                                let foundIdx = -1;
                                                for(let i=updated.length-1; i>=0; i--) { 
                                                    if(updated[i].type === 'GOAL' && updated[i].teamName === event.teamName && updated[i].scorer === event.scorer && updated[i].minute === event.minute) { 
                                                        foundIdx = i; break; 
                                                    } 
                                                }
                                                if(foundIdx !== -1) { 
                                                    updated[foundIdx] = { ...updated[foundIdx], type: 'OFFSIDE', description: updated[foundIdx].description + ' (İPTAL)' }; 
                                                }
                                                return [...updated, cancelEvent];
                                            });
                                        } else {
                                            setEvents(prev => [...prev, { minute: nextM, description: `VAR İncelemesi Bitti: GOL GEÇERLİ! Santra yapılacak.`, type: 'INFO', teamName: event.teamName }]);
                                            applyGoalMoraleEffects(event.teamName, event.scorer, event.assist);
                                        }
                                    }, 3000);
                                }, 1500);
                            } else {
                                playSound(GOAL_SOUND); 
                                if(event.teamName === homeTeam.name) setHomeScore(s => s + 1); else setAwayScore(s => s + 1);
                                applyGoalMoraleEffects(event.teamName, event.scorer, event.assist);
                            }
                        }
                        
                        setStats(prev => {
                            const s = {...prev};
                            const isHomeEvent = event.teamName === homeTeam.name;

                            if(isHomeEvent) s.homePossession = Math.min(80, s.homePossession + 1); else s.awayPossession = Math.min(80, s.awayPossession + 1);
                            s.homePossession = Math.max(20, s.homePossession); s.awayPossession = 100 - s.homePossession;

                            if(event.type === 'GOAL' || event.type === 'MISS' || event.type === 'SAVE') { 
                                if(isHomeEvent) { 
                                    s.homeShots++; 
                                    if(event.type === 'GOAL' || event.type === 'SAVE') s.homeShotsOnTarget++; 
                                } else { 
                                    s.awayShots++; 
                                    if(event.type === 'GOAL' || event.type === 'SAVE') s.awayShotsOnTarget++; 
                                } 
                            }

                            if (event.type === 'CORNER') {
                                isHomeEvent ? s.homeCorners++ : s.awayCorners++;
                            }
                            if (event.type === 'FOUL' || event.type === 'CARD_YELLOW' || event.type === 'CARD_RED') {
                                isHomeEvent ? s.homeFouls++ : s.awayFouls++;
                            }
                            if (event.type === 'CARD_YELLOW') {
                                isHomeEvent ? s.homeYellowCards++ : s.awayYellowCards++;
                            }
                            if (event.type === 'CARD_RED') {
                                isHomeEvent ? s.homeRedCards++ : s.awayRedCards++;
                                if (event.description.toLowerCase().includes('ikinci sarı')) {
                                    isHomeEvent ? s.homeYellowCards++ : s.awayYellowCards++;
                                }
                            }
                            if (event.type === 'OFFSIDE') {
                                isHomeEvent ? s.homeOffsides++ : s.awayOffsides++;
                            }

                            return s;
                        });
                    }
                }

                let currentHomeScoreForRate = homeScore;
                let currentAwayScoreForRate = awayScore;
                
                if (event && event.type === 'GOAL') {
                     if (event.teamName === homeTeam.name) currentHomeScoreForRate++;
                     else currentAwayScoreForRate++;
                }

                const currentEventsForRate = event ? [...events, event] : events;

                const { homeRatings, awayRatings } = calculateRatingsFromEvents(
                    liveHomeTeam, 
                    liveAwayTeam, 
                    currentEventsForRate, 
                    currentHomeScoreForRate, 
                    currentAwayScoreForRate
                );

                setStats(prev => ({
                    ...prev,
                    homeRatings,
                    awayRatings
                }));

                // UPDATE XG TIMELINE
                const xgVal = calculateXGValues(stats, homeScore, awayScore);
                setXgTimeline(prev => {
                    const lastEntry = prev[prev.length - 1];
                    // Add new entry only if minute changed (simple check)
                    if (lastEntry.minute !== nextM) {
                        return [...prev, { minute: nextM, h: xgVal.h, a: xgVal.a }];
                    }
                    return prev;
                });

                return nextM;
            });
        }, 1000 / speed);
        return () => clearInterval(interval);
    }, [minute, isTacticsOpen, isHalftimeTalkOpen, phase, speed, isVarActive, isPenaltyActive, events, liveHomeTeam, liveAwayTeam, homeSubsUsed, awaySubsUsed, forcedSubstitutionPlayerId, isSabotageActive, isKnockout, homeScore, awayScore, addedTime, stats, isPaused]); 

    useEffect(() => {
        if (phase !== 'PENALTIES' || isPaused) return; 
        let timeoutId: any;
        const takePenalty = () => {
            const team = currentPkTeam === 'HOME' ? liveHomeTeam : liveAwayTeam;
            const kickerPool = team.players.slice(0, 11).sort((a,b) => b.stats.penalty - a.stats.penalty);
            const kicker = kickerPool[Math.floor((currentKickerIndex) % 11)]; 
            const successChance = 0.75 + ((kicker.stats.penalty - 10) / 40); 
            const isGoal = Math.random() < successChance;
            setBallPosition({ x: 50, y: currentPkTeam === 'HOME' ? 85 : 15 });
            setLastActionText(`${kicker.name} Penaltı`);
            setTimeout(() => {
                if (isGoal) playSound(GOAL_SOUND);
                const newScore = { ...pkScore };
                if (isGoal) { if (currentPkTeam === 'HOME') newScore.home++; else newScore.away++; }
                setPkScore(newScore);
                setEvents(prev => [...prev, { minute: 120, type: isGoal ? 'GOAL' : 'MISS', description: `Penaltı: ${kicker.name} (${team.name}) - ${isGoal ? 'GOL!' : 'KAÇIRDI!'}`, teamName: team.name }]);
                const rounds = currentPkTeam === 'AWAY' ? currentKickerIndex + 1 : currentKickerIndex;
                let isFinished = false;
                if (rounds >= 5 && currentPkTeam === 'AWAY' && newScore.home !== newScore.away) { isFinished = true; }
                if (isFinished) {
                    setPhase('FULL_TIME');
                    setStats(prev => ({ ...prev, pkHome: newScore.home, pkAway: newScore.away }));
                } else {
                    if (currentPkTeam === 'HOME') setCurrentPkTeam('AWAY');
                    else { setCurrentPkTeam('HOME'); setCurrentKickerIndex(i => i + 1); }
                }
                setBallPosition({ x: 50, y: 50 }); 
            }, 2000);
        };
        timeoutId = setTimeout(takePenalty, 5000);
        return () => clearTimeout(timeoutId);
    }, [phase, currentPkTeam, currentKickerIndex, isPaused]); 

    const isOwnGoal = events.length > 0 && events[events.length-1].type === 'GOAL' && events[events.length-1].teamName === myTeamCurrent.name;
    const activePenaltyTeam = penaltyTeamId ? allTeams.find(t => t.id === penaltyTeamId) : null;
    const currentSubsUsed = userIsHome ? homeSubsUsed : awaySubsUsed;
    const subsLeft = 5 - currentSubsUsed;

    const getPlayerRating = (player: Player) => {
        const relevantRatings = userIsHome ? stats.homeRatings : stats.awayRatings;
        const pStat = relevantRatings.find(r => r.playerId === player.id);
        return pStat ? pStat.rating : 6.0;
    };

    const renderStatRow = (label: string, hVal: number, aVal: number, isPercent: boolean = false) => {
        const total = hVal + aVal;
        const hPct = total === 0 ? 50 : (hVal / total) * 100;
        
        return (
            <div className="mb-4 last:mb-0">
                <div className="text-center text-[10px] text-slate-500 font-bold uppercase mb-1 leading-none">{label}</div>
                <div className="flex items-center gap-3">
                    <div className="font-bold text-slate-200 text-xs w-8 text-right font-mono leading-none">
                        {isPercent ? `%${Math.round(hVal)}` : hVal}
                    </div>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden flex">
                        <div style={{ width: `${hPct}%` }} className={`h-full ${homeChartColor} transition-all duration-500`}></div>
                        <div className={`flex-1 h-full ${awayChartColor} opacity-80 transition-all duration-500`}></div>
                    </div>
                    <div className="font-bold text-slate-200 text-xs w-8 text-left font-mono leading-none">
                        {isPercent ? `%${Math.round(aVal)}` : aVal}
                    </div>
                </div>
            </div>
        );
    };

    const renderMatchScreenContent = () => {
        if (matchScreenTab === 0) {
            const liveScoreData = {
                homeId: homeTeam.id,
                awayId: awayTeam.id,
                homeScore: homeScore,
                awayScore: awayScore
            };

            return (
                <div className="h-full overflow-hidden">
                    <StandingsTable 
                        teams={allTeams.filter(t => t.leagueId === homeTeam.leagueId || (!t.leagueId && homeTeam.leagueId === 'LEAGUE'))} 
                        myTeamId={userTeamId} 
                        liveScores={liveScoreData}
                        compact={true}
                    />
                </div>
            );
        }

        const targetTeam = matchScreenTab === 1 ? liveHomeTeam : liveAwayTeam;
        
        return (
            <div className="h-full p-2">
                <LiveFormationPitch 
                    team={targetTeam} 
                    getPlayerRating={getPlayerRating} 
                    events={events} 
                />
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col relative bg-[#111317]">
            
            {showDetailedStats && (
                <DetailedStatsModal 
                    onClose={() => setShowDetailedStats(false)}
                    stats={stats}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    minute={minute}
                    homeScore={homeScore}
                    awayScore={awayScore}
                    hXG={hXG}
                    aXG={aXG}
                />
            )}

            {activeMenuPlayerId && (
                 <PlayerContextMenu 
                    player={myTeamCurrent.players.find(p => p.id === activeMenuPlayerId)!}
                    isSubstitute={myTeamCurrent.players.findIndex(p => p.id === activeMenuPlayerId) >= 11}
                    substitutionCandidates={
                        myTeamCurrent.players.findIndex(p => p.id === activeMenuPlayerId) >= 11
                            ? myTeamCurrent.players.slice(0, 11)
                            : myTeamCurrent.players.slice(11, 18)
                    }
                    position={menuPosition}
                    onClose={() => setActiveMenuPlayerId(null)}
                    onSubstitute={handleContextSubstitution}
                    onShout={handleContextShout}
                    onInstruction={() => { 
                        setIsTacticsOpen(true); 
                        setActiveMenuPlayerId(null); 
                    }}
                    subsLeft={subsLeft}
                    isRedCarded={redCardedPlayerIds.includes(activeMenuPlayerId)} 
                    isManagerSentOff={isManagerSentOff} // PASS SENT OFF STATE
                 />
            )}

            <MatchOverlaysSection 
                isVarActive={isVarActive} varMessage={varMessage} isPenaltyActive={isPenaltyActive} penaltyMessage={penaltyMessage} activePenaltyTeam={activePenaltyTeam}
                isTacticsOpen={isTacticsOpen} forcedSubstitutionPlayerId={forcedSubstitutionPlayerId} myTeamCurrent={myTeamCurrent} handleTacticsUpdate={handleTacticsUpdate}
                userIsHome={userIsHome} homeSubsUsed={homeSubsUsed} awaySubsUsed={awaySubsUsed} handleUserSubstitution={handleUserSubstitution} minute={minute} onCloseTactics={() => setIsTacticsOpen(false)}
                redCardedPlayerIds={redCardedPlayerIds} isHalftimeTalkOpen={isHalftimeTalkOpen} scoreDiff={userIsHome ? (homeScore - awayScore) : (awayScore - homeScore)} handleHalftimeTalkComplete={handleHalftimeTalkComplete} setIsHalftimeTalkOpen={setIsHalftimeTalkOpen}
                tacticsInitialTab={tacticsInitialTab}
                opponent={opponentTeamCurrent} // Add this
            />

            {/* FLOATING SCOREBOARD CONTAINER */}
            <div className="absolute top-2 left-0 z-50 w-full px-4 pointer-events-none">
                <div className="rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                    <MatchScoreboard homeTeam={homeTeam} awayTeam={awayTeam} homeScore={homeScore} awayScore={awayScore} minute={minute} homeRedCards={homeRedCards} awayRedCards={awayRedCards} homeSubsUsed={homeSubsUsed} awaySubsUsed={awaySubsUsed} addedTime={addedTime} speed={speed} />
                    {(phase === 'PENALTIES' || (pkScore.home > 0 || pkScore.away > 0)) && (
                        <div className="bg-black/80 text-white text-center py-1 border-t border-yellow-500 font-mono font-bold text-xs animate-in slide-in-from-top">
                            PENALTILAR: {homeTeam.name} {pkScore.home} - {pkScore.away} {awayTeam.name}
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT AREA - GRID LAYOUT */}
            <div className="flex-1 flex overflow-hidden pt-36 pb-4 px-4 gap-4">
                
                {/* COLUMN 1: PITCH (CARD) */}
                <div className="w-1/3 hidden lg:flex flex-col bg-[#1a1d26] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative">
                     <MatchPitch2D 
                         homeTeam={liveHomeTeam} 
                         awayTeam={liveAwayTeam} 
                         ballPosition={ballPosition} 
                         possessionTeamId={possessionTeamId} 
                         lastAction={lastActionText}
                         isSecondHalf={isSecondHalf} 
                     />
                </div>
                
                {/* COLUMN 2: SPLIT CARDS CONTAINER */}
                <div className={`flex-1 flex flex-col relative h-full gap-4 ${mobileTab === 'STATS' ? 'hidden md:flex' : 'flex'}`}>

                    {/* Mobile Tabs */}
                    <div className="md:hidden flex border-b border-slate-700 bg-slate-800 shrink-0 rounded-lg overflow-hidden mb-2">
                        <button onClick={() => setMobileTab('FEED')} className={`flex-1 py-3 text-center font-bold text-sm flex items-center justify-center gap-2 ${mobileTab === 'FEED' ? 'text-white bg-slate-700 border-b-2 border-white' : 'text-slate-400'}`}><List size={16}/> Maç Akışı</button>
                        <button onClick={() => setMobileTab('STATS')} className={`flex-1 py-3 text-center font-bold text-sm flex items-center justify-center gap-2 ${mobileTab === 'STATS' ? 'text-white bg-slate-700 border-b-2 border-white' : 'text-slate-400'}`}><BarChart2 size={16}/> İstatistik</button>
                    </div>

                    {/* CARD 1: TIMELINE */}
                    <div className={`bg-[#1a1d26] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative flex flex-col transition-all duration-300 ${isFeedExpanded ? 'h-0 opacity-0 hidden' : 'h-[48%]'}`}>
                        {/* Header */}
                        <div className="bg-[#21242c] p-2 text-center text-xs text-slate-400 font-bold uppercase tracking-widest border-b border-slate-700">Maç Akışı</div>
                        <LiveMatchTimeline events={events} homeTeam={homeTeam} awayTeam={awayTeam} />
                    </div>

                    {/* CARD 2: FEED */}
                    <div className={`bg-[#1a1d26] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden relative flex flex-col transition-all duration-300 ${isFeedExpanded ? 'h-full' : 'h-[52%]'}`}>
                        {/* Header */}
                        <div className="bg-[#21242c] p-2 border-b border-slate-700 flex justify-center items-center shrink-0 relative">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Maç Spikeri</span>
                            <button 
                                onClick={() => setIsFeedExpanded(!isFeedExpanded)}
                                className="absolute right-2 text-slate-500 hover:text-white p-1 hover:bg-slate-700 rounded transition"
                            >
                                {isFeedExpanded ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
                            </button>
                        </div>

                        {phase === 'PENALTIES' && (
                            <div className="absolute top-10 left-0 right-0 z-10 flex justify-center pointer-events-none">
                                <div className="bg-yellow-500 text-black px-6 py-2 rounded-full font-black text-xl animate-pulse shadow-lg border-2 border-white">
                                    {currentPkTeam === 'HOME' ? homeTeam.name : awayTeam.name} Atıyor...
                                </div>
                            </div>
                        )}
                        <MatchEventFeed events={events} allTeams={allTeams} homeTeam={homeTeam} awayTeam={awayTeam} scrollRef={scrollRef} />
                    </div>
                </div>

                {/* COLUMN 3: STATS & INFO (STACKED CARDS) */}
                <div className={`w-full md:w-1/4 flex flex-col gap-4 ${mobileTab === 'STATS' ? 'flex' : 'hidden md:flex'}`}>
                    
                    {/* STATS CARD */}
                    <div className={`flex flex-col bg-[#1a1d26] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden transition-all duration-300 ${matchScreenExpanded ? 'h-0 opacity-0 hidden' : 'flex-1 opacity-100'}`}>
                        {/* Modified Header with Toggles */}
                        <div className="p-2 bg-[#21242c] border-b border-slate-700 flex justify-between items-center px-3 shrink-0">
                            {/* Left: Text */}
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                Maç İstatistikleri
                            </span>

                            {/* Right: Controls */}
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-slate-700/50">
                                    <button 
                                        onClick={() => setStatsViewMode('SUMMARY')}
                                        className={`p-1 rounded transition ${statsViewMode === 'SUMMARY' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                        title="Özet"
                                    >
                                        <List size={12}/>
                                    </button>
                                    <button 
                                        onClick={() => setStatsViewMode('MOMENTUM')}
                                        className={`p-1 rounded transition ${statsViewMode === 'MOMENTUM' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                        title="Momentum"
                                    >
                                        <BarChart size={12}/>
                                    </button>
                                    <button 
                                        onClick={() => setStatsViewMode('XG')}
                                        className={`p-1 rounded transition ${statsViewMode === 'XG' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                        title="xG Grafiği"
                                    >
                                        <TrendingUp size={12}/>
                                    </button>
                                </div>
                                
                                <button onClick={() => setShowDetailedStats(true)} className="text-slate-500 hover:text-white transition p-1.5 hover:bg-slate-700 rounded-md" title="Detaylı Gör">
                                    <Maximize2 size={14}/>
                                </button>
                            </div>
                        </div>
                        
                        <div className={`flex-1 relative ${statsViewMode === 'SUMMARY' ? 'overflow-y-auto custom-scrollbar p-4' : 'overflow-hidden p-2'}`}>
                            {statsViewMode === 'SUMMARY' ? (
                                <>
                                    {renderStatRow('Topla Oynama', stats.homePossession, stats.awayPossession, true)}
                                    {renderStatRow('Şut', stats.homeShots, stats.awayShots)}
                                    {renderStatRow('İsabetli Şut', stats.homeShotsOnTarget, stats.awayShotsOnTarget)}
                                    {renderStatRow('Gol Beklentisi', parseFloat(hXG), parseFloat(aXG))}
                                    {renderStatRow('Korner', stats.homeCorners, stats.awayCorners)}
                                    {renderStatRow('Faul', stats.homeFouls, stats.awayFouls)}
                                    {renderStatRow('Sarı Kart', stats.homeYellowCards, stats.awayYellowCards)}
                                    {renderStatRow('Kırmızı Kart', stats.homeRedCards, stats.awayRedCards)}
                                </>
                            ) : statsViewMode === 'MOMENTUM' ? (
                                <div className="h-full w-full flex flex-col items-center justify-center relative group/chart">
                                    <MomentumChart 
                                        data={momentumData} 
                                        homeColor={homeChartColor} 
                                        awayColor={awayChartColor} 
                                        events={events} 
                                        homeTeamName={homeTeam.name}
                                    />
                                </div>
                            ) : (
                                <div className="h-full w-full flex flex-col items-center justify-center relative group/chart">
                                    <XGChart 
                                        data={xgTimeline} 
                                        events={events}
                                        homeTeam={homeTeam} 
                                        awayTeam={awayTeam} 
                                        homeColor={homeChartColor} 
                                        awayColor={awayChartColor} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* MATCH SCREEN (LINEUPS/STANDINGS) CARD */}
                    <div className={`flex flex-col bg-[#1a1d26] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden transition-all duration-300 ${matchScreenExpanded ? 'h-full flex-1' : 'h-[52%]'}`}>
                        <div className="flex items-center justify-between p-2 bg-[#21242c] border-b border-slate-700 shrink-0">
                            <div className="pl-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bilgi Ekranı</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setMatchScreenExpanded(!matchScreenExpanded)}
                                    className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition"
                                >
                                    {matchScreenExpanded ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
                                </button>

                                <div className="flex gap-1 border-l border-slate-600 pl-2">
                                    <button 
                                        onClick={() => setMatchScreenTab(0)}
                                        className={`p-1.5 rounded hover:bg-slate-700 transition ${matchScreenTab === 0 ? 'bg-yellow-600 text-black' : 'text-slate-400'}`}
                                        title="Canlı Puan Durumu"
                                    >
                                        <Trophy size={14}/>
                                    </button>
                                    <button 
                                        onClick={() => setMatchScreenTab(1)}
                                        className={`p-1.5 rounded hover:bg-slate-700 transition flex items-center gap-1 ${matchScreenTab === 1 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                                        title="Ev Sahibi"
                                    >
                                        <Users size={14}/>
                                    </button>
                                    <button 
                                        onClick={() => setMatchScreenTab(2)}
                                        className={`p-1.5 rounded hover:bg-slate-700 transition flex items-center gap-1 ${matchScreenTab === 2 ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                                        title="Deplasman"
                                    >
                                        <Users size={14}/>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                             {renderMatchScreenContent()}
                        </div>
                    </div>

                </div>
            </div>

            {(phase === 'HALFTIME' || phase === 'FULL_TIME') && (
                <div className="absolute bottom-52 left-0 right-0 z-40 flex justify-center px-4 animate-in slide-in-from-bottom-10 fade-in duration-500 pointer-events-none">
                    <div className="pointer-events-auto">
                        {phase === 'FULL_TIME' || (phase === 'HALFTIME' && isManagerSentOff) ? (
                            <button
                                onClick={finishMatch}
                                className="bg-red-600 hover:bg-red-500 text-white text-xl md:text-2xl font-black py-4 px-12 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.6)] flex items-center gap-3 border-4 border-red-800 transition-transform hover:scale-105 active:scale-95"
                            >
                                MAÇI BİTİR <ChevronUp size={28} className="rotate-90"/>
                            </button>
                        ) : phase === 'HALFTIME' ? (
                            <button
                                onClick={startSecondHalf}
                                className="bg-green-600 hover:bg-green-500 text-white text-xl md:text-2xl font-black py-4 px-12 rounded-2xl shadow-[0_0_50px_rgba(22,163,74,0.6)] flex items-center gap-3 border-4 border-green-800 transition-transform hover:scale-105 active:scale-95"
                            >
                                <PlayCircle size={28} className="fill-white text-green-600"/> 2. YARIYI BAŞLAT
                            </button>
                        ) : null}
                    </div>
                </div>
            )}

            <MatchFooter 
                myTeamCurrent={myTeamCurrent} handleQuickMentalityChange={handleQuickMentalityChange} managerDiscipline={managerDiscipline} 
                onOpenTactics={handleOpenTactics} isOwnGoal={isOwnGoal} handleObjection={handleObjection} 
                phase={phase} hasHalftimeTalkBeenGiven={hasHalftimeTalkBeenGiven} setIsHalftimeTalkOpen={setIsHalftimeTalkOpen} 
                speed={speed} setSpeed={setSpeed} showBenchInBottomBar={showBenchInBottomBar} setShowBenchInBottomBar={setShowBenchInBottomBar} 
                handlePlayerClick={handlePlayerClick} getPlayerRating={getPlayerRating}
                isMatchOver={isMatchOver}
                redCardedPlayerIds={redCardedPlayerIds} // Pass red cards to footer
            />
        </div>
    );
};

export default MatchSimulation;
