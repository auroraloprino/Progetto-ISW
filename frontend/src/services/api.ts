import axios from 'axios'
import type { Event, Tag } from '../types/calendar'

const API_BASE = '/api'

export const calendarAPI = {
  // Events
  async getEvents(): Promise<Event[]> {
    const response = await axios.get(`${API_BASE}/calendario/events`)
    return response.data
  },

  async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    const response = await axios.post(`${API_BASE}/calendario/events`, event)
    return response.data
  },

  async updateEvent(id: number, event: Partial<Event>): Promise<Event> {
    const response = await axios.put(`${API_BASE}/calendario/events/${id}`, event)
    return response.data
  },

  async deleteEvent(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/calendario/events/${id}`)
  },

  // Tags
  async getTags(): Promise<Tag[]> {
    const response = await axios.get(`${API_BASE}/calendario/tags`)
    return response.data
  },

  async createTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    const response = await axios.post(`${API_BASE}/calendario/tags`, tag)
    return response.data
  },

  async updateTag(id: number, tag: Partial<Tag>): Promise<Tag> {
    const response = await axios.put(`${API_BASE}/calendario/tags/${id}`, tag)
    return response.data
  },

  async deleteTag(id: number): Promise<void> {
    await axios.delete(`${API_BASE}/calendario/tags/${id}`)
  }
}