<template>
  <nav>
    <div class="logo">CHRONIO</div>
    <div class="nav-links">
      <RouterLink to="/calendario"><i class="fas fa-calendar-alt"></i> Calendario</RouterLink>
      <RouterLink to="/bacheche"><i class="fas fa-clipboard"></i> Bacheche</RouterLink>
      <RouterLink to="/budget"><i class="fas fa-wallet"></i> Budget</RouterLink>
      <RouterLink to="/account" class="active"><i class="fas fa-user-circle"></i> Account
        <span v-if="unreadCount > 0" class="account-badge">{{ unreadCount }}</span>
      </RouterLink>
    </div>
  </nav>

 <div class="account-wrapper">
  <div class="account-grid">
    <section class="panel">
      <NotificationsArea />
    </section>

    <section class="panel">
      <InvitesComponent />
    </section>

    <section class="panel panel-wide">
      <SharedItemsComponent />
    </section>

    <aside class="panel panel-account">
      <div class="account-card" @click.stop>
        <!-- TUTTO il tuo contenuto account rimane IDENTICO -->
        <div class="profile-header">
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

          <button @click="handleToggleTheme" class="theme-toggle-btn">
            {{ currentThemeMode === 'dark' ? '☼' : '☾' }}
          </button>
        </div>

        <!-- Username + Gear -->
<div class="username-row">
  <div class="username-bar">
    {{ user?.username || user?.email }}
  </div>

  <button class="username-gear" @click="toggleSettings" title="Impostazioni account">
    ⚙️
  </button>
</div>

<!-- Dropdown sotto username -->
<div v-if="settingsOpen" class="settings-dropdown" @click.stop>
  <!-- Modifica dati -->
  <button class="action-btn" @click="showEdit = !showEdit">
    Modifica username / email
    <i class="fas" :class="showEdit ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
  </button>

  <div v-if="showEdit" class="dropdown">
    <div class="edit-block">
      <input v-model="newUsername" placeholder="Nuovo username" />
      <button class="dropdown-action-btn" @click="changeUsername">Salva username</button>
    </div>

    <div class="edit-block">
      <input v-model="newEmail" type="email" placeholder="Nuova email" />
      <button class="dropdown-action-btn" @click="changeEmail">Salva email</button>
    </div>
  </div>

  <!-- Password -->
  <button class="action-btn" @click="showPassword = !showPassword">
    Cambia password
    <i class="fas" :class="showPassword ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
  </button>

  <div v-if="showPassword" class="dropdown">
    <input v-model="oldPassword" type="password" placeholder="Password attuale" />
    <input v-model="newPassword" type="password" placeholder="Nuova password" />
    <button class="dropdown-action-btn" @click="changePasswordHandler">Aggiorna password</button>
  </div>

          <!-- Elimina account -->
          <button class="delete-account-btn" @click="deleteAccountAndData"> ELIMINA ACCOUNT </button>
        </div>

        <!-- Logout resta fuori (come prima) -->
        <button class="logout-btn" @click="logoutAndGo">LOGOUT</button>
      </div>
    </aside>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import SharedItemsComponent from '../components/SharedItemsComponent.vue'
import NotificationsArea from '../components/NotificationsArea.vue'
import InvitesComponent from '../components/InvitesComponent.vue'
import { currentUser, logout, updateUser, changePassword, deleteAccount, type User } from '../auth/auth'
import { uploadProfileImage } from '../services/cloudinary'
import { useRouter } from 'vue-router'
import { toggleTheme, getCurrentTheme } from '../services/theme'
import { useNotifications } from '../composables/useNotifications'
import { onBeforeUnmount } from 'vue'


const router = useRouter()
const currentThemeMode = ref(getCurrentTheme())
const isUploading = ref(false)
const fileInput = ref<HTMLInputElement>()
const { notifications, unreadCount } = useNotifications()

const newUsername = ref("")
const newEmail = ref("")
const oldPassword = ref("")
const newPassword = ref("")
const showEdit = ref(false)
const showPassword = ref(false)
const user = ref<User | null>(null)
const settingsOpen = ref(false)

function toggleSettings() {
  settingsOpen.value = !settingsOpen.value
  // se chiudo, chiudo anche le sotto-tendine
  if (!settingsOpen.value) {
    showEdit.value = false
    showPassword.value = false
  }
}

function closeSettings() {
  settingsOpen.value = false
  showEdit.value = false
  showPassword.value = false
}

// click fuori per chiudere
const onDocClick = () => closeSettings()

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})

onMounted(async () => {
  currentThemeMode.value = getCurrentTheme()
  user.value = await currentUser()
})

onMounted(() => {
  document.body.classList.add('dashboard-page')
  currentThemeMode.value = getCurrentTheme()
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

async function deleteAccountAndData() {
  const ok = confirm(
    "Sei sicuro di voler eliminare l'account?\n\nVerranno cancellate bacheche, budget e tutti i tuoi dati in modo permanente."
  );
  if (!ok) return;

  try {
    await deleteAccount();
    router.push("/login");
  } catch (e) {
    console.error(e);
    alert("Errore durante l'eliminazione account");
  }
}
</script>

<style scoped>
.account-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  margin-top: 100px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}


@media (max-width: 1024px) {
  .two-columns {
    grid-template-columns: 1fr;
  }
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

.profile-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  width: 100%;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.theme-toggle-btn {
  background: rgba(13,72,83,0.8);
  border: 2px solid var(--primary-color);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  right: -20px;
  bottom: 0;
}

.theme-toggle-btn:hover {
  background: rgba(13,72,83,1);
  transform: scale(1.1);
}

.logout-btn {
  margin-top: 1.5rem;
}

.delete-account-btn{
  margin-top: 10px;
  padding: 0.8rem 2.5rem;
  border-radius: 12px;
  border: none;
  background: rgba(231, 76, 60, 0.9);
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s;
}
.delete-account-btn:hover{
  background: rgba(231, 76, 60, 1);
  transform: scale(1.02);
}

.account-wrapper {
  padding: 2rem;
  margin-top: 100px;
  max-width: 1600px;
  margin-left: auto;
  margin-right: auto;
}

/* GRIGLIA 4 COLONNE */
.account-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.4fr) 360px;
  gap: 18px;
  align-items: start;

  /* evita “tagli” */
  min-height: calc(100vh - 140px);
}

/* pannelli */
.panel {
  min-width: 0;
  min-height: 0;

  /* ogni colonna scrolla internamente se serve */
  max-height: calc(100vh - 140px);
  overflow: auto;
}

/* account sempre visibile a destra */
.panel-account {
  position: sticky;
  top: 120px;
  max-height: calc(100vh - 140px);
  overflow: auto;
}

/* OVERRIDE componenti che ti restringono la colonna */
:deep(.notifications-area) {
  max-width: none !important;
  width: 100% !important;
}

/* l’invites ha margin-top: 2rem: lo togliamo in dashboard */
:deep(.invites-section) {
  margin-top: 0 !important;
}

/* responsive */
@media (max-width: 1200px) {
  .account-grid {
    grid-template-columns: 1fr 1fr;
  }
  .panel-account {
    position: static;
  }
}

@media (max-width: 700px) {
  .account-grid {
    grid-template-columns: 1fr;
  }
}

.username-row {
  width: 100%;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 10px;
  margin-bottom: 1rem;
}

/* stessa “barra” ma ora è flessibile */
.username-bar {
  flex: 1;
  margin-bottom: 0; /* prima era 1.5rem */
}

/* bottone ingranaggio con stesso sfondo della username-bar */
.username-gear {
  background: #6f8f82; /* stesso della username-bar */
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0 14px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}

.username-gear:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

/* tendina sotto username */
.settings-dropdown {
  width: 100%;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  padding: 12px;
  border-radius: 12px;
  background: rgba(13, 72, 83, 0.15);
  border: 1px solid rgba(13, 72, 83, 0.2);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>