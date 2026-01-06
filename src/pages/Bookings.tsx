import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, Clock, Users as UsersIcon, BedDouble } from 'lucide-react';
import { Donor, Room, Visit } from '@/types';
import { getDonors, getRooms, addVisit, updateVisit, allocateRoom, releaseRoom } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const Bookings = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    donorId: '',
    roomId: '',
    checkInDate: format(new Date(), 'yyyy-MM-dd'),
    checkInTime: '14:00',
    numberOfGuests: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDonors(getDonors());
    setRooms(getRooms());
  };

  const getAllBookings = () => {
    return donors.flatMap(d =>
      d.visitHistory.map(v => ({
        ...v,
        donorName: d.name,
        donorDonorId: d.donorId,
      }))
    ).sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const room = rooms.find(r => r.id === formData.roomId);
    if (!room) {
      toast({ title: 'Error', description: 'Please select a room', variant: 'destructive' });
      return;
    }

    if (room.status !== 'available') {
      toast({ title: 'Error', description: 'Room is not available', variant: 'destructive' });
      return;
    }

    const visit: Omit<Visit, 'id' | 'donorId'> = {
      checkInDate: formData.checkInDate,
      checkInTime: formData.checkInTime,
      roomNumber: room.roomNumber,
      numberOfGuests: formData.numberOfGuests,
      status: 'upcoming',
    };

    addVisit(formData.donorId, visit);
    allocateRoom(formData.roomId, formData.donorId);

    toast({
      title: 'Booking Created',
      description: `Room ${room.roomNumber} booked successfully`,
    });

    loadData();
    setIsDialogOpen(false);
    setFormData({
      donorId: '',
      roomId: '',
      checkInDate: format(new Date(), 'yyyy-MM-dd'),
      checkInTime: '14:00',
      numberOfGuests: 1,
    });
  };

  const handleCheckIn = (donorId: string, visitId: string) => {
    updateVisit(donorId, visitId, { status: 'checked_in' });
    loadData();
    toast({ title: 'Checked In', description: 'Guest has been checked in' });
  };

  const handleCheckOut = (donorId: string, visitId: string, roomNumber: string) => {
    updateVisit(donorId, visitId, { 
      status: 'checked_out',
      checkOutDate: format(new Date(), 'yyyy-MM-dd'),
      checkOutTime: format(new Date(), 'HH:mm'),
    });
    
    const room = rooms.find(r => r.roomNumber === roomNumber);
    if (room) {
      releaseRoom(room.id);
    }
    
    loadData();
    toast({ title: 'Checked Out', description: 'Guest has been checked out' });
  };

  const availableRooms = rooms.filter(r => r.status === 'available');
  const bookings = getAllBookings();

  return (
    <MainLayout title="Bookings" subtitle="Manage room bookings and check-ins">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <div className="stat-card shadow-md px-4 py-2">
            <span className="text-sm text-muted-foreground">Active Bookings</span>
            <span className="ml-2 font-bold text-foreground">
              {bookings.filter(b => b.status === 'checked_in').length}
            </span>
          </div>
          <div className="stat-card shadow-md px-4 py-2">
            <span className="text-sm text-muted-foreground">Upcoming</span>
            <span className="ml-2 font-bold text-foreground">
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Create New Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-foreground">Select Donor</label>
                <select
                  value={formData.donorId}
                  onChange={(e) => setFormData({ ...formData, donorId: e.target.value })}
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
                <label className="text-sm font-medium text-foreground">Select Room</label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="input-styled mt-1"
                  required
                >
                  <option value="">Choose a room...</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.roomNumber} - {room.type} (₹{room.pricePerNight}/night)
                    </option>
                  ))}
                </select>
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
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Check-in Time</label>
                  <input
                    type="time"
                    value={formData.checkInTime}
                    onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                    className="input-styled mt-1"
                    required
                  />
                </div>
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
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary">
                  Create Booking
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
                <th className="table-header px-6 py-4 text-left">Status</th>
                <th className="table-header px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No bookings yet. Create your first booking!</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{booking.donorName}</p>
                        <p className="text-sm text-muted-foreground">{booking.donorDonorId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BedDouble className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">Room {booking.roomNumber}</span>
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
                      <span className={
                        booking.status === 'checked_in' ? 'badge-success' :
                        booking.status === 'checked_out' ? 'badge-warning' : 'badge-destructive'
                      }>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {booking.status === 'upcoming' && (
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(booking.donorId, booking.id)}
                          className="btn-primary text-xs"
                        >
                          Check In
                        </Button>
                      )}
                      {booking.status === 'checked_in' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckOut(booking.donorId, booking.id, booking.roomNumber)}
                          className="text-xs"
                        >
                          Check Out
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Bookings;
