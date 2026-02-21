

import React, { useState, useEffect } from 'react';
import { NewsItem, Team, Message, Player } from '../types';
import { Smartphone, Hash, Heart, User, Send, MessageSquare, RotateCcw, BadgeCheck, MessageCircle, AlertTriangle, Newspaper } from 'lucide-react';
import { pick } from '../utils/helpers';

// JOURNALIST PERSONAS
const JOURNALISTS = [
    { name: "Fabri Roman", handle: "@FabriRoman", reliability: 99, avatarColor: "bg-blue-600", verify: true, tagline: "Here we go! 🚨" },
    { name: "Yağız Sabuncu", handle: "@yagosabuncu", reliability: 95, avatarColor: "bg-yellow-600", verify: true, tagline: "ÖZEL |" },
    { name: "Nevzat Dindar", handle: "@nevzatdindar", reliability: 75, avatarColor: "bg-red-600", verify: true, tagline: "SICAK GELİŞME" },
    { name: "Sercan Hamzaoğlu", handle: "@sercanhamzaoglu", reliability: 80, avatarColor: "bg-purple-600", verify: true, tagline: "Kulis Bilgisi" },
    { name: "Duyumcu Dayı", handle: "@duyumcudayi", reliability: 30, avatarColor: "bg-slate-500", verify: false, tagline: "Kesin bilgi yayalım..." },
    { name: "Transfer Merkezi", handle: "@transfermerkezi", reliability: 60, avatarColor: "bg-green-600", verify: false, tagline: "İddia:" }
];

// RUMOR TEMPLATES
const RUMOR_TEMPLATES = [
    "{team} yönetimi {player} için resmi teklif yapmaya hazırlanıyor. Oyuncu sıcak bakıyor.",
    "{team}, {targetTeam}'in yıldızı {player} ile prensipte anlaştı. Kulüpler görüşüyor.",
    "{team} teknik direktörü, {player} transferini bizzat istedi.",
    "{player} menajeri İstanbul'a geldi! {team} ile masaya oturacak.",
    "{team}, {player} için {amount} M€ bonservis bedelini gözden çıkardı.",
    "{team} taraftarı {player} transferi için sosyal medyada kampanya başlattı.",
    "Bomba iddia! {team}, rakibi {targetTeam}'in kaptanı {player}'a kanca attı.",
    "{player} takımdan ayrılmak istediğini yönetime iletti. {team} pusuda bekliyor.",
    "{team} transferde rotayı {player}'a çevirdi. Görüşmeler başladı.",
    "{team} başkanı: '{player} gibi bir oyuncuyu kim istemez ki?'",
];

// FAN REACTIONS TO RUMORS
const RUMOR_REACTIONS = [
    "Gelirse ligi donunda sallar!",
    "Çöp transfer, parayı çöpe atmayın.",
    "Yönetim istifa, yine geç kaldık!",
    "Fabri dediyse bitmiştir, hayırlı olsun.",
    "Yağız abi balon haber yapmaz, bu iş biter.",
    "Bize böyle topçu lazım işte, helal olsun.",
    "O paraya 3 tane genç alırsın, vizyonsuzluk.",
    "Bu adam sakat değil miydi ya?",
    "Forma siparişini verdim bile!",
    "İnanmayın beyler, menajer oyunu.",
    "Kaynak sağlam mı dayı?",
    "Gelirse havalimanına kadar taşırım.",
    "Bu sene o sene, şampiyonluk geliyor!",
    "Rüyamda gördüm bu adam bize gelecek."
];

interface Rumor {
    id: string;
    journalist: typeof JOURNALISTS[0];
    content: string;
    targetPlayer?: string;
    targetTeam?: string;
    reactions: string[];
}

const SocialMediaView = ({ news, teams, messages, onUpdateMessages, onReply, isTransferWindowOpen, myTeamId }: { news: NewsItem[], teams: Team[], messages: Message[], onUpdateMessages?: (msgs: Message[]) => void, onReply?: (msgId: number, optIndex: number) => void, isTransferWindowOpen: boolean, myTeamId?: string }) => {
    const [tab, setTab] = useState<'SOCIAL' | 'NEWS' | 'RUMORS'>('SOCIAL');
    const [interactions, setInteractions] = useState<Record<string, {
        likes: number;
        rts: number;
        liked: boolean;
        rted: boolean;
        comments: string[];
        showComments: boolean;
    }>>({});
    const [replyText, setReplyText] = useState("");
    
    // Dynamic Rumors State
    const [rumors, setRumors] = useState<Rumor[]>([]);

    // --- RUMOR GENERATION LOGIC ---
    useEffect(() => {
        if (isTransferWindowOpen && rumors.length === 0 && teams.length > 0) {
            
            // FİLTRELEME: Söylentiler sadece KULLANICININ LİGİNDEKİ takımlar arasında dönsün
            // Eğer myTeamId yoksa varsayılan olarak Süper Lig
            let userLeagueId = 'LEAGUE';
            if (myTeamId) {
                const myTeam = teams.find(t => t.id === myTeamId);
                if (myTeam) userLeagueId = myTeam.leagueId || 'LEAGUE';
            }

            // Avrupa ligi takımlarını (çakma takımları) ve farklı ligi filtrele
            const relevantTeams = teams.filter(t => 
                (t.leagueId || 'LEAGUE') === userLeagueId && 
                t.leagueId !== 'EUROPE_LEAGUE'
            );
            
            if (relevantTeams.length < 2) return; // Yeterli takım yoksa dur

            const newRumors: Rumor[] = [];
            const count = 6; // Generate 6 daily rumors

            for (let i = 0; i < count; i++) {
                const journalist = pick(JOURNALISTS);
                const buyingTeam = pick(relevantTeams); // Sadece ilgili ligden alıcı
                
                // Avoid buying team selling to itself
                const otherTeams = relevantTeams.filter(t => t.id !== buyingTeam.id);
                const sellingTeam = pick(otherTeams); // Sadece ilgili ligden satıcı
                
                // Pick a player to target
                if (!sellingTeam || sellingTeam.players.length === 0) continue;
                // Target star players more often for hype
                const sortedPlayers = [...sellingTeam.players].sort((a,b) => b.skill - a.skill);
                // Pick from top 5 players randomly
                const targetPlayer = sortedPlayers[Math.floor(Math.random() * Math.min(5, sortedPlayers.length))];

                const template = pick(RUMOR_TEMPLATES);
                const amount = Math.floor(targetPlayer.value * (1 + Math.random() * 0.5)); // Inflated price

                let content = template
                    .replace('{team}', buyingTeam.name)
                    .replace('{targetTeam}', sellingTeam.name)
                    .replace('{player}', targetPlayer.name)
                    .replace('{amount}', amount.toString());

                // Add Journalist Tagline
                content = `${journalist.tagline} ${content}`;

                // Generate Fan Reactions
                const reactions = [];
                const reactionCount = Math.floor(Math.random() * 3) + 1;
                for(let j=0; j<reactionCount; j++) {
                    reactions.push(pick(RUMOR_REACTIONS));
                }

                newRumors.push({
                    id: Math.random().toString(36).substr(2, 9),
                    journalist,
                    content,
                    targetPlayer: targetPlayer.name,
                    targetTeam: buyingTeam.name,
                    reactions
                });
            }
            setRumors(newRumors);
        } else if (!isTransferWindowOpen) {
            setRumors([]); // Clear rumors if window closed
        }
    }, [isTransferWindowOpen, teams, myTeamId]);

    // Initialize stats with Team Popularity Logic
    useEffect(() => {
        const newInteractions = { ...interactions };
        let hasChanges = false;

        news.forEach(n => {
            if (!newInteractions[n.id]) {
                let minLikes = 10;
                let maxLikes = 500;
                let minRTs = 2;
                let maxRTs = 50;

                // Check if it's an OFFICIAL account
                if (n.title.includes('|OFFICIAL')) {
                    const parts = n.title.split('|');
                    const teamName = parts[0];
                    const team = teams.find(t => t.name === teamName);

                    if (team) {
                        const maxFans = 25000000;
                        const normalizedFans = Math.min(1, Math.max(0, team.fanBase / maxFans));
                        const baseLikes = 10000 + (normalizedFans * 70000);
                        const variance = baseLikes * 0.15;
                        minLikes = Math.floor(baseLikes - variance);
                        maxLikes = Math.floor(baseLikes + variance);
                        minRTs = Math.floor(minLikes * 0.05);
                        maxRTs = Math.floor(maxLikes * 0.15);
                    } else {
                        minLikes = 5000;
                        maxLikes = 15000;
                    }
                }

                const likes = Math.floor(Math.random() * (maxLikes - minLikes)) + minLikes;
                const rts = Math.floor(Math.random() * (maxRTs - minRTs)) + minRTs;

                newInteractions[n.id] = {
                    likes: likes,
                    rts: rts,
                    liked: false,
                    rted: false,
                    comments: [],
                    showComments: false
                };
                hasChanges = true;
            }
        });

        if (hasChanges) {
            setInteractions(newInteractions);
        }
    }, [news, teams]);

    const toggleLike = (id: string) => {
        setInteractions(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                likes: prev[id].liked ? prev[id].likes - 1 : prev[id].likes + 1,
                liked: !prev[id].liked
            }
        }));
    };

    const toggleRt = (id: string) => {
        setInteractions(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                rts: prev[id].rted ? prev[id].rts - 1 : prev[id].rts + 1,
                rted: !prev[id].rted
            }
        }));
    };

    const toggleComments = (id: string) => {
        setInteractions(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                showComments: !prev[id].showComments
            }
        }));
    };

    const submitComment = (id: string) => {
        if (!replyText.trim()) return;
        setInteractions(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                comments: [...prev[id].comments, replyText]
            }
        }));
        setReplyText("");
    };

    const tabs = [
        { id: 'SOCIAL', label: 'Sosyal Medya', icon: Smartphone },
        { id: 'NEWS', label: 'Haberler', icon: Newspaper },
        { id: 'RUMORS', label: 'Söylentiler', icon: Hash },
    ];
    
    const getAvatarColor = (index: number) => {
        const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'];
        return colors[index % colors.length];
    };

    // Helper to format numbers (e.g. 12.5K)
    const formatCount = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'B';
        return num.toString();
    };

    // Filter News for Tabs
    const fanNews = news.filter(n => !n.title.includes('|OFFICIAL') || n.type !== 'TRANSFER');
    const officialNews = news.filter(n => n.title.includes('|OFFICIAL') && n.type === 'TRANSFER');

    return (
        <div className="w-full h-full flex flex-col">
            {/* Social Header with Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/50 px-2 mb-6 overflow-x-auto">
                {tabs.map((t) => {
                    const isActive = tab === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`flex items-center gap-2 px-5 py-3 text-base font-bold transition-all relative rounded-t-xl group whitespace-nowrap ${
                                isActive 
                                ? 'text-yellow-600 dark:text-yellow-400 bg-white dark:bg-slate-800' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/30'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow-600 dark:bg-yellow-400 rounded-t-full shadow-[0_1px_8px_rgba(250,204,21,0.5)]"></div>
                            )}
                            <t.icon size={18} className={`${isActive ? "text-yellow-600 dark:text-yellow-400" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`} />
                            <span>{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-10 custom-scrollbar">
                
                {/* 1. SOCIAL FEED (Fan Tweets & Match Results) */}
                {tab === 'SOCIAL' && fanNews.map((n, idx) => {
                    let name = "Taraftar";
                    let handle = "@taraftar";
                    let teamAffiliation = "";
                    
                    if (n.title.includes('|')) {
                        const parts = n.title.split('|');
                        name = parts[0];
                        handle = parts[1];
                        teamAffiliation = parts[2];
                    } else {
                        name = n.title;
                        handle = `@${n.title.toLowerCase().replace(/\s/g, '')}`;
                    }
                    
                    const avatarColor = getAvatarColor(idx);
                    const fanTeam = teams.find(t => t.name === teamAffiliation);
                    const stats = interactions[n.id] || { likes: 0, rts: 0, liked: false, rted: false, comments: [], showComments: false };

                    return (
                        <div key={n.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex gap-4 shadow-sm w-full">
                            <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center ${avatarColor} text-white text-lg font-bold`}>
                                {name.charAt(0)}
                            </div>

                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-900 dark:text-white text-base">{name}</span>
                                    <span className="text-slate-500 text-sm">{handle}</span>
                                    
                                    {fanTeam ? (
                                        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${fanTeam.colors[0]} ${fanTeam.colors[1]} border-slate-300 dark:border-slate-600`}>
                                            {fanTeam.logo && <img src={fanTeam.logo} className="w-3 h-3 object-contain" alt="" />}
                                            <span className="font-bold uppercase tracking-wide">{fanTeam.name}</span>
                                        </span>
                                    ) : teamAffiliation ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 uppercase tracking-wide">
                                            {teamAffiliation}
                                        </span>
                                    ) : null}

                                    <span className="text-slate-400 dark:text-slate-500 text-xs ml-auto font-medium">{n.week}. Hf</span>
                                </div>
                                <p className="text-slate-800 dark:text-slate-100 text-sm leading-relaxed mb-3">{n.content}</p>
                                
                                <div className="flex gap-6 text-slate-500 text-xs font-bold border-t border-slate-200 dark:border-slate-700/50 pt-2 items-center">
                                    <button onClick={() => toggleComments(n.id)} className={`flex items-center gap-1.5 cursor-pointer transition ${stats.showComments ? 'text-blue-500' : 'hover:text-blue-500'}`}>
                                        <MessageSquare size={16} className={stats.showComments ? 'fill-blue-500 text-blue-500' : ''}/> 
                                        {formatCount(Math.floor(stats.likes/10) + stats.comments.length)}
                                    </button>
                                    <button onClick={() => toggleRt(n.id)} className={`flex items-center gap-1.5 cursor-pointer transition ${stats.rted ? 'text-green-600' : 'hover:text-green-600'}`}>
                                        <RotateCcw size={16} /> {formatCount(stats.rts)}
                                    </button>
                                    <button onClick={() => toggleLike(n.id)} className={`flex items-center gap-1.5 cursor-pointer transition ${stats.liked ? 'text-red-500' : 'hover:text-red-500'}`}>
                                        <Heart size={16} className={stats.liked ? 'fill-red-500 text-red-500' : ''}/> {formatCount(stats.likes)}
                                    </button>
                                </div>

                                {stats.showComments && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                        {stats.comments.length > 0 && (
                                            <div className="space-y-3 mb-3">
                                                {stats.comments.map((comment, i) => (
                                                    <div key={i} className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-600">
                                                            <User size={16} className="text-slate-500 dark:text-slate-400"/>
                                                        </div>
                                                        <div className="bg-white dark:bg-slate-700 p-2.5 rounded-lg rounded-tl-none shadow-sm flex-1">
                                                            <p className="text-slate-700 dark:text-slate-300 text-sm">{comment}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Yorumunu yaz..." className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 transition placeholder-slate-400 dark:placeholder-slate-600" onKeyDown={(e) => e.key === 'Enter' && submitComment(n.id)}/>
                                            <button onClick={() => submitComment(n.id)} disabled={!replyText.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl font-bold transition flex items-center"><Send size={16} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* 2. NEWS TAB (Official Transfer Announcements) */}
                {tab === 'NEWS' && (
                    <div className="space-y-4">
                        {officialNews.length === 0 ? (
                            <div className="text-center py-20 opacity-50 text-slate-500 dark:text-slate-400 flex flex-col items-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                                <Newspaper size={48} className="mx-auto mb-2"/>
                                <p className="text-base">Henüz resmi transfer haberi yok.</p>
                            </div>
                        ) : (
                            officialNews.map((n) => {
                                const parts = n.title.split('|');
                                const teamName = parts[0];
                                const handle = parts[1] || '@Transfer';
                                const teamObj = teams.find(t => t.name === teamName);
                                const stats = interactions[n.id] || { likes: 0, rts: 0, liked: false, rted: false, comments: [], showComments: false };

                                return (
                                    <div key={n.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex gap-4 shadow-md w-full relative overflow-hidden group">
                                        {/* Background accent */}
                                        <div className={`absolute top-0 right-0 w-24 h-24 opacity-5 rounded-bl-full pointer-events-none ${teamObj ? teamObj.colors[0].replace('text-', 'bg-') : 'bg-slate-500'}`}></div>

                                        {teamObj && teamObj.logo ? (
                                            <img src={teamObj.logo} className="w-14 h-14 rounded-full shrink-0 object-contain bg-white border-2 border-slate-200 p-1" alt={teamObj.name} />
                                        ) : (
                                            <div className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center bg-blue-600 text-white text-xl font-bold border-2 border-white">
                                                {teamName.charAt(0)}
                                            </div>
                                        )}

                                        <div className="flex-1 z-10">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="font-bold text-slate-900 dark:text-white text-lg">{teamName}</span>
                                                <BadgeCheck size={18} className="text-blue-500 fill-white dark:fill-slate-800" />
                                                <span className="text-slate-500 text-sm ml-1">{handle}</span>
                                                <span className="text-slate-400 dark:text-slate-500 text-xs ml-auto font-mono">{n.week}. Hafta</span>
                                            </div>
                                            
                                            <p className="text-slate-800 dark:text-slate-100 text-base leading-relaxed mb-4 font-medium">
                                                {n.content}
                                            </p>
                                            
                                            {/* Image Placeholder or Styled Quote for Transfer */}
                                            <div className={`rounded-xl p-4 mb-4 ${teamObj ? teamObj.colors[0] : 'bg-slate-700'} bg-opacity-10 dark:bg-opacity-20 border border-slate-200 dark:border-slate-600`}>
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                    Resmi Açıklama
                                                </div>
                                            </div>

                                            <div className="flex gap-8 text-slate-500 text-sm font-bold border-t border-slate-200 dark:border-slate-700/50 pt-3 items-center">
                                                <button onClick={() => toggleComments(n.id)} className={`flex items-center gap-2 cursor-pointer transition ${stats.showComments ? 'text-blue-500' : 'hover:text-blue-500'}`}>
                                                    <MessageSquare size={18} className={stats.showComments ? 'fill-blue-500 text-blue-500' : ''}/> 
                                                    {formatCount(Math.floor(stats.likes/10) + stats.comments.length)}
                                                </button>
                                                <button onClick={() => toggleRt(n.id)} className={`flex items-center gap-2 cursor-pointer transition ${stats.rted ? 'text-green-600' : 'hover:text-green-600'}`}>
                                                    <RotateCcw size={18} /> {formatCount(stats.rts)}
                                                </button>
                                                <button onClick={() => toggleLike(n.id)} className={`flex items-center gap-2 cursor-pointer transition ${stats.liked ? 'text-red-500' : 'hover:text-red-500'}`}>
                                                    <Heart size={18} className={stats.liked ? 'fill-red-500 text-red-500' : ''}/> {formatCount(stats.likes)}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* 3. RUMORS TAB */}
                {tab === 'RUMORS' && (
                    <div className="space-y-4">
                        {!isTransferWindowOpen ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                                <AlertTriangle size={64} className="text-slate-400 mb-4 opacity-50"/>
                                <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300">Sessizlik Hakim</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2">Transfer dönemi kapalı olduğu için ortalık sakin.</p>
                            </div>
                        ) : (
                            rumors.map(r => (
                                <div key={r.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition w-full relative overflow-hidden group">
                                    <div className="flex items-start gap-4 mb-4 relative z-10">
                                        <div className={`w-12 h-12 rounded-full ${r.journalist.avatarColor} flex items-center justify-center text-white text-lg font-bold shrink-0 border-2 border-white dark:border-slate-700`}>
                                            {r.journalist.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-slate-900 dark:text-white text-base">{r.journalist.name}</span>
                                                {r.journalist.verify && <BadgeCheck size={16} className="text-blue-500 fill-white dark:fill-slate-800" />}
                                                <span className="text-slate-500 text-xs ml-1">{r.journalist.handle}</span>
                                            </div>
                                            <p className="text-slate-800 dark:text-slate-200 text-sm mt-1 leading-relaxed">
                                                {r.content}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 relative z-10">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><MessageCircle size={12}/> Anlık Tepkiler</div>
                                        <div className="space-y-2">
                                            {r.reactions.map((reaction, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${getAvatarColor(i)}`}>U</div>
                                                    <div className="bg-slate-5 dark:bg-slate-900 px-3 py-1.5 rounded-lg rounded-tl-none text-xs text-slate-600 dark:text-slate-300 shadow-sm">{reaction}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="absolute -top-4 -right-4 text-slate-100 dark:text-slate-700/20 opacity-50 group-hover:scale-110 transition-transform duration-500"><Hash size={100} /></div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialMediaView;
