import { 
  Donor, Guest, Room, Payment, Notification, Visit, Installment, 
  Bill, DashboardStats, PaymentMethod 
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
  DONORS: 'donor_management_donors',
  GUESTS: 'donor_management_guests',
  ROOMS: 'donor_management_rooms',
  PAYMENTS: 'donor_management_payments',
  NOTIFICATIONS: 'donor_management_notifications',
  BILLS: 'donor_management_bills',
  BOOKINGS: 'donor_management_bookings',
  DONOR_ID_COUNTER: 'donor_management_id_counter',
  BILL_COUNTER: 'donor_management_bill_counter',
};

// Generic storage utilities
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ============ DONOR MANAGEMENT ============

export const generateDonorId = (): string => {
  const counter = getFromStorage<number>(STORAGE_KEYS.DONOR_ID_COUNTER, 1000);
  const newCounter = counter + 1;
  saveToStorage(STORAGE_KEYS.DONOR_ID_COUNTER, newCounter);
  return `DNR${newCounter}`;
};

export const isDonorIdUnique = (donorId: string, excludeId?: string): boolean => {
  const donors = getDonors();
  return !donors.some(d => d.donorId === donorId && d.id !== excludeId);
};

export const calculateFreeEntitlement = (donationAmount: number): { rooms: number; days: number } => {
  // Flexible calculation - 1 free room per ₹29,000 donated
  const freeRooms = Math.floor(donationAmount / 29000);
  const freeDays = freeRooms * 3; // 3 days per room allocation
  return { rooms: freeRooms, days: freeDays };
};

export const getDonors = (): Donor[] => {
  return getFromStorage<Donor[]>(STORAGE_KEYS.DONORS, [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getDonorById = (id: string): Donor | undefined => {
  return getDonors().find(d => d.id === id);
};

export const getDonorByDonorId = (donorId: string): Donor | undefined => {
  return getDonors().find(d => d.donorId === donorId);
};

export const searchDonors = (term: string): Donor[] => {
  const lower = term.toLowerCase();
  return getDonors().filter(d =>
    d.name.toLowerCase().includes(lower) ||
    d.donorId.toLowerCase().includes(lower) ||
    d.mobile.includes(term)
  );
};

export const addDonor = (donor: Omit<Donor, 'id' | 'createdAt' | 'updatedAt' | 'visitHistory' | 'qrCode' | 'freeRoomsUsed' | 'freeDaysUsed'>): Donor => {
  const donors = getDonors();
  const entitlement = calculateFreeEntitlement(donor.donationAmount);
  
  const newDonor: Donor = {
    ...donor,
    id: uuidv4(),
    qrCode: `DONOR-${donor.donorId}-${Date.now()}`, // Generated once, never changes
    freeRoomsEntitled: donor.freeRoomsEntitled || entitlement.rooms,
    freeDaysEntitled: donor.freeDaysEntitled || entitlement.days,
    freeRoomsUsed: 0,
    freeDaysUsed: 0,
    visitHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  donors.push(newDonor);
  saveToStorage(STORAGE_KEYS.DONORS, donors);
  
  // Add welcome notification
  addNotification({
    donorId: newDonor.id,
    guestName: newDonor.name,
    type: 'welcome',
    message: `Welcome ${newDonor.name}! Your donor ID is ${newDonor.donorId}. You have ${newDonor.freeRoomsEntitled - newDonor.freeRoomsUsed} free rooms remaining.`,
  });
  
  return newDonor;
};

export const updateDonor = (id: string, updates: Partial<Donor>): Donor | null => {
  const donors = getDonors();
  const index = donors.findIndex(d => d.id === id);
  if (index === -1) return null;
  
  // Recalculate entitlements if donation amount changed
  if (updates.donationAmount && updates.donationAmount !== donors[index].donationAmount) {
    const entitlement = calculateFreeEntitlement(updates.donationAmount);
    updates.freeRoomsEntitled = entitlement.rooms;
    updates.freeDaysEntitled = entitlement.days;
  }
  
  // Never change QR code
  delete updates.qrCode;
  
  donors[index] = {
    ...donors[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveToStorage(STORAGE_KEYS.DONORS, donors);
  return donors[index];
};

export const deleteDonor = (id: string): boolean => {
  const donors = getDonors();
  const filtered = donors.filter(d => d.id !== id);
  if (filtered.length === donors.length) return false;
  saveToStorage(STORAGE_KEYS.DONORS, filtered);
  return true;
};

// ============ GUEST MANAGEMENT (NON-DONORS) ============

export const getGuests = (): Guest[] => {
  return getFromStorage<Guest[]>(STORAGE_KEYS.GUESTS, [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getGuestById = (id: string): Guest | undefined => {
  return getGuests().find(g => g.id === id);
};

export const addGuest = (guest: Omit<Guest, 'id' | 'createdAt'>): Guest => {
  const guests = getGuests();
  const newGuest: Guest = {
    ...guest,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  guests.push(newGuest);
  saveToStorage(STORAGE_KEYS.GUESTS, guests);
  return newGuest;
};

export const searchGuests = (term: string): Guest[] => {
  const lower = term.toLowerCase();
  return getGuests().filter(g =>
    g.name.toLowerCase().includes(lower) ||
    g.mobile.includes(term)
  );
};

// ============ VISIT/BOOKING MANAGEMENT ============

export const getBookings = (): Visit[] => {
  return getFromStorage<Visit[]>(STORAGE_KEYS.BOOKINGS, [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getBookingById = (id: string): Visit | undefined => {
  return getBookings().find(b => b.id === id);
};

export const addBooking = (booking: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>): Visit => {
  const bookings = getBookings();
  const newBooking: Visit = {
    ...booking,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  bookings.push(newBooking);
  saveToStorage(STORAGE_KEYS.BOOKINGS, bookings);
  
  // Update donor's visit history if it's a donor booking
  if (booking.guestType === 'donor' && booking.donorId) {
    const donors = getDonors();
    const donorIndex = donors.findIndex(d => d.id === booking.donorId);
    if (donorIndex !== -1) {
      donors[donorIndex].visitHistory.push(newBooking);
      
      // Reduce free rooms if it's a free stay
      if (booking.isFreeStay) {
        donors[donorIndex].freeRoomsUsed += booking.roomNumbers.length;
      }
      
      donors[donorIndex].updatedAt = new Date().toISOString();
      saveToStorage(STORAGE_KEYS.DONORS, donors);
    }
  }
  
  // Allocate rooms
  booking.roomNumbers.forEach(roomNum => {
    const rooms = getRooms();
    const roomIndex = rooms.findIndex(r => r.roomNumber === roomNum);
    if (roomIndex !== -1) {
      rooms[roomIndex].status = 'occupied';
      rooms[roomIndex].currentGuestId = booking.donorId || booking.guestId;
      rooms[roomIndex].currentGuestType = booking.guestType;
      saveToStorage(STORAGE_KEYS.ROOMS, rooms);
    }
  });
  
  return newBooking;
};

export const updateBooking = (id: string, updates: Partial<Visit>): Visit | null => {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === id);
  if (index === -1) return null;
  
  bookings[index] = {
    ...bookings[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveToStorage(STORAGE_KEYS.BOOKINGS, bookings);
  
  // Update donor's visit history
  if (bookings[index].guestType === 'donor' && bookings[index].donorId) {
    const donors = getDonors();
    const donorIndex = donors.findIndex(d => d.id === bookings[index].donorId);
    if (donorIndex !== -1) {
      const visitIndex = donors[donorIndex].visitHistory.findIndex(v => v.id === id);
      if (visitIndex !== -1) {
        donors[donorIndex].visitHistory[visitIndex] = bookings[index];
        saveToStorage(STORAGE_KEYS.DONORS, donors);
      }
    }
  }
  
  return bookings[index];
};

export const checkIn = (bookingId: string, checkInDate?: string, checkInTime?: string): Visit | null => {
  const now = new Date();
  const autoDate = checkInDate || now.toISOString().split('T')[0];
  const autoTime = checkInTime || now.toTimeString().slice(0, 5);
  
  return updateBooking(bookingId, {
    status: 'checked_in',
    checkInDate: checkInDate || autoDate,
    checkInTime: checkInTime || autoTime,
    checkInAutoTime: `${autoDate}T${autoTime}`,
    checkInManuallyEdited: !!(checkInDate || checkInTime),
  });
};

export const checkOut = (bookingId: string, checkOutDate?: string, checkOutTime?: string): Visit | null => {
  const booking = getBookingById(bookingId);
  if (!booking) return null;
  
  const now = new Date();
  const autoDate = checkOutDate || now.toISOString().split('T')[0];
  const autoTime = checkOutTime || now.toTimeString().slice(0, 5);
  
  // Release rooms
  booking.roomNumbers.forEach(roomNum => {
    const rooms = getRooms();
    const roomIndex = rooms.findIndex(r => r.roomNumber === roomNum);
    if (roomIndex !== -1) {
      rooms[roomIndex].status = 'available';
      rooms[roomIndex].currentGuestId = undefined;
      rooms[roomIndex].currentGuestType = undefined;
      saveToStorage(STORAGE_KEYS.ROOMS, rooms);
    }
  });
  
  return updateBooking(bookingId, {
    status: 'checked_out',
    checkOutDate: checkOutDate || autoDate,
    checkOutTime: checkOutTime || autoTime,
    checkOutAutoTime: `${autoDate}T${autoTime}`,
    checkOutManuallyEdited: !!(checkOutDate || checkOutTime),
  });
};

// ============ ROOM MANAGEMENT ============

export const getRooms = (): Room[] => {
  const rooms = getFromStorage<Room[]>(STORAGE_KEYS.ROOMS, []);
  if (rooms.length === 0) {
    const defaultRooms: Room[] = [
      { id: uuidv4(), roomNumber: '101', floor: '1', type: 'single', capacity: 1, status: 'available', pricePerNight: 1000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: uuidv4(), roomNumber: '102', floor: '1', type: 'single', capacity: 1, status: 'available', pricePerNight: 1000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: uuidv4(), roomNumber: '103', floor: '1', type: 'double', capacity: 2, status: 'available', pricePerNight: 1500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: uuidv4(), roomNumber: '104', floor: '1', type: 'double', capacity: 2, status: 'available', pricePerNight: 1500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: uuidv4(), roomNumber: '201', floor: '2', type: 'suite', capacity: 3, status: 'available', pricePerNight: 2500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: uuidv4(), roomNumber: '202', floor: '2', type: 'suite', capacity: 3, status: 'available', pricePerNight: 2500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: uuidv4(), roomNumber: '301', floor: '3', type: 'deluxe', capacity: 4, status: 'available', pricePerNight: 3500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: uuidv4(), roomNumber: '302', floor: '3', type: 'deluxe', capacity: 4, status: 'available', pricePerNight: 3500, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    saveToStorage(STORAGE_KEYS.ROOMS, defaultRooms);
    return defaultRooms;
  }
  return rooms;
};

export const getRoomByNumber = (roomNumber: string): Room | undefined => {
  return getRooms().find(r => r.roomNumber === roomNumber);
};

export const addRoom = (room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Room => {
  const rooms = getRooms();
  const newRoom: Room = {
    ...room,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rooms.push(newRoom);
  saveToStorage(STORAGE_KEYS.ROOMS, rooms);
  return newRoom;
};

export const updateRoom = (roomId: string, updates: Partial<Room>): Room | null => {
  const rooms = getRooms();
  const index = rooms.findIndex(r => r.id === roomId);
  if (index === -1) return null;

  rooms[index] = { 
    ...rooms[index], 
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveToStorage(STORAGE_KEYS.ROOMS, rooms);
  return rooms[index];
};

export const deleteRoom = (roomId: string): boolean => {
  const rooms = getRooms();
  const filtered = rooms.filter(r => r.id !== roomId);
  if (filtered.length === rooms.length) return false;
  saveToStorage(STORAGE_KEYS.ROOMS, filtered);
  return true;
};

// ============ PAYMENT MANAGEMENT ============

export const getPayments = (): Payment[] => {
  return getFromStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPaymentById = (id: string): Payment | undefined => {
  return getPayments().find(p => p.id === id);
};

export const getPaymentsByDonor = (donorId: string): Payment[] => {
  return getPayments().filter(p => p.donorId === donorId);
};

export const addPayment = (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Payment => {
  const payments = getPayments();
  const donor = getDonorById(payment.donorId);
  
  const newPayment: Payment = {
    ...payment,
    id: uuidv4(),
    donorName: donor?.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  payments.push(newPayment);
  saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
  return newPayment;
};

export const addInstallment = (
  paymentId: string, 
  installment: Omit<Installment, 'id' | 'paymentId' | 'createdAt'>
): Installment | null => {
  const payments = getPayments();
  const index = payments.findIndex(p => p.id === paymentId);
  if (index === -1) return null;

  const newInstallment: Installment = {
    ...installment,
    id: uuidv4(),
    paymentId,
    createdAt: new Date().toISOString(),
  };
  
  payments[index].installments.push(newInstallment);
  payments[index].amountPaid += installment.amount;
  payments[index].remainingAmount = payments[index].totalAmount - payments[index].amountPaid;
  payments[index].status = payments[index].remainingAmount <= 0 ? 'completed' : 'partial';
  payments[index].updatedAt = new Date().toISOString();
  
  saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
  
  // Update donor's donation amount
  const donor = getDonorById(payments[index].donorId);
  if (donor) {
    const totalPaid = getPaymentsByDonor(donor.id).reduce((sum, p) => sum + p.amountPaid, 0);
    updateDonor(donor.id, { donationAmount: totalPaid });
  }
  
  // Add payment confirmation notification
  addNotification({
    donorId: payments[index].donorId,
    guestName: payments[index].donorName || 'Guest',
    type: 'payment_confirmation',
    message: `Payment of ₹${installment.amount.toLocaleString()} received. Remaining: ₹${payments[index].remainingAmount.toLocaleString()}`,
  });
  
  return newInstallment;
};

// ============ BILL MANAGEMENT ============

export const getBills = (): Bill[] => {
  return getFromStorage<Bill[]>(STORAGE_KEYS.BILLS, [])
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
};

export const generateBillNumber = (): string => {
  const counter = getFromStorage<number>(STORAGE_KEYS.BILL_COUNTER, 1000);
  const newCounter = counter + 1;
  saveToStorage(STORAGE_KEYS.BILL_COUNTER, newCounter);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `BILL-${date}-${newCounter}`;
};

export const generateBill = (bookingId: string): Bill | null => {
  const booking = getBookingById(bookingId);
  if (!booking) return null;
  
  let guestName = '';
  let guestMobile = '';
  let guestAddress = '';
  
  if (booking.guestType === 'donor' && booking.donorId) {
    const donor = getDonorById(booking.donorId);
    if (donor) {
      guestName = donor.name;
      guestMobile = donor.mobile;
      guestAddress = donor.address;
    }
  } else if (booking.guestId) {
    const guest = getGuestById(booking.guestId);
    if (guest) {
      guestName = guest.name;
      guestMobile = guest.mobile;
      guestAddress = guest.address;
    }
  }
  
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate || new Date());
  const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
  
  const bill: Bill = {
    id: uuidv4(),
    billNumber: generateBillNumber(),
    bookingId,
    guestName,
    guestMobile,
    guestAddress,
    guestType: booking.guestType,
    donorId: booking.donorId,
    
    hotelName: 'DonorStay Guest House',
    hotelAddress: 'Main Road, City Center',
    hotelPhone: '+91 7207357312',
    
    roomNumbers: booking.roomNumbers,
    roomType: 'Standard',
    checkInDate: booking.checkInDate,
    checkInTime: booking.checkInTime,
    checkOutDate: booking.checkOutDate || new Date().toISOString().split('T')[0],
    checkOutTime: booking.checkOutTime || new Date().toTimeString().slice(0, 5),
    numberOfNights: nights,
    numberOfGuests: booking.numberOfGuests,
    
    roomCharges: booking.totalAmount,
    taxes: 0,
    discount: booking.isFreeStay ? booking.totalAmount : 0,
    totalAmount: booking.isFreeStay ? 0 : booking.totalAmount,
    paidAmount: booking.paidAmount,
    remainingAmount: booking.remainingAmount,
    paymentMethod: booking.paymentMethod || 'cash',
    isFreeStay: booking.isFreeStay,
    
    generatedAt: new Date().toISOString(),
  };
  
  const bills = getBills();
  bills.push(bill);
  saveToStorage(STORAGE_KEYS.BILLS, bills);
  
  return bill;
};

// ============ NOTIFICATION MANAGEMENT ============

export const getNotifications = (): Notification[] => {
  return getFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, [])
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification => {
  const notifications = getNotifications();
  const newNotification: Notification = {
    ...notification,
    id: uuidv4(),
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifications.unshift(newNotification);
  saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  return newNotification;
};

export const markNotificationRead = (id: string): boolean => {
  const notifications = getNotifications();
  const index = notifications.findIndex(n => n.id === id);
  if (index === -1) return false;

  notifications[index].read = true;
  saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  return true;
};

export const markAllNotificationsRead = (): void => {
  const notifications = getNotifications();
  notifications.forEach(n => n.read = true);
  saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
};

// ============ WHATSAPP INTEGRATION ============

export const generateWhatsAppLink = (phone: string, message: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

export const sendWhatsAppMessage = (phone: string, messageType: string, data: Record<string, string>): string => {
  const templates: Record<string, string> = {
    welcome: `Welcome to DonorStay Guest House, ${data.name}! 🙏\n\nYour Donor ID: ${data.donorId}\nFree Rooms Available: ${data.freeRooms}\n\nThank you for your generous donation.`,
    booking_confirmation: `Booking Confirmed! 🎉\n\nGuest: ${data.name}\nRoom: ${data.roomNumber}\nCheck-in: ${data.checkInDate} at ${data.checkInTime}\nGuests: ${data.guests}\n\nWe look forward to hosting you!`,
    check_in: `Check-in Confirmed ✅\n\nWelcome, ${data.name}!\nRoom: ${data.roomNumber}\nDate: ${data.date}\nTime: ${data.time}\n\nEnjoy your stay!`,
    check_out: `Check-out Completed 👋\n\nThank you for staying with us, ${data.name}!\nBill Amount: ₹${data.amount}\n\nWe hope to see you again soon!`,
    payment: `Payment Received 💰\n\nDear ${data.name},\nAmount: ₹${data.amount}\nPayment Mode: ${data.method}\nRemaining: ₹${data.remaining}\n\nThank you!`,
  };
  
  const message = templates[messageType] || data.message || '';
  return generateWhatsAppLink(phone, message);
};

// ============ DASHBOARD STATS ============

export const getDashboardStats = (): DashboardStats => {
  const donors = getDonors();
  const guests = getGuests();
  const rooms = getRooms();
  const payments = getPayments();
  const notifications = getNotifications();
  const bookings = getBookings();

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const totalDonations = donors.reduce((sum, d) => sum + d.donationAmount, 0);
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const pendingPayments = payments.filter(p => p.status !== 'completed');
  const pendingPaymentsAmount = pendingPayments.reduce((sum, p) => sum + p.remainingAmount, 0);
  const unreadNotifications = notifications.filter(n => !n.read).length;
  
  const todayBookings = bookings.filter(b => b.checkInDate === today);
  const todayCheckOuts = bookings.filter(b => b.checkOutDate === today);
  
  const monthlyBookings = bookings.filter(b => b.createdAt.startsWith(currentMonth));
  const monthlyIncome = monthlyBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  
  const donorBookings = bookings.filter(b => b.guestType === 'donor');
  const nonDonorBookings = bookings.filter(b => b.guestType === 'non_donor');
  
  const donorRevenue = donorBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const nonDonorRevenue = nonDonorBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);

  return {
    totalDonors: donors.length,
    totalDonations,
    totalGuests: guests.length,
    occupiedRooms,
    availableRooms,
    totalRooms: rooms.length,
    pendingPayments: pendingPayments.length,
    pendingPaymentsAmount,
    unreadNotifications,
    todayCheckIns: todayBookings.length,
    todayCheckOuts: todayCheckOuts.length,
    monthlyIncome,
    donorRevenue,
    nonDonorRevenue,
  };
};

// ============ GLOBAL SEARCH ============

export const globalSearch = (term: string): {
  donors: Donor[];
  guests: Guest[];
  bookings: Visit[];
} => {
  return {
    donors: searchDonors(term),
    guests: searchGuests(term),
    bookings: getBookings().filter(b => {
      const donor = b.donorId ? getDonorById(b.donorId) : null;
      const guest = b.guestId ? getGuestById(b.guestId) : null;
      const name = donor?.name || guest?.name || '';
      const id = donor?.donorId || '';
      const mobile = donor?.mobile || guest?.mobile || '';
      const lower = term.toLowerCase();
      return name.toLowerCase().includes(lower) || id.toLowerCase().includes(lower) || mobile.includes(term);
    }),
  };
};
