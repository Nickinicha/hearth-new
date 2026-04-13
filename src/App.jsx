import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppAudioContext } from './context/AppAudioContext.jsx'
import Chapter1 from './components/Chapter1.jsx'
import Chapter2 from './components/Chapter2.jsx'
import Chapter3Placeholder from './components/Chapter3Placeholder.jsx'
import Chapter4Placeholder from './components/Chapter4Placeholder.jsx'
import { clearSave, loadGame, saveGame } from './utils/saveSystem.js'
import './App.css'

const INTRO_SRC = '/hearth-new/audio/leberch-ambient.mp3'
const CROSSFADE_MS = 2000
const INTRO_VOL = 0.4
const CHAPTER_VOL = 0.4

const chapterConfig = {
  1: {
    name: 'The Silence',
    audio: '/hearth-new/audio/ambient-ch1.mp3',
    overlay: 'rgba(20, 10, 30, 0.85)',
    component: Chapter1,
  },
  2: {
    name: 'The Pleaser',
    audio: '/hearth-new/audio/ambient-ch2.mp3',
    overlay: 'rgba(180, 40, 40, 0.4)',
    component: Chapter2,
  },
  3: {
    name: 'The Fracture',
    audio: '/hearth-new/audio/ambient-ch3.mp3',
    overlay: 'rgba(10, 30, 60, 0.7)',
    component: Chapter3Placeholder,
  },
  4: {
    name: 'The Return',
    audio: '/hearth-new/audio/ambient-ch4.mp3',
    overlay: 'rgba(200, 180, 100, 0.3)',
    component: Chapter4Placeholder,
  },
}

const CHAPTER_IDS = Object.keys(chapterConfig).map(Number)

function trackKey(id) {
  return id === 'intro' ? 'intro' : String(id)
}

function mergeChoicesMade(prev, patch) {
  if (!patch) return prev
  const next = { ...prev, ...patch }
  if (patch.ch1) {
    next.ch1 = { ...(prev.ch1 || {}), ...patch.ch1 }
  }
  if (patch.ch2) {
    next.ch2 = { ...(prev.ch2 || {}), ...patch.ch2 }
  }
  return next
}

function defaultTimeSpent() {
  return { 1: 0, 2: 0, 3: 0, 4: 0 }
}

export default function App() {
  const [phase, setPhase] = useState('forest')
  const [activeChapterId, setActiveChapterId] = useState(1)
  const [chapterMountKey, setChapterMountKey] = useState(0)
  const [overlayColor, setOverlayColor] = useState('transparent')
  const [muted, setMuted] = useState(false)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [resumeSubtitle, setResumeSubtitle] = useState('')
  const [bootSnapshot, setBootSnapshot] = useState(null)

  const introRef = useRef(null)
  const chapterAudioRefs = useRef({})
  const rafRef = useRef(0)
  const mutedRef = useRef(false)
  const lastVolRef = useRef({ intro: 0 })

  const timeSpentRef = useRef(defaultTimeSpent())
  const choicesRef = useRef({})
  const completedRef = useRef([])
  const sceneByChapterRef = useRef({ 1: 1, 2: 1, 3: 1, 4: 1 })

  const [saveHot, setSaveHot] = useState(false)
  const saveHotTimerRef = useRef(0)

  useEffect(() => {
    const saved = loadGame()
    if (saved && saved.currentChapter != null) {
      setShowResumePrompt(true)
      const id = Number(saved.currentChapter)
      const meta = chapterConfig[id]
      setResumeSubtitle(meta ? `Chapter ${id} — ${meta.name}` : '')
    }
  }, [])

  useEffect(() => {
    CHAPTER_IDS.forEach((id) => {
      if (lastVolRef.current[String(id)] === undefined) {
        lastVolRef.current[String(id)] = 0
      }
    })
  }, [])

  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  useEffect(() => {
    if (phase !== 'chapter') return undefined
    const id = window.setInterval(() => {
      const ch = activeChapterId
      timeSpentRef.current[ch] = (timeSpentRef.current[ch] || 0) + 1
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase, activeChapterId])

  const pulseSaveIndicator = useCallback(() => {
    window.clearTimeout(saveHotTimerRef.current)
    setSaveHot(true)
    saveHotTimerRef.current = window.setTimeout(() => setSaveHot(false), 2000)
  }, [])

  const flushSaveToDisk = useCallback(
    (chapterOverride) => {
      const currentChapter = chapterOverride ?? activeChapterId
      saveGame({
        currentChapter,
        currentScene: sceneByChapterRef.current[currentChapter] ?? 1,
        choicesMade: { ...choicesRef.current },
        completedChapters: [...completedRef.current],
        timeSpentPerChapter: { ...timeSpentRef.current },
      })
      pulseSaveIndicator()
    },
    [activeChapterId, pulseSaveIndicator]
  )

  const syncProgress = useCallback((patch) => {
    if (patch == null) return
    if (patch.currentScene != null && patch.chapterId != null) {
      sceneByChapterRef.current[patch.chapterId] = patch.currentScene
    }
    if (patch.choicesMade) {
      choicesRef.current = mergeChoicesMade(choicesRef.current, patch.choicesMade)
    }
  }, [])

  const cancelRaf = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    return () => cancelRaf()
  }, [cancelRaf])

  const fadeVolume = useCallback(
    (audio, from, to, durationMs, onDone, track) => {
      if (!audio) return
      const tk = trackKey(track)
      audio.volume = from * (mutedRef.current ? 0 : 1)
      lastVolRef.current[tk] = from
      const t0 = performance.now()
      const tick = (now) => {
        const u = Math.min(1, (now - t0) / durationMs)
        const raw = from + (to - from) * u
        lastVolRef.current[tk] = raw
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

  const crossfadePair = useCallback(
    (fromEl, toEl, fromTrack, toTrack, fromStartVol, toEndVol, durationMs) => {
      cancelRaf()
      const fk = trackKey(fromTrack)
      const tk = trackKey(toTrack)
      const t0 = performance.now()
      const tick = (now) => {
        const u = Math.min(1, (now - t0) / durationMs)
        const fromV = fromStartVol * (1 - u)
        const toV = toEndVol * u
        const m = mutedRef.current ? 0 : 1
        if (fromEl) {
          fromEl.volume = fromV * m
          lastVolRef.current[fk] = fromV
        }
        if (toEl) {
          toEl.volume = toV * m
          lastVolRef.current[tk] = toV
        }
        if (u < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          if (fromEl) {
            fromEl.pause()
            fromEl.currentTime = 0
            lastVolRef.current[fk] = 0
          }
          lastVolRef.current[tk] = toEndVol
          if (toEl) toEl.volume = toEndVol * m
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [cancelRaf]
  )

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      requestAnimationFrame(() => {
        const apply = (el, key) => {
          if (!el) return
          const tk = trackKey(key)
          el.volume = next ? 0 : (lastVolRef.current[tk] ?? 0)
        }
        apply(introRef.current, 'intro')
        CHAPTER_IDS.forEach((id) => apply(chapterAudioRefs.current[id], id))
      })
      return next
    })
  }, [])

  const crossfadeAmbient = useCallback(
    (from, to) => {
      if (from === to) return
      cancelRaf()

      const introEl = introRef.current
      const pickEl = (key) => {
        if (key === 'intro') return introEl
        return chapterAudioRefs.current[key]
      }

      const fromEl = from != null ? pickEl(from) : null
      const toEl = pickEl(to)
      const targetVol = to === 'intro' ? INTRO_VOL : CHAPTER_VOL

      if (!toEl) return

      toEl.loop = true
      toEl.pause()
      toEl.currentTime = 0
      toEl.volume = 0
      lastVolRef.current[trackKey(to)] = 0

      const fromVol =
        fromEl && from != null
          ? (lastVolRef.current[trackKey(from)] ?? fromEl.volume ?? 0)
          : 0

      const tp = toEl.play()
      if (tp !== undefined) tp.catch(() => {})

      if (fromEl && from !== to && fromVol > 0) {
        crossfadePair(fromEl, toEl, from, to, fromVol, targetVol, CROSSFADE_MS)
      } else {
        if (fromEl && from !== to) {
          fromEl.pause()
          fromEl.currentTime = 0
          lastVolRef.current[trackKey(from)] = 0
        }
        fadeVolume(toEl, 0, targetVol, CROSSFADE_MS, undefined, to)
      }
    },
    [cancelRaf, crossfadePair, fadeVolume]
  )

  const startChapterAudioFromCold = useCallback(
    (chId) => {
      cancelRaf()
      const intro = introRef.current
      if (intro) {
        intro.pause()
        intro.currentTime = 0
        lastVolRef.current.intro = 0
      }
      CHAPTER_IDS.forEach((id) => {
        const el = chapterAudioRefs.current[id]
        if (el) {
          el.pause()
          el.currentTime = 0
          el.volume = 0
          lastVolRef.current[String(id)] = 0
        }
      })
      const el = chapterAudioRefs.current[chId]
      if (!el) return
      el.loop = true
      el.volume = 0
      lastVolRef.current[String(chId)] = 0
      const p = el.play()
      if (p !== undefined) p.catch(() => {})
      fadeVolume(el, 0, CHAPTER_VOL, CROSSFADE_MS, undefined, chId)
    },
    [cancelRaf, fadeVolume]
  )

  const handleEnter = useCallback(() => {
    setBootSnapshot(null)
    choicesRef.current = {}
    completedRef.current = []
    timeSpentRef.current = defaultTimeSpent()
    sceneByChapterRef.current = { 1: 1, 2: 1, 3: 1, 4: 1 }

    const cfg = chapterConfig[1]
    setActiveChapterId(1)
    setPhase('chapter')
    setOverlayColor('transparent')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOverlayColor(cfg.overlay))
    })

    const intro = introRef.current
    const ch1 = chapterAudioRefs.current[1]
    if (!intro || !ch1) return

    intro.loop = true
    intro.volume = INTRO_VOL * (mutedRef.current ? 0 : 1)
    lastVolRef.current.intro = INTRO_VOL

    const ip = intro.play()
    if (ip !== undefined) ip.catch(() => {})

    crossfadeAmbient('intro', 1)
  }, [crossfadeAmbient])

  useEffect(() => {
    if (phase !== 'chapter') return
    flushSaveToDisk()
  }, [activeChapterId, phase, flushSaveToDisk])

  const handleChapter1Complete = useCallback(() => {
    if (!completedRef.current.includes(1)) {
      completedRef.current = [...completedRef.current, 1]
    }
    flushSaveToDisk()
    setOverlayColor(chapterConfig[2].overlay)
    setActiveChapterId(2)
    crossfadeAmbient(1, 2)
  }, [crossfadeAmbient, flushSaveToDisk])

  const handleReturnToTitle = useCallback(() => {
    flushSaveToDisk()
    cancelRaf()
    setPhase('forest')
    setOverlayColor('transparent')
    setChapterMountKey((k) => k + 1)
    setBootSnapshot(null)

    const intro = introRef.current
    const fromEl = chapterAudioRefs.current[activeChapterId]
    if (!intro) return

    const fromVol =
      fromEl != null
        ? (lastVolRef.current[String(activeChapterId)] ?? fromEl.volume ?? 0)
        : 0

    intro.loop = true
    intro.pause()
    intro.currentTime = 0
    intro.volume = 0
    lastVolRef.current.intro = 0

    const introPlay = intro.play()
    if (introPlay !== undefined) introPlay.catch(() => {})

    if (fromEl && fromVol > 0) {
      crossfadePair(fromEl, intro, activeChapterId, 'intro', fromVol, INTRO_VOL, CROSSFADE_MS)
    } else {
      if (fromEl) {
        fromEl.pause()
        fromEl.currentTime = 0
        lastVolRef.current[String(activeChapterId)] = 0
      }
      fadeVolume(intro, 0, INTRO_VOL, CROSSFADE_MS, undefined, 'intro')
    }
  }, [activeChapterId, cancelRaf, crossfadePair, fadeVolume, flushSaveToDisk])

  const handleChapter2Exit = useCallback(() => {
    if (!completedRef.current.includes(2)) {
      completedRef.current = [...completedRef.current, 2]
    }
    flushSaveToDisk()
    handleReturnToTitle()
  }, [handleReturnToTitle, flushSaveToDisk])

  const goToChapter = useCallback(
    (nextId) => {
      if (!chapterConfig[nextId] || nextId === activeChapterId) return
      flushSaveToDisk()
      setOverlayColor(chapterConfig[nextId].overlay)
      crossfadeAmbient(activeChapterId, nextId)
      setActiveChapterId(nextId)
      sceneByChapterRef.current[nextId] = sceneByChapterRef.current[nextId] ?? 1
    },
    [activeChapterId, crossfadeAmbient, flushSaveToDisk]
  )

  const handleResumeContinue = useCallback(() => {
    const s = loadGame()
    if (!s || s.currentChapter == null) {
      setShowResumePrompt(false)
      return
    }
    setShowResumePrompt(false)
    setBootSnapshot(s)

    timeSpentRef.current = {
      ...defaultTimeSpent(),
      ...(typeof s.timeSpentPerChapter === 'object' && s.timeSpentPerChapter
        ? s.timeSpentPerChapter
        : {}),
    }
    choicesRef.current =
      typeof s.choicesMade === 'object' && s.choicesMade ? { ...s.choicesMade } : {}
    completedRef.current = Array.isArray(s.completedChapters) ? [...s.completedChapters] : []

    const ch = Number(s.currentChapter)
    const sc = Number(s.currentScene) || 1
    CHAPTER_IDS.forEach((id) => {
      sceneByChapterRef.current[id] = id === ch ? sc : sceneByChapterRef.current[id] ?? 1
    })

    setActiveChapterId(ch)
    setPhase('chapter')
    setOverlayColor('transparent')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (chapterConfig[ch]) setOverlayColor(chapterConfig[ch].overlay)
      })
    })
    startChapterAudioFromCold(ch)
    setChapterMountKey((k) => k + 1)
    flushSaveToDisk(ch)
  }, [flushSaveToDisk, startChapterAudioFromCold])

  const handleResumeStartOver = useCallback(() => {
    clearSave()
    setShowResumePrompt(false)
    setBootSnapshot(null)
    choicesRef.current = {}
    completedRef.current = []
    timeSpentRef.current = defaultTimeSpent()
    sceneByChapterRef.current = { 1: 1, 2: 1, 3: 1, 4: 1 }
    setPhase('forest')
    setActiveChapterId(1)
    setChapterMountKey((k) => k + 1)
  }, [])

  const setCh2PlaybackRate = useCallback((rate) => {
    const el = chapterAudioRefs.current[2]
    if (el) el.playbackRate = rate
  }, [])

  const resetCh2Audio = useCallback(() => {
    const el = chapterAudioRefs.current[2]
    if (!el) return
    el.playbackRate = 1
    const v = lastVolRef.current['2'] ?? CHAPTER_VOL
    el.volume = v * (mutedRef.current ? 0 : 1)
  }, [])

  const ch2FadeToSilence = useCallback(
    (ms = 400) => {
      const el = chapterAudioRefs.current[2]
      if (!el) return
      const from = lastVolRef.current['2'] ?? el.volume
      fadeVolume(el, from, 0, ms, () => {
        el.pause()
        el.playbackRate = 1
        lastVolRef.current['2'] = 0
      }, 2)
    },
    [fadeVolume]
  )

  const assignChapterAudioRef = useCallback((id) => (el) => {
    chapterAudioRefs.current[id] = el
  }, [])

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

  const initialSaveForActiveChapter = useMemo(() => {
    if (!bootSnapshot || Number(bootSnapshot.currentChapter) !== activeChapterId) return null
    return bootSnapshot
  }, [bootSnapshot, activeChapterId])

  const ActiveChapter = chapterConfig[activeChapterId]?.component
  const chapterProps = useMemo(() => {
    const persist = {
      syncProgress,
      flushSave: flushSaveToDisk,
    }
    if (activeChapterId === 1) {
      return {
        onChapter1Complete: handleChapter1Complete,
        initialSave: initialSaveForActiveChapter,
        ...persist,
      }
    }
    if (activeChapterId === 2) {
      return {
        onExit: handleChapter2Exit,
        initialSave: initialSaveForActiveChapter,
        ...persist,
      }
    }
    if (activeChapterId === 3 || activeChapterId === 4) {
      return {
        onGoToChapter: goToChapter,
        onReturnToTitle: handleReturnToTitle,
        initialSave: initialSaveForActiveChapter,
        ...persist,
      }
    }
    return {}
  }, [
    activeChapterId,
    handleChapter1Complete,
    handleChapter2Exit,
    goToChapter,
    handleReturnToTitle,
    initialSaveForActiveChapter,
    syncProgress,
    flushSaveToDisk,
  ])

  return (
    <AppAudioContext.Provider value={audioContextValue}>
      <div className="scene">
        <audio ref={introRef} src={INTRO_SRC} preload="auto" loop />
        {CHAPTER_IDS.map((id) => (
          <audio
            key={id}
            ref={assignChapterAudioRef(id)}
            src={chapterConfig[id].audio}
            preload="auto"
            loop
          />
        ))}

        <button
          type="button"
          className="mute-btn"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          title={muted ? 'Unmute' : 'Mute'}
        >
          <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
        </button>

        <div
          className="save-indicator-dot"
          data-hot={saveHot ? 'true' : 'false'}
          aria-hidden="true"
        />

        {showResumePrompt && (
          <div className="resume-screen" role="dialog" aria-labelledby="resume-title">
            <p id="resume-title" className="resume-screen__title">
              You were here before.
            </p>
            <p className="resume-screen__chapter">{resumeSubtitle}</p>
            <div className="resume-screen__actions">
              <button type="button" className="resume-screen__btn" onClick={handleResumeContinue}>
                Continue
              </button>
              <button type="button" className="resume-screen__btn" onClick={handleResumeStartOver}>
                Start Over
              </button>
            </div>
          </div>
        )}

        {phase === 'forest' && !showResumePrompt && (
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

        {phase === 'chapter' && ActiveChapter && (
          <div className="app-chapter-root">
            <ActiveChapter key={`${activeChapterId}-${chapterMountKey}`} {...chapterProps} />
            <div
              className="app-chapter-overlay"
              style={{ backgroundColor: overlayColor }}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    </AppAudioContext.Provider>
  )
}
