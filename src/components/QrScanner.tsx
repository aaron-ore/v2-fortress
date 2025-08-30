"use client";

import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeFullConfig, Html5QrcodeCameraScanConfig } from "html5-qrcode";
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

type ScannerType = 'html5-qrcode' | 'react-qr-reader';

const QrScanner = forwardRef<QrScannerRef, QrScannerProps>(
  ({ onScan, onError, onReady, facingMode }, ref) => {
    const scannerDivRef = useRef<HTMLDivElement>(null);
    const html5QrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
    const isMounted = useRef(true);

    const [activeScannerType, setActiveScannerType] = useState<ScannerType>('html5-qrcode');
    const [isScannerReady, setIsScannerReady] = useState(false);

    const html5QrcodeConstructorConfig: Html5QrcodeFullConfig = {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
      ],
      verbose: false,
    };

    const html5QrcodeCameraScanConfig: Html5QrcodeCameraScanConfig = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      disableFlip: false,
    };

    const stopAndClearHtml5Qrcode = useCallback(async () => {
      if (html5QrCodeInstanceRef.current) {
        console.log("[QrScanner] Attempting to stop Html5Qrcode instance...");
        try {
          if (typeof html5QrCodeInstanceRef.current.stop === 'function') {
            await html5QrCodeInstanceRef.current.stop();
            console.log("[QrScanner] Html5Qrcode stopped successfully.");
          }
          if (typeof html5QrCodeInstanceRef.current.clear === 'function') {
            html5QrCodeInstanceRef.current.clear();
            console.log("[QrScanner] Html5Qrcode cleared successfully.");
          }
        } catch (e) {
          console.warn("[QrScanner] Error stopping/clearing Html5Qrcode (might be already stopped or camera not found):", e);
        } finally {
          html5QrCodeInstanceRef.current = null;
        }
      } else {
        console.log("[QrScanner] No active Html5Qrcode instance to stop.");
      }
    }, []);

    const stopAndClear = useCallback(async () => {
      await stopAndClearHtml5Qrcode();
      setActiveScannerType('html5-qrcode');
      setIsScannerReady(false);
    }, [stopAndClearHtml5Qrcode]);

    useImperativeHandle(ref, () => ({
      stopAndClear: stopAndClear,
    }));

    const tryStartHtml5Qrcode = useCallback(async (element: HTMLDivElement, constraints: MediaTrackConstraints, strategyName: string): Promise<boolean | string> => {
      if (!isMounted.current) return false;

      console.log(`[QrScanner - ${strategyName}] Attempting to start Html5Qrcode with constraints:`, constraints);
      await stopAndClearHtml5Qrcode();

      try {
        const newScanner = new Html5Qrcode(element.id, html5QrcodeConstructorConfig);
        html5QrCodeInstanceRef.current = newScanner;

        if (!newScanner || typeof newScanner.start !== 'function') {
          console.error(`[QrScanner - ${strategyName}] Html5Qrcode instance is invalid or 'start' method is missing.`);
          return false;
        }

        await newScanner.start(
          constraints,
          html5QrcodeCameraScanConfig,
          (decodedText) => {
            if (isMounted.current) {
              console.log(`[QrScanner - ${strategyName}] Scan successful:`, decodedText);
              onScan(decodedText);
            }
          },
          (errorMessage) => {
            if (isMounted.current && !errorMessage.includes("No QR code found")) {
              console.warn(`[QrScanner - ${strategyName}] Scan error (not 'No QR code found'):`, errorMessage);
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
          console.error(`[QrScanner - ${strategyName}] Critical error during Html5Qrcode start:`, err);
          return err.name || false;
        }
        return false;
      }
    }, [onScan, onReady, stopAndClearHtml5Qrcode, html5QrcodeConstructorConfig, html5QrcodeCameraScanConfig]);


    const attemptStrategies = useCallback(async () => {
      if (!isMounted.current) return;

      const element = scannerDivRef.current;
      if (!element) {
        console.error("[QrScanner] Scanner target element (ref) not found in DOM. Cannot start any strategy.");
        onError("Scanner target element not found.");
        return;
      }

      await stopAndClear();

      console.log("[QrScanner] Starting camera initialization strategies...");

      const cameras = await Html5Qrcode.getCameras().catch(e => {
        console.warn("[QrScanner] Failed to get camera list:", e);
        return [];
      });
      console.log("[QrScanner] Available cameras:", cameras);

      const strategies = [
        {
          name: "Html5Qrcode - Default (Short Delay)",
          exec: async () => await tryStartHtml5Qrcode(element, { facingMode: facingMode }, "Strategy 1")
        },
        {
          name: "Html5Qrcode - Default (Longer Delay)",
          exec: async () => {
            await new Promise(resolve => setTimeout(resolve, 400));
            return await tryStartHtml5Qrcode(element, { facingMode: facingMode }, "Strategy 2");
          }
        },
        {
          name: "Html5Qrcode - Explicit Environment Camera",
          exec: async () => {
            const environmentCamera = cameras.find(camera => camera.label.toLowerCase().includes('back') || camera.label.toLowerCase().includes('environment'));
            if (environmentCamera) {
              return await tryStartHtml5Qrcode(element, { deviceId: { exact: environmentCamera.id } }, "Strategy 3");
            }
            console.log("[QrScanner] No explicit 'environment' camera found for Strategy 3.");
            return false;
          }
        },
        {
          name: "Html5Qrcode - Explicit User Camera",
          exec: async () => {
            const userCamera = cameras.find(camera => camera.label.toLowerCase().includes('front') || camera.label.toLowerCase().includes('user'));
            if (userCamera) {
              return await tryStartHtml5Qrcode(element, { deviceId: { exact: userCamera.id } }, "Strategy 4");
            }
            console.log("[QrScanner] No explicit 'user' camera found for Strategy 4.");
            return false;
          }
        },
        {
          name: "react-qr-reader Fallback",
          exec: async () => {
            console.log("[QrScanner] Attempting Strategy 5: Fallback to react-qr-reader.");
            setActiveScannerType('react-qr-reader');
            onReady();
            setIsScannerReady(true);
            return true;
          }
        }
      ];

      let lastErrorName: string | null = null;
      for (let i = 0; i < strategies.length; i++) {
        console.log(`[QrScanner] Executing strategy ${i + 1}/${strategies.length}: ${strategies[i].name}...`);
        let result = await strategies[i].exec();

        if (typeof result === 'string' && result === "NotReadableError" && i < strategies.length - 1) {
          console.warn(`[QrScanner] Strategy ${i + 1} failed with NotReadableError. Retrying once...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          result = await strategies[i].exec();
        }

        if (result === true) {
          console.log(`[QrScanner] Strategy ${i + 1} (${strategies[i].name}) succeeded.`);
          setActiveScannerType(i < strategies.length - 1 ? 'html5-qrcode' : 'react-qr-reader');
          return;
        } else if (typeof result === 'string') {
          lastErrorName = result;
        } else {
          lastErrorName = "UnknownError";
        }
        console.log(`[QrScanner] Strategy ${i + 1} (${strategies[i].name}) failed. Trying next.`);
        await stopAndClearHtml5Qrcode();
      }

      console.error("[QrScanner] All camera initialization strategies failed.");
      let finalErrorMessage = "All camera initialization attempts failed. ";
      if (lastErrorName === "NotReadableError") {
        finalErrorMessage += "The camera might be in use by another application, or there's a temporary hardware issue. Please close other apps using the camera, restart your browser, or try a different device.";
      } else if (lastErrorName === "NotAllowedError") {
        finalErrorMessage += "Camera access was denied. Please check your browser's site permissions for this page.";
      } else if (cameras.length === 0) {
        finalErrorMessage += "No cameras were detected on this device.";
      } else {
        finalErrorMessage += "Please check camera permissions and try again.";
      }
      onError(finalErrorMessage);
      setIsScannerReady(false);
    }, [facingMode, onScan, onError, onReady, stopAndClear, stopAndClearHtml5Qrcode, tryStartHtml5Qrcode]);

    useEffect(() => {
      isMounted.current = true;
      console.log("[QrScanner] Component mounted or facingMode changed. Initiating strategy attempts...");
      
      const timer = setTimeout(() => {
        if (scannerDivRef.current) {
          attemptStrategies();
        } else {
          console.warn("[QrScanner] scannerDivRef.current is null after initial timeout. Retrying strategy attempts.");
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

    const handleQrReaderResult = (result: any, error: any) => {
      if (result) {
        console.log("[QrScanner - react-qr-reader] Scan successful:", result.text);
        onScan(result.text);
      }
      if (error && !error.message.includes("No QR code found")) {
        console.warn("[QrScanner - react-qr-reader] Scan error:", error.message);
      }
    };

    if (activeScannerType === 'react-qr-reader') {
      return (
        <div className="w-full h-full">
          {isScannerReady && (
            <QrReader
              onResult={handleQrReaderResult}
              constraints={{ facingMode: facingMode }}
              containerStyle={{ width: '100%', height: '100%' }}
              videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      );
    }

    return <div id="qr-code-full-region" ref={scannerDivRef} className="w-full h-full" />;
  }
);

QrScanner.displayName = "QrScanner";

export default QrScanner;