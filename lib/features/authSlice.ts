import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import api from "@/lib/api"

export interface AuthUser {
  id: string
  name: string
  email: string
  username?: string
  verify?: boolean
  active?: boolean
  [key: string]: unknown
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: "idle",
  error: null,
}

export const login = createAsyncThunk(
  "auth/login",
  async (payload: { emailOrUsername: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/user/login", {
        name: payload.emailOrUsername,
        password: payload.password,
      })
      const data = response.data?.data as { user: AuthUser; token: string }

      if (typeof window !== "undefined" && data?.token) {
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
      }

      return data
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        (typeof error?.message === "string" ? error.message : "Failed to sign in")
      return rejectWithValue(message)
    }
  }
)

export const signUp = createAsyncThunk(
  "auth/signUp",
  async (
    payload: { name: string; email: string; password: string; username: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/user/create", payload)
      return response.data
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        (typeof error?.message === "string" ? error.message : "Failed to sign up")
      return rejectWithValue(message)
    }
  }
)

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (payload: { email: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/user/forgot-password", payload)
      return response.data
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        (typeof error?.message === "string" ? error.message : "Failed to send reset OTP")
      return rejectWithValue(message)
    }
  }
)

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (
    payload: { email: string; otp: string; forgotPassword?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/user/verify-otp", payload)
      const data = response.data?.data as { user: AuthUser; token: string }

      if (typeof window !== "undefined" && data?.token) {
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
      }

      return data
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        (typeof error?.message === "string" ? error.message : "Failed to verify OTP")
      return rejectWithValue(message)
    }
  }
)

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (payload: { email: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/user/reset-password", payload)
      return response.data
    } catch (error: any) {
      const message =
        error?.response?.data?.message ??
        (typeof error?.message === "string" ? error.message : "Failed to reset password")
      return rejectWithValue(message)
    }
  }
)

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    hydrateFromStorage(state) {
      if (typeof window === "undefined") return
      const token = localStorage.getItem("authToken")
      const userRaw = localStorage.getItem("user")
      state.token = token
      state.user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null
    },
    logout(state) {
      state.user = null
      state.token = null
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken")
        localStorage.removeItem("user")
        localStorage.removeItem("verifyEmail")
      }
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        state.user = action.payload?.user ?? null
        state.token = action.payload?.token ?? null
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) ?? "Failed to sign in"
      })
      .addCase(verifyOtp.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.error = null
        state.user = action.payload?.user ?? null
        state.token = action.payload?.token ?? null
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) ?? "Failed to verify OTP"
      })
      .addCase(signUp.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(signUp.fulfilled, (state) => {
        state.status = "succeeded"
        state.error = null
      })
      .addCase(signUp.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) ?? "Failed to sign up"
      })
      .addCase(forgotPassword.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.status = "succeeded"
        state.error = null
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) ?? "Failed to send reset OTP"
      })
      .addCase(resetPassword.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = "succeeded"
        state.error = null
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = "failed"
        state.error = (action.payload as string) ?? "Failed to reset password"
      })
  },
})

export const { hydrateFromStorage, logout, setUser } = authSlice.actions
export default authSlice.reducer

