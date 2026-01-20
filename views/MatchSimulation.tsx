
// Add comment above the fix: Import React hooks to resolve "Cannot find name" errors for useState, useEffect, and useRef
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Team, MatchEvent, MatchStats, Position, Player, Mentality, Tempo, PressIntensity } from '../types';
import { simulateMatchStep, getEmptyMatchStats, getPenaltyTaker, calculatePenaltyOutcome } from '../utils/gameEngine';
import MatchPitch2D from '../components/match/MatchPitch2D'; 
import { Timer, AlertOctagon, Megaphone, Settings, PlayCircle, Zap, BarChart2, List, Lock, Target, Shield, Swords, Video } from 'lucide-react';
import { MatchScoreboard, MatchOverlays, MatchEventFeed } from '../components/match/MatchUI';
import { PENALTY_GOAL_TEXTS, PENALTY_MISS_TEXTS } from '../data/eventTexts';
import { pick, fillTemplate } from '../utils/helpers';

const GOAL_SOUND = '/voices/goalsound.wav';
const WHISTLE_SOUND = '/voices/whistle.wav';

// --- FATIGUE CALCULATOR ---
const getFatigueDrop = (tempo: Tempo, press: PressIntensity): number => {
    // Base Values for Tempo
    let tVal = 0.5; // Standard
    if (tempo === Tempo.VERY_SLOW) tVal = 0.2;
    else if (tempo === Tempo.SLOW) tVal = 0.3;
    else if (tempo === Tempo.HIGH) tVal = 0.8;
    else if (tempo === Tempo.BEAST_MODE) tVal = 1.2; // Extreme drain

    // Base Values for Pressing
    let pVal = 0.5; // Standard
    if (press === PressIntensity.VERY_LOW) pVal = 0.1;
    else if (press === PressIntensity.LOW) pVal = 0.3;
    else if (press === PressIntensity.HIGH) pVal = 0.8;
    else if (press === PressIntensity.VERY_HIGH) pVal = 1.1; // Extreme drain

    // Total drain per minute (Range: ~0.3 to ~2.3)
    // REDUCED BY 50% PER USER REQUEST
    return (tVal + pVal) * 0.5;
};

const applyFatigueToTeam = (team: Team, scoreDiff: number): Team => {
    const drop = getFatigueDrop(team.tempo, team.pressIntensity || PressIntensity.STANDARD);
    
    // --- CAPTAIN INFLUENCE (HIDDEN MECHANIC) ---
    // Calculate leadership of the player wearing the armband (on pitch)
    const onPitch = team.players.slice(0, 11);
    let leadership = 10; // Default average

    if (team.setPieceTakers?.captain) {
        const cap = onPitch.find(p => p.id === team.setPieceTakers?.captain);
        if (cap) leadership = cap.stats.leadership;
        else {
             // Captain subbed out? Find next leader
             const nextLeader = onPitch.reduce((prev, current) => (prev.stats.leadership > current.stats.leadership) ? prev : current, onPitch[0]);
             if(nextLeader) leadership = nextLeader.stats.leadership;
        }
    } else {
         const autoCap = onPitch.reduce((prev, current) => (prev.stats.leadership > current.stats.leadership) ? prev : current, onPitch[0]);
         if(autoCap) leadership = autoCap.stats.leadership;
    }

    // Effect: High leadership reduces fatigue (motivation). Low leadership in losing scenarios increases it (stress).
    let captainMultiplier = 1.0;
    
    if (leadership >= 15) {
        captainMultiplier = 0.95; // 5% less fatigue (Motivated)
    } 
    
    if (scoreDiff < 0 && leadership <= 8) {
        captainMultiplier = 1.05; // 5% more fatigue (Panic/Stress)
    }

    const finalDropBase = drop * captainMultiplier;

    const updatedPlayers = team.players.map((p, index) => {
        // Apply only to players on pitch (Indices 0-10)
        // Do not apply to subs (Indices 11+)
        if (index < 11 && !p.injury && !p.suspendedUntilWeek) {
             // Using current condition or 100 as fallback
             const currentCond = p.condition !== undefined ? p.condition : 100;
             
             // Stamina Stat Mitigation (1-20 Scale)
             // Stamina 20 -> Multiplier 0.6 (Lose 40% less energy)
             // Stamina 10 -> Multiplier 0.8
             // Stamina 1  -> Multiplier 1.0 (Full fatigue)
             const staminaStat = p.stats.stamina || 10;
             const staminaFactor = 1 - ((staminaStat - 1) * 0.02); 
             
             const actualDrop = finalDropBase * staminaFactor;
             const newCond = Math.max(0, currentCond - actualDrop);

             return { ...p, condition: newCond };
        }
        return p;
    });
    
    return { ...team, players: updatedPlayers };
};

const MatchSimulation = ({ homeTeam, awayTeam, userTeamId, onFinish, allTeams, fixtures, managerTrust, fixtureId }: { homeTeam: Team, awayTeam: Team, userTeamId: string, onFinish: (h: number, a: number, events: MatchEvent[], stats: MatchStats, fid?: string) => void, allTeams: Team[], fixtures: any[], managerTrust: number, fixtureId?: string }) => {
    const [minute, setMinute] = useState(0);
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [events, setEvents] = useState<MatchEvent[]>([]);
    const [stats, setStats] = useState<MatchStats>(getEmptyMatchStats());
    const [speed, setSpeed] = useState(1); 
    const [phase, setPhase] = useState<'FIRST_HALF' | 'HALFTIME' | 'SECOND_HALF' | 'FULL_TIME' | 'PENALTIES'>('FIRST_HALF');
    const [isTacticsOpen, setIsTacticsOpen] = useState(false);
    
    // --- STOPPAGE TIME STATE ---
    const [addedTime, setAddedTime] = useState(0);
    const stoppageAccumulator = useRef(0); // Holds decimal minutes of wasted time

    // Penalty Shootout State
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

    // --- 2D ENGINE STATE ---
    const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 }); // 0-100%
    const [possessionTeamId, setPossessionTeamId] = useState<string | null>(null);
    const [lastActionText, setLastActionText] = useState("");

    const isSabotageActive = managerTrust < 30;
    const [sabotageTriggered, setSabotageTriggered] = useState(false);

    const userIsHome = homeTeam.id === userTeamId;
    const [myTeamCurrent, setMyTeamCurrent] = useState(userIsHome ? liveHomeTeam : liveAwayTeam); 

    useEffect(() => { setMyTeamCurrent(userIsHome ? liveHomeTeam : liveAwayTeam); }, [liveHomeTeam, liveAwayTeam, userIsHome]);

    const lastGoalRealTime = useRef<number>(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef(stats);
    useEffect(() => { statsRef.current = stats; }, [stats]);
    useEffect(() => { if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [events]);

    const homeRedCards = events.filter(e => (e.type === 'CARD_RED' || e.type === 'FIGHT' || e.type === 'ARGUMENT') && e.teamName === homeTeam.name).length;
    const awayRedCards = events.filter(e => (e.type === 'CARD_RED' || e.type === 'FIGHT' || e.type === 'ARGUMENT') && e.teamName === awayTeam.name).length;
    
    // Check if it's a cup match
    const currentFixture = fixtures.find(f => f.id === fixtureId);
    
    // UPDATED: Central Knockout Logic
    const isKnockout = useMemo(() => {
        if (!currentFixture) return false;
        const compId = currentFixture.competitionId;
        const week = currentFixture.week;
        if (['SUPER_CUP', 'CUP', 'PLAYOFF', 'PLAYOFF_FINAL'].includes(compId)) return true;
        if (compId === 'EUROPE' && week > 208) return true; // Avrupa Elemeleri (209+)
        return false;
    }, [currentFixture]);

    const playSound = (path: string) => { const audio = new Audio(path); audio.volume = 0.6; audio.play().catch(e => console.warn("Audio play failed:", e)); };

    // Helper to add stoppage time
    const addToStoppage = (minutes: number) => {
        stoppageAccumulator.current += minutes;
    };

    const handleUserSubstitution = (inPlayer: Player, outPlayer: Player) => {
        const teamName = myTeamCurrent.name;
        const event: MatchEvent = { minute, type: 'SUBSTITUTION', description: `${outPlayer.name} 🔄 ${inPlayer.name}`, teamName: teamName };
        setEvents(prev => [...prev, event]);
        
        // Add Stoppage Time for Substitution
        addToStoppage(0.5);

        // Critical: Check if the player being subbed out is the forced injured player
        if (forcedSubstitutionPlayerId && outPlayer.id === forcedSubstitutionPlayerId) {
            setForcedSubstitutionPlayerId(null);
        }
        
        if (userIsHome) { setHomeSubsUsed(h => h + 1); setLiveHomeTeam(myTeamCurrent); } else { setAwaySubsUsed(a => a + 1); setLiveAwayTeam(myTeamCurrent); }
    };

    const handleTacticsUpdate = (updatedTeam: Team) => {
        setMyTeamCurrent(updatedTeam);
        if (userIsHome) setLiveHomeTeam(updatedTeam); else setLiveAwayTeam(updatedTeam);
    };

    const handleQuickMentalityChange = (newMentality: Mentality) => {
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

    // AI Injury Auto-Substitution Logic
    const performAiInjurySub = (injuredPlayerId: string, isHomeTeam: boolean) => {
        const aiTeam = isHomeTeam ? liveHomeTeam : liveAwayTeam;
        const currentSubs = isHomeTeam ? homeSubsUsed : awaySubsUsed;

        if (currentSubs >= 5) return; // No subs left

        const injuredPlayer = aiTeam.players.find(p => p.id === injuredPlayerId);
        if (!injuredPlayer) return;

        // Find best replacement on bench (indices 11-17)
        const bench = aiTeam.players.slice(11, 18);
        const redCardedIds = new Set(events.filter(e => e.type === 'CARD_RED').map(e => e.playerId));
        const availableBench = bench.filter(p => !p.injury && !redCardedIds.has(p.id));

        if (availableBench.length === 0) return;

        // Priority 1: Same Position
        let substitute = availableBench.find(p => p.position === injuredPlayer.position);
        // Priority 2: Secondary Position
        if (!substitute) substitute = availableBench.find(p => p.secondaryPosition === injuredPlayer.position);
        // Priority 3: Best Skill
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
                    setAwaySubsUsed(s => s + 1);
                }

                setEvents(prev => [...prev, {
                    minute: minute + 1, // Happens practically immediately
                    type: 'SUBSTITUTION',
                    description: `${injuredPlayer.name} 🔄 ${substitute!.name} (Sakatlık)`,
                    teamName: aiTeam.name
                }]);
                
                // Add Stoppage for Sub
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

    // --- OBJECTION / VAR LOGIC ---
    const handleObjection = () => {
        // ... (VAR triggers time waste)
        // Manual objection might waste time or add to stoppage if it leads to VAR
        addToStoppage(0.2); // Argument delay

        const timeSinceGoal = Date.now() - lastGoalRealTime.current;
        const lastEvent = events[events.length - 1];
        
        // RAKİP GOLÜ KONTROLÜ
        const isOpponentGoal = lastEvent && lastEvent.type === 'GOAL' && lastEvent.teamName !== myTeamCurrent.name;

        // 1. ÖZEL DURUM: Golden hemen sonra (3 Saniye Kuralı)
        if (isOpponentGoal && timeSinceGoal <= 3000) {
             // %20 ihtimalle başarılı VAR incelemesi başlatır
             if (Math.random() < 0.20) {
                 setIsVarActive(true);
                 setVarMessage("HAKEM MONİTÖRE GİDİYOR... (GOL İNCELENİYOR)");
                 playSound(WHISTLE_SOUND);
                 
                 // VAR ADDS TIME
                 addToStoppage(2.0);

                 setTimeout(() => {
                    // BAŞARILI İTİRAZ: GOL İPTAL
                    setIsVarActive(false);
                    // Skoru geri al
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
                 // BAŞARISIZ İTİRAZ: HAKEM DİNLEMEDİ
                 setEvents(prev => [...prev, { minute, type: 'INFO', description: "Hakem yoğun itirazlara rağmen santra noktasını gösterdi.", teamName: myTeamCurrent.name }]);
             }
             return;
        }

        // 2. STANDART DURUM: Gol dışı veya süre geçtiyse
        const roll = Math.random();

        if (roll < 0.20) {
            // %20 VAR'a gider (Genel kontrol, genelde karar değişmez)
            setIsVarActive(true);
            setVarMessage("Hakem itiraz üzerine kulaklığını dinliyor...");
            addToStoppage(1.0); // Quick check
            setTimeout(() => {
                setIsVarActive(false);
                setEvents(prev => [...prev, { minute, type: 'INFO', description: "VAR ile görüşen hakem 'Devam' dedi.", teamName: myTeamCurrent.name }]);
            }, 2000);

        } else if (roll < 0.40) {
            // %20 SARI KART (Disiplin artar)
            escalateDiscipline("Hakem ısrarlı itirazlar nedeniyle kartına başvurdu.");

        } else {
            // %60 HİÇBİR ŞEY OLMAZ (Ama disiplin riski birikir)
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
         
         // State güncelleme
         if (newStatus !== managerDiscipline) {
             setManagerDiscipline(newStatus); 
             setEvents(prev => [...prev, { minute, description: desc, type, teamName: myTeamCurrent.name }]);
             
             // Coach drama adds time
             addToStoppage(0.5);

             if(newStatus === 'YELLOW') setStats(s => ({ ...s, managerCards: 'YELLOW' }));
             if(newStatus === 'RED') { setStats(s => ({ ...s, managerCards: 'RED' })); setIsTacticsOpen(false); }
         }
    };

    // --- 2D BALL MOVEMENT LOGIC ---
    useEffect(() => {
        if(isTacticsOpen || phase === 'HALFTIME' || phase === 'FULL_TIME' || phase === 'PENALTIES' || isVarActive || isPenaltyActive) return;
        
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
    }, [isTacticsOpen, phase, speed, isVarActive, isPenaltyActive, possessionTeamId, stats.homePossession]);


    // --- MAIN GAME LOOP (Minutes & Events) ---
    useEffect(() => {
        if(isTacticsOpen || phase === 'HALFTIME' || phase === 'FULL_TIME' || phase === 'PENALTIES' || isVarActive || isPenaltyActive) return;
        const interval = setInterval(() => {
            setMinute(m => {
                const nextM = m + 1;
                
                // STOPPAGE TIME CHECK LOGIC
                const REGULATION_END = phase === 'FIRST_HALF' ? 45 : 90;
                
                // Calculate added time at the boundary
                if (nextM === REGULATION_END) {
                    // Min 1 minute if any stoppage occurred
                    const extra = Math.max(stoppageAccumulator.current > 0 ? 1 : 0, Math.ceil(stoppageAccumulator.current));
                    setAddedTime(extra);
                }

                // Check for Half/Full Time
                // It only ends if nextM exceeds Regulation + Added Time
                if (nextM > REGULATION_END + addedTime) {
                    if (phase === 'FIRST_HALF') { 
                        setPhase('HALFTIME'); 
                        playSound(WHISTLE_SOUND); 
                        // Reset Stoppage for 2nd half
                        stoppageAccumulator.current = 0;
                        setAddedTime(0);
                        return 45; // Reset UI to 45 for halftime display
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

                // AI Subs Logic (Stamina or Rating Based)
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
                                
                                // Add Stoppage
                                addToStoppage(0.5);
                            }
                        }
                    }
                }

                // --- APPLY FATIGUE PER MINUTE ---
                // Calculate new condition for both teams based on tactics
                // PASSING SCORE DIFF TO HANDLE PANIC/MOTIVATION
                const fatiguedHome = applyFatigueToTeam(liveHomeTeam, homeScore - awayScore);
                const fatiguedAway = applyFatigueToTeam(liveAwayTeam, awayScore - homeScore);

                // Update local state so UI reflects it
                setLiveHomeTeam(fatiguedHome);
                setLiveAwayTeam(fatiguedAway);
                
                // Get Sabotage Modified versions for simulation check
                const { simHome, simAway } = getSimulateTeams(fatiguedHome, fatiguedAway);
                
                // Pass tired/sabotaged teams to logic
                // Critical: We must pass the *newly fatigued* teams to the simulation step
                // so that injury probabilities (which depend on condition) use the current condition.
                const event = simulateMatchStep(nextM, simHome, simAway, {h: homeScore, a: awayScore}, events, stats);
                
                if(event) {
                    // --- STOPPAGE TIME ACCUMULATION ---
                    switch(event.type) {
                        case 'GOAL': addToStoppage(0.8); break; // Celebration
                        case 'INJURY': addToStoppage(1.5); break; // Treatment
                        case 'CARD_RED': addToStoppage(1.0); break; // Argue/Leave
                        case 'FIGHT': addToStoppage(2.0); break; // Fight break
                        case 'ARGUMENT': addToStoppage(1.0); break; // Argue
                        case 'PITCH_INVASION': addToStoppage(4.0); break; // Invasion delay
                        case 'CARD_YELLOW': addToStoppage(0.3); break; // Write name
                        case 'SUBSTITUTION': addToStoppage(0.5); break; // Walk off
                        case 'VAR': addToStoppage(2.0); break; // Check
                        case 'PENALTY': addToStoppage(2.0); break; // Penalty Sequence
                        default: break;
                    }

                    // --- MAX INJURY LIMIT CHECK ---
                    const totalInjuries = events.filter(e => e.type === 'INJURY').length;
                    
                    if (event.type === 'INJURY' && totalInjuries >= 3) {
                         // Max injury limit reached, skip this event
                         return nextM;
                    }

                    // --- RED CARD VAR CHECK (NEW) ---
                    if (event.type === 'CARD_RED') {
                        // 10% Chance for VAR Check
                        if (Math.random() < 0.10) {
                            setIsVarActive(true);
                            setVarMessage("KIRMIZI KART İNCELENİYOR...");
                            addToStoppage(2.0);

                            // VAR Process Simulation
                            setTimeout(() => {
                                setIsVarActive(false);
                                // 80% Chance Downgrade to Yellow
                                if (Math.random() < 0.80) {
                                    const newEvent = { ...event, type: 'CARD_YELLOW' as const, description: `VAR Kararı: Kırmızı Kart İptal, SARI KART - ${event.description.replace('KIRMIZI KART!', '').trim()}` };
                                    
                                    // Update stats for Yellow instead of Red
                                    setStats(prev => {
                                        const s = { ...prev };
                                        const isHomeEvent = event.teamName === homeTeam.name;
                                        if (isHomeEvent) s.homeYellowCards++; else s.awayYellowCards++;
                                        return s;
                                    });

                                    setEvents(prev => [...prev, newEvent]);
                                } else {
                                    // 20% Confirm Red
                                    const newEvent = { ...event, description: `VAR Kararı: Karar Geçerli, KIRMIZI KART!` };
                                    
                                    // Update stats for Red
                                    setStats(prev => {
                                        const s = { ...prev };
                                        const isHomeEvent = event.teamName === homeTeam.name;
                                        if (isHomeEvent) s.homeRedCards++; else s.awayRedCards++;
                                        return s;
                                    });

                                    setEvents(prev => [...prev, newEvent]);
                                }
                            }, 2000);
                            return nextM; // Don't process event immediately, handled in timeout
                        }
                        // If no VAR, proceed normally to add event at bottom
                    }

                    // --- PENALTY UI SEQUENCE (UPDATED) ---
                    if (event.type === 'PENALTY') {
                        
                        const startPenaltySequence = (alreadyCheckedVar: boolean) => {
                            setIsPenaltyActive(true);
                            setPenaltyMessage("PENALTI KARARI! Hakem beyaz noktayı gösterdi.");
                            const eventTeam = [homeTeam, awayTeam].find(t => t.name === event.teamName);
                            setPenaltyTeamId(eventTeam?.id || null);
                            
                            // Wait 3 seconds then resolve outcome
                            setTimeout(() => {
                                 // --- NEW LOGIC: DETERMINE TAKER & OUTCOME ---
                                 const sentOff = new Set(events.filter(e => e.type === 'CARD_RED').map(e => e.playerId));
                                 // Get the taker using the helper logic
                                 const taker = getPenaltyTaker(eventTeam || (event.teamName === homeTeam.name ? liveHomeTeam : liveAwayTeam), sentOff);
                                 
                                 // Calculate Outcome
                                 const isGoal = calculatePenaltyOutcome(taker.stats.penalty);
                                 
                                 // --- POST-PENALTY VAR CHECK (NEW) ---
                                 // 15% Chance if it was a goal and NOT already checked
                                 if (isGoal && !alreadyCheckedVar && Math.random() < 0.15) {
                                     setIsPenaltyActive(false); // Hide penalty overlay temporarily
                                     setIsVarActive(true);
                                     setVarMessage("HAKEM MONİTÖRE GİDİYOR... (PENALTI İNCELENİYOR)");
                                     addToStoppage(2.0);
                                     
                                     setTimeout(() => {
                                         setIsVarActive(false);
                                         // 90% Chance to Cancel Goal
                                         if (Math.random() < 0.90) {
                                             setEvents(prev => [...prev, {
                                                 minute: nextM,
                                                 type: 'OFFSIDE', // Use generic cancel icon/type
                                                 description: `VAR Kararı: Penaltı İptal Edildi (Ofsayt/Faul).`,
                                                 teamName: event.teamName
                                             }]);
                                         } else {
                                             // Confirm Goal
                                             commitPenaltyGoal(event.teamName, taker, nextM);
                                         }
                                         setPenaltyTeamId(null);
                                     }, 2000);
                                     
                                 } else {
                                     // Standard Outcome
                                     if (isGoal) {
                                         commitPenaltyGoal(event.teamName, taker, nextM);
                                     } else {
                                        // Retake Logic Check (New Feature)
                                        const defendingTeam = event.teamName === homeTeam.name ? liveAwayTeam : liveHomeTeam;
                                        const keeper = defendingTeam.players.find(p => p.position === Position.GK) || defendingTeam.players[0];
                                        // Fallback to 10 if stat is missing
                                        const conc = keeper.stats.concentration !== undefined ? keeper.stats.concentration : 10;
                                        
                                        // Logic: Concentration < 15 -> 20% chance, else 5%
                                        const retakeChance = conc < 15 ? 0.20 : 0.05;

                                        if (Math.random() < retakeChance) {
                                            // Retake Logic
                                            setIsPenaltyActive(false); // Hide penalty overlay
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
                                                
                                                // Restart penalty sequence immediately (skipping pre-var check)
                                                startPenaltySequence(true); 
                                            }, 2000);
                                            return; // Exit current flow
                                        }

                                        // Regular Miss
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

                                         // Update Stats (Miss)
                                         setStats(prev => {
                                            const s = {...prev};
                                            const isHomeEvent = event.teamName === homeTeam.name;
                                            if (isHomeEvent) { s.homeShots++; } else { s.awayShots++; }
                                            return s;
                                         });

                                          // Hide overlay after another 2 seconds
                                         setTimeout(() => {
                                             setIsPenaltyActive(false);
                                             setPenaltyTeamId(null);
                                         }, 2000);
                                     }
                                 }

                            }, 3000);
                        };

                        // Helper to commit goal state
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

                             // Update Stats (Goal)
                             setStats(prev => {
                                const s = {...prev};
                                const isHomeEvent = teamName === homeTeam.name;
                                if (isHomeEvent) { s.homeShots++; s.homeShotsOnTarget++; } 
                                else { s.awayShots++; s.awayShotsOnTarget++; }
                                return s;
                             });

                             // Hide overlay
                             setTimeout(() => {
                                 setIsPenaltyActive(false);
                                 setPenaltyTeamId(null);
                             }, 2000);
                        }

                        // --- PRE-PENALTY VAR CHECK (NEW) ---
                        // 30% Chance to check BEFORE giving penalty
                        if (Math.random() < 0.30) {
                            setIsVarActive(true);
                            setVarMessage("VAR KONTROLÜ: PENALTI POZİSYONU...");
                            addToStoppage(2.0);
                            
                            setTimeout(() => {
                                setIsVarActive(false);
                                setEvents(prev => [...prev, { minute: nextM, type: 'INFO', description: "VAR Kontrolü Sonrası: PENALTI!", teamName: event.teamName }]);
                                // Proceed to penalty sequence, marking it as checked (true)
                                startPenaltySequence(true);
                            }, 2000);
                        } else {
                            // Proceed normally, unchecked (false)
                            startPenaltySequence(false);
                        }

                        return nextM; // Don't add PENALTY event to feed yet, handled in timeout
                    }

                    // Proceed with adding event (non-penalty, non-red-card-checked)
                    setEvents(prev => [...prev, event]);
                    
                    // --- Handle stats for new event types ---
                    if (event.type === 'FIGHT' || event.type === 'ARGUMENT') {
                         setStats(prev => {
                            const s = { ...prev };
                            const isHomeEvent = event.teamName === homeTeam.name;
                            if (isHomeEvent) s.homeRedCards++; else s.awayRedCards++;
                            return s;
                         });
                         // Treat as Red Card event for UI purposes too
                         addToStoppage(1.0);
                    }

                    // --- INJURY HANDLING START ---
                    if (event.type === 'INJURY') {
                        const isHomeInjured = event.teamName === homeTeam.name;
                        const isUserInjured = (userIsHome && isHomeInjured) || (!userIsHome && !isHomeInjured);

                         // NEW LOGIC: Mark player as injured in the live state so TacticsView knows
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
                            // CHECK USER SUBS
                            const userSubs = isHomeInjured ? homeSubsUsed : awaySubsUsed;
                            
                            if (userSubs >= 5) {
                                // NO MORE SUBS - TEAM PLAYS WITH 10
                                setEvents(prev => [...prev, { 
                                    minute: nextM, 
                                    type: 'INFO', 
                                    description: "❌ Değişiklik hakkı dolduğu için takım sahada bir kişi eksik mücadele edecek.", 
                                    teamName: myTeamCurrent.name 
                                }]);
                                // IMPORTANT: We do NOT setForcedSubstitutionPlayerId, so tactics modal won't force a swap.
                            } else {
                                // User Team Injury -> Force Tactics
                                if (event.playerId) {
                                    setForcedSubstitutionPlayerId(event.playerId);
                                    setIsTacticsOpen(true);
                                }
                            }
                        } else {
                            // AI Team Injury -> Auto Substitution
                            if (event.playerId) {
                                setTimeout(() => performAiInjurySub(event.playerId!, isHomeInjured), 500);
                            }
                        }
                    }
                    // --- INJURY HANDLING END ---
                    
                    if (event.type === 'GOAL') {
                        const isHomeGoal = event.teamName === homeTeam.name;
                        setPossessionTeamId(event.teamName === homeTeam.name ? homeTeam.id : awayTeam.id);
                        setBallPosition({ x: 50, y: isHomeGoal ? 98 : 2 }); 
                        setLastActionText("GOL!");
                        setTimeout(() => setBallPosition({ x: 50, y: 50 }), 2000);
                    }
                    
                    if(event.type === 'GOAL') {
                        // Capture Goal Time for Objection Logic
                        if (event.teamName !== myTeamCurrent.name) {
                            lastGoalRealTime.current = Date.now();
                        }

                        if(event.varOutcome) {
                            playSound(GOAL_SOUND); 
                            if(event.teamName === homeTeam.name) setHomeScore(s => s + 1); else setAwayScore(s => s + 1);
                            setTimeout(() => {
                                setIsVarActive(true); 
                                setVarMessage("Hakem VAR ile görüşüyor..."); 
                                addToStoppage(2.0); // VAR Delay
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
                                    }
                                }, 3000);
                            }, 1500);
                        } else {
                            playSound(GOAL_SOUND); 
                            if(event.teamName === homeTeam.name) setHomeScore(s => s + 1); else setAwayScore(s => s + 1);
                        }
                    }
                    
                    setStats(prev => {
                        const s = {...prev};
                        const isHomeEvent = event.teamName === homeTeam.name;

                        // Possession Adjust
                        if(isHomeEvent) s.homePossession = Math.min(80, s.homePossession + 1); else s.awayPossession = Math.min(80, s.awayPossession + 1);
                        s.homePossession = Math.max(20, s.homePossession); s.awayPossession = 100 - s.homePossession;

                        // Shot Counters
                        if(event.type === 'GOAL' || event.type === 'MISS' || event.type === 'SAVE') { 
                            if(isHomeEvent) { 
                                s.homeShots++; 
                                if(event.type === 'GOAL' || event.type === 'SAVE') s.homeShotsOnTarget++; 
                            } else { 
                                s.awayShots++; 
                                if(event.type === 'GOAL' || event.type === 'SAVE') s.awayShotsOnTarget++; 
                            } 
                        }

                        // FIXED: Added remaining stat counters
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
    }, [minute, isTacticsOpen, phase, speed, isVarActive, isPenaltyActive, events, liveHomeTeam, liveAwayTeam, homeSubsUsed, awaySubsUsed, forcedSubstitutionPlayerId, isSabotageActive, isKnockout, homeScore, awayScore, addedTime, stats]);

    // --- PENALTY SHOOTOUT LOOP ---
    useEffect(() => {
        if (phase !== 'PENALTIES') return;
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
    }, [phase, currentPkTeam, currentKickerIndex]);

    const isOwnGoal = events.length > 0 && events[events.length-1].type === 'GOAL' && events[events.length-1].teamName === myTeamCurrent.name;
    const isManagerSentOff = managerDiscipline === 'RED';
    const activePenaltyTeam = penaltyTeamId ? allTeams.find(t => t.id === penaltyTeamId) : null;

    const getMentalityColor = (m: Mentality, isActive: boolean) => {
        if (isActive) return 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]';
        switch (m) {
            case Mentality.VERY_DEFENSIVE: return 'bg-blue-900 text-blue-200 border-blue-800 hover:bg-blue-800';
            case Mentality.DEFENSIVE: return 'bg-sky-900 text-sky-200 border-sky-800 hover:bg-sky-800';
            case Mentality.STANDARD: return 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600';
            case Mentality.ATTACKING: return 'bg-orange-900 text-orange-200 border-orange-800 hover:bg-orange-800';
            case Mentality.VERY_ATTACKING: return 'bg-red-900 text-red-200 border-red-800 hover:bg-red-800';
            default: return 'bg-slate-700';
        }
    };

    const getMentalityIcon = (m: Mentality) => {
        switch (m) {
            case Mentality.VERY_DEFENSIVE: return <Shield size={14} />;
            case Mentality.DEFENSIVE: return <Shield size={14} className="opacity-70" />;
            case Mentality.STANDARD: return <div className="w-3 h-3 rounded-full border-2 border-current"></div>;
            case Mentality.ATTACKING: return <Swords size={14} className="opacity-70" />;
            case Mentality.VERY_ATTACKING: return <Swords size={14} />;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col relative">
            <MatchOverlays 
                isVarActive={isVarActive} varMessage={varMessage} isPenaltyActive={isPenaltyActive} penaltyMessage={penaltyMessage} activePenaltyTeam={activePenaltyTeam}
                isTacticsOpen={isTacticsOpen} forcedSubstitutionPlayerId={forcedSubstitutionPlayerId} myTeamCurrent={myTeamCurrent} handleTacticsUpdate={handleTacticsUpdate}
                userIsHome={userIsHome} homeSubsUsed={homeSubsUsed} awaySubsUsed={awaySubsUsed} handleUserSubstitution={handleUserSubstitution} minute={minute} onCloseTactics={() => setIsTacticsOpen(false)}
            />
            {/* Added Time Passed to Scoreboard */}
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
                    <button onClick={() => setMobileTab('STATS')} className={`flex-1 py-3 text-center font-bold text-sm flex items-center justify-center gap-2 ${mobileTab === 'STATS' ? 'text-white bg-slate-700 border-b-2 border-white' : 'text-slate-400'}`}><BarChart2 size={16}/> İstatistik & Taktik</button>
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
                    <div className="p-2 md:p-4 bg-slate-800 border-t border-slate-700 flex flex-col gap-2 md:gap-4">
                         <div className="flex justify-between items-center">
                             <div className="flex gap-1 md:gap-2">
                                 {[1, 2, 4].map(s => <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-1 md:px-3 rounded text-xs font-bold ${speed === s ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-300'}`}>{s}x</button>)}
                             </div>
                             {phase === 'FULL_TIME' ? (
                                 <button onClick={() => {
                                     const finalStats = { ...stats, pkHome: pkScore.home, pkAway: pkScore.away };
                                     onFinish(homeScore, awayScore, events, finalStats, fixtureId);
                                 }} className="bg-red-600 hover:bg-red-500 text-white px-4 md:px-6 py-2 rounded font-bold animate-pulse text-sm md:text-base">MAÇI BİTİR</button>
                             ) : phase === 'HALFTIME' ? (
                                 <div className="flex gap-2 md:gap-4 items-center">
                                    {isManagerSentOff && (<div className="hidden md:flex items-center gap-2 text-xs bg-red-900/50 border border-red-500 text-red-200 px-3 py-2 rounded"><Lock size={14} /><span className="font-bold">CEZALI</span></div>)}
                                    <button disabled={isManagerSentOff} onClick={() => setIsTacticsOpen(true)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded text-white text-xs md:text-sm font-bold transition-all ${isManagerSentOff ? 'bg-slate-600 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}>SOYUNMA ODASI</button>
                                    <button onClick={() => { setPhase('SECOND_HALF'); setAddedTime(0); setMinute(45); }} className="bg-green-600 px-3 py-1.5 md:px-4 md:py-2 rounded text-white text-xs md:text-sm font-bold">2. YARI</button>
                                 </div>
                             ) : phase === 'PENALTIES' ? (
                                 <div className="text-yellow-500 font-bold text-sm animate-pulse">SERİ PENALTILAR OYNANIYOR...</div>
                             ) : (
                                 <div className="flex gap-2 items-center">
                                     {managerDiscipline === 'RED' ? (
                                         <div className="bg-red-600/20 border border-red-500 text-red-500 px-2 py-1 md:px-6 md:py-3 rounded font-bold text-xs md:text-sm flex items-center gap-1 md:gap-2 animate-pulse shadow-inner"><AlertOctagon size={16} className="md:w-6 md:h-6"/> <span>TRİBÜNDESİNİZ</span></div>
                                     ) : (
                                        <>
                                            <button onClick={handleObjection} disabled={isOwnGoal} className={`text-white px-2 py-1.5 md:px-4 md:py-2 rounded font-bold flex items-center gap-1 md:gap-2 text-xs md:text-sm border shadow-inner transition active:scale-95 ${managerDiscipline === 'YELLOW' ? 'bg-orange-700 hover:bg-orange-600 border-orange-500' : 'bg-slate-700 hover:bg-slate-600 border-slate-500'} ${isOwnGoal ? 'opacity-50 cursor-not-allowed' : ''}`}><Megaphone size={14} className="md:w-4 md:h-4"/> İTİRAZ</button>
                                            <button onClick={() => setIsTacticsOpen(true)} className="bg-yellow-600 hover:bg-yellow-500 text-black px-3 py-1.5 md:px-4 md:py-2 rounded font-bold flex items-center gap-1 md:gap-2 shadow-lg shadow-yellow-900/20 text-xs md:text-sm"><Settings size={14} className="md:w-4 md:h-4"/> TAKTİK</button>
                                        </>
                                     )}
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
                <div className={`w-full md:w-1/4 flex-col bg-slate-800 border-l border-slate-700 ${mobileTab === 'STATS' ? 'flex' : 'hidden md:flex'}`}>
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-3 bg-slate-900 text-xs font-bold text-slate-400 uppercase">Canlı İstatistikler</div>
                        <div className="p-4 space-y-4">
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Topla Oynama</span><div className="font-bold text-white">%{stats.homePossession} - %{stats.awayPossession}</div></div><div className="w-full bg-slate-700 h-1 rounded overflow-hidden"><div className="bg-white h-full" style={{width: `${stats.homePossession}%`}}></div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Şut</span><div className="font-bold text-white">{stats.homeShots} - {stats.awayShots}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">İsabetli Şut</span><div className="font-bold text-white">{stats.homeShotsOnTarget} - {stats.awayShotsOnTarget}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Korner</span><div className="font-bold text-white">{stats.homeCorners} - {stats.awayCorners}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Faul</span><div className="font-bold text-white">{stats.homeFouls} - {stats.awayFouls}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Sarı Kart</span><div className="font-bold text-yellow-500">{stats.homeYellowCards} - {stats.awayYellowCards}</div></div>
                            <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Kırmızı Kart</span><div className="font-bold text-red-500">{stats.homeRedCards} - {stats.awayRedCards}</div></div>
                             <div className="flex justify-between items-end text-sm"><span className="text-slate-400">Ofsayt</span><div className="font-bold text-white">{stats.homeOffsides} - {stats.awayOffsides}</div></div>
                        </div>

                        {/* QUICK MENTALITY SECTION */}
                        <div className="p-3 bg-slate-900 text-xs font-bold text-slate-400 uppercase border-t border-slate-700">Hızlı Oyun Anlayışı</div>
                        <div className="p-4 flex flex-col gap-2">
                            {Object.values(Mentality).map((m) => {
                                const isActive = myTeamCurrent.mentality === m;
                                const isManagerBanned = managerDiscipline === 'RED';
                                return (
                                    <button
                                        key={m}
                                        disabled={isManagerBanned}
                                        onClick={() => handleQuickMentalityChange(m)}
                                        className={`w-full py-2 px-3 rounded text-xs font-bold border transition-all flex justify-between items-center ${getMentalityColor(m, isActive)} ${isManagerBanned ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {getMentalityIcon(m)}
                                            <span>{m}</span>
                                        </div>
                                        {isActive && <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>}
                                    </button>
                                );
                            })}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchSimulation;