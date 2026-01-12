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
const CHECK_INTERVAL = 60000;

export function useNotifications() {
  const notifications = ref<Notification[]>([]);
  const events = ref<{ [key: string]: Event[] }>({});
  const tags = ref<Tag[]>([]);
  let checkInterval: ReturnType<typeof setInterval> | null = null;

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
      notifications.value = [];
    }
  };

  const saveNotifications = () => {
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.value));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const loadEvents = () => {
    try {
      const savedEvents = localStorage.getItem('calendar_events');
      const savedTags = localStorage.getItem('calendar_tags');
      
      if (savedEvents) {
        const data = JSON.parse(savedEvents);
        events.value = data.events || {};
      }
      
      if (savedTags) {
        const data = JSON.parse(savedTags);
        tags.value = data.tags || [];
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const getTagById = (tagId?: number): Tag | undefined => {
    if (!tagId) return undefined;
    return tags.value.find(t => t.id === tagId);
  };

  const checkUpcomingEvents = () => {
    loadEvents();
    
    const now = new Date();
    const uniqueEvents = new Map<number, Event>();
    
    Object.values(events.value).forEach(dayEvents => {
      dayEvents.forEach(event => {
        uniqueEvents.set(event.id, event);
      });
    });

    const newNotifications: Notification[] = [];

    uniqueEvents.forEach(event => {
      const eventDate = new Date(event.datetime);
      const timeDiff = eventDate.getTime() - now.getTime();
      const minutesDiff = Math.floor(timeDiff / 60000);

      if (minutesDiff <= 0) return;

      const tag = getTagById(event.tag);
      const hours = Math.floor(minutesDiff / 60);
      const days = Math.floor(hours / 24);
      
      let timeMessage;
      if (days > 0) {
        timeMessage = `Inizia tra ${days} giorn${days === 1 ? 'o' : 'i'}`;
      } else if (hours > 0) {
        timeMessage = `Inizia tra ${hours} or${hours === 1 ? 'a' : 'e'}`;
      } else {
        timeMessage = `Inizia tra ${minutesDiff} minut${minutesDiff === 1 ? 'o' : 'i'}`;
      }

      if (minutesDiff <= 30) {
        const id30 = `${event.id}-30min`;
        const existing = notifications.value.find(n => n.id === id30);
        if (existing) {
          existing.message = `${timeMessage}${tag ? ` • ${tag.name}` : ''}`;
          newNotifications.push(existing);
        } else {
          const newNotif = {
            id: id30,
            eventId: event.id,
            title: event.title,
            message: `${timeMessage}${tag ? ` • ${tag.name}` : ''}`,
            datetime: event.datetime,
            type: 'warning' as const,
            read: false,
            createdAt: new Date()
          };
          newNotifications.push(newNotif);
          
          // Show browser notification for new 30-minute warnings
          if (Notification.permission === 'granted') {
            new Notification(`${event.title}`, {
              body: `${timeMessage}${tag ? ` • ${tag.name}` : ''}`,
              icon: '/favicon.ico'
            });
          }
        }
      } else if (minutesDiff <= 10080) {
        const id7d = `${event.id}-7days`;
        const existing = notifications.value.find(n => n.id === id7d);
        if (existing) {
          existing.message = `${timeMessage}${tag ? ` • ${tag.name}` : ''}`;
          newNotifications.push(existing);
        } else {
          newNotifications.push({
            id: id7d,
            eventId: event.id,
            title: event.title,
            message: `${timeMessage}${tag ? ` • ${tag.name}` : ''}`,
            datetime: event.datetime,
            type: 'info',
            read: false,
            createdAt: new Date()
          });
        }
      }
    });

    notifications.value = newNotifications.filter(n => {
      const eventDate = new Date(n.datetime);
      return eventDate > now;
    });
    
    saveNotifications();
  };

  const markAsRead = (notificationId: string) => {
    const notification = notifications.value.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      saveNotifications();
    }
  };

  const markAllAsRead = () => {
    notifications.value.forEach(n => n.read = true);
    saveNotifications();
  };

  const deleteNotification = (notificationId: string) => {
    notifications.value = notifications.value.filter(n => n.id !== notificationId);
    saveNotifications();
  };

  const clearAllNotifications = () => {
    notifications.value = [];
    saveNotifications();
  };

  const forceRefreshNotifications = () => {
    checkUpcomingEvents();
  };

  const unreadCount = computed(() => {
    const count = notifications.value.filter(n => !n.read && n.type === 'warning').length;
    return count;
  });

  const sortedNotifications = computed(() => {
    return [...notifications.value].sort((a, b) => {
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }
      
      return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
    });
  });

  const upcomingNotifications = computed(() =>
    sortedNotifications.value.filter(n => {
      const eventDate = new Date(n.datetime);
      return eventDate > new Date();
    })
  );

  const formatTimeUntil = (datetime: string): string => {
    const eventDate = new Date(datetime);
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff < 0) return 'Passato';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    const isToday = eventDate.toDateString() === now.toDateString();
    
    if (isToday) {
      if (hours > 0) return `Tra ${hours}h`;
      if (minutes > 0) return `Tra ${minutes}min`;
      return 'Adesso!';
    }
    
    if (days > 0) return `Tra ${days}g`;
    if (hours > 0) return `Tra ${hours}h`;
    if (minutes > 0) return `Tra ${minutes}min`;
    return 'Adesso!';
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  const initialize = () => {
    loadNotifications();
    checkUpcomingEvents();
    
    if (checkInterval) clearInterval(checkInterval);
    checkInterval = setInterval(checkUpcomingEvents, CHECK_INTERVAL);
    
    requestNotificationPermission();
  };

  const cleanup = () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  };

  onMounted(() => {
    initialize();
  });

  onUnmounted(() => {
    cleanup();
  });

  return {
    notifications: sortedNotifications,
    unreadCount,
    upcomingNotifications,
    
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    forceRefreshNotifications,
    checkUpcomingEvents,
    requestNotificationPermission,
    formatTimeUntil,
    
    initialize,
    cleanup
  };
}