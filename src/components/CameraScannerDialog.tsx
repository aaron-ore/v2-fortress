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
import BarcodeReader from "react-barcode-reader"; // Reverted to default import
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

  useEffect(() => {
    if (isOpen) {
      setIsCameraActive(true);
    } else {
      setIsCameraActive(false);
    }
  }, [isOpen]);

  const handleScan = (result: string) => {
    if (result) {
      onScan(result);
      onClose();
    }
  };

  const handleError = (err: any) => {
    console.error("Barcode scan error:", err);
    if (isCameraActive) {
      onError(err.message || "Unknown camera error");
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
            Point your camera at a barcode.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center bg-black rounded-md overflow-hidden relative">
          {isCameraActive && (
            <BarcodeReader
              onReceive={handleScan}
              onError={handleError}
            />
          )}
          {!isCameraActive && (
            <div className="text-muted-foreground text-center">
              Scanner is not active.
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