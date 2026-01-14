<template>
  <div v-if="show" class="modal">
    <div class="modal-content">
      <div class="modal-inner">
        <span @click="close" class="close">&times;</span>
        <h3>Condividi {{ type === 'tag' ? 'Tag' : 'Bacheca' }}</h3>
        
        <div class="form-group">
          <label>Username o Email</label>
          <input 
            v-model="identifier" 
            type="text" 
            placeholder="Inserisci username o email"
            @keyup.enter="share"
          >
        </div>
        
        <div class="form-group">
          <label>Ruolo</label>
          <div class="radio-group">
            <label class="radio-label">
              <input v-model="role" type="radio" value="editor"> Editor
            </label>
            <label class="radio-label">
              <input v-model="role" type="radio" value="viewer"> Viewer
            </label>
          </div>
        </div>
        
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>
        
        <div class="modal-buttons">
          <button @click="share" :disabled="loading">
            {{ loading ? 'Invio...' : 'Invita' }}
          </button>
          <button @click="close" class="cancel-btn">Annulla</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { api } from '../services/api'

const props = defineProps<{
  show: boolean
  type: 'tag' | 'board'
  itemId: string
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const identifier = ref('')
const role = ref('editor')
const loading = ref(false)
const error = ref('')
const success = ref('')

watch(() => props.show, (newVal) => {
  if (newVal) {
    identifier.value = ''
    role.value = 'editor'
    error.value = ''
    success.value = ''
  }
})

const share = async () => {
  if (!identifier.value.trim()) {
    error.value = 'Inserisci username o email'
    return
  }
  
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    const payload: any = {
      type: props.type,
      itemId: props.itemId,
      identifier: identifier.value,
      role: role.value
    }
    
    console.log('Sending invite:', payload)
    await api.post('/invites', payload)
    success.value = 'Invito inviato con successo!'
    setTimeout(() => {
      emit('success')
      emit('close')
    }, 1500)
  } catch (err: any) {
    console.error('Share error:', err.response?.data || err)
    error.value = err.response?.data?.error || 'Errore durante la condivisione'
  } finally {
    loading.value = false
  }
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background: rgba(13, 72, 83, 0.69);
  margin: 5% auto;
  padding: 8px;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modal-inner {
  background: rgba(235, 235, 235, 0.31);
  border-radius: 12px;
  padding: 2rem;
}

.close {
  float: right;
  font-size: 1.5rem;
  cursor: pointer;
  color: white;
}

h3 {
  color: white;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  color: white;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

input[type="text"] {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid rgba(13, 72, 83, 0.2);
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.9);
  color: #0d4853;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  font-weight: normal;
  margin-bottom: 0;
  font-size: 1.1rem;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  width: 18px;
  height: 18px;
  margin: 0;
  appearance: none;
  border: 2px solid white;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  position: relative;
}

.radio-label input[type="radio"]:checked {
  background: white;
}

.radio-label input[type="radio"]:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #0d4853;
  font-weight: bold;
  font-size: 12px;
}

.error-message {
  color: #e74c3c;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.success-message {
  color: #2ecc71;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.modal-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(13, 72, 83, 0.64);
  color: white;
}

button:hover:not(:disabled) {
  background: rgba(13, 72, 83, 0.8);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: #95a5a6;
}

.cancel-btn:hover {
  background: #7f8c8d;
}
</style>
