import React from "react";
import ReceiveInventoryScreen from "@/components/mobile/ReceiveInventoryScreen";
import { useIsMobile } from "@/hooks/use-mobile"; // Import the useIsMobile hook
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone } from "lucide-react";

const MobileOperations: React.FC = () => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center bg-card border-border">
          <CardHeader className="flex flex-col items-center gap-2">
            <Smartphone className="h-10 w-10 text-primary" />
            <CardTitle className="text-2xl font-bold mb-2">Mobile View Only</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page is designed for mobile devices. Please view it on a smaller screen or a mobile emulator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReceiveInventoryScreen />
    </div>
  );
};

export default MobileOperations;