import { useCallback, useEffect, useRef, useState } from 'react'
import Chapter1 from './components/Chapter1.jsx'
import './App.css'

const INTRO_SRC = '/hearth-new/audio/leberch-ambient.mp3'
const CHAPTER_SRC = '/hearth-new/audio/ambient-ch1.mp3'
const CROSSFADE_MS = 2000
const INTRO_VOL = 0.4
const CHAPTER_VOL = 0.4

export default function App() {
  const [phase, setPhase] = useState('forest')
  const [chapterKey, setChapterKey] = useState(0)
  const introRef = useRef(null)
  const chapterRef = useRef(null)
  const rafRef = useRef(0)

  const cancelRaf = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    return () => cancelRaf()
  }, [cancelRaf])

  const fadeVolume = useCallback(
    (audio, from, to, durationMs, onDone) => {
      if (!audio) return
      audio.volume = from
      const t0 = performance.now()
      const tick = (now) => {
        const u = Math.min(1, (now - t0) / durationMs)
        audio.volume = from + (to - from) * u
        if (u < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          onDone?.()
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    []
  )

  const handleEnter = useCallback(() => {
    cancelRaf()
    setPhase('chapter1')

    const intro = introRef.current
    const chapter = chapterRef.current
    if (!intro || !chapter) return

    intro.loop = true
    chapter.loop = true

    chapter.pause()
    chapter.currentTime = 0
    chapter.volume = 0

    intro.volume = INTRO_VOL
    const p = intro.play()
    if (p !== undefined) p.catch(() => {})

    fadeVolume(intro, INTRO_VOL, 0, CROSSFADE_MS, () => {
      intro.pause()
      intro.currentTime = 0

      const cp = chapter.play()
      if (cp !== undefined) cp.catch(() => {})
      fadeVolume(chapter, 0, CHAPTER_VOL, CROSSFADE_MS)
    })
  }, [cancelRaf, fadeVolume])

  const handleChapterExit = useCallback(() => {
    cancelRaf()

    const intro = introRef.current
    const chapter = chapterRef.current
    if (!intro || !chapter) {
      setPhase('forest')
      setChapterKey((k) => k + 1)
      return
    }

    const chStart = chapter.volume

    setPhase('forest')
    setChapterKey((k) => k + 1)

    fadeVolume(chapter, chStart, 0, CROSSFADE_MS, () => {
      chapter.pause()
      chapter.currentTime = 0

      intro.volume = 0
      const ip = intro.play()
      if (ip !== undefined) ip.catch(() => {})
      fadeVolume(intro, 0, INTRO_VOL, CROSSFADE_MS)
    })
  }, [cancelRaf, fadeVolume])

  return (
    <div className="scene">
      <audio ref={introRef} src={INTRO_SRC} preload="auto" loop />
      <audio ref={chapterRef} src={CHAPTER_SRC} preload="auto" loop />
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
