"use client";

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeFullConfig, Html5QrcodeCameraScanConfig } from "html5-qrcode";

export interface QrScannerRef {
  stopAndClear: () => Promise<void>;
}

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
  onReady: () => void;
  facingMode: "user" | "environment";
  isOpen: boolean; // NEW: Pass isOpen to control internal lifecycle
}

const QR_SCANNER_DIV_ID = "qr-code-full-region"; // Consistent ID

const QrScanner = forwardRef<QrScannerRef, QrScannerProps>(
  ({ onScan, onError, onReady, facingMode, isOpen }, ref) => {
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null); // Persistent instance
    const isMounted = useRef(true);
    const [isScannerActive, setIsScannerActive] = useState(false); // Track if scanner is actively running

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
        console.log("[QrScanner] Stopping scanner...");
        try {
          await html5QrCodeRef.current.stop();
          console.log("[QrScanner] Scanner stopped.");
        } catch (e) {
          console.warn("[QrScanner] Error stopping scanner (might be already stopped or camera not found):", e);
        } finally {
          setIsScannerActive(false);
        }
      }
    }, []);

    const clearScanner = useCallback(() => {
      if (html5QrCodeRef.current) {
        console.log("[QrScanner] Clearing scanner...");
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null; // Clear instance reference
      }
    }, []);

    const stopAndClear = useCallback(async () => {
      await stopScanner();
      clearScanner();
    }, [stopScanner, clearScanner]);

    const startScanner = useCallback(async (constraints: MediaTrackConstraints) => {
      if (!isMounted.current || !isOpen) return; // Only start if mounted and dialog is open

      await stopScanner(); // Ensure any existing scanner is stopped first
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for camera resource release

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(QR_SCANNER_DIV_ID, html5QrcodeConstructorConfig);
      }

      console.log("[QrScanner] Starting scanner with constraints:", constraints);
      try {
        await html5QrCodeRef.current.start(
          constraints,
          html5QrcodeCameraScanConfig,
          (decodedText) => {
            if (isMounted.current) {
              console.log("[QrScanner] Scan successful:", decodedText);
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
          console.error("[QrScanner] Error starting scanner:", err);
          setIsScannerActive(false);
          let errorMessage = "Failed to start camera. ";
          if (err.name === "NotReadableError") {
            errorMessage += "The camera might be in use by another application, or there's a temporary hardware issue. Please close other apps using the camera, restart your browser, or try a different device.";
          } else if (err.name === "NotAllowedError") {
            errorMessage += "Camera access was denied. Please check your browser's site permissions for this page.";
          } else if (err.name === "OverconstrainedError") {
            errorMessage += "No camera found matching the requested constraints (e.g., front/back camera not available). Try switching camera modes.";
          } else {
            errorMessage += "Please check camera permissions and try again.";
          }
          onError(errorMessage);
        }
      }
    }, [isOpen, onScan, onReady, onError, stopScanner, html5QrcodeConstructorConfig, html5QrcodeCameraScanConfig]);

    useImperativeHandle(ref, () => ({
      stopAndClear: stopAndClear,
    }));

    // Effect to manage scanner lifecycle based on isOpen and facingMode
    useEffect(() => {
      isMounted.current = true;
      console.log("[QrScanner] Effect running. isOpen:", isOpen, "facingMode:", facingMode);

      if (isOpen) {
        const constraints: MediaTrackConstraints = { facingMode: facingMode };
        startScanner(constraints);
      } else {
        stopAndClear();
      }

      return () => {
        isMounted.current = false;
        console.log("[QrScanner] Component unmounting or effect cleanup. Stopping and clearing scanner.");
        stopAndClear();
      };
    }, [isOpen, facingMode, startScanner, stopAndClear]);

    return (
      <div id={QR_SCANNER_DIV_ID} className="w-full h-full" />
    );
  }
);

QrScanner.displayName = "QrScanner";

export default QrScanner;