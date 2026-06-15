export type Reservation = {
  id?: string
  name: string
  phone: string
  email?: string
  date: string
  time: string
  guests: number
  comment?: string
  status?: 'pending' | 'confirmed' | 'cancelled'
  createdAt?: string
}