const SAVE_KEY = 'hearth_save'

export const saveGame = (data) => {
  const saveData = {
    currentChapter: data.currentChapter,
    currentScene: data.currentScene,
    choicesMade: data.choicesMade,
    completedChapters: data.completedChapters,
    timeSpentPerChapter: data.timeSpentPerChapter,
    timestamp: Date.now(),
  }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
  } catch {
    /* quota / private mode */
  }
}

export const loadGame = () => {
  try {
    const saved = localStorage.getItem(SAVE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export const clearSave = () => {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    /* ignore */
  }
}
