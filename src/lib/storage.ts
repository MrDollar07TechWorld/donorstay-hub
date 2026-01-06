import { Donor, Room, Payment, Notification, Visit, Installment } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
  DONORS: 'donor_management_donors',
  ROOMS: 'donor_management_rooms',
  PAYMENTS: 'donor_management_payments',
  NOTIFICATIONS: 'donor_management_notifications',
  DONOR_ID_COUNTER: 'donor_management_id_counter',
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

// Donor ID generation
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

// Donor CRUD
export const getDonors = (): Donor[] => {
  return getFromStorage<Donor[]>(STORAGE_KEYS.DONORS, []);
};

export const getDonorById = (id: string): Donor | undefined => {
  return getDonors().find(d => d.id === id);
};

export const getDonorByDonorId = (donorId: string): Donor | undefined => {
  return getDonors().find(d => d.donorId === donorId);
};

export const addDonor = (donor: Omit<Donor, 'id' | 'createdAt' | 'updatedAt' | 'visitHistory'>): Donor => {
  const donors = getDonors();
  const newDonor: Donor = {
    ...donor,
    id: uuidv4(),
    visitHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  donors.push(newDonor);
  saveToStorage(STORAGE_KEYS.DONORS, donors);
  return newDonor;
};

export const updateDonor = (id: string, updates: Partial<Donor>): Donor | null => {
  const donors = getDonors();
  const index = donors.findIndex(d => d.id === id);
  if (index === -1) return null;
  
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

// Visit/Booking management
export const addVisit = (donorId: string, visit: Omit<Visit, 'id' | 'donorId'>): Visit | null => {
  const donors = getDonors();
  const index = donors.findIndex(d => d.id === donorId);
  if (index === -1) return null;

  const newVisit: Visit = {
    ...visit,
    id: uuidv4(),
    donorId,
  };
  donors[index].visitHistory.push(newVisit);
  donors[index].updatedAt = new Date().toISOString();
  saveToStorage(STORAGE_KEYS.DONORS, donors);
  return newVisit;
};

export const updateVisit = (donorId: string, visitId: string, updates: Partial<Visit>): boolean => {
  const donors = getDonors();
  const donorIndex = donors.findIndex(d => d.id === donorId);
  if (donorIndex === -1) return false;

  const visitIndex = donors[donorIndex].visitHistory.findIndex(v => v.id === visitId);
  if (visitIndex === -1) return false;

  donors[donorIndex].visitHistory[visitIndex] = {
    ...donors[donorIndex].visitHistory[visitIndex],
    ...updates,
  };
  donors[donorIndex].updatedAt = new Date().toISOString();
  saveToStorage(STORAGE_KEYS.DONORS, donors);
  return true;
};

// Room management
export const getRooms = (): Room[] => {
  const rooms = getFromStorage<Room[]>(STORAGE_KEYS.ROOMS, []);
  if (rooms.length === 0) {
    // Initialize with default rooms
    const defaultRooms: Room[] = [
      { id: uuidv4(), roomNumber: '101', type: 'single', status: 'available', pricePerNight: 1000 },
      { id: uuidv4(), roomNumber: '102', type: 'single', status: 'available', pricePerNight: 1000 },
      { id: uuidv4(), roomNumber: '103', type: 'double', status: 'available', pricePerNight: 1500 },
      { id: uuidv4(), roomNumber: '104', type: 'double', status: 'available', pricePerNight: 1500 },
      { id: uuidv4(), roomNumber: '201', type: 'suite', status: 'available', pricePerNight: 2500 },
      { id: uuidv4(), roomNumber: '202', type: 'suite', status: 'available', pricePerNight: 2500 },
      { id: uuidv4(), roomNumber: '301', type: 'deluxe', status: 'available', pricePerNight: 3500 },
      { id: uuidv4(), roomNumber: '302', type: 'deluxe', status: 'available', pricePerNight: 3500 },
    ];
    saveToStorage(STORAGE_KEYS.ROOMS, defaultRooms);
    return defaultRooms;
  }
  return rooms;
};

export const updateRoom = (roomId: string, updates: Partial<Room>): Room | null => {
  const rooms = getRooms();
  const index = rooms.findIndex(r => r.id === roomId);
  if (index === -1) return null;

  rooms[index] = { ...rooms[index], ...updates };
  saveToStorage(STORAGE_KEYS.ROOMS, rooms);
  return rooms[index];
};

export const allocateRoom = (roomId: string, donorId: string): boolean => {
  return updateRoom(roomId, { status: 'occupied', currentDonorId: donorId }) !== null;
};

export const releaseRoom = (roomId: string): boolean => {
  return updateRoom(roomId, { status: 'available', currentDonorId: undefined }) !== null;
};

// Payment management
export const getPayments = (): Payment[] => {
  return getFromStorage<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
};

export const getPaymentsByDonor = (donorId: string): Payment[] => {
  return getPayments().filter(p => p.donorId === donorId);
};

export const addPayment = (payment: Omit<Payment, 'id' | 'createdAt'>): Payment => {
  const payments = getPayments();
  const newPayment: Payment = {
    ...payment,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  payments.push(newPayment);
  saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
  return newPayment;
};

export const addInstallment = (paymentId: string, installment: Omit<Installment, 'id' | 'paymentId'>): boolean => {
  const payments = getPayments();
  const index = payments.findIndex(p => p.id === paymentId);
  if (index === -1) return false;

  const newInstallment: Installment = {
    ...installment,
    id: uuidv4(),
    paymentId,
  };
  payments[index].installments.push(newInstallment);
  payments[index].amountPaid += installment.amount;
  payments[index].remainingAmount = payments[index].totalAmount - payments[index].amountPaid;
  payments[index].status = payments[index].remainingAmount <= 0 ? 'completed' : 'partial';
  
  saveToStorage(STORAGE_KEYS.PAYMENTS, payments);
  return true;
};

// Notification management
export const getNotifications = (): Notification[] => {
  return getFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
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

// Stats for dashboard
export const getDashboardStats = () => {
  const donors = getDonors();
  const rooms = getRooms();
  const payments = getPayments();
  const notifications = getNotifications();

  const totalDonations = donors.reduce((sum, d) => sum + d.totalDonation, 0);
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const pendingPayments = payments.filter(p => p.status !== 'completed');
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return {
    totalDonors: donors.length,
    totalDonations,
    occupiedRooms,
    availableRooms,
    totalRooms: rooms.length,
    pendingPayments: pendingPayments.length,
    unreadNotifications,
    recentDonors: donors.slice(-5).reverse(),
  };
};
