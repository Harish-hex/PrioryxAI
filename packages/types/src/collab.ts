/**
 * Peer Collaboration Dashboard — shared types.
 *
 * Phase 1 (Study Rooms). Mirrors the real, live schema:
 *   - study_rooms / study_room_members / study_room_messages
 *     (supabase/migrations/20260916100000_study_rooms.sql)
 *   - peer_connections (existing table, extended with connection_type
 *     in the same migration — NOT a new/parallel connections table)
 *
 * These are intentionally plain, camelCase interfaces (matching the
 * style of career-graph.ts) rather than 1:1 snake_case DB row types —
 * API routes map DB rows to these shapes before returning to the client.
 */

export type StudyRoomType =
  | "open_study"
  | "dsa_sprint"
  | "project_review"
  | "mock_interview"
  | "accountability";

export type StudyRoomStatus = "active" | "ended" | "scheduled";

export type RoomMemberRole = "host" | "co_host" | "member";

export type RoomPresenceStatus = "studying" | "away" | "stuck";

export interface StudyRoom {
  id: string;
  code: string;
  name: string;
  description: string | null;
  hostId: string;
  roomType: StudyRoomType;
  focusTopic: string | null;
  maxMembers: number;
  isPrivate: boolean;
  status: StudyRoomStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  sessionData: {
    notes?: string;
    timer?: RoomTimerState;
    [key: string]: unknown;
  };
  collegeDomain: string | null;
  tags: string[];
  createdAt: string;
  /** Populated by the API layer, not a DB column. */
  memberCount?: number;
}

export interface RoomTimerState {
  mode: "work" | "break";
  durationSeconds: number;
  startedAt: string | null;
  isPaused: boolean;
}

export interface StudyRoomMember {
  id: string;
  roomId: string;
  userId: string;
  role: RoomMemberRole;
  joinedAt: string;
  leftAt: string | null;
  isActive: boolean;
  presenceData: {
    status?: RoomPresenceStatus;
    lastSeen?: string;
  };
  /** Populated by the API layer via a join, not a DB column. */
  displayName?: string;
  avatarInitial?: string;
  careerGoal?: string;
}

export type RoomMessageType = "text" | "code" | "link" | "problem" | "system";

export interface StudyRoomMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  messageType: RoomMessageType;
  metadata: {
    language?: string;
    snippet?: string;
    url?: string;
    title?: string;
    leetcodeId?: string;
    difficulty?: string;
  };
  createdAt: string;
  /** Populated by the API layer, not a DB column. */
  displayName?: string;
}

export type PeerConnectionStatus = "pending" | "accepted" | "declined" | "blocked";

/** connection_type added to the real peer_connections table by
 * supabase/migrations/20260916100000_study_rooms.sql */
export type PeerConnectionType = "peer" | "accountability_partner" | "study_buddy" | "mentor";

export interface PeerConnection {
  id: string;
  requesterId: string;
  receiverId: string;
  status: PeerConnectionStatus;
  connectionType: PeerConnectionType;
  message: string;
  createdAt: string;
  acceptedAt: string | null;
}
