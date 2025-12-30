let isDarkMode = false

export function toggleTheme() {
  isDarkMode = !isDarkMode
  applyTheme()
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
}

export function loadTheme() {
  const saved = localStorage.getItem('theme')
  isDarkMode = saved === 'dark'
  applyTheme()
}

export function getCurrentTheme() {
  return isDarkMode ? 'dark' : 'light'
}

function applyTheme() {
  const root = document.documentElement
  
  if (isDarkMode) {
    root.style.setProperty('--bg-color', '#2c2c2c')
    root.style.setProperty('--card-bg', 'rgba(60, 60, 60, 0.8)')
    root.style.setProperty('--text-color', '#ffffff')
    root.style.setProperty('--nav-bg', 'rgba(60, 60, 60, 0.9)')
    root.style.setProperty('--btn-color', '#3498db')
    root.style.setProperty('--nav-btn-bg', '#4a4a4a')
    root.style.setProperty('--nav-btn-color', '#ffffff')
  } else {
    root.style.setProperty('--bg-color', '#f3dab4')
    root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.6)')
    root.style.setProperty('--text-color', '#0d4853')
    root.style.setProperty('--nav-bg', 'rgba(13, 72, 83, 0.64)')
    root.style.setProperty('--btn-color', '#3498db')
    root.style.setProperty('--nav-btn-bg', 'rgba(13, 72, 83, 0.69)')
    root.style.setProperty('--nav-btn-color', 'white')
  }
}