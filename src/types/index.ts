export interface Donor {
  id: string;
  donorId: string;
  name: string;
  mobile: string;
  address: string;
  aadharCard: string;
  modeOfPayment: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque';
  photo?: string;
  totalDonation: number;
  freeStaysRemaining: number;
  visitHistory: Visit[];
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  id: string;
  donorId: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate?: string;
  checkOutTime?: string;
  roomNumber: string;
  numberOfGuests: number;
  status: 'checked_in' | 'checked_out' | 'upcoming';
}

export interface Room {
  id: string;
  roomNumber: string;
  type: 'single' | 'double' | 'suite' | 'deluxe';
  status: 'available' | 'occupied' | 'maintenance';
  currentDonorId?: string;
  pricePerNight: number;
}

export interface Payment {
  id: string;
  donorId: string;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  installments: Installment[];
  status: 'pending' | 'partial' | 'completed';
  createdAt: string;
}

export interface Installment {
  id: string;
  paymentId: string;
  amount: number;
  paidDate: string;
  method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque';
}

export interface Notification {
  id: string;
  donorId: string;
  donorName: string;
  type: 'check_in_reminder' | 'check_out_reminder' | 'payment_due' | 'welcome';
  message: string;
  read: boolean;
  createdAt: string;
}
