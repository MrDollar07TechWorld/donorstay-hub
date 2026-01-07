import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Clock, Users as UsersIcon, BedDouble, Eye, Download, Search, Filter, MessageCircle } from 'lucide-react';
import { Donor, Guest, Room, Visit } from '@/types';
import { getDonors, getRooms, addBooking, updateBooking, checkIn, checkOut, getBookings, addGuest, getGuests, generateBill, sendWhatsAppMessage, getDonorById, getGuestById } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import PaginationControls from '@/components/ui/pagination-controls';

const Bookings = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Visit[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Visit | null>(null);
  const [guestType, setGuestType] = useState<'donor' | 'non_donor'>('donor');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGuestType, setFilterGuestType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    donorId: '',
    guestName: '',
    guestMobile: '',
    guestAddress: '',
    roomNumbers: [] as string[],
    checkInDate: format(new Date(), 'yyyy-MM-dd'),
    checkInTime: format(new Date(), 'HH:mm'),
    expectedCheckOutDate: '',
    numberOfGuests: 1,
    isFreeStay: false,
    totalAmount: 0,
    paidAmount: 0,
    paymentMethod: 'cash' as Visit['paymentMethod'],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDonors(getDonors());
    setGuests(getGuests());
    setRooms(getRooms());
    setBookings(getBookings());
  };

  const availableRooms = rooms.filter(r => r.status === 'available');

  const calculateTotal = (roomNums: string[], nights: number = 1) => {
    return roomNums.reduce((sum, num) => {
      const room = rooms.find(r => r.roomNumber === num);
      return sum + (room?.pricePerNight || 0) * nights;
    }, 0);
  };

  const handleRoomToggle = (roomNumber: string) => {
    const newRooms = formData.roomNumbers.includes(roomNumber)
      ? formData.roomNumbers.filter(r => r !== roomNumber)
      : [...formData.roomNumbers, roomNumber];
    
    setFormData({
      ...formData,
      roomNumbers: newRooms,
      totalAmount: formData.isFreeStay ? 0 : calculateTotal(newRooms),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.roomNumbers.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one room', variant: 'destructive' });
      return;
    }

    let guestId: string | undefined;
    let donorId: string | undefined;

    if (guestType === 'donor') {
      if (!formData.donorId) {
        toast({ title: 'Error', description: 'Please select a donor', variant: 'destructive' });
        return;
      }
      donorId = formData.donorId;
    } else {
      if (!formData.guestName || !formData.guestMobile) {
        toast({ title: 'Error', description: 'Please enter guest details', variant: 'destructive' });
        return;
      }
      const guest = addGuest({
        name: formData.guestName,
        mobile: formData.guestMobile,
        address: formData.guestAddress,
      });
      guestId = guest.id;
    }

    const booking: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'> = {
      donorId,
      guestId,
      guestType,
      checkInDate: formData.checkInDate,
      checkInTime: formData.checkInTime,
      expectedCheckOutDate: formData.expectedCheckOutDate,
      roomNumbers: formData.roomNumbers,
      numberOfGuests: formData.numberOfGuests,
      status: 'upcoming',
      totalAmount: formData.isFreeStay ? 0 : formData.totalAmount,
      paidAmount: formData.paidAmount,
      remainingAmount: (formData.isFreeStay ? 0 : formData.totalAmount) - formData.paidAmount,
      paymentMethod: formData.paymentMethod,
      isFreeStay: formData.isFreeStay,
    };

    addBooking(booking);

    // Send WhatsApp notification
    const guestName = guestType === 'donor' 
      ? donors.find(d => d.id === donorId)?.name || 'Guest'
      : formData.guestName;
    const guestPhone = guestType === 'donor'
      ? donors.find(d => d.id === donorId)?.mobile || ''
      : formData.guestMobile;

    if (guestPhone) {
      const whatsappLink = sendWhatsAppMessage(guestPhone, 'booking_confirmation', {
        name: guestName,
        roomNumber: formData.roomNumbers.join(', '),
        checkInDate: formData.checkInDate,
        checkInTime: formData.checkInTime,
        guests: String(formData.numberOfGuests),
      });
      // Open WhatsApp link in new tab (for demo purposes)
      // window.open(whatsappLink, '_blank');
    }

    toast({
      title: 'Booking Created',
      description: `Room ${formData.roomNumbers.join(', ')} booked successfully`,
    });

    loadData();
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      donorId: '',
      guestName: '',
      guestMobile: '',
      guestAddress: '',
      roomNumbers: [],
      checkInDate: format(new Date(), 'yyyy-MM-dd'),
      checkInTime: format(new Date(), 'HH:mm'),
      expectedCheckOutDate: '',
      numberOfGuests: 1,
      isFreeStay: false,
      totalAmount: 0,
      paidAmount: 0,
      paymentMethod: 'cash',
    });
    setGuestType('donor');
  };

  const handleCheckIn = (booking: Visit) => {
    checkIn(booking.id);
    loadData();
    toast({ title: 'Checked In', description: 'Guest has been checked in' });
  };

  const handleCheckOut = (booking: Visit) => {
    checkOut(booking.id);
    generateBill(booking.id);
    loadData();
    toast({ title: 'Checked Out', description: 'Guest has been checked out and bill generated' });
  };

  const handleViewDetails = (booking: Visit) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  const getGuestInfo = (booking: Visit) => {
    if (booking.guestType === 'donor' && booking.donorId) {
      const donor = getDonorById(booking.donorId);
      return { name: donor?.name || 'Unknown', id: donor?.donorId, mobile: donor?.mobile, address: donor?.address };
    } else if (booking.guestId) {
      const guest = getGuestById(booking.guestId);
      return { name: guest?.name || 'Unknown', mobile: guest?.mobile, address: guest?.address };
    }
    return { name: 'Unknown' };
  };

  // Filter and paginate
  const filteredBookings = bookings.filter(b => {
    const info = getGuestInfo(b);
    const matchesSearch = info.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      info.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      info.mobile?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesType = filterGuestType === 'all' || b.guestType === filterGuestType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredBookings.length / pageSize);
  const paginatedBookings = filteredBookings.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout title="Bookings" subtitle="Manage room bookings and check-ins">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="stat-card shadow-md px-4 py-2">
            <span className="text-sm text-muted-foreground">Active</span>
            <span className="ml-2 font-bold text-success">
              {bookings.filter(b => b.status === 'checked_in').length}
            </span>
          </div>
          <div className="stat-card shadow-md px-4 py-2">
            <span className="text-sm text-muted-foreground">Upcoming</span>
            <span className="ml-2 font-bold text-warning">
              {bookings.filter(b => b.status === 'upcoming').length}
            </span>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-accent gap-2">
              <Plus className="w-4 h-4" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Create New Booking</DialogTitle>
            </DialogHeader>
            
            <Tabs value={guestType} onValueChange={(v) => setGuestType(v as 'donor' | 'non_donor')} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="donor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Donor Booking
                </TabsTrigger>
                <TabsTrigger value="non_donor" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                  Non-Donor Booking
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <TabsContent value="donor" className="space-y-4 mt-0">
                  <div>
                    <label className="text-sm font-medium text-foreground">Select Donor</label>
                    <select
                      value={formData.donorId}
                      onChange={(e) => {
                        const donor = donors.find(d => d.id === e.target.value);
                        const canUseFreeStay = donor && (donor.freeRoomsEntitled - donor.freeRoomsUsed) > 0;
                        setFormData({ ...formData, donorId: e.target.value, isFreeStay: canUseFreeStay || false });
                      }}
                      className="input-styled mt-1"
                    >
                      <option value="">Choose a donor...</option>
                      {donors.map((donor) => (
                        <option key={donor.id} value={donor.id}>
                          {donor.name} ({donor.donorId}) - {donor.freeRoomsEntitled - donor.freeRoomsUsed} free rooms left
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {formData.donorId && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="freeStay"
                        checked={formData.isFreeStay}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          isFreeStay: e.target.checked,
                          totalAmount: e.target.checked ? 0 : calculateTotal(formData.roomNumbers),
                        })}
                        className="rounded"
                      />
                      <label htmlFor="freeStay" className="text-sm text-foreground">
                        Use free stay entitlement
                      </label>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="non_donor" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Guest Name</label>
                      <input
                        type="text"
                        value={formData.guestName}
                        onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                        className="input-styled mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Mobile Number</label>
                      <input
                        type="tel"
                        value={formData.guestMobile}
                        onChange={(e) => setFormData({ ...formData, guestMobile: e.target.value })}
                        className="input-styled mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Address</label>
                    <textarea
                      value={formData.guestAddress}
                      onChange={(e) => setFormData({ ...formData, guestAddress: e.target.value })}
                      className="input-styled mt-1"
                      rows={2}
                    />
                  </div>
                </TabsContent>

                {/* Common fields */}
                <div>
                  <label className="text-sm font-medium text-foreground">Select Room(s)</label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {availableRooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => handleRoomToggle(room.roomNumber)}
                        className={`p-3 rounded-lg border-2 transition-all text-center ${
                          formData.roomNumbers.includes(room.roomNumber)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-semibold">{room.roomNumber}</p>
                        <p className="text-xs text-muted-foreground">{room.type}</p>
                        <p className="text-xs">₹{room.pricePerNight}</p>
                      </button>
                    ))}
                  </div>
                  {availableRooms.length === 0 && (
                    <p className="text-sm text-destructive mt-1">No rooms available</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Check-in Date</label>
                    <input
                      type="date"
                      value={formData.checkInDate}
                      onChange={(e) => setFormData({ ...formData, checkInDate: e.target.value })}
                      className="input-styled mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Check-in Time</label>
                    <input
                      type="time"
                      value={formData.checkInTime}
                      onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                      className="input-styled mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Expected Check-out</label>
                    <input
                      type="date"
                      value={formData.expectedCheckOutDate}
                      onChange={(e) => setFormData({ ...formData, expectedCheckOutDate: e.target.value })}
                      className="input-styled mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Number of Guests</label>
                    <input
                      type="number"
                      value={formData.numberOfGuests}
                      onChange={(e) => setFormData({ ...formData, numberOfGuests: Number(e.target.value) })}
                      className="input-styled mt-1"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                {!formData.isFreeStay && (
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-foreground">Total Amount</label>
                      <p className="text-xl font-bold text-foreground mt-1">
                        {formatCurrency(formData.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Paid Amount</label>
                      <input
                        type="number"
                        value={formData.paidAmount}
                        onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                        className="input-styled mt-1"
                        min="0"
                        max={formData.totalAmount}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Payment Method</label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as Visit['paymentMethod'] })}
                        className="input-styled mt-1"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </select>
                    </div>
                  </div>
                )}

                {formData.isFreeStay && (
                  <div className="p-4 bg-success/10 rounded-lg border border-success/30">
                    <p className="text-success font-semibold">✓ Free Stay Applied</p>
                    <p className="text-sm text-muted-foreground">This booking will use the donor's free stay entitlement</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-primary">
                    Create Booking
                  </Button>
                </div>
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, ID, or mobile..."
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
          <option value="upcoming">Upcoming</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
        </select>
        <select
          value={filterGuestType}
          onChange={(e) => { setFilterGuestType(e.target.value); setCurrentPage(1); }}
          className="input-styled w-40"
        >
          <option value="all">All Guests</option>
          <option value="donor">Donors Only</option>
          <option value="non_donor">Non-Donors Only</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="table-header px-6 py-4 text-left">Guest</th>
                <th className="table-header px-6 py-4 text-left">Room</th>
                <th className="table-header px-6 py-4 text-left">Check-in</th>
                <th className="table-header px-6 py-4 text-left">Guests</th>
                <th className="table-header px-6 py-4 text-left">Amount</th>
                <th className="table-header px-6 py-4 text-left">Status</th>
                <th className="table-header px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No bookings yet. Create your first booking!</p>
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((booking) => {
                  const info = getGuestInfo(booking);
                  return (
                    <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">{info.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {info.id || info.mobile} • 
                            <span className={booking.guestType === 'donor' ? 'text-primary' : 'text-accent'}>
                              {' '}{booking.guestType === 'donor' ? 'Donor' : 'Guest'}
                            </span>
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <BedDouble className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground">Room {booking.roomNumbers.join(', ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(booking.checkInDate), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {booking.checkInTime}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <UsersIcon className="w-4 h-4" />
                          {booking.numberOfGuests}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {booking.isFreeStay ? (
                          <span className="badge-success">Free Stay</span>
                        ) : (
                          <span className="font-medium text-foreground">
                            {formatCurrency(booking.totalAmount)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={
                          booking.status === 'checked_in' ? 'badge-success' :
                          booking.status === 'checked_out' ? 'badge-warning' : 'badge-destructive'
                        }>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(booking)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {booking.status === 'upcoming' && (
                            <Button
                              size="sm"
                              onClick={() => handleCheckIn(booking)}
                              className="btn-primary text-xs h-8"
                            >
                              Check In
                            </Button>
                          )}
                          {booking.status === 'checked_in' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(booking)}
                              className="text-xs h-8"
                            >
                              Check Out
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {filteredBookings.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredBookings.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        )}
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedBooking && (() => {
            const info = getGuestInfo(selectedBooking);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">Booking Details</DialogTitle>
                </DialogHeader>
                
                <div className="mt-4 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">Guest Information</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> {info.name}</p>
                        <p><span className="text-muted-foreground">Type:</span> {selectedBooking.guestType === 'donor' ? 'Donor' : 'Non-Donor'}</p>
                        {info.id && <p><span className="text-muted-foreground">Donor ID:</span> {info.id}</p>}
                        <p><span className="text-muted-foreground">Mobile:</span> {info.mobile || 'N/A'}</p>
                        <p><span className="text-muted-foreground">Address:</span> {info.address || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold text-foreground">Room Details</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Room(s):</span> {selectedBooking.roomNumbers.join(', ')}</p>
                        <p><span className="text-muted-foreground">Guests:</span> {selectedBooking.numberOfGuests}</p>
                        <p><span className="text-muted-foreground">Check-in:</span> {selectedBooking.checkInDate} at {selectedBooking.checkInTime}</p>
                        <p><span className="text-muted-foreground">Check-out:</span> {selectedBooking.checkOutDate || 'Pending'} {selectedBooking.checkOutTime ? `at ${selectedBooking.checkOutTime}` : ''}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-3">Payment Details</h3>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-bold text-foreground">
                          {selectedBooking.isFreeStay ? 'Free Stay' : formatCurrency(selectedBooking.totalAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="font-bold text-success">{formatCurrency(selectedBooking.paidAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className="font-bold text-warning">{formatCurrency(selectedBooking.remainingAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Method</p>
                        <p className="font-bold text-foreground capitalize">{selectedBooking.paymentMethod || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    {info.mobile && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const link = sendWhatsAppMessage(info.mobile!, 'booking_confirmation', {
                            name: info.name || '',
                            roomNumber: selectedBooking.roomNumbers.join(', '),
                            checkInDate: selectedBooking.checkInDate,
                            checkInTime: selectedBooking.checkInTime,
                            guests: String(selectedBooking.numberOfGuests),
                          });
                          window.open(link, '_blank');
                        }}
                        className="gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Bookings;
