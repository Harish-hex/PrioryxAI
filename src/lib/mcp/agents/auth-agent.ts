// Auth Agent — session verification, profile management, permissions
import type { AgentModule, ToolResult } from '../types';
import { createClient } from '@/lib/supabase/server';

async function verifyUserSession(
  _input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.id !== userId) {
    return { success: false, data: null, error: 'Invalid session' };
  }
  return {
    success: true,
    data: { userId: user.id, email: user.email, verified: true },
  };
}

async function getUserProfile(
  _input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return { success: false, data: null, error: error.message };
  return { success: true, data: data as Record<string, unknown> };
}

async function updateUserPermissions(
  input: Record<string, unknown>,
  userId: string
): Promise<ToolResult> {
  const supabase = createClient();
  const updates: Record<string, unknown> = {};
  if (input.target_roles) updates.target_roles = input.target_roles;
  if (input.target_companies) updates.target_companies = input.target_companies;
  if (input.career_timeline) updates.career_timeline = input.career_timeline;

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);

  if (error) return { success: false, data: null, error: error.message };
  return { success: true, data: { updated: true } };
}

async function linkOAuthProvider(
  input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  // OAuth linking is handled by Supabase Auth client-side; this is a no-op wrapper
  return {
    success: true,
    data: { provider: input.provider, message: 'Use client-side Supabase auth flow' },
  };
}

async function refreshToken(
  _input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.refreshSession();
  if (error) return { success: false, data: null, error: error.message };
  return {
    success: true,
    data: { expiresAt: data.session?.expires_at },
  };
}

async function revokeAccess(
  _input: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, data: null, error: error.message };
  return { success: true, data: { revoked: true } };
}

export const authAgent: AgentModule = {
  name: 'Auth Agent',
  prefix: 'auth',
  tools: [
    {
      name: 'verifyUserSession',
      description: 'Verify the current user session is valid',
      inputSchema: {},
      handler: verifyUserSession,
    },
    {
      name: 'getUserProfile',
      description: 'Fetch full user profile from database',
      inputSchema: {},
      handler: getUserProfile,
    },
    {
      name: 'updateUserPermissions',
      description: 'Update user career preferences and permissions',
      inputSchema: {
        type: 'object',
        properties: {
          target_roles: { type: 'array', items: { type: 'string' } },
          target_companies: { type: 'array', items: { type: 'string' } },
          career_timeline: { type: 'string' },
        },
      },
      handler: updateUserPermissions,
    },
    {
      name: 'linkOAuthProvider',
      description: 'Link an OAuth provider to the account',
      inputSchema: { type: 'object', properties: { provider: { type: 'string' } } },
      handler: linkOAuthProvider,
    },
    {
      name: 'refreshToken',
      description: 'Refresh the current auth session token',
      inputSchema: {},
      handler: refreshToken,
    },
    {
      name: 'revokeAccess',
      description: 'Sign out and revoke the current session',
      inputSchema: {},
      handler: revokeAccess,
    },
  ],
};
