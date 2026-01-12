<template>
  <div>
    <nav> <div class="logo">CHRONIO</div> 
      <div class="nav-links">
        <RouterLink to="/calendario" class="active"><i class="fas fa-calendar-alt"></i> Calendario</RouterLink>
        <RouterLink to="/bacheche"><i class="fas fa-clipboard"></i> Bacheche</RouterLink>
        <RouterLink to="/budget"><i class="fas fa-wallet"></i> Budget</RouterLink>
        <RouterLink to="/account"><i class="fas fa-user-circle"></i> Account</RouterLink>
        
        <!-- Notification Bell -->
        <NotificationBell />
      </div>
    </nav>
    
    <div class="container">
      <div class="sidebar-left">
        <div class="tags-section">
          <div class="tags-header">
            <button @click="toggleTagsVisibility" class="burger-menu">
              <i class="fas fa-bars"></i>
            </button>
            <span>Tags</span>
            <button @click="openTagModal" class="add-tag-btn">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <div v-show="tagsVisible" class="tags-list">
            <div 
              v-for="tag in tags" 
              :key="tag.id"
              class="tag-item"
              @dblclick="editTag(tag.id)"
            >
              <div 
                :class="['tag-checkbox', { checked: tag.visible }]"
                @click="toggleTag(tag.id)"
              >
                <i v-if="tag.visible" class="fas fa-check"></i>
              </div>
              <div class="tag-color" :style="{ background: tag.color }"></div>
              <span class="tag-name">{{ tag.name }}</span>
              <button @click="deleteTag(tag.id)" class="delete-tag-btn">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="main-content">
        <div class="calendar-header">
          <div class="month-nav">
            <button @click="prevMonth"><i class="fas fa-chevron-left"></i></button>
            <h2>{{ months[displayMonth] }} {{ displayYear }}</h2>
            <button @click="nextMonth"><i class="fas fa-chevron-right"></i></button>
          </div>
          <select v-model="currentView" class="view-selector">
            <option value="month">Mese</option>
            <option value="week">Settimana</option>
            <option value="day">Giorno</option>
          </select>
        </div>
        
        <div v-show="currentView === 'month'" class="calendar">
          <div class="weekdays">
            <span v-for="day in weekdays" :key="day">{{ day }}</span>
          </div>
          <div class="days">
            <div 
              v-for="day in calendarDays" 
              :key="day.key"
              :class="['day', { 
                'other-month': day.otherMonth, 
                'today': day.isToday,
                'has-event': day.hasEvents 
              }]"
              @click="openEventModal(day.date, day.actualMonth, day.actualYear)"
            >
              <span>{{ day.date }}</span>
              <div 
                v-for="event in day.events" 
                :key="event.id"
                class="calendar-event"
                :style="{ backgroundColor: getEventColor(event.tag) }"
                @click.stop="editEvent(day.dateKey, event.id)"
              >
                {{ getEventDisplayTitle(event, day.dateKey) }}
              </div>
            </div>
          </div>
        </div>
        
        <div v-show="currentView === 'week'" class="week-view">
          <div class="week-nav">
            <button @click="prevWeek"><i class="fas fa-chevron-left"></i></button>
            <h3></h3>
            <button @click="nextWeek"><i class="fas fa-chevron-right"></i></button>
          </div>
          <div class="week-header">
            <div class="time-column"></div>
            <div v-for="day in weekViewDays" :key="day.dateKey" class="week-day-header">
              <div class="week-day-name">{{ day.dayName }}</div>
              <div class="week-day-date">{{ day.date }}</div>
            </div>
          </div>
          
          <div class="week-all-day-row">
            <div class="week-all-day-label">Tutto il giorno</div>
            <div v-for="day in weekViewDays" :key="`allday-${day.dateKey}`" class="week-all-day-cell" @click="openEventModal(day.date, day.month, day.year, 0)">
              <div 
                v-for="event in getWeekAllDayEvents(day.dateKey)" 
                :key="event.id" 
                class="week-all-day-event" 
                :style="{ backgroundColor: getEventColor(event.tag) }" 
                @click.stop="editEvent(day.dateKey, event.id)"
              >
                {{ event.title }}
              </div>
            </div>
          </div>
          
          <div class="week-timeline">
            <div v-for="hour in 24" :key="hour" class="week-hour-row">
              <div class="week-hour-label">{{ String(hour - 1).padStart(2, '0') }}:00</div>
              <div v-for="day in weekViewDays" :key="`${day.dateKey}-${hour}`" class="week-hour-cell" @click="openEventModal(day.date, day.month, day.year, hour - 1)">
                <div 
                  v-for="event in getWeekEventsForHour(day.dateKey, hour - 1)" 
                  :key="event.id" 
                  class="week-hour-event" 
                  :style="{ backgroundColor: getEventColor(event.tag) }" 
                  @click.stop="editEvent(day.dateKey, event.id)"
                >
                  {{ event.title }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-show="currentView === 'day'" class="day-view">
          <div class="day-header">
            <div class="day-nav">
              <button @click="prevDay"><i class="fas fa-chevron-left"></i></button>
              <h3>{{ selectedDayName }} {{ selectedDay }} {{ months[displayMonth] }} {{ displayYear }}</h3>
              <button @click="nextDay"><i class="fas fa-chevron-right"></i></button>
            </div>
          </div>
          
          <div class="all-day-section" @click="openEventModal(selectedDay, displayMonth, displayYear, 0)">
            <div class="all-day-header">Tutto il giorno</div>
            <div class="all-day-events">
              <div 
                v-for="event in getAllDayEvents()" 
                :key="event.id" 
                class="all-day-event" 
                :style="{ backgroundColor: getEventColor(event.tag) }" 
                @click.stop="editEvent(selectedDayDateKey, event.id)"
              >
                {{ event.title }}
              </div>
              <div v-if="getAllDayEvents().length === 0" class="no-all-day-events">Clicca per aggiungere evento</div>
            </div>
          </div>
          
          <div class="day-timeline">
            <div v-for="hour in 24" :key="hour" class="hour-slot" @click="openEventModal(selectedDay, displayMonth, displayYear, hour - 1)">
              <div class="hour-label">{{ String(hour - 1).padStart(2, '0') }}:00</div>
              <div class="hour-events">
                <div 
                  v-for="event in getEventsForHour(hour - 1)" 
                  :key="event.id" 
                  class="hour-event" 
                  :style="{ backgroundColor: getEventColor(event.tag) }" 
                  @click.stop="editEvent(selectedDayDateKey, event.id)"
                >
                  {{ event.title }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="sidebar-right">
        <div class="spacer"></div>
        <div class="today-card">
          <div class="card-inner">
            <h3>Oggi</h3>
            <div v-if="todayEvents.length > 0">
              <div 
                v-for="event in todayEvents" 
                :key="event.id"
                class="event"
                @click="editEvent(event.dateKey, event.id)"
              >
                <button 
                  class="event-delete-btn"
                  @click.stop="deleteEventFromSidebar(event.id)"
                  title="Elimina evento"
                >
                  <i class="fas fa-times"></i>
                </button>
                <div class="event-color" :style="{ background: getEventColor(event.tag) }"></div>
                <div class="event-info">
                  <h4>{{ event.displayTitle }}</h4>
                  <span>{{ formatEventTime(event) }} - {{ event.type }}</span>
                </div>
              </div>
            </div>
            <div v-else class="no-events">Nessun evento oggi</div>
          </div>
        </div>
        
        <div class="week-card">
          <div class="card-inner">
            <h3>Questa settimana</h3>
            <div v-if="weekEvents.length > 0">
              <div 
                v-for="event in weekEvents" 
                :key="`${event.id}-${event.dateKey}`"
                class="event"
                @click="editEvent(event.dateKey, event.id)"
              >
                <button 
                  class="event-delete-btn"
                  @click.stop="deleteEventFromSidebar(event.id)"
                  title="Elimina evento"
                >
                  <i class="fas fa-times"></i>
                </button>
                <div class="event-color" :style="{ background: getEventColor(event.tag) }"></div>
                <div class="event-info">
                  <h4>{{ event.title }}</h4>
                  <span>{{ event.date }} {{ event.month }} - {{ event.time }} - {{ event.type }}</span>
                </div>
              </div>
            </div>
            <div v-else class="no-events">Nessun evento nei prossimi giorni</div>
          </div>
        </div>
      </div>
    </div>

    <div v-show="showEventModal" class="modal">
      <div class="modal-content">
        <div class="modal-inner">
          <span @click="closeEventModal" class="close">&times;</span>
          <h3>{{ editingEventId ? 'Modifica evento' : 'Aggiungi evento' }}</h3>
          
          <div class="form-group">
            <label>Titolo</label>
            <input v-model="eventForm.title" type="text" placeholder="Inserisci titolo">
          </div>
          
          <div class="form-group">
            <label class="radio-label">
              <input v-model="eventForm.allDay" type="checkbox"> Tutto il giorno
            </label>
          </div>
          
          <div class="form-group">
            <label>{{ eventForm.allDay ? 'Data Inizio' : 'Data e Ora Inizio' }}</label>
            <input 
              v-model="eventForm.datetime" 
              :type="eventForm.allDay ? 'date' : 'datetime-local'"
            >
          </div>
          
          <div class="form-group">
            <label>{{ eventForm.allDay ? 'Data Fine' : 'Data e Ora Fine' }}</label>
            <input 
              v-model="eventForm.endDatetime" 
              :type="eventForm.allDay ? 'date' : 'datetime-local'"
            >
          </div>
          
          <div class="form-group">
            <label>Tipo</label>
            <div class="checkbox-group">
              <label class="radio-label">
                <input v-model="eventForm.type" type="radio" value="evento"> Evento
              </label>
              <label class="radio-label">
                <input v-model="eventForm.type" type="radio" value="attivita"> Attività
              </label>
              <label class="radio-label">
                <input v-model="eventForm.type" type="radio" value="appuntamento"> Appuntamento
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label>Descrizione</label>
            <textarea v-model="eventForm.description" placeholder="Descrizione"></textarea>
          </div>
          
          <div class="form-group">
            <label>Tag</label>
            <select v-model="eventForm.tag">
              <option value="">Seleziona tag</option>
              <option v-for="tag in tags" :key="tag.id" :value="tag.id">
                {{ tag.name }}
              </option>
            </select>
          </div>
          
          <div class="modal-buttons">
            <button @click="saveEvent">Salva</button>
            <button v-if="editingEventId" @click="deleteEvent" class="delete-btn">Elimina</button>
          </div>
        </div>
      </div>
    </div>

    <div v-show="showTagModal" class="modal">
      <div class="modal-content">
        <div class="modal-inner">
          <span @click="closeTagModal" class="close">&times;</span>
          <h3>{{ editingTagId ? 'Modifica Tag' : 'Aggiungi Tag' }}</h3>
          
          <input v-model="tagForm.name" type="text" placeholder="Nome tag">
          
          <div class="custom-color-picker">
            <div class="color-grid">
              <div 
                v-for="color in colorOptions" 
                :key="color"
                :class="['color-option', { selected: tagForm.color === color }]"
                :style="{ background: color }"
                @click="selectColor(color)"
              ></div>
            </div>
            <input v-model="tagForm.color" type="color">
          </div>
          
          <button @click="saveTag" class="modal-save-btn">Salva</button>
        </div>
      </div>
    </div>

    <div v-show="showConfirmModal" class="modal">
      <div class="modal-content confirm-modal">
        <div class="modal-inner">
          <h3>{{ confirmModal.title }}</h3>
          <p>{{ confirmModal.message }}</p>
          <div class="modal-buttons">
            <button @click="confirmAction" class="confirm-btn">Sì</button>
            <button @click="closeConfirmModal" class="cancel-btn">No</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import NotificationBell from './NotificationBell.vue'
import type { Tag, Event, EventForm, TagForm, ConfirmModal } from '../types/calendar'

const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const colorOptions = ['#0d4853', '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', 
                      '#e91e63', '#ff5722', '#795548', '#607d8b', '#ffc107', '#4caf50']

const currentDate = new Date()
const displayMonth = ref(currentDate.getMonth())
const displayYear = ref(currentDate.getFullYear())
const currentView = ref('month')
const selectedDay = ref(currentDate.getDate())

const tags = ref<Tag[]>([])
const events = ref<{ [key: string]: Event[] }>({})
const tagsVisible = ref(true)

const showEventModal = ref(false)
const showTagModal = ref(false)
const showConfirmModal = ref(false)

const eventForm = ref<EventForm>({
  title: '',
  datetime: '',
  endDatetime: '',
  type: 'evento',
  description: '',
  tag: '',
  allDay: false
})

const tagForm = ref<TagForm>({
  name: '',
  color: '#0d4853'
})

const editingEventId = ref<number | null>(null)
const editingTagId = ref<number | null>(null)

const confirmModal = ref<ConfirmModal>({
  title: '',
  message: '',
  callback: null
})

const tagIdCounter = ref(1)
const eventIdCounter = ref(1)

const TAGS_KEY = 'calendar_tags'
const EVENTS_KEY = 'calendar_events'

const loadData = () => {
  const savedTags = localStorage.getItem(TAGS_KEY)
  const savedEvents = localStorage.getItem(EVENTS_KEY)
  
  if (savedTags) {
    const data = JSON.parse(savedTags)
    tags.value = data.tags
    tagIdCounter.value = data.nextId
  }
  
  if (savedEvents) {
    const data = JSON.parse(savedEvents)
    events.value = data.events
    eventIdCounter.value = data.nextId
  }
}

const saveData = () => {
  localStorage.setItem(TAGS_KEY, JSON.stringify({
    tags: tags.value,
    nextId: tagIdCounter.value
  }))
  
  localStorage.setItem(EVENTS_KEY, JSON.stringify({
    events: events.value,
    nextId: eventIdCounter.value
  }))
}

const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(displayYear.value, displayMonth.value, 1)
  const lastDay = new Date(displayYear.value, displayMonth.value + 1, 0)
  const prevLastDay = new Date(displayYear.value, displayMonth.value, 0)
  
  const firstDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const lastDayDate = lastDay.getDate()
  const prevLastDayDate = prevLastDay.getDate()
  
  const prevMonth = displayMonth.value === 0 ? 11 : displayMonth.value - 1
  const prevYear = displayMonth.value === 0 ? displayYear.value - 1 : displayYear.value
  
  for (let i = firstDayIndex; i > 0; i--) {
    const dayDate = prevLastDayDate - i + 1
    const dateKey = `${prevYear}-${prevMonth + 1}-${dayDate}`
    const dayEvents = events.value[dateKey] || []
    const validEvents = dayEvents.filter(event => {
      const tag = tags.value.find(t => t.id === event.tag)
      return !event.tag || (tag && tag.visible)
    })
    
    days.push({
      date: dayDate,
      actualMonth: prevMonth,
      actualYear: prevYear,
      otherMonth: true,
      isToday: false,
      hasEvents: validEvents.length > 0,
      events: validEvents,
      dateKey,
      key: `prev-${dayDate}`
    })
  }
  
  for (let i = 1; i <= lastDayDate; i++) {
    const dateKey = `${displayYear.value}-${displayMonth.value + 1}-${i}`
    const dayEvents = events.value[dateKey] || []
    const validEvents = dayEvents.filter(event => {
      const tag = tags.value.find(t => t.id === event.tag)
      return !event.tag || (tag && tag.visible)
    })
    
    days.push({
      date: i,
      actualMonth: displayMonth.value,
      actualYear: displayYear.value,
      otherMonth: false,
      isToday: i === currentDate.getDate() && 
               displayMonth.value === currentDate.getMonth() && 
               displayYear.value === currentDate.getFullYear(),
      hasEvents: validEvents.length > 0,
      events: validEvents,
      dateKey,
      key: `current-${i}`
    })
  }
  
  const totalCells = days.length
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
  const nextMonth = displayMonth.value === 11 ? 0 : displayMonth.value + 1
  const nextYear = displayMonth.value === 11 ? displayYear.value + 1 : displayYear.value
  
  for (let i = 1; i <= remainingCells; i++) {
    const dateKey = `${nextYear}-${nextMonth + 1}-${i}`
    const dayEvents = events.value[dateKey] || []
    const validEvents = dayEvents.filter(event => {
      const tag = tags.value.find(t => t.id === event.tag)
      return !event.tag || (tag && tag.visible)
    })
    
    days.push({
      date: i,
      actualMonth: nextMonth,
      actualYear: nextYear,
      otherMonth: true,
      isToday: false,
      hasEvents: validEvents.length > 0,
      events: validEvents,
      dateKey,
      key: `next-${i}`
    })
  }
  
  return days
})

const todayEvents = computed(() => {
  const today = new Date()
  const todayDateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  const todayEventsList: any[] = []
  const addedEventIds = new Set()
  
  for (const dateKey in events.value) {
    const dayEvents = events.value[dateKey];
    if (!dayEvents) continue;
    
    dayEvents.forEach(event => {
      if (addedEventIds.has(event.id)) return
      
      const eventStart = new Date(event.datetime)
      const eventEnd = event.endDatetime ? new Date(event.endDatetime) : eventStart
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
      
      if ((eventStart <= endOfToday && eventEnd >= startOfToday)) {
        const tag = tags.value.find(t => t.id === event.tag)
        if (!event.tag || (tag && tag.visible)) {
          todayEventsList.push({
            ...event,
            displayTitle: getEventDisplayTitle(event, todayDateKey),
            dateKey: todayDateKey
          })
          addedEventIds.add(event.id)
        }
      }
    })
  }
  
  return todayEventsList
})

const weekEvents = computed(() => {
  const today = new Date()
  const weekEventsList: any[] = []
  const addedEventIds = new Set()
  
  for (let i = 1; i <= 6; i++) {
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + i)
    const targetDateKey = `${targetDate.getFullYear()}-${targetDate.getMonth() + 1}-${targetDate.getDate()}`
    
    for (const dateKey in events.value) {
      const dayEvents = events.value[dateKey];
      if (!dayEvents) continue;
      
      dayEvents.forEach(event => {
        if (addedEventIds.has(`${event.id}-${targetDateKey}`)) return
        
        const eventStart = new Date(event.datetime)
        const eventEnd = event.endDatetime ? new Date(event.endDatetime) : eventStart
        const startOfTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
        const endOfTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59)
        
        if ((eventStart <= endOfTarget && eventEnd >= startOfTarget)) {
          const tag = tags.value.find(t => t.id === event.tag)
          if (!event.tag || (tag && tag.visible)) {
            const eventTime = event.allDay ? 'Tutto il giorno' : eventStart.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
            
            const monthIndex = targetDate.getMonth();
            const monthName = months[monthIndex] || 'Gen';
            
            weekEventsList.push({
              id: event.id,
              title: getEventDisplayTitle(event, targetDateKey),
              time: eventTime,
              type: event.type,
              date: targetDate.getDate(),
              month: monthName.slice(0, 3),
              dateKey: targetDateKey,
              tag: event.tag
            })
            
            addedEventIds.add(`${event.id}-${targetDateKey}`)
          }
        }
      })
    }
  }
  
  return weekEventsList
})

const weekViewDays = computed(() => {
  const today = new Date(displayYear.value, displayMonth.value, selectedDay.value)
  const startOfWeek = new Date(today)
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  
  const days = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    const dateKey = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`
    const dayEvents = events.value[dateKey] || []
    const validEvents = dayEvents.filter(event => {
      const tag = tags.value.find(t => t.id === event.tag)
      return !event.tag || (tag && tag.visible)
    })
    
    days.push({
      date: day.getDate(),
      month: day.getMonth(),
      year: day.getFullYear(),
      dayName: weekdays[i],
      dateKey,
      events: validEvents
    })
  }
  return days
})

const selectedDayName = computed(() => {
  const date = new Date(displayYear.value, displayMonth.value, selectedDay.value)
  const dayIndex = date.getDay()
  return weekdays[dayIndex === 0 ? 6 : dayIndex - 1]
})

const selectedDayDateKey = computed(() => {
  return `${displayYear.value}-${displayMonth.value + 1}-${selectedDay.value}`
})



const prevMonth = () => {
  displayMonth.value--
  if (displayMonth.value < 0) {
    displayMonth.value = 11
    displayYear.value--
  }
}

const nextMonth = () => {
  displayMonth.value++
  if (displayMonth.value > 11) {
    displayMonth.value = 0
    displayYear.value++
  }
}

const prevDay = () => {
  const currentDate = new Date(displayYear.value, displayMonth.value, selectedDay.value)
  currentDate.setDate(currentDate.getDate() - 1)
  selectedDay.value = currentDate.getDate()
  displayMonth.value = currentDate.getMonth()
  displayYear.value = currentDate.getFullYear()
}

const nextDay = () => {
  const currentDate = new Date(displayYear.value, displayMonth.value, selectedDay.value)
  currentDate.setDate(currentDate.getDate() + 1)
  selectedDay.value = currentDate.getDate()
  displayMonth.value = currentDate.getMonth()
  displayYear.value = currentDate.getFullYear()
}

const prevWeek = () => {
  const currentDate = new Date(displayYear.value, displayMonth.value, selectedDay.value)
  currentDate.setDate(currentDate.getDate() - 7)
  selectedDay.value = currentDate.getDate()
  displayMonth.value = currentDate.getMonth()
  displayYear.value = currentDate.getFullYear()
}

const nextWeek = () => {
  const currentDate = new Date(displayYear.value, displayMonth.value, selectedDay.value)
  currentDate.setDate(currentDate.getDate() + 7)
  selectedDay.value = currentDate.getDate()
  displayMonth.value = currentDate.getMonth()
  displayYear.value = currentDate.getFullYear()
}

const toggleTagsVisibility = () => {
  tagsVisible.value = !tagsVisible.value
}

const toggleTag = (tagId: number) => {
  const tag = tags.value.find(t => t.id === tagId)
  if (tag) {
    tag.visible = !tag.visible
    saveData()
  }
}

const openTagModal = () => {
  editingTagId.value = null
  tagForm.value = { name: '', color: '#0d4853' }
  showTagModal.value = true
}

const closeTagModal = () => {
  showTagModal.value = false
}

const editTag = (tagId: number) => {
  const tag = tags.value.find(t => t.id === tagId)
  if (!tag) return
  
  editingTagId.value = tagId
  tagForm.value = { name: tag.name, color: tag.color }
  showTagModal.value = true
}

const saveTag = () => {
  if (!tagForm.value.name.trim()) return
  
  if (editingTagId.value) {
    const tag = tags.value.find(t => t.id === editingTagId.value)
    if (tag) {
      tag.name = tagForm.value.name
      tag.color = tagForm.value.color
    }
  } else {
    tags.value.push({
      id: tagIdCounter.value++,
      name: tagForm.value.name,
      color: tagForm.value.color,
      visible: true
    })
  }
  
  saveData()
  closeTagModal()
}

const deleteTag = (tagId: number) => {
  showConfirm('Elimina tag', 'Sei sicuro di voler eliminare questo tag?', () => {
    for (const dateKey in events.value) {
      const dayEvents = events.value[dateKey];
      if (!dayEvents) continue;
      
      events.value[dateKey] = dayEvents.filter(event => event.tag !== tagId)
      if (events.value[dateKey].length === 0) {
        delete events.value[dateKey]
      }
    }
    
    tags.value = tags.value.filter(t => t.id !== tagId)
    saveData()
  })
}

const selectColor = (color: string) => {
  tagForm.value.color = color
}

const openEventModal = (day: number, month: number, year: number, hour = 9) => {
  editingEventId.value = null
  selectedDay.value = day
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const timeStr = `${String(hour).padStart(2, '0')}:00`
  
  eventForm.value = {
    title: '',
    datetime: `${dateStr}T${timeStr}`,
    endDatetime: `${dateStr}T${String(hour + 1).padStart(2, '0')}:00`,
    type: 'evento',
    description: '',
    tag: '',
    allDay: false
  }
  
  showEventModal.value = true
  
  setTimeout(() => {
    const startInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement
    const endInput = document.querySelectorAll('input[type="datetime-local"]')[1] as HTMLInputElement
    if (startInput) startInput.value = `${dateStr}T${timeStr}`
    if (endInput) endInput.value = `${dateStr}T${String(hour + 1).padStart(2, '0')}:00`
  }, 10)
}

const closeEventModal = () => {
  showEventModal.value = false
}

const editEvent = (dateKey: string, eventId: number) => {
  const event = events.value[dateKey]?.find(e => e.id === eventId)
  if (!event) return
  
  editingEventId.value = eventId
  eventForm.value = {
    title: event.title,
    datetime: event.datetime,
    endDatetime: event.endDatetime || '',
    type: event.type,
    description: event.description,
    tag: event.tag?.toString() || '',
    allDay: event.allDay
  }
  
  showEventModal.value = true
}

const saveEvent = () => {
  if (!eventForm.value.datetime) return
  
  const startDate = new Date(eventForm.value.datetime)
  const endDate = eventForm.value.endDatetime ? new Date(eventForm.value.endDatetime) : startDate
  
  const newEvent: Event = {
    id: editingEventId.value || eventIdCounter.value++,
    title: eventForm.value.title || 'Evento senza titolo',
    datetime: eventForm.value.datetime,
    endDatetime: eventForm.value.endDatetime || undefined,
    type: eventForm.value.type,
    description: eventForm.value.description,
    tag: eventForm.value.tag ? Number(eventForm.value.tag) : undefined,
    allDay: eventForm.value.allDay
  }
  
  if (editingEventId.value) {
    for (const dateKey in events.value) {
      const dayEvents = events.value[dateKey];
      if (!dayEvents) continue;
      
      events.value[dateKey] = dayEvents.filter(e => e.id !== editingEventId.value)
      if (events.value[dateKey].length === 0) {
        delete events.value[dateKey]
      }
    }
  }
  
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`
    
    if (!events.value[dateKey]) {
      events.value[dateKey] = []
    }
    
    events.value[dateKey].push(newEvent)
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  saveData()
  closeEventModal()
}

const deleteEvent = () => {
  if (!editingEventId.value) return
  
  showConfirm('Elimina evento', 'Sei sicuro di voler eliminare questo evento?', () => {
    if (editingEventId.value) {
      for (const dateKey in events.value) {
        const dayEvents = events.value[dateKey];
        if (!dayEvents) continue;
        
        events.value[dateKey] = dayEvents.filter(e => e.id !== editingEventId.value)
        if (events.value[dateKey].length === 0) {
          delete events.value[dateKey]
        }
      }
      saveData()
    }
    closeEventModal()
  })
}

const showConfirm = (title: string, message: string, callback: () => void) => {
  confirmModal.value = { title, message, callback }
  showConfirmModal.value = true
}

const confirmAction = () => {
  if (confirmModal.value.callback) {
    confirmModal.value.callback()
  }
  closeConfirmModal()
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
  confirmModal.value.callback = null
}

const getEventColor = (tagId?: number): string => {
  if (!tagId) return '#0d4853'
  const tag = tags.value.find(t => t.id === tagId)
  return tag?.visible ? tag.color : '#0d4853'
}

const getEventDisplayTitle = (event: Event, currentDateKey: string): string => {
  if (!event.endDatetime) return event.title
  
  const startDate = new Date(event.datetime)
  const endDate = new Date(event.endDatetime)
  const startDateKey = `${startDate.getFullYear()}-${startDate.getMonth() + 1}-${startDate.getDate()}`
  const endDateKey = `${endDate.getFullYear()}-${endDate.getMonth() + 1}-${endDate.getDate()}`
  
  if (startDateKey === endDateKey) return event.title
  
  if (currentDateKey === startDateKey) return `Inizio (${event.title})`
  if (currentDateKey === endDateKey) return `Fine (${event.title})`
  return event.title
}

const formatEventTime = (event: any): string => {
  return event.allDay ? 'Tutto il giorno' : new Date(event.datetime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

const getEventsForHour = (hour: number): Event[] => {
  const dayEvents = events.value[selectedDayDateKey.value] || []
  return dayEvents.filter(event => {
    if (event.allDay) return false
    const eventHour = new Date(event.datetime).getHours()
    return eventHour === hour
  }).filter(event => {
    const tag = tags.value.find(t => t.id === event.tag)
    return !event.tag || (tag?.visible)
  })
}

const getAllDayEvents = (): Event[] => {
  const dayEvents = events.value[selectedDayDateKey.value] || []
  return dayEvents.filter(event => event.allDay).filter(event => {
    const tag = tags.value.find(t => t.id === event.tag)
    return !event.tag || (tag?.visible)
  })
}

const deleteEventFromSidebar = (eventId: number) => {
  showConfirm('Elimina evento', 'Sei sicuro di voler eliminare questo evento?', () => {
    for (const key in events.value) {
      const dayEvents = events.value[key];
      if (!dayEvents) continue;
      
      events.value[key] = dayEvents.filter(e => e.id !== eventId)
      if (events.value[key].length === 0) {
        delete events.value[key]
      }
    }
    saveData()
  })
}

const getWeekEventsForHour = (dateKey: string, hour: number): Event[] => {
  const dayEvents = events.value[dateKey] || []
  return dayEvents.filter(event => {
    if (event.allDay) return false
    const eventHour = new Date(event.datetime).getHours()
    return eventHour === hour
  }).filter(event => {
    const tag = tags.value.find(t => t.id === event.tag)
    return !event.tag || (tag?.visible)
  })
}

const getWeekAllDayEvents = (dateKey: string): Event[] => {
  const dayEvents = events.value[dateKey] || []
  return dayEvents.filter(event => event.allDay).filter(event => {
    const tag = tags.value.find(t => t.id === event.tag)
    return !event.tag || (tag?.visible)
  })
}

watch(() => eventForm.value.allDay, (newVal) => {
  setTimeout(() => {
    if (newVal) {
      if (eventForm.value.datetime) {
        const originalDate = eventForm.value.datetime.includes('T') 
          ? eventForm.value.datetime.split('T')[0] 
          : eventForm.value.datetime
        eventForm.value.datetime = originalDate || ''
        
        const startInput = document.querySelector('input[type="date"]') as HTMLInputElement | null
        if (startInput && originalDate) startInput.value = originalDate
      }
      if (eventForm.value.endDatetime) {
        const originalDate = eventForm.value.endDatetime.includes('T') 
          ? eventForm.value.endDatetime.split('T')[0] 
          : eventForm.value.endDatetime
        eventForm.value.endDatetime = originalDate || ''
        
        const endInput = document.querySelectorAll('input[type="date"]')[1] as HTMLInputElement | null
        if (endInput && originalDate) endInput.value = originalDate
      }
    } else {
      if (eventForm.value.datetime && !eventForm.value.datetime.includes('T')) {
        const newDateTime = `${eventForm.value.datetime}T09:00`
        eventForm.value.datetime = newDateTime
        
        const startInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement | null
        if (startInput) startInput.value = newDateTime
      }
      if (eventForm.value.endDatetime && !eventForm.value.endDatetime.includes('T')) {
        const newDateTime = `${eventForm.value.endDatetime}T10:00`
        eventForm.value.endDatetime = newDateTime
        
        const endInput = document.querySelectorAll('input[type="datetime-local"]')[1] as HTMLInputElement | null
        if (endInput) endInput.value = newDateTime
      }
    }
  }, 10)
})

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (showEventModal.value) {
      closeEventModal()
      event.preventDefault()
    }
    if (showTagModal.value) {
      closeTagModal()
      event.preventDefault()
    }
    if (showConfirmModal.value) {
      closeConfirmModal()
      event.preventDefault()
    }
  }
  if (event.key === 'Enter' && !event.shiftKey) {
    if (showEventModal.value) {
      saveEvent()
      event.preventDefault()
    }
    if (showTagModal.value) {
      saveTag()
      event.preventDefault()
    }
    if (showConfirmModal.value) {
      confirmAction()
      event.preventDefault()
    }
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (showEventModal.value && target.closest('.modal') && !target.closest('.modal-content')) {
    closeEventModal()
  }
  if (showTagModal.value && target.closest('.modal') && !target.closest('.modal-content')) {
    closeTagModal()
  }
  if (showConfirmModal.value && target.closest('.modal') && !target.closest('.modal-content')) {
    closeConfirmModal()
  }
}

onMounted(() => {
  loadData()
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleClickOutside)
  document.body.classList.add('no-scroll')
  window.scrollTo(0, 0)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleClickOutside)
  document.body.classList.remove('no-scroll')
})
</script>