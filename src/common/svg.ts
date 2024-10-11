
type TableRow = (string | number)[];
interface TableProps {
    hasHeader?: boolean;
    columnWidths?: number[]
}

export function generateTableSVG(tableData: TableRow[], { hasHeader, columnWidths }: TableProps) {
    const cellWidth = 100;
    const cellHeight = 50;
    const tableWidth = tableData[0].length * cellWidth;
    const tableHeight = tableData.length * cellHeight;

    if (!columnWidths)
        columnWidths = Array.from({ length: tableData[0].length }).fill(8) as number[];

    let svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${tableWidth}" height="${tableHeight}">
      <style>
        .header { fill: #ffcc99; font: 16px sans-serif; }
        .cell { fill: #fff0e6; font: 16px sans-serif; }
        .text { fill: black; font: 16px sans-serif; text-anchor: middle; alignment-baseline: middle; }
        .border { fill: none; stroke: black; stroke-width: 1; }
      </style>
    <rect x="0" y="0" width="${tableWidth}" height="8" class="header" />`;
    
    for (let row = 0; row < tableData.length; row++) {
        for (let col = 0; col < tableData[row].length; col++) {
            const x = col * columnWidths[col];
            const y = row * cellHeight + 8;
            const rectClass = row === 0 && hasHeader ? 'header' : 'cell';
            const text = tableData[row][col];
            svgContent += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" class="${rectClass}" />`;
            svgContent += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" class="border" />`;
            svgContent += `<text x="${x + cellWidth / 2}" y="${y + cellHeight / 2}" class="text">${text}</text>`;
        }
    }

    svgContent += `</svg>`;

    const svgDataURL = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    return svgDataURL;
}