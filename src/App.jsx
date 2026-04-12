import { useCallback, useEffect, useRef, useState } from 'react'
import Chapter1 from './components/Chapter1.jsx'
import './App.css'

const AUDIO_SRC = '/hearth-new/audio/leberch-ambient.mp3'
const AUDIO_FADE_MS = 6000

export default function App() {
  const [phase, setPhase] = useState('forest')
  const [chapterKey, setChapterKey] = useState(0)
  const audioRef = useRef(null)
  const fadeRafRef = useRef(0)

  useEffect(() => {
    return () => {
      cancelAnimationFrame(fadeRafRef.current)
    }
  }, [])

  const handleEnter = useCallback(() => {
    setPhase('chapter1')
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

  const handleChapterExit = useCallback(() => {
    setPhase('forest')
    setChapterKey((k) => k + 1)
  }, [])

  return (
    <div className="scene">
      <audio ref={audioRef} src={AUDIO_SRC} preload="auto" loop />
      {phase === 'forest' && (
        <>
          <div className="forest-bg" aria-hidden="true" />
          <div className="fog fog-1" aria-hidden="true" />
          <div className="fog fog-2" aria-hidden="true" />
          <div className="fog fog-3" aria-hidden="true" />
          <div className="dark-overlay" aria-hidden="true" />
          <div className="vignette" aria-hidden="true" />
          <div className="content">
            <h1 className="title">Hearth</h1>
            <button type="button" className="enter-btn" onClick={handleEnter}>
              Enter
            </button>
          </div>
        </>
      )}
      {phase === 'chapter1' && (
        <Chapter1 key={chapterKey} onExit={handleChapterExit} />
      )}
    </div>
  )
}
