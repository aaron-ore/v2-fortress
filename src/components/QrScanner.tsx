import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5Qrcode } from "html5-qrcode"; // Import Html5Qrcode for static methods

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
    const scannerId = "qr-code-full-region"; // Stable ID for the scanner element
    const scannerDivRef = useRef<HTMLDivElement>(null); // React ref for the div element
    const [html5QrCodeInstance, setHtml5QrCodeInstance] = useState<Html5QrcodeScanner | null>(null);
    const isMounted = useRef(true); // To track component mount status

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
      ],
    };

    const stopAndClearScanner = async () => {
      if (html5QrCodeInstance && typeof html5QrCodeInstance.stop === 'function') {
        console.log("[QrScanner] Attempting to stop scanner instance...");
        try {
          await html5QrCodeInstance.stop();
          console.log("[QrScanner] Scanner stopped successfully.");
        } catch (e) {
          console.warn("[QrScanner] Error stopping scanner (might be already stopped or camera not found):", e);
        } finally {
          setHtml5QrCodeInstance(null); // Clear instance from state
        }
      } else {
        console.log("[QrScanner] No active scanner instance to stop or stop method not found.");
        setHtml5QrCodeInstance(null); // Ensure state is cleared
      }
    };

    const startScanner = async () => {
      if (!isMounted.current) {
        console.log("[QrScanner] Not mounted, skipping start.");
        return;
      }

      const element = scannerDivRef.current;
      if (!element) {
        console.error(`[QrScanner] React ref for scanner div not found. Cannot start scanner.`);
        onError(`Scanner target element not found.`);
        return;
      }
      console.log(`[QrScanner] React ref for scanner div found. Proceeding with scanner initialization.`);

      await stopAndClearScanner(); // Ensure any previous scanner is stopped

      console.log(`[QrScanner] Initializing new scanner for facingMode: ${facingMode}`);
      try {
        // --- DEBUGGING STEP: Log available cameras ---
        console.log("[QrScanner] Attempting to get camera list...");
        const cameras = await Html5Qrcode.getCameras();
        console.log("[QrScanner] Available cameras:", cameras);
        if (cameras.length === 0) {
          onError("No cameras found on this device. Please ensure a camera is connected and accessible.");
          return;
        }
        // --- END DEBUGGING STEP ---

        const newScanner = new Html5QrcodeScanner(
          element.id, // Use the ID of the ref-attached div
          {
            ...config,
            videoConstraints: {
              facingMode: facingMode,
            },
          },
          true // Set to true for verbose logging from html5-qrcode itself
        );
        setHtml5QrCodeInstance(newScanner); // Store instance in state

        if (!newScanner || typeof newScanner.start !== 'function') {
          console.error("[QrScanner] Failed to create Html5QrcodeScanner instance or start method is missing after constructor call.");
          onError("Failed to initialize QR scanner: Invalid instance.");
          setHtml5QrCodeInstance(null);
          return;
        }

        console.log("[QrScanner] Html5QrcodeScanner instance created successfully. Starting camera...");

        await newScanner.start(
          { facingMode: facingMode },
          (decodedText, decodedResult) => {
            if (isMounted.current) {
              console.log("[QrScanner] Scan successful:", decodedText);
              onScan(decodedText);
              // Optionally stop scanner after first successful scan if desired
              // stopAndClearScanner();
            }
          },
          (errorMessage) => {
            if (isMounted.current && !errorMessage.includes("No QR code found")) {
              console.warn("[QrScanner] Scan error:", errorMessage);
              onError(errorMessage);
            }
          }
        );
        if (isMounted.current) {
          console.log("[QrScanner] Scanner started and ready. Calling onReady.");
          onReady();
        }
      } catch (err: any) {
        if (isMounted.current) {
          console.error("[QrScanner] Error during Html5QrcodeScanner instantiation or start:", err);
          onError(err.message || "Unknown camera error during initialization.");
          setHtml5QrCodeInstance(null);
        }
      }
    };

    // Expose stopAndClearScanner via ref
    useImperativeHandle(ref, () => ({
      stopAndClear: stopAndClearScanner,
    }));

    useEffect(() => {
      isMounted.current = true;
      console.log("[QrScanner] Component mounted or facingMode changed. Scheduling scanner start...");
      
      const timer = setTimeout(startScanner, 100); // 100ms delay

      return () => {
        isMounted.current = false;
        clearTimeout(timer); // Clear timeout if component unmounts before it fires
        console.log("[QrScanner] Component unmounting. Stopping scanner...");
        stopAndClearScanner();
      };
    }, [facingMode]); // Restart scanner when facingMode changes

    return <div id={scannerId} ref={scannerDivRef} className="w-full h-full" />;
  }
);

QrScanner.displayName = "QrScanner";

export default QrScanner;