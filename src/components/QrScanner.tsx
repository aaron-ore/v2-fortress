"use client";

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeFullConfig, Html5QrcodeCameraScanConfig, Html5QrcodeCamera } from "html5-qrcode";

export interface QrScannerRef {
  stopAndClear: () => Promise<void>;
  retryStart: () => Promise<void>; // NEW: Expose a retry function
}

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
  onReady: () => void;
  facingMode: "user" | "environment";
  isOpen: boolean;
}

const QR_SCANNER_DIV_ID = "qr-code-full-region"; // Consistent ID
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000; // 1 second delay between retries

const QrScanner = forwardRef<QrScannerRef, QrScannerProps>(
  ({ onScan, onError, onReady, facingMode, isOpen }, ref) => {
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
          html5QrCodeRef.current = null;
        }
      } else {
        console.log("[QrScanner] No scanner instance to clear.");
      }
    }, []);

    const stopAndClear = useCallback(async () => {
      console.log("[QrScanner] stopAndClear called.");
      await stopScanner();
      clearScanner();
    }, [stopScanner, clearScanner]);

    const getCameraDeviceId = useCallback(async (preferredFacingMode: "user" | "environment"): Promise<string | null> => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras.length === 0) {
          console.warn("[QrScanner] No cameras found.");
          return null;
        }

        // Prioritize the preferred facing mode
        const preferredCamera = cameras.find(camera => camera.label.toLowerCase().includes(preferredFacingMode));
        if (preferredCamera) {
          console.log(`[QrScanner] Found preferred ${preferredFacingMode} camera: ${preferredCamera.label}`);
          return preferredCamera.id;
        }

        // Fallback to the other facing mode
        const alternateFacingMode = preferredFacingMode === "user" ? "environment" : "user";
        const alternateCamera = cameras.find(camera => camera.label.toLowerCase().includes(alternateFacingMode));
        if (alternateCamera) {
          console.log(`[QrScanner] Found alternate ${alternateFacingMode} camera: ${alternateCamera.label}`);
          return alternateCamera.id;
        }

        // Fallback to any camera if no specific facing mode found in labels
        console.log("[QrScanner] Falling back to first available camera.");
        return cameras[0].id;

      } catch (e) {
        console.error("[QrScanner] Error getting camera devices:", e);
        return null;
      }
    }, []);

    const startScanner = useCallback(async () => {
      if (!isMounted.current || !isOpen) {
        console.log("[QrScanner] Not starting scanner: component unmounted or dialog closed.");
        return;
      }

      await stopAndClear();
      await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for camera resource release

      const deviceId = await getCameraDeviceId(facingMode);

      if (!deviceId) {
        onError("No suitable camera found or camera access denied. Please check permissions.");
        return;
      }

      if (!html5QrCodeRef.current) {
        console.log("[QrScanner] Creating new Html5Qrcode instance.");
        html5QrCodeRef.current = new Html5Qrcode(QR_SCANNER_DIV_ID, html5QrcodeConstructorConfig);
      } else {
        console.log("[QrScanner] Reusing existing Html5Qrcode instance.");
      }

      for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
        console.log(`[QrScanner] Attempt ${attempt}/${RETRY_ATTEMPTS} to start scanner with deviceId: ${deviceId}`);
        try {
          await html5QrCodeRef.current.start(
            deviceId,
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
            return; // Success, exit loop
          }
        } catch (err: any) {
          if (isMounted.current) {
            console.error(`[QrScanner] Error starting scanner on attempt ${attempt}:`, err);
            setIsScannerActive(false);
            let errorMessage = "Failed to start camera. ";
            if (err.name === "NotReadableError") {
              errorMessage += "The camera might be in use by another application, or there's a temporary hardware issue. ";
            } else if (err.name === "NotAllowedError") {
              errorMessage += "Camera access was denied. Please check your browser's site permissions for this page. ";
            } else if (err.name === "OverconstrainedError") {
              errorMessage += "No camera found matching the requested constraints (e.g., front/back camera not available). ";
            } else {
              errorMessage += "Please check camera permissions and try again. ";
            }
            onError(errorMessage + (attempt < RETRY_ATTEMPTS ? `Retrying in ${RETRY_DELAY_MS / 1000}s...` : "No more retries."));

            if (attempt < RETRY_ATTEMPTS && err.name === "NotReadableError") {
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            } else {
              return; // Stop trying if not NotReadableError or no more retries
            }
          }
        }
      }
    }, [isOpen, onScan, onReady, onError, stopAndClear, getCameraDeviceId, facingMode, html5QrcodeConstructorConfig, html5QrcodeCameraScanConfig]);

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
      console.log("[QrScanner] Main effect running. isOpen:", isOpen, "facingMode:", facingMode);

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
    }, [isOpen, facingMode, startScanner, stopAndClear]);

    return (
      <div id={QR_SCANNER_DIV_ID} className="w-full h-full" />
    );
  }
);

QrScanner.displayName = "QrScanner";

export default QrScanner;