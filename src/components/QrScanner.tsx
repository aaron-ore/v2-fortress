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
  const startCameraTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for the camera start timeout
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 500; // 0.5 seconds

  // Centralized function to stop and clear the scanner
  const stopAndClearScanner = useCallback(async () => {
    if (startCameraTimeoutRef.current) {
      clearTimeout(startCameraTimeoutRef.current);
      startCameraTimeoutRef.current = null;
    }
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
          await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay before clearing
          await qrCode.clear();
          console.log(`[QrScanner-${readerId}] Scanner UI cleared and resources released.`);
        } catch (e) {
          console.warn(`[QrScanner-${readerId}] Error during qrCode.clear():`, e);
        } finally {
          await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay
          html5QrCodeRef.current = null; // Nullify the instance after clearing
          if (isMounted.current) {
            setIsCameraInitialized(false);
          }
          if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = null;
          }
          lastReportedErrorRef.current = null;
          retryCountRef.current = 0; // Reset retry count on successful stop/clear
        }
      }
    }
  }, [readerId]);

  // Expose stopAndClearScanner via ref
  useImperativeHandle(ref, () => ({
    stopAndClear: stopAndClearScanner,
  }));

  const startScanner = useCallback(async (mode: "user" | "environment", attempt = 0) => {
    if (!isMounted.current) {
      console.log(`[QrScanner-${readerId}] Skipping startScanner: Component not mounted.`);
      return;
    }

    // Create a new Html5Qrcode instance if one doesn't exist or was cleared
    if (!html5QrCodeRef.current) {
      console.log(`[QrScanner-${readerId}] Creating new Html5Qrcode instance.`);
      html5QrCodeRef.current = new Html5Qrcode(readerId, { verbose: false });
    }
    const qrCode = html5QrCodeRef.current;

    console.log(`[QrScanner-${readerId}] Attempting to start scanner with facingMode: ${mode}, attempt: ${attempt + 1}`);
    setIsCameraInitialized(false); // Reset initialization state

    if (startCameraTimeoutRef.current) {
      clearTimeout(startCameraTimeoutRef.current);
    }
    startCameraTimeoutRef.current = setTimeout(() => {
      if (isMounted.current && !isCameraInitialized) {
        console.error(`[QrScanner-${readerId}] Camera initialization timed out (10s).`);
        onError("Camera initialization timed out. Please try again.");
        setIsCameraInitialized(false);
        stopAndClearScanner();
      }
    }, 10000); // 10 seconds timeout

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
    };

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error("No camera devices found on this device.");
      }
      console.log(`[QrScanner-${readerId}] Found ${devices.length} camera(s).`);

      let cameraId: string | undefined;
      if (mode === "environment") {
        // Try to find the back camera explicitly
        const environmentCamera = devices.find(device => {
          if (!device) return false; // Defensive check
          const label = String(device.label || '').toLowerCase(); // Ensure label is a string
          return label.includes('back') || label.includes('environment');
        });
        if (environmentCamera) {
          cameraId = environmentCamera.id;
          console.log(`[QrScanner-${readerId}] Using environment camera ID: ${cameraId}`);
        } else {
          // Fallback to first available if no explicit back camera found
          cameraId = devices[0].id;
          console.log(`[QrScanner-${readerId}] No explicit environment camera found, using first available ID: ${cameraId}`);
        }
      } else { // user facing mode
        const userCamera = devices.find(device => {
          if (!device) return false; // Defensive check
          const label = String(device.label || '').toLowerCase(); // Ensure label is a string
          return label.includes('front') || label.includes('user');
        });
        if (userCamera) {
          cameraId = userCamera.id;
          console.log(`[QrScanner-${readerId}] Using user camera ID: ${cameraId}`);
        } else {
          // Fallback to first available if no explicit front camera found
          cameraId = devices[0].id;
          console.log(`[QrScanner-${readerId}] No explicit user camera found, using first available ID: ${cameraId}`);
        }
      }

      if (!cameraId) {
        throw new Error("Could not determine a camera to use.");
      }

      await qrCode.start(
        cameraId, // Use explicit camera ID
        config,
        async (decodedText) => {
          if (startCameraTimeoutRef.current) clearTimeout(startCameraTimeoutRef.current);
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
      if (startCameraTimeoutRef.current) clearTimeout(startCameraTimeoutRef.current);
      if (isMounted.current) {
        console.log(`[QrScanner-${readerId}] Camera initialized successfully.`);
        setIsCameraInitialized(true);
        onReady();
        retryCountRef.current = 0; // Reset retry count on success
      }
    } catch (err: any) {
      if (startCameraTimeoutRef.current) clearTimeout(startCameraTimeoutRef.current);
      if (isMounted.current) {
        console.error(`[QrScanner-${readerId}] Failed to start camera:`, err);
        setIsCameraInitialized(false); // Explicitly set to false on start failure

        let userFriendlyError = "Failed to start camera.";
        if (err.name === "NotAllowedError") {
          userFriendlyError = "Camera access denied. Please grant camera permissions in your browser settings.";
        } else if (err.name === "NotFoundError") {
          userFriendlyError = "No camera found on this device.";
        } else if (err.name === "NotReadableError") {
          userFriendlyError = "Camera is already in use or unavailable.";
        } else if (err.name === "OverconstrainedError") {
          userFriendlyError = "Camera could not be started with requested settings.";
        } else if (err.message.includes("No camera devices found")) {
          userFriendlyError = "No camera devices found on this device.";
        }

        if (attempt < MAX_RETRIES) {
          console.log(`[QrScanner-${readerId}] Retrying camera start in ${RETRY_DELAY_MS}ms... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
          retryCountRef.current = attempt + 1;
          setTimeout(() => startScanner(mode, attempt + 1), RETRY_DELAY_MS);
        } else {
          onError(userFriendlyError);
          stopAndClearScanner(); // Attempt to clean up even on start failure
        }
      }
    }
  }, [readerId, onScan, onError, onReady, stopAndClearScanner, facingMode]);


  // Effect for initial mount and unmount
  useEffect(() => {
    isMounted.current = true;
    console.log(`[QrScanner-${readerId}] Component mounted.`);
    // Initial start of the scanner
    startScanner(facingMode);

    // Cleanup function for when the component unmounts
    return () => {
      isMounted.current = false;
      console.log(`[QrScanner-${readerId}] Component unmounted. Performing final cleanup.`);
      stopAndClearScanner();
    };
  }, []); // Empty dependency array for mount/unmount only

  // Effect for facingMode changes
  useEffect(() => {
    if (isMounted.current) {
      console.log(`[QrScanner-${readerId}] Facing mode changed to: ${facingMode}. Stopping current scanner and restarting.`);
      // Explicitly stop and clear before starting a new one
      stopAndClearScanner().then(() => {
        // After a clean stop, then start the scanner with the new mode
        startScanner(facingMode);
      });
    }
  }, [facingMode, startScanner, readerId, stopAndClearScanner]);


  return (
    <div className="w-full h-full flex justify-center items-center relative">
      {/* Loading overlay */}
      {!isCameraInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-lg z-10">
          {retryCountRef.current > 0 ? `Retrying camera... (${retryCountRef.current}/${MAX_RETRIES})` : "Initializing camera..."}
        </div>
      )}
      {/* The element where the camera stream will be rendered */}
      <div id={readerId} className="w-full h-full" />
    </div>
  );
});

export default QrScanner;