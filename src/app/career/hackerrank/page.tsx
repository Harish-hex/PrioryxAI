'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StreamSelector } from '@/components/leetcode/StreamSelector';
import { Loader2, CheckCircle2, XCircle, ExternalLink, Award, Code2 } from 'lucide-react';
import { UserStream } from '@/lib/leetcode/types';

const CERTIFICATIONS = [
  {
    name: 'Problem Solving',
    level: 'Basic → Advanced',
    why: 'Used in every SDE screening round',
    priority: 'CRITICAL' as const,
    url: 'https://www.hackerrank.com/skills-verification/problem_solving_basic',
  },
  {
    name: 'Python',
    level: 'Basic → Intermediate',
    why: 'Required for ML/Data Science roles',
    priority: 'HIGH' as const,
    url: 'https://www.hackerrank.com/skills-verification/python_basic',
  },
  {
    name: 'SQL',
    level: 'Basic → Advanced',
    why: 'Every backend & data role needs this',
    priority: 'HIGH' as const,
    url: 'https://www.hackerrank.com/skills-verification/sql_basic',
  },
  {
    name: 'Java / JavaScript',
    level: 'Basic',
    why: 'Language-specific screening at top companies',
    priority: 'MEDIUM' as const,
    url: 'https://www.hackerrank.com/skills-verification/java_basic',
  },
];

const PRACTICE_DOMAINS = [
  { domain: 'Algorithms', problems: '500+', link: 'https://www.hackerrank.com/domains/algorithms', relevance: 'Core for all SDE roles' },
  { domain: 'Data Structures', problems: '200+', link: 'https://www.hackerrank.com/domains/data-structures', relevance: 'DSA fundamentals' },
  { domain: 'SQL', problems: '100+', link: 'https://www.hackerrank.com/domains/sql', relevance: 'Database queries for backend/data' },
  { domain: 'Python', problems: '200+', link: 'https://www.hackerrank.com/domains/python', relevance: 'ML / Data Science focused' },
  { domain: 'Interview Prep Kit', problems: '90+', link: 'https://www.hackerrank.com/interview/interview-preparation-kit', relevance: 'FAANG / MAANG interview prep' },
];

const PRIORITY_STYLE: Record<string, string> = {
  CRITICAL: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  HIGH: 'bg-orange-50 text-orange-800 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  MEDIUM: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
};

export default function HackerRankConnectPage() {
  const router = useRouter();
  const [hackerrankUsername, setHackerrankUsername] = useState('');
  const [codechefUsername, setCodechefUsername] = useState('');
  const [gfgUsername, setGfgUsername] = useState('');
  const [codeforcesUsername, setCodeforcesUsername] = useState('');
  const [stream, setStream] = useState<UserStream>('SDE');
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{valid: boolean; preview?: {totalSolved: number; badges: string[]}} | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetch('/api/hackerrank/analysis')
      .then((res) => {
        if (res.status === 200 || res.status === 202) setIsConnected(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hackerrankUsername) { setValidationResult(null); return; }
    const timer = setTimeout(async () => {
      setIsValidating(true);
      try {
        const res = await fetch(`/api/hackerrank/validate?username=${hackerrankUsername}`);
        const data = await res.json();
        setValidationResult(data);
      } catch {
        setValidationResult({ valid: false });
      } finally {
        setIsValidating(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [hackerrankUsername]);

  const handleConnect = async () => {
    if (!hackerrankUsername || !stream || targetCompanies.length === 0) {
      setError('Please fill in HackerRank username, stream, and target companies.');
      return;
    }
    setIsConnecting(true);
    setError('');
    try {
      const res = await fetch('/api/hackerrank/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackerrank_username: hackerrankUsername,
          codechef_username: codechefUsername || undefined,
          gfg_username: gfgUsername || undefined,
          codeforces_username: codeforcesUsername || undefined,
          stream,
          targetCompanies,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsConnected(true);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  if (isConnected) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">HackerRank Profile</h1>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium" onClick={() => router.push('/career/hackerrank/analysis')}>Deep Analysis</button>
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium" onClick={() => router.push('/career/hackerrank/practice')}>Practice Plan</button>
            <button className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium" onClick={() => router.push('/career/hackerrank/certifications')}>Certifications</button>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Profile Connected</h2>
          <p className="text-slate-600">Your profile is actively being analyzed. Navigate through the tabs to view insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-1">HackerRank Profile</h1>
        <p className="text-slate-500 text-sm">Connect your profile to get skill analysis and badge recommendations tailored to your target companies.</p>
      </div>

      {/* Connect Form */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Connect Your Profile</h2>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">HackerRank Username *</label>
            <div className="relative">
              <input
                placeholder="e.g. johndoe"
                value={hackerrankUsername}
                onChange={(e) => setHackerrankUsername(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="absolute right-3 top-3">
                {isValidating && <Loader2 className="w-5 h-5 animate-spin text-slate-400" />}
                {!isValidating && validationResult?.valid && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {!isValidating && validationResult && !validationResult.valid && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
            </div>
            {validationResult?.valid && validationResult.preview && (
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-medium">
                  {validationResult.preview.totalSolved} Solved
                </span>
                <span className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium">
                  {validationResult.preview.badges?.length || 0} Badges
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'CodeChef (Optional)', value: codechefUsername, setter: setCodechefUsername },
              { label: 'GeeksforGeeks (Optional)', value: gfgUsername, setter: setGfgUsername },
              { label: 'Codeforces (Optional)', value: codeforcesUsername, setter: setCodeforcesUsername },
            ].map(({ label, value, setter }) => (
              <div key={label} className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{label}</label>
                <input placeholder="username" value={value} onChange={(e) => setter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
            ))}
          </div>

          <StreamSelector stream={stream} setStream={setStream} targetCompanies={targetCompanies} setTargetCompanies={setTargetCompanies} />

          {error && <p className="text-red-600 text-sm p-3 bg-red-50 border border-red-200 rounded-lg">{error}</p>}

          <button
            onClick={handleConnect}
            disabled={!hackerrankUsername || !stream || targetCompanies.length === 0 || isConnecting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center disabled:opacity-50 transition"
          >
            {isConnecting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Connecting...</> : 'Connect Platforms'}
          </button>
        </div>
      </div>

      {/* Why HackerRank matters */}
      <div className="border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Award size={18} className="text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900">Why HackerRank matters for placements</h2>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          90% of top Indian tech companies use HackerRank for online assessments. Here are the certifications to prioritise:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {CERTIFICATIONS.map((cert) => (
            <div key={cert.name} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors bg-white">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-sm text-slate-900">{cert.name}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[cert.priority]}`}>
                  {cert.priority}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-1">{cert.level}</p>
              <p className="text-xs text-slate-600 mb-3">{cert.why}</p>
              <a href={cert.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium">
                Get Certified <ExternalLink size={10} />
              </a>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Code2 size={16} className="text-slate-500" />
          <h3 className="font-semibold text-sm text-slate-900">Recommended Practice Domains</h3>
        </div>
        <div className="space-y-2">
          {PRACTICE_DOMAINS.map((domain) => (
            <div key={domain.domain} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-sm font-medium text-slate-900">{domain.domain}</span>
                <span className="text-xs text-slate-400 ml-2">{domain.problems} problems</span>
                <p className="text-xs text-slate-500 mt-0.5">{domain.relevance}</p>
              </div>
              <a href={domain.link} target="_blank" rel="noopener noreferrer"
                className="text-sm text-indigo-500 hover:underline whitespace-nowrap ml-4 font-medium flex items-center gap-1">
                Practice <ExternalLink size={11} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
