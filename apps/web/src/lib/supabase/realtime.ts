"use client";

/**
 * Generic Supabase Realtime helpers — the first real-time infrastructure
 * in this app (everything before this used polling/manual refresh).
 *
 * Deliberately NOT room-specific: Study Rooms is the first consumer, but
 * these are written so Duels (Phase 2) and Accountability Partners
 * (Phase 3) can reuse the same presence/broadcast primitives instead of
 * each feature growing its own ad-hoc channel logic.
 *
 * Reconnection: a Supabase RealtimeChannel already auto-reconnects at the
 * socket level. What it does NOT do is replay state that changed while
 * disconnected — callers are responsible for re-fetching (e.g. last 20
 * messages, current member list) in their onReconnect handler, per the
 * "reconnect gracefully" rule in the Peer Collaboration Dashboard spec.
 */

import { createClient } from "./client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type PresenceState<T> = Record<string, T[]>;

export interface PresenceHandlers<T> {
  onSync?: (state: PresenceState<T>) => void;
  onJoin?: (key: string, newPresences: T[]) => void;
  onLeave?: (key: string, leftPresences: T[]) => void;
  /** Fired when the channel reconnects after a drop — re-fetch anything
   * that may have changed while disconnected (messages, member list). */
  onReconnect?: () => void;
}

/**
 * Subscribe to a Presence channel. Returns the channel so the caller can
 * call `.track(state)` once subscribed, and an `unsubscribe()` cleanup.
 *
 * Usage:
 *   const { channel, unsubscribe } = subscribeToPresence(`room:${roomId}:presence`, {
 *     onSync: (state) => setMembers(Object.values(state).flat()),
 *   });
 *   channel.subscribe((status) => {
 *     if (status === "SUBSCRIBED") trackPresence(channel, { userId, status: "studying" });
 *   });
 */
export function subscribeToPresence<T extends Record<string, unknown>>(
  channelName: string,
  handlers: PresenceHandlers<T>
): { channel: RealtimeChannel; unsubscribe: () => void } {
  const supabase = createClient();
  const channel = supabase.channel(channelName, {
    config: { presence: { key: crypto.randomUUID() } },
  });

  let hasConnectedBefore = false;

  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<T>();
      handlers.onSync?.(state as PresenceState<T>);
    })
    .on("presence", { event: "join" }, ({ key, newPresences }) => {
      handlers.onJoin?.(key, newPresences as unknown as T[]);
    })
    .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
      handlers.onLeave?.(key, leftPresences as unknown as T[]);
    });

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      if (hasConnectedBefore) handlers.onReconnect?.();
      hasConnectedBefore = true;
    }
  });

  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
}

/** Track this client's presence state on an already-subscribed channel. */
export async function trackPresence<T extends Record<string, unknown>>(
  channel: RealtimeChannel,
  state: T
): Promise<void> {
  await channel.track(state);
}

/**
 * Subscribe to broadcast events on a channel (chat messages, notes edits,
 * timer sync — anything that isn't presence). Returns cleanup.
 *
 * Usage:
 *   const unsubscribe = subscribeToBroadcast<ChatMessage>(
 *     `room:${roomId}:messages`, "new_message",
 *     (msg) => setMessages((prev) => [...prev, msg])
 *   );
 */
export function subscribeToBroadcast<T>(
  channelName: string,
  event: string,
  handler: (payload: T) => void
): () => void {
  const supabase = createClient();
  const channel = supabase.channel(channelName);

  channel
    .on("broadcast", { event }, ({ payload }) => {
      handler(payload as T);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/** Send a broadcast event on a channel. Opens a short-lived channel,
 * sends, and cleans up — use for infrequent one-off sends (a chat message,
 * a status change). For high-frequency sends, keep a channel reference
 * via subscribeToBroadcast's returned channel instead.
 *
 * Client-side only — API routes should NOT call this (the browser client
 * factory this relies on isn't meaningful in a server/Node context). For
 * server-persisted data (messages, room state), prefer
 * `subscribeToTableChanges` below: the client subscribes directly to the
 * Postgres row change, so the server never needs to broadcast anything. */
export async function sendBroadcast<T>(
  channelName: string,
  event: string,
  payload: T
): Promise<void> {
  const supabase = createClient();
  const channel = supabase.channel(channelName);
  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") resolve();
    });
  });
  await channel.send({ type: "broadcast", event, payload });
  supabase.removeChannel(channel);
}

/**
 * Subscribe to Postgres row changes (insert/update/delete) on a table,
 * filtered to one row/group (e.g. `room_id=eq.<id>`). This is the
 * preferred way for a server-persisted write (a chat message insert, a
 * room's session_data update) to reach connected clients — no manual
 * broadcast call needed from the API route that performed the write.
 *
 * Usage:
 *   const unsubscribe = subscribeToTableChanges<StudyRoomMessage>(
 *     "study_room_messages", `room_id=eq.${roomId}`, "INSERT",
 *     (row) => setMessages((prev) => [...prev, row])
 *   );
 */
export function subscribeToTableChanges<T extends object>(
  table: string,
  filter: string,
  event: "INSERT" | "UPDATE" | "DELETE" | "*",
  handler: (row: T) => void
): () => void {
  const supabase = createClient();
  const channel = supabase
    .channel(`table:${table}:${filter}`)
    .on(
      "postgres_changes" as never,
      { event, schema: "public", table, filter } as never,
      (payload: { new: T }) => handler(payload.new)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function roomPresenceChannel(roomId: string): string {
  return `room:${roomId}:presence`;
}

export function roomMessagesChannel(roomId: string): string {
  return `room:${roomId}:messages`;
}

export function roomNotesChannel(roomId: string): string {
  return `room:${roomId}:notes`;
}

export function roomTimerChannel(roomId: string): string {
  return `room:${roomId}:timer`;
}
