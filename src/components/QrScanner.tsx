import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

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
    const scannerDivRef = useRef<HTMLDivElement>(null); // React ref for the div element
    const html5QrCodeRef = useRef<Html5QrcodeScanner | null>(null);
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
      if (html5QrCodeRef.current) {
        console.log("[QrScanner] Attempting to stop scanner instance:", html5QrCodeRef.current);
        try {
          if (typeof html5QrCodeRef.current.stop === 'function') {
            await html5QrCodeRef.current.stop();
            console.log("[QrScanner] Scanner stopped successfully.");
          } else {
            console.warn("[QrScanner] Html5QrcodeScanner instance found but 'stop' method is missing. Clearing ref anyway.");
          }
        } catch (e) {
          console.warn("[QrScanner] Error stopping scanner (might be already stopped or camera not found):", e);
        } finally {
          html5QrCodeRef.current = null; // Always clear the ref after attempting to stop
        }
      } else {
        console.log("[QrScanner] No active scanner instance to stop.");
      }
    };

    const startScanner = async () => {
      if (!isMounted.current) {
        console.log("[QrScanner] Not mounted, skipping startScanner execution.");
        return;
      }

      const scannerElement = scannerDivRef.current;
      if (!scannerElement) {
        console.error(`[QrScanner] React ref for scanner div not found. Cannot start scanner.`);
        onError(`Scanner target element not found.`);
        return;
      }

      // Ensure previous scanner is stopped and cleared before creating a new one
      await stopAndClearScanner();

      console.log(`[QrScanner] Attempting to instantiate Html5QrcodeScanner for facingMode: ${facingMode}`);
      try {
        // Instantiate Html5QrcodeScanner
        html5QrCodeRef.current = new Html5QrcodeScanner(
          scannerElement.id, // Pass the ID of the div
          {
            ...config,
            videoConstraints: {
              facingMode: facingMode,
            },
          },
          false // Verbose logging
        );

        if (!html5QrCodeRef.current || typeof html5QrCodeRef.current.start !== 'function') {
          console.error("[QrScanner] Html5QrcodeScanner instance is invalid or 'start' method is missing after constructor call.");
          onError("Failed to initialize QR scanner: Invalid instance.");
          html5QrCodeRef.current = null; // Clear ref on invalid instance
          return;
        }

        console.log("[QrScanner] Html5QrcodeScanner instance created successfully. Starting camera...");

        // Start the scanner
        await html5QrCodeRef.current.start(
          { facingMode: facingMode }, // This is the camera configuration for the start method
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
              console.warn("[QrScanner] Scan error (not 'No QR code found'):", errorMessage);
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
          console.error("[QrScanner] Critical error during Html5QrcodeScanner instantiation or start:", err);
          onError(err.message || "Unknown critical camera error.");
          html5QrCodeRef.current = null; // Ensure ref is cleared on critical error
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

      // Use a small delay to ensure the div is fully rendered and available in the DOM
      // before Html5QrcodeScanner tries to attach to it.
      // This is crucial for html5-qrcode to find its target element.
      const timer = setTimeout(() => {
        if (scannerDivRef.current) { // Only attempt to start if the ref is populated
          startScanner();
        } else {
          console.warn("[QrScanner] scannerDivRef.current is null after timeout. Cannot start scanner.");
          onError("Scanner target element not available after delay.");
        }
      }, 100); // 100ms delay

      return () => {
        isMounted.current = false;
        clearTimeout(timer); // Clear timeout if component unmounts before it fires
        console.log("[QrScanner] Component unmounting. Stopping scanner...");
        stopAndClearScanner();
      };
    }, [facingMode]); // Restart scanner when facingMode changes

    // Assign a unique ID to the div for Html5QrcodeScanner to target
    // and also use a React ref for direct access.
    // The ID is static, but the ref ensures we know when the element is available.
    return <div id="qr-code-full-region" ref={scannerDivRef} className="w-full h-full" />;
  }
);

QrScanner.displayName = "QrScanner";

export default QrScanner;