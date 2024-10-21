import { Plugin } from "chart.js";
import { CHARTJS_FONT } from ".";

export interface LabelPoint {
    x: number | Date;
    y: number;
    text?: string
}

// TODO Needs a lot of tweaking.
export const LABEL_PLUGIN: Plugin = {
    id: 'labelPoint',
    afterDatasetDraw(chart, args, options) {
        const { optPoints, } = options;
        const { ctx, scales, chartArea: { left, right, top, bottom } } = chart;
        const x = scales.x, y = scales.y;
        const points: LabelPoint[] = optPoints;
        ctx.save();

        for (let pt of points) {
            const radius = 10;

            // @ts-ignore
            const px = x.getPixelForValue(pt.x);
            const py = y.getPixelForValue(pt.y);

            ctx.beginPath();
            ctx.arc(px, py, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();

            ctx.lineWidth = 6;
            ctx.strokeStyle = 'black';
            ctx.stroke();

            if (!pt.text)
                continue;

            ctx.font = `italic bold 30pt ${CHARTJS_FONT}`;
            ctx.fillStyle = 'black'

            const textMeasure = ctx.measureText(pt.text);
            const height = textMeasure.actualBoundingBoxAscent - textMeasure.actualBoundingBoxDescent;

            const positions = {
                'left': [px - radius - 8 - textMeasure.width, py + radius],
                'right': [px + radius + 8, py + radius],
                'top': [px - radius, py - radius - height + 12],
                'bottom': [px - radius - 8, py + radius + height + 8]
            }

            let maxValue = Number.MIN_VALUE, bestMatch = '';

            for (const key of Object.keys(positions)) {
                // check for out of bounds
                const pos = positions[key];

                if (pos[0] < left || pos[0] + textMeasure.width > right || pos[1] - height < top || pos[1] + height > bottom)
                    continue;

                console.log(pos, textMeasure.width, height);

                const region = ctx.getImageData(pos[0], pos[1], textMeasure.width, height);
                const clash = region.data.filter((val, index) => index % 4 > 0).reduce((p, c) => p + c);

                if (clash > maxValue) {
                    maxValue = clash
                    bestMatch = key;
                }
            }

            console.log(bestMatch);
            if (bestMatch == '') {
                console.log("Found no best match, defaulting to left position")
                bestMatch = 'left';
            }
            const bestPos = positions[bestMatch];

            ctx.fillText(pt.text, bestPos[0], bestPos[1]);
        }

        ctx.restore();
    }
}