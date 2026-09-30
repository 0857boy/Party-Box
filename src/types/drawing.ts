export interface DrawingPoint {
  x: number
  y: number
}

export interface DrawingStroke {
  id: string
  playerId: string
  color: string
  points: DrawingPoint[]
}
