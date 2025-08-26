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
import { QrReader } from "react-qr-reader"; // Using react-qr-reader
import { Camera, XCircle } from "lucide-react";
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
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment"); // 'environment' for back camera

  useEffect(() => {
    if (isOpen) {
      setIsCameraActive(true);
    } else {
      setIsCameraActive(false);
    }
  }, [isOpen]);

  const handleScan = (result: string | null | undefined) => {
    if (result) {
      onScan(result);
      onClose(); // Close dialog after successful scan
    }
  };

  const handleError = (err: any) => {
    console.error("Camera scan error:", err);
    if (isCameraActive) { // Only show error if camera was actively trying to scan
      onError(err.message || "Unknown camera error");
      onClose(); // Close dialog on error
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === "user" ? "environment" : "user"));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] flex flex-col h-[80vh] max-h-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" /> Scan Barcode/QR
          </DialogTitle>
          <DialogDescription>
            Point your camera at a barcode or QR code.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center bg-black rounded-md overflow-hidden relative">
          {isCameraActive && (
            <QrReader
              onResult={(result, error) => {
                if (!!result) {
                  handleScan(result?.getText());
                }

                if (!!error) {
                  // console.info(error); // Log errors but don't show toast for every minor detection issue
                }
              }}
              onError={handleError}
              constraints={{ facingMode: facingMode }}
              scanDelay={300} // Delay between scans
              videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
              containerStyle={{ width: '100%', height: '100%', padding: 0 }}
              videoContainerStyle={{ width: '100%', height: '100%', padding: 0 }}
            />
          )}
          {!isCameraActive && (
            <div className="text-muted-foreground text-center">
              Camera is not active.
            </div>
          )}
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 right-4 z-10"
            onClick={toggleFacingMode}
            title="Toggle Camera"
          >
            <Camera className="h-5 w-5" />
          </Button>
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