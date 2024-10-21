export function generateTableSVG(tableData, { hasHeader, columnWidths }) {
    // Set initial values
    const cellHeight = 50;
    let totalWidth = 0;
    const rows = tableData.length;


    const columnWidthsCalculated = columnWidths || tableData[0].map((_, colIndex) => {
        return Math.max(...tableData.map(row => {
            const contentWidth = row[colIndex].length * 16;
            return contentWidth + 20; // Adding padding
        }));
    });

    // Calculate total table width
    totalWidth = columnWidthsCalculated.reduce((acc, width) => acc + width, 0);

    // Create SVG string
    let svgContent = `<svg width="${totalWidth}" height="${rows * cellHeight + (hasHeader ? cellHeight : 0)}" xmlns="http://www.w3.org/2000/svg">`;

    // Add header row if applicable
    if (hasHeader) {
        svgContent += `<rect x="0" y="0" width="${totalWidth}" height="${cellHeight}" fill="#f0f0f0" stroke="#000"/>`;
        tableData[0].forEach((header, colIndex) => {
            const x = columnWidthsCalculated.slice(0, colIndex).reduce((acc, width) => acc + width, 0);
            svgContent += `<text x="${x + 10}" y="25" fill="#000">${header}</text>`;
        });
    }

    // Add table rows
    for (let rowIndex = hasHeader ? 1 : 0; rowIndex < rows; rowIndex++) {
        const y = rowIndex * cellHeight + (hasHeader ? cellHeight : 0);
        svgContent += `<rect x="0" y="${y}" width="${totalWidth}" height="${cellHeight}" stroke="#000"/>`;

        tableData[rowIndex].forEach((cell, colIndex) => {
            const x = columnWidthsCalculated.slice(0, colIndex).reduce((acc, width) => acc + width, 0);
            svgContent += `<text x="${x + 10}" y="${y + 30}">${cell}</text>`;
        });
    }

    svgContent += '</svg>';
    return svgContent;
    // const imgurl = Buffer.from(svgContent).toString('base64url');
    // return `data:image/svg+xml;base64,${imgurl}`;
}
