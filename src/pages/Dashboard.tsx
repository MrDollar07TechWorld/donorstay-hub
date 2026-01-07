import MainLayout from '@/components/layout/MainLayout';
import StatCard from '@/components/dashboard/StatCard';
import { Users, BedDouble, IndianRupee, TrendingUp, Calendar, UserCheck, UserX } from 'lucide-react';
import { getDashboardStats, getRooms, getDonors, getBookings } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { DashboardStats, Donor, Visit } from '@/types';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDonors, setRecentDonors] = useState<Donor[]>([]);
  const [recentBookings, setRecentBookings] = useState<Visit[]>([]);

  useEffect(() => {
    const dashStats = getDashboardStats();
    setStats(dashStats);
    setRecentDonors(getDonors().slice(0, 5));
    setRecentBookings(getBookings().slice(0, 5));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!stats) {
    return (
      <MainLayout title="Dashboard" subtitle="Loading...">
        <div className="animate-pulse">Loading...</div>
      </MainLayout>
    );
  }

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

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card shadow-md text-center">
          <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold">{stats.todayCheckIns}</p>
          <p className="text-xs text-muted-foreground">Today's Check-ins</p>
        </div>
        <div className="stat-card shadow-md text-center">
          <UserX className="w-6 h-6 mx-auto mb-2 text-warning" />
          <p className="text-2xl font-bold">{stats.todayCheckOuts}</p>
          <p className="text-xs text-muted-foreground">Today's Check-outs</p>
        </div>
        <div className="stat-card shadow-md text-center">
          <IndianRupee className="w-6 h-6 mx-auto mb-2 text-success" />
          <p className="text-2xl font-bold">{formatCurrency(stats.monthlyIncome)}</p>
          <p className="text-xs text-muted-foreground">Monthly Income</p>
        </div>
        <div className="stat-card shadow-md text-center">
          <UserCheck className="w-6 h-6 mx-auto mb-2 text-accent" />
          <p className="text-2xl font-bold">{stats.totalGuests}</p>
          <p className="text-xs text-muted-foreground">Non-Donor Guests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Donors */}
        <div className="card-elevated p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-serif font-semibold">Recent Donors</h2>
            <a href="/donors" className="text-sm text-primary hover:underline">View all</a>
          </div>
          
          {recentDonors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No donors yet. Add your first donor!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentDonors.map((donor) => (
                <div key={donor.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">
                      {donor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{donor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {donor.donorId} • {formatCurrency(donor.donationAmount)}
                    </p>
                  </div>
                  <span className="badge-success">
                    {donor.freeRoomsEntitled - donor.freeRoomsUsed} free
                  </span>
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
                    <p className="font-medium text-foreground">
                      Room {booking.roomNumbers.join(', ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.checkInDate), 'MMM d, yyyy')} • 
                      <span className={booking.guestType === 'donor' ? 'text-primary' : 'text-accent'}>
                        {' '}{booking.guestType === 'donor' ? 'Donor' : 'Guest'}
                      </span>
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
                  : room.status === 'reserved'
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-muted bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Room {room.roomNumber}</span>
                <span className={`w-3 h-3 rounded-full ${
                  room.status === 'available' ? 'bg-success' :
                  room.status === 'occupied' ? 'bg-warning' : 
                  room.status === 'reserved' ? 'bg-primary' : 'bg-muted-foreground'
                }`} />
              </div>
              <p className="text-sm text-muted-foreground capitalize mt-1">{room.type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-elevated p-6">
          <h3 className="font-semibold text-foreground mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Donor Revenue</span>
              <span className="font-bold text-primary">{formatCurrency(stats.donorRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Non-Donor Revenue</span>
              <span className="font-bold text-accent">{formatCurrency(stats.nonDonorRevenue)}</span>
            </div>
            <div className="border-t border-border pt-4 flex items-center justify-between">
              <span className="font-semibold text-foreground">Total Revenue</span>
              <span className="font-bold text-success">{formatCurrency(stats.donorRevenue + stats.nonDonorRevenue)}</span>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6">
          <h3 className="font-semibold text-foreground mb-4">Pending Payments</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Number of Pending</span>
              <span className="font-bold text-warning">{stats.pendingPayments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Pending Amount</span>
              <span className="font-bold text-destructive">{formatCurrency(stats.pendingPaymentsAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
