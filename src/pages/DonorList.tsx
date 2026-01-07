import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Search, Phone, MapPin, CreditCard, Eye, QrCode, ArrowUpDown, Filter } from 'lucide-react';
import { Donor } from '@/types';
import { getDonors, addDonor, updateDonor, deleteDonor, generateDonorId, isDonorIdUnique, getPaymentsByDonor } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import PaginationControls from '@/components/ui/pagination-controls';

const DonorList = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [viewingDonor, setViewingDonor] = useState<Donor | null>(null);
  const [sortField, setSortField] = useState<'name' | 'createdAt' | 'donationAmount'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    donorId: '',
    name: '',
    mobile: '',
    address: '',
    aadharCard: '',
    modeOfPayment: 'cash' as Donor['modeOfPayment'],
    photo: '',
    donationAmount: 0,
    freeRoomsEntitled: 0,
    freeDaysEntitled: 0,
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
      donationAmount: 0,
      freeRoomsEntitled: 0,
      freeDaysEntitled: 0,
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
        donationAmount: donor.donationAmount,
        freeRoomsEntitled: donor.freeRoomsEntitled,
        freeDaysEntitled: donor.freeDaysEntitled,
      });
    } else {
      resetForm();
      setFormData(prev => ({ ...prev, donorId: generateDonorId() }));
    }
    setIsDialogOpen(true);
  };

  const calculateEntitlement = (amount: number) => {
    const rooms = Math.floor(amount / 29000);
    const days = rooms * 3;
    return { rooms, days };
  };

  const handleDonationChange = (amount: number) => {
    const { rooms, days } = calculateEntitlement(amount);
    setFormData({ 
      ...formData, 
      donationAmount: amount,
      freeRoomsEntitled: rooms,
      freeDaysEntitled: days,
    });
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
      toast({ title: 'Success', description: 'Donor updated successfully.' });
    } else {
      addDonor(formData);
      toast({ title: 'Success', description: 'Donor added successfully.' });
    }

    loadDonors();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this donor?')) {
      deleteDonor(id);
      loadDonors();
      toast({ title: 'Deleted', description: 'Donor has been removed.' });
    }
  };

  const handleViewProfile = (donor: Donor) => {
    setViewingDonor(donor);
    setIsProfileOpen(true);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Filter and sort donors
  const filteredDonors = donors
    .filter(d =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.donorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.mobile.includes(searchTerm)
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'donationAmount':
          comparison = a.donationAmount - b.donationAmount;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

  // Pagination
  const totalPages = Math.ceil(filteredDonors.length / pageSize);
  const paginatedDonors = filteredDonors.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout title="Donors" subtitle="Manage your donor database">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, ID, or mobile..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="input-styled pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('name')}
              className={sortField === 'name' ? 'bg-primary/10' : ''}
            >
              <ArrowUpDown className="w-4 h-4 mr-1" />
              Name
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('donationAmount')}
              className={sortField === 'donationAmount' ? 'bg-primary/10' : ''}
            >
              <ArrowUpDown className="w-4 h-4 mr-1" />
              Amount
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('createdAt')}
              className={sortField === 'createdAt' ? 'bg-primary/10' : ''}
            >
              <ArrowUpDown className="w-4 h-4 mr-1" />
              Date
            </Button>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-accent gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Add Donor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  <p className="text-xs text-muted-foreground mt-1">Auto-generated or manual entry</p>
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
                    onChange={(e) => setFormData({ ...formData, modeOfPayment: e.target.value as Donor['modeOfPayment'] })}
                    className="input-styled mt-1"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="mixed">Mixed</option>
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
                <div className="col-span-2 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-3">Donation Details</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Donation Amount (₹)</label>
                      <input
                        type="number"
                        value={formData.donationAmount}
                        onChange={(e) => handleDonationChange(Number(e.target.value))}
                        className="input-styled mt-1"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Free Rooms</label>
                      <input
                        type="number"
                        value={formData.freeRoomsEntitled}
                        onChange={(e) => setFormData({ ...formData, freeRoomsEntitled: Number(e.target.value) })}
                        className="input-styled mt-1"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Free Days</label>
                      <input
                        type="number"
                        value={formData.freeDaysEntitled}
                        onChange={(e) => setFormData({ ...formData, freeDaysEntitled: Number(e.target.value) })}
                        className="input-styled mt-1"
                        min="0"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Auto-calculated: 1 free room per ₹29,000 donation (3 days per room)
                  </p>
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
        {paginatedDonors.length === 0 ? (
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
          paginatedDonors.map((donor) => (
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
                    onClick={() => handleViewProfile(donor)}
                    className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                    title="View Profile"
                  >
                    <Eye className="w-4 h-4 text-primary" />
                  </button>
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

              <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Donation</p>
                  <p className="font-semibold text-foreground text-sm">{formatCurrency(donor.donationAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Free Rooms</p>
                  <p className="font-semibold text-success text-sm">
                    {donor.freeRoomsEntitled - donor.freeRoomsUsed}/{donor.freeRoomsEntitled}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Visits</p>
                  <p className="font-semibold text-foreground text-sm">{donor.visitHistory.length}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredDonors.length > 0 && (
        <div className="mt-6 card-elevated">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredDonors.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </div>
      )}

      {/* Donor Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewingDonor && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Donor Profile</DialogTitle>
              </DialogHeader>
              
              <div className="mt-4 space-y-6">
                {/* Header */}
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                    {viewingDonor.photo ? (
                      <img src={viewingDonor.photo} alt={viewingDonor.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-primary">
                        {viewingDonor.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-serif font-bold text-foreground">{viewingDonor.name}</h2>
                    <p className="text-lg text-primary font-semibold">{viewingDonor.donorId}</p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{viewingDonor.mobile}</span>
                      <span>•</span>
                      <span>Joined {format(new Date(viewingDonor.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="bg-white p-2 rounded-lg">
                    <QRCodeSVG
                      value={viewingDonor.qrCode || viewingDonor.donorId}
                      size={80}
                      level="M"
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="stat-card text-center">
                    <p className="text-xs text-muted-foreground">Total Donation</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(viewingDonor.donationAmount)}</p>
                  </div>
                  <div className="stat-card text-center">
                    <p className="text-xs text-muted-foreground">Free Rooms Left</p>
                    <p className="text-xl font-bold text-success">
                      {viewingDonor.freeRoomsEntitled - viewingDonor.freeRoomsUsed}
                    </p>
                  </div>
                  <div className="stat-card text-center">
                    <p className="text-xs text-muted-foreground">Free Days Left</p>
                    <p className="text-xl font-bold text-success">
                      {viewingDonor.freeDaysEntitled - viewingDonor.freeDaysUsed}
                    </p>
                  </div>
                  <div className="stat-card text-center">
                    <p className="text-xs text-muted-foreground">Total Visits</p>
                    <p className="text-xl font-bold text-foreground">{viewingDonor.visitHistory.length}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Contact Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Phone:</span> {viewingDonor.mobile}</p>
                      <p><span className="text-muted-foreground">Address:</span> {viewingDonor.address}</p>
                      <p><span className="text-muted-foreground">Aadhar/ID:</span> {viewingDonor.aadharCard}</p>
                      <p><span className="text-muted-foreground">Payment Mode:</span> {viewingDonor.modeOfPayment.replace('_', ' ')}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Entitlements</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Free Rooms Entitled:</span>
                        <span className="font-semibold">{viewingDonor.freeRoomsEntitled}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Free Rooms Used:</span>
                        <span className="font-semibold">{viewingDonor.freeRoomsUsed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Free Days Entitled:</span>
                        <span className="font-semibold">{viewingDonor.freeDaysEntitled}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Free Days Used:</span>
                        <span className="font-semibold">{viewingDonor.freeDaysUsed}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visit History */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Visit History</h3>
                  {viewingDonor.visitHistory.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No visits yet</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {viewingDonor.visitHistory.map((visit) => (
                        <div key={visit.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                          <div>
                            <p className="font-medium">Room {visit.roomNumbers.join(', ')}</p>
                            <p className="text-muted-foreground">
                              {format(new Date(visit.checkInDate), 'MMM d, yyyy')} at {visit.checkInTime}
                            </p>
                          </div>
                          <span className={
                            visit.status === 'checked_in' ? 'badge-success' :
                            visit.status === 'checked_out' ? 'badge-warning' : 'badge-destructive'
                          }>
                            {visit.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment History */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Payment History</h3>
                  {(() => {
                    const payments = getPaymentsByDonor(viewingDonor.id);
                    if (payments.length === 0) {
                      return <p className="text-muted-foreground text-sm">No payment records</p>;
                    }
                    return (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                            <div>
                              <p className="font-medium">{formatCurrency(payment.totalAmount)}</p>
                              <p className="text-muted-foreground">
                                Paid: {formatCurrency(payment.amountPaid)} • {payment.installments.length} installments
                              </p>
                            </div>
                            <span className={
                              payment.status === 'completed' ? 'badge-success' :
                              payment.status === 'partial' ? 'badge-warning' : 'badge-destructive'
                            }>
                              {payment.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default DonorList;
