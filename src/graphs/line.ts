import { Canvas, createCanvas } from '@napi-rs/canvas';
import type { ChartConfiguration } from 'chart.js/auto';
import type { AnnotationOptions } from 'chartjs-plugin-annotation';
import type { RangeType } from './plugins';
import { Chart } from './plugins';

export class CFLineChart {
    private SCALE_FACTOR = 3;
    private LABEL_OFFSET = this._scale(20);
    private FONT_SIZE = this._scale(14);

    private annotations: Record<string, AnnotationOptions>;
    private plugins: Record<string, Record<string, any>>;
    private config: ChartConfiguration;
    private canvas: Canvas;
    private data: number[];
    private DATA_OFFSET: number;

    constructor(data: number[]) {
        this.annotations = {};
        this.plugins = {};
        this.data = data;
        this.DATA_OFFSET = (Math.max(...this.data) - Math.min(...this.data)) / 1000;


        const xLabels = Array.from({ length: this.data.length }).map((_, i) => (i + 1).toString());

        this.config = {
            type: "line",
            data: {
                xLabels,
                datasets: [{
                    data: this.data,
                    borderWidth: this._scale(2),
                    borderColor: "black",
                    pointBorderColor: 'black',
                    pointBackgroundColor: 'white',
                    pointBorderWidth: this._scale(2),
                    pointRadius: this._scale(3),
                }]
            },
            options: {
                layout: {
                    padding: {
                        left: this._scale(10),
                        bottom: this._scale(10),
                        top: this._scale(10),
                        right: 0,
                    }
                },
                elements: {
                    point: {
                        backgroundColor: "white",
                        borderColor: "black",
                        pointStyle: "circle",
                    }
                },
                scales: {
                    x: {
                        offset: true,
                        ticks: {
                            font: {
                                size: this.FONT_SIZE
                            },
                        }
                    },
                    y: {
                        offset: true,
                        ticks: {
                            font: {
                                size: this.FONT_SIZE
                            },

                        }
                    }
                },
                font: {
                    size: this.FONT_SIZE,
                },
                devicePixelRatio: 1,
                responsive: false,
                maintainAspectRatio: false
            },
        };
        this.plugins['legend'] = {
            display: false,
        }
    }

    private _scale(val: number) {
        return val * this.SCALE_FACTOR;
    }

    setRangeBackground(rangeType: RangeType) {
        this.plugins['rangedBackground'] = {
            rangeType,
            offset: this._scale(20),
        }
        return this;
    }

    addLabel(text: string, x: number, y: number) {
        const index = Object.keys(this.annotations).length;
        this.annotations[`point${index}`] = {
            type: "label",
            content: [text],
            xValue: x,
            yValue: y + this.DATA_OFFSET * this.LABEL_OFFSET,
            font: {
                weight: "bold",
                style: "italic"
            },
            adjustScaleRange: true,
        }
        return this;
    }

    labelPoint(index: number) {
        if (index >= this.data.length || index < 0)
            throw new Error(`Invalid index, expected value from 0 to ${this.data.length - 1}`);

        const val = this.data[index];

        this.addLabel(val.toString(), index, val);
        return this;
    }

    labelMaxPoint() {
        let mx = 0, mxVal = 0;
        for (let i = 0; i < this.data.length; i++)
            if (this.data[i] > mxVal) {
                mxVal = this.data[i];
                mx = i;
            }

        this.labelPoint(mx);
        return this;
    }

    build() {
        this.plugins['annotation'] = { annotations: this.annotations };
        this.config['options']['plugins'] = this.plugins;
        console.log(this.plugins);

        const canvas = createCanvas(1920, 1080);
        console.log({ width: canvas.width, height: canvas.height });

        const ctx = canvas.getContext('2d');
        //@ts-ignore
        const chart = new Chart(ctx, this.config);

        this.canvas = canvas;
        return this;
    }

    toPNG() {
        if (!this.canvas)
            throw new Error("Chart not built yet");
        const png = this.canvas.toBuffer("image/png");
        return png;
    }

    toDataURL() {
        if (!this.canvas)
            throw new Error("Chart not built yet");
        const png = this.canvas.toDataURL();
        return png;
    }
}
