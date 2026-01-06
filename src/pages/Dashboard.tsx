import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import { Users, BedDouble, IndianRupee, Bell, TrendingUp, Clock } from 'lucide-react';
import { getDashboardStats, getNotifications, getRooms, getDonors } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalDonations: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    totalRooms: 0,
    pendingPayments: 0,
    unreadNotifications: 0,
    recentDonors: [] as any[],
  });

  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    const dashStats = getDashboardStats();
    setStats(dashStats);

    // Get recent bookings from all donors
    const donors = getDonors();
    const allBookings = donors.flatMap(d => 
      d.visitHistory.map(v => ({
        ...v,
        donorName: d.name,
        donorId: d.donorId,
      }))
    );
    const sorted = allBookings.sort((a, b) => 
      new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
    );
    setRecentBookings(sorted.slice(0, 5));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle="Welcome back! Here's an overview of your donor management system."
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Donors"
          value={stats.totalDonors}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Donations"
          value={formatCurrency(stats.totalDonations)}
          icon={IndianRupee}
          variant="primary"
        />
        <StatCard
          title="Rooms Occupied"
          value={`${stats.occupiedRooms}/${stats.totalRooms}`}
          icon={BedDouble}
          variant="accent"
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Donors */}
        <div className="card-elevated p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-serif font-semibold">Recent Donors</h2>
            <a href="/donors" className="text-sm text-primary hover:underline">View all</a>
          </div>
          
          {stats.recentDonors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No donors yet. Add your first donor!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentDonors.map((donor) => (
                <div key={donor.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {donor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{donor.name}</p>
                    <p className="text-sm text-muted-foreground">{donor.donorId}</p>
                  </div>
                  <span className="badge-success">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-serif font-semibold">Recent Bookings</h2>
            <a href="/bookings" className="text-sm text-primary hover:underline">View all</a>
          </div>
          
          {recentBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No bookings yet. Create a booking!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <BedDouble className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{booking.donorName}</p>
                    <p className="text-sm text-muted-foreground">
                      Room {booking.roomNumber} • {format(new Date(booking.checkInDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className={
                    booking.status === 'checked_in' ? 'badge-success' :
                    booking.status === 'checked_out' ? 'badge-warning' : 'badge-destructive'
                  }>
                    {booking.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Room Availability Quick View */}
      <div className="mt-6 card-elevated p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-serif font-semibold">Room Availability</h2>
          <a href="/rooms" className="text-sm text-primary hover:underline">Manage rooms</a>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getRooms().slice(0, 8).map((room) => (
            <div 
              key={room.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                room.status === 'available' 
                  ? 'border-success/30 bg-success/5' 
                  : room.status === 'occupied'
                  ? 'border-warning/30 bg-warning/5'
                  : 'border-muted bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Room {room.roomNumber}</span>
                <span className={`w-3 h-3 rounded-full ${
                  room.status === 'available' ? 'bg-success' :
                  room.status === 'occupied' ? 'bg-warning' : 'bg-muted-foreground'
                }`} />
              </div>
              <p className="text-sm text-muted-foreground capitalize mt-1">{room.type}</p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
