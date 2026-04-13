import './ChapterPlaceholder.css'

export default function Chapter4Placeholder({ onGoToChapter, onReturnToTitle }) {
  return (
    <div className="ch-placeholder" aria-label="Chapter 4 placeholder">
      <p>Coming soon…</p>
      <nav className="ch-placeholder-nav" aria-label="Chapter navigation">
        <button type="button" onClick={() => onGoToChapter(3)}>
          Previous
        </button>
        <button type="button" onClick={onReturnToTitle}>
          Title
        </button>
      </nav>
    </div>
  )
}
