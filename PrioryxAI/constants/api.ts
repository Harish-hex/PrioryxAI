export const API_BASE = process.env.EXPO_PUBLIC_API_BASE 
  ? `${process.env.EXPO_PUBLIC_API_BASE.replace(/\/$/, '')}/api`
  : 'https://www.prioryxai.in/api';

export const API_ENDPOINTS = {
  // Auth & Profile
  profile: '/profile',
  userProfile: '/user/profile',
  userStatus: '/user/status',
  onboard: '/user/onboard',
  
  // Tasks
  tasks: '/tasks',
  priority: '/priority',
  priorityToday: '/priority/today',
  
  // AI Assistant
  assistant: '/assistant',
  
  // Resume & Career
  resumeUpload: '/career/resume/upload',
  resumeSaved: '/career/resume/saved',
  resumeSwot: '/career/resume/swot',
  
  // Project Foundry
  foundryGenerate: '/foundry/generate',
  foundryIdeas: '/projects/ideas',
  
  // Coding & GitHub
  codingUnified: '/platforms/unified',
  codingConnect: '/coding/connect',
  codingRecommendations: '/coding/recommendations',
  githubAnalyze: '/github/analyse',
  githubSync: '/sync/github',
  
  // Jobs & Collab
  jobs: '/career/market/jobs',
  opportunities: '/opportunities',
  opportunityMatch: '/opportunities/match',
  collabFriends: '/career/collab/friends',
  collabChallenges: '/career/collab/challenges',
  collabLeaderboard: '/career/collab/leaderboard',
  collabNotifications: '/career/collab/notifications',
  
  // Payments
  createOrder: '/payments/subscribe',
  verifyPayment: '/payments/verify',
  
  // Learning & YouTube
  youtubeRecommendations: '/youtube/recommendations',
  youtubeSearch: '/youtube/search',
  
  // Schedule
  processTimetable: '/schedule/process-timetable',
  processExam: '/schedule/process-exam',

  // Personalized decision engine
  mobileBootstrap: '/mobile/bootstrap',
  userContext: '/user/context',
  feedback: '/feedback',
  skillGaps: '/skills/gaps',
  planningOverview: '/planning/overview',
  ragIndex: '/rag/index',
  ragSearch: '/rag/search',
};
