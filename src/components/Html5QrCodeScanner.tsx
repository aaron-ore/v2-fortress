import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { showError } from '@/utils/toast';

interface Html5QrCodeScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
  onReady: () => void;
  facingMode: "user" | "environment";
}

const qrcodeRegionId = "html5qr-code-full-region";

const Html5QrCodeScanner: React.FC<Html5QrCodeScannerProps> = ({ onScan, onError, onReady, facingMode }) => {
  const scannerInstanceRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // 1. Ensure the DOM element exists
    const element = document.getElementById(qrcodeRegionId);
    if (!element) {
      const msg = `DOM element with ID '${qrcodeRegionId}' not found. Cannot initialize scanner.`;
      console.error(msg);
      onError(msg);
      return;
    }

    // 2. Stop any existing scanner instance
    if (scannerInstanceRef.current) {
      scannerInstanceRef.current.stop().catch(e => console.warn("Error stopping previous scanner:", e));
      scannerInstanceRef.current = null;
    }

    // Debugging: Check if Html5QrcodeScanner is a function (constructor)
    if (typeof Html5QrcodeScanner !== 'function') {
      const msg = `Html5QrcodeScanner is not a constructor function. Type: ${typeof Html5QrcodeScanner}. This indicates an import/bundling issue.`;
      console.error(msg, Html5QrcodeScanner);
      onError(msg);
      return;
    }

    // 3. Create a new Html5QrcodeScanner instance
    let newScanner: Html5QrcodeScanner;
    try {
      newScanner = new Html5QrcodeScanner(
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
      scannerInstanceRef.current = newScanner;
    } catch (e: any) {
      const msg = `Html5QrcodeScanner constructor failed: ${e.message || e}`;
      console.error(msg, e);
      onError(msg);
      return;
    }

    // 4. Define callbacks
    const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
      scannerInstanceRef.current?.pause(); // Pause after successful scan
      onScan(decodedText);
    };

    const qrCodeErrorCallback = (errorMessage: string) => {
      // This callback is called continuously, only log/show error if it's a critical failure
      // console.warn("QR Code Scan Error (continuous):", errorMessage);
    };

    // 5. Start the scanner
    if (scannerInstanceRef.current && typeof scannerInstanceRef.current.start === 'function') {
      scannerInstanceRef.current.start(
        { facingMode: facingMode },
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      ).then(() => {
        onReady(); // Camera started successfully
      }).catch((err: any) => {
        const msg = `Html5QrcodeScanner.start() failed: ${err.message || err}`;
        console.error(msg, err);
        onError(msg);
      });
    } else {
      const msg = "Html5QrcodeScanner instance or its start method is invalid after successful construction.";
      console.error(msg, scannerInstanceRef.current);
      onError(msg);
    }

    // 6. Cleanup function
    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch(e => console.warn("Error stopping scanner on cleanup:", e));
        scannerInstanceRef.current = null;
      }
    };
  }, [facingMode, onScan, onError, onReady]); // Dependencies

  return (
    <div id={qrcodeRegionId} className="w-full h-full flex justify-center items-center">
      {/* The scanner will render its video feed and UI inside this div */}
    </div>
  );
};

export default Html5QrCodeScanner;