
import React from 'react';
import { X, Trophy, Medal, Crown, Star, StarHalf } from 'lucide-react';
import { ManagerProfile } from '../types';
import { LEGEND_MANAGERS, LegendManager } from '../data/hallOfFameData';
import { calculateManagerPower } from '../utils/gameEngine';

interface HallOfFameModalProps {
    manager: ManagerProfile;
    onClose: () => void;
}

const HallOfFameModal: React.FC<HallOfFameModalProps> = ({ manager, onClose }) => {
    // Calculate current user stats wrapper
    const userPower = calculateManagerPower(manager.stats);
    
    const userAsLegend: LegendManager & { isUser: boolean } = {
        name: manager.name,
        teamsManaged: 1, // Assuming 1 for current game logic, or use history length if implemented
        country: manager.nationality,
        leagueTitles: manager.stats.leagueTitles,
        domesticCups: manager.stats.domesticCups,
        europeanCups: manager.stats.europeanCups,
        power: userPower,
        isUser: true
    };

    // Merge and Sort
    const allManagers = [...LEGEND_MANAGERS, userAsLegend].sort((a, b) => b.power - a.power);

    // Find user rank
    const userIndex = allManagers.findIndex(m => (m as any).isUser);
    const isInTop20 = userIndex < 20;

    // Display List Logic
    let displayList = allManagers.slice(0, 20);
    
    // If user is not in top 20, we need to show top 20 AND the user at the bottom
    const userEntry = allManagers[userIndex];

    // Helper to convert Power to Stars based on specific ranges
    // UPDATED: New ranges per user request
    const getManagerStarRating = (power: number) => {
        if (power >= 90) return 5;
        if (power >= 85) return 4.5;
        if (power >= 80) return 4;
        if (power >= 75) return 3.5;
        if (power >= 70) return 3;
        if (power >= 65) return 2.5;
        if (power >= 60) return 2;
        if (power >= 55) return 1.5;
        if (power >= 52) return 1;
        return 0.5; // <= 51
    };

    const renderManagerStars = (power: number, isUser: boolean = false) => {
        const rating = getManagerStarRating(power);
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 !== 0;
        const emptyStars = 5 - Math.ceil(rating);
        const starSize = 18;

        return (
            <div className="flex gap-0.5 justify-center items-center" title={`Güç Puanı: ${power}`}>
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} size={starSize} className="fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                ))}
                {hasHalf && (
                    <StarHalf size={starSize} className="fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star key={`empty-${i}`} size={starSize} className="text-slate-700" />
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md overflow-hidden">
            <div className="bg-slate-900 w-full max-w-5xl h-[90vh] rounded-2xl border-2 border-yellow-600/50 flex flex-col shadow-2xl relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500 via-transparent to-transparent pointer-events-none"></div>

                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/80 shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="bg-yellow-500/20 p-3 rounded-full border border-yellow-500">
                            <Crown size={32} className="text-yellow-500 animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white uppercase tracking-widest font-teko">Dünya Onur Tablosu</h2>
                            <p className="text-slate-400 text-sm">Tarihin En İyi Teknik Direktörleri</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition bg-slate-800 hover:bg-red-600 p-2 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-slate-950 text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider shrink-0 border-b border-slate-800">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-3">İsim</div>
                    <div className="col-span-2 text-center hidden md:block">Ülke</div>
                    <div className="col-span-1 text-center" title="Takım Sayısı">Tkm</div>
                    <div className="col-span-1 text-center text-yellow-500">Lig</div>
                    <div className="col-span-1 text-center text-blue-400">Kupa</div>
                    <div className="col-span-1 text-center text-purple-400">Avr</div>
                    <div className="col-span-2 text-center text-white text-base">SEVİYE</div>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 z-10">
                    {displayList.map((m, idx) => {
                        const isUser = (m as any).isUser;
                        let rankStyle = "text-slate-500";
                        if (idx === 0) rankStyle = "text-yellow-400 text-xl drop-shadow-lg";
                        else if (idx === 1) rankStyle = "text-slate-300 text-lg";
                        else if (idx === 2) rankStyle = "text-orange-400 text-lg";

                        return (
                            <div 
                                key={idx} 
                                className={`grid grid-cols-12 gap-2 px-6 py-4 items-center border-b border-slate-800 transition-colors ${isUser ? 'bg-yellow-900/30 border-yellow-600/50 hover:bg-yellow-900/40' : 'hover:bg-slate-800/50'}`}
                            >
                                <div className={`col-span-1 text-center font-black font-mono ${rankStyle}`}>
                                    {idx + 1}
                                </div>
                                <div className={`col-span-3 font-bold truncate flex items-center gap-2 ${isUser ? 'text-yellow-400' : 'text-white'}`}>
                                    {idx === 0 && <Trophy size={16} className="text-yellow-400 fill-yellow-400" />}
                                    {m.name}
                                    {isUser && <span className="bg-yellow-600 text-black text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ml-2">Sen</span>}
                                </div>
                                <div className="col-span-2 text-center text-slate-400 text-sm hidden md:block truncate">{m.country}</div>
                                <div className="col-span-1 text-center text-slate-500 font-mono">{m.teamsManaged}</div>
                                <div className="col-span-1 text-center text-yellow-600 font-bold font-mono">{m.leagueTitles}</div>
                                <div className="col-span-1 text-center text-blue-500 font-bold font-mono">{m.domesticCups}</div>
                                <div className="col-span-1 text-center text-purple-500 font-bold font-mono">{m.europeanCups}</div>
                                <div className="col-span-2 text-center">
                                    <div className="inline-block relative">
                                        {renderManagerStars(m.power, isUser)}
                                        {isUser && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)] opacity-50"></div>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* User Status Bar (If not in top 20) */}
                {!isInTop20 && (
                    <div className="bg-slate-900 border-t-4 border-yellow-600 p-0 shrink-0 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                        <div className="grid grid-cols-12 gap-2 px-6 py-4 items-center bg-gradient-to-r from-slate-900 via-yellow-900/20 to-slate-900">
                            <div className="col-span-1 text-center font-black text-slate-500 text-xl">-</div>
                            <div className="col-span-3 font-bold text-yellow-400 flex items-center gap-2 truncate">
                                {userEntry.name}
                                <span className="bg-yellow-600 text-black text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Sen</span>
                            </div>
                            <div className="col-span-2 text-center text-slate-400 text-sm hidden md:block truncate">{userEntry.country}</div>
                            <div className="col-span-1 text-center text-slate-500 font-mono">{userEntry.teamsManaged}</div>
                            <div className="col-span-1 text-center text-yellow-600 font-bold font-mono">{userEntry.leagueTitles}</div>
                            <div className="col-span-1 text-center text-blue-500 font-bold font-mono">{userEntry.domesticCups}</div>
                            <div className="col-span-1 text-center text-purple-500 font-bold font-mono">{userEntry.europeanCups}</div>
                            <div className="col-span-2 text-center">
                                {renderManagerStars(userEntry.power, true)}
                            </div>
                        </div>
                        <div className="bg-black/40 text-center py-1 text-[10px] text-slate-500 uppercase tracking-widest">
                            Sıralamaya girmek için güç seviyenizi artırın
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HallOfFameModal;
