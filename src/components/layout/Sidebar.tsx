import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BedDouble, 
  CreditCard, 
  Bell, 
  IdCard,
  Building2
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/donors', icon: Users, label: 'Donors' },
  { to: '/rooms', icon: BedDouble, label: 'Rooms' },
  { to: '/bookings', icon: Building2, label: 'Bookings' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/id-cards', icon: IdCard, label: 'ID Cards' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-50">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Building2 className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-sidebar-foreground">DonorStay</h1>
            <p className="text-xs text-sidebar-foreground/60">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            end={item.to === '/'}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="p-4 rounded-lg bg-sidebar-accent">
          <p className="text-xs text-sidebar-foreground/70">
            Data stored locally. Connect database for persistence.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
