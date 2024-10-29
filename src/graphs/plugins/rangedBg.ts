import { CF_RATING_RANGE } from "$src/codeforces/range";
import { Chart } from "chart.js";

interface RangeTypeI {
    type: 'horizontal' | 'vertical',
    ranges: { color: string, start: number }[];
}

const rangeTypes: Record<any, RangeTypeI> = {
    RATING: {
        type: 'vertical',
        ranges: CF_RATING_RANGE.toReversed()
    },
    RATING_HORIZONTAL: {
        type: 'horizontal',
        ranges: CF_RATING_RANGE
    }
};

export type RangeType = 'RATING' | 'RATING_HORIZONTAL';


export const PLUGIN_RANGED_FILL = {
    id: 'rangedBackground',
    beforeDraw: (chart: Chart, args, options) => {
        const { ctx, chartArea: { left, right, top, bottom }, scales } = chart;
        const { rangeType, offset } = options;

        ctx.save();
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();

        if (!rangeType || !offset)
            return;

        const bgRange = rangeTypes[rangeType];
        const { x, y } = scales;
        let min: number, max: number;

        if (bgRange.type === 'vertical') {
            min = y.getValueForPixel(bottom);
            max = y.getValueForPixel(top);
        } else {
            min = x.getValueForPixel(left);
            max = x.getValueForPixel(right);
        }

        const innerWidth = right - left;
        const innerHeight = bottom - top;

        ctx.save();
        const fullArea = bgRange.type === 'horizontal' ? innerWidth : innerHeight;
        const conv = fullArea / (max - min);
        let curr = 0, prevEnd = max;

        for (let i = 0; i < bgRange.ranges.length; i++) {
            const range = bgRange.ranges[i];
            if (range.start > max)
                continue;
            ctx.fillStyle = range.color;

            let blockSize = 0;
            if (bgRange.type === 'vertical') {
                const prevPixel = y.getPixelForValue(prevEnd);
                const start = Math.max(range.start, min);
                const currPixel = y.getPixelForValue(start);
                const blockSize = Math.max(0, currPixel - prevPixel);
                console.log({ blockSize, currPixel, prevPixel, prevEnd, min, max });
                ctx.fillRect(left, prevPixel, innerWidth, blockSize);
                prevEnd = start;
            }
            else {
                if (i < bgRange.ranges.length - 1)
                    blockSize = bgRange.ranges[i + 1].start - range.start;
                else
                    blockSize = max - range.start;
                blockSize *= conv;
                ctx.fillRect(curr + left, top, blockSize, innerHeight);
            }
            curr += blockSize;
        }

        ctx.restore();
    }
};
