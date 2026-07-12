import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const nav = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const ok = await register(name, email, password)
    if (ok) nav('/app'); else { setError('Ошибка регистрации'); setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <motion.div
          className="auth-orb auth-orb-1"
          animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="auth-orb auth-orb-2"
          animate={{ x: [0, 30, 0], y: [0, -40, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="auth-orb auth-orb-3"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="auth-grid-lines" />
      </div>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease }}
      >
        <motion.div
          className="auth-logo"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <span className="auth-logo-icon">◆</span><span>TradePro</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Создать аккаунт
        </motion.h1>
        <motion.p
          className="auth-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Начните путь к финансовой свободе
        </motion.p>

        {error && (
          <motion.div
            className="auth-error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <motion.div
            className="field"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, duration: 0.4, ease }}
          >
            <label>Имя</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ваше имя" required />
          </motion.div>
          <motion.div
            className="field"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4, ease }}
          >
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="trader@example.com" required />
          </motion.div>
          <motion.div
            className="field"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55, duration: 0.4, ease }}
          >
            <label>Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Минимум 8 символов" required minLength={8} />
          </motion.div>
          <motion.button
            type="submit"
            className="auth-submit"
            disabled={loading}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4, ease }}
          >
            {loading ? (
              <motion.div
                className="auth-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : 'Зарегистрироваться'}
          </motion.button>
        </form>
        <motion.p
          className="auth-switch"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
