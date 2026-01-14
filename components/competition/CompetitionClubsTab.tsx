
import React from 'react';
import { Team } from '../../types';

interface CompetitionClubsTabProps {
    teams: Team[];
    onTeamClick: (id: string) => void;
}

const CompetitionClubsTab: React.FC<CompetitionClubsTabProps> = ({ teams, onTeamClick }) => {
    return (
        <div className="overflow-y-auto custom-scrollbar h-full p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {teams.map(t => (
                    <div 
                        key={t.id} 
                        onClick={() => onTeamClick(t.id)}
                        className="bg-[#2c333a] border border-slate-700 hover:border-[#ff9f43] rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition group"
                    >
                        {t.logo ? <img src={t.logo} className="w-16 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform"/> : <div className={`w-16 h-16 rounded-full ${t.colors[0]} flex items-center justify-center text-2xl font-bold text-white`}>{t.name.charAt(0)}</div>}
                        <div className="text-center">
                            <div className="font-bold text-white text-sm group-hover:text-[#ff9f43] transition-colors">{t.name}</div>
                            <div className="text-xs text-slate-500 mt-1">{t.stadiumName}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CompetitionClubsTab;
