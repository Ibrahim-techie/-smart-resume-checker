import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const stats = [
  { value: '75%', label: 'Resumes Rejected by ATS' },
  { value: '6 sec', label: 'Per Recruiter Review' },
  { value: '98%', label: 'Fortune 500 Use ATS' },
];

const features = [
  {
    icon: 'RP',
    title: 'Resume Parsing',
    description: 'Extract education, experience, projects, skills, and contact details from uploaded resumes.',
  },
  {
    icon: 'AS',
    title: 'ATS Scoring',
    description: 'Compare resumes against job descriptions and estimate compatibility with screening systems.',
  },
  {
    icon: 'SS',
    title: 'Smart Suggestions',
    description: 'Highlight missing keywords, skill gaps, and improvement areas before applications go out.',
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.26),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.18),transparent_30%),linear-gradient(135deg,#0f172a_0%,#111827_52%,#082f49_100%)]" />
          <div className="relative mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl content-center gap-10 px-5 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-sky-100">
                MERN-powered resume intelligence
              </p>
              <h1 className="font-display text-4xl font-extrabold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                Get Your Resume ATS-Ready in Seconds
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Analyze resumes against job descriptions, uncover missing skills, and give recruiters a faster way to rank candidates.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register?role=jobseeker"
                  className="rounded-md bg-primary-500 px-6 py-3 text-center font-semibold text-white shadow-lg shadow-primary-900/30 transition hover:bg-primary-600"
                >
                  Check My Resume
                </Link>
                <Link
                  to="/register?role=recruiter"
                  className="rounded-md border border-white/20 bg-white/10 px-6 py-3 text-center font-semibold text-white transition hover:bg-white/15"
                >
                  I'm a Recruiter
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
              <div className="rounded-md bg-slate-900/80 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">ATS Match</p>
                    <p className="font-display text-4xl font-bold text-accent">86%</p>
                  </div>
                  <span className="rounded-md bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                    Strong fit
                  </span>
                </div>
                <div className="space-y-4">
                  {['React', 'Node.js', 'MongoDB', 'REST APIs'].map((skill, index) => (
                    <div key={skill}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span>{skill}</span>
                        <span className="text-slate-400">{92 - index * 8}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-accent"
                          style={{ width: `${92 - index * 8}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-6xl gap-4 px-5 py-8 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-sm font-medium uppercase tracking-wide text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="max-w-2xl">
            <p className="font-semibold text-primary-600">Phase-ready foundation</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950 sm:text-4xl">
              Built around the workflows that matter first
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-primary-50 font-display text-sm font-bold text-primary-700">
                  {feature.icon}
                </div>
                <h3 className="font-display text-xl font-semibold text-slate-950">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-slate-950 px-5 py-16 text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold">Start for free. No credit card needed.</h2>
              <p className="mt-3 text-slate-300">Create an account and prepare for the resume analysis phase.</p>
            </div>
            <Link
              to="/register"
              className="rounded-md bg-accent px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Get Started
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
