import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Event, Tag } from '../types/calendar';

export interface Notification {
  id: string;
  eventId: number;
  title: string;
  message: string;
  datetime: string;
  type: 'warning' | 'info';
  read: boolean;
  createdAt: Date;
}

const NOTIFICATIONS_KEY = 'chronio_notifications';
const CHECK_INTERVAL = 60000; // Check ogni minuto
const NOTIFICATION_TIMES = [
  { minutes: 15, label: '15 minuti' },
  { minutes: 60, label: '1 ora' },
  { minutes: 1440, label: '1 giorno' }
];

export function useNotifications() {
  const notifications = ref<Notification[]>([]);
  const events = ref<{ [key: string]: Event[] }>({});
  const tags = ref<Tag[]>([]);
  let checkInterval: ReturnType<typeof setInterval> | null = null;

  // Load notifications from localStorage
  const loadNotifications = () => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        notifications.value = parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      notifications.value = [];
    }
  };

  // Save notifications to localStorage
  const saveNotifications = () => {
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.value));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  // Load events from localStorage
  const loadEvents = () => {
    try {
      const savedEvents = localStorage.getItem('calendarEvents');
      const savedTags = localStorage.getItem('calendarTags');
      
      if (savedEvents) {
        events.value = JSON.parse(savedEvents);
      }
      
      if (savedTags) {
        tags.value = JSON.parse(savedTags);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  // Generate unique notification ID
  const generateNotificationId = (eventId: number, minutesBefore: number): string => {
    return `${eventId}-${minutesBefore}`;
  };

  // Get tag by ID
  const getTagById = (tagId?: number): Tag | undefined => {
    if (!tagId) return undefined;
    return tags.value.find(t => t.id === tagId);
  };

  // Check if notification already exists
  const notificationExists = (notificationId: string): boolean => {
    return notifications.value.some(n => n.id === notificationId);
  };

  // Create notification for an event
  const createNotification = (event: Event, minutesBefore: number) => {
    const notificationId = generateNotificationId(event.id, minutesBefore);
    
    // Don't create if already exists
    if (notificationExists(notificationId)) {
      return;
    }

    const eventDate = new Date(event.datetime);
    const now = new Date();
    const timeDiff = eventDate.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / 60000);

    // Only create notification if event is in the future and within notification window
    if (minutesDiff > 0 && minutesDiff <= minutesBefore) {
      const tag = getTagById(event.tag);
      const timeLabel = NOTIFICATION_TIMES.find(t => t.minutes === minutesBefore)?.label || `${minutesBefore} minuti`;
      
      const notification: Notification = {
        id: notificationId,
        eventId: event.id,
        title: `📅 ${event.title}`,
        message: `Inizia tra ${timeLabel}${tag ? ` • ${tag.name}` : ''}`,
        datetime: event.datetime,
        type: minutesBefore <= 15 ? 'warning' : 'info',
        read: false,
        createdAt: new Date()
      };

      notifications.value.unshift(notification);
      saveNotifications();

      // Show browser notification if permitted
      showBrowserNotification(notification);
    }
  };

  // Show browser notification
  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id
      });

      browserNotif.onclick = () => {
        window.focus();
        markAsRead(notification.id);
        browserNotif.close();
      };
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  // Check for upcoming events and create notifications
  const checkUpcomingEvents = () => {
    loadEvents(); // Reload events in case they changed
    
    const now = new Date();
    
    // Get all events
    const allEvents: Event[] = [];
    Object.values(events.value).forEach(dayEvents => {
      allEvents.push(...dayEvents);
    });

    // Check each event
    allEvents.forEach(event => {
      const eventDate = new Date(event.datetime);
      const timeDiff = eventDate.getTime() - now.getTime();
      const minutesDiff = Math.floor(timeDiff / 60000);

      // Skip past events
      if (minutesDiff < 0) return;

      // Check each notification time
      NOTIFICATION_TIMES.forEach(notifTime => {
        // Create notification if within window
        if (minutesDiff <= notifTime.minutes && minutesDiff > 0) {
          createNotification(event, notifTime.minutes);
        }
      });
    });

    // Clean old notifications (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    notifications.value = notifications.value.filter(n => 
      new Date(n.createdAt) > sevenDaysAgo
    );
    
    saveNotifications();
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    const notification = notifications.value.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      saveNotifications();
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    notifications.value.forEach(n => n.read = true);
    saveNotifications();
  };

  // Delete notification
  const deleteNotification = (notificationId: string) => {
    notifications.value = notifications.value.filter(n => n.id !== notificationId);
    saveNotifications();
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    notifications.value = [];
    saveNotifications();
  };

  // Computed
  const unreadCount = computed(() => 
    notifications.value.filter(n => !n.read).length
  );

  const sortedNotifications = computed(() => 
    [...notifications.value].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  );

  const upcomingNotifications = computed(() =>
    sortedNotifications.value.filter(n => {
      const eventDate = new Date(n.datetime);
      return eventDate > new Date();
    })
  );

  // Format time until event
  const formatTimeUntil = (datetime: string): string => {
    const eventDate = new Date(datetime);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Passato';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `Tra ${days}g`;
    if (hours > 0) return `Tra ${hours}h`;
    if (minutes > 0) return `Tra ${minutes}min`;
    return 'Adesso!';
  };

  // Initialize
  const initialize = () => {
    loadNotifications();
    loadEvents();
    
    // Initial check
    checkUpcomingEvents();
    
    // Set up periodic checks
    checkInterval = setInterval(checkUpcomingEvents, CHECK_INTERVAL);
    
    // Request notification permission
    requestNotificationPermission();
  };

  // Cleanup
  const cleanup = () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  };

  // Auto-initialize on mount
  onMounted(() => {
    initialize();
  });

  // Cleanup on unmount
  onUnmounted(() => {
    cleanup();
  });

  return {
    // State
    notifications: sortedNotifications,
    unreadCount,
    upcomingNotifications,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    checkUpcomingEvents,
    requestNotificationPermission,
    formatTimeUntil,
    
    // Utils
    initialize,
    cleanup
  };
}
