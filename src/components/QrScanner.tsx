import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5Qrcode } from "html5-qrcode";
import { QrReader } from 'react-qr-reader'; // Import QrReader from react-qr-reader

export interface QrScannerRef {
  stopAndClear: () => Promise<void>;
}

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
  onReady: () => void;
  facingMode: "user" | "environment";
}

type ScannerType = 'html5-qrcode' | 'react-qr-reader';

const QrScanner = forwardRef<QrScannerRef, QrScannerProps>(
  ({ onScan, onError, onReady, facingMode }, ref) => {
    const scannerId = "qr-code-full-region";
    const scannerDivRef = useRef<HTMLDivElement>(null);
    const html5QrCodeInstanceRef = useRef<Html5QrcodeScanner | null>(null);
    const isMounted = useRef(true);

    const [activeScannerType, setActiveScannerType] = useState<ScannerType>('html5-qrcode');
    const [activeCameraDeviceId, setActiveCameraDeviceId] = useState<string | undefined>(undefined);
    const [isScannerReady, setIsScannerReady] = useState(false);

    const html5QrcodeConfig = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
      ],
    };

    const stopAndClearHtml5Qrcode = useCallback(async () => {
      if (html5QrCodeInstanceRef.current) {
        console.log("[QrScanner] Attempting to stop Html5QrcodeScanner instance...");
        try {
          if (typeof html5QrCodeInstanceRef.current.stop === 'function') {
            await html5QrCodeInstanceRef.current.stop();
            console.log("[QrScanner] Html5QrcodeScanner stopped successfully.");
          } else {
            console.warn("[QrScanner] Html5QrcodeScanner instance found but 'stop' method is missing. Clearing ref anyway.");
          }
        } catch (e) {
          console.warn("[QrScanner] Error stopping Html5QrcodeScanner (might be already stopped or camera not found):", e);
        } finally {
          html5QrCodeInstanceRef.current = null;
        }
      } else {
        console.log("[QrScanner] No active Html5QrcodeScanner instance to stop.");
      }
    }, []);

    const stopAndClear = useCallback(async () => {
      await stopAndClearHtml5Qrcode();
      setActiveScannerType('html5-qrcode'); // Reset to default for next attempt
      setActiveCameraDeviceId(undefined);
      setIsScannerReady(false);
    }, [stopAndClearHtml5Qrcode]);

    useImperativeHandle(ref, () => ({
      stopAndClear: stopAndClear,
    }));

    const startHtml5QrcodeScanner = useCallback(async (elementId: string, constraints: MediaTrackConstraints, strategyName: string) => {
      if (!isMounted.current) {
        console.log(`[QrScanner - ${strategyName}] Not mounted, skipping start.`);
        return false;
      }

      console.log(`[QrScanner - ${strategyName}] Attempting to start Html5QrcodeScanner with constraints:`, constraints);
      try {
        const newScanner = new Html5QrcodeScanner(
          elementId,
          {
            ...html5QrcodeConfig,
            videoConstraints: constraints,
          },
          false // Verbose logging
        );
        html5QrCodeInstanceRef.current = newScanner;

        if (!newScanner || typeof newScanner.start !== 'function') {
          console.error(`[QrScanner - ${strategyName}] Html5QrcodeScanner instance is invalid or 'start' method is missing.`);
          return false;
        }

        await newScanner.start(
          constraints,
          (decodedText) => {
            if (isMounted.current) {
              console.log(`[QrScanner - ${strategyName}] Scan successful:`, decodedText);
              onScan(decodedText);
            }
          },
          (errorMessage) => {
            if (isMounted.current && !errorMessage.includes("No QR code found")) {
              console.warn(`[QrScanner - ${strategyName}] Scan error (not 'No QR code found'):`, errorMessage);
              // Don't call global onError for minor scan errors, only for critical init failures
            }
          }
        );
        if (isMounted.current) {
          console.log(`[QrScanner - ${strategyName}] Scanner started and ready.`);
          onReady();
          setIsScannerReady(true);
          return true;
        }
        return false;
      } catch (err: any) {
        if (isMounted.current) {
          console.error(`[QrScanner - ${strategyName}] Critical error during Html5QrcodeScanner start:`, err);
          onError(`Camera init failed (${strategyName}): ${err.message || 'Unknown error'}`);
        }
        return false;
      } finally {
        if (!isMounted.current || !isScannerReady) { // If not ready or unmounted, ensure cleanup
          await stopAndClearHtml5Qrcode();
        }
      }
    }, [onScan, onError, onReady, html5QrcodeConfig, isScannerReady, stopAndClearHtml5Qrcode]);


    const attemptStrategies = useCallback(async () => {
      if (!isMounted.current) return;

      const element = scannerDivRef.current;
      if (!element) {
        console.error("[QrScanner] Scanner target element not found in DOM. Cannot start any strategy.");
        onError("Scanner target element not found.");
        return;
      }

      await stopAndClear(); // Ensure clean slate before attempting strategies

      console.log("[QrScanner] Starting camera initialization strategies...");

      const strategies = [
        // Strategy 1: Default facingMode with a short delay
        async () => {
          console.log("[QrScanner] Attempting Strategy 1: Default facingMode (100ms delay)");
          return await startHtml5QrcodeScanner(element.id, { facingMode: facingMode }, "Strategy 1");
        },
        // Strategy 2: Default facingMode with a longer delay
        async () => {
          console.log("[QrScanner] Attempting Strategy 2: Default facingMode (500ms delay)");
          await new Promise(resolve => setTimeout(resolve, 400)); // Additional delay
          return await startHtml5QrcodeScanner(element.id, { facingMode: facingMode }, "Strategy 2");
        },
        // Strategy 3: Explicit 'environment' camera by ID
        async () => {
          console.log("[QrScanner] Attempting Strategy 3: Explicit 'environment' camera ID");
          try {
            const cameras = await Html5Qrcode.getCameras();
            const environmentCamera = cameras.find(camera => camera.label.toLowerCase().includes('back') || camera.label.toLowerCase().includes('environment'));
            if (environmentCamera) {
              setActiveCameraDeviceId(environmentCamera.id);
              return await startHtml5QrcodeScanner(element.id, { deviceId: { exact: environmentCamera.id } }, "Strategy 3");
            }
            console.log("[QrScanner] No explicit 'environment' camera found for Strategy 3.");
            return false;
          } catch (e) {
            console.warn("[QrScanner] Error enumerating cameras for Strategy 3:", e);
            return false;
          }
        },
        // Strategy 4: Explicit 'user' camera by ID
        async () => {
          console.log("[QrScanner] Attempting Strategy 4: Explicit 'user' camera ID");
          try {
            const cameras = await Html5Qrcode.getCameras();
            const userCamera = cameras.find(camera => camera.label.toLowerCase().includes('front') || camera.label.toLowerCase().includes('user'));
            if (userCamera) {
              setActiveCameraDeviceId(userCamera.id);
              return await startHtml5QrcodeScanner(element.id, { deviceId: { exact: userCamera.id } }, "Strategy 4");
            }
            console.log("[QrScanner] No explicit 'user' camera found for Strategy 4.");
            return false;
          } catch (e) {
            console.warn("[QrScanner] Error enumerating cameras for Strategy 4:", e);
            return false;
          }
        },
        // Strategy 5: Fallback to react-qr-reader
        async () => {
          console.log("[QrScanner] Attempting Strategy 5: Fallback to react-qr-reader.");
          setActiveScannerType('react-qr-reader');
          // react-qr-reader handles its own 'ready' state via rendering
          onReady();
          setIsScannerReady(true);
          return true; // Assume react-qr-reader will attempt to start
        }
      ];

      for (let i = 0; i < strategies.length; i++) {
        console.log(`[QrScanner] Executing strategy ${i + 1}/${strategies.length}...`);
        const success = await strategies[i]();
        if (success) {
          console.log(`[QrScanner] Strategy ${i + 1} succeeded.`);
          setActiveScannerType(i < 4 ? 'html5-qrcode' : 'react-qr-reader'); // Update type based on successful strategy
          return;
        }
        console.log(`[QrScanner] Strategy ${i + 1} failed. Trying next.`);
        await stopAndClearHtml5Qrcode(); // Clear any partial html5-qrcode setup before next attempt
      }

      console.error("[QrScanner] All camera initialization strategies failed.");
      onError("All camera initialization attempts failed. Please check camera permissions and try again.");
      setIsScannerReady(false);
    }, [facingMode, onScan, onError, onReady, stopAndClear, stopAndClearHtml5Qrcode]);

    useEffect(() => {
      isMounted.current = true;
      console.log("[QrScanner] Component mounted or facingMode changed. Initiating strategy attempts...");
      
      // Use a small delay to ensure the div is fully rendered and available in the DOM
      const timer = setTimeout(() => {
        if (scannerDivRef.current) {
          attemptStrategies();
        } else {
          console.warn("[QrScanner] scannerDivRef.current is null after initial timeout. Retrying strategy attempts.");
          // If ref is still null, schedule another attempt, but don't loop indefinitely
          setTimeout(() => {
            if (scannerDivRef.current) {
              attemptStrategies();
            } else {
              onError("Scanner target element not available after multiple attempts.");
            }
          }, 500);
        }
      }, 100);

      return () => {
        isMounted.current = false;
        clearTimeout(timer);
        console.log("[QrScanner] Component unmounting. Stopping scanner...");
        stopAndClear();
      };
    }, [facingMode, attemptStrategies, stopAndClear, onError]);

    // Handle react-qr-reader results
    const handleQrReaderResult = (result: any, error: any) => {
      if (result) {
        console.log("[QrScanner - react-qr-reader] Scan successful:", result.text);
        onScan(result.text);
      }
      if (error && !error.message.includes("No QR code found")) {
        console.warn("[QrScanner - react-qr-reader] Scan error:", error.message);
        // onError(error.message); // Only call for critical errors, not just 'no QR found'
      }
    };

    if (activeScannerType === 'react-qr-reader') {
      return (
        <div className="w-full h-full">
          {isScannerReady && ( // Only render QrReader when it's considered ready
            <QrReader
              onResult={handleQrReaderResult}
              constraints={{ facingMode: facingMode }} // Use facingMode for react-qr-reader
              containerStyle={{ width: '100%', height: '100%' }}
              videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      );
    }

    // Default rendering for html5-qrcode
    return <div id={scannerId} ref={scannerDivRef} className="w-full h-full" />;
  }
);

QrScanner.displayName = "QrScanner";

export default QrScanner;