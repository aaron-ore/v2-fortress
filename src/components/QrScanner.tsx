import React, { useEffect, useRef, useState, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export interface QrScannerRef {
  stopAndClear: () => Promise<void>;
}

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
  onReady: () => void;
  facingMode: "user" | "environment";
}

const QrScanner = forwardRef<QrScannerRef, QrScannerProps>(({ onScan, onError, onReady, facingMode }, ref) => {
  const readerId = useMemo(() => `qr-reader-${Math.random().toString(36).substring(2, 9)}`, []);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const lastReportedErrorRef = useRef<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true); // To track if the component is mounted

  // Centralized function to stop and clear the scanner
  const stopAndClearScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      const qrCode = html5QrCodeRef.current;
      console.log(`[QrScanner-${readerId}] Attempting to stop and clear scanner. isScanning: ${qrCode.isScanning}`);
      try {
        if (qrCode.isScanning) {
          await qrCode.stop();
          console.log(`[QrScanner-${readerId}] Scanner stopped successfully.`);
        } else {
          console.log(`[QrScanner-${readerId}] Scanner not in scanning state, skipping stop.`);
        }
      } catch (e) {
        console.warn(`[QrScanner-${readerId}] Error during qrCode.stop():`, e);
        // Continue to clear even if stop fails
      } finally {
        try {
          await new Promise(resolve => setTimeout(resolve, 50)); // Small delay before clearing
          await qrCode.clear();
          console.log(`[QrScanner-${readerId}] Scanner UI cleared and resources released.`);
        } catch (e) {
          console.warn(`[QrScanner-${readerId}] Error during qrCode.clear():`, e);
        } finally {
          await new Promise(resolve => setTimeout(resolve, 50)); // Another small delay
          html5QrCodeRef.current = null;
          if (isMounted.current) {
            setIsCameraInitialized(false);
          }
          if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = null;
          }
          lastReportedErrorRef.current = null;
        }
      }
    }
  }, [readerId]);

  // Expose stopAndClearScanner via ref
  useImperativeHandle(ref, () => ({
    stopAndClear: stopAndClearScanner,
  }));

  useEffect(() => {
    isMounted.current = true;
    console.log(`[QrScanner-${readerId}] Component mounted. Initializing Html5Qrcode instance.`);

    const qrCode = new Html5Qrcode(readerId, { verbose: false });
    html5QrCodeRef.current = qrCode; // Assign the new instance immediately

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
    };

    let startCameraTimeout: NodeJS.Timeout | null = null;

    const startScanner = async () => {
      if (!isMounted.current || qrCode.isScanning) {
        console.log(`[QrScanner-${readerId}] Skipping startScanner: isMounted=${isMounted.current}, isScanning=${qrCode.isScanning}`);
        return;
      }

      console.log(`[QrScanner-${readerId}] Attempting to start scanner with facingMode: ${facingMode}`);
      setIsCameraInitialized(false); // Reset initialization state
      
      // Set a timeout for the camera to start
      startCameraTimeout = setTimeout(() => {
        if (isMounted.current && !isCameraInitialized) {
          console.error(`[QrScanner-${readerId}] Camera initialization timed out (10s).`);
          onError("Camera initialization timed out. Please try again.");
          setIsCameraInitialized(false);
          stopAndClearScanner(); // Attempt to clean up on timeout
        }
      }, 10000); // 10 seconds timeout

      try {
        await qrCode.start(
          { facingMode: facingMode },
          config,
          async (decodedText) => {
            if (startCameraTimeout) clearTimeout(startCameraTimeout);
            console.log(`[QrScanner-${readerId}] Scan success: ${decodedText}`);
            if (qrCode.isScanning) {
              await qrCode.stop();
              console.log(`[QrScanner-${readerId}] Scanner stopped after successful scan.`);
            }
            await new Promise(resolve => setTimeout(resolve, 100)); // Delay before onScan
            if (isMounted.current) {
              onScan(decodedText);
            }
          },
          (errorMessage) => {
            const lowerCaseMessage = errorMessage.toLowerCase();
            if (
              lowerCaseMessage.includes("no qr code found") ||
              lowerCaseMessage.includes("qr code parse error") ||
              lowerCaseMessage.includes("decode error") ||
              lowerCaseMessage.includes("could not find any device") ||
              lowerCaseMessage.includes("video stream has ended") ||
              lowerCaseMessage.includes("notfoundexception") ||
              lowerCaseMessage.includes("notallowederror") ||
              lowerCaseMessage.includes("overconstrainederror")
            ) {
              return; // Ignore common transient errors or non-critical messages
            }

            // Only report unique and persistent errors
            if (lastReportedErrorRef.current !== errorMessage) {
              lastReportedErrorRef.current = errorMessage;
              if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
              }
              errorTimeoutRef.current = setTimeout(() => {
                if (isMounted.current) {
                  console.error(`[QrScanner-${readerId}] Reported runtime error: ${errorMessage}`);
                  onError(errorMessage);
                }
                errorTimeoutRef.current = null;
              }, 1000); // Debounce error reporting
            }
          }
        );
        if (startCameraTimeout) clearTimeout(startCameraTimeout);
        if (isMounted.current) {
          console.log(`[QrScanner-${readerId}] Camera initialized successfully.`);
          setIsCameraInitialized(true);
          onReady();
        }
      } catch (err: any) {
        if (startCameraTimeout) clearTimeout(startCameraTimeout);
        if (isMounted.current) {
          console.error(`[QrScanner-${readerId}] Failed to start camera:`, err);
          onError(err.message || "Failed to start camera.");
          setIsCameraInitialized(false); // Explicitly set to false on start failure
          stopAndClearScanner(); // Attempt to clean up even on start failure
        }
      }
    };

    startScanner();

    // Cleanup function for when the component unmounts
    return () => {
      isMounted.current = false;
      if (startCameraTimeout) clearTimeout(startCameraTimeout);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      console.log(`[QrScanner-${readerId}] Component unmounted. Performing cleanup.`);
      stopAndClearScanner();
    };
  }, [facingMode, onScan, onError, onReady, readerId, stopAndClearScanner]);

  return (
    <div className="w-full h-full flex justify-center items-center relative">
      {/* Loading overlay */}
      {!isCameraInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-lg z-10">
          Initializing camera...
        </div>
      )}
      {/* The element where the camera stream will be rendered */}
      <div id={readerId} className="w-full h-full" />
    </div>
  );
});

export default QrScanner;