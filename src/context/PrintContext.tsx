import React, { createContext, useState, useContext, ReactNode, useCallback } from "react";

interface PrintContentData {
  type: "purchase-order" | "invoice";
  props: any; // The actual props for PurchaseOrderPdfContent or InvoicePdfContent
}

interface PrintContextType {
  isPrinting: boolean;
  printContentData: PrintContentData | null;
  initiatePrint: (data: PrintContentData) => void; // Renamed and simplified
  resetPrintState: () => void; // New function to reset both states
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export const PrintProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printContentData, setPrintContentData] = useState<PrintContentData | null>(null);

  const initiatePrint = useCallback((data: PrintContentData) => {
    setPrintContentData(data);
    setIsPrinting(true); // Set isPrinting to true when data is provided
  }, []);

  const resetPrintState = useCallback(() => {
    setIsPrinting(false);
    setPrintContentData(null);
  }, []);

  return (
    <PrintContext.Provider value={{ isPrinting, printContentData, initiatePrint, resetPrintState }}>
      {children}
    </PrintContext.Provider>
  );
};

export const usePrint = () => {
  const context = useContext(PrintContext);
  if (context === undefined) {
    throw new Error("usePrint must be used within a PrintProvider");
  }
  return context;
};