import nodeHtmlToImage from 'node-html-to-image';
import { getRatingColorHex } from '$src/codeforces/range';
import { CF_RATING_RANGE } from '$src/codeforces/range';

interface TableConfig {
    head: string[];
    colWidths: number[];
    style?: {
        head?: string[];
        border?: string[];
        padding?: number;
    };
    colorColumns?: number[]; // Indices of columns that should have rating colors
}

export class DynamicImageTable {
    private readonly ROW_HEIGHT = 40;
    private readonly HEADER_HEIGHT = 50;
    private readonly PADDING = 10;
    private readonly FONT_SIZE = 28;
    private readonly HEADER_FONT_SIZE = 35;
    private readonly FONT_FAMILY = 'Arial';
    private readonly CANVAS_WIDTH = 1920;
    private readonly CANVAS_HEIGHT = 1080;
    
    private readonly ROWS_PER_IMAGE = Math.floor((this.CANVAS_HEIGHT - this.HEADER_HEIGHT - this.PADDING * 2) / this.ROW_HEIGHT);

    constructor(private data: string[][], private config: TableConfig) {}

    private getRatingColor(rating: number): string {
        return getRatingColorHex(rating);
    }

    async generateImages(): Promise<Buffer[]> {
        const chunks = this.chunkArray(this.data, this.ROWS_PER_IMAGE);
        const imagePromises = chunks.map(chunk => this.createTableImage(chunk));
        return Promise.all(imagePromises);
    }

    private async createTableImage(rows: string[][]): Promise<Buffer> {
        const colorColumns = this.config.colorColumns || [];
        
        const html = `
            <html>
                <head>
                    <style>
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            font-family: ${this.FONT_FAMILY}, sans-serif;
                        }
                        th, td {
                            border: 1px solid #e0e0e0;
                            padding: ${this.PADDING}px;
                            text-align: center;
                            font-size: ${this.FONT_SIZE}px;
                        }
                        th {
                            background-color: #f0f0f0;
                            font-size: ${this.HEADER_FONT_SIZE}px;
                            font-weight: bold;
                        }
                        tr:nth-child(even) {
                            background-color: #f8f8f8;
                        }
                        ${CF_RATING_RANGE.map(range => `
                            .rating-${range.start} {
                                color: ${range.color};
                                font-weight: bold;
                            }
                        `).join('\n')}
                    </style>
                </head>
                <body>
                    <table>
                        <thead>
                            <tr>
                                ${this.config.head.map(header => `<th>${header}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(row => `
                                <tr>
                                    ${row.map((cell, colIndex) => {
                                        if (colorColumns.includes(colIndex)) {
                                            const rating = parseInt(cell);
                                            if (!isNaN(rating)) {
                                                const bestRange = CF_RATING_RANGE.slice().reverse().find(r => rating >= r.start);
                                                const ratingClass = bestRange ? bestRange.start : 0;
                                                return `<td class="rating-${ratingClass}">${cell}</td>`;
                                            }
                                        }
                                        return `<td>${cell}</td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
        
        const imageBuffer = await nodeHtmlToImage({
            html,
            puppeteerArgs: { 
                defaultViewport: { width: this.CANVAS_WIDTH, height: this.CANVAS_HEIGHT }
            }
        });
        
        return Buffer.from(imageBuffer);
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
}

// Example usage:
export async function createDynamicImages(data: string[][], config: TableConfig): Promise<Buffer[]> {
    const tableGenerator = new DynamicImageTable(data, config);
    return tableGenerator.generateImages();
}