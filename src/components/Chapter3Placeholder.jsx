import { useEffect } from 'react'
import './ChapterPlaceholder.css'

export default function Chapter3Placeholder({
  onGoToChapter,
  onReturnToTitle,
  syncProgress,
  flushSave,
}) {
  useEffect(() => {
    syncProgress?.({ chapterId: 3, currentScene: 1, choicesMade: {} })
  }, [syncProgress])

  return (
    <div className="ch-placeholder" aria-label="Chapter 3 placeholder">
      <p>Coming soon…</p>
      <nav className="ch-placeholder-nav" aria-label="Chapter navigation">
        <button
          type="button"
          onClick={() => {
            flushSave?.()
            onGoToChapter(4)
          }}
        >
          Next chapter
        </button>
        <button
          type="button"
          onClick={() => {
            flushSave?.()
            onReturnToTitle()
          }}
        >
          Title
        </button>
      </nav>
    </div>
  )
}
