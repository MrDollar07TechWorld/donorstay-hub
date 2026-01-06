import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCheck, Clock, Calendar, CreditCard, LogIn, LogOut } from 'lucide-react';
import { Notification } from '@/types';
import { getNotifications, markNotificationRead, markAllNotificationsRead, addNotification, getDonors } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    setNotifications(getNotifications());
  };

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    loadNotifications();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    loadNotifications();
    toast({ title: 'Done', description: 'All notifications marked as read' });
  };

  const createSampleNotification = () => {
    const donors = getDonors();
    if (donors.length === 0) {
      toast({ title: 'Error', description: 'Add donors first to create notifications', variant: 'destructive' });
      return;
    }

    const randomDonor = donors[Math.floor(Math.random() * donors.length)];
    const types: Notification['type'][] = ['check_in_reminder', 'check_out_reminder', 'payment_due', 'welcome'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    const messages = {
      check_in_reminder: `Reminder: ${randomDonor.name} is scheduled to check-in today`,
      check_out_reminder: `Reminder: ${randomDonor.name} is scheduled to check-out today`,
      payment_due: `Payment reminder for ${randomDonor.name} - installment due`,
      welcome: `Welcome ${randomDonor.name} to DonorStay!`,
    };

    addNotification({
      donorId: randomDonor.id,
      donorName: randomDonor.name,
      type: randomType,
      message: messages[randomType],
    });

    loadNotifications();
    toast({ title: 'Notification Created', description: 'Sample notification added' });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'check_in_reminder':
        return <LogIn className="w-5 h-5" />;
      case 'check_out_reminder':
        return <LogOut className="w-5 h-5" />;
      case 'payment_due':
        return <CreditCard className="w-5 h-5" />;
      case 'welcome':
        return <Bell className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'check_in_reminder':
        return 'bg-success/10 text-success';
      case 'check_out_reminder':
        return 'bg-warning/10 text-warning';
      case 'payment_due':
        return 'bg-destructive/10 text-destructive';
      case 'welcome':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <MainLayout title="Notifications" subtitle="Stay updated with reminders and alerts">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="stat-card shadow-md px-4 py-2">
            <span className="text-sm text-muted-foreground">Unread</span>
            <span className="ml-2 font-bold text-foreground">{unreadCount}</span>
          </div>
          <div className="stat-card shadow-md px-4 py-2">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="ml-2 font-bold text-foreground">{notifications.length}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={createSampleNotification}>
            Create Sample
          </Button>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllRead} className="btn-primary gap-2">
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4 max-w-3xl">
        {notifications.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">No notifications</h3>
            <p className="text-muted-foreground mt-1">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`card-elevated p-4 flex items-start gap-4 transition-all ${
                !notification.read ? 'border-l-4 border-l-primary' : ''
              }`}
            >
              <div className={`p-3 rounded-xl ${getNotificationColor(notification.type)}`}>
                {getNotificationIcon(notification.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-medium ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(notification.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(notification.id)}
                      className="text-primary hover:bg-primary/10"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
};

export default Notifications;
