export interface Tag {
  id: string
  name: string
  color: string
  visible: boolean
  ownerId: string
  sharedWith: { userId: string; role: string }[]
}

export interface Event {
  id: string
  title: string
  datetime: string
  endDatetime?: string
  type: string
  description: string
  tag?: string
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