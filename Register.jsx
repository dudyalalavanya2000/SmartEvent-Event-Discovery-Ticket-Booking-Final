import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

import api from "../services/api"


function Register() {
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)


  const handleRegister = async (event) => {
    event.preventDefault()

    if (!username || !email || !password) {
      toast.error("Please fill in all fields")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      await api.post("/auth/register", {
        username,
        email,
        password,
      })

      toast.success("Registration successful! Please login.")

      navigate("/login")
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        "Registration failed. Please try again."

      toast.error(message)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        <div className="mb-8 text-center">

          <h1 className="text-3xl font-bold text-blue-600">
            SmartEvent
          </h1>

          <p className="mt-2 text-slate-500">
            Create your account
          </p>

        </div>


        <form
          onSubmit={handleRegister}
          className="space-y-5"
        >

          <div>

            <label className="mb-2 block font-medium text-slate-700">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter username"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />

          </div>


          <div>

            <label className="mb-2 block font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter email"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />

          </div>


          <div>

            <label className="mb-2 block font-medium text-slate-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Minimum 8 characters"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />

          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>

        </form>


        <p className="mt-6 text-center text-slate-600">

          Already have an account?{" "}

          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            Login
          </Link>

        </p>

      </div>

    </div>
  )
}

export default Register