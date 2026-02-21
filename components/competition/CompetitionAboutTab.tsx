
import React, { useState, useMemo } from 'react';
import { Trophy, History, Medal, Star, List, Scroll, Award, TrendingUp, Users, Maximize2, X, AlertCircle, StarHalf, Goal, Shield, Activity, TrendingDown, Clock, ArrowRight, ChevronDown, ArrowUp, ArrowDown, Minus, Globe, CalendarDays, CheckCircle2, User, Hand, ChevronRight, Briefcase, Target } from 'lucide-react';
import { Player, Position, PlayerPersonality, Team, Fixture } from '../../types';
import PlayerFace from '../shared/PlayerFace';
import { FACE_ASSETS, COUNTRY_CODES } from '../../data/uiConstants';

// Sub Components
import { RecordsCard, RecordsModalContent } from './about/RecordsCard';
import { ChampionsCard, ChampionsModalContent } from './about/ChampionsCard';
import { RankingsCard, RankingsModalContent } from './about/RankingsCard';
import { AwardsCard } from './about/AwardsCard';
import { AwardsPodium } from './about/AwardsPodium';
import { RulesModal } from './about/RulesModal';

interface CompetitionAboutTabProps {
    competitionId: string;
    competitionName: string;
    teams?: Team[]; // Now Optional but expected
    fixtures?: Fixture[]; // Now Optional but expected
}

// --- STATIC HISTORY DATA ---
const PAST_SUPER_CUP_WINNERS = [
    { year: '2024/25', teamName: 'Kedispor' },
    { year: '2023/24', teamName: 'Ayıboğanspor SK' },
    { year: '2022/23', teamName: 'Eşşekboğanspor FK' },
    { year: '2021/22', teamName: 'Arıspor' },
    { year: '2020/21', teamName: 'Ayıboğanspor SK' },
    { year: '2019/20', teamName: 'Ayıboğanspor SK' }
];

const PAST_CUP_WINNERS = [
    { year: '2024/25', teamName: 'Kedispor' },
    { year: '2023/24', teamName: 'Ayıboğanspor SK' },
    { year: '2022/23', teamName: 'Ayıboğanspor SK' },
    { year: '2021/22', teamName: 'Ayıboğanspor SK' },
    { year: '2020/21', teamName: 'Ayıboğanspor SK' },
    { year: '2019/20', teamName: 'Maymunspor' }
];

const PAST_EURO_WINNERS = [
    { year: '2024/25', teamName: 'Gorilla United' },
    { year: '2023/24', teamName: 'Gorilla United' },
    { year: '2022/23', teamName: 'Aslanspor SK' },
    { year: '2021/22', teamName: 'Aslanspor SK' },
    { year: '2020/21', teamName: 'Aslanspor SK' },
    { year: '2019/20', teamName: 'Aslanspor SK' }
];

const CompetitionAboutTab: React.FC<CompetitionAboutTabProps> = ({ competitionId, competitionName, teams = [], fixtures = [] }) => {
    const [openDetail, setOpenDetail] = useState<string | null>(null);

    // --- HISTORY AGGREGATION LOGIC ---
    const fullHistory = useMemo(() => {
        // CASE 1: LIG (LEAGUE / LEAGUE_1) - Veriyi Takımların Geçmişinden Al
        if (competitionId === 'LEAGUE' || competitionId === 'LEAGUE_1') {
            const historyMap: Record<string, { first: Team | null, second: Team | null, third: Team | null }> = {};
            
            // Fix: Iterate ALL teams, not just current league teams.
            // A team currently in League 1 might have won the Super League in 1990.
            teams.forEach(team => {
                 if (team.leagueHistory) {
                     team.leagueHistory.forEach(h => {
                         // CRITICAL FIX: Check the competitionId of the HISTORY ENTRY, not the team's current league.
                         // Default to 'LEAGUE' (Super Lig) if undefined for legacy compatibility.
                         const histCompId = h.competitionId || 'LEAGUE';
                         
                         if (histCompId === competitionId) {
                             if (!historyMap[h.year]) {
                                 historyMap[h.year] = { first: null, second: null, third: null };
                             }
                             if (h.rank === 1) historyMap[h.year].first = team;
                             if (h.rank === 2) historyMap[h.year].second = team;
                             if (h.rank === 3) historyMap[h.year].third = team;
                         }
                     });
                 }
            });

            return Object.entries(historyMap)
                .map(([year, ranks]) => ({ year, ...ranks }))
                .sort((a, b) => parseInt(b.year.split('/')[0]) - parseInt(a.year.split('/')[0]));
        } 
        
        // CASE 2: KUPALAR (CUP / SUPER_CUP / EUROPE) - Sabit Listeyi Kullan
        else {
            let sourceList: { year: string, teamName: string }[] = [];
            if (competitionId === 'CUP') sourceList = PAST_CUP_WINNERS;
            else if (competitionId === 'SUPER_CUP') sourceList = PAST_SUPER_CUP_WINNERS;
            else if (competitionId === 'EUROPE') sourceList = PAST_EURO_WINNERS;
            
            return sourceList.map(item => {
                // Takım isminden gerçek takım objesini bulmaya çalış (Logo/Renk için)
                const realTeam = teams.find(t => t.name === item.teamName);
                
                // Bulunamazsa (örn: eski kapanmış takım veya isim değişikliği) dummy obje oluştur
                const displayTeam = realTeam || {
                    id: 'historic_team',
                    name: item.teamName,
                    colors: ['bg-slate-600', 'text-white'], // Varsayılan renk
                    logo: undefined
                } as Team;

                return {
                    year: item.year,
                    first: displayTeam,
                    second: null, // Kupa geçmişinde sadece kazananı tutuyoruz şimdilik
                    third: null
                };
            });
        }
    }, [teams, competitionId]);

    const getDetailTitle = (id: string) => {
        switch(id) {
            case 'RECORDS': return 'Detaylı Rekorlar';
            case 'CHAMPIONS': return 'Tüm Şampiyonlar';
            case 'AWARDS': return 'Ödül Kazananlar';
            case 'RANKINGS': return 'Lig Sıralaması';
            case 'RULES': return 'Kural Kitapçığı';
            default: return 'Detay';
        }
    };

    const isLeague = competitionId === 'LEAGUE' || competitionId === 'LEAGUE_1';

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto custom-scrollbar bg-[#1b1b1b] text-slate-300 relative">
            
            {/* DETAIL MODAL OVERLAY (RECORDS & OTHER DETAILS) */}
            {openDetail && (
                <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setOpenDetail(null)}>
                    
                    {/* The Record Viewer Modal */}
                    <div className="bg-[#1e232e] w-full max-w-4xl h-[85vh] rounded-xl border border-slate-700 shadow-2xl flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="p-4 border-b border-slate-700 bg-[#161a1f] flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2 text-xl font-teko">
                                <List size={24} className="text-[#ff9f43]"/> {getDetailTitle(openDetail)}
                            </h3>
                            <button onClick={() => setOpenDetail(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition border border-slate-600">
                                <X size={20}/>
                            </button>
                        </div>
                        
                        {/* CONTENT SWITCHING BASED ON TYPE */}
                        {openDetail === 'RECORDS' ? (
                            <RecordsModalContent competitionId={competitionId} teams={teams} fixtures={fixtures} />
                        ) : openDetail === 'AWARDS' ? (
                            <AwardsPodium teams={teams} />
                        ) : openDetail === 'RANKINGS' ? (
                            <RankingsModalContent />
                        ) : openDetail === 'CHAMPIONS' ? (
                            <ChampionsModalContent fullHistory={fullHistory} isLeague={isLeague} />
                        ) : openDetail === 'RULES' ? (
                            <RulesModal competitionId={competitionId} />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                <div className="bg-slate-800 p-4 rounded-full mb-4">
                                    <AlertCircle size={48} className="text-slate-500"/>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">İçerik Hazırlanıyor</h4>
                                <p className="text-slate-400 text-sm">Bu bölümdeki detaylı veriler yakında eklenecektir.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="w-full space-y-6 pb-10">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#333] pb-4 mb-2">
                    <div>
                        <h3 className="text-3xl font-bold text-white mb-1 font-teko uppercase tracking-wide">{competitionName}</h3>
                        <p className="text-slate-500 text-sm">Detaylı Organizasyon Bilgileri</p>
                    </div>
                    {competitionId.includes('LEAGUE') ? <Trophy size={40} className="text-[#ff9f43] opacity-80"/> : <Star size={40} className="text-yellow-500 opacity-80"/>}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    
                    {/* LEFT COLUMN: Records & Past Champions */}
                    <div className="flex flex-col gap-6">
                        
                        <RecordsCard 
                            competitionId={competitionId} 
                            teams={teams} 
                            onOpenDetail={() => setOpenDetail('RECORDS')} 
                        />

                        <ChampionsCard 
                            fullHistory={fullHistory} 
                            onOpenDetail={() => setOpenDetail('CHAMPIONS')} 
                        />

                    </div>

                    {/* RIGHT COLUMN: Rankings & Awards */}
                    <div className="flex flex-col gap-6">

                        <RankingsCard 
                            competitionId={competitionId} 
                            onOpenDetail={() => setOpenDetail('RANKINGS')} 
                        />

                        <AwardsCard 
                            teams={teams}
                            onOpenDetail={() => setOpenDetail('AWARDS')} 
                        />

                    </div>
                </div>

                {/* 5. KUTUCUK: LİG KURALLARI (EN ALTTA, TAM GENİŞLİK) */}
                <div 
                    onClick={() => setOpenDetail('RULES')}
                    className="bg-[#252525] rounded-2xl border border-[#333] overflow-hidden shadow-lg group hover:border-red-500/50 transition-all duration-300 relative cursor-pointer hover:scale-[1.01]"
                >
                     {/* Detay Butonu */}
                    <button className="absolute top-4 right-4 z-20 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-transform hover:scale-105 pointer-events-none">
                        <Maximize2 size={14} /> Detaylı Gör
                    </button>

                    <div className="bg-[#2a2f38] p-4 flex items-center gap-3">
                        <div className="bg-red-500/20 p-2 rounded-lg text-red-500">
                            <Scroll size={20}/>
                        </div>
                        <h4 className="text-white font-bold text-lg uppercase tracking-wider">Lig Kuralları</h4>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CompetitionAboutTab;
