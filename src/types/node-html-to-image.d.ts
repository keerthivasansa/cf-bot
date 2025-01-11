declare module 'node-html-to-image' {
    interface Options {
        html: string;
        output?: string;
        content?: Record<string, any>;
        puppeteerArgs?: {
            defaultViewport?: {
                width: number;
                height: number;
            };
            [key: string]: any;
        };
    }

    function nodeHtmlToImage(options: Options): Promise<Buffer>;

    export default nodeHtmlToImage;
}