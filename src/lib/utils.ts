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

const colorCodes = {
    newbie: "\u001b[90m", // Gray
    pupil: "\u001b[32m", // Green
    specialist: "\u001b[36m", // Cyan
    expert: "\u001b[34m", // Blue
    candidateMaster: "\u001b[35m", // Purple
    master: "\u001b[33m", // Orange (Yellow works as an approximation)
    internationalMaster: "\u001b[93m", // Bright Yellow
    grandmaster: "\u001b[31m", // Red
    internationalGrandmaster: "\u001b[91m", // Bright Red
    legendaryGrandmaster: "\u001b[91m", // Bright Red (same for highest ranks)
    reset: "\u001b[0m" // Reset color
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
