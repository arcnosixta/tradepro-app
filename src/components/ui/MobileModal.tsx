import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import './MobileModal.css'

interface MobileModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function MobileModal({ open, onClose, title, children }: MobileModalProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-handle" />
        {title && <div className="modal-title">{title}</div>}
        <div className="modal-body">{children}</div>
      </motion.div>
    </div>
  )
}
