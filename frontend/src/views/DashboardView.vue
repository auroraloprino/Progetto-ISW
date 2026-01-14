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

  <button class="action-btn" @click="showEdit = !showEdit">
    Modifica dati account
    <i class="fas" :class="showEdit ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
  </button>

<div v-if="showEdit" class="dropdown">

  <div class="edit-block">
    <input v-model="newUsername" placeholder="Nuovo username" />
    <button class="dropdown-action-btn" @click="changeUsername">
  Salva username
</button>
  </div>

  <div class="edit-block">
    <input v-model="newEmail" type="email" placeholder="Nuova email" />
    <button class="dropdown-action-btn" @click="changeEmail">
  Salva email
</button>
  </div>

</div>

  <button class="action-btn" @click="showPassword = !showPassword">
    Cambia password
    <i class="fas" :class="showPassword ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
  </button>

  <div v-if="showPassword" class="dropdown">
    <input v-model="oldPassword" type="password" placeholder="Password attuale" />
    <input v-model="newPassword" type="password" placeholder="Nuova password" />
    <button class="dropdown-action-btn" @click="changePasswordHandler">
  Aggiorna password
</button>
  </div>

</div>
        <div class="theme-controls">
          <button @click="handleToggleTheme" class="theme-btn">
            {{ currentThemeMode === 'dark' ? 'Modalità Chiara' : 'Modalità Scura' }}
          </button>
        </div>
        <div class="account-actions">
          <button class="logout-btn" @click="logoutAndGo">LOGOUT</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import NotificationsArea from '../components/NotificationsArea.vue'
import { currentUser, logout, updateUser, changePassword, type User } from '../auth/auth'
import { uploadProfileImage } from '../services/cloudinary'
import { useRouter } from 'vue-router'
import { toggleTheme, getCurrentTheme } from '../services/theme'
import { useNotifications } from '../composables/useNotifications'


const router = useRouter()
const currentThemeMode = ref(getCurrentTheme())
const isUploading = ref(false)
const fileInput = ref<HTMLInputElement>()
const { notifications } = useNotifications()

const newUsername = ref("")
const newEmail = ref("")
const oldPassword = ref("")
const newPassword = ref("")
const showEdit = ref(false)
const showPassword = ref(false)
const user = ref<User | null>(null)

onMounted(async () => {
  currentThemeMode.value = getCurrentTheme()
  user.value = await currentUser()
})

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
user.value = await updateUser({ profileImage: imageUrl })
  } catch (error) {
    console.error('Errore upload:', error)
  } finally {
    isUploading.value = false
  }
}

onMounted(() => {
  currentThemeMode.value = getCurrentTheme()
})

async function changeUsername() {
  if (!newUsername.value.trim()) return alert("Username non valido")
  try {
    user.value = await updateUser({ username: newUsername.value.trim() })
    newUsername.value = ""
  } catch (e) {
    console.error(e)
    alert("Errore aggiornamento username")
  }
}

async function changeEmail() {
  if (!newEmail.value.trim()) return alert("Email non valida")
  try {
    user.value = await updateUser({ email: newEmail.value.trim() })
    newEmail.value = ""
  } catch (e) {
    console.error(e)
    alert("Errore aggiornamento email")
  }
}

async function changePasswordHandler() {
  if (!oldPassword.value || !newPassword.value) {
    return alert("Compila entrambi i campi password")
  }

  try {
    await changePassword(oldPassword.value, newPassword.value)
    oldPassword.value = ""
    newPassword.value = ""
    alert("Password aggiornata")
  } catch (e) {
    console.error(e)
    alert("Password attuale errata o errore server")
  }
}
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

.action-btn {
  text-align: center;
  gap: 20px;
  margin-top: 10px;
  font-weight: bold;
  background: rgba(13,72,83,0.8);
  color: white;
  border: none;
  cursor: pointer;
  padding: 0.8rem 2.5rem;
  border-radius: 12px;
  transition: 0.3s;
}
.account-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
  
.dropdown {
  padding: 10px;
  background: rgba(13,72,83,0.8);
  border-radius: 12px;
  margin-bottom: 10px;
}

.dropdown input {
  width: 100%;
  margin-bottom: 8px;
  padding: 8px;
}

.dropdown button {
  width: 100%;
}
.edit-block {
  width: 100%;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-block button {
  margin-top: 4px;
}
.dropdown-action-btn {
  width: 100%;
  padding: 0.7rem 1rem;
  border-radius: 12px;
  border: none;

  background: rgba(13,72,83,0.9);
  color: white;
  font-weight: bold;
  text-align: center;

  cursor: pointer;
  transition: 0.3s;
}

.dropdown-action-btn:hover {
  background: rgba(13,72,83,1);
  transform: scale(1.02);
}

</style>