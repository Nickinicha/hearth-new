import { createContext, useContext } from 'react'

export const AppAudioContext = createContext(null)

export function useAppAudio() {
  return useContext(AppAudioContext)
}
