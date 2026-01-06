import { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { QRCodeSVG } from 'qrcode.react';
import { Donor } from '@/types';
import { getDonors } from '@/lib/storage';
import { Download, IdCard, User, Phone, MapPin, Calendar, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const IDCards = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDonors(getDonors());
  }, []);

  const generateQRData = (donor: Donor) => {
    return JSON.stringify({
      id: donor.donorId,
      name: donor.name,
      visits: donor.visitHistory.length,
      freeStays: donor.freeStaysRemaining,
      totalDonation: donor.totalDonation,
    });
  };

  const handlePrint = () => {
    if (cardRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Donor ID Card</title>
              <style>
                body { margin: 0; padding: 20px; font-family: 'Inter', sans-serif; }
                .card { width: 350px; }
              </style>
            </head>
            <body>
              ${cardRef.current.outerHTML}
              <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <MainLayout title="ID Cards" subtitle="Generate QR-coded ID cards for donors">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Donor Selection */}
        <div className="card-elevated p-6">
          <h2 className="text-lg font-serif font-semibold mb-4">Select Donor</h2>
          
          {donors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No donors available. Add donors first.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {donors.map((donor) => (
                <button
                  key={donor.id}
                  onClick={() => setSelectedDonor(donor)}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    selectedDonor?.id === donor.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 hover:bg-muted text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedDonor?.id === donor.id ? 'bg-primary-foreground/20' : 'bg-primary/10'
                    }`}>
                      <span className={`font-semibold ${
                        selectedDonor?.id === donor.id ? 'text-primary-foreground' : 'text-primary'
                      }`}>
                        {donor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{donor.name}</p>
                      <p className={`text-sm ${
                        selectedDonor?.id === donor.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {donor.donorId}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ID Card Preview */}
        <div className="space-y-4">
          <h2 className="text-lg font-serif font-semibold">ID Card Preview</h2>
          
          {selectedDonor ? (
            <>
              <div
                ref={cardRef}
                className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-xl max-w-md"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <IdCard className="w-6 h-6" />
                    <span className="font-serif font-bold text-lg">DonorStay</span>
                  </div>
                  <span className="text-xs bg-primary-foreground/20 px-3 py-1 rounded-full">
                    Member Card
                  </span>
                </div>

                <div className="flex gap-6">
                  {/* QR Code */}
                  <div className="bg-white p-3 rounded-xl">
                    <QRCodeSVG
                      value={generateQRData(selectedDonor)}
                      size={100}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-xs text-primary-foreground/60">Donor ID</p>
                      <p className="font-bold text-lg">{selectedDonor.donorId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-foreground/60">Name</p>
                      <p className="font-semibold">{selectedDonor.name}</p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="mt-6 pt-4 border-t border-primary-foreground/20 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-primary-foreground/60" />
                    <span>{selectedDonor.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary-foreground/60" />
                    <span>Visits: {selectedDonor.visitHistory.length}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Gift className="w-4 h-4 text-primary-foreground/60" />
                    <span>Free Stays: {selectedDonor.freeStaysRemaining}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-primary-foreground/60" />
                    <span className="truncate">{selectedDonor.address.split(',')[0]}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-primary-foreground/20 flex justify-between items-center text-xs text-primary-foreground/60">
                  <span>Member since {format(new Date(selectedDonor.createdAt), 'MMM yyyy')}</span>
                  <span>Scan QR for details</span>
                </div>
              </div>

              <Button onClick={handlePrint} className="btn-accent gap-2">
                <Download className="w-4 h-4" />
                Print ID Card
              </Button>

              {/* Scan Info */}
              <div className="card-elevated p-4 mt-4">
                <h3 className="font-medium text-foreground mb-2">QR Code Contains:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Donor ID: {selectedDonor.donorId}</li>
                  <li>• Name: {selectedDonor.name}</li>
                  <li>• Total Visits: {selectedDonor.visitHistory.length}</li>
                  <li>• Free Stays Remaining: {selectedDonor.freeStaysRemaining}</li>
                  <li>• Total Donation: ₹{selectedDonor.totalDonation.toLocaleString()}</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="card-elevated p-12 text-center">
              <IdCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Select a donor to generate their ID card</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default IDCards;
