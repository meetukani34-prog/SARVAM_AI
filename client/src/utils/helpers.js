export function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('')
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function scoreColor(score) {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

export function toneColor(tone) {
  const map = {
    professional: '#8b5cf6',
    friendly: '#10b981',
    assertive: '#06b6d4',
    polite: '#22d3ee',
    formal: '#6366f1',
    casual: '#f59e0b',
    passive: '#94a3b8',
    aggressive: '#ef4444',
    rude: '#ef4444',
    anxious: '#f59e0b',
  }
  return map[tone?.toLowerCase()] || '#8b5cf6'
}

export function categoryIcon(category) {
  const icons = {
    study: '📚',
    skill: '⚡',
    communication: '💬',
    exercise: '🏃',
    project: '🚀',
    ai_ml: '🧠',
    frontend: '🎨',
    backend: '⚙️',
    devops: '🔧',
    database: '🗄️',
    personal: '🏠',
  }
  return icons[category?.toLowerCase()] || '✅'
}

export function priorityColor(priority) {
  const map = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  }
  return map[priority?.toLowerCase()] || '#8b5cf6'
}

export function truncate(str, n = 100) {
  return str?.length > n ? str.slice(0, n) + '…' : str
}
