import './Skeleton.css'

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rect' | 'card' | 'avatar' | 'row' | 'image'
  width?: string | number
  height?: string | number
  className?: string
  count?: number
}

export default function Skeleton({ variant = 'text', width, height, className = '', count = 1 }: SkeletonProps) {
  const style = { width, height }

  if (count > 1) {
    return (
      <div className="skeleton-group">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`skeleton skeleton-${variant} ${className}`} style={style} />
        ))}
      </div>
    )
  }

  return <div className={`skeleton skeleton-${variant} ${className}`} style={style} />
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card-wrap">
      <div className="skeleton skeleton-image" />
      <div className="skeleton-card-body">
        <Skeleton variant="text" width="60%" height={18} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
        <div className="skeleton-card-footer">
          <Skeleton variant="text" width="100px" height={14} />
          <Skeleton variant="rect" width={80} height={32} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonStat() {
  return (
    <div className="skeleton-stat">
      <Skeleton variant="rect" width={48} height={48} />
      <div className="skeleton-stat-text">
        <Skeleton variant="text" width={60} height={12} />
        <Skeleton variant="text" width={80} height={24} />
        <Skeleton variant="text" width={50} height={12} />
      </div>
    </div>
  )
}

export function SkeletonPost() {
  return (
    <div className="skeleton-post">
      <div className="skeleton-post-head">
        <Skeleton variant="avatar" width={40} height={40} />
        <div className="skeleton-post-meta">
          <Skeleton variant="text" width={120} height={14} />
          <Skeleton variant="text" width={60} height={10} />
        </div>
      </div>
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="image" width="100%" height={200} />
      <div className="skeleton-post-foot">
        <Skeleton variant="rect" width={60} height={28} />
        <Skeleton variant="rect" width={80} height={28} />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        <Skeleton variant="text" width="15%" height={12} />
        <Skeleton variant="text" width="10%" height={12} />
        <Skeleton variant="text" width="15%" height={12} />
        <Skeleton variant="text" width="15%" height={12} />
        <Skeleton variant="text" width="10%" height={12} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          <Skeleton variant="text" width="15%" height={16} />
          <Skeleton variant="rect" width={50} height={22} />
          <Skeleton variant="text" width="15%" height={16} />
          <Skeleton variant="text" width="15%" height={16} />
          <Skeleton variant="text" width="10%" height={16} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonNews() {
  return (
    <div className="skeleton-news-feat">
      <Skeleton variant="image" width="100%" height={280} />
      <div className="skeleton-news-feat-body">
        <Skeleton variant="rect" width={80} height={20} />
        <Skeleton variant="text" width="80%" height={22} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="40%" height={12} />
      </div>
    </div>
  )
}

export function SkeletonCourseCard() {
  return (
    <div className="skeleton-course-card">
      <Skeleton variant="image" width="100%" height={180} />
      <div className="skeleton-course-body">
        <Skeleton variant="text" width="70%" height={18} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
        <div className="skeleton-course-meta">
          <Skeleton variant="text" width={60} height={12} />
          <Skeleton variant="text" width={60} height={12} />
        </div>
        <Skeleton variant="rect" width="100%" height={8} />
        <div className="skeleton-course-foot">
          <Skeleton variant="text" width={80} height={12} />
          <Skeleton variant="rect" width={80} height={32} />
        </div>
      </div>
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="skeleton-profile">
      <Skeleton variant="rect" width="100%" height={120} />
      <div className="skeleton-profile-info">
        <Skeleton variant="avatar" width={96} height={96} />
        <div className="skeleton-profile-text">
          <Skeleton variant="text" width={160} height={24} />
          <Skeleton variant="text" width={120} height={14} />
          <Skeleton variant="text" width={200} height={14} />
        </div>
      </div>
      <div className="skeleton-profile-stats">
        <Skeleton variant="rect" width="100%" height={72} />
        <Skeleton variant="rect" width="100%" height={72} />
        <Skeleton variant="rect" width="100%" height={72} />
      </div>
    </div>
  )
}
