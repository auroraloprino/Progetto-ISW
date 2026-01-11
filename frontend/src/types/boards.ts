export interface Task {
  id: string;
  title: string;
  columnId: string;
  boardSlug: string;
  order: number;
  completed?: boolean;
}

export interface Column {
  id: string;
  title: string;
  boardSlug: string;
  order: number;
  tasks: Task[];
}

export interface Board {
  slug: string;
  title: string;
  editing?: boolean;
  columns: Column[];
}

export interface BoardsState {
  boards: Board[];
}
