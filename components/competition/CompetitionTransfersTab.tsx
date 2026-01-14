
import React from 'react';

interface TransferItem {
    date: string;
    playerName: string;
    teamName: string;
    teamLogo?: string;
    teamColors: [string, string];
    counterparty: string;
    price: string;
}

interface CompetitionTransfersTabProps {
    transfers: TransferItem[];
}

const CompetitionTransfersTab: React.FC<CompetitionTransfersTabProps> = ({ transfers }) => {
    if (transfers.length === 0) return <div className="p-8 text-center text-slate-500 italic">Transfer bulunamadı.</div>;
    
    return (
        <div className="overflow-y-auto custom-scrollbar h-full">
            <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#111] text-xs uppercase text-slate-500 font-bold sticky top-0 z-10">
                    <tr>
                        <th className="p-3">Tarih</th>
                        <th className="p-3">Oyuncu</th>
                        <th className="p-3">Alan Takım</th>
                        <th className="p-3">Eski Takım</th>
                        <th className="p-3 text-right">Bedel</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#333]">
                    {transfers.map((t, i) => (
                        <tr key={i} className="hover:bg-[#252525] transition">
                            <td className="p-3 text-xs text-slate-500">{t.date}</td>
                            <td className="p-3 font-bold text-white">{t.playerName}</td>
                            <td className="p-3 text-emerald-400 font-bold">{t.teamName}</td>
                            <td className="p-3 text-slate-400">{t.counterparty}</td>
                            <td className="p-3 text-right font-mono font-bold text-white">{t.price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CompetitionTransfersTab;
