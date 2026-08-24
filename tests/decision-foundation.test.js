/* eslint-disable @typescript-eslint/no-require-imports */
require('sucrase/register/ts');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const originalResolveFilename = Module._resolveFilename;
const originalLoad = Module._load;
Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    return originalResolveFilename.call(
      this,
      path.join(root, 'src', request.slice(2)),
      parent,
      isMain,
      options
    );
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
Module._load = function loadWithCredentiallessMocks(request, parent, isMain) {
  if (request === '@/lib/openai') {
    return {
      openai: {
        embeddings: {
          create: async () => ({ data: [{ embedding: [] }] }),
        },
      },
      sanitize: (value) => String(value ?? ''),
    };
  }
  if (request === '@/lib/redis') {
    return {
      redis: {
        get: async () => null,
        set: async () => undefined,
        del: async () => undefined,
      },
      withFallback: async (fn, fallback) => {
        try {
          return await fn();
        } catch {
          return fallback;
        }
      },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const {
  computeExplainablePriority,
} = require('../src/lib/scoring/explainable-priority.ts');
const {
  normalizeCountryCode,
  resolveAcademicSystem,
  getDefaultLocaleContext,
} = require('../src/lib/context/global-config.ts');
const {
  normalizeJobOpportunity,
  contentHash,
} = require('../src/lib/opportunities/normalize.ts');
const {
  matchOpportunityToUser,
} = require('../src/lib/opportunities/matching.ts');
const {
  analyzeSkillGaps,
} = require('../src/lib/skills/skill-gap.ts');
const {
  retrieveContextDocuments,
} = require('../src/lib/rag/retrieval.ts');

function baseContext(overrides = {}) {
  return {
    userId: 'user-1',
    profile: {
      name: null,
      college: null,
      stream: 'computer science',
      semester: 5,
      subjects: [],
      cgpa: null,
      targetRoles: ['Fullstack Developer'],
      targetCompanies: ['Acme'],
      careerGoals: ['backend internship'],
      ...overrides.profile,
    },
    locale: {
      country: 'US',
      region: null,
      locale: 'en-US',
      timezone: 'America/New_York',
      language: 'en',
      currency: 'USD',
      ...overrides.locale,
    },
    academic: {
      academicSystem: 'us_semester',
      termSystem: 'semester',
      gradingSystem: 'gpa_4',
      activeTerms: [],
      courses: [],
      upcomingExams: [],
    },
    workCapacity: {
      availableHoursPerWeek: 20,
      preferredWorkStart: null,
      preferredWorkEnd: null,
    },
    tasks: {
      pending: [],
      recentlyCompleted: [],
      overdueCount: 0,
      dueSoonCount: 0,
    },
    coding: {
      github: { languages: { TypeScript: 1000 } },
      leetcode: null,
      hackerrank: null,
    },
    career: {
      latestResume: null,
      projects: [
        { id: 'p1', title: 'API Platform', tech_stack: ['TypeScript', 'React', 'SQL'] },
      ],
      applications: [],
      opportunityInteractions: [],
      skills: ['TypeScript', 'React', 'SQL', 'Git'],
      ...overrides.career,
    },
    feedback: { recentEvents: [] },
    ...overrides,
  };
}

test('explainable priority treats overdue work as high deadline risk', () => {
  const yesterday = new Date(Date.now() - 86_400_000).toISOString();
  const result = computeExplainablePriority({
    type: 'assignment',
    title: 'Submit database report',
    due_at: yesterday,
    weightage: 40,
  });

  assert.equal(result.deadlineRisk, 'overdue');
  assert.ok(result.score >= 60, `expected overdue score to remain high, got ${result.score}`);
  assert.ok(result.reasons.some((reason) => reason.includes('deadline has passed')));
});

test('global country aliases resolve to expected academic defaults', () => {
  assert.equal(normalizeCountryCode('IND'), 'IND');
  assert.equal(normalizeCountryCode('India'), 'IN');
  assert.equal(normalizeCountryCode('USA'), 'US');
  assert.equal(normalizeCountryCode('United Kingdom'), 'GB');
  assert.equal(resolveAcademicSystem(null, 'US').key, 'us_semester');
  assert.equal(resolveAcademicSystem(null, 'UK').key, 'uk_terms');
  assert.deepEqual(getDefaultLocaleContext('USA'), {
    country: 'US',
    timezone: 'America/New_York',
    locale: 'en-US',
    currency: 'USD',
    academicSystem: 'us_semester',
    termSystem: 'semester',
    gradingSystem: 'gpa_4',
  });
});

test('opportunity normalization is deterministic and extracts obvious skills', () => {
  const raw = {
    id: 'job-1',
    title: 'React TypeScript Intern',
    company_name: 'Acme',
    description: 'Build React and Node.js dashboards with PostgreSQL.',
    url: 'https://example.com/apply',
    location: 'Remote',
    country: 'US',
  };
  const first = normalizeJobOpportunity(raw, 'test-source');
  const second = normalizeJobOpportunity(raw, 'test-source');

  assert.equal(first.title, 'React TypeScript Intern');
  assert.equal(first.remotePolicy, 'remote');
  assert.ok(first.requiredSkills.includes('react'));
  assert.ok(first.requiredSkills.includes('typescript'));
  assert.ok(first.requiredSkills.includes('node.js'));
  assert.equal(contentHash(first), contentHash(second));
});

test('opportunity matching is explainable and surfaces missing skills', () => {
  const context = baseContext();
  const opportunity = normalizeJobOpportunity({
    id: 'job-2',
    title: 'Fullstack Developer Intern',
    company: 'Acme Labs',
    description: 'React TypeScript SQL Docker role.',
    url: 'https://example.com/apply',
    country: 'US',
    deadline: new Date(Date.now() + 2 * 86_400_000).toISOString(),
  }, 'test-source');

  const result = matchOpportunityToUser(opportunity, context);

  assert.ok(result.score > 50);
  assert.ok(result.strongMatches.includes('typescript'));
  assert.ok(result.missingSkills.includes('docker'));
  assert.ok(result.reasons.length > 0);
  assert.ok(result.recommendedActions.some((action) => action.toLowerCase().includes('docker')));
});

test('skill gap analysis uses goals and opportunity requirements without inventing proficiency', () => {
  const context = baseContext({
    career: {
      skills: ['React', 'TypeScript'],
      projects: [],
      opportunityInteractions: [
        {
          event_type: 'saved',
          opportunities: {
            required_skills: ['Docker', 'AWS'],
            preferred_skills: ['Kubernetes'],
          },
        },
      ],
    },
  });

  const result = analyzeSkillGaps(context);

  assert.ok(result.currentSkills.includes('react'));
  assert.ok(result.requiredSkills.includes('docker'));
  assert.ok(result.missingSkills.includes('docker'));
  assert.ok(result.recommendedActions.some((action) => action.skill === 'docker'));
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'proficiency'), false);
});

test('RAG lexical fallback is bounded and honors relevance threshold behavior without OpenAI', async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const rows = [
    {
      id: '1',
      source_type: 'resume',
      source_id: 'resume-1',
      title: 'Backend Resume',
      content_preview: 'TypeScript React SQL internship experience',
      metadata: {},
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      source_type: 'project',
      source_id: 'project-1',
      title: 'Unrelated',
      content_preview: 'Painting and music notes',
      metadata: {},
      created_at: new Date().toISOString(),
    },
  ];

  const db = {
    from() {
      const builder = {
        select() { return this; },
        eq() { return this; },
        order() { return this; },
        limit() { return this; },
        then(resolve) { return Promise.resolve({ data: rows }).then(resolve); },
      };
      return builder;
    },
  };

  const result = await retrieveContextDocuments(db, 'user-1', 'typescript sql', { limit: 1 });

  if (previousKey) process.env.OPENAI_API_KEY = previousKey;

  assert.equal(result.semantic, false);
  assert.equal(result.reason, 'openai_not_configured');
  assert.equal(result.documents.length, 1);
  assert.equal(result.documents[0].id, '1');
  assert.ok((result.documents[0].similarity ?? 0) > 0);
});

test('assistant health route does not expose provider or service-role configuration', () => {
  const source = fs.readFileSync(
    path.join(root, 'src/app/api/assistant/health/route.ts'),
    'utf8'
  );

  assert.equal(source.includes('OPENAI_API_KEY'), false);
  assert.equal(source.includes('NEXT_PUBLIC_SUPABASE_URL'), false);
  assert.equal(source.includes('SUPABASE_SERVICE_ROLE_KEY'), false);
  assert.equal(source.includes('service_role'), false);
});

test('generic Supabase server client never falls back to service-role credentials', () => {
  const source = fs.readFileSync(path.join(root, 'src/lib/supabase/server.ts'), 'utf8');
  const createClientSource = source.slice(
    source.indexOf('export function createClient()'),
    source.indexOf('// Service role client')
  );

  assert.equal(createClientSource.includes('SUPABASE_SERVICE_ROLE_KEY'), false);
  assert.ok(createClientSource.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
});

test('MCP tokens are stored and verified as hashes', () => {
  const tokenRoute = fs.readFileSync(
    path.join(root, 'src/app/api/mcp/token/route.ts'),
    'utf8'
  );
  const mcpRoute = fs.readFileSync(path.join(root, 'src/app/api/mcp/route.ts'), 'utf8');

  assert.ok(tokenRoute.includes("createHash('sha256')"));
  assert.ok(tokenRoute.includes('token_hash: hashMcpToken(token)'));
  assert.equal(tokenRoute.includes('token_hash: token'), false);
  assert.ok(mcpRoute.includes('const hashedToken = hashMcpToken(bearerToken);'));
  assert.ok(mcpRoute.includes(".eq('token_hash', hashedToken)"));
});

test('learning route is protected by auth middleware', () => {
  const source = fs.readFileSync(path.join(root, 'src/lib/supabase/middleware.ts'), 'utf8');

  assert.ok(source.includes("'/learning'"));
});
