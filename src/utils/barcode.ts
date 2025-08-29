// src/utils/barcode.ts

/**
 * Generates a simple SVG barcode data URI for a given SKU.
 * This is a very basic representation and not a full-fledged barcode standard (like EAN-13 or Code 128).
 * It's primarily for visual representation and basic scanning of the SKU string.
 *
 * @param sku The SKU string to encode in the barcode.
 * @returns A data URI string for an SVG image of the barcode.
 */
export const generateBarcodeSvgDataUri = (sku: string): string => {
  if (!sku) {
    return '';
  }

  const barWidth = 2; // Width of each bar
  const barHeight = 50; // Height of the bars
  const textHeight = 20; // Height for the text below the bars
  const padding = 25; // Padding on left/right for bars, and top/bottom for text

  // Simple logic: alternate black and white bars based on SKU characters
  // This is NOT a standard barcode encoding, just a visual representation
  const numBars = sku.length * 3; // Example: 3 bars per character for visual variety
  const svgWidth = numBars * barWidth + (padding * 2);
  const totalHeight = barHeight + textHeight + (padding / 2); // Add some space for text

  const svg = `
    <svg width="${svgWidth}" height="${totalHeight}" viewBox="0 0 ${svgWidth} ${totalHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${svgWidth}" height="${totalHeight}" fill="white" />
      ${Array.from({ length: numBars }, (_, i) => i)
        .map(
          (i) => `<rect x="${i * barWidth + padding}" y="0" width="${barWidth}" height="${barHeight}" fill="${i % 2 === 0 ? 'black' : 'white'}" />`
        )
        .join('')}
      <text x="${svgWidth / 2}" y="${barHeight + textHeight - (padding / 4)}" fill="black" text-anchor="middle" font-family="monospace" font-size="14">${sku}</text>
    </svg>
  `;

  const svgBase64 = btoa(svg);
  return `data:image/svg+xml;base64,${svgBase64}`;
};