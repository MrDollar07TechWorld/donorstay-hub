import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { BedDouble, Users, DollarSign } from 'lucide-react';
import { Room } from '@/types';
import { getRooms, updateRoom } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

const RoomManagement = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setRooms(getRooms());
  }, []);

  const handleStatusChange = (roomId: string, status: Room['status']) => {
    updateRoom(roomId, { status, currentDonorId: status === 'available' ? undefined : undefined });
    setRooms(getRooms());
    toast({
      title: 'Room Updated',
      description: `Room status changed to ${status}`,
    });
  };

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'available':
        return 'bg-success text-success-foreground';
      case 'occupied':
        return 'bg-warning text-warning-foreground';
      case 'maintenance':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRoomTypeIcon = (type: Room['type']) => {
    switch (type) {
      case 'single':
        return <Users className="w-4 h-4" />;
      case 'double':
        return <Users className="w-4 h-4" />;
      case 'suite':
        return <BedDouble className="w-4 h-4" />;
      case 'deluxe':
        return <BedDouble className="w-4 h-4" />;
      default:
        return <BedDouble className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const roomsByFloor = rooms.reduce((acc, room) => {
    const floor = room.roomNumber.charAt(0);
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  return (
    <MainLayout title="Room Management" subtitle="View and manage room availability">
      {/* Room Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card shadow-md">
          <p className="text-sm text-muted-foreground">Total Rooms</p>
          <p className="text-2xl font-bold font-serif mt-1">{rooms.length}</p>
        </div>
        <div className="stat-card shadow-md border-l-4 border-l-success">
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-2xl font-bold font-serif mt-1 text-success">
            {rooms.filter(r => r.status === 'available').length}
          </p>
        </div>
        <div className="stat-card shadow-md border-l-4 border-l-warning">
          <p className="text-sm text-muted-foreground">Occupied</p>
          <p className="text-2xl font-bold font-serif mt-1 text-warning">
            {rooms.filter(r => r.status === 'occupied').length}
          </p>
        </div>
        <div className="stat-card shadow-md border-l-4 border-l-destructive">
          <p className="text-sm text-muted-foreground">Maintenance</p>
          <p className="text-2xl font-bold font-serif mt-1 text-destructive">
            {rooms.filter(r => r.status === 'maintenance').length}
          </p>
        </div>
      </div>

      {/* Rooms by Floor */}
      {Object.entries(roomsByFloor).map(([floor, floorRooms]) => (
        <div key={floor} className="mb-8">
          <h2 className="text-lg font-serif font-semibold mb-4">Floor {floor}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {floorRooms.map((room) => (
              <div key={room.id} className="card-elevated p-5 animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {getRoomTypeIcon(room.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Room {room.roomNumber}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{room.type}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(room.pricePerNight)}/night
                  </span>
                </div>

                <div className="space-y-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </span>

                  <select
                    value={room.status}
                    onChange={(e) => handleStatusChange(room.id, e.target.value as Room['status'])}
                    className="input-styled text-sm mt-2"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </MainLayout>
  );
};

export default RoomManagement;
