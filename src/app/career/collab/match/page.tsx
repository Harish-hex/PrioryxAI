'use client'
import { useState, useEffect } from 'react'
import { Copy, Check, Loader2, Users, AlertCircle,
         CheckCircle, Clock } from 'lucide-react'

interface PeerProfile {
  user_id: string
  display_name: string
  avatar_initial: string
  connect_code: string
  stream: string
  skills: string[]
  placement_score: number
}

interface ConnectionResult {
  success: boolean
  message?: string
  error?: string
  peer?: {
    displayName: string
    avatarInitial: string
    stream: string
    connectCode: string
  }
}

type ConnectState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; peer: NonNullable<ConnectionResult['peer']>; message: string }
  | { status: 'error'; message: string }
  | { status: 'already_connected'; message: string }

export default function CollabMatchPage() {
  const [myProfile, setMyProfile] = useState<PeerProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [connectCode, setConnectCode] = useState('')
  const [connectState, setConnectState] = useState<ConnectState>({ status: 'idle' })
  const [copied, setCopied] = useState(false)
  const [peers, setPeers] = useState<PeerProfile[]>([])

  // On mount: ensure peer profile exists, then load data
  useEffect(() => {
    async function init() {
      setProfileLoading(true)
      try {
        // STEP 1: Ensure peer_profiles row exists for current user
        const ensureRes = await fetch('/api/career/collab/ensure-profile', {
          method: 'POST'
        })
        const ensureJson = await ensureRes.json()

        if (ensureJson.profile) {
          setMyProfile(ensureJson.profile)
          console.log('[Collab] My connect code:', ensureJson.profile.connect_code)
        } else {
          console.error('[Collab] Failed to ensure profile:', ensureJson.error)
        }

        // STEP 2: Load matched peers
        const peersRes = await fetch('/api/career/collab/peers')
        if (peersRes.ok) {
          const peersJson = await peersRes.json()
          setPeers(peersJson.peers ?? [])
        }

      } catch (e) {
        console.error('[Collab] Init error:', e)
      } finally {
        setProfileLoading(false)
      }
    }

    init()
  }, [])

  async function handleConnect() {
    const code = connectCode.trim().toUpperCase()

    if (!code) {
      setConnectState({ status: 'error', message: 'Please enter a connect code.' })
      return
    }
    if (code.length < 4) {
      setConnectState({
        status: 'error',
        message: 'Connect codes are 6 characters. Check you\'ve copied it correctly.'
      })
      return
    }
    if (myProfile && code === myProfile.connect_code) {
      setConnectState({ status: 'error', message: 'That\'s your own code! Share it with a peer.' })
      return
    }

    setConnectState({ status: 'loading' })

    try {
      const res = await fetch('/api/career/collab/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })

      const json: ConnectionResult = await res.json()

      if (res.status === 409) {
        setConnectState({
          status: 'already_connected',
          message: json.error ?? 'Already connected.'
        })
        return
      }

      if (!res.ok || json.error) {
        setConnectState({
          status: 'error',
          message: json.error ?? 'Connection failed. Please try again.'
        })
        return
      }

      setConnectState({
        status: 'success',
        peer: json.peer!,
        message: json.message ?? 'Connected!'
      })

      // Clear input on success
      setConnectCode('')

      // Refresh peers list
      const peersRes = await fetch('/api/career/collab/peers')
      if (peersRes.ok) {
        const peersJson = await peersRes.json()
        setPeers(peersJson.peers ?? [])
      }

    } catch {
      setConnectState({
        status: 'error',
        message: 'Network error. Check your connection and try again.'
      })
    }
  }

  function handleCopyCode() {
    if (!myProfile?.connect_code) return
    navigator.clipboard.writeText(myProfile.connect_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6 text-purple-500" />
        <div>
          <h1 className="text-2xl font-semibold">Peer Collaboration</h1>
          <p className="text-sm text-muted-foreground">
            Find peers with complementary skills for pair programming sessions
          </p>
        </div>
      </div>

      {/* Your connect code card */}
      <div className="border-2 border-blue-200 dark:border-blue-800
        bg-blue-50 dark:bg-blue-950/20 rounded-xl p-5 mb-4">
        {profileLoading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-sm text-blue-600">Setting up your profile...</span>
          </div>
        ) : myProfile ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                Your Connect Code
              </p>
              <p className="text-3xl font-bold font-mono tracking-[0.2em]
                text-blue-900 dark:text-blue-100">
                {myProfile.connect_code}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5">
                Share this code with classmates so they can connect with you
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl
                font-medium text-sm transition-all flex-shrink-0 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}>
              {copied
                ? <><Check className="h-4 w-4" /> Copied!</>
                : <><Copy className="h-4 w-4" /> Copy Code</>
              }
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-600">
                Could not load your profile
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Please refresh the page or check your connection
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto text-sm text-blue-500 hover:underline">
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Connect by code */}
      <div className="border rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-3">Connect with a Peer</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Enter your peer's 6-character connect code to send them a
          connection request.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={connectCode}
            onChange={e => {
              // Allow alphanumeric only, max 6 chars, auto-uppercase
              const cleaned = e.target.value
                .replace(/[^A-Za-z0-9]/g, '')
                .toUpperCase()
                .slice(0, 6)
              setConnectCode(cleaned)
              // Clear previous state when typing
              if (connectState.status !== 'idle') {
                setConnectState({ status: 'idle' })
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && connectCode.length >= 4) {
                handleConnect()
              }
            }}
            placeholder="Enter peer's code (e.g. YUG4K2)"
            maxLength={6}
            className="flex-1 border-2 rounded-xl px-4 py-2.5 text-sm
              font-mono tracking-[0.15em] uppercase placeholder:normal-case
              placeholder:tracking-normal focus:outline-none focus:border-blue-500
              dark:bg-gray-900 dark:border-gray-700 transition-colors"
          />
          <button
            onClick={handleConnect}
            disabled={connectState.status === 'loading' || connectCode.length < 4}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50
              disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium
              transition-colors flex items-center gap-2 flex-shrink-0">
            {connectState.status === 'loading'
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Connecting...</>
              : 'Connect'
            }
          </button>
        </div>

        {/* Character counter */}
        <p className={`text-xs mt-1.5 ${
          connectCode.length === 6 ? 'text-green-600' : 'text-muted-foreground'
        }`}>
          {connectCode.length}/6 characters
        </p>

        {/* Status messages */}
        {connectState.status === 'error' && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-red-50
            dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">
              {connectState.message}
            </p>
          </div>
        )}

        {connectState.status === 'already_connected' && (
          <div className="mt-3 flex items-start gap-2 p-3 bg-yellow-50
            dark:bg-yellow-950/20 border border-yellow-200 rounded-lg">
            <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {connectState.message}
            </p>
          </div>
        )}

        {connectState.status === 'success' && (
          <div className="mt-3 p-4 bg-green-50 dark:bg-green-950/20
            border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                {connectState.message}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-200 dark:bg-green-800 rounded-full
                flex items-center justify-center text-green-700 dark:text-green-300
                font-semibold text-sm">
                {connectState.peer.avatarInitial}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {connectState.peer.displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {connectState.peer.stream}
                </p>
              </div>
              <span className="ml-auto text-xs font-mono text-muted-foreground">
                {connectState.peer.connectCode}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AI Matched Peers */}
      <div>
        <h2 className="font-semibold mb-4">AI-Matched Peers</h2>

        {peers.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200
            dark:border-gray-700 rounded-xl p-10 text-center">
            <Users className="h-10 w-10 text-gray-300 dark:text-gray-600
              mx-auto mb-3" />
            <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-1">
              No peer matches yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Complete your profile (add skills, target companies) to get
              matched with peers who have complementary skills.
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <a href="/settings"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg
                  text-sm font-medium hover:bg-blue-600">
                Complete Profile
              </a>
              <a href="/career/resume/upload"
                className="px-4 py-2 border rounded-lg text-sm font-medium
                  hover:bg-gray-50 dark:hover:bg-gray-800">
                Upload Resume
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {peers.map(peer => (
              <PeerCard
                key={peer.user_id}
                peer={peer}
                onConnect={() => {
                  setConnectCode(peer.connect_code)
                  handleConnect()
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PeerCard({
  peer,
  onConnect
}: {
  peer: PeerProfile
  onConnect: () => void
}) {
  return (
    <div className="border rounded-xl p-4 hover:border-blue-300
      dark:hover:border-blue-700 transition-colors">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30
          rounded-full flex items-center justify-center flex-shrink-0">
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {peer.avatar_initial}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">{peer.display_name}</h3>
            <span className="text-xs text-muted-foreground font-mono">
              {peer.connect_code}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{peer.stream}</p>
          {peer.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {peer.skills.slice(0, 4).map(skill => (
                <span key={skill}
                  className="text-xs px-1.5 py-0.5 bg-gray-100
                    dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onConnect}
          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white
            rounded-lg text-xs font-medium transition-colors flex-shrink-0">
          Connect
        </button>
      </div>
    </div>
  )
}
