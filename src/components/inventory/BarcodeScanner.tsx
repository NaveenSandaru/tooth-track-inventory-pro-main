
import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Scan, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        html5QrcodeScanner.render(
          (decodedText) => {
            onScanResult(decodedText);
            html5QrcodeScanner.clear();
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
      }, 100); // Small delay to ensure DOM is ready

      return () => clearTimeout(timer);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
        setScanner(null);
      }
    };
  }, [isOpen, scanner, onScanResult, onClose, toast]);

  const handleClose = () => {
    if (scanner) {
      scanner.clear().catch(console.error);
      setScanner(null);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scan Barcode/QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div id="qr-reader" className="w-full"></div>
          <Button variant="outline" onClick={handleClose} className="w-full">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
