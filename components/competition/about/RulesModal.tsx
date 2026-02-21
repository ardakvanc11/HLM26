
import React from 'react';
import { CalendarDays } from 'lucide-react';

interface RulesModalProps {
    competitionId: string;
}

export const RulesModal: React.FC<RulesModalProps> = ({ competitionId }) => {
    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#1b1b1b]">
            {/* Title */}
            <div className="mb-8 border-b border-[#333] pb-4">
                <h2 className="text-2xl font-bold text-white mb-1">Lig Bölümü İçin Özel Kurallar</h2>
                <p className="text-slate-500 text-sm">2025/2026 Sezonu Yönetmeliği</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Col */}
                <div className="space-y-8">
                    {/* Section: Format */}
                    <div className="bg-[#252525] rounded-xl p-6 border border-[#333]">
                        <h4 className="text-[#ff9f43] font-bold uppercase text-sm mb-4 border-b border-[#444] pb-2">Format & Puanlama</h4>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between"><span className="text-slate-400">Takım Sayısı</span><span className="text-white font-bold">18</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Tarihler</span><span className="text-white font-bold">8 Ağustos 2025 – 1 Haziran 2026</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Galibiyet Puanı</span><span className="text-green-500 font-bold">3</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Beraberlik Puanı</span><span className="text-yellow-500 font-bold">1</span></div>
                            <div>
                                <span className="text-slate-400 block mb-1">Fikstür Detayları</span>
                                <span className="text-slate-200">34 maç (takımlar iki defa birbirleriyle oynar)</span>
                            </div>
                        </div>
                    </div>

                    {/* Section: Match Day */}
                    <div className="bg-[#252525] rounded-xl p-6 border border-[#333]">
                        <h4 className="text-blue-400 font-bold uppercase text-sm mb-4 border-b border-[#444] pb-2">Maç Günü Kuralları</h4>
                        <ul className="space-y-3 text-sm text-slate-300 list-disc list-inside">
                            <li>Genç oyuncu sözleşmesine sahip U-21 oyuncular bütün maçlarda oynatılabilir.</li>
                            <li>Yalnızca lisansı çıkarılan oyuncular bu organizasyonda forma giyebilir.</li>
                            <li>Maçlarda Video Yardımcı Hakem (VAR) kullanılacaktır.</li>
                        </ul>
                        
                        <div className="mt-4 pt-4 border-t border-[#333]">
                            <span className="text-slate-400 font-bold text-xs uppercase block mb-2">Yedek Oyuncu Kuralları</span>
                            <p className="text-slate-300 text-sm">Oyunun en fazla 3 kez durdurulması şartıyla, 10 yedek oyuncudan en fazla 5 oyuncu oyuna girebilir.</p>
                        </div>
                    </div>

                     {/* Section: Disiplin */}
                     <div className="bg-[#252525] rounded-xl p-6 border border-[#333]">
                        <h4 className="text-red-500 font-bold uppercase text-sm mb-4 border-b border-[#444] pb-2">Disiplin & Cezalar</h4>
                        <div className="space-y-4 text-sm text-slate-300">
                            <div>
                                <span className="text-yellow-500 font-bold block mb-1">Sarı Kart Sınırı</span>
                                Her 4 sarı kart için 1 maç ceza.
                            </div>
                            <div>
                                <span className="text-red-500 font-bold block mb-1">Ciddi Tehlikeli Hareket Cezaları</span>
                                <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
                                    <li><span className="text-white">1 Maç:</span> Çok sert müdahale (Hafif)</li>
                                    <li><span className="text-white">2 Maç:</span> Direkt kırmızı (Standart)</li>
                                    <li><span className="text-white">5 Maç:</span> Kasıtlı/Çok sert müdahale</li>
                                    <li><span className="text-white">12 Maç:</span> Hakeme Saldırı / Kavga</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col */}
                <div className="space-y-8">
                     {/* Section: Squad & Registration */}
                     <div className="bg-[#252525] rounded-xl p-6 border border-[#333]">
                        <h4 className="text-purple-400 font-bold uppercase text-sm mb-4 border-b border-[#444] pb-2">Kadro & Lisans</h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                            <li className="flex justify-between"><span className="text-slate-400">Kadro Limiti</span> <span>Maks. 34 Oyuncu</span></li>
                            <li className="flex justify-between"><span className="text-slate-400">Yabancı Sınırı</span> <span>Maks. 20 Oyuncu</span></li>
                            <li className="flex justify-between"><span className="text-slate-400">Kaleci Sınırı</span> <span>Maks. 3 Kaleci</span></li>
                            <li className="flex justify-between"><span className="text-slate-400">Yerli Kaleci</span> <span>Min. 2 Kaleci</span></li>
                        </ul>
                        
                        <div className="mt-4 pt-4 border-t border-[#333]">
                            <span className="text-slate-400 font-bold text-xs uppercase block mb-2">Lisans Kayıt Dönemleri</span>
                            <div className="space-y-1 text-xs text-white">
                                <div className="flex items-center gap-2"><CalendarDays size={14} className="text-green-500"/> 30 Haziran 2025 – 1 Eylül 2025</div>
                                <div className="flex items-center gap-2"><CalendarDays size={14} className="text-blue-500"/> 1 Ocak 2026 – 1 Şubat 2026</div>
                            </div>
                        </div>

                         <div className="mt-4 pt-4 border-t border-[#333]">
                            <span className="text-slate-400 font-bold text-xs uppercase block mb-2">Kiralama Kuralları</span>
                            <p className="text-slate-300 text-xs mb-2">22 yaş üstü en fazla 6 yabancı oyuncu kiralanabilir.</p>
                            <p className="text-slate-300 text-xs">Bir sezonda 22 yaşından büyük en fazla 6 oyuncu, yabancı bir kulübe kiralanabilir.</p>
                        </div>
                    </div>

                     {/* Section: Financial */}
                     <div className="bg-[#252525] rounded-xl p-6 border border-[#333]">
                        <h4 className="text-green-500 font-bold uppercase text-sm mb-4 border-b border-[#444] pb-2">Finansal Ödüller</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center bg-[#1f1f1f] p-2 rounded border border-[#333]">
                                <span className="text-slate-400">Galibiyet</span>
                                <span className="text-green-400 font-mono font-bold">€200B</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#1f1f1f] p-2 rounded border border-[#333]">
                                <span className="text-slate-400">Beraberlik</span>
                                <span className="text-yellow-400 font-mono font-bold">€80B</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#1f1f1f] p-2 rounded border border-[#333]">
                                <span className="text-slate-400">Mağlubiyet</span>
                                <span className="text-red-400 font-mono font-bold">€1B</span>
                            </div>
                        </div>
                        <div className="mt-4 text-xs text-slate-500">
                            TV Sözleşmesi: 8 Ağustos 2025 – 8 Ağustos 2030
                        </div>
                    </div>
                    
                    {/* Section: Misc */}
                    <div className="bg-[#252525] rounded-xl p-6 border border-[#333]">
                         <h4 className="text-slate-400 font-bold uppercase text-sm mb-4 border-b border-[#444] pb-2">Diğer Kısıtlamalar</h4>
                         <ul className="list-disc list-inside text-xs text-slate-300 space-y-2">
                            <li>Denemeye alınan oyuncular resmi maçlarda oynayamaz.</li>
                            <li>1/7/2025 – 1/7/2026 tarihleri arasında iki kulüpten fazlasında resmi maça çıkan oyuncular oynatılamaz.</li>
                            <li>Bir oyuncu aynı sezon içerisinde iki kulüpten fazla forma giyemez.</li>
                         </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
