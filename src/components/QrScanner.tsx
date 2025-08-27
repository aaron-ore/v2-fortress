import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

// Define the ref type for external control (e.g., stopping the scanner)
export interface QrScannerRef {
  stopAndClear: () => Promise<void>;
}

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
  onReady: () => void;
  facingMode: "user" | "environment";
}

const QrScanner = forwardRef<QrScannerRef, QrScannerProps>(
  ({ onScan, onError, onReady, facingMode }, ref) => {
    const scannerId = "qr-code-full-region"; // Unique ID for the scanner element
    const html5QrCodeRef = useRef<Html5QrcodeScanner | null>(null);
    const isMounted = useRef(true); // To track component mount status

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
      // Only support QR_CODE and CODE_128 for better performance and focus
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
      ],
    };

    const startScanner = async () => {
      if (!isMounted.current) return; // Prevent starting if component unmounted

      // Ensure previous scanner instance is stopped and cleared before starting a new one
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current = null; // Clear the ref after stopping
        } catch (e) {
          console.warn("Error stopping previous scanner instance:", e);
        }
      }

      // Create a new scanner instance
      html5QrCodeRef.current = new Html5QrcodeScanner(
        scannerId,
        {
          ...config,
          // Dynamically set camera facing mode
          // This is crucial for switching between front/back cameras
          // and needs to be part of the start() options.
          // The library handles the actual camera selection based on this.
          // If 'environment' is not available, it might fall back or error.
          videoConstraints: {
            facingMode: facingMode,
          },
        },
        false // Verbose logging
      );

      try {
        await html5QrCodeRef.current.start(
          { facingMode: facingMode }, // Pass facingMode here for camera selection
          (decodedText, decodedResult) => {
            if (isMounted.current) {
              onScan(decodedText);
              // Optionally stop scanner after first successful scan
              // html5QrCodeRef.current?.stop();
            }
          },
          (errorMessage) => {
            // Only report errors if not currently stopping or if it's a persistent error
            if (isMounted.current && !errorMessage.includes("No QR code found")) {
              onError(errorMessage);
            }
          }
        );
        if (isMounted.current) {
          onReady();
        }
      } catch (err: any) {
        if (isMounted.current) {
          console.error("Failed to start scanner:", err);
          onError(err.message || "Unknown camera error.");
        }
      }
    };

    const stopAndClearScanner = async () => {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          console.log("[QrScanner] Scanner stopped successfully.");
        } catch (e) {
          console.warn("[QrScanner] Error stopping scanner:", e);
        } finally {
          html5QrCodeRef.current = null; // Ensure ref is cleared
        }
      }
    };

    // Expose stopAndClearScanner via ref
    useImperativeHandle(ref, () => ({
      stopAndClear: stopAndClearScanner,
    }));

    useEffect(() => {
      isMounted.current = true;
      startScanner();

      return () => {
        isMounted.current = false;
        stopAndClearScanner();
      };
    }, [facingMode]); // Restart scanner when facingMode changes

    return <div id={scannerId} className="w-full h-full" />;
  }
);

QrScanner.displayName = "QrScanner";

export default QrScanner;