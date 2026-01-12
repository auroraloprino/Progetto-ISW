<script setup lang="ts">
import { ref, computed } from 'vue';
import { useNotifications } from '../composables/useNotifications';
import { useRouter } from 'vue-router';

const router = useRouter();

const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  formatTimeUntil
} = useNotifications();

// Filter only unread notifications for the main display
const unreadNotifications = computed(() => 
  notifications.value.filter(n => !n.read)
);

// Handle notification click
const handleNotificationClick = (notificationId: string, datetime: string) => {
  markAsRead(notificationId);
  // Navigate to calendar
  router.push('/calendario');
};

// Handle mark all as read
const handleMarkAllRead = () => {
  markAllAsRead();
};

// Format datetime for display
const formatDateTime = (datetime: string): string => {
  const date = new Date(datetime);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  const time = date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) return `Oggi alle ${time}`;
  if (isTomorrow) return `Domani alle ${time}`;
  
  const day = date.getDate();
  const month = date.toLocaleString('it-IT', { month: 'long' }).toUpperCase();
  const year = date.getFullYear();
  
  return `${day} ${month} ${year} - ${time}`;
};
</script>

<template>
  <div class="notifications-area">
    <div class="notifications-header">
      <h2>AREA NOTIFICHE</h2>
    </div>

    <div class="notifications-list">
      <div 
        v-if="unreadNotifications.length === 0"
        class="no-notifications"
      >
        <i class="fas fa-bell-slash"></i>
        <p>Nessuna notifica da mostrare</p>
      </div>

      <div
        v-for="notification in unreadNotifications"
        :key="notification.id"
        class="notification-item"
        :class="{ 'warning': notification.type === 'warning' }"
        @click="handleNotificationClick(notification.id, notification.datetime)"
      >
        <div class="notification-content">
          <div class="notification-date">
            {{ formatDateTime(notification.datetime) }}
          </div>
          <div class="notification-message">
            {{ notification.message }}
          </div>
          <button 
            class="mark-read-btn"
            @click.stop="markAsRead(notification.id)"
          >
            SEGNA COME GIA' LETTO
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifications-area {
  width: 100%;
  max-width: 700px;
  flex: 1;
}

.notifications-header {
  background: rgba(13, 72, 83, 0.9);
  padding: 1.5rem 2rem;
  border-radius: 12px 12px 0 0;
  text-align: center;
}

.notifications-header h2 {
  margin: 0;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 1px;
}

.notifications-list {
  background: rgba(13, 72, 83, 0.7);
  border-radius: 0 0 12px 12px;
  padding: 1rem;
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.notifications-list::-webkit-scrollbar {
  width: 8px;
}

.notifications-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.notifications-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.notifications-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.no-notifications {
  padding: 3rem 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.no-notifications i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-notifications p {
  margin: 0;
  font-size: 1rem;
}

.notification-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid #3498db;
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.notification-item.warning {
  border-left-color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
}

.notification-item.warning:hover {
  background: rgba(231, 76, 60, 0.15);
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notification-date {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.notification-message {
  color: white;
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 500;
}

.mark-read-btn {
  align-self: flex-end;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mark-read-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
  transform: scale(1.05);
}

/* Responsive */
@media (max-width: 1024px) {
  .notifications-area {
    max-width: 100%;
  }

  .notifications-list {
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  .notifications-header {
    padding: 1rem 1.5rem;
  }

  .notifications-header h2 {
    font-size: 1.2rem;
  }

  .notification-item {
    padding: 1rem;
  }

  .notification-message {
    font-size: 0.95rem;
  }
}
</style>
