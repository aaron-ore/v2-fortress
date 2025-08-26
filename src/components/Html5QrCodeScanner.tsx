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
  const html5QrcodeScannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const element = document.getElementById(qrcodeRegionId);
    if (!element) {
      const msg = `DOM element with ID '${qrcodeRegionId}' not found. Cannot initialize scanner.`;
      console.error(msg);
      onError(msg);
      return;
    }

    // Stop any existing scanner instance before creating a new one
    if (html5QrcodeScannerRef.current && typeof html5QrcodeScannerRef.current.stop === 'function') {
      html5QrcodeScannerRef.current.stop().catch(e => console.warn("Error stopping previous scanner:", e));
      html5QrcodeScannerRef.current = null;
    }

    // Debugging: Check if Html5QrcodeScanner is a function (constructor)
    if (typeof Html5QrcodeScanner !== 'function') {
      const msg = `Html5QrcodeScanner is not a constructor function. Type: ${typeof Html5QrcodeScanner}. This indicates an import/bundling issue.`;
      console.error(msg, Html5QrcodeScanner);
      onError(msg);
      return;
    }

    let scanner: Html5QrcodeScanner;
    try {
      scanner = new Html5QrcodeScanner(
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
      html5QrcodeScannerRef.current = scanner; // Assign the newly created scanner to the ref
    } catch (e: any) {
      const msg = `Html5QrcodeScanner constructor failed: ${e.message || e}`;
      console.error(msg, e);
      onError(msg);
      return;
    }

    const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
      html5QrcodeScannerRef.current?.pause(); // Use the ref for pausing
      onScan(decodedText);
    };

    const qrCodeErrorCallback = (errorMessage: string) => {
      // This callback is called continuously, usually not critical for the 'start' error
    };

    // Log the scanner object and its start method type before attempting to call it
    console.log("Scanner object before start:", scanner);
    console.log("Type of scanner.start before start:", typeof scanner.start);

    // Use a setTimeout to defer the start call, giving the component and DOM a moment to settle
    const startTimeout = setTimeout(() => {
      if (typeof scanner.start === 'function') {
        scanner.start(
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
        const msg = "Html5QrcodeScanner instance's start method is invalid after successful construction.";
        console.error(msg, "Scanner object:", scanner, "Type of scanner.start:", typeof scanner.start);
        onError(msg);
      }
    }, 100); // 100ms delay

    return () => {
      clearTimeout(startTimeout); // Clear timeout if component unmounts before it fires
      // Cleanup: Stop the scanner when the component unmounts or dependencies change
      if (html5QrcodeScannerRef.current && typeof html5QrcodeScannerRef.current.stop === 'function') {
        html5QrcodeScannerRef.current.stop().catch(e => console.warn("Error stopping scanner on cleanup:", e));
        html5QrcodeScannerRef.current = null;
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