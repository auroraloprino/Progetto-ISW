import type { Tag, Event, TagForm } from '../types/calendar'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const TAGS_KEY = 'calendar_tags'
const EVENTS_KEY = 'calendar_events'

export const calendarAPI = {
  async getTags(): Promise<{ tags: Tag[], nextId: number }> {
    try {
      const saved = localStorage.getItem(TAGS_KEY)
      return saved ? JSON.parse(saved) : { tags: [], nextId: 1 }
    } catch {
      return { tags: [], nextId: 1 }
    }
  },

  async createTag(tagData: TagForm): Promise<Tag> {
    const data = await this.getTags()
    const newTag: Tag = {
      id: data.nextId++,
      name: tagData.name,
      color: tagData.color,
      visible: true
    }
    data.tags.push(newTag)
    localStorage.setItem(TAGS_KEY, JSON.stringify(data))
    return newTag
  },

  async updateTag(id: number, tagData: Partial<TagForm>): Promise<Tag | null> {
    const data = await this.getTags()
    const tag = data.tags.find(t => t.id === id)
    if (!tag) return null
    
    Object.assign(tag, tagData)
    localStorage.setItem(TAGS_KEY, JSON.stringify(data))
    return tag
  },

  async deleteTag(id: number): Promise<boolean> {
    const data = await this.getTags()
    const index = data.tags.findIndex(t => t.id === id)
    if (index === -1) return false
    
    data.tags.splice(index, 1)
    localStorage.setItem(TAGS_KEY, JSON.stringify(data))
    return true
  },

  async getEvents(): Promise<{ events: { [key: string]: Event[] }, nextId: number }> {
    try {
      const saved = localStorage.getItem(EVENTS_KEY)
      return saved ? JSON.parse(saved) : { events: {}, nextId: 1 }
    } catch {
      return { events: {}, nextId: 1 }
    }
  },

  async createEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
    const data = await this.getEvents()
    const newEvent: Event = {
      ...eventData,
      id: data.nextId++
    }
    
    const startDate = new Date(eventData.datetime)
    const endDate = eventData.endDatetime ? new Date(eventData.endDatetime) : startDate
    
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`
      
      if (!data.events[dateKey]) {
        data.events[dateKey] = []
      }
      
      data.events[dateKey].push(newEvent)
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    localStorage.setItem(EVENTS_KEY, JSON.stringify(data))
    return newEvent
  },

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | null> {
    const data = await this.getEvents()
    let foundEvent: Event | null = null
    
    for (const dateKey in data.events) {
      const events = data.events[dateKey]
      const eventIndex = events.findIndex(e => e.id === id)
      if (eventIndex !== -1) {
        foundEvent = events[eventIndex]
        data.events[dateKey] = events.filter(e => e.id !== id)
        if (data.events[dateKey].length === 0) {
          delete data.events[dateKey]
        }
        break
      }
    }
    
    if (!foundEvent) return null
    
    const updatedEvent = { ...foundEvent, ...eventData }
    
    const startDate = new Date(updatedEvent.datetime)
    const endDate = updatedEvent.endDatetime ? new Date(updatedEvent.endDatetime) : startDate
    
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`
      
      if (!data.events[dateKey]) {
        data.events[dateKey] = []
      }
      
      data.events[dateKey].push(updatedEvent)
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    localStorage.setItem(EVENTS_KEY, JSON.stringify(data))
    return updatedEvent
  },

  async deleteEvent(id: number): Promise<boolean> {
    const data = await this.getEvents()
    let found = false
    
    for (const dateKey in data.events) {
      const events = data.events[dateKey]
      const filteredEvents = events.filter(e => e.id !== id)
      if (filteredEvents.length !== events.length) {
        found = true
        if (filteredEvents.length === 0) {
          delete data.events[dateKey]
        } else {
          data.events[dateKey] = filteredEvents
        }
      }
    }
    
    if (found) {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(data))
    }
    
    return found
  }
}