import nodeHtmlToImage from 'node-html-to-image';

interface TableConfig {
    head: string[];
    colWidths: number[];
    style?: {
        head?: string[];
        border?: string[];
        padding?: number;
    };
}

export class DynamicImageTable {
    private readonly ROW_HEIGHT = 40;
    private readonly HEADER_HEIGHT = 50;
    private readonly PADDING = 10;
    private readonly FONT_SIZE = 28; // Increased from 16 to 18
    private readonly HEADER_FONT_SIZE = 35; // Increased from 18 to 20
    private readonly FONT_FAMILY = 'Arial';
    private readonly CANVAS_WIDTH = 1920;
    private readonly CANVAS_HEIGHT = 1080;
    
    private readonly ROWS_PER_IMAGE = Math.floor((this.CANVAS_HEIGHT - this.HEADER_HEIGHT - this.PADDING * 2) / this.ROW_HEIGHT); // Changed from 10 to dynamic calculation
    constructor(private data: string[][], private config: TableConfig) {}

    async generateImages(): Promise<Buffer[]> {
        const chunks = this.chunkArray(this.data, this.ROWS_PER_IMAGE);
        const imagePromises = chunks.map(chunk => this.createTableImage(chunk));
        return Promise.all(imagePromises);
    }

    private async createTableImage(rows: string[][]): Promise<Buffer> {
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
                        }
                        tr:nth-child(even) {
                            background-color: #f8f8f8;
                        }
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
                                    ${row.map(cell => `<td>${cell}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
        
        const imageBuffer = await nodeHtmlToImage({
            html,
            puppeteerArgs: { defaultViewport: { width: 1920, height: 1080 } }
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

// Usage example:
export async function createDynamicImages(data: string[][], config: TableConfig): Promise<Buffer[]> {
    const tableGenerator = new DynamicImageTable(data, config);
    return tableGenerator.generateImages();
}