
import React, { useState, useMemo } from 'react';
import { Team, ManagerProfile, Fixture, FanCulture } from '../types';
import { Target, ThumbsUp, ThumbsDown, Minus, CheckCircle2, XCircle, Clock, Award, Users, Building2, Activity, Star, Globe, Shield, Wallet, Coins, School, Swords, Hourglass, Hammer, TrendingDown, Landmark, Flag, Heart, Megaphone } from 'lucide-react';
import { calculatePlayerWage } from '../utils/teamCalculations';
import { RIVALRIES } from '../constants';

const FAN_CULTURE_CONFIG: Record<FanCulture, { label: string, color: string, border: string }> = {
    [FanCulture.PATIENT]: { label: 'Sabırlı', color: 'bg-blue-900/30 text-blue-400', border: 'border-blue-800' },
    [FanCulture.ATTACKING]: { label: 'Hücum Futbolu', color: 'bg-red-900/30 text-red-400', border: 'border-red-800' },
    [FanCulture.DISCIPLINED]: { label: 'Disiplinci', color: 'bg-slate-800 text-slate-300', border: 'border-slate-600' },
    [FanCulture.SUCCESS_ORIENTED]: { label: 'Başarı Odaklı', color: 'bg-yellow-900/30 text-yellow-400', border: 'border-yellow-800' },
    [FanCulture.REALIST]: { label: 'Realist', color: 'bg-gray-700 text-gray-300', border: 'border-gray-500' },
    [FanCulture.DERBY_LOVER]: { label: 'Derbici', color: 'bg-orange-900/30 text-orange-400', border: 'border-orange-800' },
    [FanCulture.DREAMER]: { label: 'Hayalperest', color: 'bg-purple-900/30 text-purple-400', border: 'border-purple-800' },
    [FanCulture.MEDIA_SAVVY]: { label: 'Medyacı', color: 'bg-cyan-900/30 text-cyan-400', border: 'border-cyan-800' },
    [FanCulture.ACADEMIC]: { label: 'Akademisyen', color: 'bg-emerald-900/30 text-emerald-400', border: 'border-emerald-800' }
};

interface ClubObjectivesViewProps {
    team: Team;
    manager: ManagerProfile;
    currentSeason: string;
    fixtures: Fixture[];
    currentWeek: number;
    teams: Team[]; // Added to calculate rank
}

const ClubObjectivesView: React.FC<ClubObjectivesViewProps> = ({ team, manager, currentSeason, fixtures, currentWeek, teams }) => {
    const [activeTab, setActiveTab] = useState<'BOARD' | 'FANS'>('BOARD');

    // Determine if it is the start of the game
    const isNewGame = manager.stats.matchesManaged === 0;

    // Check if it is the first season to hide Long Term Objectives
    const isFirstSeason = currentSeason === '2025/26';

    // --- DYNAMIC GRADE LOGIC (Board & Fans) ---
    const getConfidenceGrade = () => {
        // Determine which score to use based on the active tab
        const score = activeTab === 'BOARD' ? manager.trust.board : manager.trust.fans;
        const targetName = activeTab === 'BOARD' ? 'Yönetim' : 'Taraftar';

        // New Game Rule: Always start with D
        if (isNewGame) {
            return { 
                grade: 'D', 
                color: 'text-slate-400', 
                border: 'border-slate-500', 
                text: activeTab === 'BOARD' 
                    ? 'Yönetim henüz sizi tanımıyor, beklentiler nötr.' 
                    : 'Taraftarlar sizi sahada görmek için sabırsızlanıyor.' 
            };
        }

        // Logic based on specific percentages
        if (score >= 95) return { grade: 'A+', color: 'text-emerald-400', border: 'border-emerald-400', text: `Olağanüstü! ${targetName} size tapıyor.` };
        if (score >= 90) return { grade: 'A', color: 'text-emerald-500', border: 'border-emerald-500', text: `Harika bir güven ortamı.` };
        if (score >= 85) return { grade: 'B+', color: 'text-blue-400', border: 'border-blue-400', text: `${targetName} performansınızdan çok memnun.` };
        if (score >= 80) return { grade: 'B', color: 'text-blue-500', border: 'border-blue-500', text: `Beklentileri karşılıyorsunuz.` };
        if (score >= 75) return { grade: 'C+', color: 'text-cyan-400', border: 'border-cyan-400', text: `Gidişat olumlu.` };
        if (score >= 60) return { grade: 'C', color: 'text-yellow-400', border: 'border-yellow-400', text: `Durum stabil.` };
        if (score >= 50) return { grade: 'D+', color: 'text-yellow-600', border: 'border-yellow-600', text: `Krediniz azalıyor.` };
        
        // Below 50 (Critical Zones)
        if (score >= 45) return { grade: 'E', color: 'text-orange-500', border: 'border-orange-500', text: `Güven sarsıldı.` };
        if (score >= 40) return { grade: 'E-', color: 'text-orange-600', border: 'border-orange-600', text: `Ciddi eleştiriler var.` };
        if (score >= 35) return { grade: 'F', color: 'text-red-500', border: 'border-red-500', text: `Tehlike çanları çalıyor.` };
        
        // Below 35
        return { grade: 'F-', color: 'text-red-600', border: 'border-red-700', text: `İpler kopma noktasında.` };
    };

    const gradeInfo = getConfidenceGrade();

    // --- DYNAMIC FEEDBACK GENERATION ---
    const feedbacks = useMemo(() => {
        // New Game Rule: No feedbacks initially
        if (isNewGame) return [];

        const list: { type: 'pos' | 'neg' | 'neu', text: string }[] = [];

        // 1. Wage Budget Check (Strict)
        const totalWages = team.players.reduce((acc, p) => acc + (p.wage !== undefined ? p.wage : calculatePlayerWage(p)), 0);
        const wageBudget = team.wageBudget || 0;
        
        if (totalWages > wageBudget) {
            list.push({ type: 'neg', text: 'Maaş bütçesinin aşılması yönetimde ciddi rahatsızlık yaratıyor.' });
        } else if (totalWages < wageBudget * 0.9) {
            list.push({ type: 'pos', text: 'Maaş bütçesi kontrol altında tutuluyor.' });
        }

        // 2. Atmosphere / Morale Check
        const avgMorale = team.players.reduce((a, b) => a + b.morale, 0) / team.players.length;
        if (avgMorale > 80) {
            list.push({ type: 'pos', text: 'Tesislerdeki olumlu atmosferden ve oyuncu moralinden çok memnunlar.' });
        } else if (avgMorale < 50) {
            list.push({ type: 'neg', text: 'Oyuncular arasındaki huzursuzluk ve düşük moral endişe verici.' });
        }

        // 3. Manager Relations
        const avgTrust = manager.trust.players;
        if (avgTrust > 80) {
            list.push({ type: 'pos', text: 'Oyuncuların menajere olan inancı tam.' });
        } else if (avgTrust < 40) {
            list.push({ type: 'neg', text: 'Bazı oyuncuların menajerin otoritesini sorguladığı konuşuluyor.' });
        }

        // 4. Recent Form (Last 3 Matches)
        const playedFixtures = fixtures
            .filter(f => f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3);

        if (playedFixtures.length > 0) {
            const wins = playedFixtures.filter(f => {
                const isHome = f.homeTeamId === team.id;
                return isHome ? f.homeScore! > f.awayScore! : f.awayScore! > f.homeScore!;
            }).length;
            const losses = playedFixtures.filter(f => {
                const isHome = f.homeTeamId === team.id;
                return isHome ? f.homeScore! < f.awayScore! : f.awayScore! < f.homeScore!;
            }).length;

            if (wins === 3) list.push({ type: 'pos', text: 'Son maçlardaki galibiyet serisi takdir ediliyor.' });
            else if (losses >= 2) list.push({ type: 'neg', text: 'Son haftalardaki puan kayıpları eleştiri topluyor.' });
        }

        // 5. Transfer Balance (If current month has transfers)
        if (manager.stats.transferIncomeThisMonth > manager.stats.transferSpendThisMonth) {
            list.push({ type: 'pos', text: 'Transferde elde edilen kar yönetimi memnun etti.' });
        }

        // Default filler if empty (but not new game)
        if (list.length === 0) {
            list.push({ type: 'neu', text: 'Gidişat stabil görünüyor, henüz belirgin bir eleştiri yok.' });
        }

        return list;
    }, [team, manager, fixtures, isNewGame]);

    // --- NEW LOGIC: DYNAMIC LEAGUE OBJECTIVE ---
    const getDynamicLeagueObjective = () => {
        const currentLeagueId = team.leagueId || 'LEAGUE';
        const leagueTeams = teams.filter(t => (t.leagueId || 'LEAGUE') === currentLeagueId);
        const strengthSorted = [...leagueTeams].sort((a, b) => b.strength - a.strength);
        const strengthRank = strengthSorted.findIndex(t => t.id === team.id) + 1;

        const lastHistory = team.leagueHistory && team.leagueHistory.length > 0 ? team.leagueHistory[team.leagueHistory.length - 1] : null;
        const lastSeasonRank = lastHistory ? lastHistory.rank : strengthRank;

        const diff = strengthRank - lastSeasonRank;
        const shift = Math.round(diff * 0.5);
        let calculatedTarget = Math.max(1, strengthRank - shift);
        
        const maxDeviation = 2;
        const minAllowed = Math.max(1, strengthRank - maxDeviation);
        const maxAllowed = strengthRank + maxDeviation;

        let finalTarget = Math.min(maxAllowed, Math.max(minAllowed, calculatedTarget));
        let text = '';
        
        if (finalTarget === 1) text = 'Şampiyonluk Hedefi';
        else if (finalTarget <= 2) text = 'Zirve Yarışı';
        else if (finalTarget <= 4) text = 'Avrupa Bileti Hedefi';
        else if (finalTarget <= 8) text = 'Üst Sıralar';
        else if (finalTarget <= 12) text = 'Orta Sıralarda Güvenli Bölge';
        else { text = 'Ligde Kalmak'; finalTarget = 15; }

        return { text, maxRank: finalTarget };
    };

    // Calculate current rank (Live)
    const sortedTeams = [...teams].filter(t => (t.leagueId || 'LEAGUE') === (team.leagueId || 'LEAGUE')).sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        return (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga);
    });
    const currentRank = sortedTeams.findIndex(t => t.id === team.id) + 1;
    const leagueTarget = getDynamicLeagueObjective();
    const isLeagueTargetMet = currentRank <= leagueTarget.maxRank;
    const leagueStatus = isLeagueTargetMet ? 'success' : 'fail';
    const leagueStatusText = isLeagueTargetMet ? `Yolunda (${currentRank}.)` : `Riskli (${currentRank}.)`;

    // --- FINANCIAL OBJECTIVE LOGIC ---
    // UPDATED: Reputation Based (Rep > 3.5 => Transfer Budget, Rep <= 3.5 => Wage Budget)
    const useTransferBudgetObjective = team.reputation > 3.5;

    let financialObj;

    if (useTransferBudgetObjective) {
        // Transfer Budget Objective (Rich/High Rep Clubs)
        const isSuccess = team.budget >= 0;
        financialObj = {
            name: 'Transfer Bütçesini Aşma',
            importance: 'Yüksek',
            status: isSuccess ? 'success' : 'fail',
            statusText: isSuccess ? 'Başarılı' : `Başarısız (${team.budget.toFixed(1)} M€)`,
            icon: Coins,
            color: 'text-emerald-400'
        };
    } else {
        // Wage Budget Objective (Lower Rep/Smaller Clubs)
        const currentTotalWages = team.players.reduce((acc, p) => acc + (p.wage !== undefined ? p.wage : calculatePlayerWage(p)), 0);
        const isSuccess = team.wageBudget && team.wageBudget >= currentTotalWages;
        financialObj = {
            name: 'Maaş Bütçesine Sadık Kalmak',
            importance: 'Orta',
            status: isSuccess ? 'success' : 'fail',
            statusText: isSuccess ? 'Başarılı' : 'Başarısız (Limit Aşıldı)',
            icon: Wallet,
            color: 'text-slate-400'
        };
    }

    // --- YOUTH DEVELOPMENT / ACADEMY OBJECTIVE (50/50 SPLIT) ---
    // 1. Filter all played matches for this team
    const matchesPlayedSoFar = fixtures.filter(f => f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id));
    
    // Deterministic random choice for objective type based on Season + Team ID
    const seasonStartYear = parseInt(currentSeason.split('/')[0]);
    const objectiveSeed = team.id.charCodeAt(0) + seasonStartYear;
    const isAcademyObjective = objectiveSeed % 2 !== 0; // 50% chance for Academy Objective

    let youthObj;

    if (isAcademyObjective) {
        // --- ACADEMY OBJECTIVE: 2 Players, 30% Playtime ---
        const totalMatchesCount = matchesPlayedSoFar.length;
        const minMatchesRequired = Math.max(1, Math.ceil(totalMatchesCount * 0.30));

        // Define Academy Players: Age <= 19
        const academyCandidates = team.players.filter(p => p.age <= 19);
        
        // Count how many meet the criteria
        const qualifyingPlayers = academyCandidates.filter(p => p.seasonStats.matchesPlayed >= minMatchesRequired);
        const successCount = qualifyingPlayers.length;
        
        const isAcademySuccess = successCount >= 2;
        const academyStatusText = isAcademySuccess 
            ? `Başarılı (${qualifyingPlayers.map(p=>p.name).join(', ')})` 
            : `Süreçte (${successCount}/2 Oyuncu - Min %30 Maç)`;

        youthObj = { 
            name: 'Akademiden 2 Oyuncu Kazanmak (Min. %30 Süre)', 
            importance: 'Orta', 
            status: isAcademySuccess ? 'success' : 'pending',
            statusText: academyStatusText,
            icon: School,
            color: 'text-orange-400'
        };

    } else {
        // --- STANDARD YOUTH DEVELOPMENT: Total U21 Playtime % ---
        // 2. Identify U21 players (Age <= 21)
        const u21PlayerIds = new Set(team.players.filter(p => p.age <= 21).map(p => p.id));
        
        // 3. Count matches where at least one U21 player featured
        let matchesWithYouthPresence = 0;
        matchesPlayedSoFar.forEach(f => {
            const isHome = f.homeTeamId === team.id;
            const ratings = isHome ? f.stats?.homeRatings : f.stats?.awayRatings;
            
            if (ratings && ratings.some(r => u21PlayerIds.has(r.playerId))) {
                matchesWithYouthPresence++;
            }
        });

        // 4. Calculate Percentage (Target is 30%)
        const youthPercentage = matchesPlayedSoFar.length > 0 ? (matchesWithYouthPresence / matchesPlayedSoFar.length) * 100 : 0;
        const isYouthSuccess = youthPercentage >= 30;
        const youthStatusText = matchesPlayedSoFar.length > 0 
            ? `%${youthPercentage.toFixed(1)} Oynama (Hedef: %30)` 
            : 'Veri Bekleniyor';

        youthObj = { 
            name: 'Genç Oyuncu Geliştirmek (U21)', 
            importance: 'Düşük', 
            status: isYouthSuccess ? 'success' : 'pending',
            statusText: youthStatusText,
            icon: Users,
            color: 'text-indigo-400'
        };
    }

    // --- REPUTATION LOGIC (UPDATED: Season End Check & Top Team Check) ---
    // 1. Check if the league season is finished (All matches played)
    const leagueMatches = fixtures.filter(f => 
        (f.competitionId === 'LEAGUE' || f.competitionId === 'LEAGUE_1' || !f.competitionId) &&
        (f.homeTeamId === team.id || f.awayTeamId === team.id)
    );
    const totalLeagueMatches = leagueMatches.length;
    const isSeasonFinished = totalLeagueMatches > 0 && leagueMatches.every(f => f.played);

    // Calculate Max Reputation in current League
    const currentLeagueId = team.leagueId || 'LEAGUE';
    const leagueTeamsList = teams.filter(t => (t.leagueId || 'LEAGUE') === currentLeagueId);
    const maxLeagueRep = Math.max(...leagueTeamsList.map(t => t.reputation));
    
    // Check if the current team is the most reputable
    const isMostReputable = team.reputation >= maxLeagueRep;

    let repStatus = 'pending';
    let repStatusText = 'Süreçte';
    let repObjectiveName = 'Kulüp İtibarını Artırmak';

    if (isMostReputable) {
        repObjectiveName = 'Ligin En İtibarlı Takımı Konumunu Korumak';
        
        // Maintain Logic: Success if we are currently top, fail if we dropped below someone else
        if (team.reputation >= maxLeagueRep) {
            repStatus = 'success'; // Currently holding the title
            repStatusText = isSeasonFinished ? 'Başarılı (Zirve Korundu)' : 'Zirvede';
        } else {
            repStatus = 'fail';
            repStatusText = isSeasonFinished ? 'Başarısız (Zirve Kaptırıldı)' : 'İtibar Kaybedildi';
        }
    } else {
        // Standard Increase Logic
        const initialRep = team.initialReputation || team.reputation;
        const currentRep = team.reputation;
        const repDiff = currentRep - initialRep;

        if (isSeasonFinished) {
            if (repDiff >= 0.1) {
                repStatus = 'success';
                repStatusText = `Başarılı (+${repDiff.toFixed(1)})`;
            } else {
                repStatus = 'fail';
                repStatusText = `Başarısız (${repDiff >= 0 ? '+' : ''}${repDiff.toFixed(1)})`;
            }
        } else {
            // While season is ongoing
            const isCurrentlyAhead = repDiff >= 0.1;
            repStatusText = isCurrentlyAhead 
                ? `Şu an Hedefte (+${repDiff.toFixed(1)})` 
                : `Süreçte (${repDiff >= 0 ? '+' : ''}${repDiff.toFixed(1)})`;
        }
    }

    // --- DYNAMIC CUP OBJECTIVES ---
    const objectives: any[] = [
        { 
            name: `Lig: ${leagueTarget.text}`, 
            importance: 'Zorunlu', 
            status: leagueStatus,
            statusText: leagueStatusText,
            icon: Target,
            color: 'text-blue-500'
        }
    ];

    // 1. Türkiye Kupası (Varsayılan olarak herkes katılır)
    // Önem: Küçük takımlar için çok yüksek, büyük takımlar için orta/düşük.
    let cupImportance = 'Orta';
    if (team.strength < 70) cupImportance = 'Çok Yüksek';
    else if (team.strength < 80) cupImportance = 'Yüksek';
    else if (team.strength > 85) cupImportance = 'Düşük';

    let cupStatus = 'pending';
    let cupText = 'Maç Bekleniyor';

    // Check played cup matches for current season
    const cupFixturesList = fixtures.filter(f => f.competitionId === 'CUP' && f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id));
    
    if (cupFixturesList.length > 0) {
        cupText = 'Devam Ediyor';
        
        // Find most recent cup match
        const lastCupMatch = cupFixturesList.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        if (lastCupMatch) {
            const isHome = lastCupMatch.homeTeamId === team.id;
            const myScore = isHome ? lastCupMatch.homeScore! : lastCupMatch.awayScore!;
            const opScore = isHome ? lastCupMatch.awayScore! : lastCupMatch.homeScore!;
            
            // PK Check
            let won = myScore > opScore;
            if (myScore === opScore && lastCupMatch.pkHome !== undefined) {
                won = isHome ? lastCupMatch.pkHome > lastCupMatch.pkAway! : lastCupMatch.pkAway! > lastCupMatch.pkHome!;
            }

            if (!won) {
                cupStatus = 'fail';
                cupText = 'Elendi';
            } else if (lastCupMatch.week === 104) {
                // If we won the last match AND it was the final
                cupStatus = 'success';
                cupText = 'KAZANILDI';
            }
        }
    }
    
    objectives.push({
        name: team.strength > 80 ? 'Türkiye Kupası: Rotasyonla İlerle' : 'Türkiye Kupası: Final Oynamak',
        importance: cupImportance,
        status: cupStatus,
        statusText: cupText,
        icon: Shield,
        color: 'text-green-600'
    });

    // 2. Süper Kupa (Katılım Varsa)
    const superCupFixture = fixtures.find(f => f.competitionId === 'SUPER_CUP' && (f.homeTeamId === team.id || f.awayTeamId === team.id));
    if (superCupFixture) {
        let scImportance = 'Yüksek';
        let scTarget = 'Süper Kupa: Şampiyonluk';
        if (team.strength > 85) {
            scImportance = 'Düşük'; // Big team routine
            scTarget = 'Süper Kupa: Müzeye Götür';
        } else {
            scImportance = 'Çok Yüksek'; // Massive for small team
            scTarget = 'Süper Kupa: Tarihi Fırsat';
        }

        let scStatus = 'pending';
        let scText = 'Maç Bekleniyor';
        
        if (superCupFixture.played) {
            const isHome = superCupFixture.homeTeamId === team.id;
            const myScore = isHome ? superCupFixture.homeScore! : superCupFixture.awayScore!;
            const opScore = isHome ? superCupFixture.awayScore! : superCupFixture.homeScore!;
             let won = myScore > opScore;
             if (myScore === opScore && superCupFixture.pkHome !== undefined) {
                won = isHome ? superCupFixture.pkHome > superCupFixture.pkAway! : superCupFixture.pkAway! > superCupFixture.pkHome!;
             }

             if (won) { scStatus = 'success'; scText = 'KAZANILDI'; }
             else { scStatus = 'fail'; scText = 'KAYBEDİLDİ'; }
        }

        objectives.push({
            name: scTarget,
            importance: scImportance,
            status: scStatus,
            statusText: scText,
            icon: Star,
            color: 'text-yellow-500'
        });
    }

    // 3. Avrupa Kupası (Katılım Varsa)
    const inEurope = fixtures.some(f => f.competitionId === 'EUROPE' && (f.homeTeamId === team.id || f.awayTeamId === team.id));
    
    if (inEurope) {
        let euImportance = 'Yüksek';
        let euTarget = 'Avrupa Ligi: Gruplardan Çıkmak';

        // --- DYNAMIC EURO TARGET LOGIC ---
        // Find all participants based on fixtures to calculate relative strength
        const euroFixtures = fixtures.filter(f => f.competitionId === 'EUROPE');
        const participantIds = new Set<string>();
        euroFixtures.forEach(f => {
            participantIds.add(f.homeTeamId);
            participantIds.add(f.awayTeamId);
        });

        // Determine Rank among participants
        if (participantIds.size > 0) {
            const euroParticipants = teams.filter(t => participantIds.has(t.id));
            const sortedByStrength = [...euroParticipants].sort((a, b) => b.strength - a.strength);
            const myRank = sortedByStrength.findIndex(t => t.id === team.id) + 1;
            
            // Assign target based on Power Ranking
            if (myRank <= 4) {
                euTarget = 'Avrupa Ligi: Şampiyonluk';
                euImportance = 'Çok Yüksek';
            } else if (myRank <= 8) {
                euTarget = 'Avrupa Ligi: Yarı Final';
                euImportance = 'Yüksek';
            } else if (myRank <= 16) {
                euTarget = 'Avrupa Ligi: Çeyrek Final';
                euImportance = 'Yüksek';
            } else if (myRank <= 24) {
                euTarget = 'Avrupa Ligi: Son 16 Turu';
                euImportance = 'Orta';
            } else if (myRank <= 32) {
                euTarget = 'Avrupa Ligi: Play-Off Turu'; // Top 24 in League Table
                euImportance = 'Yüksek';
            } else {
                euTarget = 'Avrupa Ligi: Lig Aşaması';
                euImportance = 'Düşük';
            }
        } else {
            // Fallback (Pre-season/Pre-draw)
             if (team.strength > 85) {
                euTarget = 'Avrupa Ligi: Yarı Final / Final';
                euImportance = 'Çok Yüksek';
            } else if (team.strength < 75) {
                euTarget = 'Avrupa Ligi: Lig Aşaması';
                euImportance = 'Yüksek'; 
            } else {
                euTarget = 'Avrupa Ligi: Son 16 Turu';
                euImportance = 'Yüksek';
            }
        }
        // --- END DYNAMIC EURO TARGET LOGIC ---

        let euStatus = 'pending';
        let euText = 'Devam Ediyor';
        
        // Check if eliminated
        const myEuroFixtures = fixtures.filter(f => f.competitionId === 'EUROPE' && (f.homeTeamId === team.id || f.awayTeamId === team.id));
        const lastEuro = myEuroFixtures.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        // Simple logic for display: If still active in tournament (fixtures pending or won last round), status is pending/good.
        // If lost knockout, status fail.
        if (lastEuro && lastEuro.played && lastEuro.week > 208) {
             // In Knockout Phase
             const hasFutureMatch = myEuroFixtures.some(f => !f.played);
             if (!hasFutureMatch) {
                 // Likely Eliminated
                 const isHome = lastEuro.homeTeamId === team.id;
                 const wonLast = isHome ? lastEuro.homeScore! > lastEuro.awayScore! : lastEuro.awayScore! > lastEuro.homeScore!;
                 // This is simplistic. Real elimination check is in game engine.
                 // For UI purpose, if no future match and weeks < Final, say Eliminated.
                 if (currentWeek < 217) {
                     euStatus = 'fail';
                     euText = 'Elendi';
                 } else if (currentWeek === 217 && lastEuro.week === 217) {
                     // Final played
                     if (wonLast) { euStatus = 'success'; euText = 'KAZANILDI'; }
                     else { euStatus = 'fail'; euText = 'Finalist'; }
                 }
             }
        }

        objectives.push({
            name: euTarget,
            importance: euImportance,
            status: euStatus,
            statusText: euText,
            icon: Globe,
            color: 'text-blue-500'
        });
    }

    // --- RIVAL CUP CLASH OBJECTIVE ---
    // Check if we play against a rival in ANY Cup competition (CUP, SUPER_CUP, EUROPE)
    let rivalCupObj = null;

    // 1. Identify Rivals
    const myRivalNames = new Set<string>();
    RIVALRIES.forEach(pair => {
        if (pair.includes(team.name)) {
            pair.forEach(n => {
                if (n !== team.name) myRivalNames.add(n);
            });
        }
    });

    if (myRivalNames.size > 0) {
        // 2. Find FIRST cup fixture against a rival
        const rivalFixture = fixtures.find(f => {
            // Must be a Cup
            const isCupComp = ['CUP', 'SUPER_CUP', 'EUROPE'].includes(f.competitionId || '');
            if (!isCupComp) return false;

            // Must involve us
            if (f.homeTeamId !== team.id && f.awayTeamId !== team.id) return false;

            // Must involve a rival
            const isHome = f.homeTeamId === team.id;
            const opponentId = isHome ? f.awayTeamId : f.homeTeamId;
            const opponent = teams.find(t => t.id === opponentId);
            
            return opponent && myRivalNames.has(opponent.name);
        });

        if (rivalFixture) {
            const isHome = rivalFixture.homeTeamId === team.id;
            const opponentId = isHome ? rivalFixture.awayTeamId : rivalFixture.homeTeamId;
            const opponent = teams.find(t => t.id === opponentId);
            const opponentName = opponent ? opponent.name : 'Ezeli Rakip';

            let rStatus = 'pending';
            let rText = 'Maç Bekleniyor';
            
            if (rivalFixture.played) {
                const myScore = isHome ? rivalFixture.homeScore! : rivalFixture.awayScore!;
                const opScore = isHome ? rivalFixture.awayScore! : rivalFixture.homeScore!;
                
                let won = myScore > opScore;
                // Check penalties if draw
                if (myScore === opScore && rivalFixture.pkHome !== undefined) {
                    won = isHome ? rivalFixture.pkHome > rivalFixture.pkAway! : rivalFixture.pkAway! > rivalFixture.pkHome!;
                }

                if (won) {
                    rStatus = 'success';
                    rText = 'BAŞARILI';
                } else {
                    rStatus = 'fail';
                    rText = 'BAŞARISIZ';
                }
            }

            rivalCupObj = {
                name: `Kupa Derbisi: ${opponentName} Engelini Aşmak`,
                importance: 'Orta',
                status: rStatus,
                statusText: rText,
                icon: Swords,
                color: 'text-orange-500'
            };
        }
    }

    if (rivalCupObj) {
        objectives.push(rivalCupObj);
    }

    // Add Standard Objectives
    objectives.push(
        financialObj,
        youthObj, // Updated Youth Objective (Can be U21 or Academy)
        { 
            name: repObjectiveName, 
            importance: 'Yüksek', 
            status: repStatus,
            statusText: repStatusText,
            icon: Award,
            color: 'text-purple-400'
        }
    );

    // --- LONG TERM OBJECTIVES LOGIC (NEW) ---
    const longTermObjectives: any[] = [];
    
    if (!isFirstSeason) {
        // 1. Stadium
        if (!team.boardRequests.stadiumBuilt && team.stadiumCapacity < 50000) {
            longTermObjectives.push({
                name: 'Yeni Stadyum İnşası',
                target: 'Modern ve Büyük Arena',
                status: 'Süreçte',
                icon: Hammer,
                color: 'text-blue-400'
            });
        }
        
        // 2. Youth Academy
        if (team.facilities.youthLevel < 20) {
            longTermObjectives.push({
                name: 'Gençlik Altyapısını Geliştir',
                target: 'Dünya Standartlarında Akademi',
                status: 'Süreçte',
                icon: School,
                color: 'text-green-400'
            });
        }

        // 3. Debt Reduction
        if ((team.initialDebt || 0) > 30) {
            longTermObjectives.push({
                name: 'Kulüp Borcunu Azalt',
                target: 'Mali İstikrar',
                status: `Mevcut: ${(team.initialDebt || 0).toFixed(1)} M€`,
                icon: TrendingDown,
                color: 'text-red-400'
            });
        }
    }

    const getImportanceBar = (imp: string) => {
        let width = 'w-full';
        let color = 'bg-purple-500';
        if (imp === 'Çok Yüksek') { width = 'w-full'; color = 'bg-red-600'; }
        else if (imp === 'Zorunlu') { width = 'w-full'; color = 'bg-red-600'; }
        else if (imp === 'Yüksek') { width = 'w-3/4'; color = 'bg-blue-500'; }
        else if (imp === 'Orta') { width = 'w-1/2'; color = 'bg-yellow-500'; }
        else if (imp === 'Düşük') { width = 'w-1/4'; color = 'bg-slate-500'; }
        
        return (
            <div className="flex flex-col gap-1 w-24">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{imp}</span>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{width: imp === 'Zorunlu' || imp === 'Çok Yüksek' ? '100%' : imp === 'Yüksek' ? '75%' : imp === 'Orta' ? '50%' : '25%'}}></div>
                </div>
            </div>
        );
    };

    const getStatusBadge = (status: string, text: string) => {
        if (status === 'success') return <span className="bg-green-900/40 text-green-400 border border-green-600/50 px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> {text}</span>;
        if (status === 'fail') return <span className="bg-red-900/40 text-red-400 border border-red-600/50 px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><XCircle size={12}/> {text}</span>;
        return <span className="bg-slate-700/40 text-slate-300 border border-slate-600/50 px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><Clock size={12}/> {text}</span>;
    };

    return (
        <div className="h-full bg-[#111827] overflow-hidden flex flex-col md:flex-row p-4 gap-4">
            
            {/* LEFT COLUMN: FEEDBACK */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
                {/* Toggle Header */}
                <div className="bg-[#1f2937] rounded-lg p-1 flex gap-1 border border-slate-700">
                    <button 
                        onClick={() => setActiveTab('BOARD')}
                        className={`flex-1 py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'BOARD' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Building2 size={16}/> Yönetim
                    </button>
                    <button 
                        onClick={() => setActiveTab('FANS')}
                        className={`flex-1 py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'FANS' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Users size={16}/> Taraftar
                    </button>
                </div>

                {/* Main Feedback Card */}
                <div className="flex-1 bg-[#1f2937] rounded-xl border border-slate-700 p-6 flex flex-col shadow-xl">
                    <div className="flex flex-col items-center justify-center mb-8 border-b border-slate-700 pb-6">
                        <div className={`w-24 h-24 rounded-full border-4 ${gradeInfo.border} flex items-center justify-center text-5xl font-black ${gradeInfo.color} bg-slate-900 shadow-2xl mb-4`}>
                            {gradeInfo.grade}
                        </div>
                        <p className="text-slate-300 text-center text-sm font-medium px-4 leading-relaxed">
                            {gradeInfo.text}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {activeTab === 'FANS' && (
                            <div className="mb-6 border-b border-slate-700 pb-6 px-2">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                    <Flag size={14}/> Taraftar Kültürü
                                </h3>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {/* Dynamic Tags */}
                                    {team.fanCultures && team.fanCultures.length > 0 ? (
                                        team.fanCultures.map((culture, idx) => {
                                            const config = FAN_CULTURE_CONFIG[culture] || { label: culture, color: 'bg-slate-800 text-slate-400', border: 'border-slate-600' };
                                            return (
                                                <span key={idx} className={`px-3 py-1 rounded-full text-xs font-bold border ${config.color} ${config.border}`}>
                                                    {config.label}
                                                </span>
                                            );
                                        })
                                    ) : (
                                        <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-bold border border-slate-600">Standart</span>
                                    )}
                                </div>

                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                    <Heart size={14}/> Taraftar Beklentisi
                                </h3>
                                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 text-center">
                                    <p className="text-xs text-slate-500 italic">
                                        Özel taraftar beklentileri yakında eklenecek...
                                    </p>
                                </div>
                            </div>
                        )}

                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Önemli Anlar ve Eleştiriler</h3>
                        
                        <div className="space-y-4">
                            {feedbacks.length === 0 ? (
                                <div className="text-center text-slate-500 italic text-sm py-4">
                                    Sezon henüz yeni başladı. Raporlar yakında burada görünecek.
                                </div>
                            ) : (
                                feedbacks.map((fb, idx) => (
                                    <div key={idx} className="flex gap-3 items-start animate-in slide-in-from-left-2">
                                        <div className={`mt-0.5 shrink-0 ${fb.type === 'pos' ? 'text-green-500' : fb.type === 'neg' ? 'text-red-500' : 'text-slate-500'}`}>
                                            {fb.type === 'pos' ? <ThumbsUp size={16} fill="currentColor" className="opacity-20"/> : fb.type === 'neg' ? <ThumbsDown size={16} fill="currentColor" className="opacity-20"/> : <Minus size={16}/>}
                                        </div>
                                        <p className="text-sm text-slate-300 leading-snug">{fb.text}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: OBJECTIVES (NO TABS) */}
            <div className="flex-1 bg-[#1f2937] rounded-xl border border-slate-700 flex flex-col shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-[#111827]/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Target className="text-red-500"/> Sezon Hedefleri
                    </h2>
                    <div className="text-xs text-slate-500 font-mono font-bold uppercase bg-[#111827] px-3 py-1 rounded border border-slate-700">
                        {currentSeason}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="space-y-1">
                        <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold text-slate-500 uppercase border-b border-slate-700 mb-2">
                            <div className="col-span-6">Hedef</div>
                            <div className="col-span-3">Önem</div>
                            <div className="col-span-3 text-right">Değerlendirme</div>
                        </div>
                        {objectives.map((obj, i) => (
                            <div key={i} className="grid grid-cols-12 px-4 py-4 items-center bg-[#111827]/30 rounded-lg border border-slate-700/50 hover:bg-[#111827]/50 transition mb-2">
                                <div className="col-span-6 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                                            {React.createElement(obj.icon, { size: 20, className: obj.color })}
                                        </div>
                                        <span className="font-bold text-slate-200 text-sm">{obj.name}</span>
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    {getImportanceBar(obj.importance)}
                                </div>
                                <div className="col-span-3 flex justify-end">
                                    {getStatusBadge(obj.status, obj.statusText)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* NEW: LONG TERM OBJECTIVES SECTION */}
                    {longTermObjectives.length > 0 && (
                        <div className="mt-8 pt-6 border-t-2 border-slate-700/50">
                            <div className="flex items-center gap-2 mb-4">
                                <Hourglass size={20} className="text-cyan-400" />
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Uzun Vadeli Hedefler</h3>
                                <span className="bg-cyan-900/30 text-cyan-400 text-[10px] px-2 py-0.5 rounded font-bold border border-cyan-700/50">5 YILLIK PLAN</span>
                            </div>

                            <div className="space-y-3">
                                {longTermObjectives.map((obj, i) => (
                                    <div key={i} className="flex items-center justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700 hover:border-slate-600 transition">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-900 p-3 rounded-full border border-slate-700">
                                                {React.createElement(obj.icon, { size: 20, className: obj.color })}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{obj.name}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">{obj.target}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                                            <Clock size={12} className="text-slate-500"/>
                                            <span className="text-xs font-bold text-slate-300">{obj.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClubObjectivesView;
