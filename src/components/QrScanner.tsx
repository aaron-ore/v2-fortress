import React, { useEffect, useRef, useState, useMemo } from 'react';
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

  useEffect(() => {
    console.log(`[QrScanner] useEffect triggered for facingMode: ${facingMode}, readerId: ${readerId}`);

    // Consolidated cleanup function for scanner instance
    const cleanupScanner = async () => {
      if (html5QrCodeRef.current) {
        console.log(`[QrScanner] Attempting to stop and clear scanner for readerId: ${readerId}.`);
        try {
          // Stop scanning if active
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
            console.log(`[QrScanner] Scanner stopped successfully for readerId: ${readerId}.`);
          }
          // Clear UI and release camera resources
          await html5QrCodeRef.current.clear(); 
          console.log(`[QrScanner] Scanner UI cleared and resources released for readerId: ${readerId}.`);
        } catch (e) {
          console.warn(`[QrScanner] Error during scanner cleanup for readerId: ${readerId}:`, e);
          // This is the error we are trying to fix. Log it but don't re-throw.
        }
      }
      html5QrCodeRef.current = null;
      setIsCameraInitialized(false);
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
      lastReportedErrorRef.current = null;
    };

    // Call cleanup for any existing scanner before starting a new one
    // This handles cases where dependencies change and the effect re-runs.
    cleanupScanner();

    const qrCode = new Html5Qrcode(readerId, { verbose: false });
    html5QrCodeRef.current = qrCode; // Store the new instance

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
    };

    const startScanner = async () => {
      console.log(`[QrScanner] Starting scanner for readerId: ${readerId} with facingMode: ${facingMode}`);
      try {
        await qrCode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            console.log(`[QrScanner] Scan success for readerId: ${readerId}: ${decodedText}`);
            // Stop scanner immediately on successful scan
            if (qrCode.isScanning) {
              qrCode.stop().then(() => {
                onScan(decodedText);
              }).catch(e => console.error(`[QrScanner] Error stopping scanner after scan for readerId: ${readerId}:`, e));
            } else {
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
              lowerCaseMessage.includes("notfoundexception") || // Explicitly filter this common non-critical error
              lowerCaseMessage.includes("notallowederror") // Filter this common non-critical error
            ) {
              return;
            }

            if (lastReportedErrorRef.current !== errorMessage) {
              lastReportedErrorRef.current = errorMessage;
              if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
              }
              errorTimeoutRef.current = setTimeout(() => {
                console.error(`[QrScanner] Reported error for readerId: ${readerId}: ${errorMessage}`);
                onError(errorMessage);
                errorTimeoutRef.current = null;
              }, 1000);
            }
          }
        );
        console.log(`[QrScanner] Camera initialized successfully for readerId: ${readerId}.`);
        setIsCameraInitialized(true);
        onReady();
      } catch (err: any) {
        console.error(`[QrScanner] Failed to start camera for readerId: ${readerId}:`, err);
        onError(err.message || "Failed to start camera.");
        setIsCameraInitialized(false);
      }
    };

    startScanner();

    // The return function of useEffect is the cleanup for the current effect run.
    // It will be called when the component unmounts OR when dependencies change (before the new effect runs).
    return () => {
      console.log(`[QrScanner] Cleanup function called for readerId: ${readerId} on unmount/dependency change.`);
      cleanupScanner(); // Use the defined cleanup function
    };
  }, [facingMode, onScan, onError, onReady, readerId]);

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