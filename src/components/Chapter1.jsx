import { useCallback, useEffect, useRef, useState } from 'react'
import './Chapter1.css'

const IMG = (name) => `/hearth-new/images/${name}`

const SCENE1_SEQUENCE = [
  { type: 'line', text: 'The house was always clean.' },
  { type: 'line', text: 'Quiet.' },
  { type: 'line', text: 'Perfect.' },
  { type: 'line', text: 'And yet...' },
  { type: 'pause' },
  { type: 'line', text: 'Something was always missing.' },
]

const SCENE2_MESSAGES = {
  table:
    'There was always enough food.\nAlways enough things.\nJust never enough... presence.',
  chair:
    'No one sat here.\nNo one ever explained why.\nYou learned not to ask.',
  window:
    'You used to wait by this window.\nWatching for someone to come home.\nThey did. But they never arrived.',
}

const MIRROR_BLOCKS = [
  'At the end of the hall\nthere was always a mirror.',
  'You avoided it.\nNot because you were afraid\nof what you would see.',
  'But because you were afraid\nyou would see nothing at all.',
]

const MIRROR_EPILOGUE =
  'You were here.\nBut no one noticed.\nAnd so you learned\nto not notice yourself either.'

const SCENE4_LINES = [
  { type: 'line', text: "It wasn't your fault." },
  { type: 'pause' },
  { type: 'line', text: 'You were a child.' },
  { type: 'pause' },
  { type: 'line', text: 'You needed something\nthat no one gave you.' },
  { type: 'pause' },
  { type: 'line', text: 'And you survived anyway.' },
  { type: 'pause' },
  { type: 'line', text: 'That matters.' },
]

export default function Chapter1({ onExit }) {
  const [scene, setScene] = useState(1)
  const [scene1Visible, setScene1Visible] = useState(0)
  const [scene1Ready, setScene1Ready] = useState(false)

  const [scene2Found, setScene2Found] = useState({
    table: false,
    chair: false,
    window: false,
  })
  const [scene2Active, setScene2Active] = useState(null)

  const [mirrorVisible, setMirrorVisible] = useState(0)
  const [mirrorShowLook, setMirrorShowLook] = useState(false)
  const [mirrorFlash, setMirrorFlash] = useState(false)
  const [mirrorEpilogue, setMirrorEpilogue] = useState(false)

  const [scene4Visible, setScene4Visible] = useState(0)
  const [scene4Ready, setScene4Ready] = useState(false)

  const timersRef = useRef([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  /* Scene 1 — line by line */
  useEffect(() => {
    if (scene !== 1) return
    clearTimers()
    setScene1Visible(0)
    setScene1Ready(false)

    let t = 500
    let lastFireAt = 500
    SCENE1_SEQUENCE.forEach((item, index) => {
      const fireAt = t
      lastFireAt = fireAt
      t += item.type === 'pause' ? 2800 : 2300
      const id = setTimeout(() => setScene1Visible(index + 1), fireAt)
      timersRef.current.push(id)
    })

    const doneId = setTimeout(() => setScene1Ready(true), lastFireAt + 1100)
    timersRef.current.push(doneId)

    return clearTimers
  }, [scene, clearTimers])

  /* Scene 3 — mirror text */
  useEffect(() => {
    if (scene !== 3) return
    clearTimers()
    setMirrorVisible(0)
    setMirrorShowLook(false)
    setMirrorEpilogue(false)
    setMirrorFlash(false)

    let t = 450
    let lastFireAt = 450
    MIRROR_BLOCKS.forEach((_, index) => {
      const fireAt = t
      lastFireAt = fireAt
      t += 3400
      const id = setTimeout(() => setMirrorVisible(index + 1), fireAt)
      timersRef.current.push(id)
    })

    const lookId = setTimeout(() => setMirrorShowLook(true), lastFireAt + 1200)
    timersRef.current.push(lookId)

    return clearTimers
  }, [scene, clearTimers])

  /* Scene 4 — release lines */
  useEffect(() => {
    if (scene !== 4) return
    clearTimers()
    setScene4Visible(0)
    setScene4Ready(false)

    let t = 900
    let lastFireAt = 900
    SCENE4_LINES.forEach((item, index) => {
      const fireAt = t
      lastFireAt = fireAt
      t += item.type === 'pause' ? 2200 : 2400
      const id = setTimeout(() => setScene4Visible(index + 1), fireAt)
      timersRef.current.push(id)
    })

    const doneId = setTimeout(() => setScene4Ready(true), lastFireAt + 1400)
    timersRef.current.push(doneId)

    return clearTimers
  }, [scene, clearTimers])

  const handleLook = useCallback(() => {
    setMirrorFlash(true)
    const t1 = setTimeout(() => setMirrorFlash(false), 280)
    const t2 = setTimeout(() => {
      setMirrorEpilogue(true)
      setMirrorShowLook(false)
    }, 320)
    timersRef.current.push(t1, t2)
  }, [])

  const scene2AllFound =
    scene2Found.table && scene2Found.chair && scene2Found.window

  const openHotspot = (key) => {
    setScene2Found((prev) => ({ ...prev, [key]: true }))
    setScene2Active(key)
  }

  return (
    <div className="ch1">
      {scene === 1 && (
        <section className="ch1-scene" aria-label="Chapter 1, scene 1">
          <div
            className="ch1-bg"
            style={{ backgroundImage: `url(${IMG('room.jpg')})` }}
            aria-hidden="true"
          />
          <div className="ch1-overlay" aria-hidden="true" />
          <div className="ch1-inner">
            {SCENE1_SEQUENCE.slice(0, scene1Visible).map((item, i) =>
              item.type === 'pause' ? (
                <div key={`p-${i}`} className="ch1-pause" />
              ) : (
                <p key={`l-${i}`} className="ch1-line">
                  {item.text}
                </p>
              )
            )}
            {scene1Ready && (
              <button
                type="button"
                className="ch1-btn"
                onClick={() => setScene(2)}
              >
                Walk inside
              </button>
            )}
          </div>
        </section>
      )}

      {scene === 2 && (
        <section className="ch1-scene" aria-label="Chapter 1, scene 2">
          <div
            className="ch1-bg"
            style={{ backgroundImage: `url(${IMG('dining.jpg')})` }}
            aria-hidden="true"
          />
          <div className="ch1-overlay" aria-hidden="true" />
          <div className="ch1-inner ch1-inner--explore">
            <div className="ch1-hotspot-layer">
              <button
                type="button"
                className="ch1-hotspot ch1-hotspot--table"
                aria-label="The table"
                onClick={() => openHotspot('table')}
              />
              <button
                type="button"
                className="ch1-hotspot ch1-hotspot--chair"
                aria-label="The empty chair"
                onClick={() => openHotspot('chair')}
              />
              <button
                type="button"
                className="ch1-hotspot ch1-hotspot--window"
                aria-label="The window"
                onClick={() => openHotspot('window')}
              />
            </div>
            {scene2Active && (
              <div className="ch1-reveal" key={scene2Active}>
                {SCENE2_MESSAGES[scene2Active]}
              </div>
            )}
            <p className="ch1-hint">
              {scene2AllFound
                ? 'You may continue.'
                : 'Look closer at the room.'}
            </p>
            {scene2AllFound && (
              <button
                type="button"
                className="ch1-btn"
                onClick={() => setScene(3)}
              >
                Continue
              </button>
            )}
          </div>
        </section>
      )}

      {scene === 3 && (
        <section className="ch1-scene" aria-label="Chapter 1, scene 3">
          {mirrorFlash && <div className="ch1-flash" aria-hidden="true" />}
          <div
            className="ch1-bg"
            style={{ backgroundImage: `url(${IMG('mirror.jpg')})` }}
            aria-hidden="true"
          />
          <div className="ch1-overlay" aria-hidden="true" />
          <div className="ch1-inner">
            {!mirrorEpilogue &&
              MIRROR_BLOCKS.slice(0, mirrorVisible).map((text, i) => (
                <p key={i} className="ch1-block">
                  {text}
                </p>
              ))}
            {mirrorEpilogue && (
              <p className="ch1-block">{MIRROR_EPILOGUE}</p>
            )}
            <div className="ch1-mirror-actions">
              {mirrorShowLook && !mirrorEpilogue && (
                <button type="button" className="ch1-btn" onClick={handleLook}>
                  Look
                </button>
              )}
              {mirrorEpilogue && (
                <button
                  type="button"
                  className="ch1-btn"
                  onClick={() => setScene(4)}
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {scene === 4 && (
        <section className="ch1-scene" aria-label="Chapter 1, scene 4">
          <div
            className="ch1-bg ch1-bg--fade"
            style={{ backgroundImage: `url(${IMG('bedroom.jpg')})` }}
            aria-hidden="true"
          />
          <div className="ch1-overlay" aria-hidden="true" />
          <div className="ch1-inner">
            {SCENE4_LINES.slice(0, scene4Visible).map((item, i) =>
              item.type === 'pause' ? (
                <div key={`s4p-${i}`} className="ch1-pause" />
              ) : (
                <p key={`s4l-${i}`} className="ch1-line">
                  {item.text}
                </p>
              )
            )}
            {scene4Ready && (
              <button
                type="button"
                className="ch1-btn ch1-btn--warm"
                onClick={onExit}
              >
                I understand
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
