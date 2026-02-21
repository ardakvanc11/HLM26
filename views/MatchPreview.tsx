import React from 'react';
import { Fixture, Team } from '../types';
import { calculateOdds } from '../utils/gameEngine';
import { Home, ChevronRight, Trophy, MessageSquare } from 'lucide-react';

const MatchPreview = ({ 
    fixture, 
    homeTeam, 
    awayTeam, 
    onProceed, 
    onGoToTalk 
}: { 
    fixture: Fixture, 
    homeTeam: Team, 
    awayTeam: Team, 
    onProceed: () => void,
    onGoToTalk: () => void 
}) => {
    // Calculate odds on the fly
    const odds = calculateOdds(homeTeam, awayTeam);

    const getCompetitionName = (compId?: string) => {
        switch (compId) {
            case 'SUPER_CUP': return 'Hayvanlar Süper Kupası';
            case 'CUP': return 'Hayvanlar Kupası';
            case 'LEAGUE_1': return 'Hayvanlar 1. Ligi';
            case 'EUROPE': return 'Avrupa Hayvanlar Ligi';
            case 'PLAYOFF':
            case 'PLAYOFF_FINAL': return '1. Lig Play-Off';
            default: return 'Süper Toto Hayvanlar Ligi';
        }
    };

    const getRoundName = (compId?: string, week?: number) => {
        if (!week) return '';
        if (compId === 'CUP') {
            if (week === 100) return 'Son 32 Turu';
            if (week === 101) return 'Son 16 Turu';
            if (week === 102) return 'Çeyrek Final';
            if (week === 103) return 'Yarı Final';
            if (week === 104) return 'Final';
        }
        if (compId === 'SUPER_CUP') return 'Final';
        if (compId === 'EUROPE') {
            if (week <= 208) return `${week - 200}. Hafta (Lig Aşaması)`;
            if (week <= 210) return 'Play-Off Turu';
            if (week <= 212) return 'Son 16 Turu';
            if (week <= 214) return 'Çeyrek Final';
            if (week <= 216) return 'Yarı Final';
            return 'Final';
        }
        // Lig maçlarında hafta yazısını kaldırdık
        return '';
    };

    const roundName = getRoundName(fixture.competitionId, fixture.week);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            {/* Match Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between shadow-sm gap-8 md:gap-0">
                 <div className="flex flex-col items-center w-full md:w-1/3">
                     <img src={homeTeam.logo} className="w-24 h-24 md:w-32 md:h-32 object-contain mb-4" />
                     <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white text-center">{homeTeam.name}</h2>
                 </div>
                 
                 <div className="flex flex-col items-center w-full md:w-1/3 order-first md:order-none">
                     <div className="text-3xl md:text-4xl font-bold text-slate-400 dark:text-slate-500 font-mono mb-2">VS</div>
                     <div className="bg-slate-100 dark:bg-slate-900 px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-center w-full max-w-xs">
                         <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-2">Bahis Oranları</div>
                         <div className="flex justify-between font-mono font-bold">
                             <span className="text-green-600 dark:text-green-400">{odds.home}</span>
                             <span className="text-slate-600 dark:text-slate-300">{odds.draw}</span>
                             <span className="text-red-600 dark:text-red-400">{odds.away}</span>
                         </div>
                     </div>
                     
                     <div className="mt-6 w-full space-y-4">
                        {/* Stadyum Bilgisi */}
                        <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 uppercase font-bold tracking-widest mb-1">
                                <Home size={14} /> Stadyum
                            </div>
                            <div className="text-slate-900 dark:text-white text-base md:text-lg font-bold tracking-wide text-center">{homeTeam.stadiumName}</div>
                            <div className="text-slate-500 dark:text-slate-400 text-sm">{homeTeam.stadiumCapacity.toLocaleString()} Kişilik</div>
                        </div>

                        {/* Organizasyon Bilgisi */}
                        <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500 uppercase font-bold tracking-widest mb-1">
                                <Trophy size={14} className="text-yellow-600 dark:text-yellow-500" /> Organizasyon
                            </div>
                            <div className="text-yellow-700 dark:text-yellow-500 text-base md:text-lg font-black tracking-wide text-center uppercase font-teko">
                                {getCompetitionName(fixture.competitionId)}
                            </div>
                            {roundName && (
                                <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                    {roundName}
                                </div>
                            )}
                        </div>
                     </div>
                 </div>

                 <div className="flex flex-col items-center w-full md:w-1/3">
                     <img src={awayTeam.logo} className="w-24 h-24 md:w-32 md:h-32 object-contain mb-4" />
                     <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white text-center">{awayTeam.name}</h2>
                 </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 pb-6">
                <button onClick={onGoToTalk} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-8 py-3 md:py-4 rounded-xl shadow-lg hover:scale-105 transition flex items-center gap-3 w-full md:w-auto justify-center">
                    <MessageSquare size={24}/> MAÇ ÖNCESİ KONUŞMASINA GİT
                </button>
                <button onClick={onProceed} className="bg-green-600 hover:bg-green-500 text-white font-bold text-lg px-8 py-3 md:py-4 rounded-xl shadow-lg hover:scale-105 transition flex items-center gap-3 w-full md:w-auto justify-center">
                    SOYUNMA ODASINA GİT <ChevronRight size={24}/>
                </button>
            </div>
        </div>
    );
};

export default MatchPreview;