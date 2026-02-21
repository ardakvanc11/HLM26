import React from 'react';
import { Team } from '../types';
import TacticsView from './TacticsView';
import { FastForward, PlayCircle } from 'lucide-react';

const LockerRoomView = ({ team, setTeam, onStartMatch, onSimulateMatch, currentWeek, nextMatchCompetitionId }: { team: Team, setTeam: (t: Team) => void, onStartMatch: () => void, onSimulateMatch: () => void, currentWeek: number, nextMatchCompetitionId?: string }) => {
    
    const validateAndStart = (isSimulate: boolean) => {
        // Check First 18 players (XI + Bench) for issues
        const activeSquad = team.players.slice(0, 18);
        
        // 0. Empty Slot Check
        const emptySlots = activeSquad.filter(p => p.id.startsWith('empty_'));
        if (emptySlots.length > 0) {
            alert(`Kadroda boş mevkiler var!\n\nLütfen maça başlamadan önce boş pozisyonları (Oyuncu Seç) doldurun.`);
            return;
        }

        // 1. Injury Check
        const injuredPlayers = activeSquad.filter(p => p.injury && p.injury.daysRemaining > 0);
        if (injuredPlayers.length > 0) {
            const names = injuredPlayers.map(p => p.name).join(', ');
            alert(`Kadroda sıkıntılı oyuncu var!\n\nAşağıdaki oyuncular SAKAT ve maç kadrosunda (İlk 11 veya Yedek) bulunamaz:\n${names}\n\nLütfen bu oyuncuları 'Kadro Dışı' bölümüne taşıyın.`);
            return;
        }

        // 2. Suspension Check (Updated for Competition Specifics)
        // Default to 'LEAGUE' if undefined, as game engine stores league bans under this key
        const compId = nextMatchCompetitionId || 'LEAGUE'; 

        const suspendedPlayers = activeSquad.filter(p => 
            p.suspensions && p.suspensions[compId] && p.suspensions[compId] > 0
        );
        
        if (suspendedPlayers.length > 0) {
            const names = suspendedPlayers.map(p => p.name).join(', ');
            alert(`Kadroda sıkıntılı oyuncu var!\n\nAşağıdaki oyuncular CEZALI (${compId === 'LEAGUE' ? 'Lig' : compId}) ve maç kadrosunda (İlk 11 veya Yedek) bulunamaz:\n${names}\n\nLütfen bu oyuncuları 'Kadro Dışı' bölümüne taşıyın.`);
            return;
        }

        // Stamina check removed by user request to allow playing tired players freely.

        if (isSimulate) onSimulateMatch();
        else onStartMatch();
    };

    // Ensure we pass a valid string to TacticsView for visual indicators
    const effectiveCompId = nextMatchCompetitionId || 'LEAGUE';

    return (
        <div className="h-full flex flex-col">
            <div className="bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                 <div>
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white">SOYUNMA ODASI</h2>
                     <p className="text-slate-500 dark:text-slate-400 text-sm">Son taktik kontrollerini yap ve maça başla.</p>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => validateAndStart(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                         <FastForward size={24}/> SONUCU GÖSTER
                    </button>
                    <button onClick={() => validateAndStart(false)} className="bg-red-600 hover:bg-red-500 text-white font-bold text-lg px-8 py-3 rounded-lg shadow-lg animate-pulse flex items-center gap-2">
                        <PlayCircle size={24}/> MAÇA BAŞLA
                    </button>
                 </div>
            </div>
            <div className="flex-1 overflow-hidden p-4">
                 <TacticsView team={team} setTeam={setTeam} currentWeek={currentWeek} matchCompetitionId={effectiveCompId} />
            </div>
        </div>
    );
};

export default LockerRoomView;