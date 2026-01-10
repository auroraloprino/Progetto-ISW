export interface Task {
  id: string;
  title: string;
  columnId: string;
  boardId: number;
  order: number;
}

export interface Column {
  id: string;
  title: string;
  boardId: number;
  order: number;
  tasks: Task[];
}

export interface Board {
  id: number;
  title: string;
  editing?: boolean;
  columns: Column[];
}

export interface BoardsState {
  boards: Board[];
  nextId: number;
}
