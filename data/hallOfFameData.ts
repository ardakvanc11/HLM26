
export interface LegendManager {
    name: string;
    teamsManaged: number;
    country: string;
    leagueTitles: number;
    domesticCups: number;
    europeanCups: number;
    power: number;
}

export const LEGEND_MANAGERS: LegendManager[] = [
    { name: "Alex Ferguson", teamsManaged: 3, country: "İskoçya", leagueTitles: 17, domesticCups: 14, europeanCups: 8, power: 94 },
    { name: "Carlo Ancelotti", teamsManaged: 6, country: "İtalya", leagueTitles: 5, domesticCups: 3, europeanCups: 10, power: 93 },
    { name: "Pep Guardiola", teamsManaged: 4, country: "İspanya", leagueTitles: 11, domesticCups: 9, europeanCups: 8, power: 92 },
    { name: "Luiz Felipe Scolari", teamsManaged: 11, country: "Brezilya", leagueTitles: 7, domesticCups: 9, europeanCups: 11, power: 92 },
    { name: "Giovanni Trapattoni", teamsManaged: 5, country: "İtalya", leagueTitles: 10, domesticCups: 3, europeanCups: 7, power: 91 },
    { name: "José Mourinho", teamsManaged: 6, country: "Portekiz", leagueTitles: 8, domesticCups: 8, europeanCups: 5, power: 90 },
    { name: "Zinedine Zidane", teamsManaged: 1, country: "Fransa", leagueTitles: 2, domesticCups: 0, europeanCups: 8, power: 89 },
    { name: "Marcello Lippi", teamsManaged: 3, country: "İtalya", leagueTitles: 8, domesticCups: 2, europeanCups: 4, power: 89 },
    { name: "Bob Paisley", teamsManaged: 1, country: "İngiltere", leagueTitles: 6, domesticCups: 3, europeanCups: 5, power: 88 },
    { name: "Ottmar Hitzfeld", teamsManaged: 4, country: "Almanya", leagueTitles: 9, domesticCups: 6, europeanCups: 3, power: 88 },
    { name: "Louis van Gaal", teamsManaged: 5, country: "Hollanda", leagueTitles: 7, domesticCups: 4, europeanCups: 5, power: 88 },
    { name: "Ernst Happel", teamsManaged: 6, country: "Avusturya", leagueTitles: 8, domesticCups: 6, europeanCups: 3, power: 88 },
    { name: "Helenio Herrera", teamsManaged: 4, country: "Arjantin", leagueTitles: 7, domesticCups: 3, europeanCups: 5, power: 88 },
    { name: "Bill Struth", teamsManaged: 1, country: "İskoçya", leagueTitles: 18, domesticCups: 10, europeanCups: 0, power: 87 },
    { name: "Mircea Lucescu", teamsManaged: 8, country: "Romanya", leagueTitles: 14, domesticCups: 9, europeanCups: 2, power: 87 },
    { name: "Miguel Muñoz", teamsManaged: 1, country: "İspanya", leagueTitles: 9, domesticCups: 2, europeanCups: 3, power: 87 },
    { name: "Willie Maley", teamsManaged: 1, country: "İskoçya", leagueTitles: 16, domesticCups: 14, europeanCups: 0, power: 86 },
    { name: "Jock Stein", teamsManaged: 2, country: "İskoçya", leagueTitles: 10, domesticCups: 15, europeanCups: 1, power: 85 },
    { name: "Fabio Capello", teamsManaged: 4, country: "İtalya", leagueTitles: 9, domesticCups: 0, europeanCups: 2, power: 85 },
    { name: "Arsène Wenger", teamsManaged: 3, country: "Fransa", leagueTitles: 4, domesticCups: 9, europeanCups: 0, power: 83 }
];
