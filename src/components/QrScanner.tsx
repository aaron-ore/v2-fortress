import React, { useEffect, useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { showError } from '@/utils/toast';

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
  onReady: () => void; // This will be called after a short delay to indicate camera is likely ready
  facingMode: "user" | "environment";
}

const QrScanner: React.FC<QrScannerProps> = ({ onScan, onError, onReady, facingMode }) => {
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);

  useEffect(() => {
    // Simulate onReady after a short delay, as react-qr-reader doesn't have a direct 'onReady'
    const timer = setTimeout(() => {
      setIsCameraInitialized(true);
      onReady();
    }, 500); // Give camera some time to initialize

    return () => clearTimeout(timer);
  }, [onReady, facingMode]);

  const handleScanResult = (result: any, error: any) => {
    if (!!result) {
      onScan(result?.text);
    }

    if (!!error) {
      // react-qr-reader often logs non-critical errors (e.g., NotFoundException when no code is in view)
      // We'll filter these to only report more significant camera access issues.
      if (error.name !== "NotFoundException" && error.name !== "NotAllowedError") {
        onError(error.message || "Unknown camera error");
      }
    }
  };

  return (
    <div className="w-full h-full flex justify-center items-center">
      {isCameraInitialized ? (
        <QrReader
          onResult={handleScanResult}
          constraints={{ facingMode: facingMode }}
          scanDelay={300} // Adjust scan delay as needed
          videoContainerStyle={{ width: '100%', height: '100%', padding: 0 }}
          videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div className="text-white">Initializing camera...</div>
      )}
    </div>
  );
};

export default QrScanner;