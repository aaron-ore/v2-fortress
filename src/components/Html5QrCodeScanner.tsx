import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { showError } from '@/utils/toast';

interface Html5QrCodeScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
  facingMode: "user" | "environment";
}

const qrcodeRegionId = "html5qr-code-full-region";

const Html5QrCodeScanner: React.FC<Html5QrCodeScannerProps> = ({ onScan, onError, facingMode }) => {
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      qrcodeRegionId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        disableFlip: false, // Allow flipping for front camera
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

    const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
      // Only process if actively scanning and not already paused/stopped
      if (isScanning) {
        html5QrcodeScanner.pause(); // Pause scanner after successful scan
        onScan(decodedText);
        setIsScanning(false);
      }
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
      setIsScanning(true); // Set scanning true after successful start
    }).catch((err: any) => {
      console.error("Failed to start HTML5 QR Code scanner:", err);
      onError(err.message || "Failed to start camera.");
      setIsScanning(false);
    });

    return () => {
      // Stop the scanner when the component unmounts or dependencies change
      // The library handles if it's already stopped or not.
      html5QrcodeScanner.stop().catch(e => console.warn("Error stopping scanner:", e));
    };
  }, [facingMode, onScan, onError, isScanning]); // Added isScanning to dependencies to ensure qrCodeSuccessCallback uses latest state

  return (
    <div id={qrcodeRegionId} className="w-full h-full flex justify-center items-center">
      {/* The scanner will render its video feed and UI inside this div */}
    </div>
  );
};

export default Html5QrCodeScanner;