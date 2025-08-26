import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import BarcodeReader from "react-barcode-reader"; // Changed import to react-barcode-reader
import { Scan, XCircle } from "lucide-react"; // Changed icon to Scan
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

  useEffect(() => {
    if (isOpen) {
      setIsCameraActive(true);
    } else {
      setIsCameraActive(false);
    }
  }, [isOpen]);

  const handleScan = (result: string) => { // result is directly the string from react-barcode-reader
    if (result) {
      onScan(result);
      onClose(); // Close dialog after successful scan
    }
  };

  const handleError = (err: any) => {
    console.error("Barcode scan error:", err);
    if (isCameraActive) { // Only show error if camera was actively trying to scan
      onError(err.message || "Unknown camera error");
      onClose(); // Close dialog on error
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
            Point your camera at a barcode.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center bg-black rounded-md overflow-hidden relative">
          {isCameraActive && (
            <BarcodeReader
              onReceive={handleScan} // Use onReceive for successful scans
              onError={handleError}
              // No 'constraints' or 'facingMode' props for react-barcode-reader
              // The component typically uses the default camera (often the back camera on mobile)
            />
          )}
          {!isCameraActive && (
            <div className="text-muted-foreground text-center">
              Scanner is not active.
            </div>
          )}
          {/* Removed the "Toggle Camera" button */}
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