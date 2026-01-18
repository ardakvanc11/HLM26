import React, { useState, useMemo } from 'react';
import { Player, Team, Fixture, Position } from '../../types';
import { Goal, Star, Zap, Shield, Award, AlertTriangle, BarChart2, User, Trophy, PlayCircle, Target, Footprints, ShieldCheck, Activity, MousePointerClick, MoveRight, CheckCircle2, Maximize2, Minimize2, X, Ban } from 'lucide-react';
import PlayerFace from '../shared/PlayerFace';
import { getFormattedDate } from '../../utils/calendarAndFixtures';

interface CompetitionStatsTabProps {
    teams: Team[];
    fixtures: Fixture[];
    competitionId: string;
    onPlayerClick: (p: Player) => void;
    onTeamClick: (id: string) => void;
    currentWeek: number; // Added currentWeek
}

const CompetitionStatsTab: React.FC<CompetitionStatsTabProps> = ({ teams, fixtures, competitionId, onPlayerClick, onTeamClick, currentWeek }) => {
    const [viewMode, setViewMode] = useState<'TEAM' | 'PLAYER'>('TEAM');
    
    // Modal States
    const [showTeamStatsModal, setShowTeamStatsModal] = useState(false);
    const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(false);

    // Filter relevant fixtures
    const compFixtures = useMemo(() => fixtures.filter(f => 
        f.played && 
        (
            (competitionId === 'LEAGUE' ? (f.competitionId === 'LEAGUE' || !f.competitionId) : f.competitionId === competitionId) ||
            (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL')
        )
    ), [fixtures, competitionId]);

    // --- TEAM STATS CALCULATION ---
    const teamStats = useMemo(() => {
        const statsMap = new Map<string, {
            id: string, name: string, logo?: string, colors: [string, string],
            goalsFor: number,
            possessionSum: number,
            gamesPlayed: number,
            shots: number,
            shotsConceded: number,
            yellows: number,
            reds: number,
            cleanSheets: number,
            goalsAgainst: number,
            // Simulated / Derived Stats
            dribbles: number,
            passAccuracySum: number,
            tackles: number
        }>();

        // Initialize Map
        teams.forEach(t => {
            // Check if team is relevant to this competition
            if (competitionId === 'LEAGUE' && t.leagueId === 'LEAGUE_1') return;
            if (competitionId === 'LEAGUE_1' && t.leagueId !== 'LEAGUE_1') return;
            
            statsMap.set(t.id, {
                id: t.id, name: t.name, logo: t.logo, colors: t.colors,
                goalsFor: 0, possessionSum: 0, gamesPlayed: 0, shots: 0, shotsConceded: 0,
                yellows: 0, reds: 0, cleanSheets: 0, goalsAgainst: 0,
                dribbles: 0, passAccuracySum: 0, tackles: 0
            });
        });

        compFixtures.forEach(f => {
            const h = statsMap.get(f.homeTeamId);
            const a = statsMap.get(f.awayTeamId);
            const s = f.stats;

            if (h && s) {
                h.gamesPlayed++;
                h.goalsFor += f.homeScore!;
                h.goalsAgainst += f.awayScore!;
                h.possessionSum += s.homePossession;
                h.shots += s.homeShots;
                h.shotsConceded += s.awayShots;
                h.yellows += s.homeYellowCards;
                h.reds += s.homeRedCards;
                if (f.awayScore === 0) h.cleanSheets++;
                
                h.dribbles += Math.floor(s.homeShots * 0.8) + (f.homeScore! * 2);
                h.tackles += (s.homeFouls * 1.5) + (s.homeYellowCards * 3) + 10;
                h.passAccuracySum += Math.min(95, 70 + (s.homePossession * 0.2) + (f.homeScore! * 1.5));
            }

            if (a && s) {
                a.gamesPlayed++;
                a.goalsFor += f.awayScore!;
                a.goalsAgainst += f.homeScore!;
                a.possessionSum += s.awayPossession;
                a.shots += s.awayShots;
                a.shotsConceded += s.homeShots;
                a.yellows += s.awayYellowCards;
                a.reds += s.awayRedCards;
                if (f.homeScore === 0) a.cleanSheets++;

                a.dribbles += Math.floor(s.awayShots * 0.8) + (f.awayScore! * 2);
                a.tackles += (s.awayFouls * 1.5) + (s.awayYellowCards * 3) + 10;
                a.passAccuracySum += Math.min(95, 70 + (s.awayPossession * 0.2) + (f.awayScore! * 1.5));
            }
        });

        const list = Array.from(statsMap.values()).filter(t => t.gamesPlayed > 0);
        return list.map(t => ({
            ...t,
            avgPossession: t.gamesPlayed > 0 ? t.possessionSum / t.gamesPlayed : 0,
            avgPassAccuracy: t.gamesPlayed > 0 ? t.passAccuracySum / t.gamesPlayed : 0
        }));

    }, [teams, compFixtures, competitionId]);

    // --- SUSPENDED PLAYERS CALCULATION ---
    const suspendedPlayers = useMemo(() => {
        // Flat map all players from relevant teams who are suspended
        const list: { 
            player: Player, 
            team: Team, 
            reason: string, 
            startDate: string,
            remaining: number 
        }[] = [];

        const relevantTeams = competitionId === 'LEAGUE' 
            ? teams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId)
            : competitionId === 'LEAGUE_1' 
                ? teams.filter(t => t.leagueId === 'LEAGUE_1')
                : teams; // For Cups show all

        relevantTeams.forEach(t => {
            t.players.forEach(p => {
                if (p.suspendedUntilWeek && p.suspendedUntilWeek > currentWeek) {
                    // Determine Reason based on stats
                    // This is an estimation since we don't store exact reason strings on player
                    let reason = "Sarı Kart Sınırı";
                    if (p.seasonStats.redCards > 0) {
                        // Check if red card was recent? Assume red if they have one.
                        reason = "Atıldı (Kırmızı Kart)";
                    } else if (p.seasonStats.yellowCards >= 4) {
                        reason = "4 Sarı Kart"; // Or 5 depending on league rules
                    }

                    // Estimate Start Date (Last match date)
                    const lastMatch = fixtures
                        .filter(f => f.played && (f.homeTeamId === t.id || f.awayTeamId === t.id))
                        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                    
                    const startDate = lastMatch ? getFormattedDate(lastMatch.date).label : '-';

                    list.push({
                        player: p,
                        team: t,
                        reason: reason,
                        startDate: startDate,
                        remaining: p.suspendedUntilWeek - currentWeek
                    });
                }
            });
        });

        return list;
    }, [teams, currentWeek, fixtures, competitionId]);

    // --- PLAYER STATS LEADERBOARDS ---
    
    // 1. Raw Flat List
    const playerStatsRaw = useMemo(() => {
        const pMap = new Map<string, {
            player: Player, team: Team,
            ratingSum: number, matches: number, 
            goals: number, assists: number, 
            cleanSheets: number, mvps: number,
            tackles: number, shots: number, keyPasses: number, dribbles: number, passAccSum: number,
            yellow: number, red: number
        }>();

        compFixtures.forEach(f => {
            if (!f.stats) return;

            const processRatings = (ratings: any[], teamId: string, conceded: number) => {
                const team = teams.find(t => t.id === teamId);
                if (!team) return;

                ratings.forEach(r => {
                    if (!pMap.has(r.playerId)) {
                        const p = team.players.find(pl => pl.id === r.playerId);
                        if (p) {
                            pMap.set(r.playerId, {
                                player: p, team: team,
                                ratingSum: 0, matches: 0, goals: 0, assists: 0, cleanSheets: 0, mvps: 0,
                                tackles: 0, shots: 0, keyPasses: 0, dribbles: 0, passAccSum: 0,
                                yellow: 0, red: 0
                            });
                        }
                    }

                    const entry = pMap.get(r.playerId);
                    if (entry) {
                        entry.ratingSum += r.rating;
                        entry.matches++;
                        entry.goals += r.goals;
                        entry.assists += r.assists;

                        if (r.position === 'GK' && conceded === 0) entry.cleanSheets++;
                        if (f.stats?.mvpPlayerId === r.playerId) entry.mvps++;

                        // Simulated Stats
                        const isFwd = ['SNT', 'SLK', 'SGK'].includes(r.position);
                        const isMid = ['OS', 'OOS'].includes(r.position);
                        entry.shots += r.goals * 2 + (isFwd ? 2 : isMid ? 1 : 0.2); 
                        entry.keyPasses += r.assists * 2 + (isMid ? 1.5 : isFwd ? 0.8 : 0.1);
                        const isDef = ['STP', 'SLB', 'SGB', 'GK'].includes(r.position);
                        entry.tackles += (isDef ? 2.5 : isMid ? 1.5 : 0.3) + (r.rating > 7 ? 1 : 0);
                        const isWinger = ['SLK', 'SGK'].includes(r.position);
                        const isDribbler = ['OOS', 'SNT'].includes(r.position);
                        entry.dribbles += (isWinger ? 3.5 : isDribbler ? 2.0 : 0.2) + (r.rating > 7.5 ? 2 : 0);
                        const baseAcc = isDef ? 85 : isMid ? 82 : 75;
                        const matchAcc = Math.min(100, baseAcc + (r.rating - 6) * 5 + (Math.random() * 5));
                        entry.passAccSum += matchAcc;
                    }
                });
            };

            // Process Cards separately from events to ensure accuracy
            if (f.matchEvents) {
                f.matchEvents.forEach(e => {
                    if ((e.type === 'CARD_YELLOW' || e.type === 'CARD_RED') && e.playerId) {
                         const entry = pMap.get(e.playerId);
                         if (entry) {
                             if (e.type === 'CARD_YELLOW') entry.yellow++;
                             if (e.type === 'CARD_RED') entry.red++;
                         }
                    }
                });
            }

            if (f.stats.homeRatings) processRatings(f.stats.homeRatings, f.homeTeamId, f.awayScore!);
            if (f.stats.awayRatings) processRatings(f.stats.awayRatings, f.awayTeamId, f.homeScore!);
        });

        return Array.from(pMap.values()).map(x => ({
            ...x,
            avgRating: x.matches > 0 ? x.ratingSum / x.matches : 0,
            avgPassAcc: x.matches > 0 ? x.passAccSum / x.matches : 0,
            shots: Math.floor(x.shots),
            keyPasses: Math.floor(x.keyPasses),
            tackles: Math.floor(x.tackles),
            dribbles: Math.floor(x.dribbles)
        }));
    }, [compFixtures, teams]);

    // 2. Derived Leaderboards for Grid View
    const playerLeaderboards = useMemo(() => {
        const all = [...playerStatsRaw];

        // Helper to get top
        const getTop = (sortFn: (a: any, b: any) => number) => {
            const sorted = [...all].sort(sortFn);
            return sorted.length > 0 ? sorted[0] : null;
        };

        return [
            { id: 1, title: 'En Fazla Gol Atan', icon: Goal, data: getTop((a,b) => b.goals - a.goals), valueKey: 'goals' },
            { id: 2, title: 'Kalesine En Az Şut Çekilen', icon: Shield, data: getTop((a,b) => b.cleanSheets - a.cleanSheets), valueKey: 'cleanSheets' },
            { id: 3, title: 'En Fazla Topla Oynama', icon: Activity, data: getTop((a,b) => b.avgPassAcc - a.avgPassAcc), valueKey: 'avgPassAcc', format: (v: number) => `%${Math.round(v)}` },
            { id: 4, title: 'En Fazla Başarılı Çalım', icon: Footprints, data: getTop((a,b) => b.dribbles - a.dribbles), valueKey: 'dribbles' },
            { id: 5, title: 'En Fazla Sarı Kart', icon: AlertTriangle, data: getTop((a,b) => (b.yellow || 0) - (a.yellow || 0)), valueKey: 'yellow' },
            { id: 6, title: 'En Yüksek Pas İsabeti', icon: CheckCircle2, data: getTop((a,b) => b.avgPassAcc - a.avgPassAcc), valueKey: 'avgPassAcc', format: (v: number) => `%${Math.round(v)}` },
            { id: 7, title: 'En Fazla Şut Çeken', icon: Target, data: getTop((a,b) => b.shots - a.shots), valueKey: 'shots' },
            { id: 8, title: 'En Fazla Başarılı Topa Müdahale', icon: ShieldCheck, data: getTop((a,b) => b.tackles - a.tackles), valueKey: 'tackles' },
            { id: 9, title: 'En Fazla Asist Yapan', icon: Zap, data: getTop((a,b) => b.assists - a.assists), valueKey: 'assists' },
            { id: 10, title: 'En Yüksek Maç Puanı', icon: Star, data: getTop((a,b) => b.avgRating - a.avgRating), valueKey: 'avgRating', format: (v: number) => v.toFixed(2) },
        ];
    }, [playerStatsRaw]);

    // --- RENDER HELPERS ---

    const renderStatRow = (label: string, dataKey: keyof typeof teamStats[0] | ((t: any) => number), format: (v: number) => string = (v) => v.toString(), sortDir: 'asc'|'desc' = 'desc') => {
        if (teamStats.length === 0) return null;
        
        const sorted = [...teamStats].sort((a, b) => {
            const valA = typeof dataKey === 'function' ? dataKey(a) : a[dataKey] as number;
            const valB = typeof dataKey === 'function' ? dataKey(b) : b[dataKey] as number;
            return sortDir === 'desc' ? valB - valA : valA - valB;
        });

        const best = sorted[0];
        const val = typeof dataKey === 'function' ? dataKey(best) : best[dataKey] as number;

        return (
            <div className="flex justify-between items-center py-3 border-b border-[#333] last:border-0 hover:bg-[#252525] px-2 rounded transition-colors group">
                <div className="flex flex-col">
                    <span className="text-slate-400 text-xs font-medium mb-1">{label}</span>
                    <button 
                        onClick={() => onTeamClick(best.id)}
                        className="flex items-center gap-2 text-white font-bold hover:text-yellow-500 transition-colors text-sm text-left"
                    >
                         {best.logo ? <img src={best.logo} className="w-5 h-5 object-contain" /> : <div className={`w-5 h-5 rounded-full ${best.colors[0]}`}></div>}
                         <span className="truncate max-w-[120px]">{best.name}</span>
                    </button>
                </div>
                <div className="text-xl font-black text-white group-hover:text-yellow-500 transition-colors">
                    {format(val)}
                </div>
            </div>
        );
    };

    const renderPlayerStatRow = (item: any) => {
        if (!item || !item.data) return null;
        const p = item.data.player;
        const t = item.data.team;
        const val = (item.data as any)[item.valueKey];
        const displayVal = item.format ? item.format(val) : val;

        return (
            <div className="flex justify-between items-center py-3 border-b border-[#333] last:border-0 hover:bg-[#252525] px-2 rounded transition-colors group cursor-pointer" onClick={() => onPlayerClick(p)}>
                <div className="flex flex-col">
                    <span className="text-slate-400 text-xs font-medium mb-1">{item.title}</span>
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 overflow-hidden shrink-0 group-hover:border-[#ff9f43] transition-colors">
                             <PlayerFace player={p} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-white font-bold text-sm truncate max-w-[140px] group-hover:text-yellow-500 transition-colors">{p.name}</span>
                            <div className="flex items-center gap-1 text-[9px] text-slate-500">
                                {t.logo ? <img src={t.logo} className="w-3 h-3 object-contain opacity-70"/> : <div className={`w-2 h-2 rounded-full ${t.colors[0]}`}></div>}
                                {t.name}
                            </div>
                         </div>
                    </div>
                </div>
                <div className="text-xl font-black text-white group-hover:text-yellow-500 transition-colors font-mono">
                    {displayVal}
                </div>
            </div>
        );
    };

    // Helper to find item by ID
    const getPItem = (id: number) => playerLeaderboards.find(p => p.id === id);

    return (
        <div className="h-full flex flex-col bg-[#1b1b1b]">
            
            {/* TOGGLE HEADER */}
            <div className="flex items-center justify-center p-4 border-b border-[#333] bg-[#222]">
                <div className="flex bg-[#111] p-1 rounded-lg border border-[#333]">
                    <button 
                        onClick={() => setViewMode('TEAM')}
                        className={`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${viewMode === 'TEAM' ? 'bg-[#ff9f43] text-black shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <ShieldCheck size={16}/> TAKIM
                    </button>
                    <button 
                        onClick={() => setViewMode('PLAYER')}
                        className={`px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${viewMode === 'PLAYER' ? 'bg-[#ff9f43] text-black shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <User size={16}/> OYUNCU
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                
                {viewMode === 'TEAM' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                        <div 
                            className="flex justify-between items-center mb-4 border-l-4 border-fuchsia-400 pl-3 cursor-pointer group hover:bg-white/5 rounded-r transition-colors"
                            onClick={() => setShowTeamStatsModal(true)}
                        >
                            <h3 className="text-lg font-bold text-fuchsia-400 uppercase tracking-widest group-hover:text-fuchsia-300 transition-colors">Takım İstatistikleri</h3>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowTeamStatsModal(true); }}
                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 border border-blue-400 transition shadow-sm font-bold"
                            >
                                <Maximize2 size={14}/>
                                Detaylı Gör
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 bg-[#1e232e] p-6 rounded-xl border border-[#333] shadow-lg">
                            <div className="flex flex-col gap-1">
                                {renderStatRow('En Fazla Gol Atan', 'goalsFor')}
                                {renderStatRow('En Fazla Topla Oynama', 'avgPossession', (v) => `%${v.toFixed(1)}`)}
                                {renderStatRow('En Fazla Sarı Kart', 'yellows')}
                                {renderStatRow('En Fazla Şut Çeken', 'shots')}
                                {renderStatRow('En Fazla Kalesinde Gol Görmeme', 'cleanSheets')}
                            </div>
                            <div className="flex flex-col gap-1">
                                {renderStatRow('Kalesine En Az Şut Çekilen', 'shotsConceded', (v) => v.toString(), 'asc')}
                                {renderStatRow('En Fazla Başarılı Çalım', 'dribbles')}
                                {renderStatRow('En Yüksek Pas İsabeti', 'avgPassAccuracy', (v) => `%${v.toFixed(1)}`)}
                                {renderStatRow('En Fazla Başarılı Topa Müdahale', 'tackles')}
                                {renderStatRow('En Az Gol Yiyen', 'goalsAgainst', (v) => v.toString(), 'asc')}
                            </div>
                        </div>

                        {/* SUSPENDED PLAYERS SECTION */}
                        <div className="mt-8">
                             <div className="flex justify-between items-center mb-4 border-l-4 border-red-500 pl-3">
                                <h3 className="text-lg font-bold text-red-500 uppercase tracking-widest">Mevcut Cezalılar</h3>
                             </div>

                             <div className="bg-[#1e232e] rounded-xl border border-[#333] shadow-lg overflow-hidden">
                                 {suspendedPlayers.length === 0 ? (
                                     <div className="p-8 text-center text-slate-500 italic">
                                         Şu anda cezalı oyuncu bulunmuyor.
                                     </div>
                                 ) : (
                                     <table className="w-full text-left text-sm text-slate-300">
                                         <thead className="bg-[#15191e] text-xs uppercase text-slate-500 font-bold border-b border-[#333]">
                                             <tr>
                                                 <th className="p-3 pl-4">İsim</th>
                                                 <th className="p-3">Takım</th>
                                                 <th className="p-3 text-center">Başlangıç Tarihi</th>
                                                 <th className="p-3 text-center">Maçlar</th>
                                                 <th className="p-3 text-center">Kapsam</th>
                                                 <th className="p-3 text-right pr-4">Sebep</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-[#333]">
                                             {suspendedPlayers.map((item, idx) => (
                                                 <tr key={idx} className="hover:bg-[#252a30] transition-colors cursor-pointer group" onClick={() => onPlayerClick(item.player)}>
                                                     <td className="p-3 pl-4">
                                                         <div className="flex items-center gap-3">
                                                             <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 overflow-hidden shrink-0 group-hover:border-red-500 transition-colors">
                                                                 <PlayerFace player={item.player} />
                                                             </div>
                                                             <div className="flex items-center gap-2">
                                                                <Ban size={14} className="text-red-500"/>
                                                                <div className="bg-[#2c333a] border border-[#3c444d] rounded px-2 py-0.5 font-bold text-slate-200 group-hover:text-white transition-colors">
                                                                    {item.player.name}
                                                                </div>
                                                             </div>
                                                         </div>
                                                     </td>
                                                     <td className="p-3">
                                                         <div className="flex items-center gap-2 cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); onTeamClick(item.team.id); }}>
                                                             {item.team.logo ? <img src={item.team.logo} className="w-5 h-5 object-contain"/> : <div className={`w-5 h-5 rounded-full ${item.team.colors[0]}`}></div>}
                                                             <div className="bg-[#2c333a] border border-[#3c444d] rounded px-2 py-0.5 text-xs text-slate-300 font-bold">
                                                                {item.team.name}
                                                             </div>
                                                         </div>
                                                     </td>
                                                     <td className="p-3 text-center text-slate-400">{item.startDate}</td>
                                                     <td className="p-3 text-center font-mono font-bold text-white">0/{item.remaining}</td>
                                                     <td className="p-3 text-center text-slate-400">Lig/Kupa</td>
                                                     <td className="p-3 text-right pr-4 text-slate-200 font-medium">{item.reason}</td>
                                                 </tr>
                                             ))}
                                         </tbody>
                                     </table>
                                 )}
                             </div>
                        </div>

                        {teamStats.length === 0 && (
                            <div className="text-center text-slate-500 italic py-10">Henüz veri oluşmadı.</div>
                        )}
                    </div>
                )}

                {viewMode === 'PLAYER' && (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
                        <div 
                            className="flex justify-between items-center mb-4 border-l-4 border-fuchsia-400 pl-3 cursor-pointer group hover:bg-white/5 rounded-r transition-colors"
                            onClick={() => setShowPlayerStatsModal(true)}
                        >
                            <h3 className="text-lg font-bold text-fuchsia-400 uppercase tracking-widest group-hover:text-fuchsia-300 transition-colors">Oyuncu İstatistikleri</h3>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowPlayerStatsModal(true); }}
                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 border border-blue-400 transition shadow-sm font-bold"
                            >
                                <Maximize2 size={14}/>
                                Detaylı Gör
                            </button>
                        </div>

                        {playerStatsRaw.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 bg-[#1e232e] p-6 rounded-xl border border-[#333] shadow-lg">
                                {/* Left Column: Offensive / General */}
                                <div className="flex flex-col gap-1">
                                    {renderPlayerStatRow(getPItem(1))} {/* Gol */}
                                    {renderPlayerStatRow(getPItem(9))} {/* Asist */}
                                    {renderPlayerStatRow(getPItem(10))} {/* Rating */}
                                    {renderPlayerStatRow(getPItem(7))} {/* Shots */}
                                    {renderPlayerStatRow(getPItem(4))} {/* Dribbles */}
                                </div>
                                {/* Right Column: Defensive / Other */}
                                <div className="flex flex-col gap-1">
                                    {renderPlayerStatRow(getPItem(2))} {/* Clean Sheets */}
                                    {renderPlayerStatRow(getPItem(8))} {/* Tackles */}
                                    {renderPlayerStatRow(getPItem(6))} {/* Pass Acc */}
                                    {renderPlayerStatRow(getPItem(3))} {/* Possession (Derived) */}
                                    {renderPlayerStatRow(getPItem(5))} {/* Yellow Cards */}
                                </div>
                            </div>
                        ) : (
                             <div className="text-center text-slate-500 italic py-10 bg-[#1e232e] rounded-xl border border-[#333]">
                                 Yeterli veri oluşmadığı için istatistikler henüz hesaplanamıyor.
                             </div>
                        )}
                    </div>
                )}
            </div>

            {/* TEAM STATS MODAL (Empty for now) */}
            {showTeamStatsModal && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTeamStatsModal(false)}>
                    <div className="bg-[#1e232e] w-full max-w-4xl h-[80vh] rounded-xl border border-slate-700 shadow-2xl relative flex flex-col p-6 animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowTeamStatsModal(false)} className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-red-600 rounded-full text-white transition border border-slate-600">
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldCheck size={28} className="text-blue-500"/>
                            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Detaylı Takım İstatistikleri</h2>
                        </div>
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg bg-slate-900/50">
                            <div className="text-slate-500 italic text-lg font-bold">
                                Detaylı veri tabloları yakında eklenecek...
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PLAYER STATS MODAL (Empty for now) */}
            {showPlayerStatsModal && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPlayerStatsModal(false)}>
                    <div className="bg-[#1e232e] w-full max-w-4xl h-[80vh] rounded-xl border border-slate-700 shadow-2xl relative flex flex-col p-6 animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowPlayerStatsModal(false)} className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-red-600 rounded-full text-white transition border border-slate-600">
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-3 mb-6">
                            <User size={28} className="text-blue-500"/>
                            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Detaylı Oyuncu İstatistikleri</h2>
                        </div>
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg bg-slate-900/50">
                            <div className="text-slate-500 italic text-lg font-bold">
                                Detaylı veri tabloları yakında eklenecek...
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CompetitionStatsTab;