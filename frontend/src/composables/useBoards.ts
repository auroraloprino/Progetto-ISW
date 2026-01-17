import { ref, computed } from "vue";
import type { Board, Column, Task, BoardsState } from "../types/boards";
import { api } from "../services/api";

const state = ref<BoardsState>({ boards: [] });

const generateSlug = (title: string, existingSlugs: string[] = []): string => {
  let slug = title
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) slug = "bacheca";

  let finalSlug = slug;
  let counter = 1;
  while (existingSlugs.includes(finalSlug)) {
    finalSlug = `${slug}-${counter++}`;
  }
  return finalSlug;
};

const generateId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

export function useBoards() {
  const boards = computed(() => state.value.boards);
  const boardsList = computed(() => state.value.boards.map((b) => ({ slug: b.slug, title: b.title })));

  const getExistingSlugs = () => state.value.boards.map((b) => b.slug);

  const loadBoards = async () => {
    const r = await api.get("/boards");
    state.value.boards = r.data as Board[];
  };

  const getBoardBySlug = (slug: string): Board | undefined => state.value.boards.find((b) => b.slug === slug);

  const getNextBoardName = (): string => {
    // Trova tutte le bacheche che iniziano con "Nuova Bacheca"
    const existingNames = state.value.boards
      .map(b => b.title)
      .filter(title => title.startsWith('Nuova Bacheca'));
    
    // Se non ce ne sono, ritorna "Nuova Bacheca"
    if (existingNames.length === 0) {
      return 'Nuova Bacheca';
    }
    
    // Estrae i numeri da tutti i nomi
    const numbers: number[] = [];
    
    existingNames.forEach(name => {
      if (name === 'Nuova Bacheca') {
        numbers.push(0); // "Nuova Bacheca" senza numero = 0
      } else {
        // Estrae il numero dopo "Nuova Bacheca"
        const match = name.match(/^Nuova Bacheca(\d+)$/);
        if (match) {
          numbers.push(parseInt(match[1]));
        }
      }
    });
    
    // Se non ci sono numeri validi, ritorna "Nuova Bacheca1"
    if (numbers.length === 0) {
      return 'Nuova Bacheca1';
    }
    
    // Trova il numero più alto
    const maxNumber = Math.max(...numbers);
    
    // Se il numero più alto è 0 (solo "Nuova Bacheca" esiste), ritorna "Nuova Bacheca1"
    if (maxNumber === 0) {
      return 'Nuova Bacheca1';
    }
    
    // Altrimenti ritorna il prossimo numero
    return `Nuova Bacheca${maxNumber + 1}`;
  };

  const createBoard = async (title?: string): Promise<Board> => {
    // Se non viene passato un titolo, genera un nome sequenziale
    const boardTitle = title || getNextBoardName();
    const slug = generateSlug(boardTitle, getExistingSlugs());
    const r = await api.post("/boards", { title: boardTitle, slug });
    const created = r.data as Board;
    state.value.boards.push(created);
    return created;
  };

  const deleteBoard = async (boardId: string): Promise<boolean> => {
    await api.delete(`/boards/${boardId}`);
    state.value.boards = state.value.boards.filter((b) => b.id !== boardId);
    return true;
  };

  const updateBoard = async (board: Board): Promise<Board> => {
    const r = await api.put(`/boards/${board.id}`, {
      title: board.title,
      slug: board.slug,
      columns: board.columns,
    });
    const updated = r.data as Board;

    const idx = state.value.boards.findIndex((b) => b.id === board.id);
    if (idx !== -1) state.value.boards[idx] = updated;

    return updated;
  };

  const updateBoardTitle = async (boardId: string, newTitle: string): Promise<{ newSlug: string }> => {
    const board = state.value.boards.find((b) => b.id === boardId);
    if (!board) throw new Error("Board not found");

    const trimmedTitle = newTitle.trim() || "Bacheca Senza Nome";
    const existingSlugs = getExistingSlugs().filter((s) => s !== board.slug);
    const newSlug = generateSlug(trimmedTitle, existingSlugs);

    board.title = trimmedTitle;
    board.slug = newSlug;

    // aggiorna boardSlug su colonne/task
    board.columns.forEach((col) => {
      col.boardSlug = newSlug;
      col.tasks.forEach((t) => (t.boardSlug = newSlug));
    });

    await updateBoard(board);
    return { newSlug };
  };

  // Column operations
  const addColumn = async (boardId: string, title: string = "TITOLO"): Promise<Column | null> => {
    const board = state.value.boards.find((b) => b.id === boardId);
    if (!board) return null;

    const newColumn: Column = {
      id: generateId(),
      title,
      boardSlug: board.slug,
      order: board.columns.length,
      tasks: [],
    };

    board.columns.push(newColumn);
    await updateBoard(board);
    return newColumn;
  };

  const deleteColumn = async (boardId: string, columnId: string): Promise<boolean> => {
    const board = state.value.boards.find((b) => b.id === boardId);
    if (!board) return false;

    const index = board.columns.findIndex((c) => c.id === columnId);
    if (index === -1) return false;

    board.columns.splice(index, 1);
    board.columns.forEach((col, idx) => (col.order = idx));

    await updateBoard(board);
    return true;
  };

  const updateColumnTitle = async (boardId: string, columnId: string, title: string): Promise<boolean> => {
    const board = state.value.boards.find((b) => b.id === boardId);
    if (!board) return false;

    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return false;

    column.title = title.trim() || "TITOLO";
    await updateBoard(board);
    return true;
  };

  // Task operations
  const addTask = async (boardId: string, columnId: string, title: string = "TASK"): Promise<Task | null> => {
    const board = state.value.boards.find((b) => b.id === boardId);
    if (!board) return null;

    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return null;

    const newTask: Task = {
      id: generateId(),
      title,
      columnId,
      boardSlug: board.slug,
      order: column.tasks.length,
    };

    column.tasks.push(newTask);
    await updateBoard(board);
    return newTask;
  };

  const deleteTask = async (boardId: string, columnId: string, taskId: string): Promise<boolean> => {
    const board = state.value.boards.find((b) => b.id === boardId);
    if (!board) return false;

    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return false;

    const index = column.tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return false;

    column.tasks.splice(index, 1);
    column.tasks.forEach((t, idx) => (t.order = idx));

    await updateBoard(board);
    return true;
  };

  const updateTaskTitle = async (
    boardId: string,
    columnId: string,
    taskId: string,
    title: string
  ): Promise<boolean> => {
    const board = state.value.boards.find((b) => b.id === boardId);
    if (!board) return false;

    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return false;

    const task = column.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    task.title = title.trim() || "TASK";
    await updateBoard(board);
    return true;
  };

  const moveTask = async (
    boardId: string,
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
    newOrder: number
  ): Promise<boolean> => {
    const board = state.value.boards.find((b) => b.id === boardId);
    if (!board) return false;

    const fromColumn = board.columns.find((c) => c.id === fromColumnId);
    const toColumn = board.columns.find((c) => c.id === toColumnId);
    if (!fromColumn || !toColumn) return false;

    const taskIndex = fromColumn.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return false;

    const task = fromColumn.tasks[taskIndex];
    fromColumn.tasks.splice(taskIndex, 1);

    task.columnId = toColumnId;

    toColumn.tasks.splice(newOrder, 0, task);

    fromColumn.tasks.forEach((t, idx) => (t.order = idx));
    toColumn.tasks.forEach((t, idx) => (t.order = idx));

    await updateBoard(board);
    return true;
  };

  const toggleTaskComplete = async (boardId: string, columnId: string, taskId: string): Promise<boolean> => {
    const board = state.value.boards.find((b) => b.id === boardId);
    if (!board) return false;

    const column = board.columns.find((c) => c.id === columnId);
    if (!column) return false;

    const task = column.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    task.completed = !task.completed;
    await updateBoard(board);
    return true;
  };

  const leaveSharedBoard = async (boardId: string): Promise<void> => {
    await api.delete(`/boards/${boardId}/leave`);
    state.value.boards = state.value.boards.filter((b) => b.id !== boardId);
  };

  // non auto-load qui per evitare chiamate duplicate.
  // Le view chiamano loadBoards() in onMounted.
  return {
    boards,
    boardsList,
    loadBoards,
    getBoardBySlug,
    createBoard,
    deleteBoard,
    updateBoardTitle,
    addColumn,
    deleteColumn,
    updateColumnTitle,
    addTask,
    deleteTask,
    updateTaskTitle,
    moveTask,
    toggleTaskComplete,
    leaveSharedBoard,
  };
}