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
import { Scan, XCircle, Camera } from "lucide-react";
import { showError } from "@/utils/toast";
import QrScanner, { QrScannerRef } from "./QrScanner"; // Import QrScannerRef

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
  const qrScannerRef = useRef<QrScannerRef>(null); // Ref for QrScanner component
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isLoadingCamera, setIsLoadingCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsCameraActive(true);
      setIsLoadingCamera(true);
      setCameraError(null);
    } else {
      setIsCameraActive(false);
      setIsLoadingCamera(false);
    }
  }, [isOpen]);

  const handleScannerReady = () => {
    setIsLoadingCamera(false);
    setCameraError(null);
  };

  const handleScannerError = (errMessage: string) => {
    console.error("QrScanner error:", errMessage);
    setIsLoadingCamera(false);
    setCameraError(errMessage);
    onError(errMessage);
    // No setTimeout here, rely on explicit cleanup
    handleCloseDialog();
  };

  const handleScannerScan = (decodedText: string) => {
    setIsLoadingCamera(false);
    onScan(decodedText);
    // No setTimeout here, rely on explicit cleanup
    handleCloseDialog();
  };

  const toggleFacingMode = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    setIsLoadingCamera(true);
    setCameraError(null);
  };

  // New function to handle dialog closure, including scanner cleanup
  const handleCloseDialog = async () => {
    if (qrScannerRef.current) {
      console.log("[CameraScannerDialog] Calling QrScanner's stopAndClear.");
      await qrScannerRef.current.stopAndClear();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}> {/* Use new handler here */}
      <DialogContent className="sm:max-w-[425px] flex flex-col h-[80vh] max-h-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-6 w-6 text-primary" /> Scan Barcode
          </DialogTitle>
          <DialogDescription>
            Point your camera at a barcode or QR code.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow flex flex-col items-center justify-center bg-black rounded-md overflow-hidden relative">
          {isCameraActive ? (
            <>
              {isLoadingCamera && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-lg z-10">
                  Loading camera...
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/70 text-white text-center p-4 z-10">
                  <XCircle className="h-8 w-8 mb-2" />
                  <p className="font-semibold">Camera Error:</p>
                  <p className="text-sm">{cameraError}</p>
                  <p className="text-xs mt-2">Try switching cameras or refreshing the page.</p>
                </div>
              )}
              <QrScanner
                ref={qrScannerRef} // Pass the ref
                key={facingMode}
                onScan={handleScannerScan}
                onError={handleScannerError}
                onReady={handleScannerReady}
                facingMode={facingMode}
              />
            </>
          ) : (
            <div className="text-muted-foreground text-center">
              Camera is not active.
            </div>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2 pt-4">
          <Button variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto"> {/* Use new handler here */}
            <XCircle className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <Button variant="secondary" onClick={toggleFacingMode} className="w-full sm:w-auto">
            <Camera className="h-4 w-4 mr-2" /> Switch to {facingMode === "user" ? "Back" : "Front"} Camera
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CameraScannerDialog;