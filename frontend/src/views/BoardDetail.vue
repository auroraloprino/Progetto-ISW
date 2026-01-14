<template>
  <nav>
    <div class="logo">CHRONIO</div>
    <div class="nav-links">
      <RouterLink to="/calendario"><i class="fas fa-calendar-alt"></i> Calendario</RouterLink>
      
      <!-- Dropdown Bacheche -->
      <div class="dropdown" @mouseleave="startCloseTimer" @mouseenter="cancelCloseTimer">
        <a class="dropdown-toggle active" @click.stop="toggleDropdown">
          <i class="fas fa-clipboard"></i> Bacheche
          <i class="fas fa-chevron-down" :class="{ 'rotated': dropdownOpen }"></i>
        </a>
        <div class="dropdown-menu" v-show="dropdownOpen" @mouseenter="cancelCloseTimer">
          <RouterLink 
            v-for="board in boardsList" 
            :key="board.slug"
            :to="`/bacheche/${board.slug}`"
            class="dropdown-item"
            @click="closeDropdown"
          >
            <i class="fas fa-clipboard"></i>
            {{ board.title }}
          </RouterLink>
          <div class="dropdown-divider"></div>
          <RouterLink to="/bacheche" class="dropdown-item" @click="closeDropdown">
            <i class="fas fa-th"></i>
            Tutte le bacheche
          </RouterLink>
        </div>
      </div>
      
      <RouterLink to="/budget"><i class="fas fa-wallet"></i> Budget</RouterLink>
      <RouterLink to="/account"><i class="fas fa-user-circle"></i> Account</RouterLink>
    </div>
  </nav>

  <div class="page-content" v-if="board">
    <h1 v-if="!editingTitle" @dblclick="startEditTitle" class="page-title">{{ board.title }}</h1>
    <input 
      v-if="editingTitle"
      v-model="boardTitle"
      @blur="saveBoardTitle"
      @keyup.enter="saveBoardTitle"
      class="page-title-input"
      ref="titleInputRef"
      @click.stop
    />
    
    <div class="board-header">
      <button class="btn-back-to-boards" @click="goBackToBacheche">
        <i class="fas fa-arrow-left"></i> Torna alle Bacheche
      </button>
      <button class="btn-share-board" @click="openShareModal">
        <i class="fas fa-share-alt"></i> Condividi
      </button>
    </div>

    <div class="columns-container">
      <div 
        v-for="column in board.columns" 
        :key="column.id"
        class="column"
      >
        <div class="column-header">
          <input 
            v-if="editingColumn === column.id"
            v-model="columnTitles[column.id]"
            @blur="saveColumnTitle(column.id)"
            @keyup.enter="saveColumnTitle(column.id)"
            class="column-title-input"
            @click.stop
          />
          <h2 v-else @dblclick.stop="startEditColumn(column)" class="column-title">
            {{ column.title }}
          </h2>
          
          <button 
            class="delete-column-btn"
            @click.stop="handleDeleteColumn(column.id)"
            title="Elimina colonna"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="tasks-container">
          <div 
            v-for="task in column.tasks" 
            :key="task.id"
            :class="['task-card', { completed: task.completed }]"
          >
            <button 
              class="task-checkbox"
              @click.stop="toggleTaskCompleteLocal(column.id, task.id)"
              :class="{ checked: task.completed }"
            >
              <i v-if="task.completed" class="fas fa-check"></i>
            </button>
            
            <input 
              v-if="editingTask === task.id"
              v-model="taskTitles[task.id]"
              @blur="saveTaskTitle(column.id, task.id)"
              @keyup.enter="saveTaskTitle(column.id, task.id)"
              class="task-input"
              @click.stop
            />
            <span v-else @dblclick.stop="startEditTask(task)" class="task-text">
              {{ task.title }}
            </span>
            
            <button 
              class="delete-task-btn"
              @click.stop="handleDeleteTask(column.id, task.id)"
              title="Elimina task"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <button class="btn-add-task" @click="handleAddTask(column.id)">
            AGGIUNGI TASK
          </button>
        </div>
      </div>
      
      <div class="add-column-card" @click="handleAddColumn">
        <i class="fas fa-plus"></i>
        <span>AGGIUNGI SCHEDA</span>
      </div>
    </div>
  </div>

  <div class="page-content" v-else>
    <h1>Bacheca non trovata</h1>
    <RouterLink to="/bacheche" class="btn-back">Torna alle bacheche</RouterLink>
  </div>

  <ShareModal 
    :show="showShareModal" 
    type="board" 
    :itemId="board?.id || ''"
    @close="showShareModal = false"
    @success="handleShareSuccess"
  />
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBoards } from '../composables/useBoards';
import ShareModal from '../components/ShareModal.vue';

const route = useRoute();
const router = useRouter();

const {
  boardsList,
  loadBoards,
  getBoardBySlug,
  updateBoardTitle,
  addColumn,
  deleteColumn,
  updateColumnTitle,
  addTask,
  deleteTask,
  updateTaskTitle,
  moveTask,
  toggleTaskComplete
} = useBoards();

const dropdownOpen = ref(false);
const editingTitle = ref(false);
const editingColumn = ref<string | null>(null);
const editingTask = ref<string | null>(null);
const boardTitle = ref('');
const columnTitles = ref<Record<string, string>>({});
const taskTitles = ref<Record<string, string>>({});
const titleInputRef = ref<HTMLInputElement | null>(null);
const showShareModal = ref(false);
let closeTimer: ReturnType<typeof setTimeout> | null = null;

const boardSlug = computed(() => {
  const slug = route.params.slug;
  return typeof slug === 'string' ? slug : null;
});

const board = computed(() => {
  if (boardSlug.value === null) return null;
  return getBoardBySlug(boardSlug.value);
});

// Watch for board changes to update title
watch(board, (newBoard) => {
  if (newBoard) {
    boardTitle.value = newBoard.title;
  }
}, { immediate: true });

// Dropdown handlers
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

const startCloseTimer = () => {
  closeTimer = setTimeout(() => {
    dropdownOpen.value = false;
  }, 300);
};

const cancelCloseTimer = () => {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

const closeDropdown = () => {
  dropdownOpen.value = false;
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
};

// Board title editing
const startEditTitle = () => {
  editingTitle.value = true;
  boardTitle.value = board.value?.title || '';
  nextTick(() => {
    titleInputRef.value?.focus();
    titleInputRef.value?.select();
  });
};

const saveBoardTitle = async () => {
  if (board.value) {
    const oldSlug = board.value.slug;
    const { newSlug } = await updateBoardTitle(board.value.id, boardTitle.value);
    if (newSlug && newSlug !== oldSlug) {
      router.replace(`/bacheche/${newSlug}`);
    }
  }
  editingTitle.value = false;
};

// Navigation
const goBackToBacheche = () => {
  router.push('/bacheche');
};

// Column operations
const handleAddColumn = async () => {
  if (board.value) {
    await addColumn(board.value.id);
  }
};

const startEditColumn = (column: any) => {
  editingColumn.value = column.id;
  columnTitles.value[column.id] = column.title;
};

const saveColumnTitle = async (columnId: string) => {
  if (board.value) {
    await updateColumnTitle(board.value.id, columnId, columnTitles.value[columnId] || "");
  }
  editingColumn.value = null;
};

const handleDeleteColumn = async (columnId: string) => {
  if (board.value) {
    await deleteColumn(board.value.id, columnId);
  }
};

// Task operations
const handleAddTask = async (columnId: string) => {
  if (board.value) {
    await addTask(board.value.id, columnId);
  }
};

const startEditTask = (task: any) => {
  editingTask.value = task.id;
  taskTitles.value[task.id] = task.title;
};

const saveTaskTitle = async (columnId: string, taskId: string) => {
  if (board.value) {
    await updateTaskTitle(board.value.id, columnId, taskId, taskTitles.value[taskId] || "");
  }
  editingTask.value = null;
};

const handleDeleteTask = async (columnId: string, taskId: string) => {
  if (board.value) {
    await deleteTask(board.value.id, columnId, taskId);
  }
};

const toggleTaskCompleteLocal = async (columnId: string, taskId: string) => {
  if (board.value) {
    await toggleTaskComplete(board.value.id, columnId, taskId);
  }
};

// Drag and drop handlers
let draggedTask: { task: any; sourceColumnId: string } | null = null;

const handleDragStart = (event: DragEvent, task: any, columnId: string) => {
  draggedTask = { task, sourceColumnId: columnId };
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
};

const handleDragEnd = () => {
  draggedTask = null;
};

const handleDrop = async (event: DragEvent, targetColumnId: string) => {
  event.preventDefault();
  if (!draggedTask || !board.value) return;

  const { task, sourceColumnId } = draggedTask;

  if (sourceColumnId !== targetColumnId) {
    const targetColumn = board.value.columns.find((c) => c.id === targetColumnId);
    const newOrder = targetColumn?.tasks.length || 0;

    await moveTask(board.value.id, task.id, sourceColumnId, targetColumnId, newOrder);
  }

  draggedTask = null;
};

const openShareModal = () => {
  showShareModal.value = true;
};

const handleShareSuccess = () => {
  console.log('Bacheca condivisa con successo');
};

onMounted(async () => {
  await loadBoards();
  if (!board.value) {
    router.push('/bacheche');
  }
});
</script>

<style scoped>
/* Dropdown styles */
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  color: white;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.3s ease;
  border-radius: 5px;
}

.dropdown-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-toggle .fa-chevron-down {
  font-size: 0.75rem;
  transition: transform 0.3s ease;
}

.dropdown-toggle .fa-chevron-down.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: rgba(13, 72, 83, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  min-width: 200px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  margin-top: 0.5rem;
  padding: 0.5rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  color: white;
  text-decoration: none;
  transition: background 0.2s ease;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-item i {
  width: 16px;
  text-align: center;
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0.5rem 0;
}

/* Page layout */
.page-content {
  padding: 0.5rem 2rem !important;
  margin-top: 100px !important;
  height: calc(100vh - 100px) !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
  align-items: center !important;
  text-align: center !important;
}

.page-title {
  margin-bottom: 1rem !important;
  margin-top: 0 !important;
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  cursor: pointer;
}

.page-title:hover {
  opacity: 0.8;
}

.page-title-input {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  outline: none;
  text-align: center;
  margin-bottom: 1rem;
  min-width: 300px;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  width: 100%;
  max-width: 1200px;
}

.btn-back-to-boards {
  background: rgba(13, 72, 83, 0.8);
  color: white;
  border: 2px solid var(--primary-color);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.btn-back-to-boards:hover {
  background: rgba(13, 72, 83, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(13, 72, 83, 0.3);
}

.btn-share-board {
  background: rgba(52, 152, 219, 0.8);
  color: white;
  border: 2px solid #3498db;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.btn-share-board:hover {
  background: rgba(52, 152, 219, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.btn-add-column {
  background: rgba(13, 72, 83, 0.8);
  color: white;
  border: 2px solid var(--primary-color);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-add-column:hover {
  background: rgba(13, 72, 83, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(13, 72, 83, 0.3);
}

.btn-add-column i {
  margin-right: 0.5rem;
}

/* Columns layout */
.columns-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  max-width: 1200px;
}

.column {
  background: rgba(13, 72, 83, 0.6);
  border-radius: 12px;
  padding: 1.25rem;
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  position: relative;
}

.column-title {
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  cursor: pointer;
  flex: 1;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.column-title:hover {
  background: rgba(255, 255, 255, 0.1);
}

.column-title-input {
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  outline: none;
  flex: 1;
}

.delete-column-btn {
  background: rgba(231, 76, 60, 0.8);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.delete-column-btn:hover {
  background: rgba(231, 76, 60, 1);
  opacity: 1;
  transform: scale(1.1);
}

.delete-column-btn i {
  color: white;
  font-size: 10px;
}

/* Tasks */
.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.task-card {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.875rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid rgba(13, 72, 83, 0.2);
  box-shadow: 0 1px 3px rgba(13, 72, 83, 0.1);
}

.task-card:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(13, 72, 83, 0.15);
}

/* Dark mode */
[data-theme="dark"] .task-card {
  background: rgba(60, 60, 60, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .task-card:hover {
  background: rgba(60, 60, 60, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.task-card.completed {
  opacity: 0.6;
  transform: translateY(2px);
}

.task-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--primary-color);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.task-checkbox.checked {
  background: var(--primary-color);
  color: white;
}

.task-text {
  flex: 1;
  color: var(--primary-color);
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.task-card.completed .task-text {
  text-decoration: line-through;
  opacity: 0.7;
}

.task-text:hover {
  background: rgba(13, 72, 83, 0.05);
}

.task-input {
  flex: 1;
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  outline: none;
  color: var(--primary-color);
}

.delete-task-btn {
  background: rgba(231, 76, 60, 0.8);
  border: none;
  border-radius: 4px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.task-card:hover .delete-task-btn {
  opacity: 1;
}

.delete-task-btn:hover {
  background: rgba(231, 76, 60, 1);
  transform: scale(1.1);
}

.delete-task-btn i {
  color: white;
  font-size: 10px;
}

.btn-add-task {
  background: rgba(255, 255, 255, 0.2);
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 0.75rem;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
}

.btn-add-task:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.8);
}

.add-column-card {
  background: rgba(13, 72, 83, 0.1);
  border: 2px dashed var(--primary-color);
  border-radius: 12px;
  padding: 1.25rem;
  width: 280px;
  min-height: 200px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.add-column-card:hover {
  background: rgba(13, 72, 83, 0.15);
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.add-column-card i {
  font-size: 2rem;
  color: var(--primary-color);
}

.add-column-card span {
  color: var(--primary-color);
  font-weight: 600;
  font-size: 1rem;
}

/* Back button */
.btn-back {
  display: inline-block;
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-back:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(13, 72, 83, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .board-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .btn-back-to-boards {
    align-self: flex-start;
  }

  .board-title-large {
    text-align: center;
    order: 2;
  }

  .board-title-input-large {
    order: 2;
  }

  .btn-add-column {
    order: 3;
    width: 100%;
  }

  .columns-container {
    justify-content: center;
  }

  .column {
    width: 100%;
    max-width: 400px;
  }
}
</style>
