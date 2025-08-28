import { QRCode } from 'qrcode.react'; // Reverting to named import
import ReactDOMServer from 'react-dom/server';
import React from 'react';

/**
 * Generates an SVG string for a QR code.
 * @param value The data to encode in the QR code.
 * @param size The size of the QR code in pixels (default: 128).
 * @returns A promise that resolves with the SVG string of the QR code.
 */
export const generateQrCodeSvg = (value: string, size: number = 128): string => {
  if (!value) {
    throw new Error("Value for QR code cannot be empty.");
  }

  // Render the QRCode component to a static SVG string
  const svgString = ReactDOMServer.renderToStaticMarkup(
    <QRCode value={value} size={size} renderAs="svg" level="L" />
  );

  return svgString;
};