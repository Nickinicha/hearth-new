import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppAudioContext } from './context/AppAudioContext.jsx'
import Chapter1 from './components/Chapter1.jsx'
import Chapter2 from './components/Chapter2.jsx'
import './App.css'

const INTRO_SRC = '/hearth-new/audio/leberch-ambient.mp3'
const CHAPTER1_SRC = '/hearth-new/audio/ambient-ch1.mp3'
const CHAPTER2_SRC = '/hearth-new/audio/ambient-ch2.mp3'
const CROSSFADE_MS = 2000
const INTRO_VOL = 0.4
const CHAPTER_VOL = 0.4

export default function App() {
  const [phase, setPhase] = useState('forest')
  const [chapter1Key, setChapter1Key] = useState(0)
  const [chapter2Key, setChapter2Key] = useState(0)
  const [muted, setMuted] = useState(false)

  const introRef = useRef(null)
  const chapter1Ref = useRef(null)
  const chapter2Ref = useRef(null)
  const rafRef = useRef(0)
  const mutedRef = useRef(false)
  const lastVolRef = useRef({ intro: 0, ch1: 0, ch2: 0 })

  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  const cancelRaf = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    return () => cancelRaf()
  }, [cancelRaf])

  const fadeVolume = useCallback(
    (audio, from, to, durationMs, onDone, track) => {
      if (!audio) return
      audio.volume = from * (mutedRef.current ? 0 : 1)
      lastVolRef.current[track] = from
      const t0 = performance.now()
      const tick = (now) => {
        const u = Math.min(1, (now - t0) / durationMs)
        const raw = from + (to - from) * u
        lastVolRef.current[track] = raw
        audio.volume = raw * (mutedRef.current ? 0 : 1)
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

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      requestAnimationFrame(() => {
        const apply = (el, key) => {
          if (!el) return
          el.volume = next ? 0 : lastVolRef.current[key]
        }
        apply(introRef.current, 'intro')
        apply(chapter1Ref.current, 'ch1')
        apply(chapter2Ref.current, 'ch2')
      })
      return next
    })
  }, [])

  const handleEnter = useCallback(() => {
    cancelRaf()
    setPhase('chapter1')

    const intro = introRef.current
    const ch1 = chapter1Ref.current
    if (!intro || !ch1) return

    intro.loop = true
    ch1.loop = true

    ch1.pause()
    ch1.currentTime = 0
    ch1.volume = 0
    lastVolRef.current.ch1 = 0

    intro.volume = INTRO_VOL * (mutedRef.current ? 0 : 1)
    lastVolRef.current.intro = INTRO_VOL
    const p = intro.play()
    if (p !== undefined) p.catch(() => {})

    fadeVolume(intro, INTRO_VOL, 0, CROSSFADE_MS, () => {
      intro.pause()
      intro.currentTime = 0
      lastVolRef.current.intro = 0

      const cp = ch1.play()
      if (cp !== undefined) cp.catch(() => {})
      fadeVolume(ch1, 0, CHAPTER_VOL, CROSSFADE_MS, undefined, 'ch1')
    }, 'intro')
  }, [cancelRaf, fadeVolume])

  const handleChapter1Complete = useCallback(() => {
    cancelRaf()
    setPhase('chapter2')

    const ch1 = chapter1Ref.current
    const ch2 = chapter2Ref.current
    if (!ch1 || !ch2) return

    ch2.loop = true
    ch2.playbackRate = 1
    ch2.pause()
    ch2.currentTime = 0
    ch2.volume = 0
    lastVolRef.current.ch2 = 0

    const ch1Start = ch1.volume

    fadeVolume(ch1, ch1Start, 0, CROSSFADE_MS, () => {
      ch1.pause()
      ch1.currentTime = 0
      lastVolRef.current.ch1 = 0

      const cp = ch2.play()
      if (cp !== undefined) cp.catch(() => {})
      fadeVolume(ch2, 0, CHAPTER_VOL, CROSSFADE_MS, undefined, 'ch2')
    }, 'ch1')
  }, [cancelRaf, fadeVolume])

  const handleChapter2Exit = useCallback(() => {
    cancelRaf()
    setPhase('forest')
    setChapter1Key((k) => k + 1)
    setChapter2Key((k) => k + 1)

    const intro = introRef.current
    const ch2 = chapter2Ref.current
    if (!intro || !ch2) return

    ch2.playbackRate = 1
    const ch2Start = ch2.volume

    fadeVolume(ch2, ch2Start, 0, CROSSFADE_MS, () => {
      ch2.pause()
      ch2.currentTime = 0
      lastVolRef.current.ch2 = 0

      intro.volume = 0
      lastVolRef.current.intro = 0
      const ip = intro.play()
      if (ip !== undefined) ip.catch(() => {})
      fadeVolume(intro, 0, INTRO_VOL, CROSSFADE_MS, undefined, 'intro')
    }, 'ch2')
  }, [cancelRaf, fadeVolume])

  const setCh2PlaybackRate = useCallback((rate) => {
    const el = chapter2Ref.current
    if (el) el.playbackRate = rate
  }, [])

  const resetCh2Audio = useCallback(() => {
    const el = chapter2Ref.current
    if (!el) return
    el.playbackRate = 1
    const v = lastVolRef.current.ch2
    el.volume = v * (mutedRef.current ? 0 : 1)
  }, [])

  const ch2FadeToSilence = useCallback(
    (ms = 400) => {
      const el = chapter2Ref.current
      if (!el) return
      const from = lastVolRef.current.ch2
      fadeVolume(el, from, 0, ms, () => {
        el.pause()
        el.playbackRate = 1
        lastVolRef.current.ch2 = 0
      }, 'ch2')
    },
    [fadeVolume]
  )

  const audioContextValue = useMemo(
    () => ({
      muted,
      toggleMute,
      setCh2PlaybackRate,
      resetCh2Audio,
      ch2FadeToSilence,
    }),
    [muted, toggleMute, setCh2PlaybackRate, resetCh2Audio, ch2FadeToSilence]
  )

  return (
    <AppAudioContext.Provider value={audioContextValue}>
      <div className="scene">
        <audio ref={introRef} src={INTRO_SRC} preload="auto" loop />
        <audio ref={chapter1Ref} src={CHAPTER1_SRC} preload="auto" loop />
        <audio ref={chapter2Ref} src={CHAPTER2_SRC} preload="auto" loop />

        <button
          type="button"
          className="mute-btn"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          title={muted ? 'Unmute' : 'Mute'}
        >
          <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
        </button>

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
          <Chapter1 key={chapter1Key} onChapter1Complete={handleChapter1Complete} />
        )}
        {phase === 'chapter2' && (
          <Chapter2 key={chapter2Key} onExit={handleChapter2Exit} />
        )}
      </div>
    </AppAudioContext.Provider>
  )
}
