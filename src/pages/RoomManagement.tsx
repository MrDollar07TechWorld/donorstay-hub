import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BedDouble, Users, IndianRupee, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Room } from '@/types';
import { getRooms, updateRoom, addRoom, deleteRoom } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

const RoomManagement = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    roomNumber: '',
    floor: '',
    type: 'single' as Room['type'],
    capacity: 1,
    pricePerNight: 1000,
    status: 'available' as Room['status'],
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = () => {
    setRooms(getRooms());
  };

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      floor: '',
      type: 'single',
      capacity: 1,
      pricePerNight: 1000,
      status: 'available',
    });
    setEditingRoom(null);
  };

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        roomNumber: room.roomNumber,
        floor: room.floor,
        type: room.type,
        capacity: room.capacity,
        pricePerNight: room.pricePerNight,
        status: room.status,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRoom) {
      updateRoom(editingRoom.id, formData);
      toast({ title: 'Success', description: 'Room updated successfully' });
    } else {
      addRoom(formData);
      toast({ title: 'Success', description: 'Room added successfully' });
    }

    loadRooms();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room?.status === 'occupied') {
      toast({ title: 'Error', description: 'Cannot delete an occupied room', variant: 'destructive' });
      return;
    }
    if (window.confirm('Are you sure you want to delete this room?')) {
      deleteRoom(roomId);
      loadRooms();
      toast({ title: 'Deleted', description: 'Room has been removed' });
    }
  };

  const handleStatusChange = (roomId: string, status: Room['status']) => {
    updateRoom(roomId, { status });
    loadRooms();
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
      case 'reserved':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter rooms
  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.roomNumber.includes(searchTerm) || r.type.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesType = filterType === 'all' || r.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const roomsByFloor = filteredRooms.reduce((acc, room) => {
    const floor = room.floor || room.roomNumber.charAt(0);
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  return (
    <MainLayout title="Room Management" subtitle="View and manage room availability">
      {/* Room Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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
        <div className="stat-card shadow-md border-l-4 border-l-primary">
          <p className="text-sm text-muted-foreground">Reserved</p>
          <p className="text-2xl font-bold font-serif mt-1 text-primary">
            {rooms.filter(r => r.status === 'reserved').length}
          </p>
        </div>
        <div className="stat-card shadow-md border-l-4 border-l-destructive">
          <p className="text-sm text-muted-foreground">Maintenance</p>
          <p className="text-2xl font-bold font-serif mt-1 text-destructive">
            {rooms.filter(r => r.status === 'maintenance').length}
          </p>
        </div>
      </div>

      {/* Filters and Add Room */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-styled pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-styled w-36"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-styled w-36"
          >
            <option value="all">All Types</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="suite">Suite</option>
            <option value="deluxe">Deluxe</option>
            <option value="dormitory">Dormitory</option>
          </select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-accent gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Room Number</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="input-styled mt-1"
                    required
                    placeholder="e.g., 101"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Floor</label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="input-styled mt-1"
                    required
                    placeholder="e.g., 1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Room Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Room['type'] })}
                    className="input-styled mt-1"
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="suite">Suite</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="dormitory">Dormitory</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="input-styled mt-1"
                    min="1"
                    max="10"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Price per Night (₹)</label>
                  <input
                    type="number"
                    value={formData.pricePerNight}
                    onChange={(e) => setFormData({ ...formData, pricePerNight: Number(e.target.value) })}
                    className="input-styled mt-1"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Room['status'] })}
                    className="input-styled mt-1"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary">
                  {editingRoom ? 'Update Room' : 'Add Room'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rooms by Floor */}
      {Object.keys(roomsByFloor).length === 0 ? (
        <div className="text-center py-16">
          <BedDouble className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-foreground">No rooms found</h3>
          <p className="text-muted-foreground mt-1">Add rooms or adjust filters</p>
        </div>
      ) : (
        Object.entries(roomsByFloor).sort(([a], [b]) => a.localeCompare(b)).map(([floor, floorRooms]) => (
          <div key={floor} className="mb-8">
            <h2 className="text-lg font-serif font-semibold mb-4">Floor {floor}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {floorRooms.map((room) => (
                <div key={room.id} className="card-elevated p-5 animate-scale-in">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BedDouble className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Room {room.roomNumber}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{room.type}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenDialog(room)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Capacity: {room.capacity}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IndianRupee className="w-4 h-4" />
                      <span>{formatCurrency(room.pricePerNight)}/night</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(room.status)}`}>
                      {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    </span>

                    <select
                      value={room.status}
                      onChange={(e) => handleStatusChange(room.id, e.target.value as Room['status'])}
                      className="input-styled text-sm mt-2"
                      disabled={room.status === 'occupied'}
                    >
                      <option value="available">Available</option>
                      <option value="occupied" disabled={room.status !== 'occupied'}>Occupied</option>
                      <option value="reserved">Reserved</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </MainLayout>
  );
};

export default RoomManagement;
