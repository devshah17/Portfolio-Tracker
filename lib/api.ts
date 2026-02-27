import axios from "axios"

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_PORTFOLIO_API_URL ??
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    "http://localhost:3000/api",
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken")
        localStorage.removeItem("user")
        localStorage.removeItem("verifyEmail")
        window.location.href = "/auth/signin"
      }
    }
    return Promise.reject(error)
  }
)

export default api

