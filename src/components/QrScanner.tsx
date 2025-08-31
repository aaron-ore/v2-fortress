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
  isOpen: boolean; // Pass isOpen to control internal lifecycle
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

    // Function to stop the scanner gracefully
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

    // Function to clear the Html5Qrcode instance
    const clearScanner = useCallback(() => {
      if (html5QrCodeRef.current) {
        console.log("[QrScanner] Attempting to clear scanner instance...");
        try {
          html5QrCodeRef.current.clear();
          console.log("[QrScanner] Scanner instance cleared.");
        } catch (e) {
          console.warn("[QrScanner] Error during scanner clear:", e);
        } finally {
          html5QrCodeRef.current = null; // Ensure instance reference is nullified
        }
      } else {
        console.log("[QrScanner] No scanner instance to clear.");
      }
    }, []);

    // Combined function to stop and clear, exposed via ref
    const stopAndClear = useCallback(async () => {
      console.log("[QrScanner] stopAndClear called.");
      await stopScanner(); // Ensure scanner is stopped first
      clearScanner();     // Then clear the instance
    }, [stopScanner, clearScanner]);

    // Expose stopAndClear via imperative handle
    useImperativeHandle(ref, () => ({
      stopAndClear: stopAndClear,
    }));

    // Function to start the scanner
    const startScanner = useCallback(async (constraints: MediaTrackConstraints) => {
      if (!isMounted.current || !isOpen) {
        console.log("[QrScanner] Not starting scanner: component unmounted or dialog closed.");
        return;
      }

      // Ensure a clean slate before starting
      await stopAndClear(); 
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for camera resource release

      if (!html5QrCodeRef.current) {
        console.log("[QrScanner] Creating new Html5Qrcode instance.");
        html5QrCodeRef.current = new Html5Qrcode(QR_SCANNER_DIV_ID, html5QrcodeConstructorConfig);
      } else {
        console.log("[QrScanner] Reusing existing Html5Qrcode instance.");
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
    }, [isOpen, onScan, onReady, onError, stopAndClear, html5QrcodeConstructorConfig, html5QrcodeCameraScanConfig]);

    // Main effect to manage scanner lifecycle based on isOpen and facingMode
    useEffect(() => {
      isMounted.current = true;
      console.log("[QrScanner] Main effect running. isOpen:", isOpen, "facingMode:", facingMode);

      if (isOpen) {
        const constraints: MediaTrackConstraints = { facingMode: facingMode };
        startScanner(constraints);
      } else {
        // If dialog is closed, ensure scanner is stopped and cleared
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