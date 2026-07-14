import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const ADMIN_EMAILS = ['arcnosixta@gmail.com']

export interface UserProfile {
  uid: string
  name: string
  email: string
  avatar: string
  banner: string
  bio: string
  joinedAt: string
  admin?: boolean
  banned?: boolean
  premium?: boolean
}

interface AuthContextType {
  user: FirebaseUser | null
  profile: UserProfile | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser)
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid))
          if (snap.exists()) {
            const data = snap.data() as UserProfile
            const isAdminEmail = ADMIN_EMAILS.includes(fbUser.email || '')
            if (isAdminEmail && !data.admin) {
              await setDoc(doc(db, 'users', fbUser.uid), { admin: true }, { merge: true })
              data.admin = true
            }
            if (data.banned) {
              await signOut(auth)
              setProfile(null)
              setLoading(false)
              return
            }
            setProfile(data)
          } else {
            const isAdminEmail = ADMIN_EMAILS.includes(fbUser.email || '')
            const p: UserProfile = {
              uid: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Трейдер',
              email: fbUser.email || '',
              avatar: fbUser.photoURL || '',
              banner: '',
              bio: '',
              joinedAt: new Date().toISOString(),
              admin: isAdminEmail,
            }
            try {
              await setDoc(doc(db, 'users', fbUser.uid), { ...p, createdAt: serverTimestamp() })
            } catch (err) {
              console.error('Firestore write error:', err)
            }
            setProfile(p)
          }
        } catch (err) {
          console.error('Firestore read error:', err)
          setProfile({
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Трейдер',
            email: fbUser.email || '',
            avatar: fbUser.photoURL || '',
            banner: '',
            bio: '',
            joinedAt: new Date().toISOString(),
          })
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const userSnap = await getDoc(doc(db, 'users', cred.user.uid))
      if (userSnap.exists() && (userSnap.data() as UserProfile).banned) {
        await signOut(auth)
        return false
      }
      return true
    } catch {
      return false
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name })
      const isAdminEmail = ADMIN_EMAILS.includes(email)
      const p: UserProfile = {
        uid: cred.user.uid, name, email, avatar: '', banner: '', bio: '',
        joinedAt: new Date().toISOString(),
        admin: isAdminEmail,
      }
      try {
        await setDoc(doc(db, 'users', cred.user.uid), { ...p, createdAt: serverTimestamp() })
      } catch (err) {
        console.error('Firestore write error:', err)
      }
      setProfile(p)
      return true
    } catch {
      return false
    }
  }

  const logout = async () => { await signOut(auth); setProfile(null) }

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return
    try {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true })
    } catch (err) {
      console.error('Firestore update error:', err)
    }
    setProfile(prev => prev ? { ...prev, ...data } : null)
    if (data.name) await updateProfile(user, { displayName: data.name })
  }

  return (
    <AuthContext.Provider value={{ user, profile, isAuthenticated: !!user, loading, login, register, logout, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth inside AuthProvider')
  return ctx
}
