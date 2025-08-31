"use client";

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeFullConfig, Html5QrcodeCameraScanConfig } from "html5-qrcode";

export interface QrScannerRef {
  stopAndClear: () => Promise<void>;
  retryStart: () => Promise<void>;
}

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
  onReady: () => void;
  isOpen: boolean;
}

const QR_SCANNER_DIV_ID = "qr-code-full-region"; // Consistent ID
const RETRY_DELAY_MS = 2000; // Increased delay to 2 seconds

const QrScanner = forwardRef<QrScannerRef, QrScannerProps>(
  ({ onScan, onError, onReady, isOpen }, ref) => {
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const isMounted = useRef(true);
    const [isScannerActive, setIsScannerActive] = useState(false);

    const html5QrcodeConstructorConfig: Html5QrcodeFullConfig = {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
      ],
      verbose: false,
    };

    const html5QrcodeCameraScanConfig: Html5QrcodeCameraScanConfig = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
    };

    const stopScanner = useCallback(async () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        console.log("[QrScanner] Attempting to stop scanner...");
        try {
          await html5QrCodeRef.current.stop();
          console.log("[QrScanner] Scanner stopped successfully.");
        } catch (e) {
          console.warn("[QrScanner] Error during scanner stop (might be already stopped or camera not found):", e);
        } finally {
          setIsScannerActive(false);
        }
      } else {
        console.log("[QrScanner] Scanner not active or already stopped. No need to stop.");
      }
    }, []);

    const clearScanner = useCallback(() => {
      if (html5QrCodeRef.current) {
        console.log("[QrScanner] Attempting to clear scanner instance...");
        try {
          html5QrCodeRef.current.clear();
          console.log("[QrScanner] Scanner instance cleared.");
        } catch (e) {
          console.warn("[QrScanner] Error during scanner clear:", e);
        } finally {
          html5QrCodeRef.current = null; // Crucial: Nullify the instance
        }
      } else {
        console.log("[QrScanner] No scanner instance to clear.");
      }
    }, []);

    const stopAndClear = useCallback(async () => {
      console.log("[QrScanner] stopAndClear called.");
      await stopScanner(); // Ensure scanner is stopped first
      clearScanner();    // Then clear the instance
    }, [stopScanner, clearScanner]);

    const startScanner = useCallback(async () => {
      if (!isMounted.current || !isOpen) {
        console.log("[QrScanner] Not starting scanner: component unmounted or dialog closed.");
        return;
      }

      await stopAndClear(); // Always start with a clean slate
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for camera resource release

      // Explicitly request the 'environment' (back) camera
      const constraints: MediaTrackConstraints = { facingMode: { exact: "environment" } };

      if (!html5QrCodeRef.current) {
        console.log("[QrScanner] Creating new Html5Qrcode instance.");
        html5QrCodeRef.current = new Html5Qrcode(QR_SCANNER_DIV_ID, html5QrcodeConstructorConfig);
      } else {
        console.log("[QrScanner] Reusing existing Html5Qrcode instance.");
      }

      console.log(`[QrScanner] Attempting to start scanner with constraints:`, constraints);
      try {
        await html5QrCodeRef.current.start(
          constraints,
          html5QrcodeCameraScanConfig,
          async (decodedText) => { // Made async to await stopScanner
            if (isMounted.current) {
              console.log("[QrScanner] Scan successful:", decodedText);
              await stopScanner(); // Immediately stop scanner after a successful scan
              await new Promise(resolve => setTimeout(resolve, 100)); // Small delay before callback
              onScan(decodedText);
            }
          },
          (errorMessage) => {
            if (isMounted.current && !errorMessage.includes("No QR code found")) {
              console.warn("[QrScanner] Scan error (not 'No QR code found'):", errorMessage);
            }
          }
        );
        if (isMounted.current) {
          console.log("[QrScanner] Scanner started and ready.");
          onReady();
          setIsScannerActive(true);
        }
      } catch (err: any) {
        if (isMounted.current) {
          console.error(`[QrScanner] Error starting scanner:`, err);
          setIsScannerActive(false);
          let errorMessage = "Failed to start camera. ";
          if (err.name === "NotReadableError") {
            errorMessage += "The camera might be in use by another application, or there's a temporary hardware issue. ";
          } else if (err.name === "NotAllowedError") {
            errorMessage += "Camera access was denied. Please check your browser's site permissions for this page. ";
          } else if (err.name === "OverconstrainedError") {
            errorMessage += "No back camera found or it's not available. ";
          } else {
            errorMessage += "Please check camera permissions and try again. ";
          }
          onError(errorMessage); // Report error, but don't retry automatically
        }
      }
    }, [isOpen, onScan, onReady, onError, stopAndClear, html5QrcodeConstructorConfig, html5QrcodeCameraScanConfig, stopScanner]);

    const retryStart = useCallback(async () => {
      console.log("[QrScanner] retryStart called.");
      await startScanner();
    }, [startScanner]);

    useImperativeHandle(ref, () => ({
      stopAndClear: stopAndClear,
      retryStart: retryStart,
    }));

    useEffect(() => {
      isMounted.current = true;
      console.log("[QrScanner] Main effect running. isOpen:", isOpen);

      if (isOpen) {
        startScanner();
      } else {
        stopAndClear();
      }

      return () => {
        isMounted.current = false;
        console.log("[QrScanner] Component unmounting or effect cleanup. Stopping and clearing scanner.");
        stopAndClear();
      };
    }, [isOpen, startScanner, stopAndClear]);

    return (
      <div id={QR_SCANNER_DIV_ID} className="w-full h-full" />
    );
  }
);

QrScanner.displayName = "QrScanner";

export default QrScanner;