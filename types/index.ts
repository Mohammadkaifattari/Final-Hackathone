// All shared types for the hackathon skeleton live here.

export interface AppUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
  provider?: string
}

export interface NoteType {
  _id: string
  title: string
  content: string
  userId: string
  createdAt: string
  updatedAt: string
}

// Generic API response wrapper used by test pages.
export interface ApiResult<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

// Result shape returned by the live status ping routes on the dashboard.
export interface PingResult {
  service: string
  ok: boolean
  detail?: string
}

// Cloudinary upload result surfaced to the client.
export interface CloudinaryUpload {
  url: string
  publicId: string
}

// A single realtime message used by the Pusher test page.
export interface RealtimeMessage {
  id: string
  text: string
  at: string
}
