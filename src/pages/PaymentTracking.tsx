import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, IndianRupee, Calendar, Check, Search, ArrowUpDown } from 'lucide-react';
import { Donor, Payment, PaymentMethod } from '@/types';
import { getDonors, getPayments, addPayment, addInstallment, updateDonor, getDonorById } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import PaginationControls from '@/components/ui/pagination-controls';

const PaymentTracking = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isInstallmentDialogOpen, setIsInstallmentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();

  const [paymentFormData, setPaymentFormData] = useState({
    donorId: '',
    totalAmount: 0,
    amountPaid: 0,
    numberOfInstallments: 1,
    paymentMethod: 'cash' as PaymentMethod,
  });

  const [installmentFormData, setInstallmentFormData] = useState({
    amount: 0,
    method: 'cash' as PaymentMethod,
    referenceNumber: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDonors(getDonors());
    setPayments(getPayments());
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();

    const donor = donors.find(d => d.id === paymentFormData.donorId);
    if (!donor) {
      toast({ title: 'Error', description: 'Please select a donor', variant: 'destructive' });
      return;
    }

    const remainingAmount = paymentFormData.totalAmount - paymentFormData.amountPaid;
    const initialInstallments = paymentFormData.amountPaid > 0 ? [{
      id: crypto.randomUUID(),
      paymentId: '',
      installmentNumber: 1,
      amount: paymentFormData.amountPaid,
      paidDate: new Date().toISOString(),
      method: paymentFormData.paymentMethod,
      createdAt: new Date().toISOString(),
    }] : [];
    
    addPayment({
      donorId: paymentFormData.donorId,
      donorName: donor.name,
      totalAmount: paymentFormData.totalAmount,
      amountPaid: paymentFormData.amountPaid,
      remainingAmount,
      numberOfInstallments: paymentFormData.numberOfInstallments,
      installments: initialInstallments,
      status: remainingAmount <= 0 ? 'completed' : paymentFormData.amountPaid > 0 ? 'partial' : 'pending',
    });

    // Update donor's donation amount
    if (paymentFormData.amountPaid > 0) {
      updateDonor(donor.id, {
        donationAmount: donor.donationAmount + paymentFormData.amountPaid,
      });
    }

    toast({ title: 'Success', description: 'Payment record created' });
    loadData();
    setIsPaymentDialogOpen(false);
    setPaymentFormData({ donorId: '', totalAmount: 0, amountPaid: 0, numberOfInstallments: 1, paymentMethod: 'cash' });
  };

  const handleAddInstallment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPayment) return;

    const nextInstallmentNumber = selectedPayment.installments.length + 1;

    addInstallment(selectedPayment.id, {
      installmentNumber: nextInstallmentNumber,
      amount: installmentFormData.amount,
      paidDate: new Date().toISOString(),
      method: installmentFormData.method,
      referenceNumber: installmentFormData.referenceNumber,
      notes: installmentFormData.notes,
    });

    toast({ title: 'Success', description: 'Installment recorded' });
    loadData();
    setIsInstallmentDialogOpen(false);
    setInstallmentFormData({ amount: 0, method: 'cash', referenceNumber: '', notes: '' });
    setSelectedPayment(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = (payment: Payment) => {
    return Math.round((payment.amountPaid / payment.totalAmount) * 100);
  };

  // Filter and paginate
  const filteredPayments = payments.filter(p => {
    const donor = getDonorById(p.donorId);
    const matchesSearch = donor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor?.donorId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPayments.length / pageSize);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalPending = payments.reduce((sum, p) => sum + p.remainingAmount, 0);

  return (
    <MainLayout title="Payment Tracking" subtitle="Manage donations and installments">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex gap-4">
          <div className="stat-card shadow-md px-4 py-2">
            <span className="text-sm text-muted-foreground">Total Collected</span>
            <span className="ml-2 font-bold text-success">
              {formatCurrency(totalCollected)}
            </span>
          </div>
          <div className="stat-card shadow-md px-4 py-2">
            <span className="text-sm text-muted-foreground">Pending</span>
            <span className="ml-2 font-bold text-warning">
              {formatCurrency(totalPending)}
            </span>
          </div>
        </div>

        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-accent gap-2">
              <Plus className="w-4 h-4" />
              New Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Create Payment Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePayment} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-foreground">Select Donor</label>
                <select
                  value={paymentFormData.donorId}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, donorId: e.target.value })}
                  className="input-styled mt-1"
                  required
                >
                  <option value="">Choose a donor...</option>
                  {donors.map((donor) => (
                    <option key={donor.id} value={donor.id}>
                      {donor.name} ({donor.donorId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Total Donation Amount (₹)</label>
                <input
                  type="number"
                  value={paymentFormData.totalAmount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, totalAmount: Number(e.target.value) })}
                  className="input-styled mt-1"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Number of Installments (Planned)</label>
                <input
                  type="number"
                  value={paymentFormData.numberOfInstallments}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, numberOfInstallments: Number(e.target.value) })}
                  className="input-styled mt-1"
                  min="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Initial Payment (₹)</label>
                  <input
                    type="number"
                    value={paymentFormData.amountPaid}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amountPaid: Number(e.target.value) })}
                    className="input-styled mt-1"
                    min="0"
                    max={paymentFormData.totalAmount}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Payment Method</label>
                  <select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value as PaymentMethod })}
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
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary">
                  Create Payment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by donor name or ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="input-styled pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="input-styled w-40"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Payment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedPayments.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <IndianRupee className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">No payment records</h3>
            <p className="text-muted-foreground mt-1">Create a payment record to start tracking</p>
          </div>
        ) : (
          paginatedPayments.map((payment) => {
            const donor = getDonorById(payment.donorId);
            return (
              <div key={payment.id} className="card-elevated p-6 animate-scale-in">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{donor?.name || payment.donorName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {donor?.donorId} • {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={
                    payment.status === 'completed' ? 'badge-success' :
                    payment.status === 'partial' ? 'badge-warning' : 'badge-destructive'
                  }>
                    {payment.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">{getProgressPercentage(payment)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success transition-all duration-500"
                      style={{ width: `${getProgressPercentage(payment)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                    <span className="font-medium text-foreground">{formatCurrency(payment.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Paid</span>
                    <span className="font-medium text-success">{formatCurrency(payment.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Remaining</span>
                    <span className="font-medium text-warning">{formatCurrency(payment.remainingAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Installments</span>
                    <span className="font-medium text-foreground">
                      {payment.installments.length} / {payment.numberOfInstallments}
                    </span>
                  </div>
                </div>

                {/* Installments */}
                {payment.installments.length > 0 && (
                  <div className="border-t border-border pt-4 mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Installment History
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {payment.installments.map((inst) => (
                        <div key={inst.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Check className="w-3 h-3 text-success" />
                            #{inst.installmentNumber} - {format(new Date(inst.paidDate), 'MMM d, yyyy')}
                          </span>
                          <div className="text-right">
                            <span className="text-foreground font-medium">{formatCurrency(inst.amount)}</span>
                            <span className="text-xs text-muted-foreground ml-2 capitalize">{inst.method}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {payment.status !== 'completed' && (
                  <Button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setInstallmentFormData({ 
                        amount: Math.min(payment.remainingAmount, payment.totalAmount / payment.numberOfInstallments),
                        method: 'cash',
                        referenceNumber: '',
                        notes: '',
                      });
                      setIsInstallmentDialogOpen(true);
                    }}
                    className="w-full btn-accent"
                    size="sm"
                  >
                    Add Installment
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filteredPayments.length > 0 && (
        <div className="mt-6 card-elevated">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredPayments.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        </div>
      )}

      {/* Add Installment Dialog */}
      <Dialog open={isInstallmentDialogOpen} onOpenChange={setIsInstallmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add Installment</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <form onSubmit={handleAddInstallment} className="space-y-4 mt-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Remaining Amount</span>
                  <span className="text-xl font-bold text-foreground">
                    {formatCurrency(selectedPayment.remainingAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Installment #</span>
                  <span className="font-medium">{selectedPayment.installments.length + 1}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Amount (₹)</label>
                <input
                  type="number"
                  value={installmentFormData.amount}
                  onChange={(e) => setInstallmentFormData({ ...installmentFormData, amount: Number(e.target.value) })}
                  className="input-styled mt-1"
                  min="1"
                  max={selectedPayment.remainingAmount}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Payment Method</label>
                <select
                  value={installmentFormData.method}
                  onChange={(e) => setInstallmentFormData({ ...installmentFormData, method: e.target.value as PaymentMethod })}
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
                <label className="text-sm font-medium text-foreground">Reference Number (Optional)</label>
                <input
                  type="text"
                  value={installmentFormData.referenceNumber}
                  onChange={(e) => setInstallmentFormData({ ...installmentFormData, referenceNumber: e.target.value })}
                  className="input-styled mt-1"
                  placeholder="Transaction ID, cheque number, etc."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Notes (Optional)</label>
                <textarea
                  value={installmentFormData.notes}
                  onChange={(e) => setInstallmentFormData({ ...installmentFormData, notes: e.target.value })}
                  className="input-styled mt-1"
                  rows={2}
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsInstallmentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary">
                  Record Installment
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default PaymentTracking;
