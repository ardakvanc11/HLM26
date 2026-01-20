
import { Team, Position, Mentality, PassingStyle, Tempo, Width, CreativeFreedom, DefensiveLine, Tackling, PressingFocus, TimeWasting, TacticStyle, AttackStyle, PressingStyle, AttackingTransition, SetPiecePlay, PlayStrategy, GoalKickType, GKDistributionTarget, SupportRuns, Dribbling, FocusArea, PassTarget, Patience, LongShots, CrossingType, GKDistributionSpeed, PressingLine, DefLineMobility, PressIntensity, DefensiveTransition, PreventCrosses, ClubStaff } from '../types';
import { generateId } from './gameConstants';
import { generatePlayer, FIRST_NAMES, LAST_NAMES } from './playerConstants';
import { calculateRawTeamStrength } from '../utils/teamCalculations';
import { getRandomSponsorForReputation } from './sponsorData';

// User Defined Teams with provided Imgur Logos and Stadium Capacities
export const TEAM_TEMPLATES = [
    { 
        name: 'Ayıboğanspor SK', 
        president: 'Recep İvedik',
        logo: 'https://i.imgur.com/eV74XlV.png', 
        jersey: 'https://imgur.com/7PcfX6O.png',
        jerseyGK: 'https://imgur.com/DMnuhsQ.png', 
        colors: ['bg-purple-600', 'text-white'], 
        championships: 10,
        cups: 11,
        s_cups: 18,
        euro_cups: 0, 
        stadium: 'Mağara Arena', 
        capacity: 45000, 
        fans: 22000000, 
        budget: 95, 
        targetStrength: 84,
        baseReputation: 4.5,
        debt: 104, // M€
        leagueHistory: [
            {year: '1983/84', rank: 6}, {year: '1984/85', rank: 11}, {year: '1985/86', rank: 10}, {year: '1986/87', rank: 13},
            {year: '1987/88', rank: 13}, {year: '1988/89', rank: 7}, {year: '1989/90', rank: 10}, {year: '1990/91', rank: 5},
            {year: '1991/92', rank: 5}, {year: '1992/93', rank: 6}, {year: '1993/94', rank: 1}, {year: '1994/95', rank: 5},
            {year: '1995/96', rank: 2}, {year: '1996/97', rank: 4}, {year: '1997/98', rank: 2}, {year: '1998/99', rank: 1},
            {year: '1999/00', rank: 1}, {year: '2000/01', rank: 3}, {year: '2001/02', rank: 1}, {year: '2002/03', rank: 1},
            {year: '2003/04', rank: 4}, {year: '2004/05', rank: 2}, {year: '2005/06', rank: 3}, {year: '2006/07', rank: 2},
            {year: '2007/08', rank: 3}, {year: '2008/09', rank: 3}, {year: '2009/10', rank: 1},
            {year: '2010/11', rank: 3}, {year: '2011/12', rank: 2}, {year: '2012/13', rank: 3}, {year: '2013/14', rank: 1}, {year: '2014/15', rank: 3},
            {year: '2015/16', rank: 4}, {year: '2016/17', rank: 1}, {year: '2017/18', rank: 4}, {year: '2018/19', rank: 4}, {year: '2019/20', rank: 1}, {year: '2020/21', rank: 3},
            {year: '2021/22', rank: 5}, {year: '2022/23', rank: 1}, {year: '2023/24', rank: 5}, {year: '2024/25', rank: 4}
        ]
    },
    { 
        name: 'Kedispor', 
        president: 'Kedi Koç',
        logo: 'https://i.imgur.com/VSUm10b.png',
        jersey: 'https://imgur.com/abV3t3m.png',
        jerseyGK: 'https://imgur.com/CP63fXc.png', 
        colors: ['bg-red-600', 'text-white'], 
        championships: 8,
        cups: 14,
        s_cups: 10,
        euro_cups: 1, 
        stadium: 'Yumak Stadyumu', 
        capacity: 43000,
        fans: 18000000, 
        budget: 85, 
        targetStrength: 82,
        baseReputation: 4.1,
        debt: 122, // M€
        leagueHistory: [
            {year: '1983/84', rank: 5}, {year: '1984/85', rank: 3}, {year: '1985/86', rank: 3}, {year: '1986/87', rank: 2},
            {year: '1987/88', rank: 3}, {year: '1988/89', rank: 3}, {year: '1989/90', rank: 1}, {year: '1990/91', rank: 2},
            {year: '1991/92', rank: 1}, {year: '1992/93', rank: 1}, {year: '1993/94', rank: 5}, {year: '1994/95', rank: 4},
            {year: '1995/96', rank: 3}, {year: '1996/97', rank: 1}, {year: '1997/98', rank: 1}, {year: '1998/99', rank: 4},
            {year: '1999/00', rank: 2}, {year: '2000/01', rank: 4}, {year: '2001/02', rank: 2}, {year: '2002/03', rank: 4},
            {year: '2003/04', rank: 2}, {year: '2004/05', rank: 4}, {year: '2005/06', rank: 1}, {year: '2006/07', rank: 3},
            {year: '2007/08', rank: 1}, {year: '2008/09', rank: 2}, {year: '2009/10', rank: 4},
            {year: '2010/11', rank: 2}, {year: '2011/12', rank: 4}, {year: '2012/13', rank: 1}, {year: '2013/14', rank: 3}, {year: '2014/15', rank: 4},
            {year: '2015/16', rank: 5}, {year: '2016/17', rank: 4}, {year: '2017/18', rank: 3}, {year: '2018/19', rank: 5}, {year: '2019/20', rank: 3}, {year: '2020/21', rank: 5},
            {year: '2021/22', rank: 4}, {year: '2022/23', rank: 3}, {year: '2023/24', rank: 4}, {year: '2024/25', rank: 5}
        ]
    },
    { 
        name: 'Eşşekboğanspor FK', 
        president: 'Ahmet Ateş',
        logo: 'https://i.imgur.com/T1RiW8H.png',
        jersey: 'https://imgur.com/Zv3XZTY.png',
        jerseyGK: 'https://imgur.com/aKFKHs7.png', 
        colors: ['bg-blue-600', 'text-yellow-400'], 
        championships: 15,
        cups: 4,
        s_cups: 16,
        euro_cups: 0,
        stadium: 'Anadolu Arena', 
        capacity: 65000, 
        fans: 25000000, 
        budget: 80, 
        targetStrength: 81,
        baseReputation: 4.1,
        debt: 105, // M€
        leagueHistory: [
            {year: '1983/84', rank: 1}, {year: '1984/85', rank: 1}, {year: '1985/86', rank: 2}, {year: '1986/87', rank: 3},
            {year: '1987/88', rank: 2}, {year: '1988/89', rank: 2}, {year: '1989/90', rank: 3}, {year: '1990/91', rank: 1},
            {year: '1991/92', rank: 2}, {year: '1992/93', rank: 2}, {year: '1993/94', rank: 2}, {year: '1994/95', rank: 1},
            {year: '1995/96', rank: 1}, {year: '1996/97', rank: 3}, {year: '1997/98', rank: 4}, {year: '1998/99', rank: 2},
            {year: '1999/00', rank: 4}, {year: '2000/01', rank: 1}, {year: '2001/02', rank: 18}, {year: '2002/03', rank: 10},
            {year: '2003/04', rank: 6}, {year: '2004/05', rank: 6}, {year: '2005/06', rank: 4}, {year: '2006/07', rank: 1},
            {year: '2007/08', rank: 4}, {year: '2008/09', rank: 1}, {year: '2009/10', rank: 2},
            {year: '2010/11', rank: 1}, {year: '2011/12', rank: 1}, {year: '2012/13', rank: 4}, {year: '2013/14', rank: 5}, {year: '2014/15', rank: 1},
            {year: '2015/16', rank: 1}, {year: '2016/17', rank: 5}, {year: '2017/18', rank: 6}, {year: '2018/19', rank: 6}, {year: '2019/20', rank: 5}, {year: '2020/21', rank: 1},
            {year: '2021/22', rank: 1}, {year: '2022/23', rank: 5}, {year: '2023/24', rank: 1}, {year: '2024/25', rank: 2}
        ]
    },
    { 
        name: 'Maymunspor', 
        president: 'Cango Reis',
        logo: 'https://i.imgur.com/kvhASjK.png',
        jersey: 'https://imgur.com/jfH3kal.png',
        colors: ['bg-purple-800', 'text-white'], 
        championships: 4,
        cups: 7,
        s_cups: 6,
        euro_cups: 0,
        stadium: 'Muz Park',
        capacity: 21000,
        fans: 6000000, 
        budget: 25, 
        targetStrength: 78,
        baseReputation: 3.6,
        debt: 66, // M€
        leagueHistory: [
            {year: '1983/84', rank: 2}, {year: '1984/85', rank: 2}, {year: '1985/86', rank: 1}, {year: '1986/87', rank: 1},
            {year: '1987/88', rank: 1}, {year: '1988/89', rank: 1}, {year: '1989/90', rank: 2}, {year: '1990/91', rank: 3},
            {year: '1991/92', rank: 6}, {year: '1992/93', rank: 3}, {year: '1993/94', rank: 7}, {year: '1994/95', rank: 7},
            {year: '1995/96', rank: 15}, {year: '1996/97', rank: 12}, {year: '1997/98', rank: 7}, {year: '1998/99', rank: 18},
            {year: '1999/00', rank: 9}, {year: '2000/01', rank: 9}, {year: '2001/02', rank: 13}, {year: '2002/03', rank: 5},
            {year: '2003/04', rank: 11}, {year: '2004/05', rank: 12}, {year: '2005/06', rank: 14}, {year: '2006/07', rank: 9},
            {year: '2007/08', rank: 12}, {year: '2008/09', rank: 9}, {year: '2009/10', rank: 15},
            {year: '2010/11', rank: 8}, {year: '2011/12', rank: 7}, {year: '2012/13', rank: 8}, {year: '2013/14', rank: 7}, {year: '2014/15', rank: 8},
            {year: '2015/16', rank: 8}, {year: '2016/17', rank: 7}, {year: '2017/18', rank: 8}, {year: '2018/19', rank: 7}, {year: '2019/20', rank: 8}, {year: '2020/21', rank: 7},
            {year: '2021/22', rank: 8}, {year: '2022/23', rank: 7}, {year: '2023/24', rank: 8}, {year: '2024/25', rank: 7}
        ]
    },
    { 
        name: 'Arıspor', 
        president: 'Criminal Hamza',
        logo: 'https://i.imgur.com/7vkiuxd.png',
        jersey: 'https://imgur.com/PidWwuV.png',
        jerseyGK: 'https://imgur.com/EF7HVUU.png', 
        colors: ['bg-yellow-500', 'text-white'], 
        championships: 3,
        cups: 2,
        s_cups: 3,
        euro_cups: 0,
        stadium: 'Kovan Stadyumu',
        capacity: 27000,
        fans: 1500000, 
        budget: 115, 
        targetStrength: 84,
        baseReputation: 4.3,
        debt: 64, // M€
        leagueHistory: [
            {year: '1983/84', rank: 16}, {year: '1984/85', rank: 15}, {year: '1985/86', rank: 16}, {year: '1986/87', rank: 12},
            {year: '1987/88', rank: 4}, {year: '1988/89', rank: 14}, {year: '1989/90', rank: 14}, {year: '1990/91', rank: 10},
            {year: '1991/92', rank: 13}, {year: '1992/93', rank: 12}, {year: '1993/94', rank: 10}, {year: '1994/95', rank: 15},
            {year: '1995/96', rank: 13}, {year: '1996/97', rank: 12}, {year: '1997/98', rank: 11}, {year: '1998/99', rank: 11},
            {year: '1999/00', rank: 14}, {year: '2000/01', rank: 14}, {year: '2001/02', rank: 8}, {year: '2002/03', rank: 17},
            {year: '2003/04', rank: 14}, {year: '2004/05', rank: 16}, {year: '2005/06', rank: 13}, {year: '2006/07', rank: 14},
            {year: '2007/08', rank: 15}, {year: '2008/09', rank: 13}, {year: '2009/10', rank: 14},
            {year: '2010/11', rank: 6}, {year: '2011/12', rank: 5}, {year: '2012/13', rank: 6}, {year: '2013/14', rank: 4}, {year: '2014/15', rank: 2},
            {year: '2015/16', rank: 6}, {year: '2016/17', rank: 3}, {year: '2017/18', rank: 1}, {year: '2018/19', rank: 1}, {year: '2019/20', rank: 2}, {year: '2020/21', rank: 4},
            {year: '2021/22', rank: 2}, {year: '2022/23', rank: 4}, {year: '2023/24', rank: 3}, {year: '2024/25', rank: 1}
        ]
    },
    { 
        name: 'Köpekspor', 
        president: 'KöpekAdam',
        logo: 'https://i.imgur.com/OoPWVvx.png',
        jersey: 'https://imgur.com/C2xKJtO.png',
        jerseyGK: 'https://imgur.com/hHtmxQv.png', 
        colors: ['bg-blue-500', 'text-white'], 
        championships: 2,
        cups: 9,
        s_cups: 11, 
        euro_cups: 0,
        stadium: 'Kemik Arena',
        capacity: 41000,
        fans: 14500000, 
        budget: 81, 
        targetStrength: 80,
        baseReputation: 3.9,
        debt: 77, // M€
        leagueHistory: [
            {year: '1983/84', rank: 3}, {year: '1984/85', rank: 14}, {year: '1985/86', rank: 12}, {year: '1986/87', rank: 16},
            {year: '1987/88', rank: 5}, {year: '1988/89', rank: 10}, {year: '1989/90', rank: 7}, {year: '1990/91', rank: 6},
            {year: '1991/92', rank: 3}, {year: '1992/93', rank: 5}, {year: '1993/94', rank: 3}, {year: '1994/95', rank: 3},
            {year: '1995/96', rank: 4}, {year: '1996/97', rank: 2}, {year: '1997/98', rank: 3}, {year: '1998/99', rank: 3},
            {year: '1999/00', rank: 3}, {year: '2000/01', rank: 5}, {year: '2001/02', rank: 3}, {year: '2002/03', rank: 2},
            {year: '2003/04', rank: 1}, {year: '2004/05', rank: 1}, {year: '2005/06', rank: 2}, {year: '2006/07', rank: 4},
            {year: '2007/08', rank: 2}, {year: '2008/09', rank: 6}, {year: '2009/10', rank: 3},
            {year: '2010/11', rank: 4}, {year: '2011/12', rank: 3}, {year: '2012/13', rank: 5}, {year: '2013/14', rank: 2}, {year: '2014/15', rank: 5},
            {year: '2015/16', rank: 3}, {year: '2016/17', rank: 2}, {year: '2017/18', rank: 5}, {year: '2018/19', rank: 2}, {year: '2019/20', rank: 4}, {year: '2020/21', rank: 2},
            {year: '2021/22', rank: 3}, {year: '2022/23', rank: 2}, {year: '2023/24', rank: 6}, {year: '2024/25', rank: 3}
        ]
    },
    { 
        name: 'Bulgariaspor', 
        president: 'Ivan Petrov',
        logo: 'https://i.imgur.com/RuCGNuc.png',
        jersey: 'https://imgur.com/eHAW2Fg.png',
        jerseyGK: 'https://imgur.com/Nz7hWFC.png', 
        colors: ['bg-green-600', 'text-black'], 
        championships: 0,
        cups: 0,
        s_cups: 0,
        euro_cups: 0,
        stadium: 'Tuna Park',
        capacity: 16500,
        fans: 500000, 
        budget: 11, 
        targetStrength: 75,
        baseReputation: 3.2,
        debt: 14, // M€
        leagueHistory: [
            {year: '1983/84', rank: 15}, {year: '1984/85', rank: 10}, {year: '1985/86', rank: 17}, {year: '1986/87', rank: 15},
            {year: '1987/88', rank: 14}, {year: '1988/89', rank: 12}, {year: '1989/90', rank: 13}, {year: '1990/91', rank: 11},
            {year: '1991/92', rank: 13}, {year: '1992/93', rank: 11}, {year: '1993/94', rank: 10}, {year: '1994/95', rank: 11},
            {year: '1995/96', rank: 5}, {year: '1996/97', rank: 15}, {year: '1997/98', rank: 14}, {year: '1998/99', rank: 13},
            {year: '1999/00', rank: 17}, {year: '2000/01', rank: 8}, {year: '2001/02', rank: 14}, {year: '2002/03', rank: 16},
            {year: '2003/04', rank: 6}, {year: '2004/05', rank: 8}, {year: '2005/06', rank: 10}, {year: '2006/07', rank: 16},
            {year: '2007/08', rank: 10}, {year: '2008/09', rank: 15}, {year: '2009/10', rank: 10},
            {year: '2010/11', rank: 12}, {year: '2011/12', rank: 13}, {year: '2012/13', rank: 12}, {year: '2013/14', rank: 12}, {year: '2014/15', rank: 13},
            {year: '2015/16', rank: 13}, {year: '2016/17', rank: 13}, {year: '2017/18', rank: 12}, {year: '2018/19', rank: 14}, {year: '2019/20', rank: 12}, {year: '2020/21', rank: 13},
            {year: '2021/22', rank: 12}, {year: '2022/23', rank: 13}, {year: '2023/24', rank: 12}, {year: '2024/25', rank: 14}
        ]
    },
    { 
        name: 'Bedirspor', 
        president: 'Bedir Usta',
        logo: 'https://i.imgur.com/pPchTUI.png',
        jersey: 'https://imgur.com/bdI85Wq.png',
        jerseyGK: 'https://imgur.com/eT3Qn69.png', 
        colors: ['bg-purple-900', 'text-white'], 
        championships: 0,
        cups: 7,
        s_cups: 3,
        euro_cups: 0,
        stadium: 'Bedir Stadı',
        capacity: 25000,
        fans: 850000, 
        budget: 14, 
        targetStrength: 73,
        baseReputation: 3.3,
        debt: 21, // M€
        leagueHistory: [
            {year: '1983/84', rank: 8}, {year: '1984/85', rank: 7}, {year: '1985/86', rank: 4}, {year: '1986/87', rank: 5},
            {year: '1987/88', rank: 12}, {year: '1988/89', rank: 4}, {year: '1989/90', rank: 9}, {year: '1990/91', rank: 8},
            {year: '1991/92', rank: 11}, {year: '1992/93', rank: 9}, {year: '1993/94', rank: 8}, {year: '1994/95', rank: 6},
            {year: '1995/96', rank: 13}, {year: '1996/97', rank: 13}, {year: '1997/98', rank: 9}, {year: '1998/99', rank: 12},
            {year: '1999/00', rank: 13}, {year: '2000/01', rank: 15}, {year: '2001/02', rank: 12}, {year: '2002/03', rank: 11},
            {year: '2003/04', rank: 16}, {year: '2004/05', rank: 6}, {year: '2005/06', rank: 7}, {year: '2006/07', rank: 14},
            {year: '2007/08', rank: 6}, {year: '2008/09', rank: 10}, {year: '2009/10', rank: 8},
            {year: '2010/11', rank: 9}, {year: '2011/12', rank: 11}, {year: '2012/13', rank: 9}, {year: '2013/14', rank: 10}, {year: '2014/15', rank: 12},
            {year: '2015/16', rank: 9}, {year: '2016/17', rank: 10}, {year: '2017/18', rank: 9}, {year: '2018/19', rank: 12}, {year: '2019/20', rank: 9}, {year: '2020/21', rank: 10},
            {year: '2021/22', rank: 9}, {year: '2022/23', rank: 10}, {year: '2023/24', rank: 9}, {year: '2024/25', rank: 10}
        ]
    },
    { 
        name: 'Yakhubspor', 
        president: 'Yakup Usta',
        logo: 'https://i.imgur.com/vcN5VhI.png',
        jersey: 'https://imgur.com/k64QPcT.png',
        jerseyGK: 'https://imgur.com/H2oygfo.png', 
        colors: ['bg-orange-500', 'text-black'], 
        championships: 0,
        cups: 5,
        s_cups: 2, 
        euro_cups: 0,
        stadium: 'Çöl Fırtınası',
        capacity: 19500,
        fans: 750000, 
        budget: 12, 
        targetStrength: 72,
        baseReputation: 3.3,
        debt: 19, // M€
        leagueHistory: [
            {year: '1983/84', rank: 12}, {year: '1984/85', rank: 18}, {year: '1985/86', rank: 6}, {year: '1986/87', rank: 11},
            {year: '1987/88', rank: 9}, {year: '1988/89', rank: 5}, {year: '1989/90', rank: 16}, {year: '1990/91', rank: 7},
            {year: '1991/92', rank: 9}, {year: '1992/93', rank: 8}, {year: '1993/94', rank: 11}, {year: '1994/95', rank: 10},
            {year: '1995/96', rank: 8}, {year: '1996/97', rank: 8}, {year: '1997/98', rank: 12}, {year: '1998/99', rank: 7},
            {year: '1999/00', rank: 5}, {year: '2000/01', rank: 2}, {year: '2001/02', rank: 5}, {year: '2002/03', rank: 9},
            {year: '2003/04', rank: 5}, {year: '2004/05', rank: 13}, {year: '2005/06', rank: 6}, {year: '2006/07', rank: 6},
            {year: '2007/08', rank: 11}, {year: '2008/09', rank: 8}, {year: '2009/10', rank: 12},
            {year: '2010/11', rank: 10}, {year: '2011/12', rank: 9}, {year: '2012/13', rank: 10}, {year: '2013/14', rank: 11}, {year: '2014/15', rank: 9},
            {year: '2015/16', rank: 10}, {year: '2016/17', rank: 9}, {year: '2017/18', rank: 11}, {year: '2018/19', rank: 10}, {year: '2019/20', rank: 11}, {year: '2020/21', rank: 9},
            {year: '2021/22', rank: 10}, {year: '2022/23', rank: 9}, {year: '2023/24', rank: 10}, {year: '2024/25', rank: 9}
        ]
    },
    { 
        name: 'Tekirspor', 
        president: 'Tekir Saran',
        logo: 'https://i.imgur.com/JhXtd58.png',
        jersey: 'https://imgur.com/augQrXj.png',
        jerseyGK: 'https://imgur.com/G73BOHq.png', 
        colors: ['bg-orange-400', 'text-white'], 
        championships: 0,
        cups: 4,
        s_cups: 1, 
        euro_cups: 0,
        stadium: 'Liman Arena',
        capacity: 18000,
        fans: 1200000, 
        budget: 7, 
        targetStrength: 74,
        baseReputation: 3.2,
        debt: 8, // M€
        leagueHistory: [
            {year: '1983/84', rank: 14}, {year: '1984/85', rank: 12}, {year: '1985/86', rank: 8}, {year: '1986/87', rank: 14},
            {year: '1987/88', rank: 11}, {year: '1988/89', rank: 8}, {year: '1989/90', rank: 12}, {year: '1990/91', rank: 14},
            {year: '1991/92', rank: 10}, {year: '1992/93', rank: 7}, {year: '1993/94', rank: 9}, {year: '1994/95', rank: 13},
            {year: '1995/96', rank: 14}, {year: '1996/97', rank: 6}, {year: '1997/98', rank: 6}, {year: '1998/99', rank: 17},
            {year: '1999/00', rank: 16}, {year: '2000/01', rank: 17}, {year: '2001/02', rank: 9}, {year: '2002/03', rank: 18},
            {year: '2003/04', rank: 17}, {year: '2004/05', rank: 18}, {year: '2005/06', rank: 17}, {year: '2006/07', rank: 8},
            {year: '2007/08', rank: 16}, {year: '2008/09', rank: 16}, {year: '2009/10', rank: 17},
            {year: '2010/11', rank: 15}, {year: '2011/12', rank: 14}, {year: '2012/13', rank: 15}, {year: '2013/14', rank: 14}, {year: '2014/15', rank: 16},
            {year: '2015/16', rank: 14}, {year: '2016/17', rank: 15}, {year: '2017/18', rank: 16}, {year: '2018/19', rank: 15}, {year: '2019/20', rank: 14}, {year: '2020/21', rank: 15},
            {year: '2021/22', rank: 14}, {year: '2022/23', rank: 15}, {year: '2023/24', rank: 15}, {year: '2024/25', rank: 15}
        ]
    },
    { 
        name: 'Uzunoğullarıspor', 
        president: 'İbrahim Uzunoğlu',
        logo: 'https://i.imgur.com/S4TVTee.png',
        jersey: 'https://imgur.com/BOyr0e6.png',
        jerseyGK: 'https://imgur.com/wAOAVng.png', 
        colors: ['bg-black', 'text-white'], 
        championships: 0,
        cups: 4,
        s_cups: 1, 
        euro_cups: 0,
        stadium: 'Kule Stadı',
        capacity: 9500,
        fans: 200000, 
        budget: 6, 
        targetStrength: 71,
        baseReputation: 2.8,
        debt: 9, // M€
        leagueHistory: [
            {year: '1983/84', rank: 9}, {year: '1984/85', rank: 9}, {year: '1985/86', rank: 7}, {year: '1986/87', rank: 9},
            {year: '1887/88', rank: 6}, {year: '1988/89', rank: 6}, {year: '1989/90', rank: 15}, {year: '1990/91', rank: 17},
            {year: '1991/92', rank: 14}, {year: '1992/93', rank: 15}, {year: '1993/94', rank: 6}, {year: '1994/95', rank: 9},
            {year: '1995/96', rank: 12}, {year: '1996/97', rank: 11}, {year: '1997/98', rank: 11}, {year: '1998/99', rank: 9},
            {year: '1999/00', rank: 18}, {year: '2000/01', rank: 7}, {year: '2001/02', rank: 16}, {year: '2002/03', rank: 8},
            {year: '2003/04', rank: 13}, {year: '2004/05', rank: 10}, {year: '2005/06', rank: 13}, {year: '2006/07', rank: 5},
            {year: '2007/08', rank: 14}, {year: '2008/09', rank: 13}, {year: '2009/10', rank: 7},
            {year: '2010/11', rank: 14}, {year: '2011/12', rank: 15}, {year: '2012/13', rank: 13}, {year: '2013/14', rank: 15}, {year: '2014/15', rank: 14},
            {year: '2015/16', rank: 15}, {year: '2016/17', rank: 11}, {year: '2017/18', rank: 14}, {year: '2018/19', rank: 13}, {year: '2019/20', rank: 15}, {year: '2020/21', rank: 14},
            {year: '2021/22', rank: 15}, {year: '2022/23', rank: 11}, {year: '2023/24', rank: 14}, {year: '2024/25', rank: 11}
        ]
    },
    { 
        name: 'Hamsispor', 
        president: 'Laz Ali',
        logo: 'https://i.imgur.com/LqtejWJ.png',
        jersey: 'https://imgur.com/BP2TPF8.png',
        jerseyGK: 'https://imgur.com/rhp2PXq.png', 
        colors: ['bg-red-900', 'text-blue-400'], 
        championships: 0,
        cups: 3,
        s_cups: 1,
        euro_cups: 0,
        stadium: 'Deniz Kenarı',
        capacity: 22000,
        fans: 2000000, 
        budget: 6, 
        targetStrength: 70,
        baseReputation: 3.0,
        debt: 19, // M€
        leagueHistory: [
            {year: '1983/84', rank: 17}, {year: '1984/85', rank: 17}, {year: '1985/86', rank: 15}, {year: '1986/87', rank: 8},
            {year: '1987/88', rank: 18}, {year: '1988/89', rank: 17}, {year: '1989/90', rank: 18}, {year: '1990/91', rank: 15},
            {year: '1991/92', rank: 18}, {year: '1992/93', rank: 18}, {year: '1993/94', rank: 17}, {year: '1994/95', rank: 18},
            {year: '1995/96', rank: 18}, {year: '1996/97', rank: 9}, {year: '1997/98', rank: 5}, {year: '1998/99', rank: 11},
            {year: '1999/00', rank: 15}, {year: '2000/01', rank: 16}, {year: '2001/02', rank: 15}, {year: '2002/03', rank: 13},
            {year: '2003/04', rank: 12}, {year: '2004/05', rank: 15}, {year: '2005/06', rank: 11}, {year: '2006/07', rank: 18},
            {year: '2007/08', rank: 13}, {year: '2008/09', rank: 17}, {year: '2009/10', rank: 18},
            {year: '2010/11', rank: 18}, {year: '2011/12', rank: 16}, {year: '2012/13', rank: 17}, {year: '2013/14', rank: 18}, {year: '2014/15', rank: 17},
            {year: '2015/16', rank: 16}, {year: '2016/17', rank: 18}, {year: '2017/18', rank: 15}, {year: '2018/19', rank: 18}, {year: '2019/20', rank: 17}, {year: '2020/21', rank: 16},
            {year: '2021/22', rank: 18}, {year: '2022/23', rank: 17}, {year: '2023/24', rank: 17}, {year: '2024/25', rank: 18}
        ]
    },
    { 
        name: 'Osurukspor', 
        president: 'Nihat Gazozcu',
        logo: 'https://i.imgur.com/Iz505sK.png',
        jersey: 'https://imgur.com/eqUzVTA.png',
        jerseyGK: 'https://imgur.com/ZjPlTwJ.png', 
        colors: ['bg-green-500', 'text-white'], 
        championships: 0,
        cups: 0,
        s_cups: 0, 
        euro_cups: 0,
        stadium: 'Rüzgar Vadisi',
        capacity: 14500,
        fans: 300000, 
        budget: 5, 
        targetStrength: 67,
        baseReputation: 2.8,
        debt: 17, // M€
        leagueHistory: [
            {year: '1983/84', rank: 16}, {year: '1984/85', rank: 13}, {year: '1985/86', rank: 14}, {year: '1986/87', rank: 18},
            {year: '1987/88', rank: 16}, {year: '1988/89', rank: 18}, {year: '1989/90', rank: 17}, {year: '1990/91', rank: 18},
            {year: '1991/92', rank: 17}, {year: '1992/93', rank: 13}, {year: '1993/94', rank: 14}, {year: '1994/95', rank: 15},
            {year: '1995/96', rank: 17}, {year: '1996/97', rank: 16}, {year: '1997/98', rank: 16}, {year: '1998/99', rank: 8},
            {year: '1999/00', rank: 11}, {year: '2000/01', rank: 13}, {year: '2001/02', rank: 6}, {year: '2002/03', rank: 10},
            {year: '2003/04', rank: 18}, {year: '2004/05', rank: 14}, {year: '2005/06', rank: 16}, {year: '2006/07', rank: 17},
            {year: '2007/08', rank: 17}, {year: '2008/09', rank: 14}, {year: '2009/10', rank: 14},
            {year: '2010/11', rank: 16}, {year: '2011/12', rank: 17}, {year: '2012/13', rank: 16}, {year: '2013/14', rank: 17}, {year: '2014/15', rank: 15},
            {year: '2015/16', rank: 18}, {year: '2016/17', rank: 16}, {year: '2017/18', rank: 17}, {year: '2018/19', rank: 17}, {year: '2019/20', rank: 16}, {year: '2020/21', rank: 18},
            {year: '2021/22', rank: 17}, {year: '2022/23', rank: 16}, {year: '2023/24', rank: 18}, {year: '2024/25', rank: 16}
        ]
    },
    { 
        name: 'Yeni Bozkurtspor', 
        president: 'Alparslan Yıldırım',
        logo: 'https://i.imgur.com/n17A3Cw.png',
        jersey: 'https://imgur.com/QtcPbrG.png',
        jerseyGK: 'https://imgur.com/syiHDWW.png', 
        colors: ['bg-amber-800', 'text-black'], 
        championships: 0,
        cups: 0,
        s_cups: 2, 
        euro_cups: 0,
        stadium: 'Ova Arena',
        capacity: 34500,
        fans: 2100000, 
        budget: 17, 
        targetStrength: 76,
        baseReputation: 3.4,
        debt: 33, // M€
        leagueHistory: [
            {year: '1983/84', rank: 7}, {year: '1984/85', rank: 6}, {year: '1985/86', rank: 9}, {year: '1986/87', rank: 6},
            {year: '1987/88', rank: 8}, {year: '1988/89', rank: 13}, {year: '1989/90', rank: 5}, {year: '1990/91', rank: 4},
            {year: '1991/92', rank: 4}, {year: '1992/93', rank: 4}, {year: '1993/94', rank: 4}, {year: '1994/95', rank: 2},
            {year: '1995/96', rank: 6}, {year: '1996/97', rank: 14}, {year: '1997/98', rank: 10}, {year: '1998/99', rank: 14},
            {year: '1999/00', rank: 10}, {year: '2000/01', rank: 10}, {year: '2001/02', rank: 10}, {year: '2002/03', rank: 6},
            {year: '2003/04', rank: 9}, {year: '2004/05', rank: 5}, {year: '2005/06', rank: 5}, {year: '2006/07', rank: 12},
            {year: '2007/08', rank: 5}, {year: '2008/09', rank: 4}, {year: '2009/10', rank: 6},
            {year: '2010/11', rank: 5}, {year: '2011/12', rank: 6}, {year: '2012/13', rank: 2}, {year: '2013/14', rank: 6}, {year: '2014/15', rank: 7},
            {year: '2015/16', rank: 2}, {year: '2016/17', rank: 6}, {year: '2017/18', rank: 2}, {year: '2018/19', rank: 3}, {year: '2019/20', rank: 6}, {year: '2020/21', rank: 6},
            {year: '2021/22', rank: 6}, {year: '2022/23', rank: 6}, {year: '2023/24', rank: 2}, {year: '2024/25', rank: 6}
        ]
    },
    { 
        name: 'Civcivspor', 
        president: 'Cem Civcivcioğlu',
        logo: 'https://i.imgur.com/eUpKqYk.png',
        jersey: 'https://imgur.com/9JuH2nU.png',
        jerseyGK: 'https://imgur.com/00KMILk.png', 
        colors: ['bg-yellow-400', 'text-blue-900'], 
        championships: 0,
        cups: 0,
        s_cups: 0,
        euro_cups: 0,
        stadium: 'Kümes Park',
        capacity: 11700,
        fans: 400000, 
        budget: 11, 
        targetStrength: 68,
        baseReputation: 2.7,
        debt: 11, // M€
        leagueHistory: [
            {year: '1983/84', rank: 11}, {year: '1984/85', rank: 16}, {year: '1985/86', rank: 13}, {year: '1986/87', rank: 4},
            {year: '1987/88', rank: 15}, {year: '1988/89', rank: 15}, {year: '1989/90', rank: 8}, {year: '1990/91', rank: 13},
            {year: '1991/92', rank: 7}, {year: '1992/93', rank: 16}, {year: '1993/94', rank: 15}, {year: '1994/95', rank: 14},
            {year: '1995/96', rank: 9}, {year: '1996/97', rank: 17}, {year: '1997/98', rank: 13}, {year: '1998/99', rank: 10},
            {year: '1999/00', rank: 8}, {year: '2000/01', rank: 12}, {year: '2001/02', rank: 4}, {year: '2002/03', rank: 7},
            {year: '2003/04', rank: 7}, {year: '2004/05', rank: 7}, {year: '2005/06', rank: 9}, {year: '2006/07', rank: 11},
            {year: '2007/08', rank: 15}, {year: '2008/09', rank: 12}, {year: '2009/10', rank: 13},
            {year: '2010/11', rank: 11}, {year: '2011/12', rank: 10}, {year: '2012/13', rank: 11}, {year: '2013/14', rank: 9}, {year: '2014/15', rank: 10},
            {year: '2015/16', rank: 11}, {year: '2016/17', rank: 12}, {year: '2017/18', rank: 10}, {year: '2018/19', rank: 9}, {year: '2019/20', rank: 10}, {year: '2020/21', rank: 11},
            {year: '2021/22', rank: 11}, {year: '2022/23', rank: 12}, {year: '2023/24', rank: 11}, {year: '2024/25', rank: 12}
        ]
    },
    { 
        name: 'Aston Karakoçan', 
        president: 'Sir Mehmet Karakoç',
        logo: 'https://i.imgur.com/sw63G9H.png',
        jersey: 'https://imgur.com/z3S5RuL.png',
        jerseyGK: 'https://imgur.com/HXvBipD.png', 
        colors: ['bg-indigo-900', 'text-blue-400'], 
        championships: 0,
        cups: 0,
        s_cups: 0, 
        euro_cups: 0,
        stadium: 'Şehir Stadı',
        capacity: 29000,
        fans: 1600000, 
        budget: 13, 
        targetStrength: 75,
        baseReputation: 3.1,
        debt: 15, // M€
        leagueHistory: [
            {year: '1983/84', rank: 10}, {year: '1984/85', rank: 4}, {year: '1985/86', rank: 11}, {year: '1986/87', rank: 7},
            {year: '1987/88', rank: 10}, {year: '1988/89', rank: 11}, {year: '1989/90', rank: 4}, {year: '1990/91', rank: 12},
            {year: '1991/92', rank: 12}, {year: '1992/93', rank: 10}, {year: '1993/94', rank: 13}, {year: '1994/95', rank: 8},
            {year: '1995/96', rank: 16}, {year: '1996/97', rank: 10}, {year: '1997/98', rank: 15}, {year: '1998/99', rank: 16},
            {year: '1999/00', rank: 6}, {year: '2000/01', rank: 18}, {year: '2001/02', rank: 18}, {year: '2002/03', rank: 14},
            {year: '2003/04', rank: 8}, {year: '2004/05', rank: 11}, {year: '2005/06', rank: 8}, {year: '2006/07', rank: 7},
            {year: '2007/08', rank: 9}, {year: '2008/09', rank: 7}, {year: '2009/10', rank: 11},
            {year: '2010/11', rank: 13}, {year: '2011/12', rank: 12}, {year: '2012/13', rank: 14}, {year: '2013/14', rank: 13}, {year: '2014/15', rank: 11},
            {year: '2015/16', rank: 12}, {year: '2016/17', rank: 14}, {year: '2017/18', rank: 13}, {year: '2018/19', rank: 11}, {year: '2019/20', rank: 13}, {year: '2020/21', rank: 12},
            {year: '2021/22', rank: 13}, {year: '2022/23', rank: 14}, {year: '2023/24', rank: 13}, {year: '2024/25', rank: 13}
        ]
    },
    { 
        name: 'Küheylanspor', 
        president: 'Ferhat Atlı',
        logo: 'https://i.imgur.com/WG9bJgB.png',
        jersey: 'https://imgur.com/QDHs7Sy.png',
        jerseyGK: 'https://imgur.com/r4F2Ykh.png', 
        colors: ['bg-red-600', 'text-white'], 
        championships: 0,
        cups: 3,
        s_cups: 0,
        euro_cups: 0,
        stadium: 'Hipodrom Arena',
        capacity: 30300,
        fans: 450000, 
        budget: 8, 
        targetStrength: 72,
        baseReputation: 3.0,
        debt: 16, // M€
        leagueHistory: [
            {year: '1983/84', rank: 18}, {year: '1984/85', rank: 5}, {year: '1985/86', rank: 5}, {year: '1986/87', rank: 10},
            {year: '1987/88', rank: 7}, {year: '1988/89', rank: 9}, {year: '1989/90', rank: 6}, {year: '1990/91', rank: 16},
            {year: '1991/92', rank: 16}, {year: '1992/93', rank: 12}, {year: '1993/94', rank: 18}, {year: '1994/95', rank: 16},
            {year: '1995/96', rank: 7}, {year: '1996/97', rank: 7}, {year: '1997/98', rank: 17}, {year: '1998/99', rank: 6},
            {year: '1999/00', rank: 12}, {year: '2000/01', rank: 11}, {year: '2001/02', rank: 11}, {year: '2002/03', rank: 12},
            {year: '2003/04', rank: 10}, {year: '2004/05', rank: 16}, {year: '2005/06', rank: 18}, {year: '2006/07', rank: 15},
            {year: '2007/08', rank: 18}, {year: '2008/09', rank: 18}, {year: '2009/10', rank: 16},
            {year: '2010/11', rank: 17}, {year: '2011/12', rank: 18}, {year: '2012/13', rank: 18}, {year: '2013/14', rank: 16}, {year: '2014/15', rank: 18},
            {year: '2015/16', rank: 17}, {year: '2016/17', rank: 17}, {year: '2017/18', rank: 18}, {year: '2018/19', rank: 16}, {year: '2019/20', rank: 18}, {year: '2020/21', rank: 17},
            {year: '2021/22', rank: 16}, {year: '2022/23', rank: 18}, {year: '2023/24', rank: 16}, {year: '2024/25', rank: 17}
        ]
    },
    { 
        name: 'İslamspor', 
        president: 'Oflu Hoca',
        logo: 'https://i.imgur.com/JROZfTX.png',
        jersey: 'https://imgur.com/g5voy0X.png',
        jerseyGK: 'https://imgur.com/W71pkOG.png', 
        colors: ['bg-green-500', 'text-green-900'], 
        championships: 0,
        cups: 0,
        s_cups: 0, 
        euro_cups: 0,
        stadium: 'Barış Parkı',
        capacity: 33100,
        fans: 1950000, 
        budget: 15, 
        targetStrength: 74,
        baseReputation: 3.1,
        debt: 7, // M€
        leagueHistory: [
            {year: '1983/84', rank: 13}, {year: '1984/85', rank: 8}, {year: '1985/86', rank: 18}, {year: '1986/87', rank: 17},
            {year: '1987/88', rank: 17}, {year: '1988/89', rank: 16}, {year: '1989/90', rank: 11}, {year: '1990/91', rank: 9},
            {year: '1991/92', rank: 8}, {year: '1992/93', rank: 14}, {year: '1993/94', rank: 12}, {year: '1994/95', rank: 12},
            {year: '1995/96', rank: 10}, {year: '1996/97', rank: 5}, {year: '1997/98', rank: 8}, {year: '1998/99', rank: 5},
            {year: '1999/00', rank: 7}, {year: '2000/01', rank: 6}, {year: '2001/02', rank: 7}, {year: '2002/03', rank: 15},
            {year: '2003/04', rank: 15}, {year: '2004/05', rank: 17}, {year: '2005/06', rank: 15}, {year: '2006/07', rank: 10},
            {year: '2007/08', rank: 7}, {year: '2008/09', rank: 11}, {year: '2009/10', rank: 9},
            {year: '2010/11', rank: 7}, {year: '2011/12', rank: 8}, {year: '2012/13', rank: 7}, {year: '2013/14', rank: 8}, {year: '2014/15', rank: 6},
            {year: '2015/16', rank: 7}, {year: '2016/17', rank: 8}, {year: '2017/18', rank: 7}, {year: '2018/19', rank: 8}, {year: '2019/20', rank: 7}, {year: '2020/21', rank: 8},
            {year: '2021/22', rank: 7}, {year: '2022/23', rank: 8}, {year: '2023/24', rank: 7}, {year: '2024/25', rank: 8}
        ]
    },
    // --- 1. LİG TEAMS ---
    { 
        name: 'Kartalspor', 
        logo: 'https://i.imgur.com/LGVIYxf.png',
        colors: ['bg-black', 'text-white'], 
        targetStrength: 70, 
        baseReputation: 2.8, 
        budget: 3, 
        fans: 1500000, 
        stadium: 'Kartal Yuvası', 
        capacity: 15000, 
        championships: 3, 
        leagueHistory: [
            {year: '2004/05', rank: 3}, {year: '2005/06', rank: 6}, {year: '2006/07', rank: 2}, {year: '2007/08', rank: 8},
            {year: '2008/09', rank: 8}, {year: '2009/10', rank: 6}, {year: '2010/11', rank: 7}, {year: '2011/12', rank: 7},
            {year: '2012/13', rank: 8}, {year: '2013/14', rank: 8}, {year: '2014/15', rank: 1}, {year: '2015/16', rank: 6},
            {year: '2016/17', rank: 7}, {year: '2017/18', rank: 9}, {year: '2018/19', rank: 7}, {year: '2019/20', rank: 7},
            {year: '2020/21', rank: 1}, {year: '2021/22', rank: 7}, {year: '2022/23', rank: 2}, {year: '2023/24', rank: 7}, {year: '2024/25', rank: 1}
        ] 
    },
    { 
        name: 'Çakalsaray', 
        logo: 'https://i.imgur.com/GF1PCY4.png',
        colors: ['bg-yellow-500', 'text-red-600'], 
        targetStrength: 66, 
        baseReputation: 2.5, 
        budget: 2, 
        fans: 1300000, 
        stadium: 'Çakal İni', 
        capacity: 12000, 
        championships: 2, 
        leagueHistory: [
            {year: '2004/05', rank: 5}, {year: '2005/06', rank: 4}, {year: '2006/07', rank: 6}, {year: '2007/08', rank: 1},
            {year: '2008/09', rank: 5}, {year: '2009/10', rank: 3}, {year: '2010/11', rank: 4}, {year: '2011/12', rank: 5},
            {year: '2012/13', rank: 3}, {year: '2013/14', rank: 6}, {year: '2014/15', rank: 4}, {year: '2015/16', rank: 1},
            {year: '2016/17', rank: 5}, {year: '2017/18', rank: 2}, {year: '2018/19', rank: 6}, {year: '2019/20', rank: 3},
            {year: '2020/21', rank: 5}, {year: '2021/22', rank: 2}, {year: '2022/23', rank: 4}, {year: '2023/24', rank: 4}, {year: '2024/25', rank: 6}
        ] 
    },
    { 
        name: 'Panterspor', 
        logo: 'https://i.imgur.com/3u9jWKs.png',
        colors: ['bg-gray-900', 'text-purple-500'], 
        targetStrength: 69, 
        baseReputation: 2.7, 
        budget: 2, 
        fans: 1400000, 
        stadium: 'Kara Orman', 
        capacity: 7000, 
        championships: 1, 
        leagueHistory: [
            {year: '2004/05', rank: 12}, {year: '2005/06', rank: 10}, {year: '2006/07', rank: 11}, {year: '2007/08', rank: 11},
            {year: '2008/09', rank: 10}, {year: '2009/10', rank: 11}, {year: '2010/11', rank: 10}, {year: '2011/12', rank: 10},
            {year: '2012/13', rank: 11}, {year: '2013/14', rank: 12}, {year: '2014/15', rank: 11}, {year: '2015/16', rank: 10},
            {year: '2016/17', rank: 10}, {year: '2017/18', rank: 11}, {year: '2018/19', rank: 11}, {year: '2019/20', rank: 1},
            {year: '2020/21', rank: 10}, {year: '2021/22', rank: 11}, {year: '2022/23', rank: 10}, {year: '2023/24', rank: 11}, {year: '2024/25', rank: 11}
        ] 
    },
    { 
        name: 'Anadoluspor', 
        logo: 'https://i.imgur.com/aGXOlFU.png',
        colors: ['bg-red-600', 'text-white'], 
        targetStrength: 66, 
        baseReputation: 2.5, 
        budget: 4, 
        fans: 1650000, 
        stadium: 'Atatürk Anadolu Stadı', 
        capacity: 80000, 
        championships: 4, 
        leagueHistory: [
            {year: '2004/05', rank: 1}, {year: '2005/06', rank: 3}, {year: '2006/07', rank: 2}, {year: '2007/08', rank: 4},
            {year: '2008/09', rank: 1}, {year: '2009/10', rank: 5}, {year: '2010/11', rank: 2}, {year: '2011/12', rank: 3},
            {year: '2012/13', rank: 2}, {year: '2013/14', rank: 4}, {year: '2014/15', rank: 2}, {year: '2015/16', rank: 3},
            {year: '2016/17', rank: 2}, {year: '2017/18', rank: 5}, {year: '2018/19', rank: 1}, {year: '2019/20', rank: 4},
            {year: '2020/21', rank: 2}, {year: '2021/22', rank: 3}, {year: '2022/23', rank: 2}, {year: '2023/24', rank: 1}, {year: '2024/25', rank: 2}
        ] 
    },
    { 
        name: 'Parsbahçe', 
        logo: 'https://i.imgur.com/xKDLviR.png',
        colors: ['bg-blue-900', 'text-yellow-400'], 
        targetStrength: 65, 
        baseReputation: 2.4, 
        budget: 1, 
        fans: 1200000, 
        stadium: 'Pars Arena', 
        capacity: 4500, 
        championships: 1, 
        leagueHistory: [
            {year: '2004/05', rank: 9}, {year: '2005/06', rank: 8}, {year: '2006/07', rank: 7}, {year: '2007/08', rank: 7},
            {year: '2008/09', rank: 9}, {year: '2009/10', rank: 8}, {year: '2010/11', rank: 9}, {year: '2011/12', rank: 8},
            {year: '2012/13', rank: 7}, {year: '2013/14', rank: 7}, {year: '2014/15', rank: 9}, {year: '2015/16', rank: 8},
            {year: '2016/17', rank: 1}, {year: '2017/18', rank: 5}, {year: '2018/19', rank: 9}, {year: '2019/20', rank: 9},
            {year: '2020/21', rank: 8}, {year: '2021/22', rank: 9}, {year: '2022/23', rank: 8}, {year: '2023/24', rank: 9}, {year: '2024/25', rank: 9}
        ] 
    },
    { 
        name: 'KaraKargaspor', 
        logo: 'https://i.imgur.com/O84pRZh.png',
        colors: ['bg-black', 'text-gray-400'], 
        targetStrength: 65, 
        baseReputation: 2.4, 
        budget: 1, 
        fans: 180000, 
        stadium: 'Karga Yuvası', 
        capacity: 6500, 
        championships: 0, 
        leagueHistory: [
            {year: '2004/05', rank: 14}, {year: '2005/06', rank: 12}, {year: '2006/07', rank: 13}, {year: '2007/08', rank: 14},
            {year: '2008/09', rank: 15}, {year: '2009/10', rank: 14}, {year: '2010/11', rank: 15}, {year: '2011/12', rank: 13},
            {year: '2012/13', rank: 14}, {year: '2013/14', rank: 15}, {year: '2014/15', rank: 14}, {year: '2015/16', rank: 13},
            {year: '2016/17', rank: 14}, {year: '2017/18', rank: 13}, {year: '2018/19', rank: 15}, {year: '2019/20', rank: 14},
            {year: '2020/21', rank: 15}, {year: '2021/22', rank: 13}, {year: '2022/23', rank: 14}, {year: '2023/24', rank: 15}, {year: '2024/25', rank: 14}
        ] 
    },
    { 
        name: 'Balıkspor', 
        logo: 'https://i.imgur.com/5fXIImw.png',
        colors: ['bg-cyan-500', 'text-white'], 
        targetStrength: 64, 
        baseReputation: 2.3, 
        budget: 1, 
        fans: 350000, 
        stadium: 'Akvaryum', 
        capacity: 8500, 
        championships: 0, 
        leagueHistory: [
            {year: '2004/05', rank: 15}, {year: '2005/06', rank: 13}, {year: '2006/07', rank: 14}, {year: '2007/08', rank: 15},
            {year: '2008/09', rank: 16}, {year: '2009/10', rank: 15}, {year: '2010/11', rank: 16}, {year: '2011/12', rank: 14},
            {year: '2012/13', rank: 15}, {year: '2013/14', rank: 16}, {year: '2014/15', rank: 15}, {year: '2015/16', rank: 14},
            {year: '2016/17', rank: 15}, {year: '2017/18', rank: 14}, {year: '2018/19', rank: 16}, {year: '2019/20', rank: 15},
            {year: '2020/21', rank: 16}, {year: '2021/22', rank: 14}, {year: '2022/23', rank: 15}, {year: '2023/24', rank: 16}, {year: '2024/25', rank: 15}
        ] 
    },
    { 
        name: 'Sansarspor', 
        logo: 'https://i.imgur.com/56itsyB.png',
        colors: ['bg-amber-800', 'text-yellow-300'], 
        targetStrength: 64, 
        baseReputation: 2.3, 
        budget: 1, 
        fans: 240000, 
        stadium: 'Sansar Stadı', 
        capacity: 8000, 
        championships: 1, 
        leagueHistory: [
            {year: '2004/05', rank: 10}, {year: '2005/06', rank: 11}, {year: '2006/07', rank: 9}, {year: '2007/08', rank: 10},
            {year: '2008/09', rank: 11}, {year: '2009/10', rank: 9}, {year: '2010/11', rank: 8}, {year: '2011/12', rank: 9},
            {year: '2012/13', rank: 9}, {year: '2013/14', rank: 9}, {year: '2014/15', rank: 10}, {year: '2015/16', rank: 9},
            {year: '2016/17', rank: 9}, {year: '2017/18', rank: 1}, {year: '2018/19', rank: 10}, {year: '2019/20', rank: 10},
            {year: '2020/21', rank: 9}, {year: '2021/22', rank: 10}, {year: '2022/23', rank: 9}, {year: '2023/24', rank: 10}, {year: '2024/25', rank: 10}
        ] 
    },
    { 
        name: 'Baykuşspor', 
        logo: 'https://i.imgur.com/hhQcSJ2.png',
        colors: ['bg-red-900', 'text-yellow-500'], 
        targetStrength: 62, 
        baseReputation: 2.1, 
        budget: 1, 
        fans: 420000, 
        stadium: 'Gece Parkı', 
        capacity: 7500, 
        championships: 0, 
        leagueHistory: [
            {year: '2004/05', rank: 17}, {year: '2005/06', rank: 15}, {year: '2006/07', rank: 16}, {year: '2007/08', rank: 17},
            {year: '2008/09', rank: 18}, {year: '2009/10', rank: 17}, {year: '2010/11', rank: 18}, {year: '2011/12', rank: 16},
            {year: '2012/13', rank: 17}, {year: '2013/14', rank: 18}, {year: '2014/15', rank: 17}, {year: '2015/16', rank: 16},
            {year: '2016/17', rank: 17}, {year: '2017/18', rank: 16}, {year: '2018/19', rank: 18}, {year: '2019/20', rank: 17},
            {year: '2020/21', rank: 18}, {year: '2021/22', rank: 16}, {year: '2022/23', rank: 17}, {year: '2023/24', rank: 18}, {year: '2024/25', rank: 17}
        ] 
    },
    { 
        name: 'Bozkurtspor', 
        logo: 'https://i.imgur.com/gXgY2zm.png',
        colors: ['bg-gray-500', 'text-black'], 
        targetStrength: 63, 
        baseReputation: 2.2, 
        budget: 2, 
        fans: 2130000, 
        stadium: 'Bozkurt Arena', 
        capacity: 8000, 
        championships: 0, 
        leagueHistory: [
            {year: '2004/05', rank: 13}, {year: '2005/06', rank: 14}, {year: '2006/07', rank: 15}, {year: '2007/08', rank: 13},
            {year: '2008/09', rank: 14}, {year: '2009/10', rank: 13}, {year: '2010/11', rank: 14}, {year: '2011/12', rank: 15},
            {year: '2012/13', rank: 13}, {year: '2013/14', rank: 14}, {year: '2014/15', rank: 13}, {year: '2015/16', rank: 15},
            {year: '2016/17', rank: 13}, {year: '2017/18', rank: 15}, {year: '2018/19', rank: 14}, {year: '2019/20', rank: 13},
            {year: '2020/21', rank: 14}, {year: '2021/22', rank: 15}, {year: '2022/23', rank: 13}, {year: '2023/24', rank: 14}, {year: '2024/25', rank: 13}
        ] 
    },
    { 
        name: 'Kurtpençe FK', 
        logo: 'https://i.imgur.com/XS0k2yL.png',
        colors: ['bg-red-900', 'text-white'], 
        targetStrength: 68, 
        baseReputation: 2.6, 
        budget: 1, 
        fans: 350000, 
        stadium: 'Pençe Stadı', 
        capacity: 13000, 
        championships: 1, 
        leagueHistory: [
            {year: '2004/05', rank: 7}, {year: '2005/06', rank: 5}, {year: '2006/07', rank: 8}, {year: '2007/08', rank: 9},
            {year: '2008/09', rank: 7}, {year: '2009/10', rank: 2}, {year: '2010/11', rank: 5}, {year: '2011/12', rank: 3},
            {year: '2012/13', rank: 1}, {year: '2013/14', rank: 4}, {year: '2014/15', rank: 8}, {year: '2015/16', rank: 5},
            {year: '2016/17', rank: 3}, {year: '2017/18', rank: 7}, {year: '2018/19', rank: 8}, {year: '2019/20', rank: 8},
            {year: '2020/21', rank: 7}, {year: '2021/22', rank: 8}, {year: '2022/23', rank: 6}, {year: '2023/24', rank: 8}, {year: '2024/25', rank: 7}
        ] 
    },
    { 
        name: 'Şahinspor', 
        logo: 'https://i.imgur.com/OKqHz7E.png',
        colors: ['bg-blue-900', 'text-white'], 
        targetStrength: 69, 
        baseReputation: 2.7, 
        budget: 1, 
        fans: 380000, 
        stadium: 'Gök Kubbe', 
        capacity: 16500, 
        championships: 3, 
        leagueHistory: [
            {year: '2004/05', rank: 4}, {year: '2005/06', rank: 2}, {year: '2006/07', rank: 1}, {year: '2007/08', rank: 3},
            {year: '2008/09', rank: 2}, {year: '2009/10', rank: 4}, {year: '2010/11', rank: 3}, {year: '2011/12', rank: 1},
            {year: '2012/13', rank: 4}, {year: '2013/14', rank: 2}, {year: '2014/15', rank: 3}, {year: '2015/16', rank: 4},
            {year: '2016/17', rank: 2}, {year: '2017/18', rank: 3}, {year: '2018/19', rank: 2}, {year: '2019/20', rank: 2},
            {year: '2020/21', rank: 3}, {year: '2021/22', rank: 4}, {year: '2022/23', rank: 1}, {year: '2023/24', rank: 3}, {year: '2024/25', rank: 3}
        ] 
    },
    { 
        name: 'Koçspor', 
        logo: 'https://i.imgur.com/15M6ab7.png',
        colors: ['bg-green-600', 'text-white'], 
        targetStrength: 66, 
        baseReputation: 2.5, 
        budget: 3, 
        fans: 480000, 
        stadium: 'Yeşil Vadi', 
        capacity: 11500, 
        championships: 1, 
        leagueHistory: [
            {year: '2004/05', rank: 2}, {year: '2005/06', rank: 1}, {year: '2006/07', rank: 3}, {year: '2007/08', rank: 5},
            {year: '2008/09', rank: 4}, {year: '2009/10', rank: 2}, {year: '2010/11', rank: 6}, {year: '2011/12', rank: 4},
            {year: '2012/13', rank: 5}, {year: '2013/14', rank: 3}, {year: '2014/15', rank: 6}, {year: '2015/16', rank: 7},
            {year: '2016/17', rank: 8}, {year: '2017/18', rank: 4}, {year: '2018/19', rank: 3}, {year: '2019/20', rank: 5},
            {year: '2020/21', rank: 4}, {year: '2021/22', rank: 6}, {year: '2022/23', rank: 7}, {year: '2023/24', rank: 5}, {year: '2024/25', rank: 4}
        ] 
    },
    { 
        name: 'Leoparspor', 
        logo: 'https://i.imgur.com/as4o2BF.png',
        colors: ['bg-yellow-400', 'text-black'], 
        targetStrength: 64, 
        baseReputation: 2.3, 
        budget: 1, 
        fans: 460000, 
        stadium: 'Savana Park', 
        capacity: 9500, 
        championships: 0, 
        leagueHistory: [
            {year: '2004/05', rank: 16}, {year: '2005/06', rank: 17}, {year: '2006/07', rank: 17}, {year: '2007/08', rank: 16},
            {year: '2008/09', rank: 17}, {year: '2009/10', rank: 16}, {year: '2010/11', rank: 17}, {year: '2011/12', rank: 18},
            {year: '2012/13', rank: 16}, {year: '2013/14', rank: 17}, {year: '2014/15', rank: 16}, {year: '2015/16', rank: 17},
            {year: '2016/17', rank: 16}, {year: '2017/18', rank: 17}, {year: '2018/19', rank: 17}, {year: '2019/20', rank: 16},
            {year: '2020/21', rank: 17}, {year: '2021/22', rank: 17}, {year: '2022/23', rank: 16}, {year: '2023/24', rank: 17}, {year: '2024/25', rank: 16}
        ] 
    },
    { 
        name: 'Kangalspor', 
        logo: 'https://i.imgur.com/4SQKqMu.png',
        colors: ['bg-stone-200', 'text-black'], 
        targetStrength: 65, 
        baseReputation: 2.4, 
        budget: 2, 
        fans: 1620000, 
        stadium: 'Sivas Arena', 
        capacity: 20500, 
        championships: 1, 
        leagueHistory: [
            {year: '2004/05', rank: 6}, {year: '2005/06', rank: 9}, {year: '2006/07', rank: 4}, {year: '2007/08', rank: 2},
            {year: '2008/09', rank: 6}, {year: '2009/10', rank: 7}, {year: '2010/11', rank: 1}, {year: '2011/12', rank: 6},
            {year: '2012/13', rank: 2}, {year: '2013/14', rank: 5}, {year: '2014/15', rank: 7}, {year: '2015/16', rank: 3},
            {year: '2016/17', rank: 6}, {year: '2017/18', rank: 8}, {year: '2018/19', rank: 4}, {year: '2019/20', rank: 6},
            {year: '2020/21', rank: 2}, {year: '2021/22', rank: 3}, {year: '2022/23', rank: 5}, {year: '2023/24', rank: 2}, {year: '2024/25', rank: 5}
        ] 
    },
    { 
        name: 'Vaşakspor', 
        logo: 'https://i.imgur.com/ik4tS0H.png',
        colors: ['bg-orange-500', 'text-black'], 
        targetStrength: 62, 
        baseReputation: 2.1, 
        budget: 1, 
        fans: 410000, 
        stadium: 'Dağ Evi', 
        capacity: 7000, 
        championships: 1, 
        leagueHistory: [
            {year: '2004/05', rank: 11}, {year: '2005/06', rank: 12}, {year: '2006/07', rank: 10}, {year: '2007/08', rank: 12},
            {year: '2008/09', rank: 12}, {year: '2009/10', rank: 10}, {year: '2010/11', rank: 11}, {year: '2011/12', rank: 11},
            {year: '2012/13', rank: 10}, {year: '2013/14', rank: 10}, {year: '2014/15', rank: 12}, {year: '2015/16', rank: 11},
            {year: '2016/17', rank: 11}, {year: '2017/18', rank: 10}, {year: '2018/19', rank: 12}, {year: '2019/20', rank: 11},
            {year: '2020/21', rank: 11}, {year: '2021/22', rank: 1}, {year: '2022/23', rank: 11}, {year: '2023/24', rank: 12}, {year: '2024/25', rank: 12}
        ] 
    },
    { 
        name: 'Keçispor', 
        logo: 'https://i.imgur.com/C6zXezY.png',
        colors: ['bg-green-700', 'text-white'], 
        targetStrength: 63, 
        baseReputation: 2.2, 
        budget: 2, 
        fans: 225000, 
        stadium: 'Yayla Stadı', 
        capacity: 7500, 
        championships: 2, 
        leagueHistory: [
            {year: '2004/05', rank: 8}, {year: '2005/06', rank: 7}, {year: '2006/07', rank: 5}, {year: '2007/08', rank: 6},
            {year: '2008/09', rank: 3}, {year: '2009/10', rank: 1}, {year: '2010/11', rank: 5}, {year: '2011/12', rank: 2},
            {year: '2012/13', rank: 6}, {year: '2013/14', rank: 1}, {year: '2014/15', rank: 5}, {year: '2015/16', rank: 2},
            {year: '2016/17', rank: 4}, {year: '2017/18', rank: 6}, {year: '2018/19', rank: 5}, {year: '2019/20', rank: 4},
            {year: '2020/21', rank: 6}, {year: '2021/22', rank: 5}, {year: '2022/23', rank: 3}, {year: '2023/24', rank: 6}, {year: '2024/25', rank: 8}
        ] 
    },
    { 
        name: 'Akbabaspor', 
        logo: 'https://i.imgur.com/Dei8Prh.png',
        colors: ['bg-black', 'text-red-700'], 
        targetStrength: 62, 
        baseReputation: 2.1, 
        budget: 1, 
        fans: 200000, 
        stadium: 'Kaya Park', 
        capacity: 6500, 
        championships: 0, 
        leagueHistory: [
            {year: '2004/05', rank: 18}, {year: '2005/06', rank: 18}, {year: '2006/07', rank: 18}, {year: '2007/08', rank: 18},
            {year: '2008/09', rank: 19}, {year: '2009/10', rank: 18}, {year: '2010/11', rank: 18}, {year: '2011/12', rank: 17},
            {year: '2012/13', rank: 18}, {year: '2013/14', rank: 18}, {year: '2014/15', rank: 18}, {year: '2015/16', rank: 18},
            {year: '2016/17', rank: 18}, {year: '2017/18', rank: 18}, {year: '2018/19', rank: 18}, {year: '2019/20', rank: 18},
            {year: '2020/21', rank: 18}, {year: '2021/22', rank: 18}, {year: '2022/23', rank: 18}, {year: '2023/24', rank: 18}, {year: '2024/25', rank: 18}
        ] 
    }
];

export const EUROPEAN_TEAMS = [
    { name: 'Gorilla United', country: 'İngiltere', targetStrength: 90, colors: ['bg-red-800', 'text-black'] },
    { name: 'Gorilla City', country: 'İngiltere', targetStrength: 87, colors: ['bg-cyan-400', 'text-white'] },
    { name: 'Kaplanspor SK', country: 'İspanya', targetStrength: 89, colors: ['bg-orange-500', 'text-black'] },
    { name: 'Aslanspor SK', country: 'İspanya', targetStrength: 90, colors: ['bg-yellow-400', 'text-red-700'] },
    { name: 'Götten Tothennam', country: 'İngiltere', targetStrength: 86, colors: ['bg-white', 'text-blue-900'] },
    { name: 'Shefield Karakoçan', country: 'İngiltere', targetStrength: 83, colors: ['bg-red-600', 'text-white'] },
    { name: 'El-Katir', country: 'Arabistan', targetStrength: 83, colors: ['bg-green-700', 'text-white'] },
    { name: 'Kartalcelona', country: 'İspanya', targetStrength: 85, colors: ['bg-blue-800', 'text-red-600'] },
    { name: 'Yılanspor FK', country: 'İtalya', targetStrength: 86, colors: ['bg-black', 'text-blue-600'] },
    { name: 'Tezkeresport', country: 'İngiltere', targetStrength: 78, colors: ['bg-blue-500', 'text-white'] },
    { name: 'Ejderspor', country: 'İtalya', targetStrength: 83, colors: ['bg-red-700', 'text-yellow-400'] },
    { name: 'Timsahboğanspor', country: 'Almanya', targetStrength: 77, colors: ['bg-green-600', 'text-white'] },
    { name: 'Pandaspor', country: 'Almanya', targetStrength: 76, colors: ['bg-black', 'text-white'] },
    { name: 'Gergedanspor FK', country: 'Fransa', targetStrength: 81, colors: ['bg-gray-400', 'text-blue-900'] },
    { name: 'Zirafaspor', country: 'İsrail', targetStrength: 76, colors: ['bg-yellow-500', 'text-blue-500'] },
    { name: 'Orangutanboğanspor', country: 'Portekiz', targetStrength: 79, colors: ['bg-orange-600', 'text-green-700'] },
    { name: 'Kediboğanspor', country: 'İspanya', targetStrength: 74, colors: ['bg-red-500', 'text-blue-500'] },
    { name: 'Boğaboğanspor', country: 'Fransa', targetStrength: 80, colors: ['bg-blue-800', 'text-red-500'] },
    { name: 'Domuzboğanspor', country: 'İtalya', targetStrength: 77, colors: ['bg-pink-400', 'text-black'] },
    { name: 'Octopusspor', country: 'Fransa', targetStrength: 76, colors: ['bg-purple-600', 'text-white'] },
    { name: 'Deveboğanspor', country: 'Arabistan', targetStrength: 75, colors: ['bg-yellow-200', 'text-black'] },
    { name: 'Tilkiboğanspor', country: 'Fransa', targetStrength: 78, colors: ['bg-orange-500', 'text-white'] },
    { name: 'Çitaboğanspor', country: 'Arabistan', targetStrength: 79, colors: ['bg-yellow-400', 'text-black'] },
    { name: 'Saqr United', country: 'Arabistan', targetStrength: 73, colors: ['bg-green-600', 'text-white'] },
    { name: 'Baykuşboğanspor', country: 'Almanya', targetStrength: 74, colors: ['bg-slate-700', 'text-white'] },
    { name: 'Alageyikspor', country: 'Almanya', targetStrength: 76, colors: ['bg-green-800', 'text-white'] },
    { name: 'Jaguaryiyenspor', country: 'Portekiz', targetStrength: 82, colors: ['bg-green-500', 'text-red-600'] },
    { name: 'Pirhanakundakçısıspor', country: 'Rusya', targetStrength: 80, colors: ['bg-blue-700', 'text-white'] },
    { name: 'Pumadeğleyenspor', country: 'Rusya', targetStrength: 78, colors: ['bg-red-800', 'text-white'] },
    { name: 'Köpekboğanspor', country: 'Hollanda', targetStrength: 76, colors: ['bg-orange-500', 'text-white'] },
    { name: 'Keçiboğanspor', country: 'Belçika', targetStrength: 79, colors: ['bg-red-600', 'text-black'] }
];

export const RIVALRIES = [
    ['Ayıboğanspor SK', 'Kedispor'],
    ['Kedispor', 'Eşşekboğanspor FK'],
    ['Eşşekboğanspor FK', 'Ayıboğanspor SK'],
    ['Kedispor', 'Köpekspor'],
    ['Bedirspor', 'Yakhubspor']
];

// Random Facility Name Generator
const FACILITY_SUFFIXES = ['Tesisleri', 'Kamp Merkezi', 'Akademisi', 'Kompleksi'];
const getFacilityName = (teamName: string, type: 'Training' | 'Youth') => {
    const randomName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] + ' ' + LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const suffix = FACILITY_SUFFIXES[Math.floor(Math.random() * FACILITY_SUFFIXES.length)];
    if (type === 'Training') return `${randomName} ${suffix}`;
    return `${teamName} ${randomName} Altyapı ${suffix}`;
};

// Staff Generator
const generateStaff = (reputation: number): ClubStaff[] => {
    const roles = ['Sportif Direktör', 'Baş Scout', 'Altyapı Sorumlusu', 'Baş Fizyoterapist'];
    return roles.map(role => {
        const name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
        // Higher rep means better staff generally
        const baseRating = reputation * 15 + 20; 
        const rating = Math.min(100, Math.max(1, Math.floor(baseRating + (Math.random() * 30 - 10))));
        const age = Math.floor(Math.random() * 30) + 35;
        
        return {
            role,
            name,
            rating,
            age,
            nationality: 'Türkiye'
        };
    });
};

// EXCLUDED TEAMS FOR THE INITIAL SEASON
const INITIAL_CUP_EXCLUDED_TEAMS = ['Hamsispor', 'Küheylanspor', 'Baykuşspor', 'Keçispor'];

export const initializeTeams = (): Team[] => {
    // 1. Create Turkish Teams
    const turkishTeams = TEAM_TEMPLATES.map((tmpl, index) => {
        const teamId = generateId();
        const leagueId = index < 18 ? 'LEAGUE' : 'LEAGUE_1';
        
        const maxForeigners = tmpl.targetStrength >= 80 ? 11 : 5;
        let currentForeigners = 0;

        const createPlayer = (pos: Position, strength: number) => {
            const canBeForeign = currentForeigners < maxForeigners;
            const jerseyToUse = pos === Position.GK ? tmpl.jerseyGK : tmpl.jersey;
            
            const p = generatePlayer(pos, strength, teamId, canBeForeign, jerseyToUse);
            if (p.nationality !== 'Türkiye') {
                currentForeigners++;
            }
            return p;
        }
        
        // ... (Player creation logic same as before, simplified for brevity but functional)
        const gk = createPlayer(Position.GK, tmpl.targetStrength);
        const slb = createPlayer(Position.SLB, tmpl.targetStrength);
        const stp1 = createPlayer(Position.STP, tmpl.targetStrength);
        const stp2 = createPlayer(Position.STP, tmpl.targetStrength);
        const sgb = createPlayer(Position.SGB, tmpl.targetStrength);
        const slk = createPlayer(Position.SLK, tmpl.targetStrength);
        const os1 = createPlayer(Position.OS, tmpl.targetStrength);
        const os2 = createPlayer(Position.OS, tmpl.targetStrength);
        const sgk = createPlayer(Position.SGK, tmpl.targetStrength);
        const snt1 = createPlayer(Position.SNT, tmpl.targetStrength);
        const snt2 = createPlayer(Position.SNT, tmpl.targetStrength);
        const subGK = createPlayer(Position.GK, tmpl.targetStrength - 5);
        const subDEF1 = createPlayer(Position.STP, tmpl.targetStrength - 5);
        const subDEF2 = createPlayer(Position.SLB, tmpl.targetStrength - 5); 
        const subMID1 = createPlayer(Position.OS, tmpl.targetStrength - 5);
        const subMID2 = createPlayer(Position.OOS, tmpl.targetStrength - 5); 
        const subFWD1 = createPlayer(Position.SLK, tmpl.targetStrength - 5); 
        const subFWD2 = createPlayer(Position.SNT, tmpl.targetStrength - 5);
        const reserves = [];
        reserves.push(createPlayer(Position.GK, tmpl.targetStrength - 10));
        reserves.push(createPlayer(Position.SGB, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.STP, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.OS, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.SGK, tmpl.targetStrength - 8));
        reserves.push(createPlayer(Position.SNT, tmpl.targetStrength - 8));
        // ADDING 6 MORE TO REACH 30 TOTAL (11 XI + 7 SUB + 12 RES)
        reserves.push(createPlayer(Position.SLB, tmpl.targetStrength - 9));
        reserves.push(createPlayer(Position.STP, tmpl.targetStrength - 9));
        reserves.push(createPlayer(Position.OS, tmpl.targetStrength - 9));
        reserves.push(createPlayer(Position.OOS, tmpl.targetStrength - 9));
        reserves.push(createPlayer(Position.SLK, tmpl.targetStrength - 9));
        reserves.push(createPlayer(Position.SNT, tmpl.targetStrength - 9));

        const players = [gk, slb, stp1, stp2, sgb, slk, os1, os2, sgk, snt1, snt2, subGK, subDEF1, subDEF2, subMID1, subMID2, subFWD1, subFWD2, ...reserves];

        const rawStrength = calculateRawTeamStrength(players);
        const strengthDelta = tmpl.targetStrength - rawStrength;
        const totalValue = players.reduce((sum, p) => sum + p.value, 0);
        const estimatedWages = totalValue * 0.005 * 52; 

        const mainSponsor = getRandomSponsorForReputation(tmpl.baseReputation, 'main');
        const stadiumSponsor = getRandomSponsorForReputation(tmpl.baseReputation, 'stadium');
        const sleeveSponsor = getRandomSponsorForReputation(tmpl.baseReputation, 'sleeve');

        // @ts-ignore
        const presidentName = tmpl.president || `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
        
        const facLevel = Math.max(1, Math.min(20, Math.floor(tmpl.targetStrength / 5)));
        const isCupBanned = INITIAL_CUP_EXCLUDED_TEAMS.includes(tmpl.name);

        return {
            id: teamId,
            leagueId: leagueId,
            name: tmpl.name,
            colors: tmpl.colors as [string, string],
            logo: tmpl.logo,
            jersey: tmpl.jersey,
            championships: tmpl.championships,
            // @ts-ignore
            domesticCups: tmpl.cups || 0,
            // @ts-ignore
            superCups: tmpl.s_cups || 0,
            // @ts-ignore
            europeanCups: tmpl.euro_cups || 0,
            fanBase: tmpl.fans,
            stadiumName: tmpl.stadium,
            stadiumCapacity: tmpl.capacity,
            budget: tmpl.budget,
            // @ts-ignore
            initialDebt: tmpl.debt || 0,
            wageBudget: Number((estimatedWages * 1.1).toFixed(1)), 
            players,
            reputation: tmpl.baseReputation, 
            initialReputation: tmpl.baseReputation, 
            leagueHistory: tmpl.leagueHistory || [], 
            
            sponsors: {
                main: { name: mainSponsor.name, yearlyValue: mainSponsor.value, expiryYear: 2026 },
                stadium: { name: stadiumSponsor.name, yearlyValue: stadiumSponsor.value, expiryYear: 2026 },
                sleeve: { name: sleeveSponsor.name, yearlyValue: sleeveSponsor.value, expiryYear: 2026 }
            },

            board: {
                presidentName,
                expectations: tmpl.targetStrength > 80 ? 'Şampiyonluk' : tmpl.targetStrength > 75 ? 'Üst Sıralar' : 'Ligde Kalmak',
                patience: Math.floor(Math.random() * 10) + 10 
            },
            boardRequests: { 
                stadiumBuilt: false,
                trainingUpgradesCount: 0,
                youthUpgradesCount: 0,
                trainingLastRep: tmpl.baseReputation,
                youthLastRep: tmpl.baseReputation
            },
            staff: generateStaff(tmpl.baseReputation),
            facilities: {
                trainingCenterName: getFacilityName(tmpl.name, 'Training'),
                trainingLevel: facLevel,
                youthAcademyName: getFacilityName(tmpl.name, 'Youth'),
                youthLevel: Math.max(1, facLevel - 2), 
                corporateLevel: facLevel
            },

            financialRecords: {
                income: { transfers: 0, tv: 0, merch: 0, loca: 0, gate: 0, sponsor: 0 },
                expense: { wages: 0, transfers: 0, staff: 0, maint: 0, academy: 0, debt: 0, matchDay: 0, travel: 0, scouting: 0, admin: 0, bonus: 0, fines: 0 }
            },
            transferHistory: [], 
            
            formation: '4-4-2',
            mentality: Mentality.STANDARD,
            passing: PassingStyle.STANDARD,
            tempo: Tempo.STANDARD,
            width: Width.STANDARD,
            attackingTransition: AttackingTransition.STANDARD,
            creative: CreativeFreedom.STANDARD,
            setPiecePlay: SetPiecePlay.RECYCLE,
            playStrategy: PlayStrategy.STANDARD,
            goalKickType: GoalKickType.SHORT,
            gkDistributionTarget: GKDistributionTarget.CBS,
            supportRuns: SupportRuns.BALANCED,
            dribbling: Dribbling.STANDARD,
            focusArea: FocusArea.STANDARD,
            passTarget: PassTarget.STANDARD,
            patience: Patience.STANDARD,
            longShots: LongShots.STANDARD,
            crossing: CrossingType.STANDARD,
            gkDistSpeed: GKDistributionSpeed.STANDARD,
            pressingLine: PressingLine.MID,
            defLine: DefensiveLine.STANDARD,
            defLineMobility: DefLineMobility.BALANCED,
            pressIntensity: PressIntensity.STANDARD,
            defensiveTransition: DefensiveTransition.STANDARD,
            tackling: Tackling.STANDARD,
            preventCrosses: PreventCrosses.STANDARD,
            pressFocus: PressingFocus.BALANCED,
            timeWasting: TimeWasting.SOMETIMES,
            tactic: TacticStyle.BALANCED,
            attackStyle: AttackStyle.MIXED,
            pressingStyle: PressingStyle.BALANCED,

            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
            strength: tmpl.targetStrength, 
            rawStrength: rawStrength,      
            strengthDelta: strengthDelta,  
            morale: 70,
            cupBan: isCupBanned 
        };
    });

    // 2. Create European Teams (Non-Playable)
    const europeanTeams = EUROPEAN_TEAMS.map((tmpl) => {
        const teamId = generateId();
        const leagueId = 'EUROPE_LEAGUE';
        
        // Similar simplified generation for Europe
        const createPlayer = (pos: Position, strength: number) => {
            const p = generatePlayer(pos, strength, teamId, true, undefined, tmpl.name);
            p.nationality = tmpl.country === 'İngiltere' ? 'İngiltere' : tmpl.country === 'İspanya' ? 'İspanya' : tmpl.country === 'İtalya' ? 'İtalya' : tmpl.country === 'Almanya' ? 'Almanya' : tmpl.country === 'Fransa' ? 'Fransa' : 'Yabancı';
            return p;
        }

        const gk = createPlayer(Position.GK, tmpl.targetStrength);
        const slb = createPlayer(Position.SLB, tmpl.targetStrength);
        const stp1 = createPlayer(Position.STP, tmpl.targetStrength);
        const stp2 = createPlayer(Position.STP, tmpl.targetStrength);
        const sgb = createPlayer(Position.SGB, tmpl.targetStrength);
        const slk = createPlayer(Position.SLK, tmpl.targetStrength);
        const os1 = createPlayer(Position.OS, tmpl.targetStrength);
        const os2 = createPlayer(Position.OS, tmpl.targetStrength);
        const sgk = createPlayer(Position.SGK, tmpl.targetStrength);
        const snt1 = createPlayer(Position.SNT, tmpl.targetStrength);
        const snt2 = createPlayer(Position.SNT, tmpl.targetStrength);
        
        // Add reserves to reach 30 players total (11 starters + 19 reserves)
        const reserves = Array.from({length: 19}, () => createPlayer(Position.OS, tmpl.targetStrength - 5));

        const players = [gk, slb, stp1, stp2, sgb, slk, os1, os2, sgk, snt1, snt2, ...reserves];
        const rawStrength = calculateRawTeamStrength(players);
        
        return {
            id: teamId,
            leagueId: leagueId,
            name: tmpl.name,
            colors: tmpl.colors as [string, string],
            championships: 0, domesticCups: 0, superCups: 0, europeanCups: 0,
            fanBase: 10000000,
            stadiumName: `${tmpl.name} Arena`,
            stadiumCapacity: 50000,
            budget: 100,
            initialDebt: 0,
            wageBudget: 100,
            players,
            reputation: 4.5,
            initialReputation: 4.5,
            leagueHistory: [],
            sponsors: { main: { name: 'EURO', yearlyValue: 20, expiryYear: 2030 }, stadium: { name: 'Arena', yearlyValue: 10, expiryYear: 2030 }, sleeve: { name: 'Sleeve', yearlyValue: 5, expiryYear: 2030 } },
            board: { presidentName: 'CEO', expectations: 'Avrupa', patience: 20 },
            boardRequests: { stadiumBuilt: true, trainingUpgradesCount: 5, youthUpgradesCount: 5, trainingLastRep: 5, youthLastRep: 5 },
            staff: generateStaff(4.5),
            facilities: { trainingCenterName: 'Elite Center', trainingLevel: 18, youthAcademyName: 'Elite Youth', youthLevel: 18, corporateLevel: 18 },
            financialRecords: { income: {} as any, expense: {} as any },
            transferHistory: [],
            formation: '4-3-3',
            mentality: Mentality.ATTACKING,
            passing: PassingStyle.STANDARD,
            tempo: Tempo.HIGH,
            width: Width.STANDARD,
            attackingTransition: AttackingTransition.STANDARD,
            creative: CreativeFreedom.CREATIVE,
            setPiecePlay: SetPiecePlay.TRY_SCORE,
            playStrategy: PlayStrategy.STANDARD,
            goalKickType: GoalKickType.SHORT,
            gkDistributionTarget: GKDistributionTarget.CBS,
            supportRuns: SupportRuns.BALANCED,
            dribbling: Dribbling.STANDARD,
            focusArea: FocusArea.STANDARD,
            passTarget: PassTarget.STANDARD,
            patience: Patience.STANDARD,
            longShots: LongShots.STANDARD,
            crossing: CrossingType.STANDARD,
            gkDistSpeed: GKDistributionSpeed.STANDARD,
            pressingLine: PressingLine.HIGH,
            defLine: DefensiveLine.HIGH,
            defLineMobility: DefLineMobility.BALANCED,
            pressIntensity: PressIntensity.HIGH,
            defensiveTransition: DefensiveTransition.STANDARD,
            tackling: Tackling.STANDARD,
            preventCrosses: PreventCrosses.STANDARD,
            pressFocus: PressingFocus.BALANCED,
            timeWasting: TimeWasting.RARELY,
            tactic: TacticStyle.POSSESSION,
            attackStyle: AttackStyle.MIXED,
            pressingStyle: PressingStyle.HIGH_PRESS,
            stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
            strength: tmpl.targetStrength,
            rawStrength: rawStrength,
            strengthDelta: tmpl.targetStrength - rawStrength,
            morale: 80,
            cupBan: false
        };
    });

    return [...turkishTeams, ...europeanTeams];
};
