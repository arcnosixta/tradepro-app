import { motion } from 'motion/react'

interface ProgressRingProps {
  pct: number
  size?: number
  strokeWidth?: number
  className?: string
}

export default function ProgressRing({ pct, size = 48, strokeWidth, className }: ProgressRingProps) {
  const sw = strokeWidth ?? (size < 40 ? 4 : size < 60 ? 5 : 6)
  const r = (size - sw * 2) / 2
  const c = 2 * Math.PI * r
  const off = c - (pct / 100) * c

  return (
    <div className={`progress-ring${className ? ` ${className}` : ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="progress-ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={sw} />
        <motion.circle
          className="progress-ring-fill"
          cx={size / 2} cy={size / 2} r={r}
          strokeDasharray={c}
          strokeWidth={sw}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>
      <div className="progress-ring-text" style={{ fontSize: size < 40 ? '0.55rem' : size < 56 ? '0.65rem' : '0.75rem' }}>
        {pct}%
      </div>
    </div>
  )
}
