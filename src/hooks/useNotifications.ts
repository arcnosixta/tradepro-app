import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp, addDoc, getDocs, where, type Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useState, useEffect, useCallback } from 'react'

export interface Notification {
  id: string
  type: 'comment' | 'like' | 'trade' | 'achievement' | 'course' | 'system' | 'ban'
  title: string
  body: string
  link?: string
  read: boolean
  createdAt: Timestamp | null
  userId: string
}

export function useNotifications(uid: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)))
      setLoading(false)
    }, err => { console.error('Notifications listen error:', err); setLoading(false) })
    return unsub
  }, [uid])

  const markRead = useCallback(async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true })
  }, [])

  const markAllRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return
    const batch = writeBatch(db)
    unreadIds.forEach(id => {
      batch.update(doc(db, 'notifications', id), { read: true })
    })
    await batch.commit()
  }, [notifications])

  return { notifications, loading, unread, markRead, markAllRead }
}

export async function addNotification(
  uid: string,
  data: Omit<Notification, 'id' | 'read' | 'createdAt' | 'userId'>
) {
  await addDoc(collection(db, 'notifications'), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
    userId: uid,
  })
}

export async function broadcastNotification(
  data: Omit<Notification, 'id' | 'read' | 'createdAt' | 'userId'>
): Promise<{ sent: number; errors: number }> {
  const usersSnap = await getDocs(collection(db, 'users'))
  const uids = usersSnap.docs.map(d => d.id)
  let sent = 0, errors = 0

  const CONCURRENCY = 10
  for (let i = 0; i < uids.length; i += CONCURRENCY) {
    const chunk = uids.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      chunk.map(uid =>
        addDoc(collection(db, 'notifications'), {
          ...data,
          read: false,
          createdAt: serverTimestamp(),
          userId: uid,
        })
      )
    )
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        sent++
      } else {
        errors++
        console.error(`Notification write failed for uid=${chunk[idx]}:`, r.reason)
      }
    })
  }

  return { sent, errors }
}
