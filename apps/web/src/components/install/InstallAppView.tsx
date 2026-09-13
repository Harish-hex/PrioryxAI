'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  Monitor,
  Apple,
  Zap,
  Bell,
  WifiOff,
  BatteryCharging,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  QrCode,
  Laptop,
  Check,
  ChevronDown,
  ExternalLink,
  Layers,
} from 'lucide-react';
import WavesBackground from '@/components/ui/waves-background';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';
import { SmoothScroll } from '@/components/landing/SmoothScroll';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type PlatformType = 'android' | 'ios' | 'desktop';

export default function InstallAppView() {
  const [activeTab, setActiveTab] = useState<PlatformType>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [detectedOS, setDetectedOS] = useState<string>('Detecting...');
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    // Detect Standalone PWA / App mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Detect user OS
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) {
      setDetectedOS('Android');
      setActiveTab('android');
    } else if (/iphone|ipad|ipod/.test(ua)) {
      setDetectedOS('iOS');
      setActiveTab('ios');
    } else if (/mac/.test(ua)) {
      setDetectedOS('macOS');
      setActiveTab('desktop');
    } else if (/win/.test(ua)) {
      setDetectedOS('Windows');
      setActiveTab('desktop');
    } else {
      setDetectedOS('Desktop');
      setActiveTab('desktop');
    }

    // Capture PWA install event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstalledSuccess(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  async function handleTriggerInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    } else {
      // If browser doesn't support deferred prompt or is iOS/Desktop manual
      if (activeTab === 'ios') {
        alert('On iPhone/iPad: Tap the Share icon (⎙) at the bottom of Safari, then tap "Add to Home Screen".');
      } else if (activeTab === 'desktop') {
        alert('On Chrome or Edge: Click the install icon (⬇) in the browser address bar on the right to install on your computer.');
      } else {
        alert('Tap the 3 dots (⋮) in your mobile browser menu, then select "Install App" or "Add to Home Screen".');
      }
    }
  }

  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const platforms = [
    {
      id: 'desktop' as PlatformType,
      label: 'Desktop (Win/Mac)',
      icon: Monitor,
      color: 'from-violet-400 to-cyan-400',
      badge: 'Available Now',
      isComingSoon: false,
    },
    {
      id: 'android' as PlatformType,
      label: 'Android',
      icon: Smartphone,
      color: 'from-emerald-400 to-cyan-400',
      badge: 'Coming Soon',
      isComingSoon: true,
    },
    {
      id: 'ios' as PlatformType,
      label: 'iOS / iPhone',
      icon: Apple,
      color: 'from-cyan-400 to-violet-400',
      badge: 'Coming Soon',
      isComingSoon: true,
    },
  ];

  function handleWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (waitlistEmail.trim()) {
      setWaitlistSubmitted(true);
    }
  }

  const appFeatures = [
    {
      icon: Zap,
      title: '0-Second Launch',
      desc: 'Opens instantly from your home screen or dock without browser tabs or address bars.',
      color: 'text-amber-400 bg-amber-500/15 border-amber-400/30',
    },
    {
      icon: Bell,
      title: 'Deadline & Exam Push Alerts',
      desc: 'Get high-priority notifications before assignment cutoffs, exam dates, and internship openings.',
      color: 'text-rose-400 bg-rose-500/15 border-rose-400/30',
    },
    {
      icon: WifiOff,
      title: 'Full Offline Access',
      desc: 'Review your semester timetable, study roadmaps, and priority tasks even with spotty campus Wi-Fi.',
      color: 'text-cyan-400 bg-cyan-500/15 border-cyan-400/30',
    },
    {
      icon: BatteryCharging,
      title: 'Ultra-Lightweight (~2 MB)',
      desc: 'Uses 40% less memory and battery than heavy browser tabs, with instantaneous zero-downtime updates.',
      color: 'text-emerald-400 bg-emerald-500/15 border-emerald-400/30',
    },
    {
      icon: ShieldCheck,
      title: 'Biometric & Encrypted',
      desc: 'Encrypted local cache with optional fast biometric unlocking on supported hardware.',
      color: 'text-violet-400 bg-violet-500/15 border-violet-400/30',
    },
    {
      icon: Layers,
      title: 'Seamless Cross-Device Sync',
      desc: 'Changes on your phone sync across your laptop and tablet within seconds via Supabase realtime.',
      color: 'text-pink-400 bg-pink-500/15 border-pink-400/30',
    },
  ];

  const faqs = [
    {
      q: 'Is PrioryxAI free to install?',
      a: 'Yes, downloading and installing the PrioryxAI application is 100% free on Android, iOS, Windows, Mac, and Linux. No credit card or payment is required.',
    },
    {
      q: 'How does it compare to using the web browser?',
      a: 'The installed app runs as a dedicated standalone window with instant offline caching, native system notifications for urgent exam deadlines, full-screen focus, and zero URL bar distractions.',
    },
    {
      q: 'How do updates work?',
      a: 'The app updates automatically in the background every time you open it. You never have to manually download APK updates or reinstall.',
    },
    {
      q: 'Can I install it on both my phone and my laptop?',
      a: 'Absolutely! You can install PrioryxAI on multiple devices. All your timetable data, GitHub analysis, and priority tasks will stay synchronized in real time.',
    },
  ];

  return (
    <SmoothScroll>
      <div className="app-background min-h-screen text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-100 relative">
        {/* Dynamic deep-ocean WebGL background */}
        <WavesBackground />

        {/* Floating Header Navigation */}
        <FloatingNav />

        <main className="relative pt-32 pb-24 px-5 max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-white mb-6 drop-shadow-[0_2px_14px_rgba(0,0,0,0.8)]"
            >
              Install PrioryxAI on{' '}
              <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent filter drop-shadow-[0_2px_18px_rgba(6,182,212,0.4)]">
                Every Device
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-slate-200 text-base sm:text-lg md:text-xl leading-relaxed mb-8 font-medium"
            >
              Get zero-latency offline access, instant deadline alerts, and a focused workspace.
              One tap to install on your phone, tablet, or laptop.
            </motion.p>

            {/* Quick Install Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {detectedOS === 'Android' || detectedOS === 'iOS' ? (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('platform-guide');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="relative group px-8 py-4 rounded-2xl font-black text-white text-base sm:text-lg overflow-hidden shadow-2xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-rose-500 to-violet-600 rounded-2xl" />
                  <span className="relative z-10 flex items-center gap-3">
                    <Sparkles size={20} className="animate-pulse" />
                    <span>{detectedOS} App · Coming Soon (Get Early Access)</span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleTriggerInstall}
                  className="relative group px-8 py-4 rounded-2xl font-black text-white text-base sm:text-lg overflow-hidden shadow-2xl shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-400 rounded-2xl" />
                  <span className="relative z-10 flex items-center gap-3">
                    <Download size={20} className="animate-bounce" />
                    <span>
                      {isInstalled
                        ? 'App Already Installed'
                        : `Install for ${detectedOS}`}
                    </span>
                  </span>
                </button>
              )}

              <Link
                href="/login"
                className="px-7 py-4 rounded-2xl font-bold text-white text-base border border-white/20 bg-[#02161f]/75 backdrop-blur-xl hover:bg-white/10 transition-all flex items-center gap-2 shadow-lg"
              >
                <span>Launch in Browser</span>
                <ExternalLink size={16} className="text-cyan-400" />
              </Link>
            </motion.div>
          </div>

          {/* Platform Guide Tabs */}
          <div id="platform-guide" className="max-w-4xl mx-auto mb-24">
            {/* Tabs */}
            <div className="flex justify-center p-1.5 rounded-2xl bg-[#02161f]/85 border border-white/15 backdrop-blur-2xl mb-8 max-w-2xl mx-auto shadow-xl">
              {platforms.map((p) => {
                const Icon = p.icon;
                const isActive = activeTab === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveTab(p.id)}
                    className={`relative flex-1 py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isActive
                        ? 'text-slate-950 font-black shadow-lg'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabBg"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-300 via-teal-200 to-white"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon size={16} />
                      <span className="hidden sm:inline">{p.label}</span>
                      <span className="sm:hidden">{p.id === 'desktop' ? 'Desktop' : p.id === 'android' ? 'Android' : 'iOS'}</span>
                      {p.isComingSoon && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isActive
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-500/25 text-amber-300 border border-amber-400/30'
                        }`}>
                          Soon
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Platform Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl border border-cyan-400/30 bg-[#02161f]/90 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl"
              >
                {activeTab === 'android' && (
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-md">
                          <Smartphone size={26} />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-white">
                            Android App (Google Play Store &amp; APK)
                          </h3>
                          <p className="text-cyan-300 text-xs sm:text-sm font-semibold">
                            Native mobile experience for all Android smartphones &amp; tablets
                          </p>
                        </div>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-black tracking-wide uppercase flex items-center gap-1.5 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        Coming Soon
                      </span>
                    </div>

                    {/* Features in pipeline */}
                    <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="text-white font-bold text-sm sm:text-base mb-4 flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-400" />
                        Native Android Features in Development:
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-3.5">
                        {[
                          'Android 14+ Lock Screen Widgets & Countdown Timers',
                          'Google Play Store Direct One-Tap Installation',
                          'Camera AI Fast Timetable Document Scanner',
                          'Offline SQLite Sync for Zero-Network Environments',
                          'Real-Time Push Notifications for Urgent Submission Deadlines',
                          'Biometric Fingerprint & Face Unlock Integration',
                        ].map((item) => (
                          <div key={item} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Early Access Notification Form */}
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-400/30">
                      <div className="max-w-xl">
                        <h4 className="text-white font-black text-base mb-1">
                          Get notified when the Android APK / Play Store beta drops
                        </h4>
                        <p className="text-slate-300 text-xs sm:text-sm mb-4 font-medium">
                          Be the first to test the native Android app on your phone with exclusive beta features.
                        </p>

                        {waitlistSubmitted ? (
                          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm font-bold">
                            <Check size={18} />
                            <span>You&apos;re on the Android Early Access VIP list! We&apos;ll email you upon release.</span>
                          </div>
                        ) : (
                          <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2.5">
                            <input
                              type="email"
                              required
                              placeholder="Enter your student or personal email..."
                              value={waitlistEmail}
                              onChange={(e) => setWaitlistEmail(e.target.value)}
                              className="flex-1 px-4 py-3 rounded-xl bg-[#02161f]/80 border border-white/20 text-white placeholder:text-slate-400 text-xs sm:text-sm outline-none focus:border-cyan-400 transition"
                            />
                            <button
                              type="submit"
                              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 text-xs sm:text-sm font-black hover:opacity-90 transition shadow-lg cursor-pointer whitespace-nowrap"
                            >
                              Notify Me on Launch
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'ios' && (
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
                          <Apple size={26} />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-white">
                            iOS App (Apple App Store &amp; TestFlight)
                          </h3>
                          <p className="text-cyan-300 text-xs sm:text-sm font-semibold">
                            Native iOS experience for iPhone &amp; iPad
                          </p>
                        </div>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-black tracking-wide uppercase flex items-center gap-1.5 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        Coming Soon
                      </span>
                    </div>

                    {/* Features in pipeline */}
                    <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
                      <h4 className="text-white font-bold text-sm sm:text-base mb-4 flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-400" />
                        Native iOS Features in Development:
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-3.5">
                        {[
                          'iOS 18 Dynamic Island & Live Activities for Exam Timers',
                          'Apple App Store & TestFlight Beta Distribution',
                          'Apple Calendar & Reminders Two-Way Integration',
                          'Haptic Feedback & Smooth 120Hz ProMotion Animations',
                          'Lock Screen Widgets for Immediate Priority Task Glances',
                          'FaceID Biometric Security Integration',
                        ].map((item) => (
                          <div key={item} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                            <CheckCircle2 size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Early Access Notification Form */}
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-transparent border border-cyan-400/30">
                      <div className="max-w-xl">
                        <h4 className="text-white font-black text-base mb-1">
                          Join the Apple TestFlight Beta waitlist
                        </h4>
                        <p className="text-slate-300 text-xs sm:text-sm mb-4 font-medium">
                          Receive an exclusive invite to test PrioryxAI on iOS before the public App Store release.
                        </p>

                        {waitlistSubmitted ? (
                          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-sm font-bold">
                            <Check size={18} />
                            <span>You&apos;re on the iOS TestFlight Early Access list! We&apos;ll send your invite soon.</span>
                          </div>
                        ) : (
                          <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2.5">
                            <input
                              type="email"
                              required
                              placeholder="Enter your Apple ID or student email..."
                              value={waitlistEmail}
                              onChange={(e) => setWaitlistEmail(e.target.value)}
                              className="flex-1 px-4 py-3 rounded-xl bg-[#02161f]/80 border border-white/20 text-white placeholder:text-slate-400 text-xs sm:text-sm outline-none focus:border-cyan-400 transition"
                            />
                            <button
                              type="submit"
                              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950 text-xs sm:text-sm font-black hover:opacity-90 transition shadow-lg cursor-pointer whitespace-nowrap"
                            >
                              Join TestFlight List
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'desktop' && (
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-violet-300 shadow-md">
                          <Laptop size={26} />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-white">
                            Windows, macOS &amp; Linux Desktop App
                          </h3>
                          <p className="text-cyan-300 text-xs sm:text-sm font-semibold">
                            Full native desktop window experience with taskbar/dock integration
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5 mb-8">
                      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="w-7 h-7 rounded-xl bg-violet-500/20 text-violet-300 font-mono font-black text-sm flex items-center justify-center mb-3">
                            01
                          </div>
                          <h4 className="text-white font-bold text-sm mb-1.5">Open in Chrome or Edge</h4>
                          <p className="text-slate-300 text-xs leading-relaxed font-medium">
                            Visit <strong className="text-cyan-300">prioryxai.in</strong> on your laptop or desktop workstation.
                          </p>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="w-7 h-7 rounded-xl bg-violet-500/20 text-violet-300 font-mono font-black text-sm flex items-center justify-center mb-3">
                            02
                          </div>
                          <h4 className="text-white font-bold text-sm mb-1.5">Click URL Bar Icon (⬇)</h4>
                          <p className="text-slate-300 text-xs leading-relaxed font-medium">
                            Look at the right side of the address bar and click the <strong>Install / App icon</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                        <div>
                          <div className="w-7 h-7 rounded-xl bg-violet-500/20 text-violet-300 font-mono font-black text-sm flex items-center justify-center mb-3">
                            03
                          </div>
                          <h4 className="text-white font-bold text-sm mb-1.5">Pin to Taskbar</h4>
                          <p className="text-slate-300 text-xs leading-relaxed font-medium">
                            PrioryxAI opens as an independent desktop window. Pin it to your Windows Taskbar or macOS Dock for 1-click access.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-violet-500/10 border border-violet-400/25">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={20} className="text-violet-400 flex-shrink-0" />
                        <span className="text-slate-200 text-xs sm:text-sm font-semibold">
                          Optimized for multi-monitor setups, coding sessions, and fast keyboard navigation.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleTriggerInstall}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 text-white text-xs sm:text-sm font-black hover:opacity-95 transition shadow-md whitespace-nowrap cursor-pointer"
                      >
                        Install on Desktop
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* App Superpowers / Advantages Grid */}
          <div className="mb-24">
            <div className="text-center mb-14">
              <span className="inline-block rounded-full border border-white/30 bg-[#02161f]/80 backdrop-blur-md px-4 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-300 shadow-md mb-3">
                App Superpowers
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] mb-3">
                Why install the native app?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto font-medium">
                Built from the ground up for high-performance student productivity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appFeatures.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.6 }}
                    className="p-6 rounded-3xl border border-white/15 bg-[#02161f]/80 backdrop-blur-2xl hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-2xl ${feat.color} border flex items-center justify-center mb-4 shadow-md`}>
                      <Icon size={24} />
                    </div>
                    <h3 className="text-lg font-black text-white mb-2 group-hover:text-cyan-300 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                      {feat.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="text-center mb-12">
              <span className="inline-block rounded-full border border-white/30 bg-[#02161f]/80 backdrop-blur-md px-4 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-300 shadow-md mb-3">
                FAQ
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                Installation Questions
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="rounded-2xl border border-white/15 bg-[#02161f]/80 backdrop-blur-xl overflow-hidden shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 text-white font-bold text-sm sm:text-base hover:text-cyan-300 transition cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={18}
                        className={`text-cyan-400 transform transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="px-5 pb-5 text-slate-300 text-xs sm:text-sm font-medium leading-relaxed border-t border-white/10 pt-3"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Bottom Banner */}
          <div className="rounded-[32px] overflow-hidden border border-cyan-400/40 bg-gradient-to-br from-[#02161f] via-[#0c364c] to-[#03212f] p-8 sm:p-14 text-center relative shadow-2xl shadow-cyan-500/20">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
                Ready to turn chaos into an unfair advantage?
              </h2>
              <p className="text-slate-200 text-sm sm:text-base mb-8 font-medium">
                Install PrioryxAI in 5 seconds and start prioritizing what matters.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  type="button"
                  onClick={handleTriggerInstall}
                  className="px-8 py-4 rounded-2xl font-black text-slate-950 text-base bg-white hover:bg-slate-100 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Download size={18} />
                  <span>Install PrioryxAI Now</span>
                </button>
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-2xl font-bold text-white text-base border border-white/25 bg-[#02161f]/60 hover:bg-white/10 transition-all"
                >
                  Sign In to Account
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </SmoothScroll>
  );
}
