<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TransactionType, Transaction } from '../types';

interface Props {
  type: TransactionType;
  visible: boolean;
  editingTransaction?: Transaction | null;
}

interface Emits {
  (e: 'submit', description: string, amount: number, date: Date): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const description = ref('');
const amount = ref<number | null>(null);
const date = ref<string>('');

// Initialize date to today
const initializeDate = () => {
  const today = new Date();
  date.value = today.toISOString().split('T')[0]!;
};

initializeDate();

// Watch visible prop to reset or populate form
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    if (props.editingTransaction) {
      // Modalità modifica: popola il form con i dati esistenti
      description.value = props.editingTransaction.description;
      amount.value = props.editingTransaction.amount;
      const transactionDate = new Date(props.editingTransaction.date);
      date.value = transactionDate.toISOString().split('T')[0]!;
    } else {
      // Modalità aggiunta: resetta il form
      resetForm();
    }
  }
});

// Watch editingTransaction changes
watch(() => props.editingTransaction, (newTransaction) => {
  if (newTransaction && props.visible) {
    description.value = newTransaction.description;
    amount.value = newTransaction.amount;
    const transactionDate = new Date(newTransaction.date);
    date.value = transactionDate.toISOString().split('T')[0]!;
  }
});

const resetForm = () => {
  description.value = '';
  amount.value = null;
  initializeDate();
};

const handleSubmit = () => {
  if (description.value && amount.value && date.value) {
    const selectedDate = new Date(date.value);
    emit('submit', description.value, amount.value, selectedDate);
    resetForm();
  }
};

const handleCancel = () => {
  emit('cancel');
  resetForm();
};

const getLabel = () => {
  return props.type === 'income' ? 'Descrizione Entrata in denaro' : 'Descrizione Uscita in denaro';
};

const getPlaceholder = () => {
  return props.type === 'income' ? 'es. Stipendio' : 'es. Ristorante';
};

const getTitle = () => {
  return props.editingTransaction ? 'Modifica Transazione' : 'Nuova Transazione';
};

const getSubmitLabel = () => {
  return props.editingTransaction ? 'Aggiorna' : 'Salva';
};
</script>

<template>
  <form v-if="visible" class="transaction-form" @submit.prevent="handleSubmit">
    <div class="form-header">
      <h3>{{ getTitle() }}</h3>
    </div>
    
    <div class="form-group">
      <label>{{ getLabel() }}</label>
      <input 
        v-model="description" 
        type="text" 
        :placeholder="getPlaceholder()" 
        required
      />
    </div>
    
    <div class="form-group">
      <label>Importo (€)</label>
      <input 
        v-model.number="amount" 
        type="number" 
        placeholder="0.00" 
        step="0.01" 
        min="0" 
        required
      />
    </div>
    
    <div class="form-group">
      <label>Data</label>
      <input 
        v-model="date" 
        type="date" 
        required
      />
    </div>
    
    <div class="form-actions">
      <button type="submit" class="btn-save">{{ getSubmitLabel() }}</button>
      <button type="button" class="btn-cancel" @click="handleCancel">Annulla</button>
    </div>
  </form>
</template>

<style scoped>
.transaction-form {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  animation: slideDown 0.3s ease-out;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.form-header {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.form-header h3 {
  color: var(--text-light, #e8f4f3);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  color: var(--text-light, #e8f4f3);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  font-family: 'Work Sans', sans-serif;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: rgba(66, 153, 225, 0.8);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-save,
.btn-cancel {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-family: 'Work Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-save {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(72, 187, 120, 0.4);
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-light, #e8f4f3);
  border: 2px solid rgba(255, 255, 255, 0.4);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.3);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>