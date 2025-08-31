"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, XCircle, QrCode } from "lucide-react";
import QrScanner, { QrScannerRef } from "@/components/QrScanner";
import { cn } from "@/lib/utils";

interface CameraScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  description?: string;
}

const CameraScannerDialog: React.FC<CameraScannerDialogProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = "Scan Barcode / QR Code",
  description = "Point your camera at a barcode or QR code to scan.",
}) => {
  const qrScannerRef = useRef<QrScannerRef>(null);
  const [scannerFacingMode, setScannerFacingMode] = useState<"user" | "environment">("environment");
  const [isScannerLoading, setIsScannerLoading] = useState(true);
  const [scannerError, setScannerError] = useState<string | null>(null);

  // Effect to manage scanner lifecycle with dialog open/close
  useEffect(() => {
    if (!isOpen && qrScannerRef.current) {
      // When dialog closes, stop the scanner
      qrScannerRef.current.stopAndClear();
      setIsScannerLoading(true); // Reset loading state
      setScannerError(null); // Clear any previous errors
    }
    // When dialog opens, the QrScanner component will mount/remount and start itself
  }, [isOpen]);

  const handleScannerScan = (decodedText: string) => {
    onScanSuccess(decodedText);
    onClose(); // Close dialog after successful scan
  };

  const handleScannerError = (errorMessage: string) => {
    setScannerError(errorMessage);
    // Do not close dialog on error, let user try again or switch camera
  };

  const handleScannerReady = () => {
    setIsScannerLoading(false);
    setScannerError(null);
  };

  const toggleFacingMode = () => {
    setScannerFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    setIsScannerLoading(true); // Indicate loading while camera switches
    setScannerError(null); // Clear error when switching
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] flex flex-col h-[80vh] max-h-[600px] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-grow flex flex-col items-center justify-center bg-black rounded-md overflow-hidden relative p-0">
          {/* Fixed aspect ratio container for the scanner */}
          <div className="relative w-full pb-[100%]"> {/* pb-[100%] creates a square aspect ratio */}
            {isScannerLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-lg z-10">
                Loading camera...
              </div>
            )}
            {scannerError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/70 text-white text-center p-4 z-10">
                <XCircle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Camera Error:</p>
                <p className="text-sm">{scannerError}</p>
                <p className="text-xs mt-2">Try switching cameras or closing other apps using the camera.</p>
              </div>
            )}
            <div className="absolute inset-0"> {/* This div ensures QrScanner fills the aspect ratio container */}
              <QrScanner
                // Removed key={scannerFacingMode}
                ref={qrScannerRef}
                onScan={handleScannerScan}
                onError={handleScannerError}
                onReady={handleScannerReady}
                facingMode={scannerFacingMode}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-auto p-4 pt-2">
          <Button variant="secondary" onClick={toggleFacingMode} className="w-full">
            <Camera className="h-4 w-4 mr-2" /> Switch to {scannerFacingMode === "user" ? "Back" : "Front"} Camera
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraScannerDialog;