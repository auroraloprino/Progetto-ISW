import { ref, computed } from 'vue';
import type { Board, Column, Task, BoardsState } from '../types/boards';

const BOARDS_KEY = 'bacheche_data';

const state = ref<BoardsState>({
  boards: []
});

export function useBoards() {
  // Generate slug from title
  const generateSlug = (title: string, existingSlugs: string[] = []): string => {
    // Convert to lowercase and replace spaces/special chars with hyphens
    let slug = title
      .toLowerCase()
      .trim()
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    // If empty, use default
    if (!slug) {
      slug = 'bacheca';
    }

    // Check if slug exists and add number suffix if needed
    let finalSlug = slug;
    let counter = 1;
    while (existingSlugs.includes(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  };

  // Load from localStorage
  const loadBoards = () => {
    try {
      const saved = localStorage.getItem(BOARDS_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        
        // Migration: convert old numeric IDs to slugs if needed
        if (data.boards && data.boards.length > 0) {
          const firstBoard = data.boards[0];
          
          // Check if boards still use old format (id instead of slug)
          if ('id' in firstBoard && !('slug' in firstBoard)) {
            console.log('Migrating old board format to slug-based...');
            data.boards = data.boards.map((board: any) => {
              const slug = generateSlug(board.title);
              return {
                slug,
                title: board.title,
                editing: board.editing || false,
                columns: (board.columns || []).map((col: any) => ({
                  ...col,
                  boardSlug: slug
                }))
              };
            });
            // Save migrated data
            localStorage.setItem(BOARDS_KEY, JSON.stringify(data));
          }
        }
        
        state.value = data;
      }
    } catch (error) {
      console.error('Error loading boards:', error);
      state.value = { boards: [] };
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

  // Generate unique ID for columns/tasks
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Get all existing slugs
  const getExistingSlugs = (): string[] => {
    return state.value.boards.map(b => b.slug);
  };

  // Board operations
  const createBoard = (title: string = 'Nuova Bacheca'): Board => {
    const slug = generateSlug(title, getExistingSlugs());
    const newBoard: Board = {
      slug,
      title,
      editing: false,
      columns: []
    };
    state.value.boards.push(newBoard);
    saveBoards();
    return newBoard;
  };

  const deleteBoard = (slug: string): boolean => {
    const index = state.value.boards.findIndex(b => b.slug === slug);
    if (index !== -1) {
      state.value.boards.splice(index, 1);
      saveBoards();
      return true;
    }
    return false;
  };

  const updateBoardTitle = (oldSlug: string, newTitle: string): string | null => {
    const board = state.value.boards.find(b => b.slug === oldSlug);
    if (!board) return null;

    const trimmedTitle = newTitle.trim() || 'Bacheca Senza Nome';
    
    // Generate new slug
    const existingSlugs = getExistingSlugs().filter(s => s !== oldSlug);
    const newSlug = generateSlug(trimmedTitle, existingSlugs);
    
    // Update board
    board.title = trimmedTitle;
    board.slug = newSlug;
    
    // Update all columns and tasks with new boardSlug
    board.columns.forEach(column => {
      column.boardSlug = newSlug;
      column.tasks.forEach(task => {
        task.boardSlug = newSlug;
      });
    });
    
    saveBoards();
    return newSlug;
  };

  const getBoardBySlug = (slug: string): Board | undefined => {
    return state.value.boards.find(b => b.slug === slug);
  };

  // Column operations
  const addColumn = (boardSlug: string, title: string = 'TITOLO'): Column | null => {
    const board = getBoardBySlug(boardSlug);
    if (!board) return null;

    const newColumn: Column = {
      id: generateId(),
      title,
      boardSlug,
      order: board.columns.length,
      tasks: []
    };

    board.columns.push(newColumn);
    saveBoards();
    return newColumn;
  };

  const deleteColumn = (boardSlug: string, columnId: string): boolean => {
    const board = getBoardBySlug(boardSlug);
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

  const updateColumnTitle = (boardSlug: string, columnId: string, title: string): boolean => {
    const board = getBoardBySlug(boardSlug);
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
  const addTask = (boardSlug: string, columnId: string, title: string = 'TASK'): Task | null => {
    const board = getBoardBySlug(boardSlug);
    if (!board) return null;

    const column = board.columns.find(c => c.id === columnId);
    if (!column) return null;

    const newTask: Task = {
      id: generateId(),
      title,
      columnId,
      boardSlug,
      order: column.tasks.length
    };

    column.tasks.push(newTask);
    saveBoards();
    return newTask;
  };

  const deleteTask = (boardSlug: string, columnId: string, taskId: string): boolean => {
    const board = getBoardBySlug(boardSlug);
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

  const updateTaskTitle = (boardSlug: string, columnId: string, taskId: string, title: string): boolean => {
    const board = getBoardBySlug(boardSlug);
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

  const moveTask = (boardSlug: string, taskId: string, fromColumnId: string, toColumnId: string, newOrder: number): boolean => {
    const board = getBoardBySlug(boardSlug);
    if (!board) return false;

    const fromColumn = board.columns.find(c => c.id === fromColumnId);
    const toColumn = board.columns.find(c => c.id === toColumnId);
    if (!fromColumn || !toColumn) return false;

    const taskIndex = fromColumn.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return false;

    const task = fromColumn.tasks[taskIndex];
    
    // Remove from source column
    fromColumn.tasks.splice(taskIndex, 1);
    
    // Update task's columnId
    task.columnId = toColumnId;
    task.boardSlug = boardSlug;
    
    // Insert into target column at specified position
    toColumn.tasks.splice(newOrder, 0, task);
    
    // Reorder tasks in both columns
    fromColumn.tasks.forEach((t, idx) => t.order = idx);
    toColumn.tasks.forEach((t, idx) => t.order = idx);
    
    saveBoards();
    return true;
  };

  // Computed
  const boards = computed(() => state.value.boards);
  const boardsList = computed(() => 
    state.value.boards.map(b => ({ slug: b.slug, title: b.title }))
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
    getBoardBySlug,
    
    // Column operations
    addColumn,
    deleteColumn,
    updateColumnTitle,
    
    // Task operations
    addTask,
    deleteTask,
    updateTaskTitle,
    moveTask,
    
    // Utils
    saveBoards,
    loadBoards
  };
}
