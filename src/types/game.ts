import type { Component } from 'vue'

export interface PartyGame {
  id: string
  name: string
  eyebrow: string
  description: string
  minPlayers: number
  maxPlayers: number
  theme: string
  icon: Component
  routeName?: string
  available: boolean
  accent: string
}

export interface VersionedData<T> {
  version: number
  data: T
}

export interface SecretRoleCardData {
  title: string
  subtitle: string
  factionLabel: string
  tone: 'good' | 'evil' | 'neutral'
  description: string
  imageUrl: string
  imagePosition?: string
  imageAlt: string
}
