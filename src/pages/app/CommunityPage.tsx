import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCommunity, useComments, uploadImage } from '../../hooks/useFirestore'
import { useToast } from '../../context/ToastContext'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { SkeletonPost } from '../../components/ui/Skeleton'
import MobileModal from '../../components/ui/MobileModal'
import {
  HeartIcon, HeartFilledIcon, CommentIcon, BookmarkIcon, BookmarkFilledIcon,
  ShareIcon, CameraIcon, ChartIcon, SearchIcon, SendIcon, CloseIcon,
  TrashIcon, ChevronDownIcon
} from '../../components/ui/Icons'
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
    await addComment({ authorUid: profile.uid, authorName: profile.name, authorAvatar: profile.avatar, content: text.trim() })
    setText('')
  }

  return (
    <div className="comments-section">
      <button className="comments-toggle" onClick={() => setOpen(!open)}>
        <CommentIcon size={14} />
        {comments.length > 0 ? `${comments.length} комментари${comments.length === 1 ? 'й' : comments.length < 5 ? 'я' : 'ев'}` : 'Комментировать'}
        <ChevronDownIcon size={14} className={`comments-arrow ${open ? 'open' : ''}`} />
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
                <div className="comment-av">
                  {c.authorAvatar ? <img src={c.authorAvatar} alt="" /> : c.authorName[0]}
                </div>
                <div className="comment-body">
                  <div className="comment-head">
                    <span className="comment-name">{c.authorName}</span>
                    <span className="comment-time">{c.createdAt?.seconds ? timeAgo(c.createdAt) : ''}</span>
                  </div>
                  <div className="comment-text">{c.content}</div>
                </div>
                {profile?.uid === c.authorUid && (
                  <button className="comment-del" onClick={() => deleteComment(c.id)} title="Удалить">
                    <TrashIcon size={14} />
                  </button>
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
              ><SendIcon size={14} /></motion.button>
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
    const shareText = `${post.content.slice(0, 100)}... — TradePro`
    if (navigator.share && isMobile) {
      try { await navigator.share({ title: 'TradePro', text: shareText }) } catch {}
    } else {
      await navigator.clipboard.writeText(shareText)
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
    <div className="community-page">
      <div className="community-bg" />

      <motion.div className="community-scroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <div className="community-header">
          <div>
            <h1 className="pg-title">Сообщество</h1>
            <p className="pg-sub">Общайся с трейдерами, делись анализом</p>
          </div>
          <motion.button className="btn-icon btn-outline" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={() => setShowSearch(true)}>
            <SearchIcon size={20} />
          </motion.button>
        </div>

        <div className="community-filters-top">
          <div className="filters" style={{ marginBottom: 0 }}>
            <motion.button className={`filter-btn ${sortBy === 'newest' ? 'filter-active' : ''}`} onClick={() => setSortBy('newest')} whileTap={{ scale: 0.96 }}>По дате</motion.button>
            <motion.button className={`filter-btn ${sortBy === 'popular' ? 'filter-active' : ''}`} onClick={() => setSortBy('popular')} whileTap={{ scale: 0.96 }}>Популярные</motion.button>
          </div>
          {tagFilter && (
            <div className="filters" style={{ marginBottom: 0 }}>
              <motion.button className="filter-btn filter-active" onClick={() => setTagFilter(null)} whileTap={{ scale: 0.96 }}>
                <CloseIcon size={12} /> {tagFilter}
              </motion.button>
            </div>
          )}
        </div>

        {!searchQuery && (
          <div className="filters">
            <button className={`filter-btn ${tagFilter === null ? 'filter-active' : ''}`} onClick={() => setTagFilter(null)}>Все</button>
            {allTags.slice(0, 8).map(t => (
              <motion.button key={t} className={`filter-btn ${tagFilter === t ? 'filter-active' : ''}`} onClick={() => setTagFilter(tagFilter === t ? null : t)} whileTap={{ scale: 0.96 }}>#{t}</motion.button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="posts">
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
                    <div className="post-av" onClick={() => nav(`/app/user/${post.authorUid}`)}>
                      {post.authorAvatar ? <img src={post.authorAvatar} alt="" /> : post.authorName[0]}
                    </div>
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
                        {isLiked ? <HeartFilledIcon size={18} /> : <HeartIcon size={18} />}
                      </motion.span>
                      {post.likes}
                    </motion.button>
                    <motion.button className="post-act" whileTap={{ scale: 0.95 }}>
                      <CommentIcon size={18} /> {post.comments}
                    </motion.button>
                    <motion.button
                      className={`post-act ${isSaved ? 'post-liked' : ''}`}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => handleSave(post.id)}
                    >
                      {isSaved ? <BookmarkFilledIcon size={18} /> : <BookmarkIcon size={18} />}
                    </motion.button>
                    <motion.button className="post-act" whileTap={{ scale: 0.95 }} onClick={() => handleShare(post)}>
                      <ShareIcon size={18} />
                    </motion.button>
                  </div>
                  <CommentSection postId={post.id} />
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </motion.div>

      <div className="community-input-bar">
        <AnimatePresence>
          {imagePreview && (
            <motion.div className="input-bar-preview" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <img src={imagePreview} alt="" className="input-bar-preview-img" />
              <button className="input-bar-preview-rm" onClick={removeImage}><CloseIcon size={14} /></button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="input-bar-row">
          <div className="input-bar-avatar">
            {profile?.avatar ? <img src={profile.avatar} alt="" /> : profile?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="input-bar-field-wrap">
            <input
              className="input-bar-field"
              placeholder="Поделись анализом..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePost()}
            />
          </div>
          <div className="input-bar-tools">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
            <motion.button className="input-bar-tool" whileTap={{ scale: 0.9 }} onClick={() => fileRef.current?.click()} title="Фото">
              <CameraIcon size={20} />
            </motion.button>
            <motion.button className="input-bar-tool" whileTap={{ scale: 0.9 }} title="График">
              <ChartIcon size={20} />
            </motion.button>
            <motion.button
              className="input-bar-send"
              whileTap={{ scale: 0.9 }}
              onClick={handlePost}
              disabled={uploading || (!text.trim() && !imageFile)}
            >
              {uploading ? (
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}>
                  <SendIcon size={18} />
                </motion.span>
              ) : (
                <SendIcon size={18} />
              )}
            </motion.button>
          </div>
        </div>
        {error && <div className="input-bar-error">{error}</div>}
      </div>

      <MobileModal open={showSearch} onClose={() => { setShowSearch(false); setSearchQuery('') }} title="Поиск постов">
        <div className="search-wrap">
          <div className="search-field">
            <SearchIcon size={18} />
            <input className="search-input" placeholder="Поиск по содержимому и тегам..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
          </div>
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
    </div>
  )
}
