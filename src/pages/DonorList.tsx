import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Phone, MapPin, CreditCard } from 'lucide-react';
import { Donor } from '@/types';
import { getDonors, addDonor, updateDonor, deleteDonor, generateDonorId, isDonorIdUnique } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

const DonorList = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    donorId: '',
    name: '',
    mobile: '',
    address: '',
    aadharCard: '',
    modeOfPayment: 'cash' as 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque',
    photo: '',
    totalDonation: 0,
    freeStaysRemaining: 0,
  });

  useEffect(() => {
    loadDonors();
  }, []);

  const loadDonors = () => {
    setDonors(getDonors());
  };

  const resetForm = () => {
    setFormData({
      donorId: '',
      name: '',
      mobile: '',
      address: '',
      aadharCard: '',
      modeOfPayment: 'cash',
      photo: '',
      totalDonation: 0,
      freeStaysRemaining: 0,
    });
    setEditingDonor(null);
  };

  const handleOpenDialog = (donor?: Donor) => {
    if (donor) {
      setEditingDonor(donor);
      setFormData({
        donorId: donor.donorId,
        name: donor.name,
        mobile: donor.mobile,
        address: donor.address,
        aadharCard: donor.aadharCard,
        modeOfPayment: donor.modeOfPayment,
        photo: donor.photo || '',
        totalDonation: donor.totalDonation,
        freeStaysRemaining: donor.freeStaysRemaining,
      });
    } else {
      resetForm();
      setFormData(prev => ({ ...prev, donorId: generateDonorId() }));
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDonorIdUnique(formData.donorId, editingDonor?.id)) {
      toast({
        title: 'Error',
        description: 'Donor ID already exists. Please use a unique ID.',
        variant: 'destructive',
      });
      return;
    }

    if (editingDonor) {
      updateDonor(editingDonor.id, formData);
      toast({
        title: 'Success',
        description: 'Donor updated successfully.',
      });
    } else {
      addDonor(formData);
      toast({
        title: 'Success',
        description: 'Donor added successfully.',
      });
    }

    loadDonors();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this donor?')) {
      deleteDonor(id);
      loadDonors();
      toast({
        title: 'Deleted',
        description: 'Donor has been removed.',
      });
    }
  };

  const filteredDonors = donors.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.donorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.mobile.includes(searchTerm)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout title="Donors" subtitle="Manage your donor database">
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, ID, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-styled pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-accent gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Add Donor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                {editingDonor ? 'Edit Donor' : 'Add New Donor'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Donor ID</label>
                  <input
                    type="text"
                    value={formData.donorId}
                    onChange={(e) => setFormData({ ...formData, donorId: e.target.value })}
                    className="input-styled mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-styled mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Mobile Number</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="input-styled mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Aadhar Card / ID</label>
                  <input
                    type="text"
                    value={formData.aadharCard}
                    onChange={(e) => setFormData({ ...formData, aadharCard: e.target.value })}
                    className="input-styled mt-1"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-foreground">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-styled mt-1 min-h-[80px]"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Mode of Payment</label>
                  <select
                    value={formData.modeOfPayment}
                    onChange={(e) => setFormData({ ...formData, modeOfPayment: e.target.value as any })}
                    className="input-styled mt-1"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Photo URL (optional)</label>
                  <input
                    type="url"
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    className="input-styled mt-1"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Total Donation (₹)</label>
                  <input
                    type="number"
                    value={formData.totalDonation}
                    onChange={(e) => setFormData({ ...formData, totalDonation: Number(e.target.value) })}
                    className="input-styled mt-1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Free Stays Remaining</label>
                  <input
                    type="number"
                    value={formData.freeStaysRemaining}
                    onChange={(e) => setFormData({ ...formData, freeStaysRemaining: Number(e.target.value) })}
                    className="input-styled mt-1"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary">
                  {editingDonor ? 'Update Donor' : 'Add Donor'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Donor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDonors.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No donors found</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm ? 'Try a different search term' : 'Add your first donor to get started'}
            </p>
          </div>
        ) : (
          filteredDonors.map((donor) => (
            <div key={donor.id} className="card-elevated p-6 animate-scale-in">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {donor.photo ? (
                      <img src={donor.photo} alt={donor.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        {donor.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{donor.name}</h3>
                    <p className="text-sm text-muted-foreground">{donor.donorId}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenDialog(donor)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(donor.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{donor.mobile}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{donor.address}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                  <span className="capitalize">{donor.modeOfPayment.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Donation</p>
                  <p className="font-semibold text-foreground">{formatCurrency(donor.totalDonation)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Free Stays</p>
                  <p className="font-semibold text-success">{donor.freeStaysRemaining}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
};

export default DonorList;
