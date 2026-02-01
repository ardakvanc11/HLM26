
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Team, MatchEvent, MatchStats, Position, Player, Mentality } from '../../types';
import { simulateMatchStep, getEmptyMatchStats, getPenaltyTaker, calculatePenaltyOutcome, getSentOffPlayers } from '../../utils/matchLogic';
import MatchPitch2D from '../../components/match/MatchPitch2D'; 
import { BarChart2, List, ChevronUp, PlayCircle, Maximize2, X, Activity, Trophy, Users, Shield, Minimize2, ChevronDown, Disc } from 'lucide-react';
import { MatchScoreboard, MatchEventFeed } from '../../components/match/MatchUI';
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

// --- DETAILED STATS MODAL COMPONENT ---
const DetailedStatsModal = ({ onClose, stats, homeTeam, awayTeam, minute, homeScore, awayScore, hXG, aXG }: { onClose: () => void, stats: MatchStats, homeTeam: Team, awayTeam: Team, minute: number, homeScore: number, awayScore: number, hXG: string, aXG: string }) => {
    
    // --- DERIVED / SIMULATED STATS FOR VISUALIZATION ---
    const hClearCut = Math.floor(stats.homeShotsOnTarget * 0.25) + (homeScore > 0 ? Math.floor(homeScore * 0.8) : 0);
    const aClearCut = Math.floor(stats.awayShotsOnTarget * 0.25) + (awayScore > 0 ? Math.floor(awayScore * 0.8) : 0);

    const hHeadersBase = 10 + stats.homeCorners * 2;
    const aHeadersBase = 10 + stats.awayCorners * 2;
    const totalHeaders = hHeadersBase + aHeadersBase;
    const hHeaderPct = Math.round((hHeadersBase / totalHeaders) * 100);
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
        
        let hColor = homeTeam.colors[0];
        let aColor = awayTeam.colors[0];

        const hFamily = hColor.replace('bg-', '').split('-')[0];
        const aFamily = aColor.replace('bg-', '').split('-')[0];
        if (hFamily === aFamily) {
             let altColor = awayTeam.colors[1].replace('text-', 'bg-');
             if (altColor.includes('black') || altColor.includes('slate-900')) altColor = 'bg-slate-400';
             aColor = altColor;
        }

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
                                <div style={{ width: `${hHeaderPct}%` }} className={`h-full ${homeTeam.colors[0]}`}></div>
                                <div className="w-1 bg-black/50 h-full"></div>
                                <div className={`flex-1 h-full ${awayTeam.colors[0]}`}></div>
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
                                <div style={{ width: `50%` }} className={`h-full ${homeTeam.colors[0]}`}></div>
                                <div className="w-1 bg-black/50 h-full"></div>
                                <div className={`flex-1 h-full ${awayTeam.colors[0]}`}></div>
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
    onMatchBlockingStateChange 
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
    onMatchBlockingStateChange?: (blocked: boolean) => void
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

    const [isVarActive, setIsVarActive] = useState(false);
    const [varMessage, setVarMessage] = useState<string>('');
    const [isPenaltyActive, setIsPenaltyActive] = useState(false);
    const [penaltyMessage, setPenaltyMessage] = useState<string>('');
    const [penaltyTeamId, setPenaltyTeamId] = useState<string | null>(null);
    const [managerDiscipline, setManagerDiscipline] = useState<'NONE' | 'WARNED' | 'YELLOW' | 'RED'>('NONE');
    const [forcedSubstitutionPlayerId, setForcedSubstitutionPlayerId] = useState<string | null>(null);
    const [mobileTab, setMobileTab] = useState<'FEED' | 'STATS'>('FEED');

    const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
    const [possessionTeamId, setPossessionTeamId] = useState<string | null>(null);
    const [lastActionText, setLastActionText] = useState("");

    const [showBenchInBottomBar, setShowBenchInBottomBar] = useState(false);

    const [activeMenuPlayerId, setActiveMenuPlayerId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const isSabotageActive = managerTrust < 30;
    const [sabotageTriggered, setSabotageTriggered] = useState(false);

    const userIsHome = homeTeam.id === userTeamId;
    const [myTeamCurrent, setMyTeamCurrent] = useState(userIsHome ? liveHomeTeam : liveAwayTeam); 

    useEffect(() => { setMyTeamCurrent(userIsHome ? liveHomeTeam : liveAwayTeam); }, [liveHomeTeam, liveAwayTeam, userIsHome]);

    // xG Calculation Logic
    const calculateXG = (shots: number, onTarget: number, goals: number, pkCount: number) => {
        const val = (shots * 0.06) + (onTarget * 0.15) + (pkCount * 0.76) + (goals * 0.10);
        return Math.max(goals * 0.7, val).toFixed(2);
    };

    const hXG = useMemo(() => calculateXG(stats.homeShots, stats.homeShotsOnTarget, homeScore, stats.pkHome || 0), [stats.homeShots, stats.homeShotsOnTarget, homeScore, stats.pkHome]);
    const aXG = useMemo(() => calculateXG(stats.awayShots, stats.awayShotsOnTarget, awayScore, stats.pkAway || 0), [stats.awayShots, stats.awayShotsOnTarget, awayScore, stats.pkAway]);

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
    
    const isKnockout = useMemo(() => {
        if (!currentFixture) return false;
        const compId = currentFixture.competitionId;
        const week = currentFixture.week;
        if (['SUPER_CUP', 'CUP', 'PLAYOFF', 'PLAYOFF_FINAL'].includes(compId)) return true;
        if (compId === 'EUROPE' && week > 208) return true;
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

        const newPlayers = [...myTeamCurrent.players];
        const idxOut = newPlayers.findIndex(p => p.id === outPlayer.id);
        const idxIn = newPlayers.findIndex(p => p.id === inPlayer.id);

        if (idxOut !== -1 && idxIn !== -1) {
             [newPlayers[idxOut], newPlayers[idxIn]] = [newPlayers[idxIn], newPlayers[idxOut]];
             
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
        const rect = e.currentTarget.getBoundingClientRect();
        const adjustedY = showBenchInBottomBar ? rect.top - 200 : rect.top;
        setMenuPosition({ x: rect.left + (rect.width / 2), y: adjustedY });
        setActiveMenuPlayerId(p.id);
    };

    const handleTacticsUpdate = (updatedTeam: Team) => {
        setMyTeamCurrent(updatedTeam);
        if (userIsHome) setLiveHomeTeam(updatedTeam); else setLiveAwayTeam(updatedTeam);
    };

    const handleQuickMentalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

    const performAiInjurySub = (injuredPlayerId: string, isHomeTeam: boolean) => {
        const aiTeam = isHomeTeam ? liveHomeTeam : liveAwayTeam;
        const currentSubs = isHomeTeam ? homeSubsUsed : awaySubsUsed;

        if (currentSubs >= 5) return;

        const injuredPlayer = aiTeam.players.find(p => p.id === injuredPlayerId);
        if (!injuredPlayer) return;

        const bench = aiTeam.players.slice(11, 18);
        const redCardedIds = new Set(events.filter(e => e.type === 'CARD_RED').map(e => e.playerId));
        const availableBench = bench.filter(p => !p.injury && !redCardedIds.has(p.id));

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
                const updatedAiTeam = { ...aiTeam, players: newPlayers };
                
                if (isHomeTeam) {
                    setLiveHomeTeam(updatedAiTeam);
                    setHomeSubsUsed(s => s + 1);
                } else {
                    setLiveAwayTeam(updatedAiTeam);
                    setAwaySubsUsed(a => a + 1);
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
        addToStoppage(0.2);

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
                setEvents(prev => [...prev, { minute, type: 'INFO', description: "VAR ile görüşen hakem 'Devam' dedi.", teamName: myTeamCurrent.name }]);
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

    useEffect(() => {
        if(isPaused || isTacticsOpen || isHalftimeTalkOpen || phase === 'HALFTIME' || phase === 'FULL_TIME' || phase === 'PENALTIES' || isVarActive || isPenaltyActive) return;
        
        const tickRate = 800 / speed; 
        
        const visualInterval = setInterval(() => {
            setBallPosition(prev => {
                const { simHome, simAway } = getSimulateTeams(liveHomeTeam, liveAwayTeam);
                
                const hStr = simHome.strength * (1 + (stats.homePossession - 50)/100);
                const aStr = simAway.strength * (1 + (stats.awayPossession - 50)/100);
                const totalStr = hStr + aStr;
                const homeProb = hStr / totalStr;
                
                let currentTeam = possessionTeamId === homeTeam.id ? 'HOME' : 'AWAY';
                if (Math.random() < 0.2) { 
                    const roll = Math.random();
                    if (roll < homeProb) {
                        currentTeam = 'HOME';
                        setPossessionTeamId(homeTeam.id);
                    } else {
                        currentTeam = 'AWAY';
                        setPossessionTeamId(awayTeam.id);
                    }
                }

                let targetY = 50;
                let targetX = 50;
                let action = "";

                if (currentTeam === 'HOME') {
                    const progress = Math.random(); 
                    targetY = prev.y + (progress * 15); 
                    targetX = Math.max(10, Math.min(90, prev.x + (Math.random() * 20 - 10))); 
                    
                    if (targetY > 80) action = "Hücumda";
                    else if (targetY > 40) action = "Orta Saha";
                    else action = "Savunmadan Çıkıyor";
                } else {
                    const progress = Math.random(); 
                    targetY = prev.y - (progress * 15); 
                    targetX = Math.max(10, Math.min(90, prev.x + (Math.random() * 20 - 10)));

                    if (targetY < 20) action = "Hücumda";
                    else if (targetY < 60) action = "Orta Saha";
                    else action = "Savunmadan Çıkıyor";
                }

                targetY = Math.max(5, Math.min(95, targetY));
                
                setLastActionText(action);
                return { x: targetX, y: targetY };
            });
        }, tickRate);

        return () => clearInterval(visualInterval);
    }, [isPaused, isTacticsOpen, isHalftimeTalkOpen, phase, speed, isVarActive, isPenaltyActive, possessionTeamId, stats.homePossession]);

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
                        return 45;
                    } else if (phase === 'SECOND_HALF') {
                        if (isKnockout && homeScore === awayScore) {
                            setPhase('PENALTIES');
                            setEvents(prev => [...prev, { minute: 90, type: 'INFO', description: "Maç berabere bitti. Seri penaltı atışlarına geçiliyor!", teamName: '' }]);
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

                if (nextM > 60 && Math.random() < 0.05) {
                    const aiIsHome = !userIsHome;
                    const aiSubsUsed = aiIsHome ? homeSubsUsed : awaySubsUsed;
                    if (aiSubsUsed < 5) {
                        const aiTeam = aiIsHome ? liveHomeTeam : liveAwayTeam;
                        const onPitch = aiTeam.players.slice(0, 11);
                        const bench = aiTeam.players.slice(11, 18);
                        const sentOff = new Set(events.filter(e => e.type === 'CARD_RED').map(e => e.playerId));
                        const validOut = onPitch.filter(p => !sentOff.has(p.id));
                        if (validOut.length > 0 && bench.length > 0) {
                            validOut.sort((a,b) => (a.condition || 100) - (b.condition || 100));
                            const outPlayer = validOut[0]; 
                            const inPlayer = bench[Math.floor(Math.random() * bench.length)];
                            const newPlayers = [...aiTeam.players];
                            const idxOut = newPlayers.findIndex(p => p.id === outPlayer.id);
                            const idxIn = newPlayers.findIndex(p => p.id === inPlayer.id);
                            if (idxOut !== -1 && idxIn !== -1) {
                                [newPlayers[idxOut], newPlayers[idxIn]] = [newPlayers[idxIn], newPlayers[idxOut]];
                                const updatedAiTeam = { ...aiTeam, players: newPlayers };
                                if (aiIsHome) {
                                    setLiveHomeTeam(updatedAiTeam);
                                    setHomeSubsUsed(s => s + 1);
                                } else {
                                    setLiveAwayTeam(updatedAiTeam);
                                    setAwaySubsUsed(a => a + 1);
                                }
                                setEvents(prev => [...prev, {
                                    minute: nextM,
                                    type: 'SUBSTITUTION',
                                    description: `${outPlayer.name} 🔄 ${inPlayer.name}`,
                                    teamName: aiTeam.name
                                }]);
                                
                                addToStoppage(0.5);
                            }
                        }
                    }
                }

                const fatiguedHome = applyFatigueToTeam(liveHomeTeam, homeScore - awayScore);
                const fatiguedAway = applyFatigueToTeam(liveAwayTeam, awayScore - homeScore);

                setLiveHomeTeam(fatiguedHome);
                setLiveAwayTeam(fatiguedAway);
                
                const { simHome, simAway } = getSimulateTeams(fatiguedHome, fatiguedAway);
                
                const event = simulateMatchStep(nextM, simHome, simAway, {h: homeScore, a: awayScore}, events, stats);
                
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
                         return nextM;
                    }

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

                         if (userIsHome && event.teamName === homeTeam.name) {
                            setLiveHomeTeam(prev => ({
                                ...prev,
                                players: prev.players.map(p => p.id === event.playerId ? { ...p, injury: { type: 'Maç İçi', daysRemaining: 1, description: 'Maçta sakatlandı' } } : p)
                            }));
                        } else if (!userIsHome && event.teamName === awayTeam.name) {
                            setLiveAwayTeam(prev => ({
                                ...prev,
                                players: prev.players.map(p => p.id === event.playerId ? { ...p, injury: { type: 'Maç İçi', daysRemaining: 1, description: 'Maçta sakatlandı' } } : p)
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
                                    setForcedSubstitutionPlayerId(event.playerId);
                                    setIsTacticsOpen(true);
                                }
                            }
                        } else {
                            if (event.playerId) {
                                setTimeout(() => performAiInjurySub(event.playerId!, isHomeInjured), 500);
                            }
                        }
                    }
                    
                    if (event.type === 'GOAL') {
                        const isHomeGoal = event.teamName === homeTeam.name;
                        setPossessionTeamId(event.teamName === homeTeam.name ? homeTeam.id : awayTeam.id);
                        setBallPosition({ x: 50, y: isHomeGoal ? 98 : 2 }); 
                        setLastActionText("GOL!");
                        setTimeout(() => setBallPosition({ x: 50, y: 50 }), 2000);
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
                                        setLastActionText("GOL İPTAL!");
                                    } else {
                                        setEvents(prev => [...prev, { minute: nextM, description: `VAR İncelemesi Bitti: GOL GEÇERLİ! Santra yapılacak.`, type: 'INFO', teamName: event.teamName }]);
                                        setLastActionText("GOL GEÇERLİ!");
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
                        }
                        if (event.type === 'OFFSIDE') {
                            isHomeEvent ? s.homeOffsides++ : s.awayOffsides++;
                        }

                        return s;
                    });
                }
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
        
        let hColor = homeTeam.colors[0];
        let aColor = awayTeam.colors[0];

        const hFamily = hColor.replace('bg-', '').split('-')[0];
        const aFamily = aColor.replace('bg-', '').split('-')[0];

        if (hFamily === aFamily) {
            let altColor = awayTeam.colors[1].replace('text-', 'bg-');
            if (altColor.includes('black') || altColor.includes('slate-900') || altColor.includes('gray-900')) {
                altColor = 'bg-slate-300';
            }
            aColor = altColor;
        }

        return (
            <div className="mb-4">
                <div className="text-center text-xs text-slate-500 font-bold uppercase mb-1.5 leading-none">{label}</div>
                <div className="flex items-center gap-3">
                    <div className="font-bold text-slate-200 text-sm w-8 text-right font-mono leading-none">
                        {isPercent ? `%${Math.round(hVal)}` : hVal}
                    </div>
                    <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden flex">
                        <div style={{ width: `${hPct}%` }} className={`h-full ${hColor} transition-all duration-500`}></div>
                        <div className={`flex-1 h-full ${aColor} opacity-80 transition-all duration-500`}></div>
                    </div>
                    <div className="font-bold text-slate-200 text-sm w-8 text-left font-mono leading-none">
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
            <div className="h-full">
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
                 />
            )}

            <MatchOverlaysSection 
                isVarActive={isVarActive} varMessage={varMessage} isPenaltyActive={isPenaltyActive} penaltyMessage={penaltyMessage} activePenaltyTeam={activePenaltyTeam}
                isTacticsOpen={isTacticsOpen} forcedSubstitutionPlayerId={forcedSubstitutionPlayerId} myTeamCurrent={myTeamCurrent} handleTacticsUpdate={handleTacticsUpdate}
                userIsHome={userIsHome} homeSubsUsed={homeSubsUsed} awaySubsUsed={awaySubsUsed} handleUserSubstitution={handleUserSubstitution} minute={minute} onCloseTactics={() => setIsTacticsOpen(false)}
                redCardedPlayerIds={redCardedPlayerIds} isHalftimeTalkOpen={isHalftimeTalkOpen} scoreDiff={userIsHome ? (homeScore - awayScore) : (awayScore - homeScore)} handleHalftimeTalkComplete={handleHalftimeTalkComplete} setIsHalftimeTalkOpen={setIsHalftimeTalkOpen}
            />

            <MatchScoreboard homeTeam={homeTeam} awayTeam={awayTeam} homeScore={homeScore} awayScore={awayScore} minute={minute} homeRedCards={homeRedCards} awayRedCards={awayRedCards} homeSubsUsed={homeSubsUsed} awaySubsUsed={awaySubsUsed} addedTime={addedTime} />
            {(phase === 'PENALTIES' || (pkScore.home > 0 || pkScore.away > 0)) && (
                <div className="bg-black/80 text-white text-center py-2 border-b border-yellow-500 font-mono font-bold animate-in slide-in-from-top">
                    PENALTILAR: {homeTeam.name} {pkScore.home} - {pkScore.away} {awayTeam.name}
                </div>
            )}

            <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
                <div className="w-1/3 hidden lg:block bg-green-900 border-r border-slate-800 relative">
                     <MatchPitch2D homeTeam={liveHomeTeam} awayTeam={liveAwayTeam} ballPosition={ballPosition} possessionTeamId={possessionTeamId} lastAction={lastActionText} />
                </div>
                
                <div className="md:hidden flex border-b border-slate-700 bg-slate-800 shrink-0">
                    <button onClick={() => setMobileTab('FEED')} className={`flex-1 py-3 text-center font-bold text-sm flex items-center justify-center gap-2 ${mobileTab === 'FEED' ? 'text-white bg-slate-700 border-b-2 border-white' : 'text-slate-400'}`}><List size={16}/> Maç Akışı</button>
                    <button onClick={() => setMobileTab('STATS')} className={`flex-1 py-3 text-center font-bold text-sm flex items-center justify-center gap-2 ${mobileTab === 'STATS' ? 'text-white bg-slate-700 border-b-2 border-white' : 'text-slate-400'}`}><BarChart2 size={16}/> İstatistik</button>
                </div>

                <div className={`flex-1 bg-slate-900 flex flex-col relative border-r border-slate-800 w-full ${mobileTab === 'STATS' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="bg-slate-800 p-2 text-center text-xs text-slate-500 font-bold uppercase tracking-widest border-b border-slate-700">Maç Merkezi</div>
                    {phase === 'PENALTIES' && (
                        <div className="absolute top-10 left-0 right-0 z-10 flex justify-center pointer-events-none">
                            <div className="bg-yellow-500 text-black px-6 py-2 rounded-full font-black text-xl animate-pulse shadow-lg border-2 border-white">
                                {currentPkTeam === 'HOME' ? homeTeam.name : awayTeam.name} Atıyor...
                            </div>
                        </div>
                    )}
                    <MatchEventFeed events={events} allTeams={allTeams} homeTeam={homeTeam} awayTeam={awayTeam} scrollRef={scrollRef} />
                </div>

                <div className={`w-full md:w-1/4 flex-col bg-slate-800 border-l border-slate-700 ${mobileTab === 'STATS' ? 'flex' : 'hidden md:flex'}`}>
                    
                    <div className={`flex flex-col transition-all duration-300 overflow-hidden ${matchScreenExpanded ? 'h-0 opacity-0' : 'flex-1 opacity-100'}`}>
                        <div className="p-3 bg-slate-900 text-xs font-bold text-slate-400 uppercase border-b border-slate-700 flex justify-between items-center px-4 shrink-0">
                            <span className="tracking-widest">Canlı İstatistikler</span>
                            <button 
                                onClick={() => setShowDetailedStats(true)}
                                className="text-slate-400 hover:text-white transition p-1 hover:bg-slate-700 rounded"
                                title="Detaylı İstatistikler"
                            >
                                <Maximize2 size={14}/>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-2">
                            {renderStatRow('Topla Oynama', stats.homePossession, stats.awayPossession, true)}
                            {renderStatRow('Şut', stats.homeShots, stats.awayShots)}
                            {renderStatRow('İsabetli Şut', stats.homeShotsOnTarget, stats.awayShotsOnTarget)}
                            {renderStatRow('Gol Beklentisi (xG)', parseFloat(hXG), parseFloat(aXG))}
                            {renderStatRow('Korner', stats.homeCorners, stats.awayCorners)}
                            {renderStatRow('Faul', stats.homeFouls, stats.awayFouls)}
                            {renderStatRow('Sarı Kart', stats.homeYellowCards, stats.awayYellowCards)}
                            {renderStatRow('Kırmızı Kart', stats.homeRedCards, stats.awayRedCards)}
                        </div>
                    </div>

                    <div className={`flex flex-col border-t border-slate-600 bg-slate-900 transition-all duration-300 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-10 ${matchScreenExpanded ? 'flex-1' : 'h-[50%]'}`}>
                        <div className="flex items-center justify-between p-2 bg-[#21242c] border-b border-slate-700 shrink-0">
                            <div className="pl-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Maç Ekranı</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setMatchScreenExpanded(!matchScreenExpanded)}
                                    className="flex items-center gap-1 p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                                >
                                    <span className="text-[10px] font-bold uppercase">{matchScreenExpanded ? 'KÜÇÜLT' : 'GENİŞLET'}</span>
                                    {matchScreenExpanded ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
                                </button>

                                <div className="flex gap-1 border-l border-slate-600 pl-3">
                                    <button 
                                        onClick={() => setMatchScreenTab(0)}
                                        className={`p-2 rounded hover:bg-slate-700 transition ${matchScreenTab === 0 ? 'bg-yellow-600 text-black' : 'text-slate-400'}`}
                                        title="Canlı Puan Durumu"
                                    >
                                        <Trophy size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => setMatchScreenTab(1)}
                                        className={`p-2 rounded hover:bg-slate-700 transition flex items-center gap-1 ${matchScreenTab === 1 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                                        title="Ev Sahibi İlk 11"
                                    >
                                        <Users size={16}/>
                                        <span className="text-[10px] font-bold uppercase hidden xl:inline">EV</span>
                                    </button>
                                    <button 
                                        onClick={() => setMatchScreenTab(2)}
                                        className={`p-2 rounded hover:bg-slate-700 transition flex items-center gap-1 ${matchScreenTab === 2 ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                                        title="Deplasman İlk 11"
                                    >
                                        <Users size={16}/>
                                        <span className="text-[10px] font-bold uppercase hidden xl:inline">DEP</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden bg-[#1b1e26] relative">
                             {renderMatchScreenContent()}
                        </div>
                    </div>

                </div>
            </div>

            {(phase === 'HALFTIME' || phase === 'FULL_TIME') && (
                <div className="absolute bottom-52 left-0 right-0 z-40 flex justify-center px-4 animate-in slide-in-from-bottom-10 fade-in duration-500">
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
            )}

            <MatchFooter 
                myTeamCurrent={myTeamCurrent} handleQuickMentalityChange={handleQuickMentalityChange} managerDiscipline={managerDiscipline} 
                setIsTacticsOpen={setIsTacticsOpen} isOwnGoal={isOwnGoal} handleObjection={handleObjection} 
                phase={phase} hasHalftimeTalkBeenGiven={hasHalftimeTalkBeenGiven} setIsHalftimeTalkOpen={setIsHalftimeTalkOpen} 
                speed={speed} setSpeed={setSpeed} showBenchInBottomBar={showBenchInBottomBar} setShowBenchInBottomBar={setShowBenchInBottomBar} 
                handlePlayerClick={handlePlayerClick} getPlayerRating={getPlayerRating} 
            />
        </div>
    );
};

export default MatchSimulation;
