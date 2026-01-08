<script setup lang="ts">
import type { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
  emptyMessage?: string;
}

interface Emits {
  (e: 'delete', id: string): void;
  (e: 'edit', transaction: Transaction): void;
}

const props = withDefaults(defineProps<Props>(), {
  emptyMessage: 'Nessuna transazione'
});

const emit = defineEmits<Emits>();

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatAmount = (amount: number): string => {
  return `€${amount.toFixed(2)}`;
};

const handleDelete = (id: string) => {
  if (confirm('Sei sicuro di voler eliminare questa transazione?')) {
    emit('delete', id);
  }
};

const handleEdit = (transaction: Transaction) => {
  emit('edit', transaction);
};
</script>

<template>
  <div class="transactions-list">
    <div v-if="transactions.length === 0" class="empty-message">
      {{ emptyMessage }}
    </div>
    
    <div
      v-for="transaction in transactions"
      :key="transaction.id"
      class="transaction-item"
    >
      <div class="transaction-info">
        <div class="transaction-description">{{ transaction.description }}</div>
        <div class="transaction-date">{{ formatDate(transaction.date) }}</div>
      </div>
      <span class="transaction-amount">{{ formatAmount(transaction.amount) }}</span>
      <div class="transaction-actions">
        <button class="btn-edit" @click="handleEdit(transaction)" title="Modifica">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="btn-delete" @click="handleDelete(transaction.id)" title="Elimina">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.transactions-list {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.transactions-list::-webkit-scrollbar {
  width: 8px;
}

.transactions-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.transactions-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.transactions-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.empty-message {
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  padding: 2rem;
}

.transaction-item {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease-out;
}

.transaction-item:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateX(5px);
}

.transaction-info {
  flex: 1;
  min-width: 0;
}

.transaction-description {
  color: var(--text-light, #e8f4f3);
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-date {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
}

.transaction-amount {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-light, #e8f4f3);
  white-space: nowrap;
}

.transaction-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.btn-edit,
.btn-delete {
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.btn-edit {
  background: rgba(66, 153, 225, 0.8);
}

.btn-edit:hover {
  background: rgba(66, 153, 225, 1);
  transform: scale(1.1);
}

.btn-delete {
  background: rgba(245, 101, 101, 0.8);
}

.btn-delete:hover {
  background: rgba(245, 101, 101, 1);
  transform: scale(1.1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .transaction-item {
    flex-wrap: wrap;
  }
  
  .transaction-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }
}
</style>