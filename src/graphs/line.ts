import { Canvas, createCanvas } from '@napi-rs/canvas';
import type { ChartConfiguration } from 'chart.js/auto';
import type { AnnotationOptions } from 'chartjs-plugin-annotation';
import type { RangeType } from './plugins';
import { Chart } from './plugins';

export class CFLineChart<KeyType> {
    private SCALE_FACTOR = 3;
    private LABEL_OFFSET = this._scale(20);
    private FONT_SIZE = this._scale(14);

    private annotations: Record<string, AnnotationOptions>;
    private plugins: Record<string, Record<string, any>>;
    private config: ChartConfiguration;
    private canvas: Canvas;
    private data: Map<KeyType, number>;
    private DATA_OFFSET: number;

    constructor(data: Map<KeyType, number>) {
        this.annotations = {};
        this.plugins = {};
        this.data = data;

        const values = Array.from(this.data.values());
        const labels = Array.from(this.data.keys());

        this.DATA_OFFSET = (Math.max(...values) - Math.min(...values)) / 1000;

        this.config = {
            type: "line",
            data: {
                xLabels: labels,
                datasets: [{
                    data: values,
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
                        type: 'time',
                        time: {
                            unit: 'month',
                            displayFormats: {
                                'month': 'MMM'
                            }
                        },
                        offset: true,
                        ticks: {
                            font: {
                                size: this.FONT_SIZE
                            },
                            autoSkip: true,
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

    addLabel(text: string, x: KeyType, y: number) {
        const index = Object.keys(this.annotations).length;
        this.annotations[`point${index}`] = {
            type: "label",
            content: [text],
            // @ts-ignore
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

    labelPoint(index: KeyType) {
        const val = this.data.get(index);
        this.addLabel(val.toString(), index, val);
        return this;
    }

    labelMaxPoint() {
        let mx: KeyType;
        let mxVal = 0;

        for (const [key, value] of this.data.entries()) {
            if (value > mxVal) {
                mxVal = mxVal;
                mx = key;
            }
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
