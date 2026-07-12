import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAdminCommunity, useAllComments } from '../../hooks/useFirestore'
import { useToast } from '../../context/ToastContext'
import './admin.css'

function timeAgo(date: any) {
  if (!date) return ''
  const s = date?.seconds || Math.floor(Date.now() / 1000)
  const diff = Math.floor(Date.now() / 1000) - s
  if (diff < 60) return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн`
  return `${Math.floor(diff / 604800)} нед`
}

function PostComments({ postId, onDelete }: { postId: string; onDelete: (commentId: string) => void }) {
  const { comments, loading } = useAllComments(postId)

  if (loading) return <div style={{ padding: 8, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Загрузка...</div>

  return (
    <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid var(--border)' }}>
      {comments.map(c => (
        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--text)' }}>{c.authorName}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginLeft: 8 }}>{c.content}</span>
          </div>
          <button className="admin-btn admin-btn-danger" style={{ padding: '2px 8px', minHeight: 24, fontSize: '0.65rem' }} onClick={() => onDelete(c.id)}>✕</button>
        </div>
      ))}
      {comments.length === 0 && <div style={{ padding: 8, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Нет комментариев</div>}
    </div>
  )
}

function PostDetailModal({ post, onClose, onDeletePost, onDeleteComment }: {
  post: any
  onClose: () => void
  onDeletePost: () => void
  onDeleteComment: (commentId: string) => void
}) {
  const nav = useNavigate()

  return (
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="admin-modal admin-modal-lg" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300 }} onClick={e => e.stopPropagation()}>
        <div className="post-detail-header">
          <div className="admin-user-cell" style={{ cursor: 'pointer' }} onClick={() => { onClose(); nav(`/app/user/${post.authorUid}`) }}>
            <div className="admin-user-avatar">{post.authorName?.[0]?.toUpperCase() || '?'}</div>
            <div>
              <div className="admin-user-name">{post.authorName}</div>
              <div className="admin-user-email">{post.createdAt?.seconds ? timeAgo(post.createdAt) : ''}</div>
            </div>
          </div>
          <button className="admin-btn admin-btn-danger" onClick={onDeletePost}>🗑 Удалить пост</button>
        </div>

        <div className="post-detail-content">{post.content}</div>

        {post.image && (
          <div className="post-detail-image">
            <img src={post.image} alt="" />
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="post-detail-tags">
            {post.tags.map((t: string) => <span key={t} className="admin-post-tag">#{t}</span>)}
          </div>
        )}

        <div className="post-detail-stats">
          <span>❤️ {post.likes} лайков</span>
          <span>💬 {post.comments} комментариев</span>
          <span>👁 {post.views || 0} просмотров</span>
          {post.likedBy && post.likedBy.length > 0 && (
            <span>👤 {post.likedBy.length} уникальных лайков</span>
          )}
        </div>

        <div className="post-detail-section">
          <h4>Комментарии</h4>
          <PostComments postId={post.id} onDelete={onDeleteComment} />
        </div>

        <div className="user-detail-actions">
          <button className="admin-btn" onClick={() => { onClose(); nav(`/app/user/${post.authorUid}`) }}>👤 Профиль автора</button>
          <button className="admin-btn" onClick={onClose}>Закрыть</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null
  return (
    <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
      <motion.div className="admin-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300 }} onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="admin-modal-actions">
          <button className="admin-btn" onClick={onCancel}>Отмена</button>
          <button className="admin-btn admin-btn-danger" onClick={onConfirm}>Удалить</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function CommunityMod() {
  const { posts, loading, deletePost, deleteComment } = useAdminCommunity()
  const { toast } = useToast()
  const nav = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedPost, setSelectedPost] = useState<typeof posts[0] | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => void } | null>(null)

  const filtered = search
    ? posts.filter(p => {
        const q = search.toLowerCase()
        return p.content?.toLowerCase().includes(q) ||
          p.authorName?.toLowerCase().includes(q) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q))
      })
    : posts

  const handleDeletePost = (post: typeof posts[0]) => {
    setConfirmAction({
      title: 'Удалить пост?',
      message: `Пост от ${post.authorName}: "${post.content.slice(0, 80)}..." будет удалён навсегда.`,
      action: async () => {
        await deletePost(post.id)
        toast('Пост удалён', 'success')
        setConfirmAction(null)
        setSelectedPost(null)
      },
    })
  }

  const handleDeleteComment = (postId: string, commentId: string) => {
    setConfirmAction({
      title: 'Удалить комментарий?',
      message: 'Комментарий будет удалён навсегда.',
      action: async () => {
        await deleteComment(postId, commentId)
        toast('Комментарий удалён', 'success')
        setConfirmAction(null)
      },
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <button className="back" onClick={() => nav('/app/admin')}>← Назад</button>
        <h1 className="pg-title">Модерация контента</h1>
        <p className="pg-sub">{posts.length} постов · {filtered.length} показано</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <input className="admin-search" placeholder="Поиск по содержимому, автору или тегам..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="admin-empty"><div className="admin-empty-icon">⏳</div>Загрузка...</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty"><div className="admin-empty-icon">📝</div>Постов не найдено</div>
      ) : (
        <div className="admin-section">
          <div style={{ padding: 'var(--sp-4) var(--sp-6)' }}>
            {filtered.map(post => (
              <motion.div
                key={post.id}
                className="admin-post admin-card-clickable"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedPost(post)}
              >
                <div className="admin-post-header">
                  <div className="admin-post-meta">
                    <div className="admin-user-avatar" style={{ width: 28, height: 28, fontSize: 'var(--text-xs)' }}>
                      {post.authorName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span style={{ fontWeight: 600 }}>{post.authorName}</span>
                    <span>·</span>
                    <span>{post.createdAt?.seconds ? timeAgo(post.createdAt) : ''}</span>
                  </div>
                  <div className="admin-actions" onClick={e => e.stopPropagation()}>
                    <button className="admin-btn admin-btn-danger" onClick={() => handleDeletePost(post)}>🗑</button>
                  </div>
                </div>
                <div className="admin-post-content">{post.content.length > 200 ? post.content.slice(0, 200) + '...' : post.content}</div>
                {post.tags && post.tags.length > 0 && (
                  <div className="admin-post-tags">
                    {post.tags.map((t: string) => <span key={t} className="admin-post-tag">#{t}</span>)}
                  </div>
                )}
                <div className="admin-post-stats">
                  <span>❤️ {post.likes}</span>
                  <span>💬 {post.comments}</span>
                  <span>👁 {post.views || 0}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onDeletePost={() => handleDeletePost(selectedPost)}
            onDeleteComment={(commentId) => handleDeleteComment(selectedPost.id, commentId)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmAction && (
          <ConfirmModal
            open={!!confirmAction}
            title={confirmAction.title}
            message={confirmAction.message}
            onConfirm={confirmAction.action}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
