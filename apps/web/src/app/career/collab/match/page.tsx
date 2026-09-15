'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Users, Copy, Check, AlertCircle, CheckCircle, Clock,
  Loader2, Bell, Trophy, X, Swords, Flame, Star,
  UserCheck, UserX, Target, Zap, ChevronDown
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────
interface PeerProfile {
  user_id: string
  display_name: string
  avatar_initial: string
  connect_code: string
  stream: string
  skills: string[]
  placement_score: number
  coding_profiles?: { platform: string; username: string; solved_count: number; ranking: string; badge_name: string }[]
  github?: { health_score: number; streak_days: number }
}

interface Friend {
  connectionId: string
  userId: string
  connectedAt: string | null
  profile: PeerProfile | null
  xp: { totalXp: number; level: number; challengesWon: number; winStreak: number } | null
  activeChallenge: { id: string; title: string; challenge_type: string } | null
}

interface IncomingRequest {
  connectionId: string
  requesterId: string
  message: string
  createdAt: string
  profile: PeerProfile | null
}

interface OutgoingRequest {
  connectionId: string
  receiverId: string
  createdAt: string
  profile: { display_name: string; connect_code: string } | null
}

interface Notification {
  id: string
  type: string
  title: string
  body: string
  action_url: string
  read: boolean
  created_at: string
}

interface Challenge {
  id: string
  challenge_type: string
  title: string
  description: string
  status: string
  creator_id: string
  opponent_id: string
  target_value: string
  deadline: string | null
  xp_reward: number
  creator_completed: boolean
  opponent_completed: boolean
  winner_id: string | null
  created_at: string
  isCreator: boolean
  peerProfile: { display_name: string; avatar_initial: string } | null
}

interface MyProfile { user_id: string; display_name: string; connect_code: string }
interface MyXp {
  total_xp: number; level: number; challenges_won: number
  challenges_completed: number; win_streak: number
}

type ConnectState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; peerName: string }
  | { status: 'error'; message: string }
  | { status: 'already_pending' }

type ActiveTab = 'friends' | 'requests' | 'challenges' | 'leaderboard'

// ── Helpers ──────────────────────────────────────────────────────
function getLevel(xp: number) {
  if (xp >= 2000) return 10; if (xp >= 1500) return 9
  if (xp >= 1100) return 8;  if (xp >= 800) return 7
  if (xp >= 550) return 6;   if (xp >= 350) return 5
  if (xp >= 200) return 4;   if (xp >= 100) return 3
  if (xp >= 50) return 2;    return 1
}
function getLevelTitle(level: number) {
  return ['', 'Newcomer', 'Apprentice', 'Coder', 'Developer',
    'Engineer', 'Senior Dev', 'Tech Lead', 'Architect', 'Principal', 'Legend'][level] ?? 'Legend'
}
const LEVEL_THRESHOLDS = [0, 0, 50, 100, 200, 350, 550, 800, 1100, 1500, 2000]
function getLevelProgress(xp: number) {
  const level = getLevel(xp)
  if (level >= 10) return 100
  const floor = LEVEL_THRESHOLDS[level] ?? 0
  const ceil = LEVEL_THRESHOLDS[level + 1] ?? floor + 1
  return Math.max(0, Math.min(100, Math.round(((xp - floor) / (ceil - floor)) * 100)))
}
function challengeIcon(_type: string) {
  return ''
}
function challengeLabel(type: string) {
  return {
    leetcode_duel: 'LeetCode Duel', streak_war: 'Streak War',
    badge_race: 'Badge Race', solve_count: 'Solve Count', project_phase: 'Project Phase'
  }[type] ?? type
}

// ── Challenge Modal ──────────────────────────────────────────────
function ChallengeModal({
  friend, onClose, onSend
}: {
  friend: Friend
  onClose: () => void
  onSend: (type: string, config: { title: string; targetValue: string; deadline: string }) => void
}) {
  const [type, setType] = useState('leetcode_duel')
  const [title, setTitle] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [deadline, setDeadline] = useState('')
  const [sending, setSending] = useState(false)

  const types = [
    { id: 'leetcode_duel', label: 'LeetCode Duel', placeholder: 'Problem slug (e.g. two-sum)' },
    { id: 'streak_war', label: 'Streak War', placeholder: 'Days (e.g. 7)' },
    { id: 'badge_race', label: 'Badge Race', placeholder: 'Badge name (e.g. Problem Solving)' },
    { id: 'solve_count', label: 'Solve Count', placeholder: 'Count:days (e.g. 10:7)' },
    { id: 'project_phase', label: 'Project Phase', placeholder: 'Phase number (e.g. 3)' },
  ]

  async function handle() {
    if (!title || !targetValue || !deadline) return
    setSending(true)
    await onSend(type, { title, targetValue, deadline })
    setSending(false)
  }

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="neu-card rounded-[28px] w-full max-w-md shadow-2xl p-6 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100dvh - 2rem)" }}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
          <h3 className="font-bold text-lg text-slate-950 dark:text-white">Challenge {friend.profile?.display_name ?? 'Peer'}</h3>
          <button onClick={onClose} className="neu-btn p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          {/* Type */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Challenge Type</label>
            <div className="grid grid-cols-1 gap-1.5">
              {types.map(t => (
                <button key={t.id} onClick={() => setType(t.id)}
                  className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    type === t.id
                      ? 'neu-inset text-purple-700 dark:text-purple-300'
                      : 'hover:bg-slate-500/5 text-slate-600 dark:text-slate-400'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Challenge Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Who solves Two Sum faster?"
              className="neu-inset w-full rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none" />
          </div>
          {/* Target */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Target</label>
            <input value={targetValue} onChange={e => setTargetValue(e.target.value)}
              placeholder={types.find(t => t.id === type)?.placeholder ?? ''}
              className="neu-inset w-full rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none" />
          </div>
          {/* Deadline */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">Deadline</label>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="neu-inset w-full rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none" />
          </div>
          <button onClick={handle} disabled={sending || !title || !targetValue || !deadline}
            className="neu-btn w-full py-3 bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 disabled:opacity-50 text-white dark:text-slate-950 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2">
            {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Swords className="h-4 w-4" /> Send Challenge</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Result Submit Modal ───────────────────────────────────────────
function SubmitResultModal({
  challenge, onClose, onSubmit
}: {
  challenge: Challenge
  onClose: () => void
  onSubmit: (resultValue: string) => void
}) {
  const [resultValue, setResultValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handle() {
    if (!resultValue) return
    setSubmitting(true)
    await onSubmit(resultValue)
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="neu-card rounded-[28px] w-full max-w-sm shadow-2xl p-6 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100dvh - 2rem)" }}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
          <h3 className="font-bold text-base text-slate-950 dark:text-white">Submit Result</h3>
          <button onClick={onClose} className="neu-btn p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Enter your result for <strong>&quot;{challenge.title}&quot;</strong> (e.g. runtime, solve count, proof URL):
          </p>
          <input value={resultValue} onChange={e => setResultValue(e.target.value)}
            placeholder="Result or proof..."
            className="neu-inset w-full rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none" />
          <button onClick={handle} disabled={submitting || !resultValue}
            className="neu-btn w-full py-3 bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 disabled:opacity-50 text-white dark:text-slate-950 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Check className="h-4 w-4" /> Submit Result</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function CollabContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabFromQuery = (searchParams?.get('tab') as ActiveTab) || 'friends'
  
  const [activeTab, setActiveTab] = useState<ActiveTab>(tabFromQuery)
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null)
  const [myXp, setMyXp] = useState<MyXp | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [inbox, setInbox] = useState<IncomingRequest[]>([])
  const [outgoing, setOutgoing] = useState<OutgoingRequest[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; xp: number; won: number; streak: number; isMe: boolean }>>([])
  const [loading, setLoading] = useState(true)

  // Sync state with URL query parameter
  useEffect(() => {
    const q = searchParams?.get('tab') as ActiveTab
    if (q && ['friends', 'requests', 'challenges', 'leaderboard'].includes(q)) {
      setActiveTab(q)
    }
  }, [searchParams])

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    router.push(`/career/collab/match?tab=${tab}`, { scroll: false })
  }

  // Modals & form state
  const [connectCode, setConnectCode] = useState('')
  const [connectState, setConnectState] = useState<ConnectState>({ status: 'idle' })
  const [challengeModal, setChallengeModal] = useState<Friend | null>(null)
  const [submitModal, setSubmitModal] = useState<Challenge | null>(null)
  const [copied, setCopied] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // ── Load All Data ───────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [fRes, cRes, nRes] = await Promise.all([
        fetch('/api/career/collab/friends'),
        fetch('/api/career/collab/challenges'),
        fetch('/api/career/collab/notifications'),
      ])
      if (fRes.ok) {
        const d = await fRes.json()
        setMyProfile(d.myProfile)
        setMyXp(d.myXp)
        setFriends(d.friends ?? [])
        setInbox(d.inbox ?? [])
        setOutgoing(d.outgoing ?? [])
        setLeaderboard(d.leaderboard ?? [])
      }
      if (cRes.ok) {
        const d = await cRes.json()
        setChallenges(d.challenges ?? [])
      }
      if (nRes.ok) {
        const d = await nRes.json()
        setNotifications(d.notifications ?? [])
        setUnreadCount(d.unreadCount ?? 0)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Connect via Code ────────────────────────────────────────────
  async function handleConnect() {
    if (!connectCode.trim() || connectCode.length < 4) return
    setConnectState({ status: 'loading' })
    try {
      const res = await fetch('/api/career/collab/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: connectCode.trim(), connectCode: connectCode.trim() }),
      })
      const d = await res.json()
      if (!res.ok) {
        setConnectState({ status: 'error', message: d.error ?? 'Connection failed' })
      } else if (d.status === 'already_pending') {
        setConnectState({ status: 'already_pending' })
      } else {
        setConnectState({ status: 'success', peerName: d.peerName ?? connectCode })
        setConnectCode('')
        loadData()
      }
    } catch {
      setConnectState({ status: 'error', message: 'Network error. Try again.' })
    }
  }

  // ── Respond to Friend Request ───────────────────────────────────
  async function respondToRequest(connectionId: string, action: 'accept' | 'decline') {
    await fetch('/api/career/collab/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId, action }),
    })
    loadData()
  }

  // ── Send Challenge ──────────────────────────────────────────────
  async function sendChallenge(challengeType: string, config: { title: string; targetValue: string; deadline: string }) {
    if (!challengeModal) return
    await fetch('/api/career/collab/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        opponentId: challengeModal.userId,
        challengeType,
        title: config.title,
        targetValue: config.targetValue,
        deadline: config.deadline || null,
        xpReward: 50,
      }),
    })
    setChallengeModal(null)
    loadData()
  }

  // ── Respond to Challenge ────────────────────────────────────────
  async function respondToChallenge(challengeId: string, action: 'accept' | 'decline') {
    await fetch(`/api/career/collab/challenges/${challengeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    loadData()
  }

  // ── Submit Result ───────────────────────────────────────────────
  async function submitResult(challengeId: string, resultValue: string) {
    await fetch(`/api/career/collab/challenges/${challengeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit_result', resultValue }),
    })
    loadData()
  }

  function copyCode() {
    if (!myProfile?.connect_code) return
    navigator.clipboard.writeText(myProfile.connect_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pendingChallenges = challenges.filter(c => c.status === 'pending' && !c.isCreator)
  const activeChallenges = challenges.filter(c => c.status === 'active')
  const completedChallenges = challenges.filter(c => c.status === 'completed' || c.status === 'declined')
  const myLevel = myXp ? getLevel(myXp.total_xp) : 1

  return (
    <div className="space-y-6">
      {/* Challenge Modal */}
      {challengeModal && (
        <ChallengeModal
          friend={challengeModal}
          onClose={() => setChallengeModal(null)}
          onSend={sendChallenge}
        />
      )}
      {submitModal && (
        <SubmitResultModal
          challenge={submitModal}
          onClose={() => setSubmitModal(null)}
          onSubmit={(v) => submitResult(submitModal.id, v)}
        />
      )}

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="neu-card rounded-[28px] p-6 sm:p-7"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
              <img src="/logo.png" alt="PrioryxAI" className="h-4 w-4 shrink-0 object-contain" />
              <span>Peer Collab Portal</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Peer Collab Portal
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Connect with classmates, compete in DSA duels, and rise on the XP leaderboard.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {myXp && (
              <div className="neu-pill rounded-2xl px-4 py-2 flex flex-col gap-1.5 min-w-[10.5rem]">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  <span>{myXp.total_xp} XP</span>
                  <span className="opacity-60">•</span>
                  <span>Lv.{myLevel} {getLevelTitle(myLevel)}</span>
                  {myXp.win_streak > 1 && (
                    <span className="flex items-center gap-0.5 text-orange-500 font-semibold">
                      <Flame className="h-3 w-3" />{myXp.win_streak} streak
                    </span>
                  )}
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-300/60 dark:bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getLevelProgress(myXp.total_xp)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500"
                  />
                </div>
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  if (!showNotifications && unreadCount > 0) {
                    fetch('/api/career/collab/notifications', { method: 'PATCH' })
                    setUnreadCount(0)
                  }
                }}
                className="neu-btn relative p-2.5 rounded-2xl text-slate-600 dark:text-slate-300"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="neu-card absolute right-0 top-12 w-[min(20rem,calc(100vw-3rem))] rounded-[24px] shadow-2xl z-50 overflow-hidden p-4 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-white/10">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Notifications</span>
                    <button onClick={() => setShowNotifications(false)} className="neu-btn p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1.5">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-xs text-slate-400 dark:text-slate-500 text-center">No notifications yet</p>
                    ) : notifications.map(n => (
                      <div key={n.id} className="neu-inset rounded-xl p-2.5 text-xs space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white">{n.title}</p>
                        {n.body && <p className="text-xs text-slate-500 dark:text-slate-400">{n.body}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Connect Code & Peer Add Dual Grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="grid md:grid-cols-2 gap-5"
      >
        {/* My Connect Code */}
        <div className="neu-card rounded-[28px] p-6 flex flex-col justify-between space-y-3">
          <div>
            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">Your Connect Code</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Share with classmates so they can challenge you</p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="allow-select neu-inset rounded-2xl px-5 py-2.5 font-mono text-2xl font-black tracking-[0.2em] text-purple-700 dark:text-purple-300">
              {myProfile?.connect_code ?? '------'}
            </div>
            <button
              onClick={copyCode}
              className="neu-btn inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white"
            >
              {copied ? <><Check className="h-4 w-4 text-emerald-500" /> Copied</> : <><Copy className="h-4 w-4" /> Copy Code</>}
            </button>
          </div>
        </div>

        {/* Connect with Peer */}
        <div className="neu-card rounded-[28px] p-6 flex flex-col justify-between space-y-3">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Connect with Peer</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Enter a peer's 6-character connect code</p>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <input
                value={connectCode}
                onChange={e => {
                  setConnectCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6))
                  if (connectState.status !== 'idle') setConnectState({ status: 'idle' })
                }}
                onKeyDown={e => e.key === 'Enter' && connectCode.length >= 4 && handleConnect()}
                placeholder="PEER CODE (e.g. YUG4K2)"
                maxLength={6}
                className="neu-inset flex-1 rounded-2xl px-4 py-2 text-xs font-mono tracking-[0.15em] uppercase outline-none text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button
                onClick={handleConnect}
                disabled={connectState.status === 'loading' || connectCode.length < 4}
                className="neu-btn inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                {connectState.status === 'loading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Connect'}
              </button>
            </div>

            {connectState.status === 'error' && (
              <p className="text-xs text-rose-500 font-semibold">{connectState.message}</p>
            )}
            {connectState.status === 'success' && (
              <p className="text-xs text-emerald-500 font-semibold">Request sent to {connectState.peerName}!</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Study Rooms entry point */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
      >
        <Link
          href="/career/collab/rooms"
          className="neu-card rounded-[28px] p-6 flex items-center justify-between gap-4 group transition hover:shadow-inner"
        >
          <div>
            <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">Live Study Rooms</p>
            <p className="text-sm font-bold text-slate-950 dark:text-white">Study together in real time</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">DSA sprints, project reviews, mock interviews, and accountability check-ins with live presence and chat.</p>
          </div>
          <span className="neu-btn shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white">
            Browse Rooms
          </span>
        </Link>
      </motion.div>

      {/* Tabs */}
      <div className="relative">
        <div className="neu-card rounded-[24px] p-2 flex items-center gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)] sm:[mask-image:none]">
          {([
            { id: 'friends' as const, label: `Friends (${friends.length})`, icon: Users },
            { id: 'challenges' as const, label: `Duels & Challenges (${challenges.length})`, icon: Swords, badge: pendingChallenges.length },
            { id: 'requests' as const, label: `Requests`, icon: Bell, badge: inbox.length },
            { id: 'leaderboard' as const, label: 'XP Leaderboard', icon: Trophy },
          ]).map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition shrink-0 ${
                activeTab === id
                  ? "neu-inset text-purple-700 dark:text-purple-300 bg-purple-500/10"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
              {badge && badge > 0 ? (
                <span className="bg-rose-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">{badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* ── FRIENDS TAB ── */}
      {activeTab === 'friends' && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="neu-card rounded-[28px] p-10 text-center space-y-3 max-w-xl mx-auto">
              <Users className="h-10 w-10 text-slate-400 dark:text-slate-500 mx-auto" />
              <h3 className="font-bold text-slate-950 dark:text-white text-base">No connected friends yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Share your connect code above with your peer group to link accounts and duel.</p>
            </div>
          ) : friends.map((friend, idx) => (
            <motion.div
              key={friend.connectionId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.3) }}
              className="neu-card rounded-[24px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-transform duration-200 hover:-translate-y-0.5 hover:neu-raised-sm"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <div className="neu-pill-inset h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg text-purple-600 dark:text-purple-300 shrink-0">
                  {friend.profile?.avatar_initial ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-slate-950 dark:text-white">{friend.profile?.display_name ?? 'Peer'}</h3>
                    {friend.xp && (
                      <span className="neu-pill rounded-full px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                        Lv.{friend.xp.level} · {friend.xp.totalXp} XP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{friend.profile?.stream}</p>
                  {friend.profile?.skills && friend.profile.skills.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {friend.profile.skills.slice(0, 5).map(s => (
                        <span key={s} className="neu-pill rounded-lg px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setChallengeModal(friend)}
                className="neu-btn inline-flex items-center gap-1.5 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shrink-0"
              >
                <Swords className="h-3.5 w-3.5" />
                <span>Challenge</span>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── REQUESTS TAB ── */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {inbox.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Incoming Requests ({inbox.length})</h3>
              {inbox.map(req => (
                <div key={req.connectionId} className="neu-card rounded-[24px] p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="neu-pill-inset h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-purple-600 dark:text-purple-300 shrink-0">
                      {req.profile?.avatar_initial ?? '?'}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-950 dark:text-white">{req.profile?.display_name ?? 'Classmate'}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{req.profile?.stream} · {req.profile?.connect_code}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => respondToRequest(req.connectionId, 'accept')}
                      className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Accept
                    </button>
                    <button onClick={() => respondToRequest(req.connectionId, 'decline')}
                      className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {outgoing.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Sent Requests ({outgoing.length})</h3>
              {outgoing.map(req => (
                <div key={req.connectionId} className="neu-card rounded-[20px] p-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Sent to <strong>{req.profile?.display_name ?? req.receiverId}</strong></span>
                  <span className="neu-pill rounded-full px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">Waiting response</span>
                </div>
              ))}
            </div>
          )}

          {inbox.length === 0 && outgoing.length === 0 && (
            <div className="neu-card rounded-[28px] p-10 text-center space-y-2 max-w-xl mx-auto">
              <Bell className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="font-bold text-xs text-slate-900 dark:text-white">No pending requests</p>
            </div>
          )}
        </div>
      )}

      {/* ── CHALLENGES TAB ── */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          {pendingChallenges.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Waiting for Response ({pendingChallenges.length})</h3>
              {pendingChallenges.map(c => (
                <div key={c.id} className="neu-card rounded-[24px] p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm text-slate-950 dark:text-white">{c.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{challengeLabel(c.challenge_type)} · From {c.peerProfile?.display_name ?? 'Peer'} · +{c.xp_reward} XP</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => respondToChallenge(c.id, 'accept')}
                      className="neu-btn px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Accept
                    </button>
                    <button onClick={() => respondToChallenge(c.id, 'decline')}
                      className="neu-btn px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-500">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeChallenges.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active In Progress ({activeChallenges.length})</h3>
              {activeChallenges.map(c => {
                const myCompleted = c.isCreator ? c.creator_completed : c.opponent_completed
                return (
                  <div key={c.id} className="neu-card rounded-[24px] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-sm text-slate-950 dark:text-white">{c.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{challengeLabel(c.challenge_type)} · vs {c.peerProfile?.display_name}</p>
                      <div className="flex gap-3 mt-2 text-[11px] font-semibold">
                        <span className="neu-pill rounded-full px-2 py-0.5 text-slate-700 dark:text-slate-300">You: {myCompleted ? 'Done' : 'Pending'}</span>
                        <span className="neu-pill rounded-full px-2 py-0.5 text-slate-700 dark:text-slate-300">Them: {(c.isCreator ? c.opponent_completed : c.creator_completed) ? 'Done' : 'Pending'}</span>
                      </div>
                    </div>
                    {!myCompleted && (
                      <button onClick={() => setSubmitModal(c)}
                        className="neu-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-950 dark:bg-white dark:text-slate-950">
                        <Target className="h-3.5 w-3.5" /> Submit Proof
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {completedChallenges.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed Challenges ({completedChallenges.length})</h3>
              {completedChallenges.map(c => {
                const iWon = c.winner_id === (c.isCreator ? c.creator_id : c.opponent_id)
                return (
                  <div key={c.id} className="neu-card rounded-[20px] p-4 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-950 dark:text-white">{c.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">vs {c.peerProfile?.display_name}</p>
                    </div>
                    {c.status === 'completed' && (
                      <span className={`neu-pill rounded-full px-2.5 py-0.5 text-xs font-bold ${iWon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        {iWon ? 'Won' : 'Lost'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {challenges.length === 0 && (
            <div className="neu-card rounded-[28px] p-10 text-center space-y-2 max-w-xl mx-auto">
              <Swords className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="font-bold text-xs text-slate-900 dark:text-white">No challenges yet</p>
            </div>
          )}
        </div>
      )}

      {/* ── LEADERBOARD TAB ── */}
      {activeTab === 'leaderboard' && (
        <div className="neu-card rounded-[28px] p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="font-bold text-base text-slate-950 dark:text-white">XP Leaderboard</h2>
          </div>

          <div className="space-y-2.5">
            {(leaderboard as NonNullable<typeof leaderboard[0]>[]).map((entry, i) => (
              <div
                key={i}
                className={`neu-inset rounded-2xl p-4 flex items-center justify-between gap-4 ${entry.isMe ? 'border border-purple-500/30 bg-purple-500/5' : ''}`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="neu-pill-inset h-8 w-8 rounded-full flex items-center justify-center font-black text-xs text-purple-700 dark:text-purple-300 shrink-0">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-950 dark:text-white">
                      {entry.name}{entry.isMe ? ' (You)' : ''}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Lv.{getLevel(entry.xp)} {getLevelTitle(getLevel(entry.xp))} · {entry.won} wins {entry.streak > 1 ? `· ${entry.streak} streak` : ''}
                    </p>
                  </div>
                </div>

                <div className="neu-pill rounded-full px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 shrink-0">
                  {entry.xp} XP
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PeerMatchPage() {
  return (
    <Suspense fallback={
      <div className="neu-card rounded-[28px] p-12 flex flex-col items-center justify-center text-center space-y-4">
        <Loader2 size={32} className="animate-spin text-purple-500" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading Peer Collab Portal...</p>
      </div>
    }>
      <CollabContent />
    </Suspense>
  )
}
