import { Canvas, createCanvas } from '@napi-rs/canvas';
import { Chart } from './plugins'
import type { ChartConfiguration } from 'chart.js/auto';
import type { AnnotationOptions } from 'chartjs-plugin-annotation';
import type { RangeType } from './plugins/rangedBg';

export class CFLineChart<KeyType> {
    private SCALE_FACTOR = 3;
    private FONT_SIZE = this._scale(14);

    private annotations: Record<string, AnnotationOptions>;
    private plugins: Record<string, Record<string, any>>;
    private config: ChartConfiguration;
    private canvas: Canvas;
    private data: Map<KeyType, number>;

    constructor(data: Map<KeyType, number>) {
        this.annotations = {};
        this.plugins = {};
        this.data = data;

        const values = Array.from(this.data.values());
        const labels = Array.from(this.data.keys());

        let lbl: string[];
        if (!(labels[0] instanceof Date))
            lbl = labels.map(l => l.toString());

        this.config = {
            type: "line",
            data: {
                xLabels: lbl ? lbl : labels,
                datasets: [{
                    data: values,
                    borderWidth: this._scale(2),
                    borderColor: "black",
                    pointBorderWidth: 0,
                    pointBackgroundColor: "black"
                }]
            },
            options: {
                layout: {
                    padding: this._scale(10)
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
                        ticks: {
                            font: {
                                size: this.FONT_SIZE
                            },
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                size: this.FONT_SIZE
                            }
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
        if (labels[0] instanceof Date) {
            console.log("Found Date keys - using time for x axis")
            this.config['options']['scales']['x'].type = 'time';
            this.config['options']['scales']['x']['time'] = {
                unit: 'month',
                displayFormats: {
                    'month': 'MMM'
                }
            };
        } else
            this.config['options']['scales']['x'].type = 'linear';

        this.plugins['legend'] = {
            display: false,
        }

        this.plugins['labelPoint'] = {
            optPoints: []
        }
    }

    private _scale(val: number) {
        return val * this.SCALE_FACTOR;
    }

    setXTicksStepSize(step: number) {
        this.config['options']['scales']['x']['ticks']['stepSize'] = step;
        return this;
    }

    private setAxisLabel(axis: string, label: string) {
        const ax = this.config.options.scales[axis];
        ax.ticks.padding = this._scale(20);
        ax['title'] = {
            display: true,
            text: label,
            font: {
                size: this.FONT_SIZE,
            }
        }
    }

    setXLabel(label: string) {
        this.setAxisLabel('x', label);
        return this;
    }

    setYLabel(label: string) {
        this.setAxisLabel('y', label);
        return this;
    }

    markPoints() {
        for (const [key, val] of this.data)
            this.plugins['labelPoint']['optPoints'].push({
                x: key,
                y: val
            })
        return this;
    }

    showPoints() {
        Object.assign(this.config['data']['datasets'][0], {
            pointBorderColor: 'black',
            pointBackgroundColor: 'white',
            pointBorderWidth: this._scale(2),
            pointRadius: this._scale(3),
        })
        return this;
    }

    addOffsetToChart() {
        this.config['options']['scales']['x']['offset'] = true;
        this.config['options']['scales']['y']['offset'] = true;
        return this;
    }

    setRangeBackground(rangeType: RangeType) {
        this.plugins['rangedBackground'] = {
            rangeType,
            offset: this._scale(8),
        }
        return this;
    }

    addLabel(x: KeyType) {
        const val = this.data.get(x);
        console.log("adding label for index", x, val);
        const point = {
            x,
            y: val,
            text: val.toString(),
        }
        this.plugins['labelPoint']['optPoints'].push(point);
        return this;
    }

    labelMaxPoint() {
        let mx: KeyType;
        let mxVal = 0;

        for (const [key, value] of this.data.entries()) {
            console.log(key, value);
            if (value > mxVal) {
                mxVal = value;
                mx = key;
            }
        }
        console.log({ mx, mxVal });

        this.addLabel(mx);
        return this;
    }

    labelLastPoint() {
        const lastKey = Array.from(this.data.keys())[this.data.size - 1];
        const lastValue = this.data.get(lastKey);
        const maxValue = Math.max(...this.data.values());
        
        if (lastValue !== maxValue) {
            this.addLabel(lastKey);
        }
        
        return this;
    }

    build() {
        this.plugins['annotation'] = { annotations: this.annotations };
        this.config['options']['plugins'] = this.plugins;
        console.log(this.plugins);

        const canvas = createCanvas(1920, 1080);
        console.log({ width: canvas.width, height: canvas.height });

        const ctx = canvas.getContext('2d');
        console.log(this.config.options.scales.x.ticks)
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
        const url = this.canvas.toDataURL();
        return url;
    }
}
