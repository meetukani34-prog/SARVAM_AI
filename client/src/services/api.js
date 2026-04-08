import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ai_twin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ai_twin_token')
      localStorage.removeItem('ai_twin_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (email, name, password) => api.post('/auth/signup', { email, name, password }),
  googleLogin: (token) => api.post('/auth/google', { token }),
  setPassword: (password) => api.post('/auth/set-password', { password }),
  me: () => api.get('/auth/me'),
}

// ── Resume ────────────────────────────────────────────────────────────────────
export const resumeAPI = {
  analyze: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/ai/resume/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getHistory: () => api.get('/ai/resume/history'),
  deleteAnalysis: (id) => api.delete(`/ai/resume/${id}`),
}

// ── Chat / Communication ──────────────────────────────────────────────────────
export const chatAPI = {
  analyze: (message) => api.post('/ai/chat/analyze', { message }),
  getHistory: () => api.get('/ai/chat/history'),
  deleteAnalysis: (id) => api.delete(`/ai/chat/${id}`),
}

// ── Roadmap ───────────────────────────────────────────────────────────────────
export const roadmapAPI = {
  generate: (goal) => api.post('/career/roadmap/generate', { goal }),
  getMy: () => api.get('/career/roadmap/my'),
  updateProgress: (roadmapId, phaseId, completed) =>
    api.post(`/career/roadmap/${roadmapId}/progress`, { phase_id: phaseId, completed }),
  delete: (id) => api.delete(`/career/roadmap/${id}`),
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
}

// ── Planner ───────────────────────────────────────────────────────────────────
export const plannerAPI = {
  today: () => api.get('/career/planner/today'),
  week: () => api.get('/career/planner/week'),
  add: (task) => api.post('/career/planner/add', task),
  update: (id, task) => api.put(`/career/planner/${id}`, task),
  delete: (id) => api.delete(`/career/planner/${id}`),
  complete: (taskId, completed) => api.post('/career/planner/complete', { task_id: taskId, completed }),
  regenerate: () => api.post('/career/planner/regenerate'),
}

export default api
