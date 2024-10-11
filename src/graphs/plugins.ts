import { Chart } from "chart.js/auto";
import Annotation from "chartjs-plugin-annotation";

interface RangeTypeI {
    type: 'horizontal' | 'vertical',
    ranges: { color: string, start: number }[];
}

const rangeTypes: Record<any, RangeTypeI> = {
    RATING: {
        type: 'vertical',
        ranges: [
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
    }
};

export type RangeType = 'RATING';


export const PLUGIN_RANGED_FILL = {
    id: 'rangedBackground',
    beforeDraw: (chart, args, options) => {
        const { ctx, chartArea: { left, right, top, bottom } } = chart;
        const yScale = chart.scales.y;
        const { rangeType, offset } = options;

        let minY, maxY;
        if (yScale) {
            minY = yScale.min - offset;
            maxY = yScale.max + offset;
        } else
            throw new Error("Y Scale doesn't exist");

        const bgRange = rangeTypes[rangeType];

        ctx.save();
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();

        const innerWidth = right - left;
        const innerHeight = bottom - top;

        ctx.save();
        const conv = innerHeight / (maxY - minY);
        let curr = 0, prevEnd = maxY;

        for (let i = bgRange.ranges.length - 1; i >= 0; i--) {
            const range = bgRange.ranges[i];
            if (range.start > maxY)
                continue;
            ctx.fillStyle = range.color;
            const currBlockHeight = (prevEnd - Math.max(range.start, minY)) * conv;
            ctx.fillRect(left, curr + top, innerWidth, currBlockHeight);
            curr += currBlockHeight;
            prevEnd = range.start;
        }

        ctx.restore();
    }
};

// Register plugins
Chart.register(PLUGIN_RANGED_FILL, Annotation);

export { Chart };