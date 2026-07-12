import { collection, query, orderBy, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp, setDoc, getDocs, type Timestamp } from 'firebase/firestore'
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
  uid: string
}

export function useNotifications(uid: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    const q = query(
      collection(db, 'users', uid, 'notifications'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [uid])

  const markRead = useCallback(async (id: string) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'notifications', id), { read: true })
  }, [uid])

  const markAllRead = useCallback(async () => {
    if (!uid) return
    const batch = writeBatch(db)
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'users', uid, 'notifications', n.id), { read: true })
    })
    await batch.commit()
  }, [uid, notifications])

  return { notifications, loading, unread, markRead, markAllRead }
}

export async function addNotification(
  uid: string,
  data: Omit<Notification, 'id' | 'read' | 'createdAt' | 'uid'>
) {
  const ref = doc(collection(db, 'users', uid, 'notifications'))
  await setDoc(ref, {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
    uid,
  })
}

export async function broadcastNotification(
  data: Omit<Notification, 'id' | 'read' | 'createdAt' | 'uid'>
): Promise<{ sent: number; errors: number }> {
  const usersSnap = await getDocs(collection(db, 'users'))
  const uids = usersSnap.docs.map(d => d.id)
  let sent = 0, errors = 0

  for (let i = 0; i < uids.length; i += 500) {
    const batch = writeBatch(db)
    const chunk = uids.slice(i, i + 500)
    chunk.forEach(uid => {
      const ref = doc(collection(db, 'users', uid, 'notifications'))
      batch.set(ref, {
        ...data,
        read: false,
        createdAt: serverTimestamp(),
        uid,
      })
    })
    try {
      await batch.commit()
      sent += chunk.length
    } catch {
      errors += chunk.length
    }
  }

  return { sent, errors }
}
