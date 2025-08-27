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
    const scannerDivRef = useRef<HTMLDivElement>(null); // Use a React ref for the div element
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
      if (html5QrCodeRef.current && typeof html5QrCodeRef.current.stop === 'function') {
        console.log("[QrScanner] Attempting to stop scanner...");
        try {
          await html5QrCodeRef.current.stop();
          console.log("[QrScanner] Scanner stopped successfully.");
        } catch (e) {
          console.warn("[QrScanner] Error stopping scanner (might be already stopped or camera not found):", e);
        } finally {
          html5QrCodeRef.current = null; // Ensure ref is cleared
        }
      } else {
        console.log("[QrScanner] No active scanner instance to stop or stop method not found.");
        html5QrCodeRef.current = null; // Ensure ref is cleared even if stop wasn't a function
      }
    };

    const startScanner = async () => {
      if (!isMounted.current) {
        console.log("[QrScanner] Not mounted, skipping start.");
        return;
      }

      const scannerElement = scannerDivRef.current;
      if (!scannerElement) {
        console.error(`[QrScanner] React ref for scanner div not found. Cannot start scanner.`);
        onError(`React ref for scanner div not found.`);
        return;
      }
      console.log(`[QrScanner] React ref for scanner div found. Proceeding with scanner initialization.`);

      // Stop any existing scanner instance before starting a new one
      await stopAndClearScanner();

      console.log(`[QrScanner] Initializing new scanner for facingMode: ${facingMode}`);
      try {
        // Use the actual DOM element's ID directly, which is guaranteed to exist via the ref
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

        console.log("[QrScanner] Html5QrcodeScanner instance created:", html5QrCodeRef.current);

        // Check if the instance was successfully created and has a start method
        if (!html5QrCodeRef.current || typeof html5QrCodeRef.current.start !== 'function') {
          console.error("[QrScanner] Failed to create Html5QrcodeScanner instance or start method is missing after constructor call.");
          onError("Failed to initialize QR scanner.");
          return;
        }

        // The start method expects camera config as the first argument, followed by callbacks
        await html5QrCodeRef.current.start(
          { facingMode: facingMode }, // Pass facingMode here for camera selection
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
          console.log("[QrScanner] Scanner started and ready.");
          onReady();
        }
      } catch (err: any) {
        if (isMounted.current) {
          console.error("[QrScanner] Error during Html5QrcodeScanner instantiation or start:", err);
          onError(err.message || "Unknown camera error during initialization.");
        }
      }
    };

    // Expose stopAndClearScanner via ref
    useImperativeHandle(ref, () => ({
      stopAndClear: stopAndClearScanner,
    }));

    useEffect(() => {
      isMounted.current = true;
      console.log("[QrScanner] Component mounted or facingMode changed. Attempting scanner start...");
      // Use a small delay to ensure the div is fully rendered and available in the DOM
      // before Html5QrcodeScanner tries to attach to it.
      const timer = setTimeout(startScanner, 50); 

      return () => {
        isMounted.current = false;
        clearTimeout(timer); // Clear timeout if component unmounts before it fires
        console.log("[QrScanner] Component unmounting. Stopping scanner...");
        stopAndClearScanner();
      };
    }, [facingMode]); // Restart scanner when facingMode changes

    // Assign a unique ID to the div for Html5QrcodeScanner to target
    // and also use a React ref for direct access.
    return <div id="qr-code-full-region" ref={scannerDivRef} className="w-full h-full" />;
  }
);

QrScanner.displayName = "QrScanner";

export default QrScanner;