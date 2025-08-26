import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrReader } from "react-qr-reader"; // Changed to react-qr-reader
import { Scan, XCircle } from "lucide-react";
import { showError } from "@/utils/toast";

interface CameraScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedData: string) => void;
  onError: (error: string) => void;
}

const CameraScannerDialog: React.FC<CameraScannerDialogProps> = ({
  isOpen,
  onClose,
  onScan,
  onError,
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment"); // Default to back camera

  useEffect(() => {
    if (isOpen) {
      setIsCameraActive(true);
    } else {
      setIsCameraActive(false);
    }
  }, [isOpen]);

  const handleScanResult = (result: any, error: any) => {
    if (!!result) {
      onScan(result?.text);
      onClose();
    }

    if (!!error && isCameraActive) {
      // Log errors but don't necessarily close the dialog unless it's a critical camera error
      // console.error("QR Reader error:", error);
    }
  };

  const handleCameraError = (err: any) => {
    console.error("Camera access error:", err);
    if (isCameraActive) {
      onError(err.message || "Failed to access camera.");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] flex flex-col h-[80vh] max-h-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-6 w-6 text-primary" /> Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Point your camera at a barcode or QR code.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center bg-black rounded-md overflow-hidden relative">
          {isCameraActive ? (
            <QrReader
              onResult={handleScanResult}
              videoContainerStyle={{ width: '100%', height: '100%', padding: 0 }}
              videoStyle={{ objectFit: 'cover' }}
              constraints={{ facingMode: facingMode }}
              scanDelay={300} // Add a small delay to prevent multiple rapid scans
              onErrorHandler={handleCameraError} // Handle camera access errors
            />
          ) : (
            <div className="text-muted-foreground text-center">
              Camera is not active.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <XCircle className="h-4 w-4 mr-2" /> Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CameraScannerDialog;