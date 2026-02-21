
import React from 'react';
import { History, Maximize2, Trophy } from 'lucide-react';
import { Team } from '../../../types';

interface ChampionsCardProps {
    onOpenDetail: () => void;
    fullHistory: { year: string, first: Team | null, second: Team | null, third: Team | null }[];
}

export const ChampionsCard: React.FC<ChampionsCardProps> = ({ onOpenDetail, fullHistory }) => {
    
    const getPastChampions = () => {
        return fullHistory.slice(0, 6).map(h => ({
            year: h.year,
            winner: h.first ? h.first.name : 'Bilinmiyor',
            logo: h.first ? h.first.logo : undefined
        }));
    };

    return (
        <div 
            onClick={onOpenDetail}
            className="bg-[#252525] rounded-2xl border border-[#333] overflow-hidden shadow-lg group hover:border-blue-500/50 transition-all duration-300 relative cursor-pointer hover:scale-[1.01]"
        >
            <button className="absolute top-4 right-4 z-20 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-transform hover:scale-105 pointer-events-none">
                <Maximize2 size={14} /> Detaylı Gör
            </button>

            <div className="bg-[#2a2f38] p-4 border-b border-[#333] flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-500">
                    <History size={20}/>
                </div>
                <h4 className="text-white font-bold text-lg uppercase tracking-wider">Geçmiş Şampiyonlar</h4>
            </div>
            
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {getPastChampions().map((champ, i) => (
                    <div key={i} className="flex flex-col items-center p-4 bg-[#1f1f1f] rounded-xl border border-[#333] hover:bg-[#282828] transition-colors relative overflow-hidden group/card shadow-md">
                        <div className="text-[10px] font-mono font-bold text-slate-500 bg-[#151515] px-2 py-0.5 rounded mb-3 border border-[#333]">
                            {champ.year}
                        </div>

                        <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center p-3 border border-[#333] mb-3 shadow-lg group-hover/card:scale-110 transition-transform relative z-10">
                            {champ.logo ? (
                                <img src={champ.logo} alt={champ.winner} className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-xl font-bold text-white">{champ.winner.charAt(0)}</div>
                            )}
                        </div>

                        <div className="text-xs font-bold text-white text-center truncate w-full z-10">{champ.winner}</div>
                        <Trophy size={60} className="absolute -bottom-4 -right-4 opacity-5 text-blue-500 rotate-12 pointer-events-none" />
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- CHAMPIONS MODAL CONTENT ---
interface ChampionsModalContentProps {
    fullHistory: { year: string, first: Team | null, second: Team | null, third: Team | null }[];
    isLeague: boolean;
}

export const ChampionsModalContent: React.FC<ChampionsModalContentProps> = ({ fullHistory, isLeague }) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1b1b1b]">
            <div className="grid grid-cols-[1fr_2fr_2fr_2fr] gap-4 px-6 py-4 bg-[#161a1f] border-b border-[#333] shrink-0 sticky top-0 z-10 shadow-md">
                <div className="text-[#ff9f43] font-bold text-sm uppercase tracking-wider font-mono">Sezon</div>
                <div className="text-yellow-500 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <Trophy size={16} /> Şampiyon
                </div>
                <div className="text-slate-300 font-bold text-sm uppercase tracking-wider">İkinci</div>
                <div className="text-orange-400 font-bold text-sm uppercase tracking-wider">Üçüncü</div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {fullHistory.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 italic">
                        Kayıtlı şampiyonluk verisi bulunmuyor.
                    </div>
                ) : (
                    <div className="divide-y divide-[#2c333a]">
                        {fullHistory.map((h, i) => (
                            <div 
                                key={i} 
                                className="grid grid-cols-[1fr_2fr_2fr_2fr] gap-4 px-6 py-4 items-center hover:bg-[#252a33] transition-colors"
                            >
                                <div className="text-white font-mono font-bold text-sm">{h.year}</div>

                                <div className="flex items-center gap-3">
                                    {h.first ? (
                                        <>
                                            {h.first.logo ? (
                                                <img src={h.first.logo} className="w-8 h-8 object-contain drop-shadow-md"/>
                                            ) : (
                                                <div className={`w-8 h-8 rounded-full ${h.first.colors[0]} border-2 border-white`}></div>
                                            )}
                                            <span className="font-black text-white text-sm uppercase truncate">{h.first.name}</span>
                                        </>
                                    ) : <span className="text-slate-600 italic">-</span>}
                                </div>

                                <div className="flex items-center gap-3">
                                    {h.second ? (
                                        <>
                                            {h.second.logo ? (
                                                <img src={h.second.logo} className="w-6 h-6 object-contain opacity-80"/>
                                            ) : (
                                                <div className={`w-6 h-6 rounded-full ${h.second.colors[0]} opacity-80`}></div>
                                            )}
                                            <span className="font-bold text-slate-400 text-sm truncate">{h.second.name}</span>
                                        </>
                                    ) : <span className="text-slate-600 italic">-</span>}
                                </div>

                                <div className="flex items-center gap-3">
                                    {h.third ? (
                                        <>
                                            {h.third.logo ? (
                                                <img src={h.third.logo} className="w-6 h-6 object-contain opacity-80"/>
                                            ) : (
                                                <div className={`w-6 h-6 rounded-full ${h.third.colors[0]} opacity-80`}></div>
                                            )}
                                            <span className="font-bold text-orange-400/80 text-sm truncate">{h.third.name}</span>
                                        </>
                                    ) : <span className="text-slate-600 italic">-</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
