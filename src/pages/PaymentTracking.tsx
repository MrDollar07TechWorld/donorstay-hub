import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, IndianRupee, Calendar, Check, Clock } from 'lucide-react';
import { Donor, Payment } from '@/types';
import { getDonors, getPayments, addPayment, addInstallment, updateDonor } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const PaymentTracking = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isInstallmentDialogOpen, setIsInstallmentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const { toast } = useToast();

  const [paymentFormData, setPaymentFormData] = useState({
    donorId: '',
    totalAmount: 0,
    amountPaid: 0,
  });

  const [installmentFormData, setInstallmentFormData] = useState({
    amount: 0,
    method: 'cash' as const,
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
    
    addPayment({
      donorId: paymentFormData.donorId,
      totalAmount: paymentFormData.totalAmount,
      amountPaid: paymentFormData.amountPaid,
      remainingAmount,
      installments: paymentFormData.amountPaid > 0 ? [{
        id: crypto.randomUUID(),
        paymentId: '',
        amount: paymentFormData.amountPaid,
        paidDate: new Date().toISOString(),
        method: 'cash',
      }] : [],
      status: remainingAmount <= 0 ? 'completed' : paymentFormData.amountPaid > 0 ? 'partial' : 'pending',
    });

    // Update donor's total donation
    updateDonor(donor.id, {
      totalDonation: donor.totalDonation + paymentFormData.amountPaid,
    });

    toast({ title: 'Success', description: 'Payment record created' });
    loadData();
    setIsPaymentDialogOpen(false);
    setPaymentFormData({ donorId: '', totalAmount: 0, amountPaid: 0 });
  };

  const handleAddInstallment = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPayment) return;

    addInstallment(selectedPayment.id, {
      amount: installmentFormData.amount,
      paidDate: new Date().toISOString(),
      method: installmentFormData.method,
    });

    // Update donor's total donation
    const donor = donors.find(d => d.id === selectedPayment.donorId);
    if (donor) {
      updateDonor(donor.id, {
        totalDonation: donor.totalDonation + installmentFormData.amount,
      });
    }

    toast({ title: 'Success', description: 'Installment recorded' });
    loadData();
    setIsInstallmentDialogOpen(false);
    setInstallmentFormData({ amount: 0, method: 'cash' });
    setSelectedPayment(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDonorName = (donorId: string) => {
    const donor = donors.find(d => d.id === donorId);
    return donor ? donor.name : 'Unknown';
  };

  const getProgressPercentage = (payment: Payment) => {
    return Math.round((payment.amountPaid / payment.totalAmount) * 100);
  };

  return (
    <MainLayout title="Payment Tracking" subtitle="Manage donations and installments">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <div className="stat-card shadow-md px-4 py-2">
            <span className="text-sm text-muted-foreground">Total Collected</span>
            <span className="ml-2 font-bold text-foreground">
              {formatCurrency(payments.reduce((sum, p) => sum + p.amountPaid, 0))}
            </span>
          </div>
          <div className="stat-card shadow-md px-4 py-2">
            <span className="text-sm text-muted-foreground">Pending</span>
            <span className="ml-2 font-bold text-warning">
              {formatCurrency(payments.reduce((sum, p) => sum + p.remainingAmount, 0))}
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
                <label className="text-sm font-medium text-foreground">Total Amount (₹)</label>
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

      {/* Payment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {payments.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <IndianRupee className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">No payment records</h3>
            <p className="text-muted-foreground mt-1">Create a payment record to start tracking</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div key={payment.id} className="card-elevated p-6 animate-scale-in">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{getDonorName(payment.donorId)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(payment.createdAt), 'MMM d, yyyy')}
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
              </div>

              {/* Installments */}
              {payment.installments.length > 0 && (
                <div className="border-t border-border pt-4 mb-4">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Installments ({payment.installments.length})
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {payment.installments.map((inst, idx) => (
                      <div key={inst.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Check className="w-3 h-3 text-success" />
                          #{idx + 1} - {format(new Date(inst.paidDate), 'MMM d')}
                        </span>
                        <span className="text-foreground">{formatCurrency(inst.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {payment.status !== 'completed' && (
                <Button
                  onClick={() => {
                    setSelectedPayment(payment);
                    setIsInstallmentDialogOpen(true);
                  }}
                  className="w-full btn-accent"
                  size="sm"
                >
                  Add Installment
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Installment Dialog */}
      <Dialog open={isInstallmentDialogOpen} onOpenChange={setIsInstallmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add Installment</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <form onSubmit={handleAddInstallment} className="space-y-4 mt-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Remaining Amount</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(selectedPayment.remainingAmount)}
                </p>
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
                  onChange={(e) => setInstallmentFormData({ ...installmentFormData, method: e.target.value as any })}
                  className="input-styled mt-1"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
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
