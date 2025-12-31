<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBudget } from '../composables/useBudget';
import TransactionCard from '../components/TransactionCard.vue';
import type { TransactionType, DateRange } from '../types';

const {
  incomeTransactions,
  expenseTransactions,
  addTransaction,
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

const handleCalculate = () => {
  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);
    end.setHours(23, 59, 59, 999);
    currentDateRange.value = { startDate: start, endDate: end };
  }
};

const formatCurrency = (amount: number): string => {
  return `€${amount.toFixed(2)}`;
};

const balanceColor = computed(() => {
  if (budgetSummary.value.balance > 0) return 'var(--accent-income)';
  if (budgetSummary.value.balance < 0) return 'var(--accent-expense)';
  return 'var(--accent-balance)';
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
        @delete="handleDeleteTransaction"
      />

      <!-- Card Uscite -->
      <TransactionCard
        title="Uscite"
        type="expense"
        :transactions="expenseTransactions"
        @add="handleAddTransaction"
        @delete="handleDeleteTransaction"
      />

      <!-- Card Totale -->
      <div class="card totale-card">
        <h2 class="card-title">Totale</h2>
        
        <div class="budget-summary">
          <div class="date-range-selector">
            <div class="date-input-group">
              <label>Da:</label>
              <input v-model="startDate" type="date" @change="handleCalculate" />
            </div>
            <div class="date-input-group">
              <label>A:</label>
              <input v-model="endDate" type="date" @change="handleCalculate" />
            </div>
            <button class="btn-calculate" @click="handleCalculate">Calcola</button>
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
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.card {
  background: var(--bg-card, rgba(107, 134, 132, 0.85));
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  position: relative;
  min-height: 400px;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
}

.card-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-light, #e8f4f3);
  margin-bottom: 1.5rem;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}

.budget-summary {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.date-range-selector {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.date-input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.date-input-group label {
  color: var(--text-light, #e8f4f3);
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

.btn-calculate {
  width: 100%;
  padding: 0.85rem;
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-family: 'Work Sans', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.btn-calculate:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(66, 153, 225, 0.4);
}

.summary {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 1.5rem;
  flex: 1;
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
  color: var(--text-light, #e8f4f3);
  font-size: 1rem;
  font-weight: 600;
}

.summary-value {
  font-size: 1.3rem;
  font-weight: 700;
  font-family: 'Playfair Display', serif;
}

.income-value {
  color: var(--accent-income, #48bb78);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.expense-value {
  color: var(--accent-expense, #f56565);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.balance-value {
  font-size: 1.5rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

@media (max-width: 1200px) {
  .budget-container {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .budget-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .card {
    min-height: auto;
  }
}
</style>