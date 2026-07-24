export interface BookingService {
  id: string
  name: string
  description?: string
  price: number
  duration: string
}

export type BodyType = 'Sedan' | 'SUV' | 'Kombi' | 'Hatchback' | 'Coupe' | 'Cabrio' | 'Van'

export interface GuestInfo {
  name: string
  phone: string
  email?: string
}

export interface VehicleMetadata {
  carMake: string
  carModel: string
  bodyType: BodyType | ''
}

export interface BookingPayload {
  branchId?: string
  services: BookingService[]
  startAt: string // ISO string
  endAt?: string // ISO string
  metadata: VehicleMetadata
  guestInfo: GuestInfo
  notes: string
}

export const MOCK_SERVICES: BookingService[] = [
  {
    id: 'svc-ceramic',
    name: 'Powłoka Ceramiczna',
    description: 'Trwała ochrona lakieru z efektem hydrofobowym na 24 miesiące.',
    price: 1800,
    duration: '2 dni',
  },
  {
    id: 'svc-correction',
    name: 'Korekta Lakieru',
    description: 'Dwuetapowa polerowanie usuwające rysy i zarysowania.',
    price: 1200,
    duration: '1-2 dni',
  },
  {
    id: 'svc-interior',
    name: 'Pranie Wnętrza',
    description: 'Kompleksowe czyszczenie tapicerki, dywanów i podsufitki.',
    price: 650,
    duration: '6 godz.',
  },
  {
    id: 'svc-detailing',
    name: 'Detailing Kompletny',
    description: 'Pakiet: korekta lakieru, powłoka ceramiczna i pranie wnętrza.',
    price: 3200,
    duration: '3 dni',
  },
  {
    id: 'svc-wax',
    name: 'Woskowanie Lakieru',
    description: 'Nałożenie wosku premium dla głębokiego połysku i ochrony.',
    price: 350,
    duration: '3 godz.',
  },
  {
    id: 'svc-engine',
    name: 'Czyszczenie Komory Silnika',
    description: 'Bezpieczne czyszczenie silnika z użyciem chemii dedykowanej.',
    price: 280,
    duration: '2 godz.',
  },
]

export const CAR_MAKES = [
  'BMW',
  'Audi',
  'Mercedes-Benz',
  'Volkswagen',
  'Porsche',
  'Toyota',
  'Lexus',
  'Tesla',
  'Volvo',
  'Mazda',
  'Ford',
  'Skoda',
  'Inne',
]

export const BODY_TYPES: BodyType[] = [
  'Sedan',
  'SUV',
  'Kombi',
  'Hatchback',
  'Coupe',
  'Cabrio',
  'Van',
]

export const TIME_SLOTS = [
  '08:00',
  '09:30',
  '11:00',
  '12:30',
  '14:00',
  '15:30',
  '17:00',
  '18:30',
]
