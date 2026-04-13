import { useEffect } from 'react'
import './ChapterPlaceholder.css'

export default function Chapter4Placeholder({
  onGoToChapter,
  onReturnToTitle,
  syncProgress,
  flushSave,
}) {
  useEffect(() => {
    syncProgress?.({ chapterId: 4, currentScene: 1, choicesMade: {} })
  }, [syncProgress])

  return (
    <div className="ch-placeholder" aria-label="Chapter 4 placeholder">
      <p>Coming soon…</p>
      <nav className="ch-placeholder-nav" aria-label="Chapter navigation">
        <button
          type="button"
          onClick={() => {
            flushSave?.()
            onGoToChapter(3)
          }}
        >
          Previous
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
