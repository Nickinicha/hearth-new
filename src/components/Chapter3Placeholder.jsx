import './ChapterPlaceholder.css'

export default function Chapter3Placeholder({ onGoToChapter, onReturnToTitle }) {
  return (
    <div className="ch-placeholder" aria-label="Chapter 3 placeholder">
      <p>Coming soon…</p>
      <nav className="ch-placeholder-nav" aria-label="Chapter navigation">
        <button type="button" onClick={() => onGoToChapter(4)}>
          Next chapter
        </button>
        <button type="button" onClick={onReturnToTitle}>
          Title
        </button>
      </nav>
    </div>
  )
}
