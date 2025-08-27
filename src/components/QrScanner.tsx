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
  const readerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);

  // Generate a unique ID for the reader element to ensure it's distinct
  const readerId = useMemo(() => `qr-reader-${Math.random().toString(36).substring(2, 9)}`, []);

  useEffect(() => {
    if (!readerRef.current) {
      return;
    }

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

    html5QrCodeRef.current = new Html5Qrcode(readerId, { verbose: false });

    const qrCode = html5QrCodeRef.current;
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
            // Error callback: called continuously if no QR code is found.
            // Only report significant errors, not just "no QR code found".
            if (!errorMessage.includes("No QR code found")) {
              onError(errorMessage);
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
      <div id={readerId} ref={readerRef} className="w-full h-full" />
    </div>
  );
};

export default QrScanner;