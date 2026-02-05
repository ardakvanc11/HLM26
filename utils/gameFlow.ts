
import { Player, Team, Position, TrainingType, TrainingIntensity, TrainingConfig, TrainingReportItem, PlayerPersonality, ManagerProfile } from '../types';
import { generatePlayer } from '../constants';
import { calculateMarketValue } from '../data/playerConstants';
import { calculateTeamStrength, calculatePlayerOverallFromStats } from './teamCalculations';
import { INDIVIDUAL_PROGRAMS } from '../data/trainingData';

export const generateTransferMarket = (count: number, dateStr: string): Player[] => {
    const players: Player[] = [];
    const date = new Date(dateStr);
    const month = date.getMonth(); 
    const priceMultiplier = month === 0 ? 1.5 : 1.0; 

    for(let i=0; i<count; i++) {
        const positions = [
            Position.GK, 
            Position.STP, Position.STP, Position.SLB, Position.SGB,
            Position.OS, Position.OS, Position.OOS, 
            Position.SLK, Position.SGK, Position.SNT
        ];
        const randomPos = positions[Math.floor(Math.random() * positions.length)];
        
        const isStar = Math.random() > 0.85; 
        const targetSkill = isStar 
            ? Math.floor(Math.random() * 16) + 70 
            : Math.floor(Math.random() * 26) + 40; 

        const ageRoll = Math.random();
        let age: number;
        
        if (ageRoll < 0.15) age = Math.floor(Math.random() * (22 - 18 + 1)) + 18;
        else if (ageRoll < 0.75) age = Math.floor(Math.random() * (32 - 23 + 1)) + 23;
        else age = Math.floor(Math.random() * (39 - 33 + 1)) + 33;

        let isFreeAgent = age >= 33 ? Math.random() < 0.30 : Math.random() < 0.05;

        const teamId = isFreeAgent ? 'free_agent' : 'foreign';
        const clubName = isFreeAgent ? 'Serbest' : 'Yurt Dışı Kulübü';

        const player = generatePlayer(randomPos, targetSkill, teamId, true, undefined, clubName);
        player.age = age;

        if (age > 30) {
            player.potential = Math.floor(player.skill);
        } else if (age <= 21 && player.potential < player.skill + 5) {
            let newPot = player.skill + Math.floor(Math.random() * 6) + 3;
            if (newPot > 92) {
                if (Math.random() > 0.95) newPot = 93;
                else newPot = 90;
            }
            player.potential = Math.floor(Math.min(94, Math.max(player.potential, newPot)));
        }

        player.value = calculateMarketValue(player.position, player.skill, player.age);
        let marketValue = (player.value * (0.8 + Math.random() * 0.4)) * priceMultiplier;
        player.value = Number(marketValue.toFixed(1));

        if (!isFreeAgent) {
            player.transferListed = true; 
            const willingness = player.loanWillingness || 50;
            let loanChance = 0.1;
            if (player.age <= 22) loanChance += 0.4;
            if (willingness > 70) loanChance += 0.3;
            if (player.skill < 70) loanChance += 0.1;

            if (Math.random() < loanChance) {
                player.loanListed = true;
            }
        }

        players.push(player);
    }
    return players;
};

// --- SOPHISTICATED TRAINING LOGIC CONSTANTS ---

const getImprovementThreshold = (currentValue: number): number => {
    if (currentValue < 5) return 80;
    if (currentValue < 10) return 150;
    if (currentValue < 14) return 300;
    if (currentValue < 16) return 600;
    if (currentValue < 18) return 1200;
    if (currentValue < 19) return 2500;
    return 99999;
};

const getAgeGrowthFactor = (age: number): number => {
    if (age <= 20) return 1.2;
    if (age <= 24) return 1.0;
    if (age <= 27) return 0.8;
    if (age <= 30) return 0.3;
    return 0;
};

const getPotentialFactor = (current: number, potential: number): number => {
    const gap = potential - current;
    if (gap > 10) return 1.5;
    if (gap > 5) return 1.2;
    if (gap > 2) return 1.0;
    if (gap > 0) return 0.5;
    return 0;
};

// --- NEW FUNCTION: Processes Daily Individual Training Progress ---
// This runs every day via gameStateLogic, ensuring progress happens and completes properly.
export const processDailyIndividualTraining = (player: Player, currentWeek: number): { updatedPlayer: Player, reportItem?: TrainingReportItem } => {
    let p = { ...player };
    let reportItem: TrainingReportItem | undefined;
    
    // Reset visual indicators daily
    p.recentAttributeChanges = {};

    if (!p.activeTraining) return { updatedPlayer: p };

    const program = INDIVIDUAL_PROGRAMS.find(prog => prog.id === p.activeTraining);
    if (!program) return { updatedPlayer: p };

    // 1. Increment Progress
    p.activeTrainingWeeks = (p.activeTrainingWeeks || 0) + 1;

    // 2. Calculate Daily Stat Gain (Background Progress)
    // Even without "Team Training", players do individual drills.
    const ageFactor = getAgeGrowthFactor(p.age);
    const potFactor = getPotentialFactor(p.skill, p.potential);
    const baseDailyGain = 0.8; // Constant daily gain
    
    let synergy = 1.0;
    if (program.target.includes('ALL') || program.target.includes(p.position)) {
        synergy = 1.2;
    }

    if (!p.stats) p.stats = {} as any;
    if (!p.statProgress) p.statProgress = {};

    // Apply gains and set Visual Arrows
    program.stats.forEach(statKey => {
        // @ts-ignore
        const currentVal = p.stats[statKey] || 10;
        if (currentVal >= 20) return;

        const dailyGain = baseDailyGain * ageFactor * potFactor * synergy;
        
        // @ts-ignore
        p.statProgress[statKey] = (p.statProgress[statKey] || 0) + dailyGain;
        
        // VISUAL MARKER: Show they are working on it
        p.recentAttributeChanges![statKey] = 'PARTIAL_UP';
    });

    // 3. Check for Program Completion
    let cycleWeeks = 10;
    if (p.personality === PlayerPersonality.HARDWORKING || p.personality === PlayerPersonality.AMBITIOUS) cycleWeeks = 8;
    else if (p.personality === PlayerPersonality.PROFESSIONAL) cycleWeeks = 9;
    else if (p.personality === PlayerPersonality.LAZY) cycleWeeks = 12;

    const totalDaysNeeded = cycleWeeks * 7; // Convert weeks to days

    // Update Feedback String
    const pct = Math.min(100, (p.activeTrainingWeeks / totalDaysNeeded) * 100);
    p.developmentFeedback = `${program.label}: %${Math.floor(pct)} (${cycleWeeks} Hf)`;

    // COMPLETION CHECK
    if (p.activeTrainingWeeks >= totalDaysNeeded) {
        
        // --- ROLL FOR RESULTS ---
        const shuffledStats = [...program.stats].sort(() => 0.5 - Math.random());
        let anyLevelUp = false;
        let anySignificantProgress = false;

        shuffledStats.forEach(statKey => {
            // @ts-ignore
            const currentVal = p.stats[statKey] || 10;
            const threshold = getImprovementThreshold(currentVal);
            // @ts-ignore
            const currentProg = p.statProgress[statKey] || 0;

            let levelUpChance = 0;
            if (currentVal <= 16) levelUpChance = 0.80;
            else if (currentVal <= 18) levelUpChance = 0.45;
            else if (currentVal === 19) levelUpChance = 0.10;
            else levelUpChance = 0;

            // Reduce chance if potential is capped
            if (p.skill >= p.potential) levelUpChance *= 0.2;

            const isLevelUp = Math.random() < levelUpChance;

            if (currentVal < 20 && isLevelUp) {
                // LEVEL UP
                // @ts-ignore
                p.stats[statKey] = currentVal + 1;
                // @ts-ignore
                p.statProgress[statKey] = 0;
                
                p.recentAttributeChanges![statKey] = 'UP'; // Level Up Indicator
                anyLevelUp = true;
            } else {
                // Guarantee progress boost if no level up
                const targetPct = 0.75; // Push to 75% of bar
                const targetPoints = threshold * targetPct;
                if (currentProg < targetPoints) {
                    // @ts-ignore
                    p.statProgress[statKey] = targetPoints;
                    anySignificantProgress = true;
                }
            }
        });

        // Generate Report
        let msg = "";
        let type: 'POSITIVE' | 'NEGATIVE' = 'POSITIVE';

        if (anyLevelUp) {
            msg = `${program.label} programı başarıyla tamamlandı. Özelliklerde SEVİYE ARTIŞI sağlandı!`;
            p.morale = Math.min(100, p.morale + 10);
        } else if (anySignificantProgress) {
            msg = `${program.label} programı bitti. Oyuncu özelliklerini geliştirdi ancak seviye atlayamadı.`;
            p.morale = Math.min(100, p.morale + 5);
        } else {
            msg = `${program.label} programı tamamlandı.`;
        }

        reportItem = {
            playerId: p.id,
            playerName: p.name,
            message: msg,
            type: type,
            score: 8.0
        };

        // RESET & STOP
        p.activeTraining = undefined;
        p.activeTrainingWeeks = 0;
        p.developmentFeedback = undefined;
        p.individualTrainingCooldownUntil = currentWeek + 3; // 3 Weeks Cooldown
    }

    // Recalculate OVR if stats changed
    if (p.recentAttributeChanges && Object.keys(p.recentAttributeChanges).length > 0) {
        const newSkill = calculatePlayerOverallFromStats(p);
        p.skill = Math.min(p.potential, newSkill);
        p.value = calculateMarketValue(p.position, p.skill, p.age);
    }

    return { updatedPlayer: p, reportItem };
};

export const applyTraining = (team: Team, config: TrainingConfig, currentWeek: number): { updatedTeam: Team, report: TrainingReportItem[] } => {
    // 1. Determine Intensity Base Factors
    let baseProgress = 0.5; // Base points per day
    let fatigueMalus = 0;
    
    switch (config.intensity) {
        case TrainingIntensity.LOW:
            baseProgress = 0.3;
            fatigueMalus = 3;
            break;
        case TrainingIntensity.STANDARD:
            baseProgress = 0.5;
            fatigueMalus = 8;
            break;
        case TrainingIntensity.HIGH:
            baseProgress = 0.8;
            fatigueMalus = 15;
            break;
    }

    const coachQualityFactor = (team.reputation * 10) + 50; 
    const coachBonus = coachQualityFactor / 100; 

    const report: TrainingReportItem[] = [];
    const performances: {id: string, name: string, score: number}[] = [];

    const updatedPlayers = team.players.map(p => {
        let stats = { ...p.stats };
        let statProgress = { ...(p.statProgress || {}) };
        let skill = Math.floor(p.skill);
        let condition = p.condition !== undefined ? p.condition : stats.stamina;
        
        // Preserve existing recentChanges from processDailyIndividualTraining if any
        let recentChanges = { ...p.recentAttributeChanges };

        // --- CALCULATION OF TRAINING SCORE ---
        let baseScore = 7.0 + (Math.random() * 2.5);
        if (p.morale < 50) baseScore -= (1.5 + Math.random() * 1.5);
        else if (p.morale >= 90) baseScore += 0.3;

        if (condition < 60) baseScore -= (1.0 + Math.random() * 1.0);
        else if (condition >= 90) baseScore += 0.2;

        let trainingScore = Math.max(1.0, Math.min(10.0, Number(baseScore.toFixed(1))));
        performances.push({ id: p.id, name: p.name, score: trainingScore });

        const ageFactor = getAgeGrowthFactor(p.age);
        const potFactor = getPotentialFactor(skill, p.potential);
        const personalityMod = (p.personality === PlayerPersonality.HARDWORKING || p.personality === PlayerPersonality.AMBITIOUS) 
            ? (config.intensity === TrainingIntensity.HIGH ? 1.2 : 1.0)
            : (p.personality === PlayerPersonality.LAZY && config.intensity === TrainingIntensity.HIGH ? 0.7 : 1.0);

        const canGrow = p.age < 31 && skill < p.potential && potFactor > 0;

        condition = Math.max(0, condition - (fatigueMalus * (1 + Math.random() * 0.2)));

        const addProgress = (statName: keyof typeof stats, amount: number) => {
            if (!canGrow) return;
            // @ts-ignore
            const currentVal = stats[statName] || 10;
            if (currentVal >= 20) return;

            const scoreMultiplier = trainingScore / 6.0;
            const dailyGain = amount * ageFactor * potFactor * coachBonus * personalityMod * scoreMultiplier;
            
            // @ts-ignore
            const currentProgress = statProgress[statName] || 0;
            const newProgress = currentProgress + dailyGain;
            const threshold = getImprovementThreshold(currentVal);
            
            if (newProgress >= threshold) {
                // LEVEL UP
                // @ts-ignore
                stats[statName] = currentVal + 1;
                // @ts-ignore
                statProgress[statName] = 0;
                
                recentChanges[statName as string] = 'UP'; 

                report.push({
                    playerId: p.id,
                    playerName: p.name,
                    message: `${(statName as string).toUpperCase()} özelliği gelişti! (${currentVal} -> ${currentVal+1})`,
                    type: 'POSITIVE',
                    score: trainingScore
                });
            } else {
                // @ts-ignore
                statProgress[statName] = newProgress;
            }
        };

        // --- TEAM TRAINING (General Maintenance) ---
        const activeFocuses = [config.mainFocus, config.subFocus];
        
        activeFocuses.forEach((type, index) => {
            const effectiveness = (index === 0 ? 1.0 : 0.5) * 0.15; // Increased effectiveness slightly
            
            const applyTeamStat = (key: string) => {
                // @ts-ignore
                addProgress(key, baseProgress * effectiveness);
            };

            const pickRandom = (statsArr: string[]) => {
                const selected = statsArr[Math.floor(Math.random() * statsArr.length)];
                applyTeamStat(selected);
            };

            switch (type) {
                case TrainingType.ATTACK: pickRandom(['finishing', 'offTheBall', 'firstTouch']); break;
                case TrainingType.DEFENSE: pickRandom(['marking', 'tackling', 'positioning']); break;
                case TrainingType.PHYSICAL: pickRandom(['stamina', 'pace', 'strength']); if (index === 0) condition -= 2; break;
                case TrainingType.TACTICAL: pickRandom(['teamwork', 'decisions', 'anticipation']); break;
                case TrainingType.MATCH_PREP: pickRandom(['concentration', 'composure']); break;
                case TrainingType.SET_PIECES: pickRandom(['freeKick', 'corners', 'penalty', 'heading']); break;
            }
        });

        // Sync legacy
        stats.shooting = stats.finishing;
        // @ts-ignore
        stats.defending = Math.floor(((stats.marking || 10) + (stats.tackling || 10)) / 2);
        
        const newTempPlayer = { ...p, stats };
        skill = calculatePlayerOverallFromStats(newTempPlayer);
        skill = Math.min(p.potential, skill);

        return { 
            ...p, 
            stats, 
            statProgress,
            skill, 
            condition, 
            recentAttributeChanges: recentChanges
        };
    });

    // --- GENERATE PERFORMANCE REPORTS ---
    performances.sort((a, b) => b.score - a.score);

    performances.slice(0, 5).forEach(p => {
        if (!report.some(r => r.playerId === p.id)) {
            report.push({
                playerId: p.id,
                playerName: p.name,
                message: `Günün çalışkan isimlerindendi. (Puan: ${p.score})`,
                type: 'POSITIVE',
                score: p.score
            });
        }
    });

    performances.slice(-3).reverse().forEach(p => {
         if (!report.some(r => r.playerId === p.id)) {
             report.push({
                playerId: p.id,
                playerName: p.name,
                message: `İsteksiz göründü, performansı düşük. (Puan: ${p.score})`,
                type: 'NEGATIVE',
                score: p.score
            });
        }
    });

    const newTeam = { ...team, players: updatedPlayers, trainingConfig: config }; 
    newTeam.strength = Math.floor(calculateTeamStrength(newTeam));
    return { updatedTeam: newTeam, report };
};
