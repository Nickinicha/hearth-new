import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const AUDIO_SRC = '/hearth-new/audio/leberch-ambient.mp3'
const AUDIO_FADE_MS = 6000

export default function App() {
  const [entered, setEntered] = useState(false)
  const audioRef = useRef(null)
  const fadeRafRef = useRef(0)

  useEffect(() => {
    return () => {
      cancelAnimationFrame(fadeRafRef.current)
    }
  }, [])

  const handleEnter = useCallback(() => {
    setEntered(true)
    const audio = audioRef.current
    if (!audio) return

    audio.loop = true
    audio.volume = 0

    const play = audio.play()
    if (play !== undefined) {
      play.catch(() => {})
    }

    const start = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - start) / AUDIO_FADE_MS)
      audio.volume = t
      if (t < 1) {
        fadeRafRef.current = requestAnimationFrame(step)
      }
    }
    fadeRafRef.current = requestAnimationFrame(step)
  }, [])

  return (
    <div className="scene">
      <audio ref={audioRef} src={AUDIO_SRC} preload="auto" loop />
      <div className="forest-bg" aria-hidden="true" />
      <div className="fog fog-1" aria-hidden="true" />
      <div className="fog fog-2" aria-hidden="true" />
      <div className="fog fog-3" aria-hidden="true" />
      <div className="dark-overlay" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="content">
        <h1 className="title">Hearth</h1>
        {!entered && (
          <button type="button" className="enter-btn" onClick={handleEnter}>
            Enter
          </button>
        )}
        {entered && (
          <p className="next-message">You are not alone</p>
        )}
      </div>
    </div>
  )
}
