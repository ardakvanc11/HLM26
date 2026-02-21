
// Replaces placeholders like {player} with values from data object
export const fillTemplate = (template: string, data: Record<string, string>) => {
    return template.replace(/{(\w+)}/g, (_, k) => data[k] || `{${k}}`);
};

// Pick random item from array
export const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
