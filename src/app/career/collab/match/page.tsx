'use client'
import { useState, useEffect, useCallback } from 'react'
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
function challengeIcon(type: string) {
  const icons: Record<string, string> = {
    leetcode_duel: '⚔️', streak_war: '🔥', badge_race: '🏅',
    solve_count: '📊', project_phase: '🚀'
  }
  return icons[type] ?? '🎯'
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
    { id: 'leetcode_duel', label: '⚔️ LeetCode Duel', placeholder: 'Problem slug (e.g. two-sum)' },
    { id: 'streak_war', label: '🔥 Streak War', placeholder: 'Days (e.g. 7)' },
    { id: 'badge_race', label: '🏅 Badge Race', placeholder: 'Badge name (e.g. Problem Solving)' },
    { id: 'solve_count', label: '📊 Solve Count', placeholder: 'Count:days (e.g. 10:7)' },
    { id: 'project_phase', label: '🚀 Project Phase', placeholder: 'Phase number (e.g. 3)' },
  ]

  async function handle() {
    if (!title || !targetValue || !deadline) return
    setSending(true)
    await onSend(type, { title, targetValue, deadline })
    setSending(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold text-lg">Challenge {friend.profile?.display_name ?? 'Peer'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Challenge Type</label>
            <div className="grid grid-cols-1 gap-1.5">
              {types.map(t => (
                <button key={t.id} onClick={() => setType(t.id)}
                  className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                    type === t.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300'
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Challenge Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Who solves Two Sum faster?"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 dark:bg-gray-800" />
          </div>
          {/* Target */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Target</label>
            <input value={targetValue} onChange={e => setTargetValue(e.target.value)}
              placeholder={types.find(t => t.id === type)?.placeholder ?? ''}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 dark:bg-gray-800" />
          </div>
          {/* Deadline */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Deadline</label>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 dark:bg-gray-800" />
          </div>
          <button onClick={handle} disabled={sending || !title || !targetValue || !deadline}
            className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
            {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <>⚔️ Send Challenge</>}
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
  onSubmit: (value: string) => void
}) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handle() {
    if (!value.trim()) return
    setSubmitting(true)
    await onSubmit(value)
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold">Submit Result</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">{challenge.title}</p>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">Your Result</label>
            <input value={value} onChange={e => setValue(e.target.value)}
              placeholder="e.g. Solved in 18 minutes, 5/7 days streak..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 dark:bg-gray-800" />
          </div>
          <button onClick={handle} disabled={submitting || !value.trim()}
            className="w-full py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl font-medium flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><CheckCircle className="h-4 w-4" /> Submit Result</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────
function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center">
      <div className="text-gray-300 dark:text-gray-600 mx-auto mb-3 flex justify-center">{icon}</div>
      <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────
export default function CollabMatchPage() {
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null)
  const [myXp, setMyXp] = useState<MyXp | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [inbox, setInbox] = useState<IncomingRequest[]>([])
  const [outgoing, setOutgoing] = useState<OutgoingRequest[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('friends')
  const [connectCode, setConnectCode] = useState('')
  const [connectState, setConnectState] = useState<ConnectState>({ status: 'idle' })
  const [copied, setCopied] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [challengeModal, setChallengeModal] = useState<Friend | null>(null)
  const [submitModal, setSubmitModal] = useState<Challenge | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [profileRes, friendsRes, inboxRes, challengesRes, notifRes, xpRes] =
        await Promise.allSettled([
          fetch('/api/career/collab/ensure-profile', { method: 'POST' }).then(r => r.json()),
          fetch('/api/career/collab/friends').then(r => r.json()),
          fetch('/api/career/collab/inbox').then(r => r.json()),
          fetch('/api/career/collab/challenges').then(r => r.json()),
          fetch('/api/career/collab/notifications').then(r => r.json()),
          fetch('/api/career/collab/my-xp').then(r => r.json()),
        ])

      if (profileRes.status === 'fulfilled') setMyProfile(profileRes.value.profile)
      if (friendsRes.status === 'fulfilled') setFriends(friendsRes.value.friends ?? [])
      if (inboxRes.status === 'fulfilled') {
        setInbox(inboxRes.value.incoming ?? [])
        setOutgoing(inboxRes.value.outgoing ?? [])
      }
      if (challengesRes.status === 'fulfilled') setChallenges(challengesRes.value.challenges ?? [])
      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.notifications ?? [])
        setUnreadCount(notifRes.value.unreadCount ?? 0)
      }
      if (xpRes.status === 'fulfilled') setMyXp(xpRes.value)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function handleConnect() {
    const code = connectCode.trim().toUpperCase()
    if (!code || code.length < 4) {
      setConnectState({ status: 'error', message: 'Enter a valid 6-character code.' })
      return
    }
    if (myProfile && code === myProfile.connect_code) {
      setConnectState({ status: 'error', message: "That's your own code!" })
      return
    }
    setConnectState({ status: 'loading' })
    try {
      const res = await fetch('/api/career/collab/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      const json = await res.json()
      if (res.status === 409) { setConnectState({ status: 'already_pending' }); return }
      if (!res.ok || json.error) { setConnectState({ status: 'error', message: json.error ?? 'Failed' }); return }
      setConnectState({ status: 'success', peerName: json.peer?.displayName ?? 'Peer' })
      setConnectCode('')
      loadAll()
    } catch {
      setConnectState({ status: 'error', message: 'Network error. Try again.' })
    }
  }

  async function respondToRequest(connectionId: string, action: 'accept' | 'decline') {
    await fetch(`/api/career/collab/connections/${connectionId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
    loadAll()
  }

  async function sendChallenge(type: string, config: { title: string; targetValue: string; deadline: string }) {
    if (!challengeModal) return
    await fetch('/api/career/collab/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opponentId: challengeModal.userId, challengeType: type, ...config, stake: 'Bragging rights + XP' })
    })
    setChallengeModal(null)
    loadAll()
  }

  async function respondToChallenge(challengeId: string, action: 'accept' | 'decline') {
    await fetch(`/api/career/collab/challenges/${challengeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
    loadAll()
  }

  async function submitResult(challengeId: string, resultValue: string) {
    await fetch(`/api/career/collab/challenges/${challengeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit_result', resultValue })
    })
    loadAll()
  }

  function copyCode() {
    navigator.clipboard.writeText(myProfile?.connect_code ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const myLevel = getLevel(myXp?.total_xp ?? 0)

  // Categorize challenges
  const pendingChallenges = challenges.filter(c => c.status === 'pending' && !c.isCreator)
  const activeChallenges = challenges.filter(c => c.status === 'in_progress')
  const completedChallenges = challenges.filter(c => ['completed', 'declined', 'expired'].includes(c.status))

  // Leaderboard: merge me + friends XP
  const leaderboard = [
    myXp ? { name: myProfile?.display_name ?? 'You', xp: myXp.total_xp, won: myXp.challenges_won, streak: myXp.win_streak, isMe: true } : null,
    ...friends.filter(f => f.xp).map(f => ({
      name: f.profile?.display_name ?? 'Friend', xp: f.xp!.totalXp, won: f.xp!.challengesWon,
      streak: f.xp!.winStreak, isMe: false
    }))
  ].filter(Boolean).sort((a, b) => (b?.xp ?? 0) - (a?.xp ?? 0))

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Modals */}
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-purple-500" />
          <div>
            <h1 className="text-2xl font-semibold">Peer Collaboration</h1>
            <p className="text-sm text-muted-foreground">Connect, compete, and grow together</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {myXp && (
            <div className="flex items-center gap-2 border rounded-xl px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-bold">{myXp.total_xp} XP</span>
              <span className="text-xs text-muted-foreground">Lv.{myLevel} {getLevelTitle(myLevel)}</span>
              {myXp.win_streak > 1 && (
                <span className="flex items-center gap-0.5 text-xs text-orange-500 font-semibold">
                  <Flame className="h-3.5 w-3.5" />{myXp.win_streak}
                </span>
              )}
            </div>
          )}
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                if (!showNotifications && unreadCount > 0) {
                  fetch('/api/career/collab/notifications', { method: 'PATCH' })
                  setUnreadCount(0)
                }
              }}
              className="relative p-2 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 border rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b flex justify-between items-center">
                  <span className="font-semibold text-sm">Notifications</span>
                  <button onClick={() => setShowNotifications(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">No notifications yet</p>
                  ) : notifications.map(n => (
                    <a key={n.id} href={n.action_url || '#'}
                      className={`block p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${!n.read ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}>
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connect Code Card */}
      <div className="border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 rounded-xl p-5 mb-4">
        {loading ? (
          <div className="animate-pulse h-8 bg-purple-200 dark:bg-purple-800 rounded w-1/3" />
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">Your Connect Code</p>
              <p className="text-3xl font-bold font-mono tracking-[0.2em] text-purple-900 dark:text-purple-100">{myProfile?.connect_code ?? '------'}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Share with classmates to connect</p>
            </div>
            <button onClick={copyCode}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${copied ? 'bg-green-500 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'}`}>
              {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Code</>}
            </button>
          </div>
        )}
      </div>

      {/* Connect Input */}
      <div className="border rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-3">Connect with a Peer</h2>
        <div className="flex gap-2">
          <input
            value={connectCode}
            onChange={e => {
              setConnectCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6))
              if (connectState.status !== 'idle') setConnectState({ status: 'idle' })
            }}
            onKeyDown={e => e.key === 'Enter' && connectCode.length >= 4 && handleConnect()}
            placeholder="Enter peer code (e.g. YUG4K2)"
            maxLength={6}
            className="flex-1 border-2 rounded-xl px-4 py-2.5 text-sm font-mono tracking-[0.15em] uppercase placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-purple-500 dark:bg-gray-900 transition-colors"
          />
          <button onClick={handleConnect}
            disabled={connectState.status === 'loading' || connectCode.length < 4}
            className="px-5 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
            {connectState.status === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : 'Connect'}
          </button>
        </div>
        <p className={`text-xs mt-1 ${connectCode.length === 6 ? 'text-green-600' : 'text-muted-foreground'}`}>{connectCode.length}/6 characters</p>
        {connectState.status === 'error' && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{connectState.message}</p>
          </div>
        )}
        {connectState.status === 'already_pending' && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg">
            <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-700">Request already pending — waiting for them to accept.</p>
          </div>
        )}
        {connectState.status === 'success' && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">Request sent to {connectState.peerName}! They need to accept.</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        {([
          { id: 'friends' as const, label: `Friends (${friends.length})`, icon: Users },
          { id: 'requests' as const, label: `Requests`, icon: Bell, badge: inbox.length },
          { id: 'challenges' as const, label: `Challenges (${challenges.length})`, icon: Swords, badge: pendingChallenges.length },
          { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy },
        ]).map(({ id, label, icon: Icon, badge }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === id ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}>
            <Icon className="h-4 w-4" />
            {label}
            {badge && badge > 0 ? (
              <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">{badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── FRIENDS TAB ── */}
      {activeTab === 'friends' && (
        <div className="space-y-3">
          {loading ? (
            [1,2].map(i => <div key={i} className="border rounded-xl p-4 animate-pulse h-20 bg-gray-100 dark:bg-gray-800" />)
          ) : friends.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="No friends yet"
              description="Share your connect code or enter a peer's code above. Once they accept, they'll appear here with their stats."
            />
          ) : friends.map(friend => (
            <div key={friend.connectionId} className="border rounded-xl p-4 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="h-11 w-11 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-white text-lg">{friend.profile?.avatar_initial ?? '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{friend.profile?.display_name ?? 'Unknown'}</h3>
                    {friend.xp && (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                        Lv.{friend.xp.level} · {friend.xp.totalXp} XP
                      </span>
                    )}
                    {friend.xp && friend.xp.winStreak > 1 && (
                      <span className="flex items-center gap-0.5 text-xs text-orange-500 font-semibold">
                        <Flame className="h-3 w-3" />{friend.xp.winStreak} streak
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{friend.profile?.stream}</p>
                  {friend.profile?.skills && friend.profile.skills.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {friend.profile.skills.slice(0, 5).map(s => (
                        <span key={s} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">{s}</span>
                      ))}
                      {friend.profile.skills.length > 5 && (
                        <span className="text-xs px-1.5 py-0.5 text-muted-foreground">+{friend.profile.skills.length - 5}</span>
                      )}
                    </div>
                  )}
                  {friend.profile?.coding_profiles && friend.profile.coding_profiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {friend.profile.coding_profiles.map(cp => (
                        <div key={cp.platform} className="flex items-center gap-2 text-xs">
                          <span className="font-semibold capitalize text-purple-600 dark:text-purple-400">{cp.platform}:</span>
                          <span className="text-muted-foreground">{cp.solved_count} solved</span>
                          {cp.badge_name && <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded flex items-center gap-1"><Trophy className="h-3 w-3" /> {cp.badge_name}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {friend.activeChallenge && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1.5 flex items-center gap-1">
                      <Swords className="h-3 w-3" /> Active challenge: {friend.activeChallenge.title}
                    </p>
                  )}
                </div>
                <button onClick={() => setChallengeModal(friend)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0">
                  <Swords className="h-3.5 w-3.5" /> Challenge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── REQUESTS TAB ── */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {inbox.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Incoming ({inbox.length})</h3>
              <div className="space-y-3">
                {inbox.map(req => (
                  <div key={req.connectionId} className="border rounded-xl p-4 flex items-center gap-3">
                    <div className="h-10 w-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-white">{req.profile?.avatar_initial ?? '?'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{req.profile?.display_name ?? 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">{req.profile?.stream} · {req.profile?.connect_code}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => respondToRequest(req.connectionId, 'accept')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium">
                        <UserCheck className="h-3.5 w-3.5" /> Accept
                      </button>
                      <button onClick={() => respondToRequest(req.connectionId, 'decline')}
                        className="flex items-center gap-1 px-3 py-1.5 border hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-xs">
                        <UserX className="h-3.5 w-3.5" /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {outgoing.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sent — Waiting ({outgoing.length})</h3>
              <div className="space-y-2">
                {outgoing.map(req => (
                  <div key={req.connectionId} className="border rounded-xl p-3 flex items-center gap-3 opacity-70">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm flex-1">
                      Sent to <strong>{req.profile?.display_name ?? req.receiverId}</strong>
                      {req.profile?.connect_code ? ` (${req.profile.connect_code})` : ''}
                    </p>
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 px-2 py-0.5 rounded-full">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inbox.length === 0 && outgoing.length === 0 && (
            <EmptyState
              icon={<Bell className="h-10 w-10" />}
              title="No pending requests"
              description="Share your code to get incoming requests, or use the connect input above."
            />
          )}
        </div>
      )}

      {/* ── CHALLENGES TAB ── */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          {/* Pending — needs response */}
          {pendingChallenges.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Waiting for your response ({pendingChallenges.length})</h3>
              <div className="space-y-3">
                {pendingChallenges.map(c => (
                  <div key={c.id} className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/10 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{challengeIcon(c.challenge_type)}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{challengeLabel(c.challenge_type)} · Target: {c.target_value}</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                          From {c.peerProfile?.display_name ?? 'Unknown'} · +{c.xp_reward} XP
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => respondToChallenge(c.id, 'accept')}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium">Accept</button>
                        <button onClick={() => respondToChallenge(c.id, 'decline')}
                          className="px-3 py-1.5 border hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-xs">Decline</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active */}
          {activeChallenges.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">In Progress ({activeChallenges.length})</h3>
              <div className="space-y-3">
                {activeChallenges.map(c => {
                  const myCompleted = c.isCreator ? c.creator_completed : c.opponent_completed
                  return (
                    <div key={c.id} className="border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/10 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{challengeIcon(c.challenge_type)}</span>
                        <div className="flex-1">
                          <p className="font-semibold">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{challengeLabel(c.challenge_type)} · vs {c.peerProfile?.display_name}</p>
                          {c.deadline && (
                            <p className="text-xs text-muted-foreground mt-0.5">⏰ Deadline: {new Date(c.deadline).toLocaleDateString()}</p>
                          )}
                          <div className="flex gap-4 mt-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${myCompleted ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'}`}>
                              You: {myCompleted ? '✓ Done' : 'Pending'}
                            </span>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800">
                              Them: {(c.isCreator ? c.opponent_completed : c.creator_completed) ? '✓ Done' : 'Pending'}
                            </span>
                          </div>
                        </div>
                        {!myCompleted && (
                          <button onClick={() => setSubmitModal(c)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium flex-shrink-0">
                            <Target className="h-3.5 w-3.5" /> Submit
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedChallenges.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Completed ({completedChallenges.length})</h3>
              <div className="space-y-2">
                {completedChallenges.map(c => {
                  const iWon = c.winner_id === (c.isCreator ? c.creator_id : c.opponent_id)
                  return (
                    <div key={c.id} className={`border rounded-xl p-3 flex items-center gap-3 ${c.status === 'declined' ? 'opacity-50' : ''}`}>
                      <span>{challengeIcon(c.challenge_type)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground">vs {c.peerProfile?.display_name}</p>
                      </div>
                      {c.status === 'completed' && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${iWon ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'}`}>
                          {iWon ? '🏆 Won' : 'Lost'}
                        </span>
                      )}
                      {c.status === 'declined' && <span className="text-xs text-muted-foreground">Declined</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {challenges.length === 0 && (
            <EmptyState
              icon={<Swords className="h-10 w-10" />}
              title="No challenges yet"
              description="Go to the Friends tab and challenge a connected friend to a LeetCode duel, streak war, or badge race!"
            />
          )}
        </div>
      )}

      {/* ── LEADERBOARD TAB ── */}
      {activeTab === 'leaderboard' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="font-semibold">XP Leaderboard (You + Friends)</h2>
          </div>
          {leaderboard.length <= 1 && !myXp ? (
            <EmptyState
              icon={<Trophy className="h-10 w-10" />}
              title="No leaderboard yet"
              description="Connect with friends and complete challenges to see who ranks highest!"
            />
          ) : (
            <div className="space-y-2">
              {(leaderboard as NonNullable<typeof leaderboard[0]>[]).map((entry, i) => (
                <div key={i} className={`border rounded-xl p-4 flex items-center gap-4 ${entry.isMe ? 'border-purple-300 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{entry.name}{entry.isMe ? ' (You)' : ''}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">Lv.{getLevel(entry.xp)} {getLevelTitle(getLevel(entry.xp))}</span>
                      <span className="text-xs text-muted-foreground">🏆 {entry.won} wins</span>
                      {entry.streak > 1 && <span className="text-xs text-orange-500">🔥 {entry.streak} streak</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-bold">{entry.xp}</span>
                    <span className="text-xs text-muted-foreground">XP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
