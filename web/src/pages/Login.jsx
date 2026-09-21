import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Tarjeta from '@/components/ui/Tarjeta'
import Campo from '@/components/ui/Campo'
import Boton from '@/components/ui/Boton'
import Aviso from '@/components/ui/Aviso'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [cargando, setCargando] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setCargando(true)

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        const mensaje = data.error?.message || 'Credenciales inválidas'
        throw new Error(mensaje)
      }

      login(data.usuario, data.token)
      navigate('/mapa-salon')
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-lg">
      <Tarjeta className="max-w-md w-full">
        <div className="text-center mb-xl">
          <h1 className="text-2xl font-bold text-primary">MenúGo</h1>
          <p className="text-sm text-secondary">Ingresa tus credenciales para acceder</p>
        </div>

        {errorMsg && (
          <div className="mb-md">
            <Aviso tipo="danger" mensaje={errorMsg} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-md">
          <Campo
            label="Correo electrónico"
            type="email"
            placeholder="ejemplo@menugo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Campo
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Boton
            type="submit"
            variant="primary"
            className="w-full mt-lg"
            disabled={cargando}
          >
            {cargando ? 'Iniciando sesión...' : 'Ingresar'}
          </Boton>
        </form>
      </Tarjeta>
    </div>
  )
}