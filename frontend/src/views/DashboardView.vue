<template>
  <nav>
    <div class="logo">CHRONIO</div>
    <div class="nav-links">
      <RouterLink to="/calendario"><i class="fas fa-calendar-alt"></i> Calendario</RouterLink>
      <RouterLink to="/bacheche"><i class="fas fa-clipboard"></i> Bacheche</RouterLink>
      <RouterLink to="/budget"><i class="fas fa-wallet"></i> Budget</RouterLink>
      <RouterLink to="/account" class="active"><i class="fas fa-user-circle"></i> Account</RouterLink>
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
          {{ user?.username }}
        </div>

        <div class="account-actions">
          <button class="logout-btn" @click="logoutAndGo">LOGOUT</button>
        </div>
<div class="account-actions">

  <button class="action-btn" @click="showEdit = !showEdit">
    Modifica dati account
    <i class="fas" :class="showEdit ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
  </button>

  <div v-if="showEdit" class="dropdown">
    <input v-model="newUsername" placeholder="Nuovo username" />
    <button @click="changeUsername">Salva username</button>

    <input v-model="newEmail" type="email" placeholder="Nuova email" />
    <button @click="changeEmail">Salva email</button>
  </div>

  <button class="action-btn" @click="showPassword = !showPassword">
    Cambia password
    <i class="fas" :class="showPassword ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
  </button>

  <div v-if="showPassword" class="dropdown">
    <input v-model="oldPassword" type="password" placeholder="Password attuale" />
    <input v-model="newPassword" type="password" placeholder="Nuova password" />
    <button @click="changePassword">Aggiorna password</button>
  </div>

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
import { ref, onMounted } from 'vue'
import NotificationsArea from '../components/NotificationsArea.vue'
import { currentUser, logout, updateUser, type User } from '../auth/auth'
import { uploadProfileImage } from '../services/cloudinary'
import { useRouter } from 'vue-router'
import { toggleTheme, getCurrentTheme } from '../services/theme'

const user = ref<User | null>(currentUser())
const router = useRouter()
const currentThemeMode = ref(getCurrentTheme())
const isUploading = ref(false)
const fileInput = ref<HTMLInputElement>()
const newUsername = ref("")
const newEmail = ref("")
const oldPassword = ref("")
const newPassword = ref("")
const showEdit = ref(false)
const showPassword = ref(false)


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
function changeUsername() {
  if (!user.value) return
  if (!newUsername.value) return alert("Username non valido")

  updateUser({ username: newUsername.value })
  user.value = currentUser()
  newUsername.value = ""
}
function changeEmail() {
  if (!user.value) return
  if (!newEmail.value) return alert("Email non valida")

  updateUser({ email: newEmail.value })
  user.value = currentUser()
  newEmail.value = ""
}
function changePassword() {
  if (!user.value) return

  if (user.value.password !== oldPassword.value) {
    alert("Password attuale errata")
    return
  }

  if (!newPassword.value) {
    alert("Nuova password non valida")
    return
  }

  updateUser({ password: newPassword.value })
  oldPassword.value = ""
  newPassword.value = ""
  alert("Password aggiornata")
}
</script>
<style scoped>
  .action-btn {
  width: 100%;
  margin-top: 10px;
  padding: 10px;
  font-weight: bold;
  background: #222;
  color: white;
  border: none;
  cursor: pointer;
}

.dropdown {
  padding: 10px;
  background: #111;
  border-radius: 8px;
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
</style>