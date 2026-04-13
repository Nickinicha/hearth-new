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
    <div className="ch-placeholder ch-placeholder--return" aria-label="Chapter 4 placeholder">
      <p>The Return</p>
      <p className="ch-placeholder-atmo">A thin warmth reaches through the fog.</p>
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
