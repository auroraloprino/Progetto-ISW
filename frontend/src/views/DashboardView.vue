<template>
  <nav>
    <div class="logo">CHRONIO</div>
    <div class="nav-links">
      <RouterLink to="/calendario"><i class="fas fa-calendar-alt"></i> Calendario</RouterLink>
      <RouterLink to="/bacheche"><i class="fas fa-clipboard"></i> Bacheche</RouterLink>
      <RouterLink to="/budget"><i class="fas fa-wallet"></i> Budget</RouterLink>
      <RouterLink to="/account" class="active"><i class="fas fa-user-circle"></i> Account
        <span v-if="todayEventsCount > 0" class="account-badge">{{ todayEventsCount }}</span>
      </RouterLink>
    </div>
  </nav>

  <div class="account-wrapper">
    <div class="account-content">
      <!-- Notifications Area - LEFT -->
      <NotificationsArea />

      <!-- Account Card - RIGHT -->
      <div class="account-card">
        <div class="avatar" @click="fileInput?.click()" :class="{ uploading: isUploading }">
          <img v-if="user?.profileImage" :src="user.profileImage" alt="Profilo" />
          <i v-else class="fas fa-user-circle"></i>
          <div class="upload-overlay">
            <i class="fas fa-camera"></i>
          </div>
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/*" 
            @change="handleImageUpload" 
            style="display: none"
          />
        </div>

        <div class="username-bar">
          {{ user?.email }}
        </div>

        <div class="account-actions">
          <button class="logout-btn" @click="logoutAndGo">LOGOUT</button>
        </div>

        <div class="theme-controls">
          <button @click="handleToggleTheme" class="theme-btn">
            {{ currentThemeMode === 'dark' ? 'Modalità Chiara' : 'Modalità Scura' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import NotificationsArea from '../components/NotificationsArea.vue'
import { currentUser, logout, updateUser, type User } from '../auth/auth'
import { uploadProfileImage } from '../services/cloudinary'
import { useRouter } from 'vue-router'
import { toggleTheme, getCurrentTheme } from '../services/theme'
import { useNotifications } from '../composables/useNotifications'

const user = ref<User | null>(currentUser())
const router = useRouter()
const currentThemeMode = ref(getCurrentTheme())
const isUploading = ref(false)
const fileInput = ref<HTMLInputElement>()
const { notifications } = useNotifications()

onMounted(() => {
  document.body.classList.add('dashboard-page')
  currentThemeMode.value = getCurrentTheme()
})

const todayEventsCount = computed(() => {
  return notifications.value.filter(n => {
    if (n.read) return false
    
    const eventDate = new Date(n.datetime)
    const now = new Date()
    const timeDiff = eventDate.getTime() - now.getTime()
    const minutesDiff = Math.floor(timeDiff / 60000)
    
    // Only count if event is within 30 minutes and in the future
    return minutesDiff <= 30 && minutesDiff >= 0
  }).length
})

function logoutAndGo() {
  logout()
  router.push('/login')
}

function handleToggleTheme() {
  toggleTheme()
  currentThemeMode.value = getCurrentTheme()
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  isUploading.value = true
  try {
    const imageUrl = await uploadProfileImage(file)
    updateUser({ profileImage: imageUrl })
    user.value = currentUser()
  } catch (error) {
    console.error('Errore upload:', error)
  } finally {
    isUploading.value = false
  }
}

onMounted(() => {
  currentThemeMode.value = getCurrentTheme()
})
</script>

<style scoped>
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

.nav-links a {
  position: relative;
}
</style>