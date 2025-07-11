
import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Scan, X, Camera, Upload, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import './barcode-scanner.css'; // We'll create this CSS file later

interface BarcodeScannerProps {
  onScanResult: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanResult,
  isOpen,
  onClose
}) => {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && !scanner) {
      // Add a small delay to ensure the DOM element is rendered
      const timer = setTimeout(() => {
        const element = document.getElementById("qr-reader");
        if (!element) {
          console.error("QR reader element not found");
          return;
        }

        const html5QrcodeScanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 200, height: 200 },
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            aspectRatio: 1.0,
          },
          false
        );

        html5QrcodeScanner.render(
          (decodedText) => {
            onScanResult(decodedText);
            html5QrcodeScanner.clear();
            setIsScanning(false);
            onClose();
            toast({
              title: "Scan Successful",
              description: `Barcode/QR code detected: ${decodedText}`
            });
          },
          (error) => {
            console.log("Scan error:", error);
          }
        );

        setScanner(html5QrcodeScanner);
        setIsScanning(true);
      }, 100); // Small delay to ensure DOM is ready

      return () => clearTimeout(timer);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
        setScanner(null);
        setIsScanning(false);
      }
    };
  }, [isOpen, scanner, onScanResult, onClose, toast]);

  const handleClose = () => {
    if (scanner) {
      scanner.clear().catch(console.error);
      setScanner(null);
      setIsScanning(false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Scan className="h-4 w-4 text-emerald-600" />
            Scan Barcode/QR Code
          </DialogTitle>
          <DialogDescription className="text-xs">
            Position the barcode or QR code within the scanning area
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Scanner Tips - More compact */}
          <div className="bg-blue-50 p-2 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-emerald-600">
                <span className="font-medium">Tips:</span> Ensure good lighting • Hold steady • Position barcode in box • Use torch if needed
              </div>
            </div>
          </div>
          
          {/* Scanner Container - Reduced height */}
          <div className="scanner-container rounded-lg overflow-hidden border border-gray-200">
            <div id="qr-reader" className="w-full compact-scanner"></div>
          </div>
          
          {/* Action Buttons - More compact */}
          <div className="flex justify-between items-center pt-1">
            <div className="text-xs text-gray-500">
              {isScanning ? "Scanner active..." : "Initializing..."}
            </div>
            <Button 
              variant="default" 
              onClick={handleClose} 
              className="bg-emerald-600 hover:bg-emerald-500 h-8 text-sm px-3"
            >
              <X className="h-3 w-3 mr-1" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};