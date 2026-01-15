<template>
  <div class="shared-items-container">
    <h3 class="section-title">
      <i class="fas fa-share-alt"></i>
      Elementi Condivisi
    </h3>
    
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Caricamento...</span>
    </div>
    
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <span>{{ error }}</span>
    </div>
    
    <div v-else-if="boards.length === 0 && tags.length === 0" class="empty-state">
      <i class="fas fa-inbox"></i>
      <p>Nessun elemento condiviso</p>
      <small>Condividi bacheche e tag con altri utenti per vederli qui</small>
    </div>
    
    <div v-else class="shared-content">
      <!-- Bacheche Condivise -->
      <div v-if="boards.length > 0" class="shared-section">
        <h4 class="subsection-title">
          <i class="fas fa-clipboard"></i>
          Bacheche ({{ boards.length }})
        </h4>
        <div class="items-grid">
          <div v-for="board in boards" :key="board.id" class="shared-card">
            <div class="card-header">
              <div class="card-title">
                <i class="fas fa-clipboard"></i>
                <strong>{{ board.title }}</strong>
              </div>
              <span class="badge" :class="board.isOwner ? 'badge-owner' : 'badge-shared'">
                <i :class="board.isOwner ? 'fas fa-crown' : 'fas fa-users'"></i>
                {{ board.isOwner ? 'Proprietario' : 'Condiviso' }}
              </span>
            </div>
            
            <div class="card-body">
              <div class="members-count">
                <i class="fas fa-user-friends"></i>
                {{ board.members.length }} {{ board.members.length === 1 ? 'persona' : 'persone' }}
              </div>
              
              <div class="members-list">
                <div v-for="member in board.members" :key="member.userId" class="member-row">
                  <div class="member-info">
                    <div class="member-avatar">
                      <i class="fas fa-user"></i>
                    </div>
                    <div class="member-details">
                      <span class="member-name">{{ member.username }}</span>
                      <span class="member-role-badge">{{ member.role }}</span>
                    </div>
                  </div>
                  <button 
                    v-if="board.isOwner" 
                    @click="removeBoardMember(board.id, member.userId)"
                    class="remove-btn"
                    title="Rimuovi accesso"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tag Condivisi -->
      <div v-if="tags.length > 0" class="shared-section">
        <h4 class="subsection-title">
          <i class="fas fa-tags"></i>
          Tag ({{ tags.length }})
        </h4>
        <div class="items-grid">
          <div v-for="tag in tags" :key="tag.id" class="shared-card">
            <div class="card-header">
              <div class="card-title">
                <div class="tag-indicator" :style="{ backgroundColor: tag.color }"></div>
                <strong>{{ tag.name }}</strong>
              </div>
              <span class="badge" :class="tag.isOwner ? 'badge-owner' : 'badge-shared'">
                <i :class="tag.isOwner ? 'fas fa-crown' : 'fas fa-users'"></i>
                {{ tag.isOwner ? 'Proprietario' : 'Condiviso' }}
              </span>
            </div>
            
            <div class="card-body">
              <div class="members-count">
                <i class="fas fa-user-friends"></i>
                {{ tag.sharedWith.length }} {{ tag.sharedWith.length === 1 ? 'persona' : 'persone' }}
              </div>
              
              <div class="members-list">
                <div v-for="member in tag.sharedWith" :key="member.userId" class="member-row">
                  <div class="member-info">
                    <div class="member-avatar">
                      <i class="fas fa-user"></i>
                    </div>
                    <div class="member-details">
                      <span class="member-name">{{ member.username }}</span>
                      <span class="member-role-badge">{{ member.role }}</span>
                    </div>
                  </div>
                  <button 
                    v-if="tag.isOwner" 
                    @click="removeTagMember(tag.id, member.userId)"
                    class="remove-btn"
                    title="Rimuovi accesso"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-show="showConfirmModal" class="modal">
      <div class="modal-content confirm-modal">
        <div class="modal-inner">
          <h3>{{ confirmModal.title }}</h3>
          <p>{{ confirmModal.message }}</p>
          <div class="modal-buttons">
            <button @click="confirmAction" class="confirm-btn">Sì</button>
            <button @click="closeConfirmModal" class="cancel-btn">No</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../services/api'

interface Member {
  userId: string
  role: string
  username: string
  email: string
}

interface Board {
  id: string
  title: string
  slug: string
  isOwner: boolean
  members: Member[]
}

interface Tag {
  id: string
  name: string
  color: string
  isOwner: boolean
  sharedWith: Member[]
}

interface SharedItemsResponse {
  boards: Board[]
  tags: Tag[]
}

const boards = ref<Board[]>([])
const tags = ref<Tag[]>([])
const loading = ref(true)
const error = ref('')

const loadSharedItems = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get<SharedItemsResponse>('/auth/shared-items')
    boards.value = data.boards
    tags.value = data.tags
  } catch (err: any) {
    console.error('Error loading shared items:', err)
    error.value = 'Impossibile caricare gli elementi condivisi'
  } finally {
    loading.value = false
  }
}

const showConfirmModal = ref(false)
const confirmModal = ref({
  title: '',
  message: '',
  callback: null as (() => void) | null
})

const showConfirm = (title: string, message: string, callback: () => void) => {
  confirmModal.value = { title, message, callback }
  showConfirmModal.value = true
}

const confirmAction = () => {
  if (confirmModal.value.callback) {
    confirmModal.value.callback()
  }
  closeConfirmModal()
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
  confirmModal.value.callback = null
}

const removeBoardMember = async (boardId: string, userId: string) => {
  showConfirm('Rimuovi accesso', 'Vuoi rimuovere l\'accesso a questa bacheca per questo utente?', async () => {
    try {
      await api.delete(`/boards/${boardId}/members/${userId}`)
      await loadSharedItems()
    } catch (error) {
      console.error('Error removing board member:', error)
    }
  })
}

const removeTagMember = async (tagId: string, userId: string) => {
  showConfirm('Rimuovi accesso', 'Vuoi rimuovere l\'accesso a questo tag per questo utente?', async () => {
    try {
      await api.delete(`/calendar/tags/${tagId}/share/${userId}`)
      await loadSharedItems()
    } catch (error) {
      console.error('Error removing tag member:', error)
    }
  })
}

onMounted(() => {
  loadSharedItems()
})

defineExpose({ loadSharedItems })
</script>

<style scoped>
.shared-items-container {
  background: rgba(13, 72, 83, 0.95);
  border-radius: 12px;
  padding: 1.25rem;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.section-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 0.75rem;
}

.section-title i {
  font-size: 1.1rem;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  gap: 0.75rem;
  text-align: center;
}

.loading-state i,
.error-state i,
.empty-state i {
  font-size: 2rem;
  opacity: 0.7;
}

.loading-state i {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  background: rgba(231, 76, 60, 0.2);
  border-radius: 8px;
  color: #ffcccb;
}

.empty-state {
  opacity: 0.7;
}

.empty-state p {
  font-size: 1rem;
  margin: 0;
}

.empty-state small {
  opacity: 0.7;
  font-size: 0.85rem;
}

.shared-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.shared-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.subsection-title {
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.25rem;
}

.items-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (max-width: 1200px) {
  .shared-content {
    grid-template-columns: 1fr;
  }
}

.shared-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.shared-card:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.card-header {
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  flex: 1;
}

.card-title i {
  opacity: 0.8;
  font-size: 0.9rem;
}

.tag-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.badge {
  padding: 0.25rem 0.6rem;
  border-radius: 16px;
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
}

.badge i {
  font-size: 0.65rem;
}

.badge-owner {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.badge-shared {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.card-body {
  padding: 0.75rem;
}

.members-count {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  opacity: 0.8;
  margin-bottom: 0.5rem;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.member-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  transition: background 0.2s;
}

.member-row:hover {
  background: rgba(255, 255, 255, 0.1);
}

.member-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.member-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.member-details {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.member-name {
  font-weight: 500;
  font-size: 0.9rem;
}

.member-role-badge {
  padding: 0.15rem 0.4rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  font-size: 0.7rem;
  text-transform: lowercase;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.remove-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(231, 76, 60, 0.2);
  color: #ff6b6b;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 0.8rem;
}

.remove-btn:hover {
  background: #e74c3c;
  color: white;
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .shared-items-container {
    padding: 1rem;
  }
  
  .section-title {
    font-size: 1.1rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>