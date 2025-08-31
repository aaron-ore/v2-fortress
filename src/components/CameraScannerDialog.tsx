"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, // NEW: Import DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, XCircle, QrCode, Keyboard } from "lucide-react"; // NEW: Import Keyboard icon
import QrScanner, { QrScannerRef } from "@/components/QrScanner";
import { Input } from "@/components/ui/input"; // NEW: Import Input
import { Label } from "@/components/ui/label"; // NEW: Import Label
import { showSuccess, showError } from "@/utils/toast"; // NEW: Import showSuccess, showError
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
  const [manualInputMode, setManualInputMode] = useState(false); // NEW: State for manual input mode
  const [manualInputValue, setManualInputValue] = useState(""); // NEW: State for manual input value

  useEffect(() => {
    if (isOpen) {
      setIsScannerLoading(true);
      setScannerError(null);
      setManualInputMode(false); // Reset to camera mode when dialog opens
      setManualInputValue("");
    } else {
      qrScannerRef.current?.stopAndClear();
    }
  }, [isOpen]);

  const handleScannerScan = (decodedText: string) => {
    onScanSuccess(decodedText);
    // onClose(); // Let the parent decide to close
  };

  const handleScannerError = (errorMessage: string) => {
    setScannerError(errorMessage);
    setIsScannerLoading(false);
  };

  const handleScannerReady = () => {
    setIsScannerLoading(false);
    setScannerError(null);
  };

  const toggleFacingMode = async () => {
    setScannerFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    setIsScannerLoading(true);
    setScannerError(null);
  };

  const handleRetryScan = () => {
    setScannerError(null);
    setIsScannerLoading(true);
    qrScannerRef.current?.retryStart(); // Call the new retry function
  };

  const handleManualInputSubmit = () => {
    if (manualInputValue.trim()) {
      onScanSuccess(manualInputValue.trim());
      showSuccess("Manual input submitted!");
      onClose();
    } else {
      showError("Please enter a barcode or QR code value.");
    }
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
          {manualInputMode ? (
            <div className="flex flex-col items-center justify-center p-6 w-full h-full bg-background text-foreground">
              <Keyboard className="h-12 w-12 text-muted-foreground mb-4" />
              <Label htmlFor="manual-barcode-input" className="text-lg font-semibold mb-2">Enter Barcode / QR Value</Label>
              <Input
                id="manual-barcode-input"
                placeholder="Type code here..."
                value={manualInputValue}
                onChange={(e) => setManualInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualInputSubmit();
                  }
                }}
                className="w-full max-w-xs mb-4"
              />
              <Button onClick={handleManualInputSubmit} className="w-full max-w-xs">Submit</Button>
            </div>
          ) : (
            <div className="relative w-full pb-[100%]">
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
                  <Button onClick={handleRetryScan} className="mt-4" variant="secondary">Retry Camera</Button>
                </div>
              )}
              <div className="absolute inset-0">
                <QrScanner
                  ref={qrScannerRef}
                  onScan={handleScannerScan}
                  onError={handleScannerError}
                  onReady={handleScannerReady}
                  facingMode={scannerFacingMode}
                  isOpen={isOpen && !manualInputMode} // Only active when dialog is open AND not in manual input mode
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between p-4 pt-2 gap-2">
          <Button variant="secondary" onClick={() => setManualInputMode(prev => !prev)} className="w-full sm:w-auto">
            {manualInputMode ? (
              <>
                <Camera className="h-4 w-4 mr-2" /> Use Camera
              </>
            ) : (
              <>
                <Keyboard className="h-4 w-4 mr-2" /> Manual Input
              </>
            )}
          </Button>
          {!manualInputMode && (
            <Button variant="outline" onClick={toggleFacingMode} className="w-full sm:w-auto" disabled={isScannerLoading || !!scannerError}>
              <Camera className="h-4 w-4 mr-2" /> Switch to {scannerFacingMode === "user" ? "Back" : "Front"} Camera
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CameraScannerDialog;