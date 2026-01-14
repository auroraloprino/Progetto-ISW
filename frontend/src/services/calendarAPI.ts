import { api } from './api'
import type { Tag, Event, TagForm } from '../types/calendar'

export const calendarAPI = {
  async getTags(): Promise<{ tags: Tag[], nextId: number }> {
    const { data } = await api.get('/calendar/tags')
    return { tags: data, nextId: 0 }
  },

  async createTag(tagData: TagForm): Promise<Tag> {
    const { data } = await api.post('/calendar/tags', tagData)
    return data
  },

  async updateTag(id: string | number, tagData: Partial<TagForm> & { visible?: boolean }): Promise<Tag | null> {
    const { data } = await api.put(`/calendar/tags/${id}`, tagData)
    return data
  },

  async deleteTag(id: string | number): Promise<boolean> {
    await api.delete(`/calendar/tags/${id}`)
    return true
  },

  async getEvents(): Promise<{ events: { [key: string]: Event[] }, nextId: number }> {
    const { data } = await api.get('/calendar/events')
    const eventsByDate: { [key: string]: Event[] } = {}
    
    data.forEach((event: Event) => {
      const startDate = new Date(event.datetime)
      const endDate = event.endDatetime ? new Date(event.endDatetime) : startDate
      
      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`
        if (!eventsByDate[dateKey]) {
          eventsByDate[dateKey] = []
        }
        eventsByDate[dateKey].push(event)
        currentDate.setDate(currentDate.getDate() + 1)
      }
    })
    
    return { events: eventsByDate, nextId: 0 }
  },

  async createEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
    const { data } = await api.post('/calendar/events', eventData)
    return data
  },

  async updateEvent(id: string | number, eventData: Partial<Event>): Promise<Event | null> {
    const { data } = await api.put(`/calendar/events/${id}`, eventData)
    return data
  },

  async deleteEvent(id: string | number): Promise<boolean> {
    await api.delete(`/calendar/events/${id}`)
    return true
  }
}