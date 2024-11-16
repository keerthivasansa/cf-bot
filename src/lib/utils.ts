export function randomInRange(start: number, end: number): number {
    return Math.floor(Math.random() * (end - start)) + start;
}

export const wrapText = (text: string, maxWidth: number): string => {
    const words = text.split(' ');
    let line = '';
    let result = '';

    for (const word of words) {
        if ((line + word).length > maxWidth) {
            result += line.trim() + '\n';
            line = word + ' ';
        } else {
            line += word + ' ';
        }
    }

    result += line.trim();
    return result;
};

// ANSI color codes updated for better brightness and visibility
const colorCodes = {
    newbie: '',                       // No color - white
    pupil: '\x1b[32m',                // Green
    specialist: '\x1b[36m',           // Cyan
    expert: '\x1b[34m',               // Blue
    candidateMaster: '\x1b[35m',      // Magenta
    master: '\x1b[33m',               // Yellow
    internationalMaster: '\x1b[33m',  // Yellow
    grandmaster: '\x1b[31m',          // Red
    internationalGrandmaster: '\x1b[31m', // Red
    legendaryGrandmaster: '\x1b[37m', // White for high contrast
    reset: '\x1b[0m'                  // Reset color
};

export const formatRating = (rating: number, maxWidth: number): string => {
    let color: string;

    if (rating < 1200) color = colorCodes.newbie;
    else if (rating < 1400) color = colorCodes.pupil;
    else if (rating < 1600) color = colorCodes.specialist;
    else if (rating < 1900) color = colorCodes.expert;
    else if (rating < 2100) color = colorCodes.candidateMaster;
    else if (rating < 2300) color = colorCodes.master;
    else if (rating < 2400) color = colorCodes.internationalMaster;
    else if (rating < 2600) color = colorCodes.grandmaster;
    else if (rating < 3000) color = colorCodes.internationalGrandmaster;
    else color = colorCodes.legendaryGrandmaster;

    const ratingString = `${color}${rating}${colorCodes.reset}`;
    return wrapText(ratingString, maxWidth);
};
