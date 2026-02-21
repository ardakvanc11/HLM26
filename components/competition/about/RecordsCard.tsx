
import React, { useState } from 'react';
import { Medal, Maximize2, Trophy } from 'lucide-react';
import { Team, Fixture } from '../../../types';
import { getFormattedDate } from '../../../utils/calendarAndFixtures';

// --- RECORDS CARD (WIDGET) ---
interface RecordsCardProps {
    competitionId: string;
    teams: Team[];
    onOpenDetail: () => void;
}

export const RecordsCard: React.FC<RecordsCardProps> = ({ competitionId, teams, onOpenDetail }) => {
    const getRecords = () => {
        const logos = {
            ayibogan: 'https://i.imgur.com/eV74XlV.png',
            essekbogan: 'https://i.imgur.com/T1RiW8H.png',
            kedi: 'https://i.imgur.com/VSUm10b.png',
            ari: 'https://i.imgur.com/7vkiuxd.png',
            gorilla: 'https://i.imgur.com/56itsyB.png', 
            aslan: 'https://i.imgur.com/LGVIYxf.png' 
        };

        if (competitionId === 'LEAGUE' || competitionId === 'LEAGUE_1') {
            let leagueTeams = teams;
            if (competitionId === 'LEAGUE') leagueTeams = teams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
            else if (competitionId === 'LEAGUE_1') leagueTeams = teams.filter(t => t.leagueId === 'LEAGUE_1');

            const mostTitlesTeam = [...leagueTeams].sort((a,b) => b.championships - a.championships)[0];
            const mtName = mostTitlesTeam ? mostTitlesTeam.name : 'Eşşekboğanspor FK';
            const mtCount = mostTitlesTeam ? mostTitlesTeam.championships : 15;
            const mtLogo = mostTitlesTeam ? (mostTitlesTeam.logo || logos.essekbogan) : logos.essekbogan;

            return [
                { label: 'En Çok Kazanan', value: `${mtCount} Kez`, holder: mtName, year: 'Tarih Boyunca', logo: mtLogo },
                { label: 'En Fazla Puan', value: '105 Puan', holder: 'Eşşekboğanspor FK', year: '1990/91', logo: logos.essekbogan },
                { label: 'En Fazla Galibiyet', value: '30 Galibiyet', holder: 'Ayıboğanspor SK', year: '2002/03', logo: logos.ayibogan },
                { label: 'En Uzun Yenilmezlik', value: '48 Maç', holder: 'Kedispor', year: '1991-1993', logo: logos.kedi }
            ];
        }
        
        if (competitionId === 'EUROPE') return [
            { label: 'En Çok Kazanan', value: '14 Kez', holder: 'Aslanspor SK', year: 'Tarih Boyunca', logo: logos.aslan },
            { label: 'En Fazla Puan', value: '18 Puan', holder: 'Gorilla United', year: '2023/24', logo: logos.gorilla },
            { label: 'En Fazla Galibiyet', value: '11 Galibiyet', holder: 'Gorilla City', year: '2022/23', logo: logos.gorilla },
            { label: 'En Uzun Yenilmezlik', value: '22 Maç', holder: 'El-Katir', year: '2019-2021', logo: logos.aslan }
        ];

        return [
            { label: 'En Çok Kazanan', value: '14 Kez', holder: 'Kedispor', year: 'Tarih Boyunca', logo: logos.kedi },
            { label: 'En Farklı Skor', value: '10-0', holder: 'Eşşekboğanspor', year: 'Final 1995', logo: logos.essekbogan },
            { label: 'En Çok Gol Atan', value: '45 Gol', holder: 'H. Şükür', year: 'Kariyer', logo: logos.kedi },
            { label: 'Üst Üste Zafer', value: '4 Kez', holder: 'Arıspor', year: '2015-2019', logo: logos.ari }
        ];
    };

    return (
        <div 
            onClick={onOpenDetail}
            className="bg-[#252525] rounded-2xl border border-[#333] overflow-hidden shadow-lg group hover:border-[#ff9f43]/50 transition-all duration-300 relative cursor-pointer hover:scale-[1.01]"
        >
            <button className="absolute top-4 right-4 z-20 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-transform hover:scale-105 pointer-events-none">
                <Maximize2 size={14} /> Detaylı Gör
            </button>

            <div className="bg-[#2a2f38] p-4 border-b border-[#333] flex items-center gap-3">
                <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-500">
                    <Medal size={20}/>
                </div>
                <h4 className="text-white font-bold text-lg uppercase tracking-wider">Rekorlar</h4>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getRecords().map((rec, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-[#1f1f1f] rounded-xl border border-[#333] hover:bg-[#282828] transition-colors relative overflow-hidden group/card">
                        <div className="absolute right-0 bottom-0 opacity-5 group-hover/card:opacity-10 transition-opacity">
                            <Trophy size={64}/>
                        </div>
                        
                        <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center p-2 border border-[#333] shrink-0 z-10">
                            <img src={rec.logo} alt={rec.holder} className="w-full h-full object-contain" />
                        </div>
                        
                        <div className="flex flex-col z-10">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{rec.label}</span>
                            <span className="text-xl font-black text-[#ff9f43] leading-none mb-1">{rec.value}</span>
                            <span className="text-xs text-white font-bold truncate max-w-[120px]">{rec.holder}</span>
                            <span className="text-[10px] text-slate-500">{rec.year}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- RECORDS MODAL CONTENT ---
type RecordTab = 'GENERAL' | 'ATTENDANCE' | 'RESULTS' | 'STREAKS' | 'TEAMS' | 'PLAYERS';
type TimeFilter = 'ALL_TIME' | 'SEASON';

interface RecordsModalContentProps {
    competitionId: string;
    teams: Team[];
    fixtures: Fixture[];
}

export const RecordsModalContent: React.FC<RecordsModalContentProps> = ({ competitionId, teams, fixtures }) => {
    const [activeRecordTab, setActiveRecordTab] = useState<RecordTab>('GENERAL');
    const [recordTimeFilter, setRecordTimeFilter] = useState<TimeFilter>('ALL_TIME');

    const getDetailedRecords = () => {
        const records: {label: string, value: string}[] = [];
        let compTeams = teams;
        if (competitionId === 'LEAGUE') compTeams = teams.filter(t => t.leagueId === 'LEAGUE' || !t.leagueId);
        if (competitionId === 'LEAGUE_1') compTeams = teams.filter(t => t.leagueId === 'LEAGUE_1');
        
        const relevantFixtures = fixtures.filter(f => 
            f.played && 
            (
                (competitionId === 'LEAGUE' ? (f.competitionId === 'LEAGUE' || !f.competitionId) : f.competitionId === competitionId) ||
                (competitionId === 'PLAYOFF' && f.competitionId === 'PLAYOFF_FINAL')
            )
        );

        // --- HELPER LOGIC FOR AGGREGATION ---
        // Player Stats Logic
        const calculatePlayerStats = () => {
            const results = [];
            const allPlayers = compTeams.flatMap(t => t.players.map(p => ({...p, teamName: t.name})));
            
            // Top Scorer
            const topScorer = [...allPlayers].sort((a,b) => b.seasonStats.goals - a.seasonStats.goals)[0];
            if(topScorer && topScorer.seasonStats.goals > 0) {
                results.push({ label: 'En Fazla Gol', value: `${topScorer.seasonStats.goals} Gol - ${topScorer.name} (${topScorer.teamName})` });
            }

            // Top Assister
            const topAssister = [...allPlayers].sort((a,b) => b.seasonStats.assists - a.seasonStats.assists)[0];
            if(topAssister && topAssister.seasonStats.assists > 0) {
                results.push({ label: 'En Fazla Asist', value: `${topAssister.seasonStats.assists} Asist - ${topAssister.name} (${topAssister.teamName})` });
            }

            // Most Goals in Single Match
            let mostGoalsInMatch = { count: 0, player: '-', match: '-' };
            relevantFixtures.forEach(f => {
                const scorers: Record<string, number> = {};
                f.matchEvents?.filter(e => e.type === 'GOAL').forEach(e => {
                    if(e.scorer) scorers[e.scorer] = (scorers[e.scorer] || 0) + 1;
                });
                Object.entries(scorers).forEach(([name, count]) => {
                    if(count > mostGoalsInMatch.count) {
                        const t = compTeams.find(tm => tm.name === f.matchEvents?.find(ev=>ev.scorer===name)?.teamName);
                        mostGoalsInMatch = { count, player: `${name} (${t?.name || ''})`, match: `${f.homeScore}-${f.awayScore}` };
                    }
                });
            });
            if(mostGoalsInMatch.count > 0) results.push({ label: 'Bir Maçta En Fazla Gol', value: `${mostGoalsInMatch.count} Gol - ${mostGoalsInMatch.player}` });

            return results;
        };

        // Team Stats Logic
        const calculateTeamStats = () => {
            const results = [];
             const sortedByGoals = [...compTeams].map(t => {
                 const goals = relevantFixtures.filter(f => f.homeTeamId === t.id || f.awayTeamId === t.id).reduce((acc, f) => {
                     const isHome = f.homeTeamId === t.id;
                     return acc + (isHome ? f.homeScore! : f.awayScore!);
                 }, 0);
                 return { name: t.name, goals };
             }).sort((a,b) => b.goals - a.goals);
             
             const sortedByConceded = [...compTeams].map(t => {
                 const conceded = relevantFixtures.filter(f => f.homeTeamId === t.id || f.awayTeamId === t.id).reduce((acc, f) => {
                     const isHome = f.homeTeamId === t.id;
                     return acc + (isHome ? f.awayScore! : f.homeScore!);
                 }, 0);
                 return { name: t.name, conceded };
             }).sort((a,b) => a.conceded - b.conceded);

             if (relevantFixtures.length > 0) {
                 const bestAttack = sortedByGoals[0];
                 const bestDefense = sortedByConceded[0];
                 results.push({ label: 'En Çok Gol Atan Takım', value: `${bestAttack.goals} Gol - ${bestAttack.name}` });
                 results.push({ label: 'En Az Gol Yiyen Takım', value: `${bestDefense.conceded} Gol - ${bestDefense.name}` });
             }
             return results;
        };

        // Streaks Logic
        const calculateStreaks = () => {
             const results = [];
             let maxWinStreak = { count: 0, team: '-' };
             let maxUnbeaten = { count: 0, team: '-' };
             
             compTeams.forEach(t => {
                 const teamFixtures = relevantFixtures
                    .filter(f => f.homeTeamId === t.id || f.awayTeamId === t.id)
                    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                 
                 let currentWin = 0;
                 let currentUnbeaten = 0;
                 let tempMaxWin = 0;
                 let tempMaxUnbeaten = 0;
                 
                 teamFixtures.forEach(f => {
                     const isHome = f.homeTeamId === t.id;
                     const myScore = isHome ? f.homeScore! : f.awayScore!;
                     const opScore = isHome ? f.awayScore! : f.homeScore!;
                     
                     if (myScore > opScore) {
                         currentWin++;
                         currentUnbeaten++;
                     } else if (myScore === opScore) {
                         currentWin = 0;
                         currentUnbeaten++;
                     } else {
                         currentWin = 0;
                         currentUnbeaten = 0;
                     }
                     
                     if(currentWin > tempMaxWin) tempMaxWin = currentWin;
                     if(currentUnbeaten > tempMaxUnbeaten) tempMaxUnbeaten = currentUnbeaten;
                 });
                 
                 if (tempMaxWin > maxWinStreak.count) maxWinStreak = { count: tempMaxWin, team: t.name };
                 if (tempMaxUnbeaten > maxUnbeaten.count) maxUnbeaten = { count: tempMaxUnbeaten, team: t.name };
             });
             
             if (relevantFixtures.length > 0) {
                 results.push({ label: 'En Uzun Galibiyet Serisi', value: `${maxWinStreak.count} Maç - ${maxWinStreak.team}` });
                 results.push({ label: 'En Uzun Yenilmezlik Serisi', value: `${maxUnbeaten.count} Maç - ${maxUnbeaten.team}` });
             }
             return results;
        };

        // Results Logic
        const calculateResultsStats = () => {
            const results = [];
            let biggestWin = { diff: 0, match: '-' };
            let highestScoring = { sum: 0, match: '-' };
            let draws = 0;
            
            relevantFixtures.forEach(f => {
                const homeTeam = teams.find(t => t.id === f.homeTeamId)?.name || 'Ev Sahibi';
                const awayTeam = teams.find(t => t.id === f.awayTeamId)?.name || 'Deplasman';
                
                const diff = Math.abs((f.homeScore || 0) - (f.awayScore || 0));
                const sum = (f.homeScore || 0) + (f.awayScore || 0);
                
                if (diff > biggestWin.diff) biggestWin = { diff, match: `${homeTeam} ${f.homeScore}-${f.awayScore} ${awayTeam}` };
                if (sum > highestScoring.sum) highestScoring = { sum, match: `${homeTeam} ${f.homeScore}-${f.awayScore} ${awayTeam}` };
                if (f.homeScore === f.awayScore) draws++;
            });

            if (relevantFixtures.length > 0) {
                results.push({ label: 'En Farklı Skor', value: biggestWin.match });
                results.push({ label: 'En Gollü Maç', value: highestScoring.match });
                results.push({ label: 'Beraberlik Oranı', value: `%${Math.round((draws/relevantFixtures.length)*100)}` });
                results.push({ label: 'Toplam Gol', value: `${relevantFixtures.reduce((acc,f) => acc + (f.homeScore||0) + (f.awayScore||0), 0)}` });
            }
            return results;
        };

        // Attendance Logic
        const calculateAttendanceStats = () => {
            const results = [];
            let maxAtt = { val: 0, match: '-' };
            let minAtt = { val: 999999, match: '-' };
            let totalAtt = 0;
            
            relevantFixtures.forEach(f => {
                const homeTeam = compTeams.find(t => t.id === f.homeTeamId);
                const awayTeam = teams.find(t => t.id === f.awayTeamId);
                if (homeTeam) {
                    const seed = f.id.charCodeAt(0) + (f.homeScore || 0);
                    const randomFill = 0.6 + ((seed % 35) / 100); 
                    const attendance = Math.floor(homeTeam.stadiumCapacity * randomFill);
                    
                    if (attendance > maxAtt.val) maxAtt = { val: attendance, match: `${homeTeam.name} - ${awayTeam?.name || ''} (${f.homeScore}-${f.awayScore})` };
                    if (attendance < minAtt.val) minAtt = { val: attendance, match: `${homeTeam.name} - ${awayTeam?.name || ''} (${f.homeScore}-${f.awayScore})` };
                    totalAtt += attendance;
                }
            });
            
            if (relevantFixtures.length > 0) {
                results.push({ label: 'En Yüksek Seyirci', value: `${maxAtt.val.toLocaleString()} (${maxAtt.match})` });
                results.push({ label: 'En Düşük Seyirci', value: `${minAtt.val.toLocaleString()} (${minAtt.match})` });
                results.push({ label: 'Toplam Seyirci', value: totalAtt.toLocaleString() });
                results.push({ label: 'Ortalama Seyirci', value: Math.floor(totalAtt / relevantFixtures.length).toLocaleString() });
            }
            return results;
        };


        if (activeRecordTab === 'GENERAL') {
            if (recordTimeFilter === 'ALL_TIME') {
                const mostTitlesTeam = [...compTeams].sort((a,b) => b.championships - a.championships)[0];
                const mostTitlesValue = mostTitlesTeam ? `${mostTitlesTeam.championships} - ${mostTitlesTeam.name}` : '15 - Eşşekboğanspor FK';

                records.push(
                    { label: 'En Çok Kazanan', value: mostTitlesValue },
                    { label: 'Bir Sezonda En Fazla Puan', value: '105 - (Eşşekboğanspor FK) (1988/89)' },
                    { label: 'Bir Sezondaki En Düşük Puan', value: '11 - (Osurukspor) (2010/11)' },
                    { label: 'Bir Sezonda Ligde Alınan En Fazla Galibiyet', value: '30 - (Ayıboğanspor SK) (2002/03)' },
                    { label: 'Bir Sezonda Ligde Alınan En Az Galibiyet', value: '2 - (Bulgariaspor) (2010/11)' },
                    { label: 'Bir Sezonda Ligde Alınan En Fazla Mağlubiyet', value: '31 - (Tekirspor) (1995/96)' },
                    { label: 'Bir Sezonda Ligde Alınan En Az Mağlubiyet', value: '0 - (Kedispor) (1991/92)' },
                    { label: 'Bir Sezonda Ligde Alınan En Fazla Beraberlik', value: '18 - (İslamspor) (2005/06)' },
                    { label: 'Bir Sezonda Ligde Alınan En Az Beraberlik', value: '0 - (Hamsispor) (2014/15)' },
                    { label: 'En Yüksek Ortalama Seyirci', value: '62,412 (Eşşekboğanspor FK)' },
                    { label: 'En Düşük Ortalama Seyirci', value: '1,204 (Uzunoğullarıspor)' },
                    { label: 'En Yüksek Seyirci', value: '65,000 (Eşşekboğanspor FK - Ayıboğanspor SK, 22 Eylül 2018)' },
                    { label: 'En Düşük Seyirci', value: '75 (Osurukspor - Tekirspor, 29 Mayıs 2015)' },
                );
            } else {
                // *** AGGREGATE ALL SEASON RECORDS HERE ***
                
                // 1. Players
                records.push(...calculatePlayerStats());

                // 2. Teams
                records.push(...calculateTeamStats());

                // 3. Streaks
                records.push(...calculateStreaks());

                // 4. Results
                records.push(...calculateResultsStats());

                // 5. Attendance
                records.push(...calculateAttendanceStats());
            }
        } else if (activeRecordTab === 'PLAYERS') {
            const playerRes = calculatePlayerStats();
            if(playerRes.length > 0) records.push(...playerRes);
            else records.push({ label: 'Bir Sezonda En Fazla Gol', value: '-' }, { label: 'Bir Sezonda En Fazla Asist', value: '-' });
        } 
        else if (activeRecordTab === 'ATTENDANCE') {
            const attRes = calculateAttendanceStats();
            if(attRes.length > 0) records.push(...attRes);
            else records.push({ label: 'Veri Yok', value: 'Bu sezon henüz maç oynanmadı.' });
        }
        else if (activeRecordTab === 'RESULTS') {
            const resRes = calculateResultsStats();
            if(resRes.length > 0) records.push(...resRes);
            else records.push({ label: 'Veri Yok', value: 'Bu sezon henüz maç oynanmadı.' });
        }
        else if (activeRecordTab === 'STREAKS') {
             const strRes = calculateStreaks();
             if(strRes.length > 0) records.push(...strRes);
             else records.push({ label: 'Veri Yok', value: 'Bu sezon henüz maç oynanmadı.' });
        }
        else if (activeRecordTab === 'TEAMS') {
             const teamRes = calculateTeamStats();
             if(teamRes.length > 0) records.push(...teamRes);
             else records.push({ label: 'Veri Yok', value: 'Bu sezon henüz maç oynanmadı.' });
        }
        else {
            if (teams.length > 0) {
                if (activeRecordTab === 'GENERAL' && recordTimeFilter === 'ALL_TIME') {
                    // Fallback redundant check just in case
                     // Code already handled in main block
                }
            } else {
                 records.push({ label: 'Veri Yok', value: 'Takım verileri yüklenemedi.' });
            }
        }
        return records;
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1b1b1b]">
            <div className="flex bg-[#252525] border-b border-[#333] shrink-0 overflow-x-auto no-scrollbar">
                {[
                    { id: 'GENERAL', label: 'Genel Bakış' },
                    { id: 'ATTENDANCE', label: 'Seyirci' },
                    { id: 'RESULTS', label: 'Sonuçlar' },
                    { id: 'STREAKS', label: 'Seriler' },
                    { id: 'TEAMS', label: 'Takımlar' },
                    { id: 'PLAYERS', label: 'Oyuncular' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveRecordTab(tab.id as RecordTab)}
                        className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                            activeRecordTab === tab.id 
                            ? 'bg-[#6366f1] text-white' 
                            : 'text-slate-400 hover:text-white hover:bg-[#333]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-4 flex flex-col gap-4">
                {activeRecordTab === 'GENERAL' ? (
                    <div className="flex bg-[#111] p-1 rounded-lg border border-[#333] w-fit z-20">
                        <button 
                            onClick={() => setRecordTimeFilter('ALL_TIME')}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                                recordTimeFilter === 'ALL_TIME' 
                                ? 'bg-[#ff9f43] text-black shadow' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            Tüm Zamanlar
                        </button>
                        <button 
                            onClick={() => setRecordTimeFilter('SEASON')}
                            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                                recordTimeFilter === 'SEASON' 
                                ? 'bg-[#ff9f43] text-black shadow' 
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            Bu Sezon
                        </button>
                    </div>
                ) : (
                    <div className="flex bg-[#111] p-1 rounded-lg border border-[#333] w-fit z-20">
                       <span className="px-4 py-2 text-xs font-bold text-[#ff9f43]">BU SEZON</span>
                    </div>
                )}

                <div>
                    <h4 className="text-xl font-bold text-white uppercase tracking-wide">
                        {(activeRecordTab !== 'GENERAL') || recordTimeFilter === 'SEASON' ? 'Sezon İstatistikleri' : 'Tarihi Rekorlar'}
                    </h4>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
                <div className="flex flex-col rounded-lg overflow-hidden border border-[#333]">
                    {getDetailedRecords().map((rec, index) => (
                        <div 
                            key={index} 
                            className={`flex justify-between items-center p-4 border-b border-[#333] last:border-0 ${index % 2 === 0 ? 'bg-[#1f252b]' : 'bg-[#1b1b1b]'} hover:bg-[#252a33] transition-colors`}
                        >
                            <span className="text-sm font-medium text-slate-300">{rec.label}</span>
                            <span className="text-sm font-bold text-white text-right">{rec.value}</span>
                        </div>
                    ))}
                    {getDetailedRecords().length === 0 && (
                        <div className="p-8 text-center text-slate-500 italic">Kayıt bulunamadı.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
