import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppAudio } from '../context/AppAudioContext.jsx'
import './Chapter2.css'

const IMG = (name) => `/hearth-new/images/${name}`

const S1_LINES = [
  'You learned to be\nwhatever they needed.',
  'The helpful one.',
  'The strong one.',
  'The one who never complained.',
  'But who were you\nwhen no one was watching?',
]

const S1_PAUSE_AFTER = [850, 650, 650, 650, 0]

const CONTRA_PAIRS = [
  {
    pos: 'Everyone loves who you are.',
    neg: 'But no one knows who you are.',
  },
  {
    pos: 'Be yourself.',
    neg: 'But only the version we approve.',
  },
  {
    pos: 'You are doing so well.',
    neg: 'Why is it never enough?',
  },
]

const S3_BLOCKS = [
  'At the center of the hallway\nstood a mirror.',
  'You had passed it\na thousand times.',
  'Always looking away.',
  'Tonight you looked.',
]

const S3_AFTER_MIRROR = [
  'The reflection kept changing.',
  'You could not remember\nwhich one was real.',
]

function playSoftChime() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  const ctx = new AC()
  ctx.resume?.().catch(() => {})
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(523.25, ctx.currentTime)
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.11, ctx.currentTime + 0.028)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.48)
}

export default function Chapter2({ onExit }) {
  const { muted, setCh2PlaybackRate, ch2FadeToSilence } = useAppAudio()

  const [scene, setScene] = useState(1)

  const [s1Line, setS1Line] = useState(0)
  const [s1Chars, setS1Chars] = useState(0)
  const [s1Done, setS1Done] = useState(false)
  const [s1ShowWalk, setS1ShowWalk] = useState(false)

  const [c2Pair, setC2Pair] = useState(0)
  const [c2Neg, setC2Neg] = useState(false)
  const [c2Flicker, setC2Flicker] = useState(false)
  const [c2Done, setC2Done] = useState(false)

  const fleeBtnRef = useRef(null)
  const [fleeTx, setFleeTx] = useState(0)
  const [fleeTy, setFleeTy] = useState(0)
  const [fleeReplyKey, setFleeReplyKey] = useState(0)
  const [pleaserCommitted, setPleaserCommitted] = useState(false)

  const [s3Block, setS3Block] = useState(0)
  const [s3After, setS3After] = useState(0)
  const [s3ShowMirror, setS3ShowMirror] = useState(false)
  const [s3ShowChoices, setS3ShowChoices] = useState(false)
  const [mirrorChoice, setMirrorChoice] = useState(null)

  const [s4Step, setS4Step] = useState(0)

  /* Scene 1 typewriter */
  useEffect(() => {
    if (scene !== 1 || s1Done) return
    if (s1Line >= S1_LINES.length) {
      setS1Done(true)
      return
    }
    const line = S1_LINES[s1Line]
    if (s1Chars < line.length) {
      const id = setTimeout(() => setS1Chars((c) => c + 1), 34)
      return () => clearTimeout(id)
    }
    const pause = S1_PAUSE_AFTER[s1Line] ?? 600
    const id = setTimeout(() => {
      setS1Line((n) => n + 1)
      setS1Chars(0)
    }, pause)
    return () => clearTimeout(id)
  }, [scene, s1Done, s1Line, s1Chars])

  useEffect(() => {
    if (!s1Done || scene !== 1) return
    const id = setTimeout(() => setS1ShowWalk(true), 900)
    return () => clearTimeout(id)
  }, [s1Done, scene])

  /* Scene 2 */
  useEffect(() => {
    if (scene !== 2 || c2Done) return
    const pair = CONTRA_PAIRS[c2Pair]
    if (!pair) {
      setC2Flicker(true)
      const t1 = setTimeout(() => setC2Flicker(false), 400)
      const t2 = setTimeout(() => setC2Done(true), 500)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
    if (!c2Neg) {
      const id = setTimeout(() => setC2Neg(true), 2800)
      return () => clearTimeout(id)
    }
    const id = setTimeout(() => {
      setC2Neg(false)
      setC2Pair((p) => p + 1)
    }, 3200)
    return () => clearTimeout(id)
  }, [scene, c2Pair, c2Neg, c2Done])

  const onFleeMouseMove = useCallback(
    (e) => {
      if (pleaserCommitted) return
      const el = fleeBtnRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const bx = r.left + r.width / 2
      const by = r.top + r.height / 2
      const dx = bx - e.clientX
      const dy = by - e.clientY
      const dist = Math.hypot(dx, dy)
      if (dist < 150 && dist > 0.5) {
        const nx = dx / dist
        const ny = dy / dist
        setFleeTx(nx * 120)
        setFleeTy(ny * 120)
      } else {
        setFleeTx(0)
        setFleeTy(0)
      }
    },
    [pleaserCommitted]
  )

  useEffect(() => {
    if (scene !== 2 || !c2Done || pleaserCommitted) return undefined
    window.addEventListener('mousemove', onFleeMouseMove)
    return () => window.removeEventListener('mousemove', onFleeMouseMove)
  }, [scene, c2Done, pleaserCommitted, onFleeMouseMove])

  const handleFleeClick = () => {
    setFleeTx(0)
    setFleeTy(0)
    setFleeReplyKey((k) => k + 1)
  }

  const handlePleaserClick = () => {
    if (pleaserCommitted) return
    if (!muted) playSoftChime()
    setPleaserCommitted(true)
    window.setTimeout(() => {
      setScene(3)
      setPleaserCommitted(false)
      setFleeTx(0)
      setFleeTy(0)
    }, 1500)
  }

  /* Scene 3 */
  useEffect(() => {
    if (scene !== 3) return
    if (s3Block < S3_BLOCKS.length) {
      const delay = s3Block === 0 ? 900 : 3000
      const id = setTimeout(() => setS3Block((b) => b + 1), delay)
      return () => clearTimeout(id)
    }
    if (!s3ShowMirror) {
      const id = setTimeout(() => setS3ShowMirror(true), 500)
      return () => clearTimeout(id)
    }
    if (s3After < S3_AFTER_MIRROR.length) {
      const id = setTimeout(() => setS3After((n) => n + 1), 3000)
      return () => clearTimeout(id)
    }
    if (!s3ShowChoices) {
      const id = setTimeout(() => setS3ShowChoices(true), 700)
      return () => clearTimeout(id)
    }
  }, [scene, s3Block, s3ShowMirror, s3After, s3ShowChoices])

  /* Scene 4 — timed beats */
  useEffect(() => {
    if (scene !== 4 || s4Step !== 0) return
    const id = setTimeout(() => setS4Step(1), 4500)
    return () => clearTimeout(id)
  }, [scene, s4Step])

  useEffect(() => {
    if (scene !== 4 || s4Step !== 1) return
    const id = setTimeout(() => setS4Step(2), 3800)
    return () => clearTimeout(id)
  }, [scene, s4Step])

  useEffect(() => {
    if (scene !== 4 || s4Step !== 2) return
    let raf = 0
    const start = performance.now()
    const ramp = (now) => {
      const t = Math.min(1, (now - start) / 2000)
      setCh2PlaybackRate(1 + t * 0.52)
      if (t < 1) {
        raf = requestAnimationFrame(ramp)
      } else {
        ch2FadeToSilence(400)
      }
    }
    raf = requestAnimationFrame(ramp)
    const id = setTimeout(() => setS4Step(3), 2650)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(id)
      setCh2PlaybackRate(1)
    }
  }, [scene, s4Step, setCh2PlaybackRate, ch2FadeToSilence])

  useEffect(() => {
    if (scene !== 4 || s4Step !== 3) return
    const id = setTimeout(() => setS4Step(4), 480)
    return () => clearTimeout(id)
  }, [scene, s4Step])

  useEffect(() => {
    if (scene !== 4 || s4Step !== 4) return
    const id = setTimeout(() => setS4Step(5), 1100)
    return () => clearTimeout(id)
  }, [scene, s4Step])

  useEffect(() => {
    if (scene !== 4 || s4Step !== 5) return
    const id = setTimeout(() => setS4Step(6), 5200)
    return () => clearTimeout(id)
  }, [scene, s4Step])

  useEffect(() => {
    if (scene !== 4 || s4Step !== 6) return
    const id = setTimeout(() => setS4Step(7), 4200)
    return () => clearTimeout(id)
  }, [scene, s4Step])

  const pickChoice = (choice) => {
    setMirrorChoice(choice)
    setScene(4)
    setS4Step(0)
  }

  const s4Dark = scene === 4 && s4Step >= 4

  return (
    <div className="ch2">
      {scene === 1 && (
        <section className="ch2-scene" aria-label="Chapter 2, scene 1">
          <div
            className="ch2-bg"
            style={{ backgroundImage: `url(${IMG('hallway.jpg')})` }}
            aria-hidden="true"
          />
          <div className="ch2-overlay ch2-overlay--blue" aria-hidden="true" />
          <div className="ch2-inner">
            <div className="ch2-type-wrap">
              {s1Line < S1_LINES.length && (
                <p className="ch2-type-line ch2-type-line--glitch">
                  {S1_LINES[s1Line].slice(0, s1Chars)}
                  {s1Chars < S1_LINES[s1Line].length && (
                    <span className="ch2-cursor">▍</span>
                  )}
                </p>
              )}
            </div>
            {s1ShowWalk && (
              <>
                <p className="ch2-pulse-hint">Something is at the end of the hallway.</p>
                <p className="ch2-pulse-hint ch2-pulse-hint--sub">Walk forward.</p>
                <button type="button" className="ch2-btn" onClick={() => setScene(2)}>
                  Walk forward
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {scene === 2 && (
        <section className="ch2-scene" aria-label="Chapter 2, scene 2">
          {c2Flicker && <div className="ch2-flicker" aria-hidden="true" />}
          <div
            className="ch2-bg"
            style={{ backgroundImage: `url(${IMG('masks.jpg')})` }}
            aria-hidden="true"
          />
          <div className="ch2-overlay ch2-overlay--blue" aria-hidden="true" />
          <div className="ch2-inner">
            <div className="ch2-contra-box">
              {CONTRA_PAIRS[c2Pair] && (
                <p
                  key={`${c2Pair}-${c2Neg}`}
                  className={`ch2-contra-text ${c2Neg ? 'ch2-contra-text--neg' : 'ch2-contra-text--pos'}`}
                >
                  {c2Neg ? CONTRA_PAIRS[c2Pair].neg : CONTRA_PAIRS[c2Pair].pos}
                </p>
              )}
            </div>
            {c2Done && (
              <div className="ch2-anchor-section">
                <p className="ch2-anchor-prompt">Two voices. One choice.</p>
                <div className="ch2-anchor-row">
                  <div className="ch2-flee-zone">
                    <div
                      className="ch2-flee-nudge"
                      style={{ transform: `translate(${fleeTx}px, ${fleeTy}px)` }}
                    >
                      <button
                        ref={fleeBtnRef}
                        type="button"
                        className="ch2-btn ch2-btn--anchor flee-button"
                        onClick={handleFleeClick}
                      >
                        Be myself
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`ch2-pleaser-btn${pleaserCommitted ? ' ch2-pleaser-btn--chosen' : ''}`}
                    onClick={handlePleaserClick}
                  >
                    {pleaserCommitted ? 'Good.' : 'Be what they want'}
                  </button>
                </div>
                {fleeReplyKey > 0 && (
                  <p
                    key={fleeReplyKey}
                    className="ch2-flee-reply"
                    onAnimationEnd={() => setFleeReplyKey(0)}
                  >
                    ...but what does that even mean?
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {scene === 3 && (
        <section className="ch2-scene" aria-label="Chapter 2, scene 3">
          <div
            className="ch2-bg"
            style={{ backgroundImage: `url(${IMG('mirror-hall.jpg')})` }}
            aria-hidden="true"
          />
          <div className="ch2-overlay ch2-overlay--blue" aria-hidden="true" />
          <div className="ch2-inner">
            {S3_BLOCKS.slice(0, s3Block).map((text, i) => (
              <p key={i} className="ch2-block">
                {text}
              </p>
            ))}
            {s3ShowMirror && (
              <div className="ch2-mirror-stage">
                <img
                  className="ch2-mirror-img"
                  src={IMG('face-mirror.jpg')}
                  alt=""
                />
              </div>
            )}
            {S3_AFTER_MIRROR.slice(0, s3After).map((text, i) => (
              <p key={`a-${i}`} className="ch2-block">
                {text}
              </p>
            ))}
            {s3ShowChoices && (
              <div className="ch2-choices">
                <button
                  type="button"
                  className="ch2-choice"
                  onClick={() => pickChoice('polish')}
                >
                  Choice A: Polish the mirror
                  <span className="ch2-choice-sub">Make it perfect</span>
                </button>
                <button
                  type="button"
                  className="ch2-choice"
                  onClick={() => pickChoice('break')}
                >
                  Choice B: Break the mirror
                  <span className="ch2-choice-sub">End the performance</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {scene === 4 && (
        <section
          className={`ch2-scene ch2-scene--s4${s4Dark ? ' ch2-scene--dark' : ''}${s4Step === 2 ? ' ch2-s4-shake' : ''}`}
          aria-label="Chapter 2, scene 4"
        >
          {!s4Dark && (
            <div
              className="ch2-bg"
              style={{ backgroundImage: `url(${IMG('corridor-pov.jpg')})` }}
              aria-hidden="true"
            />
          )}
          {s4Dark && <div className="ch2-bg ch2-bg--void" aria-hidden="true" />}
          {!s4Dark && <div className="ch2-overlay ch2-overlay--blue" aria-hidden="true" />}
          {s4Dark && <div className="ch2-overlay ch2-overlay--void" aria-hidden="true" />}

          {s4Step === 3 && <div className="ch2-flash-full" aria-hidden="true" />}
          {s4Step === 4 && <div className="ch2-void-layer" aria-hidden="true" />}

          <div className={`ch2-inner${s4Step === 2 ? ' ch2-s4-shake-wrap' : ''}`}>
              {s4Step === 0 && (
                <>
                  {mirrorChoice === 'polish' && (
                    <p className="ch2-block">
                      You polished.
                      <br />
                      And polished.
                      <br />
                      And polished.
                      <br />
                      But the reflection
                      <br />
                      kept changing anyway.
                    </p>
                  )}
                  {mirrorChoice === 'break' && (
                    <p className="ch2-block">
                      The sound of breaking
                      <br />
                      was the loudest thing
                      <br />
                      you had ever heard.
                      <br />
                      <br />
                      And also
                      <br />
                      the most honest.
                    </p>
                  )}
                </>
              )}

              {s4Step === 1 && (
                <p className="ch2-block">
                  Somewhere behind the quiet,
                  <br />
                  the story split in two—
                  <br />
                  and kept going anyway.
                </p>
              )}

              {s4Step === 2 && (
                <div className="ch2-whoami-layer">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <p
                      key={i}
                      className="ch2-whoami"
                      style={{
                        opacity: 0.15 + i * 0.1,
                        transform: `translate(-50%, -50%) translate(${Math.sin(i * 1.7) * 14}px, ${Math.cos(i * 1.2) * 10}px)`,
                      }}
                    >
                      Who am I?
                    </p>
                  ))}
                </div>
              )}

            {s4Step >= 5 && s4Step < 7 && (
              <>
                <p className="ch2-final-line">If no one was watching...</p>
                {s4Step >= 6 && (
                  <p className="ch2-final-line ch2-final-line--delayed">
                    ...who would you be?
                  </p>
                )}
              </>
            )}

            {s4Step === 7 && (
              <>
                <p className="ch2-final-you">You.</p>
                <button type="button" className="ch2-btn ch2-btn--soft" onClick={onExit}>
                  I am still here
                </button>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
