export interface SseMessage {
  event?: string
  retry?: number
  id?: string
  data: string
}
