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
    // Ensure camera is stopped and then close the dialog after a small delay
    handleCloseDialog(true); // Pass true to indicate error-triggered close
  };

  const handleScannerScan = (decodedText: string) => {
    setIsLoadingCamera(false);
    onScan(decodedText);
    // Ensure camera is stopped and then close the dialog after a small delay
    handleCloseDialog(false); // Pass false to indicate scan-triggered close
  };

  const toggleFacingMode = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    setIsLoadingCamera(true);
    setCameraError(null);
  };

  // Function to handle dialog closure, including scanner cleanup and optional delay
  const handleCloseDialog = async (isError: boolean = false) => {
    if (qrScannerRef.current) {
      console.log("[CameraScannerDialog] Calling QrScanner's stopAndClear.");
      await qrScannerRef.current.stopAndClear();
    }

    // Add a small delay *after* cleanup, especially for errors or quick scans,
    // to give the browser a moment before the component unmounts.
    // This is a common pattern for external media APIs.
    setTimeout(() => {
      onClose();
    }, isError ? 200 : 100); // Slightly longer delay for errors
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
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
                ref={qrScannerRef}
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
          <Button variant="outline" onClick={() => handleCloseDialog(false)} className="w-full sm:w-auto">
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