<template>
  <div class="shared-items-section">
    <h3>Elementi Condivisi</h3>
    
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Caricamento...
    </div>
    
    <div v-else-if="error" class="error-message">
      <i class="fas fa-exclamation-circle"></i> {{ error }}
    </div>
    
    <div v-else>
      <!-- Bacheche Condivise -->
      <div class="subsection">
        <h4><i class="fas fa-clipboard"></i> Bacheche</h4>
        <div v-if="boards.length === 0" class="no-items">
          Nessuna bacheca condivisa
        </div>
        <div v-else class="items-list">
          <div v-for="board in boards" :key="board.id" class="item-card">
            <div class="item-header">
              <div class="item-title">
                <strong>{{ board.title }}</strong>
                <span class="badge" :class="board.isOwner ? 'badge-owner' : 'badge-member'">
                  {{ board.isOwner ? 'Proprietario' : 'Membro' }}
                </span>
              </div>
            </div>
            
            <div v-if="board.members.length > 0" class="members-list">
              <div class="members-header">Condiviso con:</div>
              <div v-for="member in board.members" :key="member.userId" class="member-item">
                <div class="member-info">
                  <i class="fas fa-user"></i>
                  <span class="member-name">{{ member.username }}</span>
                  <span class="member-role">{{ member.role }}</span>
                </div>
                <button 
                  v-if="board.isOwner" 
                  @click="removeBoardMember(board.id, member.userId)"
                  class="btn-remove"
                  title="Rimuovi utente"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div v-else class="no-members">
              Non condivisa con nessuno
            </div>
          </div>
        </div>
      </div>

      <!-- Tag Condivisi -->
      <div class="subsection">
        <h4><i class="fas fa-tags"></i> Tag</h4>
        <div v-if="tags.length === 0" class="no-items">
          Nessun tag condiviso
        </div>
        <div v-else class="items-list">
          <div v-for="tag in tags" :key="tag.id" class="item-card">
            <div class="item-header">
              <div class="item-title">
                <div class="tag-color" :style="{ backgroundColor: tag.color }"></div>
                <strong>{{ tag.name }}</strong>
                <span class="badge" :class="tag.isOwner ? 'badge-owner' : 'badge-member'">
                  {{ tag.isOwner ? 'Proprietario' : 'Membro' }}
                </span>
              </div>
            </div>
            
            <div v-if="tag.sharedWith.length > 0" class="members-list">
              <div class="members-header">Condiviso con:</div>
              <div v-for="member in tag.sharedWith" :key="member.userId" class="member-item">
                <div class="member-info">
                  <i class="fas fa-user"></i>
                  <span class="member-name">{{ member.username }}</span>
                  <span class="member-role">{{ member.role }}</span>
                </div>
                <button 
                  v-if="tag.isOwner" 
                  @click="removeTagMember(tag.id, member.userId)"
                  class="btn-remove"
                  title="Rimuovi utente"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div v-else class="no-members">
              Non condiviso con nessuno
            </div>
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
    error.value = err.response?.data?.error || 'Errore nel caricamento degli elementi condivisi'
  } finally {
    loading.value = false
  }
}

const removeBoardMember = async (boardId: string, userId: string) => {
  if (!confirm('Sei sicuro di voler rimuovere questo utente dalla bacheca?')) {
    return
  }
  
  try {
    await api.delete(`/boards/${boardId}/members/${userId}`)
    await loadSharedItems()
  } catch (error) {
    console.error('Error removing board member:', error)
    alert('Errore durante la rimozione dell\'utente')
  }
}

const removeTagMember = async (tagId: string, userId: string) => {
  if (!confirm('Sei sicuro di voler rimuovere questo utente dal tag?')) {
    return
  }
  
  try {
    await api.delete(`/calendar/tags/${tagId}/share/${userId}`)
    await loadSharedItems()
  } catch (error) {
    console.error('Error removing tag member:', error)
    alert('Errore durante la rimozione dell\'utente')
  }
}

onMounted(() => {
  loadSharedItems()
})

defineExpose({ loadSharedItems })
</script>

<style scoped>
.shared-items-section {
  margin-top: 3rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1.1rem;
}

.loading i {
  margin-right: 0.5rem;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #c62828;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

h3 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.subsection {
  margin-bottom: 2.5rem;
}

h4 {
  color: #555;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.no-items {
  color: #666;
  font-style: italic;
  padding: 1rem;
  text-align: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.25rem;
  transition: border-color 0.2s;
}

.item-card:hover {
  border-color: var(--primary-color);
}

.item-header {
  margin-bottom: 1rem;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.1rem;
}

.tag-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-owner {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-member {
  background: #f3e5f5;
  color: #7b1fa2;
}

.members-list {
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
}

.members-header {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.member-info i {
  color: #666;
}

.member-name {
  font-weight: 600;
  color: #333;
}

.member-role {
  padding: 0.2rem 0.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #666;
}

.btn-remove {
  padding: 0.5rem;
  background: #ffebee;
  color: #c62828;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.btn-remove:hover {
  background: #ef5350;
  color: white;
}

.no-members {
  color: #999;
  font-style: italic;
  font-size: 0.9rem;
  padding: 0.5rem 0;
}
</style>
