<template>
  <div class="invites-section">
    <h3>Inviti</h3>
    <div v-if="invites.length === 0" class="no-invites">
      Nessun invito in sospeso
    </div>
    <div v-else class="invites-list">
      <div v-for="invite in invites" :key="invite.id" class="invite-card">
        <div class="invite-info">
          <div class="invite-title">
            <strong>{{ invite.senderName }}</strong> ti ha invitato a 
            <strong>{{ invite.itemName }}</strong>
          </div>
          <div class="invite-meta">
            {{ invite.type === 'tag' ? 'Tag' : 'Bacheca' }}
            <span v-if="invite.role"> - {{ invite.role }}</span>
          </div>
        </div>
        <div class="invite-actions">
          <button @click="acceptInvite(invite.id)" class="btn-accept">
            <i class="fas fa-check"></i> Accetta
          </button>
          <button @click="rejectInvite(invite.id)" class="btn-reject">
            <i class="fas fa-times"></i> Rifiuta
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../services/api'

interface Invite {
  id: string
  type: 'tag' | 'board'
  itemId: string
  itemName: string
  senderId: string
  senderName: string
  role?: string
  createdAt: string
}

const invites = ref<Invite[]>([])

const loadInvites = async () => {
  try {
    const { data } = await api.get('/invites')
    invites.value = data
  } catch (error) {
    console.error('Error loading invites:', error)
  }
}

const acceptInvite = async (inviteId: string) => {
  try {
    await api.post(`/invites/${inviteId}/accept`)
    await loadInvites()
  } catch (error) {
    console.error('Error accepting invite:', error)
  }
}

const rejectInvite = async (inviteId: string) => {
  try {
    await api.post(`/invites/${inviteId}/reject`)
    await loadInvites()
  } catch (error) {
    console.error('Error rejecting invite:', error)
  }
}

onMounted(() => {
  loadInvites()
})

defineExpose({ loadInvites })
</script>

<style scoped>
.invites-section {
  margin-top: 2rem;
}

h3 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.no-invites {
  color: #666;
  font-style: italic;
  padding: 1rem;
  text-align: center;
}

.invites-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.invite-card {
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.invite-info {
  flex: 1;
}

.invite-title {
  margin-bottom: 0.5rem;
  color: #333;
}

.invite-meta {
  font-size: 0.9rem;
  color: #666;
}

.invite-actions {
  display: flex;
  gap: 0.5rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-accept {
  background: #2ecc71;
  color: white;
}

.btn-accept:hover {
  background: #27ae60;
}

.btn-reject {
  background: #e74c3c;
  color: white;
}

.btn-reject:hover {
  background: #c0392b;
}
</style>
