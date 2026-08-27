'use client';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const TESTIMONIALS = [
  {
    name: 'Arjun K.',
    college: 'NIT Trichy · 3rd Year CSE',
    text: 'PrioryxAI is literally the reason I submitted all my lab assignments and projects on time this semester. The priority ranking algorithm is scary accurate.',
    avatar: 'AK',
    color: 'from-violet-500 to-purple-600',
    rating: 5,
  },
  {
    name: 'Priya M.',
    college: 'BITS Pilani · 4th Year',
    text: 'Uploaded my resume and it extracted 58 skills I did not even realize were valuable. Got matched to a high-stipend SDE internship within a week.',
    avatar: 'PM',
    color: 'from-cyan-500 to-blue-600',
    rating: 5,
  },
  {
    name: 'Rohit S.',
    college: 'VIT Chennai · Final Year',
    text: 'The GitHub Intelligence told me exactly which repos to clean up and push before campus placement season. Landed my dream offer.',
    avatar: 'RS',
    color: 'from-emerald-500 to-teal-600',
    rating: 5,
  },
  {
    name: 'Ananya T.',
    college: 'Amrita · 3rd Year AI',
    text: 'Project Foundry generated 9 personalized projects based on my specific skill gaps. I have already completed 3 and added them to my portfolio.',
    avatar: 'AT',
    color: 'from-amber-500 to-orange-600',
    rating: 5,
  },
  {
    name: 'Dev P.',
    college: 'SRM University · 2nd Year',
    text: 'The AI assistant understands my real semester workload. It told me which assignments to prioritize before exams. An absolute lifesaver.',
    avatar: 'DP',
    color: 'from-pink-500 to-rose-600',
    rating: 5,
  },
  {
    name: 'Meera K.',
    college: 'IIIT Hyderabad · 3rd Year',
    text: 'Worth every rupee of ₹59. It has completely eliminated the panic of managing exams, LeetCode streaks, and internship applications simultaneously.',
    avatar: 'MK',
    color: 'from-indigo-500 to-violet-600',
    rating: 5,
  },
];

export function Testimonials() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="py-28 px-5 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block rounded-full border border-white/30 bg-[#02161f]/80 backdrop-blur-md px-4 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-300 shadow-md mb-3">
            Testimonials
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            Trusted by top engineering students
          </h2>
        </div>

        {/* Masonry-like grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                delay: i * 0.08,
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ scale: 1.02, borderColor: 'rgba(90,210,244,0.4)' }}
              className="break-inside-avoid mb-5 rounded-3xl border border-white/20 bg-[#02161f]/80 backdrop-blur-2xl p-6 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 shadow-lg"
            >
              {/* Quote */}
              <p className="text-slate-200 text-sm leading-relaxed mb-6 font-medium">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-black text-xs shadow-md`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-cyan-300/80 text-xs font-semibold">{t.college}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
