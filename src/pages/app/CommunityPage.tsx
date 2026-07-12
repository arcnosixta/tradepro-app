import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCommunity, useComments, uploadImage } from '../../hooks/useFirestore'
import { useToast } from '../../context/ToastContext'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { SkeletonPost } from '../../components/ui/Skeleton'
import MobileModal from '../../components/ui/MobileModal'
import timeAgo from '../../utils/timeAgo'
import './pages.css'

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }

function CommentSection({ postId }: { postId: string }) {
  const { profile } = useAuth()
  const { comments, addComment, deleteComment } = useComments(postId)
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim() || !profile) return
    await addComment({ authorUid: profile.uid, authorName: profile.name, content: text.trim() })
    setText('')
  }

  return (
    <div className="comments-section">
      <button className="comments-toggle" onClick={() => setOpen(!open)}>
        💬 {comments.length > 0 ? `${comments.length} комментари${comments.length === 1 ? 'й' : comments.length < 5 ? 'я' : 'ев'}` : 'Комментировать'}
        <span className={`comments-arrow ${open ? 'open' : ''}`}>▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="comments-wrap"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
          >
            {comments.map(c => (
              <motion.div key={c.id} className="comment" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="comment-av">{c.authorName[0]}</div>
                <div className="comment-body">
                  <div className="comment-head">
                    <span className="comment-name">{c.authorName}</span>
                    <span className="comment-time">{c.createdAt?.seconds ? timeAgo(c.createdAt) : ''}</span>
                  </div>
                  <div className="comment-text">{c.content}</div>
                </div>
                {profile?.uid === c.authorUid && (
                  <button className="comment-del" onClick={() => deleteComment(c.id)} title="Удалить">✕</button>
                )}
              </motion.div>
            ))}
            <div className="comment-input-wrap">
              <div className="comment-av">{profile?.name?.[0]?.toUpperCase() || 'U'}</div>
              <input
                className="comment-input"
                placeholder="Написать комментарий..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
              />
              <motion.button
                className="comment-send"
                whileTap={{ scale: 0.9 }}
                onClick={handleSubmit}
                disabled={!text.trim()}
              >↑</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function CommunityPage() {
  const { profile } = useAuth()
  const { posts, loading, addPost, toggleLike, toggleSave, searchPosts } = useCommunity()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const nav = useNavigate()
  const [text, setText] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags)))
  let filtered = tagFilter ? posts.filter(p => p.tags.includes(tagFilter)) : posts
  if (searchQuery) filtered = searchPosts(searchQuery)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { toast('Максимум 3 МБ', 'error'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handlePost = async () => {
    if ((!text.trim() && !imageFile) || !profile) return
    setUploading(true)
    setError(null)
    let imageUrl: string | undefined
    try {
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, `posts/${profile.uid}/${Date.now()}_${imageFile.name}`)
      }
      await addPost({
        authorUid: profile.uid,
        authorName: profile.name,
        authorAvatar: profile.avatar,
        content: text,
        image: imageUrl,
        tags: text.match(/#\w+/g)?.map(t => t.slice(1)) || ['Новое'],
      })
      setText('')
      removeImage()
      toast('Пост опубликован!', 'success')
    } catch (err: any) {
      console.error('Post error:', err)
      toast('Ошибка публикации', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleShare = async (post: any) => {
    const text = `${post.content.slice(0, 100)}... — TradePro`
    if (navigator.share && isMobile) {
      try { await navigator.share({ title: 'TradePro', text }) } catch {}
    } else {
      await navigator.clipboard.writeText(text)
      toast('Скопировано в буфер', 'success')
    }
  }

  const handleSave = useCallback((postId: string) => {
    if (!profile) return
    toggleSave(postId, profile.uid)
    const post = posts.find(p => p.id === postId)
    const isSaved = (post?.savedBy || []).includes(profile.uid)
    toast(isSaved ? 'Удалено из сохранённых' : 'Сохранено', 'success')
  }, [profile, toggleSave, posts, toast])

  return (
    <motion.div style={{ maxWidth: 720, width: '100%' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <h1 className="pg-title">Сообщество</h1>
          <p className="pg-sub">Общайся с трейдерами, делись анализом</p>
        </div>
        <motion.button className="btn-outline" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={() => setShowSearch(true)} style={{ flexShrink: 0 }}>
          🔍
        </motion.button>
      </div>

      <motion.div className="new-post" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <div className="np-avatar">{profile?.name?.[0]?.toUpperCase() || 'U'}</div>
        <div className="np-wrap">
          <textarea
            className="np-input"
            placeholder="Поделись анализом или вопросом..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
          />
          <AnimatePresence>
            {imagePreview && (
              <motion.div className="img-preview" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <img src={imagePreview} alt="" className="img-preview-img" />
                <button className="img-preview-rm" onClick={removeImage}>✕</button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="np-actions">
            <div className="np-tools">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
              <motion.button className="tool-btn" whileTap={{ scale: 0.9 }} onClick={() => fileRef.current?.click()} title="Фото">📷</motion.button>
              <motion.button className="tool-btn" whileTap={{ scale: 0.9 }} title="График">📊</motion.button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {error && <span style={{ fontSize: '0.8rem', color: error.includes('Загрузка') ? 'var(--accent)' : '#ef4444' }}>{error}</span>}
              <motion.button className="btn-primary btn-post" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handlePost} disabled={uploading || (!text.trim() && !imageFile)}>
                {uploading ? '...' : 'Опубликовать'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, margin: '12px 0 4px' }}>
        <div className="filters" style={{ marginBottom: 0 }}>
          <motion.button className={`filter-btn ${sortBy === 'newest' ? 'filter-active' : ''}`} onClick={() => setSortBy('newest')} whileTap={{ scale: 0.96 }}>По дате</motion.button>
          <motion.button className={`filter-btn ${sortBy === 'popular' ? 'filter-active' : ''}`} onClick={() => setSortBy('popular')} whileTap={{ scale: 0.96 }}>🔥 Популярные</motion.button>
        </div>
        <div className="filters" style={{ marginBottom: 0 }}>
          {tagFilter && <motion.button className="filter-btn filter-active" onClick={() => setTagFilter(null)} whileTap={{ scale: 0.96 }}>✕ {tagFilter}</motion.button>}
        </div>
      </div>

      {!searchQuery && (
        <div className="filters" style={{ marginTop: 4 }}>
          <button className={`filter-btn ${tagFilter === null ? 'filter-active' : ''}`} onClick={() => setTagFilter(null)}>Все</button>
          {allTags.slice(0, 8).map(t => (
            <motion.button key={t} className={`filter-btn ${tagFilter === t ? 'filter-active' : ''}`} onClick={() => setTagFilter(tagFilter === t ? null : t)} whileTap={{ scale: 0.96 }}>#{t}</motion.button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonPost key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ padding: '48px 0' }}>
          {searchQuery ? 'Ничего не найдено' : 'Пока нет постов. Будь первым!'}
        </div>
      ) : (
        <motion.div className="posts" variants={stagger} initial="hidden" animate="show">
          {filtered.map(post => {
            const isLiked = (post.likedBy || []).includes(profile?.uid || '')
            const isSaved = (post.savedBy || []).includes(profile?.uid || '')
            return (
              <motion.div key={post.id} className="post-card" variants={fadeUp} layout>
                <div className="post-head">
                  <div className="post-av" onClick={() => nav(`/app/user/${post.authorUid}`)}>{post.authorName[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div className="post-name" onClick={() => nav(`/app/user/${post.authorUid}`)}>
                      {post.authorName}
                      {post.authorBadge && <span className={`badge-tag badge-${post.authorBadge.toLowerCase()}`}>{post.authorBadge}</span>}
                    </div>
                    <div className="muted" style={{ fontSize: '0.75rem' }}>{post.createdAt?.seconds ? timeAgo(post.createdAt) : ''}</div>
                  </div>
                </div>
                <div className="post-body">{post.content}</div>
                {post.image && (
                  <div className="post-img-wrap"><img src={post.image} alt="" className="post-img" loading="lazy" /></div>
                )}
                {post.tags.length > 0 && (
                  <div className="post-tags">{post.tags.map(t => <span key={t} className="post-tag" onClick={() => setTagFilter(t)}>#{t}</span>)}</div>
                )}
                <div className="post-foot">
                  <motion.button
                    className={`post-act ${isLiked ? 'post-liked' : ''}`}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => profile && toggleLike(post.id, profile.uid)}
                  >
                    <motion.span animate={isLiked ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
                      {isLiked ? '❤️' : '🤍'}
                    </motion.span>
                    {post.likes}
                  </motion.button>
                  <motion.button className="post-act" whileTap={{ scale: 0.95 }}>
                    💬 {post.comments}
                  </motion.button>
                  <motion.button
                    className={`post-act ${isSaved ? 'post-liked' : ''}`}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleSave(post.id)}
                  >
                    {isSaved ? '🔖' : '📑'}
                  </motion.button>
                  <motion.button className="post-act" whileTap={{ scale: 0.95 }} onClick={() => handleShare(post)}>
                    ↗️
                  </motion.button>
                </div>
                <CommentSection postId={post.id} />
              </motion.div>
            )
          })}
        </motion.div>
      )}

      <MobileModal open={showSearch} onClose={() => { setShowSearch(false); setSearchQuery('') }} title="Поиск постов">
        <div className="search-wrap">
          <input className="search-input" placeholder="Поиск по содержимому и тегам..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
          {searchQuery && (
            <div className="search-results">
              {searchPosts(searchQuery).length === 0 ? (
                <div className="empty">Ничего не найдено</div>
              ) : (
                searchPosts(searchQuery).slice(0, 10).map(p => (
                  <div key={p.id} className="search-result" onClick={() => { setShowSearch(false); setSearchQuery('') }}>
                    <div className="search-result-title">{p.authorName}: {p.content.slice(0, 60)}...</div>
                    <div className="search-result-snippet">{p.tags.map(t => `#${t}`).join(' ')}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </MobileModal>
    </motion.div>
  )
}
