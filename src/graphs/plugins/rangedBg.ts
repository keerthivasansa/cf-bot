import { Chart } from "chart.js/auto";
import Annotation from "chartjs-plugin-annotation";
import 'chartjs-adapter-date-fns';
import { CF_RATING_RANGE } from "$src/codeforces/range";
import { LABEL_PLUGIN } from "./label";

interface RangeTypeI {
    type: 'horizontal' | 'vertical',
    ranges: { color: string, start: number }[];
}

const rangeTypes: Record<any, RangeTypeI> = {
    RATING: {
        type: 'vertical',
        ranges: CF_RATING_RANGE
    },
    RATING_HORIZONTAL: {
        type: 'horizontal',
        ranges: [...CF_RATING_RANGE]
    }
};

export type RangeType = 'RATING' | 'RATING_HORIZONTAL';


export const PLUGIN_RANGED_FILL = {
    id: 'rangedBackground',
    beforeDraw: (chart, args, options) => {
        const { ctx, chartArea: { left, right, top, bottom } } = chart;
        const { rangeType, offset } = options;

        ctx.save();
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();

        if (!rangeType || !offset)
            return;

        const bgRange = rangeTypes[rangeType];
        let min: number, max: number;
        const scale = bgRange.type == 'horizontal' ? chart.scales.x : chart.scales.y;

        if (scale) {
            min = Math.max(0, scale.min - offset);
            max = scale.max + offset;
        } else
            throw new Error("Y Scale doesn't exist");

        const innerWidth = right - left;
        const innerHeight = bottom - top;

        ctx.save();
        const fullArea = bgRange.type === 'horizontal' ? innerWidth : innerHeight;
        const conv = fullArea / (max - min);
        let curr = 0, prevEnd = bgRange.type === 'horizontal' ? min : max;

        for (let i = 0; i < bgRange.ranges.length; i++) {
            const range = bgRange.ranges[i];
            if (range.start > max || range.start < min)
                continue;
            ctx.fillStyle = range.color;

            let blockSize = 0;
            if (bgRange.type === 'vertical') {
                blockSize = (prevEnd - Math.max(range.start, min)) * conv;
                ctx.fillRect(left, curr + top, innerWidth, blockSize);
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
            prevEnd = range.start;
        }

        ctx.restore();
    }
};
