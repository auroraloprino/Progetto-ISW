<template>
  <nav>
    <div class="logo">CHRONIO</div>
    <div class="nav-links">
      <RouterLink to="/calendario"><i class="fas fa-calendar-alt"></i> Calendario</RouterLink>
      <RouterLink to="/bacheche" class="active"><i class="fas fa-clipboard"></i> Bacheche</RouterLink>
      <RouterLink to="/budget"><i class="fas fa-wallet"></i> Budget</RouterLink>
      <RouterLink to="/account"><i class="fas fa-user-circle"></i> Account</RouterLink>
    </div>
  </nav>

  <div class="page-content">
    <h1>Le mie Bacheche</h1>
    
    <div class="boards-container">
      <div 
        v-for="board in boards" 
        :key="board.id"
        class="board-card"
        @click="openBoard(board.id)"
      >
        <button 
          class="delete-btn"
          @click.stop="deleteBoard(board.id)"
          title="Elimina bacheca"
        >
          <i class="fas fa-times"></i>
        </button>
        <input 
          v-if="board.editing"
          v-model="board.title"
          @blur="saveTitle(board)"
          @keyup.enter="saveTitle(board)"
          class="board-title-input"
          ref="titleInput"
        />
        <h3 v-else @dblclick.stop="editTitle(board)" class="board-title">{{ board.title }}</h3>
      </div>
      
      <div class="board-card add-board" @click="createBoard">
        <i class="fas fa-plus"></i>
        <span>Nuova Bacheca</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'

interface Board {
  id: number
  title: string
  editing: boolean
}

const BOARDS_KEY = 'bacheche_data'
const boards = ref<Board[]>([])
const nextId = ref(1)
const titleInput = ref<HTMLInputElement[]>([])

function loadBoards() {
  const saved = localStorage.getItem(BOARDS_KEY)
  if (saved) {
    const data = JSON.parse(saved)
    boards.value = data.boards
    nextId.value = data.nextId
  }
}

function saveBoards() {
  localStorage.setItem(BOARDS_KEY, JSON.stringify({
    boards: boards.value,
    nextId: nextId.value
  }))
}

function createBoard() {
  const newBoard: Board = {
    id: nextId.value++,
    title: 'Nuova Bacheca',
    editing: true
  }
  boards.value.push(newBoard)
  saveBoards()
  
  nextTick(() => {
    const inputs = titleInput.value
    if (inputs && inputs.length > 0) {
      inputs[inputs.length - 1]?.focus()
    }
  })
}

function editTitle(board: Board) {
  board.editing = true
  nextTick(() => {
    const input = titleInput.value?.find(el => el)
    input?.focus()
  })
}

function saveTitle(board: Board) {
  board.editing = false
  if (!board.title.trim()) {
    board.title = 'Bacheca Senza Nome'
  }
  saveBoards()
}

function openBoard(boardId: number) {
  console.log('Apertura bacheca:', boardId)
}

function deleteBoard(boardId: number) {
  boards.value = boards.value.filter(board => board.id !== boardId)
  saveBoards()
}

onMounted(() => {
  loadBoards()
})
</script>

<style scoped>
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
  height: calc(100vh - 100px) !important;
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
</style>