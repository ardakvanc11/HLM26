
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

        // --- NEW: LISTING LOGIC ---
        if (!isFreeAgent) {
            player.transferListed = true; // Default: Listed for transfer
            
            // Loan Listing Logic
            // Based on Age and Hidden Loan Willingness
            const willingness = player.loanWillingness || 50;
            let loanChance = 0.1; // Base chance

            // Young players are more likely to be loan listed
            if (player.age <= 22) loanChance += 0.4;
            
            // High willingness increases chance
            if (willingness > 70) loanChance += 0.3;
            
            // Low skill players in market might be loan listed more often
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

// Thresholds for stat improvement (Progress Points needed to gain +1)
// Scale: 1-20
const getImprovementThreshold = (currentValue: number): number => {
    if (currentValue < 5) return 80;   // Very easy
    if (currentValue < 10) return 150; // Easy
    if (currentValue < 14) return 300; // Medium
    if (currentValue < 16) return 600; // Hard
    if (currentValue < 18) return 1200; // Very Hard
    if (currentValue < 19) return 2500; // Extreme
    return 99999; // 20 is Cap
};

// Age Multipliers for Growth
const getAgeGrowthFactor = (age: number): number => {
    if (age <= 20) return 1.2; // 120%
    if (age <= 24) return 1.0; // 100%
    if (age <= 27) return 0.8; // 80%
    if (age <= 30) return 0.3; // 30%
    return 0;                  // 0% (Decline phase usually handles this)
};

// Potential Acceleration Factor
const getPotentialFactor = (current: number, potential: number): number => {
    const gap = potential - current;
    if (gap > 10) return 1.5; // High potential pulls up fast
    if (gap > 5) return 1.2;
    if (gap > 2) return 1.0;
    if (gap > 0) return 0.5; // Slow crawl near ceiling
    return 0; // Capped
};

export const applyTraining = (team: Team, config: TrainingConfig): { updatedTeam: Team, report: TrainingReportItem[] } => {
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

    // Coach Quality Simulation (Derived from Rep)
    const coachQualityFactor = (team.reputation * 10) + 50; 
    const coachBonus = coachQualityFactor / 100; // 0.6 to 1.0 range

    const report: TrainingReportItem[] = [];
    const performances: {id: string, name: string, score: number}[] = [];

    const updatedPlayers = team.players.map(p => {
        // Init Stats & Progress Pool
        let stats = { ...p.stats };
        let statProgress = { ...(p.statProgress || {}) }; // Ensure object exists
        let skill = Math.floor(p.skill);
        let morale = Math.floor(p.morale);
        let condition = p.condition !== undefined ? p.condition : stats.stamina;
        let trainingWeeks = p.activeTrainingWeeks || 0;
        
        // RESET recent changes for this turn
        let recentChanges: Record<string, 'UP' | 'DOWN' | 'PARTIAL_UP'> = {};

        // --- CALCULATION OF TRAINING SCORE (UPDATED LOGIC) ---
        // New Rule: Base is generally high (7.0+). Drops significantly only if Morale < 50 or Condition < 60.

        // 1. Base Score: 7.0 to 9.5 (Random variance)
        let baseScore = 7.0 + (Math.random() * 2.5);
        let penalties = 0;
        let bonuses = 0;

        // 2. Morale Factor
        if (morale < 50) {
            // Major Penalty: Drops score to ~5.0 - 6.0 range
            penalties += (1.5 + Math.random() * 1.5);
        } else if (morale >= 90) {
            // Happy player bonus
            bonuses += 0.3;
        }

        // 3. Condition Factor
        if (condition < 60) {
            // Fatigue Penalty: Drops score significantly
            penalties += (1.0 + Math.random() * 1.0);
        } else if (condition >= 90) {
             bonuses += 0.2;
        }

        let trainingScore = baseScore - penalties + bonuses;
        
        // Intensity Modifier (Hardworking likes High, Lazy hates High)
        if (config.intensity === TrainingIntensity.HIGH) {
            if (p.personality === PlayerPersonality.HARDWORKING || p.personality === PlayerPersonality.AMBITIOUS) trainingScore += 0.5;
            if (p.personality === PlayerPersonality.LAZY) trainingScore -= 1.0;
        }

        // Clamp to 1.0 - 10.0
        trainingScore = Math.max(1.0, Math.min(10.0, Number(trainingScore.toFixed(1))));
        performances.push({ id: p.id, name: p.name, score: trainingScore });


        // --- 1. CORE FACTORS ---
        const ageFactor = getAgeGrowthFactor(p.age);
        const potFactor = getPotentialFactor(skill, p.potential);
        const personalityMod = (p.personality === PlayerPersonality.HARDWORKING || p.personality === PlayerPersonality.AMBITIOUS) 
            ? (config.intensity === TrainingIntensity.HIGH ? 1.2 : 1.0)
            : (p.personality === PlayerPersonality.LAZY && config.intensity === TrainingIntensity.HIGH ? 0.7 : 1.0);

        const canGrow = p.age < 31 && skill < p.potential && potFactor > 0;

        // Apply Fatigue
        condition = Math.max(0, condition - (fatigueMalus * (1 + Math.random() * 0.2)));

        // Helper to add progress points
        const addProgress = (statName: keyof typeof stats, amount: number) => {
            if (!canGrow) return;
            
            // @ts-ignore
            const currentVal = stats[statName] || 10;
            if (currentVal >= 20) return; // Hard Cap

            // Calculate final daily gain
            // Formula: Base * Age * Potential * Coach * Personality * SessionScoreMultiplier
            const scoreMultiplier = trainingScore / 6.0; // Normalized around 6.0
            const dailyGain = amount * ageFactor * potFactor * coachBonus * personalityMod * scoreMultiplier;
            
            // Accumulate
            // @ts-ignore
            const currentProgress = statProgress[statName] || 0;
            const newProgress = currentProgress + dailyGain;
            
            // Check Threshold
            const threshold = getImprovementThreshold(currentVal);
            
            if (newProgress >= threshold) {
                // LEVEL UP!
                // @ts-ignore
                stats[statName] = currentVal + 1;
                // @ts-ignore
                statProgress[statName] = 0; // Reset pool
                
                recentChanges[statName as string] = 'UP'; // VISUAL MARKER

                // Add to Report (Major Event)
                report.push({
                    playerId: p.id,
                    playerName: p.name,
                    message: `${(statName as string).toUpperCase()} özelliği gelişti! (${currentVal} -> ${currentVal+1})`,
                    type: 'POSITIVE',
                    score: trainingScore
                });
                
                // NO OVR JUMP HERE. Overall is recalculated at the end based on stats.

            } else {
                // Just update progress
                // @ts-ignore
                statProgress[statName] = newProgress;
            }
        };

        // --- 2. INDIVIDUAL TRAINING (PRIMARY GROWTH) ---
        if (p.activeTraining) {
            trainingWeeks++; // Increment counter (days in simulation actually, but treated as units)
            
            const program = INDIVIDUAL_PROGRAMS.find(prog => prog.id === p.activeTraining);
            if (program) {
                let synergy = 1.0;
                if (program.target.includes('ALL') || program.target.includes(p.position)) {
                    synergy = 1.2;
                }

                // Apply to specific stats
                program.stats.forEach(statKey => {
                    // Individual training gets focused base progress
                    const indivGain = baseProgress * 4.0 * synergy; // Boosted base
                    // @ts-ignore
                    addProgress(statKey, indivGain);
                });
            }

            // --- 3. PROGRAM COMPLETION (The "Hidden Bonus") ---
            // Calculate duration based on personality
            let cycleWeeks = 10; // Default (Normal)
            if (p.personality === PlayerPersonality.HARDWORKING || p.personality === PlayerPersonality.AMBITIOUS) {
                cycleWeeks = 8;
            } else if (p.personality === PlayerPersonality.PROFESSIONAL) {
                cycleWeeks = 9;
            } else if (p.personality === PlayerPersonality.LAZY) {
                cycleWeeks = 12;
            }

            // Convert to daily ticks (assuming 1 week = 7 ticks in game flow)
            const cycleDuration = cycleWeeks * 7;

            // Check if trainingWeeks hits multiple of cycleDuration
            if (trainingWeeks > 0 && trainingWeeks % cycleDuration === 0 && program) {
                // Program Cycle Completed!
                report.push({
                    playerId: p.id,
                    playerName: p.name,
                    message: `${cycleWeeks} haftalık ${program?.label} programını tamamladı. Sahada kendini daha iyi hissediyor.`,
                    type: 'POSITIVE',
                    score: trainingScore
                });
                
                // Mark associated stats as PARTIAL_UP (visual feedback: work was done)
                // Only if they didn't just Level Up (UP takes precedence)
                program.stats.forEach(s => {
                    if (recentChanges[s] !== 'UP') {
                        recentChanges[s] = 'PARTIAL_UP';
                    }
                });

                // "Feeling of Improvement" = Hidden Bonus
                // Boost Morale, Condition, or maybe a tiny hidden OVR nudge if very close
                morale = Math.min(100, morale + 10);
                
                // Small chance for a "Breakthrough" (extra stats)
                if (Math.random() < 0.2) {
                     // Force a small progress dump into a random mental stat
                     addProgress('determination', 50);
                }
            }

            // Update Feedback String for UI
            const cycleProgress = (trainingWeeks % cycleDuration) / cycleDuration * 100;
            p.developmentFeedback = `${program?.label}: %${Math.floor(cycleProgress)} (${cycleWeeks} Hf)`;
        } else {
            p.developmentFeedback = undefined;
        }

        // --- 4. TEAM TRAINING (General Maintenance) ---
        // EFFECTIVENESS NERFED TO 0.05 (10% of previous base)
        const activeFocuses = [config.mainFocus, config.subFocus];
        
        activeFocuses.forEach((type, index) => {
            // Main focus 100%, Sub 50% effectiveness
            // Team training is now much slower than individual (0.05 vs 4.0 ratio)
            const effectiveness = (index === 0 ? 1.0 : 0.5) * 0.05; // 5% Effectiveness
            
            const applyTeamStat = (key: string) => {
                // @ts-ignore
                addProgress(key, baseProgress * effectiveness);
            };

            // Helper to pick one random stat to simulate slight randomization in daily drills
            const pickRandom = (stats: string[]) => {
                const selected = stats[Math.floor(Math.random() * stats.length)];
                applyTeamStat(selected);
            };

            // Map categories to stats
            switch (type) {
                case TrainingType.ATTACK:
                    pickRandom(['finishing', 'offTheBall', 'firstTouch']);
                    break;
                case TrainingType.DEFENSE:
                    pickRandom(['marking', 'tackling', 'positioning']);
                    break;
                case TrainingType.PHYSICAL:
                    pickRandom(['stamina', 'pace', 'strength']);
                    if (index === 0) condition -= 2; // Extra fatigue
                    break;
                case TrainingType.TACTICAL:
                    pickRandom(['teamwork', 'decisions', 'anticipation']);
                    break;
                case TrainingType.MATCH_PREP:
                    pickRandom(['concentration', 'composure']);
                    break;
                case TrainingType.SET_PIECES: // NEW
                    pickRandom(['freeKick', 'corners', 'penalty', 'heading']);
                    break;
            }
        });

        // Sync legacy
        stats.shooting = stats.finishing;
        // @ts-ignore
        stats.defending = Math.floor(((stats.marking || 10) + (stats.tackling || 10)) / 2);
        
        // --- 5. RECALCULATE OVERALL SKILL ---
        // Skill strictly derived from stats now.
        const newTempPlayer = { ...p, stats };
        skill = calculatePlayerOverallFromStats(newTempPlayer);
        // Ensure potential cap
        skill = Math.min(p.potential, skill);

        return { 
            ...p, 
            stats, 
            statProgress, // Save the hidden progress
            skill, 
            morale, 
            condition, 
            activeTrainingWeeks: trainingWeeks,
            recentAttributeChanges: recentChanges // Save visual flags
        };
    });

    // --- GENERATE PERFORMANCE REPORTS ---
    // Sort by score descending
    performances.sort((a, b) => b.score - a.score);

    // 1. Top Performers (Top 5 guaranteed)
    performances.slice(0, 5).forEach(p => {
        // Prevent duplicates if they already have a level-up entry
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

    // 2. Worst Performers (Bottom 3 guaranteed)
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

    // 3. Add random middle players to make the list fuller (max 3 more)
    // Only if total report is short
    if (report.length < 8 && performances.length > 10) {
        const middle = performances.slice(5, -3);
        const randomPicks = middle.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        randomPicks.forEach(p => {
             if (!report.some(r => r.playerId === p.id)) {
                 report.push({
                    playerId: p.id,
                    playerName: p.name,
                    message: `Standart bir antrenman geçirdi. (Puan: ${p.score})`,
                    type: 'POSITIVE', // Neutral but using positive style
                    score: p.score
                });
            }
        });
    }

    const newTeam = { ...team, players: updatedPlayers, trainingConfig: config }; 
    newTeam.strength = Math.floor(calculateTeamStrength(newTeam));
    return { updatedTeam: newTeam, report };
};
