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

export const formatRating = (rating: number, maxWidth: number): string => {
    const emoji = getEmojiForRating(rating);
    const ratingString = rating.toString();

    return wrapText(`${emoji} ${ratingString}`, maxWidth);
};