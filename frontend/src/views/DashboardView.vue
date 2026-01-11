<template>
  <nav>
    <div class="logo">CHRONIO</div>
    <div class="nav-links">
      <RouterLink to="/calendario"><i class="fas fa-calendar-alt"></i> Calendario</RouterLink>
      <RouterLink to="/bacheche"><i class="fas fa-clipboard"></i> Bacheche</RouterLink>
      <RouterLink to="/budget"><i class="fas fa-wallet"></i> Budget</RouterLink>
      <RouterLink to="/account" class="active"><i class="fas fa-user-circle"></i> Account</RouterLink>
      
      <!-- Notification Bell -->
      <NotificationBell />
    </div>
  </nav>

  <div class="account-wrapper">
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NotificationBell from '../components/NotificationBell.vue'
import { currentUser, logout, updateUser, type User } from '../auth/auth'
import { uploadProfileImage } from '../services/cloudinary'
import { useRouter } from 'vue-router'
import { toggleTheme, getCurrentTheme } from '../services/theme'

const user = ref<User | null>(currentUser())
const router = useRouter()
const currentThemeMode = ref(getCurrentTheme())
const isUploading = ref(false)
const fileInput = ref<HTMLInputElement>()

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