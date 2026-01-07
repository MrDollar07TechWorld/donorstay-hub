// Donor with enhanced donation tracking
export interface Donor {
  id: string;
  donorId: string;
  name: string;
  mobile: string;
  address: string;
  aadharCard: string;
  modeOfPayment: PaymentMethod;
  photo?: string;
  
  // Donation details
  donationAmount: number;
  freeRoomsEntitled: number;
  freeDaysEntitled: number;
  freeRoomsUsed: number;
  freeDaysUsed: number;
  
  // QR code (generated once, never changes)
  qrCode?: string;
  
  visitHistory: Visit[];
  createdAt: string;
  updatedAt: string;
}

// Non-donor guest
export interface Guest {
  id: string;
  name: string;
  mobile: string;
  address: string;
  governmentId?: string;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque' | 'mixed';

export interface Visit {
  id: string;
  donorId?: string;
  guestId?: string;
  guestType: 'donor' | 'non_donor';
  
  // Check-in details
  checkInDate: string;
  checkInTime: string;
  checkInAutoTime?: string;
  checkInManuallyEdited?: boolean;
  
  // Check-out details  
  checkOutDate?: string;
  checkOutTime?: string;
  checkOutAutoTime?: string;
  checkOutManuallyEdited?: boolean;
  expectedCheckOutDate?: string;
  
  roomNumbers: string[];
  numberOfGuests: number;
  status: 'upcoming' | 'checked_in' | 'checked_out';
  
  // Billing
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod?: PaymentMethod;
  isFreeStay: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  floor: string;
  type: 'single' | 'double' | 'suite' | 'deluxe' | 'dormitory';
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  currentGuestId?: string;
  currentGuestType?: 'donor' | 'non_donor';
  pricePerNight: number;
  amenities?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  donorId: string;
  donorName?: string;
  
  // Total donation pledge
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  
  // Installments tracking
  numberOfInstallments: number;
  installments: Installment[];
  
  status: 'pending' | 'partial' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Installment {
  id: string;
  paymentId: string;
  installmentNumber: number;
  amount: number;
  paidDate: string;
  method: PaymentMethod;
  referenceNumber?: string;
  proofImage?: string;
  notes?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  donorId?: string;
  guestId?: string;
  guestName: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

export type NotificationType = 
  | 'welcome'
  | 'booking_confirmation'
  | 'check_in_reminder'
  | 'check_in_confirmation'
  | 'check_out_reminder'
  | 'check_out_confirmation'
  | 'payment_confirmation'
  | 'payment_due';

export interface Bill {
  id: string;
  bookingId: string;
  guestName: string;
  guestMobile: string;
  guestAddress: string;
  guestType: 'donor' | 'non_donor';
  donorId?: string;
  
  // Hotel details
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  
  // Stay details
  roomNumbers: string[];
  roomType: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  numberOfNights: number;
  numberOfGuests: number;
  
  // Payment breakdown
  roomCharges: number;
  taxes: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  isFreeStay: boolean;
  
  generatedAt: string;
  billNumber: string;
}

// Pagination & filtering
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  searchTerm: string;
  dateRange?: { start: string; end: string };
  status?: string;
  guestType?: 'donor' | 'non_donor' | 'all';
  roomType?: string;
  paymentStatus?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalDonors: number;
  totalDonations: number;
  totalGuests: number;
  occupiedRooms: number;
  availableRooms: number;
  totalRooms: number;
  pendingPayments: number;
  pendingPaymentsAmount: number;
  unreadNotifications: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  monthlyIncome: number;
  donorRevenue: number;
  nonDonorRevenue: number;
}
