import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { calendarAPI } from '../services/calendarAPI'
import type { Tag, Event, EventForm, TagForm } from '../types/calendar'

export function useCalendar() {
  const tags = ref<Tag[]>([])
  const events = ref<{ [key: string]: Event[] }>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const tagIdCounter = ref(1)
  const eventIdCounter = ref(1)

  const loadTags = async () => {
    try {
      loading.value = true
      const data = await calendarAPI.getTags()
      tags.value = data.tags
      tagIdCounter.value = data.nextId
    } catch (err) {
      error.value = 'Failed to load tags'
      console.error('Error loading tags:', err)
    } finally {
      loading.value = false
    }
  }

  const loadEvents = async () => {
    try {
      loading.value = true
      const data = await calendarAPI.getEvents()
      events.value = data.events
      eventIdCounter.value = data.nextId
    } catch (err) {
      error.value = 'Failed to load events'
      console.error('Error loading events:', err)
    } finally {
      loading.value = false
    }
  }

  const createTag = async (tagData: TagForm) => {
    try {
      const newTag = await calendarAPI.createTag(tagData)
      tags.value.push(newTag)
      tagIdCounter.value++
      return newTag
    } catch (err) {
      error.value = 'Failed to create tag'
      console.error('Error creating tag:', err)
      throw err
    }
  }

  const updateTag = async (id: string, tagData: Partial<TagForm> & { visible?: boolean }) => {
    try {
      const updatedTag = await calendarAPI.updateTag(id, tagData)
      if (updatedTag) {
        const index = tags.value.findIndex(t => t.id === id)
        if (index !== -1) {
          tags.value[index] = updatedTag
        }
      }
      return updatedTag
    } catch (err) {
      error.value = 'Failed to update tag'
      console.error('Error updating tag:', err)
      throw err
    }
  }

  const deleteTag = async (id: string) => {
    try {
      const success = await calendarAPI.deleteTag(id)
      if (success) {
        tags.value = tags.value.filter(t => t.id !== id)
        
        for (const dateKey in events.value) {
          events.value[dateKey] = events.value[dateKey].filter(event => event.tag !== id)
          if (events.value[dateKey].length === 0) {
            delete events.value[dateKey]
          }
        }
      }
      return success
    } catch (err) {
      error.value = 'Failed to delete tag'
      console.error('Error deleting tag:', err)
      throw err
    }
  }

  const createEvent = async (eventData: EventForm) => {
    try {
      const newEvent: Omit<Event, 'id'> = {
        title: eventData.title || 'Evento senza titolo',
        datetime: eventData.datetime,
        endDatetime: eventData.endDatetime || undefined,
        type: eventData.type,
        description: eventData.description,
        tag: eventData.tag ? String(eventData.tag) : undefined,
        allDay: eventData.allDay
      }
      
      const createdEvent = await calendarAPI.createEvent(newEvent)
      
      const startDate = new Date(eventData.datetime)
      const endDate = eventData.endDatetime ? new Date(eventData.endDatetime) : startDate
      
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`
        
        if (!events.value[dateKey]) {
          events.value[dateKey] = []
        }
        
        events.value[dateKey].push(createdEvent)
        currentDate.setDate(currentDate.getDate() + 1)
      }
      
      eventIdCounter.value++
      return createdEvent
    } catch (err) {
      error.value = 'Failed to create event'
      console.error('Error creating event:', err)
      throw err
    }
  }

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    try {
      for (const dateKey in events.value) {
        events.value[dateKey] = events.value[dateKey].filter(e => e.id !== id)
        if (events.value[dateKey].length === 0) {
          delete events.value[dateKey]
        }
      }
      
      const updatedEvent = await calendarAPI.updateEvent(id, eventData)
      
      if (updatedEvent) {
        const startDate = new Date(updatedEvent.datetime)
        const endDate = updatedEvent.endDatetime ? new Date(updatedEvent.endDatetime) : startDate
        
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`
          
          if (!events.value[dateKey]) {
            events.value[dateKey] = []
          }
          
          events.value[dateKey].push(updatedEvent)
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
      
      return updatedEvent
    } catch (err) {
      error.value = 'Failed to update event'
      console.error('Error updating event:', err)
      throw err
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      const success = await calendarAPI.deleteEvent(id)
      
      if (success) {
        for (const dateKey in events.value) {
          events.value[dateKey] = events.value[dateKey].filter(e => e.id !== id)
          if (events.value[dateKey].length === 0) {
            delete events.value[dateKey]
          }
        }
      }
      
      return success
    } catch (err) {
      error.value = 'Failed to delete event'
      console.error('Error deleting event:', err)
      throw err
    }
  }

  const toggleTagVisibility = async (id: string) => {
    const tag = tags.value.find(t => t.id === id)
    if (tag) {
      await updateTag(id, { visible: !tag.visible })
    }
  }

  const getTagById = (id?: string): Tag | undefined => {
    if (!id) return undefined
    return tags.value.find(t => t.id === id)
  }

  const initialize = async () => {
    await Promise.all([loadTags(), loadEvents()])
  }

  let refreshInterval: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    initialize()
    refreshInterval = setInterval(() => {
      loadTags()
      loadEvents()
    }, 5000)
  })

  onUnmounted(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
  })

  return {
    tags: computed(() => tags.value),
    events: computed(() => events.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    createTag,
    updateTag,
    deleteTag,
    toggleTagVisibility,
    
    createEvent,
    updateEvent,
    deleteEvent,
    
    getTagById,
    initialize,
    
    tagIdCounter: computed(() => tagIdCounter.value),
    eventIdCounter: computed(() => eventIdCounter.value)
  }
}