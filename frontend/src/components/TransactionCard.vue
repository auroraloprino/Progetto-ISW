<script setup lang="ts">
import { ref } from 'vue';
import TransactionForm from './TransactionForm.vue';
import TransactionList from './TransactionList.vue';
import type { Transaction, TransactionType } from '../types';

interface Props {
  title: string;
  type: TransactionType;
  transactions: Transaction[];
}

interface Emits {
  (e: 'add', type: TransactionType, description: string, amount: number, date: Date): void;
  (e: 'update', id: string, description: string, amount: number, date: Date): void;
  (e: 'delete', id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const showForm = ref(false);
const editingTransaction = ref<Transaction | null>(null);

const handleAddClick = () => {
  editingTransaction.value = null;
  showForm.value = !showForm.value;
};

const handleFormSubmit = (description: string, amount: number, date: Date) => {
  if (editingTransaction.value) {
    emit('update', editingTransaction.value.id, description, amount, date);
  } else {
    emit('add', props.type, description, amount, date);
  }
  showForm.value = false;
  editingTransaction.value = null;
};

const handleFormCancel = () => {
  showForm.value = false;
  editingTransaction.value = null;
};

const handleDelete = (id: string) => {
  emit('delete', id);
};

const handleEdit = (transaction: Transaction) => {
  editingTransaction.value = transaction;
  showForm.value = true;
};

const getEmptyMessage = () => {
  return props.type === 'income' ? 'Nessuna entrata' : 'Nessuna uscita';
};
</script>

<template>
  <div class="card transaction-card">
    <button class="card-add-btn" @click="handleAddClick" :title="editingTransaction ? 'Annulla modifica' : 'Aggiungi'">
      {{ showForm && editingTransaction ? '✕' : '+' }}
    </button>
    <h2 class="card-title">{{ title }}</h2>
    
    <TransactionForm
      :type="type"
      :visible="showForm"
      :editing-transaction="editingTransaction"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />
    
    <TransactionList
      :transactions="transactions"
      :empty-message="getEmptyMessage()"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>

<style scoped>
.card {
  background: rgba(13, 72, 83, 0.69);
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(13, 72, 83, 0.08);
  position: relative;
  min-height: 400px;
  transition: all 0.3s ease;
  animation: slideUp 0.6s ease-out;
  animation-fill-mode: backwards;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(13, 72, 83, 0.2);
}

.card-add-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  color: white;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.card-add-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg) scale(1.1);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.card-title {
  color: white;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: center;
  padding: 1.5rem;
  background: rgba(235, 235, 235, 0.31);
  border-radius: 12px;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>