import { ref, computed } from 'vue';
import type { Event, Tag } from '../types/calendar';
import { api } from '../services/api';

export interface Notification {
  id: string;
  eventId: string;
  title: string;
  message: string;
  datetime: string;
  type: 'warning' | 'info';
  read: boolean;
  createdAt: Date;
}

const CHECK_INTERVAL = 60000;

const globalNotifications = ref<Notification[]>([]);
const globalUnreadCount = ref(0);

const updateGlobalUnreadCount = () => {
  globalUnreadCount.value = globalNotifications.value.filter(n => !n.read && n.type === 'warning').length;
};

export function useNotifications() {
  const notifications = computed(() => globalNotifications.value);
  const events = ref<Event[]>([]);
  const tags = ref<Tag[]>([]);
  let checkInterval: ReturnType<typeof setInterval> | null = null;

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      const loadedNotifications = response.data.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt)
      }));
      
      await loadEvents();
      const existingEventIds = new Set(events.value.map(e => e.id));
      
      globalNotifications.value = loadedNotifications.filter(n => existingEventIds.has(n.eventId));
      
      if (loadedNotifications.length !== globalNotifications.value.length) {
        await syncNotifications();
      }
      
      updateGlobalUnreadCount();
    } catch (error) {
      console.error('Error loading notifications:', error);
      globalNotifications.value = [];
      updateGlobalUnreadCount();
    }
  };

  const syncNotifications = async () => {
    try {
      await api.post('/notifications/sync', { notifications: globalNotifications.value });
      updateGlobalUnreadCount();
    } catch (error) {
      console.error('Error syncing notifications:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const [eventsRes, tagsRes] = await Promise.all([
        api.get('/calendar/events'),
        api.get('/calendar/tags')
      ]);
      events.value = eventsRes.data;
      tags.value = tagsRes.data;
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const getTagById = (tagId?: string): Tag | undefined => {
    if (!tagId) return undefined;
    return tags.value.find(t => t.id === tagId);
  };

  const checkUpcomingEvents = async () => {
    await loadEvents();
    
    const now = new Date();
    const newNotifications: Notification[] = [];
    const existingEventIds = new Set(events.value.map(e => e.id));

    events.value.forEach(event => {
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

    globalNotifications.value = newNotifications.filter(n => {
      const eventDate = new Date(n.datetime);
      return eventDate > now && existingEventIds.has(n.eventId);
    });
    
    await syncNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    const notification = globalNotifications.value.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      try {
        await api.put(`/notifications/${notificationId}/read`);
        updateGlobalUnreadCount();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    globalNotifications.value.forEach(n => n.read = true);
    try {
      await api.put('/notifications/mark-all-read');
      updateGlobalUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    globalNotifications.value = globalNotifications.value.filter(n => n.id !== notificationId);
    try {
      await api.delete(`/notifications/${notificationId}`);
      updateGlobalUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    globalNotifications.value = [];
    try {
      await api.delete('/notifications');
      updateGlobalUnreadCount();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const forceRefreshNotifications = async () => {
    await checkUpcomingEvents();
  };

  const unreadCount = computed(() => globalUnreadCount.value);

  const sortedNotifications = computed(() => {
    return [...globalNotifications.value].sort((a, b) => {
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