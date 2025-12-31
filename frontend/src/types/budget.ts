import { ref, computed } from 'vue';
import type { Transaction, TransactionType, DateRange, BudgetSummary } from '../types';

const STORAGE_KEY = 'chronio-budget-transactions';

export function useBudget() {
  const transactions = ref<Transaction[]>([]);

  // Load from localStorage on init
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        transactions.value = JSON.parse(stored).map((t: any) => ({
          ...t,
          date: new Date(t.date)
        }));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      transactions.value = [];
    }
  };

  // Save to localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions.value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Generate unique ID
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add transaction
  const addTransaction = (
    type: TransactionType,
    description: string,
    amount: number,
    date: Date = new Date()
  ): Transaction => {
    const transaction: Transaction = {
      id: generateId(),
      type,
      description,
      amount,
      date
    };
    
    transactions.value.push(transaction);
    saveToStorage();
    return transaction;
  };

  // Delete transaction
  const deleteTransaction = (id: string): boolean => {
    const index = transactions.value.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions.value.splice(index, 1);
      saveToStorage();
      return true;
    }
    return false;
  };

  // Get transactions by date range
  const getTransactionsByDateRange = (dateRange: DateRange): Transaction[] => {
    return transactions.value.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
    });
  };

  // Calculate budget
  const calculateBudget = (dateRange: DateRange): BudgetSummary => {
    const filteredTransactions = getTransactionsByDateRange(dateRange);
    
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactions: filteredTransactions
    };
  };

  // Computed values
  const allTransactions = computed(() => 
    [...transactions.value].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  );

  const incomeTransactions = computed(() => 
    allTransactions.value.filter(t => t.type === 'income')
  );

  const expenseTransactions = computed(() => 
    allTransactions.value.filter(t => t.type === 'expense')
  );

  // Initialize
  loadFromStorage();

  return {
    transactions,
    allTransactions,
    incomeTransactions,
    expenseTransactions,
    addTransaction,
    deleteTransaction,
    calculateBudget,
    getTransactionsByDateRange
  };
}