<template>
  <nav>
    <div class="logo">CHRONIO</div>

    <div class="nav-links">
      <RouterLink to="/calendario"><i class="fas fa-calendar-alt"></i> Calendario</RouterLink>
      <RouterLink to="/bacheche"><i class="fas fa-clipboard"></i> Bacheche</RouterLink>
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
import { computed } from "vue";
import { useNotifications } from "../composables/useNotifications";
import { useInvitesBadge } from "../composables/useInvitesBadge";

const { unreadCount } = useNotifications();
const { invitesCount } = useInvitesBadge();

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

.nav-links { display: flex; gap: 0.5rem; }
.nav-links a {
  text-decoration: none;
  color: white;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
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
</style>