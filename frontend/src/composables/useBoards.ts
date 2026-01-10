import { ref, computed } from 'vue';
import type { Board, Column, Task, BoardsState } from '../types/boards';

const BOARDS_KEY = 'bacheche_data';

const state = ref<BoardsState>({
  boards: [],
  nextId: 1
});

export function useBoards() {
  // Load from localStorage
  const loadBoards = () => {
    try {
      const saved = localStorage.getItem(BOARDS_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        state.value = data;
      }
    } catch (error) {
      console.error('Error loading boards:', error);
      state.value = { boards: [], nextId: 1 };
    }
  };

  // Save to localStorage
  const saveBoards = () => {
    try {
      localStorage.setItem(BOARDS_KEY, JSON.stringify(state.value));
    } catch (error) {
      console.error('Error saving boards:', error);
    }
  };

  // Generate unique ID
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Board operations
  const createBoard = (title: string = 'Nuova Bacheca'): Board => {
    const newBoard: Board = {
      id: state.value.nextId++,
      title,
      editing: false,
      columns: []
    };
    state.value.boards.push(newBoard);
    saveBoards();
    return newBoard;
  };

  const deleteBoard = (boardId: number): boolean => {
    const index = state.value.boards.findIndex(b => b.id === boardId);
    if (index !== -1) {
      state.value.boards.splice(index, 1);
      saveBoards();
      return true;
    }
    return false;
  };

  const updateBoardTitle = (boardId: number, title: string): boolean => {
    const board = state.value.boards.find(b => b.id === boardId);
    if (board) {
      board.title = title.trim() || 'Bacheca Senza Nome';
      saveBoards();
      return true;
    }
    return false;
  };

  const getBoardById = (boardId: number): Board | undefined => {
    return state.value.boards.find(b => b.id === boardId);
  };

  // Column operations
  const addColumn = (boardId: number, title: string = 'TITOLO'): Column | null => {
    const board = getBoardById(boardId);
    if (!board) return null;

    const newColumn: Column = {
      id: generateId(),
      title,
      boardId,
      order: board.columns.length,
      tasks: []
    };

    board.columns.push(newColumn);
    saveBoards();
    return newColumn;
  };

  const deleteColumn = (boardId: number, columnId: string): boolean => {
    const board = getBoardById(boardId);
    if (!board) return false;

    const index = board.columns.findIndex(c => c.id === columnId);
    if (index !== -1) {
      board.columns.splice(index, 1);
      // Reorder remaining columns
      board.columns.forEach((col, idx) => col.order = idx);
      saveBoards();
      return true;
    }
    return false;
  };

  const updateColumnTitle = (boardId: number, columnId: string, title: string): boolean => {
    const board = getBoardById(boardId);
    if (!board) return false;

    const column = board.columns.find(c => c.id === columnId);
    if (column) {
      column.title = title.trim() || 'TITOLO';
      saveBoards();
      return true;
    }
    return false;
  };

  // Task operations
  const addTask = (boardId: number, columnId: string, title: string = 'TASK'): Task | null => {
    const board = getBoardById(boardId);
    if (!board) return null;

    const column = board.columns.find(c => c.id === columnId);
    if (!column) return null;

    const newTask: Task = {
      id: generateId(),
      title,
      columnId,
      boardId,
      order: column.tasks.length
    };

    column.tasks.push(newTask);
    saveBoards();
    return newTask;
  };

  const deleteTask = (boardId: number, columnId: string, taskId: string): boolean => {
    const board = getBoardById(boardId);
    if (!board) return false;

    const column = board.columns.find(c => c.id === columnId);
    if (!column) return false;

    const index = column.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      column.tasks.splice(index, 1);
      // Reorder remaining tasks
      column.tasks.forEach((task, idx) => task.order = idx);
      saveBoards();
      return true;
    }
    return false;
  };

  const updateTaskTitle = (boardId: number, columnId: string, taskId: string, title: string): boolean => {
    const board = getBoardById(boardId);
    if (!board) return false;

    const column = board.columns.find(c => c.id === columnId);
    if (!column) return false;

    const task = column.tasks.find(t => t.id === taskId);
    if (task) {
      task.title = title.trim() || 'TASK';
      saveBoards();
      return true;
    }
    return false;
  };

  // Computed
  const boards = computed(() => state.value.boards);
  const boardsList = computed(() => 
    state.value.boards.map(b => ({ id: b.id, title: b.title }))
  );

  // Initialize
  loadBoards();

  return {
    // State
    boards,
    boardsList,
    
    // Board operations
    createBoard,
    deleteBoard,
    updateBoardTitle,
    getBoardById,
    
    // Column operations
    addColumn,
    deleteColumn,
    updateColumnTitle,
    
    // Task operations
    addTask,
    deleteTask,
    updateTaskTitle,
    
    // Utils
    saveBoards,
    loadBoards
  };
}
