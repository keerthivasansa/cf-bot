export function randomInRange(start: number, end: number) {
    return Math.floor(Math.random() * (end - start)) + start;
}

export const wrapText = (text: string, maxWidth: number): string => {
    const words = text.split(' ');
    let line = '';
    let result = '';
    for (let word of words) {
        if (line.length + word.length > maxWidth) {
            result += line + '\n';
            line = word + ' ';
        } else {
            line += word + ' ';
        }
    }
    result += line.trim();
    return result;
};

export const getEmojiForRating = (rating: number): string => {
    if (rating < 1200) return "🔘";
    if (rating < 1400) return "🟢";
    if (rating < 1600) return "🩵";
    if (rating < 1900) return "🔵";
    if (rating < 2100) return "🟣";
    if (rating < 2300) return "🟡";
    if (rating < 2400) return "🟠";
    if (rating < 2600) return "🔴";
    if (rating < 3000) return "🔥";
    if (rating < 3500) return "✨";
    return "👑";
};

const colorCodes = {
    newbie: "\u001b[37m", // White
    pupil: "\u001b[32m", // Green
    specialist: "\u001b[36m", // Cyan
    expert: "\u001b[34m", // Blue
    candidateMaster: "\u001b[35m", // Purple
    master: "\u001b[33m", // Yellow
    internationalMaster: "\u001b[33;1m", // Bright Yellow
    grandmaster: "\u001b[31m", // Red
    internationalGrandmaster: "\u001b[31;1m", // Bright Red
    legendaryGrandmaster: "\u001b[31;1m", // Bright Red (same for highest ranks)
    reset: "\u001b[0m" // Reset color
};

export const formatRating = (rating: number, maxWidth: number): string => {
    let color;
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

    const emoji = getEmojiForRating(rating);
    const ratingString = `${emoji} ${rating}`;
    
    return wrapText(`${color}${ratingString}${colorCodes.reset}`, maxWidth);
};