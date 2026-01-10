export interface Tag {
  id: number
  name: string
  color: string
  visible: boolean
}

export interface Event {
  id: number
  title: string
  datetime: string
  endDatetime?: string
  type: string
  description: string
  tag?: number
  allDay: boolean
}

export interface EventForm {
  title: string
  datetime: string
  endDatetime: string
  type: string
  description: string
  tag: number | string
  allDay: boolean
}

export interface TagForm {
  name: string
  color: string
}

export interface ConfirmModal {
  title: string
  message: string
  callback: (() => void) | null
}