

import { Fixture, Team, NewsItem, Message, Player, MatchEvent, Position } from '../types';
import { generateId, RIVALRIES } from '../constants';
import { FAN_NAMES, DERBY_TWEETS_WIN, DERBY_TWEETS_LOSS, FAN_TWEETS_WIN, FAN_TWEETS_LOSS, FAN_TWEETS_DRAW, RESIGNATION_TWEETS, EVENT_TWEETS } from '../data/tweetPool';
import { isTransferWindowOpen } from './calendarAndFixtures';
import { fillTemplate } from './helpers';

// --- FAN TWEETS LOGIC ---

export const generateMatchTweets = (fixture: Fixture, teams: Team[], isUserTeam: boolean = false): NewsItem[] => {
    const home = teams.find(t => t.id === fixture.homeTeamId);
    const away = teams.find(t => t.id === fixture.awayTeamId);
    
    if (!home || !away || fixture.homeScore === null || fixture.awayScore === null) return [];

    const isDerby = RIVALRIES.some(pair => 
        (pair.includes(home.name) && pair.includes(away.name))
    );

    const tweets: NewsItem[] = [];
    const tweetCount = isUserTeam ? 5 : (isDerby ? 3 : 2); // Increased tweet count for user team to accommodate events

    const getRandomFan = () => FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
    
    // Shuffle helper to avoid consecutive duplicates
    const shuffle = (array: string[]) => array.sort(() => 0.5 - Math.random());

    const events = fixture.matchEvents || [];
    const eventTweetsList: { content: string, team: Team }[] = [];

    // --- 1. EVENT BASED TWEET GENERATION ---

    // A. Red Cards
    events.filter(e => e.type === 'CARD_RED').forEach(e => {
        const team = e.teamName === home.name ? home : away;
        // Resolve player name
        let playerName = e.description.split(' ')[0]; // Basic fallback
        // If we have direct access to player name via roster (optional/advanced), use it. 
        // For now relying on event description parsing or raw input if available.
        // Assuming event.playerId could help if we had full roster map, but description usually has name.
        if (e.playerId) {
             const p = team.players.find(pl => pl.id === e.playerId);
             if (p) playerName = p.name;
        }

        const template = EVENT_TWEETS.RED_CARD[Math.floor(Math.random() * EVENT_TWEETS.RED_CARD.length)];
        const content = fillTemplate(template, { player: playerName });
        eventTweetsList.push({ content, team });
    });

    // B. Injuries
    events.filter(e => e.type === 'INJURY').forEach(e => {
        const team = e.teamName === home.name ? home : away;
        let playerName = "Oyuncumuz";
        if (e.playerId) {
             const p = team.players.find(pl => pl.id === e.playerId);
             if (p) playerName = p.name;
        } else {
             playerName = e.description.split(' ')[0];
        }

        const template = EVENT_TWEETS.INJURY[Math.floor(Math.random() * EVENT_TWEETS.INJURY.length)];
        const content = fillTemplate(template, { player: playerName });
        eventTweetsList.push({ content, team });
    });

    // C. Penalty Miss
    events.filter(e => e.type === 'MISS' && e.description.toLowerCase().includes('penaltı')).forEach(e => {
        const team = e.teamName === home.name ? home : away;
        let playerName = "Penaltıcı";
        if (e.playerId) {
             const p = team.players.find(pl => pl.id === e.playerId);
             if (p) playerName = p.name;
        }

        const template = EVENT_TWEETS.PENALTY_MISS[Math.floor(Math.random() * EVENT_TWEETS.PENALTY_MISS.length)];
        const content = fillTemplate(template, { player: playerName });
        eventTweetsList.push({ content, team });
    });

    // D. Penalty Goal
    events.filter(e => e.type === 'GOAL' && (e.assist === 'Penaltı' || e.description.toLowerCase().includes('penaltı'))).forEach(e => {
        const team = e.teamName === home.name ? home : away;
        const playerName = e.scorer || "Oyuncumuz";
        
        const template = EVENT_TWEETS.PENALTY_GOAL[Math.floor(Math.random() * EVENT_TWEETS.PENALTY_GOAL.length)];
        const content = fillTemplate(template, { player: playerName });
        eventTweetsList.push({ content, team });
    });

    // E. Goal Hero (Hat-Trick check)
    const scorers: Record<string, number> = {};
    events.filter(e => e.type === 'GOAL').forEach(e => {
        if(e.scorer) scorers[e.scorer] = (scorers[e.scorer] || 0) + 1;
    });
    
    Object.entries(scorers).forEach(([name, count]) => {
        if (count >= 2) { // 2+ Goals gets praise
            const team = [home, away].find(t => t.players.some(p => p.name === name)) || home;
            const template = EVENT_TWEETS.GOAL_HERO[Math.floor(Math.random() * EVENT_TWEETS.GOAL_HERO.length)];
            const content = fillTemplate(template, { player: name });
            eventTweetsList.push({ content, team });
        }
    });

    // --- 2. GENERAL RESULT TWEET GENERATION ---

    let homePool: string[] = [];
    let awayPool: string[] = [];
    
    // Merge standard and derby tweets if it's a derby
    const winSource = isDerby ? [...DERBY_TWEETS_WIN, ...DERBY_TWEETS_WIN, ...FAN_TWEETS_WIN] : [...FAN_TWEETS_WIN];
    const lossSource = isDerby ? [...DERBY_TWEETS_LOSS, ...DERBY_TWEETS_LOSS, ...FAN_TWEETS_LOSS] : [...FAN_TWEETS_LOSS];
    const drawSource = [...FAN_TWEETS_DRAW];

    if (fixture.homeScore > fixture.awayScore) {
        // Home Won: Home fans Happy, Away fans Angry
        homePool = shuffle(winSource);
        awayPool = shuffle(lossSource);
    } else if (fixture.homeScore < fixture.awayScore) {
        // Away Won: Home fans Angry, Away fans Happy
        homePool = shuffle(lossSource);
        awayPool = shuffle(winSource);
    } else {
        // Draw: Both mixed
        homePool = shuffle(drawSource);
        awayPool = shuffle(drawSource);
    }

    // --- 3. MERGE AND SELECT TWEETS ---
    
    let createdCount = 0;

    // First, add all Event Tweets (limited to 3 max to not spam feed if match was crazy)
    const shuffledEventTweets = eventTweetsList.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    shuffledEventTweets.forEach(et => {
        const fan = getRandomFan();
        const fanTitle = `${fan.name}|${fan.handle}|${et.team.name}`;
        
        tweets.push({
            id: generateId(),
            week: fixture.week,
            type: 'MATCH',
            title: fanTitle,
            content: et.content
        });
        createdCount++;
    });

    // Fill the rest with Result Tweets
    while (createdCount < tweetCount) {
        // Alternate between home and away fans for balance
        const isHomeFan = createdCount % 2 === 0;
        const pool = isHomeFan ? homePool : awayPool;
        const fanTeam = isHomeFan ? home : away;
        
        if (pool.length > 0) {
            const fan = getRandomFan();
            const content = pool[createdCount % pool.length]; // Cycle through pool
            const fanTitle = `${fan.name}|${fan.handle}|${fanTeam.name}`;

            tweets.push({
                id: generateId(),
                week: fixture.week,
                type: 'MATCH',
                title: fanTitle, 
                content: content
            });
        }
        createdCount++;
    }

    return tweets;
};

export const generateResignationTweets = (week: number, myTeam: Team): NewsItem[] => {
    const tweets: NewsItem[] = [];
    const count = 3; // Generate 3 angry tweets

    for(let i=0; i<count; i++) {
        const fan = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
        const content = RESIGNATION_TWEETS[Math.floor(Math.random() * RESIGNATION_TWEETS.length)];
        
        tweets.push({
            id: generateId(),
            week,
            type: 'MATCH', // Use MATCH type for tweets
            title: `${fan.name}|${fan.handle}|${myTeam.name}`,
            content: content
        });
    }
    return tweets;
};

// Generates tweets when a STAR player is sold against fans' wishes
export const generateStarSoldRiotTweets = (week: number, myTeam: Team, soldPlayerName: string): NewsItem[] => {
    const tweets: NewsItem[] = [];
    const count = 4; // High volume of angry tweets

    const angryTemplates = [
        "YAZIKLAR OLSUN! {player} gibi bir değer satılır mı?",
        "Bu takımın ruhunu sattınız! {player} bizim kırmızı çizgimizdi!",
        "Kombinemi iptal ediyorum. {player} yoksa ben de yokum.",
        "Yönetim İSTİFA! {player}'ı satarak şampiyonluğu sattınız.",
        "Para için {player} harcandı. Bu ihaneti unutmayacağız.",
        "Hocam {player}'ın gidişine nasıl onay verirsin? Yazık!",
        "Takımın en iyisini satmak vizyonsuzluktur. Hoşçakal {player}...",
        "{player} olmadan bu takım küme düşer. Büyük hata yaptınız."
    ];

    for(let i=0; i<count; i++) {
        const fan = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
        const template = angryTemplates[Math.floor(Math.random() * angryTemplates.length)];
        const content = fillTemplate(template, { player: soldPlayerName });
        
        tweets.push({
            id: generateId(),
            week,
            type: 'TRANSFER',
            title: `${fan.name}|${fan.handle}|${myTeam.name}`,
            content: content
        });
    }
    return tweets;
};

export const generateWeeklyNews = (week: number, fixtures: Fixture[], teams: Team[], myTeamId?: string | null): NewsItem[] => {
    const socialFeed: NewsItem[] = [];
    
    // Determine User's League for Filtering
    let userLeagueId = 'LEAGUE'; // Default
    if (myTeamId) {
        const userTeam = teams.find(t => t.id === myTeamId);
        if (userTeam) {
            userLeagueId = userTeam.leagueId || 'LEAGUE';
        }
    }

    // Filter for played matches this week
    const playedFixtures = fixtures.filter(f => f.week === week && f.played);

    playedFixtures.forEach(fixture => {
        // If it's the user's match, skip it because tweets were generated instantly after match
        if (myTeamId && (fixture.homeTeamId === myTeamId || fixture.awayTeamId === myTeamId)) {
            return;
        }

        // FİLTRELEME: Sadece kullanıcının ligindeki takımların maçlarını göster
        const homeTeam = teams.find(t => t.id === fixture.homeTeamId);
        if (!homeTeam) return;

        const fixtureLeagueId = homeTeam.leagueId || 'LEAGUE';
        
        // Eğer maçın ligi, Avrupa Ligi ise (çakma takımlar) atla
        if (fixtureLeagueId === 'EUROPE_LEAGUE') return;
        
        // Eğer maçın ligi, kullanıcının ligi ile aynı DEĞİLSE atla
        if (fixtureLeagueId !== userLeagueId) {
            return;
        }

        // Generate match tweets
        const matchTweets = generateMatchTweets(fixture, teams, false);
        socialFeed.push(...matchTweets);
    });

    // --- TRANSFER WINDOW FAN REACTIONS ---
    const weekFixtures = fixtures.filter(f => f.week === week);
    const dateToCheck = weekFixtures.length > 0 ? weekFixtures[0].date : new Date().toISOString();

    if (isTransferWindowOpen(dateToCheck)) {
        
        // 1. Generic Rumors & Demands
        const genericRumors = [
            "Yönetim uyuma transfer yap! Takımın takviyeye ihtiyacı var.",
            "Orta saha çöktü, transfer lazım!",
            "Bir tane golcü almamız şart!",
            "Bu takıma 10 numara lazım, oyun kuramıyoruz.",
            "Savunma evlere şenlik, stoper alın.",
            "Kanatlar çalışmıyor, hızlı bir açık oyuncusu şart.",
            "Transfer dönemi bitiyor hala ses yok, sabrımız taşıyor.",
            "Genç yeteneklere yönelmemiz lazım.",
            "Yıldız transferi bekliyoruz başkan!",
            "Başkan, kasayı açma zamanı geldi!",
            "Bir tane oyun kurucu getirseniz yeter lan SİKERİM BÖYLE YÖNETİMİ!",
            "Transfer istiyoruz, açıklama değil!",
            "Bu takıma lider stoper lazım.",
            "Transfer yoksa başarı da yok.",
            "Başkan bu taraftarın sabrı kalmadı.",
            "Genç değil direkt oynayacak adam lazım!",
            "Rakipler çağı yakaladı biz hala bekliyoruz.",
            "Lige damga vuracak bir yıldız lazım.",
            "Yönetim bu transfer işini ciddiye alsın.",
        ];

        // Only generate user-specific transfer demands if user team is known
        if (myTeamId) {
            const myTeam = teams.find(t => t.id === myTeamId);
            const myLastFixture = playedFixtures.find(f => f.homeTeamId === myTeamId || f.awayTeamId === myTeamId);

            if (myTeam) {
                // Logic 4: Don't Sell Star Player (Untouchables Logic)
                // Identify Top 2 players by skill
                const starPlayers = [...myTeam.players].sort((a,b) => b.skill - a.skill).slice(0, 2);
                
                starPlayers.forEach(star => {
                    if (Math.random() < 0.08) {
                        const fan = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
                        const templates = [
                            "{player} bizim kırmızı çizgimizdir! Ona gelen teklifleri reddedin.",
                            "Sakın {player}'ı satmayı aklınızdan geçirmeyin, yakarız buraları!",
                            "Bu takımın kaptanı ve ruhu {player}'dır. Satılması teklif dahi edilemez.",
                            "{player} giderse kombine yenilemem, net konuşuyorum.",
                            "Yönetim aklını başına al, {player} takımda kalmalı."
                        ];
                        const template = templates[Math.floor(Math.random() * templates.length)];
                        
                        socialFeed.push({
                            id: generateId(),
                            week,
                            type: 'TRANSFER',
                            title: `${fan.name}|${fan.handle}|${myTeam.name}`,
                            content: fillTemplate(template, { player: star.name })
                        });
                    }
                });

                // Logic 1: Bad Performance Targeting
                if (myLastFixture && myLastFixture.stats) {
                    const myRatings = myLastFixture.homeTeamId === myTeamId ? myLastFixture.stats.homeRatings : myLastFixture.stats.awayRatings;
                    // Find a player with bad rating (< 6.0)
                    const badPlayer = myRatings.find(p => p.rating < 6.0);
                    const fan = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];

                    if (badPlayer && Math.random() > 0.5) {
                        socialFeed.push({
                            id: generateId(),
                            week,
                            type: 'TRANSFER',
                            title: `${fan.name}|${fan.handle}|${myTeam.name}`,
                            content: `${badPlayer.name} bu takımın oyuncusu değil. Derhal gönderilmeli ve yerine adam alınmalı!`
                        });
                    }
                }

                // Logic 2: Need Striker (If scored 0 goals in last match)
                if (myLastFixture) {
                    const myScore = myLastFixture.homeTeamId === myTeamId ? myLastFixture.homeScore : myLastFixture.awayScore;
                    if (myScore === 0 && Math.random() > 0.6) {
                        const fan2 = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
                        socialFeed.push({
                            id: generateId(),
                            week,
                            type: 'TRANSFER',
                            title: `${fan2.name}|${fan2.handle}|${myTeam.name}`,
                            content: "İleri uçta çoğalamıyoruz, gol yollarında etkisiziz. Acil forvet transferi şart!"
                        });
                    }
                    
                    // Logic 3: Need Defender (If conceded 2+ goals)
                    const oppScore = myLastFixture.homeTeamId === myTeamId ? myLastFixture.awayScore : myLastFixture.homeScore;
                    if (oppScore !== null && oppScore >= 2 && Math.random() > 0.6) {
                        const fan3 = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
                        socialFeed.push({
                            id: generateId(),
                            week,
                            type: 'TRANSFER',
                            title: `${fan3.name}|${fan3.handle}|${myTeam.name}`,
                            content: "Savunma yol geçen hanı oldu. Yönetim stoper almıyor mu, bizi mi sınıyor?"
                        });
                    }
                }
            }
        }

        // Add a random generic rumor from another team IN THE SAME LEAGUE
        if (Math.random() > 0.3) {
            // FİLTRELEME: Sadece kullanıcının ligindeki diğer takımlar ve çakma olmayanlar
            const leaguePeerTeams = teams.filter(t => 
                (t.leagueId || 'LEAGUE') === userLeagueId && // Aynı lig
                t.id !== myTeamId && // Kullanıcı takımı hariç
                t.leagueId !== 'EUROPE_LEAGUE' // Avrupa Ligi takımları hariç
            );
            
            if (leaguePeerTeams.length > 0) {
                const randomFan = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
                const randomTeam = leaguePeerTeams[Math.floor(Math.random() * leaguePeerTeams.length)];
                const content = genericRumors[Math.floor(Math.random() * genericRumors.length)];
                
                socialFeed.push({
                    id: generateId(),
                    week,
                    type: 'TRANSFER',
                    title: `${randomFan.name}|${randomFan.handle}|${randomTeam.name}`,
                    content: content
                });
            }
        }
    }

    return socialFeed.reverse(); // Newest first
};

// --- PLAYER COMPLAINTS GENERATOR ---
export const generatePlayerMessages = (week: number, myTeam: Team, fixtures: Fixture[]): Message[] => {
    // Requires at least 3 weeks of data to judge "last 3 games"
    if (week <= 3) return [];

    // Find the last 3 matches for the user's team that have been played
    const teamMatches = fixtures
        .filter(f => f.played && (f.homeTeamId === myTeam.id || f.awayTeamId === myTeam.id))
        .sort((a, b) => b.week - a.week) // Sort descending by week (newest first)
        .slice(0, 3); // Take top 3

    // If for some reason we don't have 3 matches (e.g. bye weeks), skip
    if (teamMatches.length < 3) return [];

    const complainingPlayers: Player[] = [];

    // Iterate through all players to find those who didn't play
    myTeam.players.forEach(player => {
        // Don't complain if injured or suspended (they know why they aren't playing)
        if (player.injury || (player.suspendedUntilWeek && player.suspendedUntilWeek > week)) return;

        // Check if player appeared in ANY of the last 3 matches
        const playedRecently = teamMatches.some(match => {
            const stats = match.stats;
            // Defensive check if stats don't exist
            if (!stats) return false;

            const isHome = match.homeTeamId === myTeam.id;
            // Check rating lists to see if player played
            const playerPerformanceList = isHome ? stats.homeRatings : stats.awayRatings;
            
            return playerPerformanceList.some(p => p.playerId === player.id);
        });

        // If NOT played recently, add to candidates
        if (!playedRecently) {
             complainingPlayers.push(player);
        }
    });

    // Limit to MAXIMUM 1 message per week
    if (complainingPlayers.length === 0) return [];

    // Pick one random unhappy player
    const player = complainingPlayers[Math.floor(Math.random() * complainingPlayers.length)];

    // Generate Message Content
    // Random chance (e.g. 30% per week for unhappy players) to avoid spamming every single week
    // Also higher chance if morale is already low
    const complaintChance = player.morale < 70 ? 0.4 : 0.2;
    
    if (Math.random() < complaintChance) {
        const isStar = player.skill > 80;
        
        let subject = "Forma Şansı";
        let text = "Hocam, son 3 maçtır forma yüzü göremiyorum. Kendimi göstermek istiyorum.";
        let options = [
            "Çok çalış, formayı kap.",
            "Sıran gelecek, sabırlı ol.",
            "Şu an kadro planlamamda yoksun."
        ];

        if (isStar) {
            subject = "Durumum Hakkında Acil";
            text = "Hocam, ben yedek kulübesinde oturmak için gelmedim. Son 3 maçtır yokum, eğer oynamayacaksam menajerimle konuşacağım.";
            options = [
                "Sen bu takımın yıldızısın, haklısın. İlk maçta sahadasın.",
                "Kimse bu takımda formayı garanti göremez, çalışacaksın.",
                "Kapı orada, gitmek istersen tutmam."
            ];
        } 

        return [{
            id: parseInt(generateId() + Math.floor(Math.random() * 1000).toString(), 36) || Date.now() + Math.random(),
            sender: player.name,
            subject: subject,
            preview: text,
            date: 'Bugün',
            read: false,
            // Correct avatar logic for Positions using enums
            avatarColor: player.position === Position.GK ? 'bg-yellow-600' : [Position.SLB, Position.STP, Position.SGB].includes(player.position) ? 'bg-blue-600' : [Position.OS, Position.OOS].includes(player.position) ? 'bg-green-600' : 'bg-red-600',
            history: [
                { id: Date.now(), text: text, time: '09:00', isMe: false }
            ],
            options: options
        }];
    }

    return [];
};
