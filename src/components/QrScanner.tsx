import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
  onReady: () => void;
  facingMode: "user" | "environment";
}

const QrScanner: React.FC<QrScannerProps> = ({ onScan, onError, onReady, facingMode }) => {
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
      console.log(`[QrScanner] Attempting to stop and clear scanner for readerId: ${readerId}.`);
      try {
        if (qrCode.isScanning) {
          await qrCode.stop();
          console.log(`[QrScanner] Scanner stopped successfully for readerId: ${readerId}.`);
        }
        await qrCode.clear();
        console.log(`[QrScanner] Scanner UI cleared and resources released for readerId: ${readerId}.`);
      } catch (e) {
        // This error is often "Cannot access video stream" if camera was already off or failed to start.
        // It's usually safe to ignore during cleanup.
        console.warn(`[QrScanner] Error during scanner cleanup for readerId: ${readerId}:`, e);
      } finally {
        html5QrCodeRef.current = null;
        if (isMounted.current) { // Only update state if still mounted
          setIsCameraInitialized(false);
        }
        if (errorTimeoutRef.current) {
          clearTimeout(errorTimeoutRef.current);
          errorTimeoutRef.current = null;
        }
        lastReportedErrorRef.current = null;
      }
    }
  }, [readerId]); // Dependencies for useCallback

  useEffect(() => {
    isMounted.current = true; // Component is mounted

    // Call cleanup when facingMode changes or component mounts
    stopAndClearScanner();

    const qrCode = new Html5Qrcode(readerId, { verbose: false });
    html5QrCodeRef.current = qrCode;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
    };

    const startScanner = async () => {
      if (!isMounted.current) return; // Don't start if component unmounted

      console.log(`[QrScanner] Starting scanner for readerId: ${readerId} with facingMode: ${facingMode}`);
      try {
        await qrCode.start(
          { facingMode: facingMode },
          config,
          async (decodedText) => { // Make this async to await stop()
            console.log(`[QrScanner] Scan success for readerId: ${readerId}: ${decodedText}`);
            // Stop scanner immediately on successful scan
            if (qrCode.isScanning) {
              await qrCode.stop(); // Await stop before calling onScan
              console.log(`[QrScanner] Scanner stopped after successful scan for readerId: ${readerId}.`);
            }
            if (isMounted.current) { // Only call onScan if still mounted
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
              lowerCaseMessage.includes("overconstrainederror") // Added this
            ) {
              return;
            }

            if (lastReportedErrorRef.current !== errorMessage) {
              lastReportedErrorRef.current = errorMessage;
              if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
              }
              errorTimeoutRef.current = setTimeout(() => {
                if (isMounted.current) { // Only report error if still mounted
                  console.error(`[QrScanner] Reported error for readerId: ${readerId}: ${errorMessage}`);
                  onError(errorMessage);
                }
                errorTimeoutRef.current = null;
              }, 1000);
            }
          }
        );
        if (isMounted.current) { // Only update state if still mounted
          console.log(`[QrScanner] Camera initialized successfully for readerId: ${readerId}.`);
          setIsCameraInitialized(true);
          onReady();
        }
      } catch (err: any) {
        if (isMounted.current) { // Only report error if still mounted
          console.error(`[QrScanner] Failed to start camera for readerId: ${readerId}:`, err);
          onError(err.message || "Failed to start camera.");
          setIsCameraInitialized(false);
        }
      }
    };

    startScanner();

    // Cleanup function for when the component unmounts
    return () => {
      isMounted.current = false; // Component is unmounting
      console.log(`[QrScanner] Cleanup function called for readerId: ${readerId} on unmount.`);
      stopAndClearScanner();
    };
  }, [facingMode, onScan, onError, onReady, readerId, stopAndClearScanner]); // Added stopAndClearScanner to dependencies

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
};

export default QrScanner;