
import React from 'react';
import { TrendingUp, Maximize2, Star, StarHalf, Minus, ArrowUp, ArrowDown } from 'lucide-react';

const ALL_LEAGUES_RANKING = [
    { rank: 1, prev: 1, name: "Premier League", country: "İngiltere", code: "gb-eng", rep: 5.0 },
    { rank: 2, prev: 2, name: "La Liga", country: "İspanya", code: "es", rep: 4.5 },
    { rank: 3, prev: 4, name: "Serie A", country: "İtalya", code: "it", rep: 4.5 },
    { rank: 4, prev: 3, name: "Bundesliga", country: "Almanya", code: "de", rep: 4.5 },
    { rank: 5, prev: 5, name: "Ligue 1", country: "Fransa", code: "fr", rep: 4.0 },
    { rank: 6, prev: 7, name: "Eredivisie", country: "Hollanda", code: "nl", rep: 4.0 },
    { rank: 7, prev: 6, name: "Primeira Liga", country: "Portekiz", code: "pt", rep: 4.0 },
    { rank: 8, prev: 8, name: "Pro League", country: "Belçika", code: "be", rep: 3.5 },
    { rank: 9, prev: 12, name: "Süper Toto Hayvanlar Ligi", country: "Türkiye", code: "tr", rep: 3.5, isCurrent: true },
    { rank: 10, prev: 9, name: "Czech First League", country: "Çekya", code: "cz", rep: 3.0 },
    { rank: 11, prev: 10, name: "Scottish Premiership", country: "İskoçya", code: "gb-sct", rep: 3.0 },
    { rank: 12, prev: 13, name: "Swiss Super League", country: "İsviçre", code: "ch", rep: 3.0 },
    { rank: 13, prev: 11, name: "Austrian Bundesliga", country: "Avusturya", code: "at", rep: 3.0 },
    { rank: 14, prev: 15, name: "Danish Superliga", country: "Danimarka", code: "dk", rep: 2.5 },
    { rank: 15, prev: 16, name: "Eliteserien", country: "Norveç", code: "no", rep: 2.5 },
    { rank: 16, prev: 14, name: "Super League Greece", country: "Yunanistan", code: "gr", rep: 2.5 },
    { rank: 17, prev: 18, name: "Israeli Premier League", country: "İsrail", code: "il", rep: 2.5 },
    { rank: 18, prev: 17, name: "Ukrainian Premier League", country: "Ukrayna", code: "ua", rep: 2.0 },
    { rank: 19, prev: 20, name: "SuperLiga", country: "Sırbistan", code: "rs", rep: 2.0 },
    { rank: 20, prev: 19, name: "HNL", country: "Hırvatistan", code: "hr", rep: 2.0 }
];

const renderReputationStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    const emptyStars = 5 - Math.ceil(rating);

    return (
        <div className="flex gap-0.5 justify-center">
            {[...Array(fullStars)].map((_, i) => <Star key={`f-${i}`} size={14} className="fill-yellow-500 text-yellow-500 drop-shadow-sm" />)}
            {hasHalf && <StarHalf size={14} className="fill-yellow-500 text-yellow-500 drop-shadow-sm" />}
            {[...Array(emptyStars)].map((_, i) => <Star key={`e-${i}`} size={14} className="text-slate-600" />)}
        </div>
    );
};

// --- RANKINGS CARD (WIDGET) ---
interface RankingsCardProps {
    competitionId: string;
    onOpenDetail: () => void;
}

export const RankingsCard: React.FC<RankingsCardProps> = ({ competitionId, onOpenDetail }) => {
    
    const getRankings = () => {
        if (competitionId === 'EUROPE') return [
            { label: 'UEFA Organizasyon Sıralaması', value: '1. Sırada' },
            { label: 'Toplam Yayın Geliri', value: '2.4 Milyar €' },
            { label: 'Ortalama İzleyici', value: '55.000' }
        ];
        return [
            { label: 'UEFA Ülke Puanı Sıralaması', value: '9. Sırada' },
            { label: 'Lig Zorluk Seviyesi', value: '⭐⭐⭐⭐ (Yüksek)' },
            { label: 'Yayın Değeri Sıralaması', value: 'Avrupa\'da 6.' }
        ];
    };

    const getRankingNeighbors = () => {
        const turkeyIndex = ALL_LEAGUES_RANKING.findIndex(l => l.country === "Türkiye");
        let start = 0;
        let end = 3;
        if (turkeyIndex !== -1) {
            start = Math.max(0, turkeyIndex - 1);
            end = Math.min(ALL_LEAGUES_RANKING.length, start + 3);
            if (end - start < 3) start = Math.max(0, end - 3);
        }
        return ALL_LEAGUES_RANKING.slice(start, end).map(item => ({
            rank: item.rank,
            name: item.name,
            flag: item.code,
            rating: item.rep
        }));
    };

    return (
        <div 
            onClick={onOpenDetail}
            className="bg-[#252525] rounded-2xl border border-[#333] overflow-hidden shadow-lg group hover:border-green-500/50 transition-all duration-300 relative cursor-pointer hover:scale-[1.01] flex flex-col min-h-[306px]"
        >
            <button className="absolute top-4 right-4 z-20 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-transform hover:scale-105 pointer-events-none">
                <Maximize2 size={14} /> Detaylı Gör
            </button>

            <div className="bg-[#2a2f38] p-4 border-b border-[#333] flex items-center gap-3 shrink-0">
                <div className="bg-green-500/20 p-2 rounded-lg text-green-500">
                    <TrendingUp size={20}/>
                </div>
                <h4 className="text-white font-bold text-lg uppercase tracking-wider">Lig Sıralaması</h4>
            </div>
            
            {competitionId === 'EUROPE' ? (
                <div className="p-4 flex flex-col gap-3 justify-center h-full flex-1">
                    {getRankings().map((rank, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-[#1f1f1f] rounded-xl border border-[#333]">
                            <div className="text-xs text-slate-500 font-bold uppercase">{rank.label}</div>
                            <div className="text-lg font-black text-white">{rank.value}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-4 flex flex-col gap-3 justify-center h-full flex-1">
                    {getRankingNeighbors().map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-[#333] bg-[#1f1f1f] relative overflow-hidden transition-all hover:bg-[#282828]">
                            <div className="flex items-center gap-4">
                                <div className="text-xl md:text-2xl font-black text-slate-500">{r.rank}.</div>
                                <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-[#333]">
                                    <img src={`https://flagcdn.com/w40/${r.flag}.png`} className="w-5 h-auto object-contain opacity-70" alt={r.flag} />
                                </div>
                                <div className="flex flex-col">
                                    <div className="text-sm font-bold text-slate-300 uppercase tracking-tight">{r.name}</div>
                                    <div className="mt-0.5">
                                        {renderReputationStars(r.rating)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- RANKINGS MODAL CONTENT ---
export const RankingsModalContent = () => {
    return (
        <div className="flex flex-col h-full bg-[#1b1b1b]">
            <div className="bg-[#252525] border-b border-[#333] px-4 py-3 flex items-center justify-between">
                <h4 className="text-[#ff9f43] font-bold text-sm uppercase tracking-wider">UEFA Ülke/Lig Sıralaması</h4>
                <span className="text-xs text-slate-500 font-bold">2025/26 Sezonu</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#161a1f] text-slate-400 font-bold uppercase sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 w-12 text-center border-b border-[#333]">Sıra</th>
                            <th className="p-3 w-16 text-center border-b border-[#333]">Önce</th>
                            <th className="p-3 border-b border-[#333]">Lig</th>
                            <th className="p-3 border-b border-[#333]">Ülke</th>
                            <th className="p-3 text-center border-b border-[#333]">İtibar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2c333a]">
                        {ALL_LEAGUES_RANKING.map((item, index) => {
                            const diff = item.prev - item.rank;
                            let changeIcon = <Minus size={12} className="text-slate-500" />;
                            let changeColor = "text-slate-500";
                            if (diff > 0) { changeIcon = <ArrowUp size={12} className="text-green-500" />; changeColor = "text-green-500"; } 
                            else if (diff < 0) { changeIcon = <ArrowDown size={12} className="text-red-500" />; changeColor = "text-red-500"; }
                            const rowBgClass = item.isCurrent ? 'bg-[#ff9f43]/10 hover:bg-[#ff9f43]/20' : 'hover:bg-[#252a33]';
                            const textClass = item.isCurrent ? 'text-white' : 'text-slate-300';
                            const nameClass = item.isCurrent ? 'text-[#ff9f43]' : 'text-white';
                            return (
                                <tr key={index} className={`${rowBgClass} transition-colors group`}>
                                    <td className={`p-3 text-center font-mono font-black text-sm ${textClass}`}>{item.rank}</td>
                                    <td className="p-3 text-center"><div className="flex flex-col items-center justify-center">{changeIcon}<span className={`text-[10px] font-bold ${changeColor}`}>{item.prev}</span></div></td>
                                    <td className="p-3 font-bold text-sm"><span className={nameClass}>{item.name}</span></td>
                                    <td className="p-3"><div className="flex items-center gap-2"><img src={`https://flagcdn.com/w20/${item.code}.png`} className="w-5 h-auto object-contain rounded-[1px] shadow-sm opacity-80" alt={item.country} onError={(e) => e.currentTarget.style.display='none'} /><span className="text-slate-400 text-[11px] font-bold uppercase">{item.country}</span></div></td>
                                    <td className="p-3 text-center">{renderReputationStars(item.rep)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
