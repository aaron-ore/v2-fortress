"use client";

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from "react";
import { QrReader } from 'react-qr-reader';

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
    const [isScannerReady, setIsScannerReady] = useState(false);
    const isMounted = useRef(true);

    // This function is primarily for external calls to stop the scanner.
    // react-qr-reader handles its own internal lifecycle based on props and unmount.
    const stopAndClear = useCallback(async () => {
      console.log("[QrScanner] External stopAndClear called.");
      // For react-qr-reader, stopping usually means unmounting or changing constraints.
      // We'll just reset internal state.
      setIsScannerReady(false);
      // No explicit stop API for react-qr-reader, it manages stream based on component lifecycle.
    }, []);

    useImperativeHandle(ref, () => ({
      stopAndClear: stopAndClear,
    }));

    // Effect to manage component mount/unmount lifecycle
    useEffect(() => {
      isMounted.current = true;
      console.log("[QrScanner] Component mounted.");
      setIsScannerReady(true); // Assume ready to render react-qr-reader
      onReady(); // Notify parent that scanner component is ready to display

      return () => {
        isMounted.current = false;
        console.log("[QrScanner] Component unmounting. Stopping scanner...");
        stopAndClear();
      };
    }, [onReady, stopAndClear]);

    // Handle results from react-qr-reader
    const handleQrReaderResult = (result: any, error: any) => {
      if (result) {
        if (isMounted.current) {
          console.log("[QrScanner - react-qr-reader] Scan successful:", result.text);
          onScan(result.text);
        }
      }
      if (error && !error.message.includes("No QR code found")) {
        if (isMounted.current) {
          console.warn("[QrScanner - react-qr-reader] Scan error:", error.message);
          // Only report significant errors, not just "no code found"
          onError(error.message);
        }
      }
    };

    return (
      <div className="w-full h-full">
        {isScannerReady && (
          <QrReader
            key={facingMode} // Force remount/reinitialization when facingMode changes
            onResult={handleQrReaderResult}
            constraints={{ facingMode: facingMode }}
            containerStyle={{ width: '100%', height: '100%' }}
            videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>
    );
  }
);

QrScanner.displayName = "QrScanner";

export default QrScanner;