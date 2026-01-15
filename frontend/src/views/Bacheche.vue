<template>

  <div class="page-content">
    <div class="page-header">
      <button class="search-toggle" @click="toggleSearch" title="Cerca nelle bacheche">
        🔎︎
      </button>
      <h1>Le mie Bacheche</h1>
    </div>
    
    <div v-if="showSearch" class="search-container">
      <div class="search-input-wrapper">
        <input 
          v-model="searchQuery" 
          @input="handleSearch"
          class="search-input" 
          placeholder="Cerca nelle bacheche..."
          ref="searchInputRef"
        />
        <i class="fas fa-search search-icon"></i>
      </div>
      <div v-if="showSearchResults && searchResults.length > 0" class="search-results">
        <div 
          v-for="result in searchResults" 
          :key="`${result.boardSlug}-${result.taskId}`"
          class="search-result"
          @click="goToBoard(result.boardSlug)"
        >
          <div class="result-board">{{ result.boardTitle }}</div>
          <div class="result-task">{{ result.taskText }}</div>
        </div>
      </div>
    </div>
    
    <div class="boards-container">
      <div 
        v-for="board in boards" 
        :key="board.slug"
        class="board-card"
        @click="openBoard(board.slug)"
      >
        <button
          v-if="isOwner(board)"
          class="delete-btn"
          @click.stop="handleDeleteBoard(board)"
          title="Elimina bacheca"
        >
          <i class="fas fa-times"></i>
        </button>
        <input 
          v-if="board.editing"
          v-model="boardTitles[board.slug]"
          @blur="saveBoardTitle(board)"
          @keyup.enter="saveBoardTitle(board)"
          @click.stop
          class="board-title-input"
          ref="titleInputs"
        />
        <h3 v-else @dblclick.stop="startEditTitle(board)" class="board-title">{{ board.title }}</h3>
      </div>
      
      <div class="board-card add-board" @click="handleCreateBoard">
        <i class="fas fa-plus"></i>
        <span>Nuova Bacheca</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBoards } from '../composables/useBoards';
import { useNotifications } from '../composables/useNotifications';
import { currentUser } from '../auth/auth';
import type { Board } from '../types/boards';

const router = useRouter();

const {
  boards,
  boardsList,
  loadBoards,
  createBoard,
  deleteBoard,
  updateBoardTitle
} = useBoards();

const { notifications } = useNotifications();
const userId = ref<string | null>(null);

const todayEventsCount = computed(() => {
  return notifications.value.filter(n => {
    if (n.read) return false
    
    const eventDate = new Date(n.datetime)
    const now = new Date()
    const timeDiff = eventDate.getTime() - now.getTime()
    const minutesDiff = Math.floor(timeDiff / 60000)
    
    return minutesDiff <= 30 && minutesDiff >= 0
  }).length
});

const dropdownOpen = ref(false);
const boardTitles = reactive<Record<string, string>>({});
const titleInputs = ref<HTMLInputElement[]>([]);
const searchQuery = ref('');
const searchResults = ref<any[]>([]);
const showSearchResults = ref(false);
const showSearch = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);
let closeTimer: ReturnType<typeof setTimeout> | null = null;

const isOwner = (board: Board) => board.ownerId === userId.value;

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.search-container')) {
    showSearchResults.value = false;
  }
};

onMounted(async () => {
  const user = await currentUser();
  userId.value = user?.id || null;
  document.body.classList.remove('dashboard-page');
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
onMounted(async () => {
  const user = await currentUser();
  userId.value = user?.id || null;
  await loadBoards();
  document.addEventListener('click', handleClickOutside);
});

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

// Board operations
const handleCreateBoard = async () => {
  const newBoard = await createBoard();
  newBoard.editing = true;
  boardTitles[newBoard.slug] = newBoard.title;

  nextTick(() => {
    const inputs = titleInputs.value;
    if (inputs && inputs.length > 0) {
      const lastInput = inputs[inputs.length - 1];
      lastInput?.focus();
      lastInput?.select();
    }
  });
};

const startEditTitle = (board: Board) => {
  board.editing = true;
  boardTitles[board.slug] = board.title;
  
  nextTick(() => {
    const input = titleInputs.value?.find(el => el);
    input?.focus();
    input?.select();
  });
};

const saveBoardTitle = async (board: Board) => {
  const oldSlug = board.slug;
  const title = boardTitles[oldSlug] || board.title;

  const { newSlug } = await updateBoardTitle(board.id, title);
  board.editing = false;

  if (newSlug && newSlug !== oldSlug) {
    delete boardTitles[oldSlug];
    boardTitles[newSlug] = title;
  }
};

const handleDeleteBoard = async (board: Board) => {
  await deleteBoard(board.id);
};

const openBoard = (slug: string) => {
  router.push(`/bacheche/${slug}`);
};

const handleSearch = () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    showSearchResults.value = false;
    return;
  }
  
  const results: any[] = [];
  const query = searchQuery.value.toLowerCase();
  
  boards.value.forEach(board => {
    board.columns.forEach(column => {
      column.tasks.forEach(task => {
        if (task.title && task.title.toLowerCase().includes(query)) {
          results.push({
            boardSlug: board.slug,
            boardTitle: board.title,
            taskId: task.id,
            taskText: task.title
          });
        }
      });
    });
  });
  
  searchResults.value = results;
  showSearchResults.value = results.length > 0;
};

const goToBoard = (slug: string) => {
  searchQuery.value = '';
  searchResults.value = [];
  showSearchResults.value = false;
  showSearch.value = false;
  router.push(`/bacheche/${slug}`);
};

const toggleSearch = () => {
  showSearch.value = !showSearch.value;
  if (showSearch.value) {
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  } else {
    searchQuery.value = '';
    searchResults.value = [];
    showSearchResults.value = false;
  }
};
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
  max-height: 400px;
  overflow-y: auto;
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
  cursor: pointer;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-item.disabled {
  opacity: 0.6;
  cursor: default;
}

.dropdown-item.disabled:hover {
  background: transparent;
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

/* Boards grid */
.boards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 30px;
  padding: 10px 0 20px 0;
  justify-content: flex-start;
}

.board-card {
  background: rgba(13, 72, 83, 0.69);
  border: 2px solid var(--primary-color);
  border-radius: 12px;
  padding: 20px;
  height: 120px;
  min-width: 280px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 15px rgba(13, 72, 83, 0.1);
}

.board-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(13, 72, 83, 0.2);
}

.board-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin: 0;
  word-break: break-word;
}

.board-title-input {
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  width: 100%;
  outline: none;
  color: var(--primary-color);
}

.add-board {
  background: rgba(13, 72, 83, 0.1);
  border: 2px dashed var(--primary-color);
  flex-direction: column;
  gap: 10px;
}

.add-board:hover {
  background: rgba(13, 72, 83, 0.15);
  border-color: var(--primary-color);
}

.add-board i {
  font-size: 24px;
  color: var(--primary-color);
}

.add-board span {
  color: var(--primary-color);
  font-weight: 500;
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(231, 76, 60, 0.8);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
}

.board-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(231, 76, 60, 1);
  transform: scale(1.1);
}

.delete-btn i {
  color: white;
  font-size: 12px;
}

.page-content {
  padding: 0.5rem 2rem !important;
  margin-top: 100px !important;
  min-height: calc(100vh - 100px) !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: flex-start !important;
  align-items: center !important;
  text-align: center !important;
}

.page-content h1 {
  margin-bottom: 1rem !important;
  margin-top: 0 !important;
}

.account-badge {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  background: #e74c3c;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.4rem;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
  line-height: 1;
}

.nav-links a {
  position: relative;
}
</style>
