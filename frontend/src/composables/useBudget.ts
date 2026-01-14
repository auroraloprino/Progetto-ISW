import { ref, computed, onMounted } from "vue";
import type { Transaction, TransactionType, DateRange, BudgetSummary } from "../types";
import { budgetAPI } from "../services/budgetApi";

export function useBudget() {
  const transactions = ref<Transaction[]>([]);

  const load = async () => {
    transactions.value = await budgetAPI.getAll();
  };

  const addTransaction = async (
    type: TransactionType,
    description: string,
    amount: number,
    date: Date = new Date()
  ): Promise<Transaction> => {
    const created = await budgetAPI.create({ type, description, amount, date });
    transactions.value.push(created);
    return created;
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    await budgetAPI.remove(id);
    transactions.value = transactions.value.filter(t => t.id !== id);
    return true;
  };

  const updateTransaction = async (id: string, description: string, amount: number, date: Date): Promise<boolean> => {
    const updated = await budgetAPI.update(id, { description, amount, date });
    const idx = transactions.value.findIndex(t => t.id === id);
    if (idx !== -1) transactions.value[idx] = updated;
    return true;
  };

  const getTransactionsByDateRange = (dateRange: DateRange): Transaction[] => {
    return transactions.value.filter(t => t.date >= dateRange.startDate && t.date <= dateRange.endDate);
  };

  const calculateBudget = (dateRange: DateRange): BudgetSummary => {
    const filtered = getTransactionsByDateRange(dateRange);

    const totalIncome = filtered.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filtered.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses, transactions: filtered };
  };

  const allTransactions = computed(() =>
    [...transactions.value].sort((a, b) => b.date.getTime() - a.date.getTime())
  );
  const incomeTransactions = computed(() => allTransactions.value.filter(t => t.type === "income"));
  const expenseTransactions = computed(() => allTransactions.value.filter(t => t.type === "expense"));

  onMounted(() => {
    load().catch(console.error);
  });

  return {
    transactions,
    allTransactions,
    incomeTransactions,
    expenseTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    calculateBudget,
    getTransactionsByDateRange,
    load,
  };
}
