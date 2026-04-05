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
    const form = new FormData()
    form.append('file', file)
    return api.post('/resume/analyze', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getHistory: () => api.get('/resume/history'),
  delete: (id) => api.delete(`/resume/${id}`),
}

// ── Chat / Communication ──────────────────────────────────────────────────────
export const chatAPI = {
  analyze: (message) => api.post('/chat/analyze', { message }),
  getHistory: () => api.get('/chat/history'),
  delete: (id) => api.delete(`/chat/${id}`),
}

// ── Roadmap ───────────────────────────────────────────────────────────────────
export const roadmapAPI = {
  generate: (goal) => api.post('/roadmap/generate', { goal }),
  getMy: () => api.get('/roadmap/my'),
  updateProgress: (roadmapId, phaseId, completed) =>
    api.post(`/roadmap/${roadmapId}/progress`, { phase_id: phaseId, completed }),
  delete: (id) => api.delete(`/roadmap/${id}`),
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
}

// ── Planner ───────────────────────────────────────────────────────────────────
export const plannerAPI = {
  today: () => api.get('/planner/today'),
  week: () => api.get('/planner/week'),
  add: (task) => api.post('/planner/add', task),
  update: (id, task) => api.put(`/planner/${id}`, task),
  delete: (id) => api.delete(`/planner/${id}`),
  complete: (taskId, completed) => api.post('/planner/complete', { task_id: taskId, completed }),
  regenerate: () => api.post('/planner/regenerate'),
}

export default api
