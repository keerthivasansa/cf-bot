

export const CF_RATING_RANGE = [
    { color: '#cccccc', start: 0 },
    { color: '#77ff77', start: 1200 },
    { color: '#77ddbb', start: 1400 },
    { color: '#aaaaff', start: 1600 },
    { color: '#ff88ff', start: 1900 },
    { color: '#ffcc88', start: 2100 },
    { color: '#ffbb55', start: 2300 },
    { color: '#ff7777', start: 2400 },
    { color: '#ff7777', start: 2600 },
    { color: '#aa0000', start: 3000 },
]

export function getRatingColor(value: number) {
    let color = 0;

    for (let i = 0; i < CF_RATING_RANGE.length; i++) {
        if (CF_RATING_RANGE[i].start > value)
            break;
        color = parseInt(CF_RATING_RANGE[i].color.slice(1), 16);
    }

    return color;
}