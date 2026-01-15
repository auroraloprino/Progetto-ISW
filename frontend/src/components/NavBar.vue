<template>
  <nav>
    <div class="logo">CHRONIO</div>

    <div class="nav-links">
      <RouterLink to="/calendario"><i class="fas fa-calendar-alt"></i> Calendario</RouterLink>
      
      <!-- Dropdown Bacheche -->
      <div 
        class="dropdown"
        @mouseenter="openDropdown"
        @mouseleave="startCloseTimer"
      >
        <RouterLink 
          to="/bacheche" 
          class="dropdown-toggle"
        >
          <i class="fas fa-clipboard"></i> Bacheche
          <i class="fas fa-chevron-down" :class="{ rotated: dropdownOpen }"></i>
        </RouterLink>
        
        <div 
          v-if="dropdownOpen" 
          class="dropdown-menu"
          @mouseenter="cancelCloseTimer"
          @mouseleave="startCloseTimer"
        >
          <RouterLink 
            v-if="boardsList.length === 0"
            to="/bacheche" 
            class="dropdown-item disabled"
            @click="closeDropdown"
          >
            <i class="fas fa-info-circle"></i>
            Nessuna bacheca
          </RouterLink>
          
          <RouterLink
            v-for="board in boardsList"
            :key="board.slug"
            :to="`/bacheche/${board.slug}`"
            class="dropdown-item"
            @click="closeDropdown"
          >
            <i class="fas fa-clipboard"></i>
            {{ board.title }}
          </RouterLink>
          
          <div class="dropdown-divider"></div>
          
          <RouterLink 
            to="/bacheche" 
            class="dropdown-item"
            @click="closeDropdown"
          >
            <i class="fas fa-th-large"></i>
            Tutte le Bacheche
          </RouterLink>
        </div>
      </div>
      
      <RouterLink to="/budget"><i class="fas fa-wallet"></i> Budget</RouterLink>

      <RouterLink to="/account" class="account-link">
        <i class="fas fa-user-circle"></i> Account
        <span v-if="accountBadge > 0" class="account-badge">
          {{ accountBadge > 9 ? '9+' : accountBadge }}
        </span>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useNotifications } from "../composables/useNotifications";
import { useInvitesBadge } from "../composables/useInvitesBadge";
import { useBoards } from "../composables/useBoards";

const { unreadCount } = useNotifications();
const { invitesCount } = useInvitesBadge();
const { boardsList, loadBoards } = useBoards();

// Dropdown state
const dropdownOpen = ref(false);
let closeTimer: ReturnType<typeof setTimeout> | null = null;

const openDropdown = () => {
  dropdownOpen.value = true;
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

const startCloseTimer = () => {
  closeTimer = setTimeout(() => {
    dropdownOpen.value = false;
  }, 300);
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

// Load boards on mount
onMounted(() => {
  loadBoards();
});

// badge totale = notifiche urgenti (o non lette) + inviti pendenti
const accountBadge = computed(() => (unreadCount.value || 0) + (invitesCount.value || 0));
</script>

<style scoped>
nav {
  background: var(--nav-bg);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
}

.logo { font-size: 1.5rem; font-weight: 700; color: white; }

.nav-links { display: flex; gap: 0.5rem; align-items: center; }
.nav-links a {
  text-decoration: none;
  color: rgb(255, 255, 255);
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  transition: all 0.3s ease;
}

.account-badge {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  background: #e74c3c;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.4rem;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
  line-height: 1;
}

/* Dropdown styles */
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-toggle .fa-chevron-down {
  font-size: 0.75rem;
  transition: transform 0.3s ease;
  margin-left: 0.25rem;
}

.dropdown-toggle .fa-chevron-down.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: rgba(13, 72, 83, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  min-width: 200px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  margin-top: 0.5rem;
  padding: 0.5rem 0;
}

.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  color: white;
  text-decoration: none;
  transition: background 0.2s ease;
  cursor: pointer;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-item.disabled {
  opacity: 0.6;
  cursor: default;
}

.dropdown-item.disabled:hover {
  background: transparent;
}

.dropdown-item i {
  width: 16px;
  text-align: center;
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0.5rem 0;
}
</style>