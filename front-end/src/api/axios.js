import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.response.use(
    response => response,
    async error => {
        if (error.response?.status === 401 && !error.config._retry) {
            error.config._retry = true
            const refreshToken = localStorage.getItem("refresh_token")
            if (refreshToken) {
                try{
                    const response = await axios.get('/api/auth/refresh', {
                    headers: { Authorization: `Bearer ${refreshToken}` }
                })
                localStorage.setItem("token", response.data.access_token)
                error.config.headers.Authorization = `Bearer ${response.data.access_token}`
                return api(error.config)
            } catch {
                localStorage.removeItem("token")
                localStorage.removeItem("refresh_token")
                window.location.href = "/login"
            }
        }
        return Promise.reject(error)
    }
})

export default api    