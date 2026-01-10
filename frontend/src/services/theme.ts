export const loadTheme = () => {
  const theme = localStorage.getItem('theme') || 'light'
  document.documentElement.setAttribute('data-theme', theme)
  return theme
}

export const toggleTheme = () => {
  const current = getCurrentTheme()
  const newTheme = current === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', newTheme)
  document.documentElement.setAttribute('data-theme', newTheme)
  return newTheme
}

export const getCurrentTheme = () => {
  return localStorage.getItem('theme') || 'light'
}