<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useBudget } from '../composables/useBudget';
import NotificationBell from '../components/NotificationBell.vue';
import TransactionCard from '../components/TransactionCard.vue';
import type { TransactionType, DateRange } from '../types';

const {
  incomeTransactions,
  expenseTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  calculateBudget
} = useBudget();

const currentDateRange = ref<DateRange>({
  startDate: new Date(),
  endDate: new Date()
});

const startDate = ref<string>('');
const endDate = ref<string>('');

// Initialize dates
const initializeDates = () => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  startDate.value = firstDayOfMonth.toISOString().split('T')[0]!;
  endDate.value = today.toISOString().split('T')[0]!;
  
  currentDateRange.value = {
    startDate: firstDayOfMonth,
    endDate: today
  };
};

initializeDates();

const budgetSummary = computed(() => calculateBudget(currentDateRange.value));

const handleAddTransaction = (
  type: TransactionType,
  description: string,
  amount: number,
  date: Date
) => {
  addTransaction(type, description, amount, date);
};

const handleDeleteTransaction = (id: string) => {
  deleteTransaction(id);
};

const handleUpdateTransaction = (
  id: string,
  description: string,
  amount: number,
  date: Date
) => {
  updateTransaction(id, description, amount, date);
};

watch([startDate, endDate], () => {
  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    end.setHours(23, 59, 59, 999);
    currentDateRange.value = { startDate: start, endDate: end };
  }
});

const formatCurrency = (amount: number): string => {
  return `€${amount.toFixed(2)}`;
};

const balanceColor = computed(() => {
  if (budgetSummary.value.balance > 0) return 'var(--accent-income)';
  if (budgetSummary.value.balance < 0) return 'var(--accent-expense)';
  return 'var(--accent-balance)';
});
onMounted(() => {
  document.body.classList.add('no-scroll');
  window.scrollTo(0, 0);
});

onUnmounted(() => {
  document.body.classList.remove('no-scroll');
  window.scrollTo(0, 0);
});
</script>

<template>
  <nav>
    <div class="logo">CHRONIO</div>
    <div class="nav-links">
      <RouterLink to="/calendario"><i class="fas fa-calendar-alt"></i> Calendario</RouterLink>
      <RouterLink to="/bacheche"><i class="fas fa-clipboard"></i> Bacheche</RouterLink>
      <RouterLink to="/budget" class="active"><i class="fas fa-wallet"></i> Budget</RouterLink>
      <RouterLink to="/account"><i class="fas fa-user-circle"></i> Account</RouterLink>
      
      <!-- Notification Bell -->
      <NotificationBell />
    </div>
  </nav>

  <div class="page-content">
    <h1>Budget</h1>
    
    <div class="budget-container">
      <!-- Card Entrate -->
      <TransactionCard
        title="Entrate"
        type="income"
        :transactions="incomeTransactions"
        @add="handleAddTransaction"
        @update="handleUpdateTransaction"
        @delete="handleDeleteTransaction"
      />

      <!-- Card Uscite -->
      <TransactionCard
        title="Uscite"
        type="expense"
        :transactions="expenseTransactions"
        @add="handleAddTransaction"
        @update="handleUpdateTransaction"
        @delete="handleDeleteTransaction"
      />

      <!-- Card Totale -->
      <div class="card totale-card">
        <h2 class="card-title">Totale</h2>
        
        <div class="budget-summary">
          <div class="date-range-selector">
            <div class="date-input-group">
              <label>Da:</label>
              <input v-model="startDate" type="date" />
            </div>
            <div class="date-input-group">
              <label>A:</label>
              <input v-model="endDate" type="date" />
            </div>
          </div>

          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">Entrate:</span>
              <span class="summary-value income-value">{{ formatCurrency(budgetSummary.totalIncome) }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Uscite:</span>
              <span class="summary-value expense-value">{{ formatCurrency(budgetSummary.totalExpenses) }}</span>
            </div>
            <div class="summary-row total-row">
              <span class="summary-label">Saldo:</span>
              <span 
                class="summary-value balance-value" 
                :style="{ color: balanceColor }"
              >
                {{ formatCurrency(budgetSummary.balance) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.budget-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-top: 2rem;
  padding: 0 1rem;
  max-width: 1600px;
  margin-left: auto;
  margin-right: auto;
}

.card {
  background: rgba(13, 72, 83, 0.69);
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(13, 72, 83, 0.08);
  position: relative;
  min-height: 500px;
  height: 100%;
  transition: all 0.3s ease;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(13, 72, 83, 0.2);
}

.card-title {
  color: white;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-align: center;
}

.budget-summary {
  background: rgba(235, 235, 235, 0.31);
  border-radius: 12px;
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.date-range-selector {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-sizing: border-box;
}

.date-input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.date-input-group:last-of-type {
  margin-bottom: 0;
}

.date-input-group label {
  color: white;
  font-weight: 600;
  min-width: 40px;
}

.date-input-group input[type="date"] {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  font-family: 'Work Sans', sans-serif;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.date-input-group input[type="date"]:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.7);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}



.summary {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 1.25rem;
  flex: 1;
  overflow: hidden;
  box-sizing: border-box;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.total-row {
  padding-top: 1rem;
  margin-top: 0.5rem;
  border-top: 2px solid rgba(255, 255, 255, 0.3);
}

.summary-label {
  color: white;
  font-size: 1rem;
  font-weight: 600;
}

.summary-value {
  font-size: 1.3rem;
  font-weight: 700;
  word-wrap: break-word;
  text-align: right;
}

.income-value {
  color: #333;
}

.expense-value {
  color: #333;
}

.balance-value {
  font-size: 1.5rem;
  color: #333;
}

/* Desktop grande */
@media (min-width: 1600px) {
  .budget-container {
    max-width: 1800px;
  }
}

/* Desktop medio */
@media (max-width: 1400px) {
  .budget-container {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
  
  .card {
    padding: 1.25rem;
  }
}

/* Desktop piccolo / Tablet landscape */
@media (max-width: 1200px) {
  .budget-container {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
    padding: 0 0.75rem;
  }
  
  .card {
    min-height: 450px;
  }
  
  .card-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
}

/* Tablet */
@media (max-width: 1024px) {
  .budget-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  .card {
    min-height: auto;
  }
}

/* Tablet piccolo */
@media (max-width: 768px) {
  .budget-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 0 0.5rem;
  }
  
  .card {
    min-height: auto;
    padding: 1.5rem;
  }
  
  .date-range-selector {
    padding: 1rem;
  }
  
  .summary {
    padding: 1rem;
  }
  
  .summary-value {
    font-size: 1.2rem;
  }
  
  .balance-value {
    font-size: 1.3rem;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .budget-container {
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .card {
    padding: 1rem;
  }
  
  .card-title {
    font-size: 1.4rem;
    margin-bottom: 0.75rem;
  }
  
  .date-input-group {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .date-input-group label {
    min-width: auto;
  }
  
  .summary-label {
    font-size: 0.9rem;
  }
  
  .summary-value {
    font-size: 1.1rem;
  }
  
  .balance-value {
    font-size: 1.2rem;
  }
}
</style>