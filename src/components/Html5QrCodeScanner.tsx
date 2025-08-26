import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { showError } from '@/utils/toast';

interface Html5QrCodeScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
  onReady: () => void; // New prop to signal when camera is ready
  facingMode: "user" | "environment";
}

const Html5QrCodeScanner: React.FC<Html5QrCodeScannerProps> = ({ onScan, onError, onReady, facingMode }) => {
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const html5QrcodeScannerInstanceRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!scannerContainerRef.current) {
      return; // Wait for the div to be mounted
    }

    const qrcodeRegionId = scannerContainerRef.current.id;

    // Ensure any previous scanner instance is stopped before creating a new one
    if (html5QrcodeScannerInstanceRef.current) {
      html5QrcodeScannerInstanceRef.current.stop().catch(e => console.warn("Error stopping previous scanner:", e));
      html5QrcodeScannerInstanceRef.current = null;
    }

    const html5QrcodeScanner = new Html5QrcodeScanner(
      qrcodeRegionId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        disableFlip: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
      },
      /* verbose= */ false
    );
    html5QrcodeScannerInstanceRef.current = html5QrcodeScanner;

    const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
      // Pause the scanner to prevent multiple scans after a successful read
      html5QrcodeScanner.pause();
      onScan(decodedText);
    };

    const qrCodeErrorCallback = (errorMessage: string) => {
      // This callback is called continuously, only log/show error if it's a critical failure
      // console.warn("QR Code Scan Error:", errorMessage);
    };

    html5QrcodeScanner.start(
      { facingMode: facingMode },
      qrCodeSuccessCallback,
      qrCodeErrorCallback
    ).then(() => {
      onReady(); // Signal that the camera has started successfully
    }).catch((err: any) => {
      console.error("Failed to start HTML5 QR Code scanner:", err);
      onError(err.message || "Failed to start camera.");
    });

    return () => {
      // Stop the scanner when the component unmounts or dependencies change
      if (html5QrcodeScannerInstanceRef.current) {
        html5QrcodeScannerInstanceRef.current.stop().catch(e => console.warn("Error stopping scanner:", e));
        html5QrcodeScannerInstanceRef.current = null;
      }
    };
  }, [facingMode, onScan, onError, onReady]); // Dependencies for re-initialization

  return (
    <div id="html5qr-code-full-region" ref={scannerContainerRef} className="w-full h-full flex justify-center items-center">
      {/* The scanner will render its video feed and UI inside this div */}
    </div>
  );
};

export default Html5QrCodeScanner;