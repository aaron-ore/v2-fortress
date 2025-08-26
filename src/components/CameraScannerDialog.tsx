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
import { QrReader } from "react-qr-reader";
import { Scan, XCircle, Camera } from "lucide-react"; // Added Camera icon
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
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user"); // Default to front camera for laptops
  const [isLoadingCamera, setIsLoadingCamera] = useState(true); // New loading state
  const [cameraError, setCameraError] = useState<string | null>(null); // New error state

  useEffect(() => {
    if (isOpen) {
      setIsCameraActive(true);
      setIsLoadingCamera(true); // Reset loading state when dialog opens
      setCameraError(null); // Clear previous errors
    } else {
      setIsCameraActive(false);
      setIsLoadingCamera(false);
    }
  }, [isOpen]);

  const handleScanResult = (result: any, error: any) => {
    if (isLoadingCamera) setIsLoadingCamera(false); // Camera stream started successfully
    if (!!result) {
      onScan(result?.text);
      onClose();
    }

    if (!!error && isCameraActive) {
      // console.error("QR Reader error:", error); // Keep this for console debugging
    }
  };

  const handleCameraError = (err: any) => {
    console.error("Camera access error:", err);
    setIsLoadingCamera(false); // Stop loading on error
    setCameraError(err.message || "Failed to access camera.");
    onError(err.message || "Failed to access camera.");
    // We don't close the dialog immediately here, so the user can try switching cameras.
  };

  const toggleFacingMode = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    setIsLoadingCamera(true); // Show loading again when switching cameras
    setCameraError(null); // Clear error when switching
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
              <QrReader
                key={facingMode} // Force re-mount on camera switch
                onResult={handleScanResult}
                onError={handleCameraError} // General error handler
                constraints={{ facingMode: facingMode }}
                scanDelay={300}
                videoContainerStyle={{ width: '100%', height: '100%', padding: 0 }} // Explicit container style
                videoStyle={{ objectFit: 'cover', width: '100%', height: '100%' }} // Explicit video style
              />
            </>
          ) : (
            <div className="text-muted-foreground text-center">
              Camera is not active.
            </div>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
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