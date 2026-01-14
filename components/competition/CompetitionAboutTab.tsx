
import React from 'react';
import { Trophy, History } from 'lucide-react';

interface CompetitionAboutTabProps {
    competitionId: string;
    competitionName: string;
}

const CompetitionAboutTab: React.FC<CompetitionAboutTabProps> = ({ competitionId, competitionName }) => {
    return (
        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-[#1b1b1b] text-slate-300">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2 font-teko uppercase tracking-wide border-b border-[#333] pb-2">{competitionName} Hakkında</h3>
                    <p className="leading-relaxed text-sm">
                        {competitionId === 'LEAGUE' && "Türkiye'nin en üst düzey futbol ligidir. 18 takımın mücadele ettiği ligde şampiyon olan takım ve ilk sıraları alan takımlar Avrupa kupalarına katılmaya hak kazanır. Son 3 sıradaki takımlar 1. Lig'e düşer."}
                        {competitionId === 'LEAGUE_1' && "Türkiye futbol sisteminin ikinci seviyesidir. İlk 2 takım doğrudan Süper Lig'e yükselirken, 3., 4., 5. ve 6. sıradaki takımlar Play-Off oynar."}
                        {competitionId === 'CUP' && "Türkiye'deki tüm profesyonel takımların katıldığı eleme usulü turnuvadır. Kazanan takım Avrupa kupalarına katılma hakkı ve Süper Kupa finali oynama hakkı elde eder."}
                        {competitionId === 'SUPER_CUP' && "Lig şampiyonu ile Türkiye Kupası şampiyonunun karşılaştığı, sezonun en prestijli tek maçlık finalidir."}
                        {competitionId === 'EUROPE' && "Kıtanın en iyi takımlarının mücadele ettiği en büyük organizasyon. Lig usulü grup aşaması ve ardından gelen eleme turları ile şampiyon belirlenir."}
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#252525] p-6 rounded-xl border border-[#333]">
                        <h4 className="text-[#ff9f43] font-bold text-sm uppercase mb-4 flex items-center gap-2"><Trophy size={16}/> Ödüller & Kurallar</h4>
                        <ul className="space-y-2 text-xs">
                            <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5"></div><span>3 Puan Sistemi uygulanır.</span></li>
                            <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5"></div><span>Eşitlik halinde ikili averaj, sonra genel averaj.</span></li>
                            <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5"></div><span>Sarı kart cezası sınırı 4 karttır.</span></li>
                            <li className="flex gap-2"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5"></div><span>Devre arası ve sezon sonu transfer dönemleri vardır.</span></li>
                        </ul>
                    </div>

                    <div className="bg-[#252525] p-6 rounded-xl border border-[#333]">
                        <h4 className="text-[#ff9f43] font-bold text-sm uppercase mb-4 flex items-center gap-2"><History size={16}/> Tarihçe</h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between border-b border-[#333] pb-1"><span>Kuruluş</span> <span className="text-white">1959</span></div>
                            <div className="flex justify-between border-b border-[#333] pb-1"><span>En Çok Şampiyon</span> <span className="text-white">Eşşekboğanspor FK</span></div>
                            <div className="flex justify-between border-b border-[#333] pb-1"><span>Son Şampiyon</span> <span className="text-white text-right">Ayıboğanspor SK</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompetitionAboutTab;
