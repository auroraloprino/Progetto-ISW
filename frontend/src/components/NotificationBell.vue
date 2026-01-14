<script setup lang="ts">
import { ref } from 'vue';
import { useNotifications } from '../composables/useNotifications';
import { computed } from "vue";
import { useInvitesBadge } from "../composables/useInvitesBadge";

const {
  notifications,
  unreadCount,
  upcomingNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  formatTimeUntil
} = useNotifications();
const { invitesCount } = useInvitesBadge();


const totalBadgeCount = computed(() => unreadCount.value + invitesCount.value);

const dropdownOpen = ref(false);
let closeTimer: ReturnType<typeof setTimeout> | null = null;

// Dropdown handlers
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

const startCloseTimer = () => {
  closeTimer = setTimeout(() => {
    dropdownOpen.value = false;
  }, 500);
};

const cancelCloseTimer = () => {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

const closeDropdown = () => {
  dropdownOpen.value = false;
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

// Handle notification click
const handleNotificationClick = (notificationId: string) => {
  markAsRead(notificationId);
};

// Handle mark all as read
const handleMarkAllRead = () => {
  markAllAsRead();
};

// Handle delete
const handleDelete = (notificationId: string, event: Event) => {
  event.stopPropagation();
  deleteNotification(notificationId);
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
  
  return date.toLocaleString('it-IT', { 
    day: '2-digit', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<template>
  <div 
    class="notification-bell" 
    @mouseleave="startCloseTimer" 
    @mouseenter="cancelCloseTimer"
  >
    <button 
      class="bell-button" 
      @click.stop="toggleDropdown"
      :class="{ 'has-unread': totalBadgeCount > 0 }"
    >
      <i class="fas fa-bell"></i>
      <span v-if="totalBadgeCount > 0" class="badge"> {{ totalBadgeCount > 9 ? '9+' : totalBadgeCount }}</span>
    </button>

    <div 
      class="notification-dropdown" 
      v-show="dropdownOpen"
      @mouseenter="cancelCloseTimer"
    >
      <div class="notification-header">
        <h3>Notifiche</h3>
        <button 
          v-if="unreadCount > 0" 
          @click="handleMarkAllRead"
          class="mark-read-btn"
        >
          Segna tutte lette
        </button>
      </div>

      <div class="notification-list">
        <div 
          v-if="notifications.length === 0"
          class="empty-state"
        >
          <i class="fas fa-bell-slash"></i>
          <p>Nessuna notifica</p>
        </div>

        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ 
            'unread': !notification.read,
            'warning': notification.type === 'warning'
          }"
          @click="handleNotificationClick(notification.id)"
        >
          <div class="notification-dot" v-if="!notification.read"></div>
          
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">
              {{ formatDateTime(notification.datetime) }}
              <span class="time-until">{{ formatTimeUntil(notification.datetime) }}</span>
            </div>
          </div>

          <button 
            class="delete-btn"
            @click="handleDelete(notification.id, $event)"
            title="Elimina notifica"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="notification-footer" v-if="notifications.length > 0">
        <RouterLink to="/calendario" @click="closeDropdown">
          <i class="fas fa-calendar-alt"></i>
          Vai al calendario
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notification-bell {
  position: relative;
  display: inline-block;
}

.bell-button {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.bell-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.bell-button.has-unread {
  animation: ring 2s ease-in-out infinite;
}

@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-15deg); }
  20%, 40% { transform: rotate(15deg); }
  50% { transform: rotate(0deg); }
}

.badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #e74c3c;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.35rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: rgba(13, 72, 83, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  width: 380px;
  max-height: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notification-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
}

.notification-header h3 {
  margin: 0;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
}

.mark-read-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.mark-read-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.notification-list::-webkit-scrollbar {
  width: 8px;
}

.notification-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.notification-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.empty-state {
  padding: 3rem 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

.notification-item {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.notification-item.unread {
  background: rgba(52, 152, 219, 0.08);
}

.notification-item.unread:hover {
  background: rgba(52, 152, 219, 0.12);
}

.notification-item.warning {
  background: rgba(231, 76, 60, 0.08);
}

.notification-item.warning:hover {
  background: rgba(231, 76, 60, 0.12);
}

.notification-dot {
  width: 8px;
  height: 8px;
  background: #3498db;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 0.35rem;
}

.notification-item.warning .notification-dot {
  background: #e74c3c;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-message {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  margin-bottom: 0.35rem;
  line-height: 1.4;
}

.notification-time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-until {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
}

.notification-item.warning .time-until {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.delete-btn {
  background: rgba(231, 76, 60, 0.2);
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.notification-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(231, 76, 60, 0.4);
  transform: scale(1.1);
}

.delete-btn i {
  color: white;
  font-size: 0.75rem;
}

.notification-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

.notification-footer a {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s ease;
}

.notification-footer a:hover {
  color: white;
}

.notification-footer i {
  font-size: 0.85rem;
}

/* Responsive */
@media (max-width: 768px) {
  .notification-dropdown {
    width: 320px;
    max-height: 400px;
  }

  .notification-header {
    padding: 0.875rem 1rem;
  }

  .notification-item {
    padding: 0.875rem 1rem;
  }
}
</style>
