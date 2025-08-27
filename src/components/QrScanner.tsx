import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode'; // Import Html5Qrcode
import { showError } from '@/utils/toast';

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
  onReady: () => void;
  facingMode: "user" | "environment";
}

const QrScanner: React.FC<QrScannerProps> = ({ onScan, onError, onReady, facingMode }) => {
  // Generate a unique ID for the reader element to ensure it's distinct
  const readerId = useMemo(() => `qr-reader-${Math.random().toString(36).substring(2, 9)}`, []);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const lastReportedErrorRef = useRef<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ensure any previous scanner instance is stopped before creating a new one
    const stopPreviousScanner = async () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        try {
          await html5QrCodeRef.current.stop();
          console.log("Previous Html5QrcodeScanner stopped.");
        } catch (e) {
          console.warn("Error stopping previous Html5Qrcode instance:", e);
        }
      }
      html5QrCodeRef.current = null;
    };

    stopPreviousScanner(); // Stop any existing scanner before starting a new one

    const qrCode = new Html5Qrcode(readerId, { verbose: false });
    html5QrCodeRef.current = qrCode;

    const config = {
      fps: 10, // Frames per second to scan code.
      qrbox: { width: 250, height: 250 }, // Area within which to scan code.
      aspectRatio: 1.0, // Force 1:1 aspect ratio for the video stream
      disableFlip: false, // Disable flip to prevent issues with some devices
    };

    const startScanner = async () => {
      try {
        await qrCode.start(
          { facingMode: facingMode }, // Specify camera facing mode
          config,
          (decodedText) => {
            // Success callback: stop scanner and report result
            if (qrCode.isScanning) {
              qrCode.stop().then(() => {
                onScan(decodedText);
              }).catch(e => console.error("Error stopping scanner after scan:", e));
            } else {
              onScan(decodedText); // If not scanning, just report
            }
          },
          (errorMessage) => {
            // Filter out common non-critical messages that spam the console
            const lowerCaseMessage = errorMessage.toLowerCase();
            if (
              lowerCaseMessage.includes("no qr code found") ||
              lowerCaseMessage.includes("qr code parse error") ||
              lowerCaseMessage.includes("decode error") ||
              lowerCaseMessage.includes("could not find any device") // Often happens if camera is not ready yet
            ) {
              // These are expected during normal scanning or initial camera setup, don't spam console or parent error
              return;
            }

            // Debounce and report unique critical errors to parent
            if (lastReportedErrorRef.current !== errorMessage) {
              lastReportedErrorRef.current = errorMessage;
              if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
              }
              errorTimeoutRef.current = setTimeout(() => {
                onError(errorMessage);
                errorTimeoutRef.current = null;
              }, 1000); // Report unique errors to parent after 1 second debounce
            }
          }
        );
        setIsCameraInitialized(true);
        onReady();
      } catch (err: any) {
        console.error("Html5QrcodeScanner start error:", err);
        onError(err.message || "Failed to start camera.");
        setIsCameraInitialized(false);
      }
    };

    startScanner();

    // Cleanup function: stop the camera when the component unmounts
    return () => {
      if (qrCode.isScanning) {
        qrCode.stop().then(() => {
          console.log("Html5QrcodeScanner stopped on unmount.");
        }).catch((err) => {
          console.error("Error stopping Html5QrcodeScanner on unmount:", err);
        });
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      html5QrCodeRef.current = null;
    };
  }, [facingMode, onScan, onError, onReady, readerId]); // Re-run effect if facingMode changes

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