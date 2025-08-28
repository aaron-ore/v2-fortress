import * as QRCodeModule from 'qrcode.react'; // Importing as a namespace
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

  // Render the QRCode component from the default property of the namespace
  // This handles cases where the component is exported as a default export
  const QRCodeComponent = (QRCodeModule as any).default || QRCodeModule;

  if (typeof QRCodeComponent !== 'function' && typeof QRCodeComponent !== 'string') {
    console.error("QRCodeComponent is not a valid React component type:", QRCodeComponent);
    throw new Error("Failed to resolve QRCode component from 'qrcode.react'. It might be an import issue or the package structure is unexpected.");
  }

  const svgString = ReactDOMServer.renderToStaticMarkup(
    <QRCodeComponent value={value} size={size} renderAs="svg" level="L" />
  );

  return svgString;
};