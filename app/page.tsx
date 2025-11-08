import AsciiBlock from '@/components/AsciiBlock';

const BADGES = ['Next.js', 'TypeScript', 'Tailwind', 'Framer Motion'] as const;

export default function Home() {
  return (
    <main className="relative min-h-screen text-neutral-100">
      <p className="fixed left-6 top-6 max-w-[200px] text-[11px] leading-[1.6] text-neutral-400 lg:left-12 lg:top-12 lg:max-w-[240px] lg:text-[12px]">
        Building resilient cloud platforms and expressive frontends that transform enterprise
        architecture into seamless digital experiences.
      </p>
      <p className="fixed right-6 top-6 text-[10px] font-medium uppercase tracking-[0.35em] text-neutral-400 lg:right-12 lg:top-12 lg:text-[11px] lg:tracking-[0.4em]">
        CLOUD ARCHITECT & FULLSTACK DEVELOPER
      </p>
      <section className="relative mx-auto flex min-h-screen max-w-7xl px-6 pb-24 pt-20 sm:pt-28 lg:px-12 lg:pt-36">
        <div className="relative z-10 flex max-w-xl flex-col justify-center gap-8 lg:max-w-md">
          <header className="space-y-6">
            <h1 className="text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              Ernesto Cobos <span className="text-orange-500">—</span>
              <br />
              <span className="text-neutral-500">Portfolio</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-neutral-300 sm:text-lg">
              I build resilient cloud platforms and expressive frontends for enterprise-scale teams.
              This hero pairs that precision with a live ASCII morph—captured from video—as it
              shifts from square to diamond, reflecting how I translate architecture into
              experience.
            </p>
          </header>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            <a
              href="#work"
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-neutral-950 shadow-[0_20px_45px_-25px_rgba(255,107,53,0.8)] transition hover:bg-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-200"
            >
              Show my work
            </a>
            <ul className="flex flex-wrap items-center gap-3 text-sm text-neutral-300">
              {BADGES.map(badge => (
                <li
                  key={badge}
                  className="rounded-full border border-neutral-800/80 px-3 py-1 text-[13px] font-medium text-neutral-200"
                >
                  {badge}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="absolute -right-12 top-1/2 hidden h-[75vh] w-[58vw] max-w-none -translate-y-1/2 lg:block xl:-right-16">
          <AsciiBlock mode="video" src="/hero.mp4" className="h-full w-full" />
        </div>

        <div className="mt-12 lg:hidden">
          <AsciiBlock mode="video" src="/hero.mp4" className="h-[400px] w-full" />
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col gap-20 px-6 pb-24 lg:px-12">
        <section
          id="work"
          className="rounded-3xl border border-neutral-800/70 bg-neutral-900/60 p-8 shadow-[0_40px_120px_-80px_rgba(0,0,0,0.8)] backdrop-blur"
        >
          <h2 className="text-2xl font-semibold text-neutral-50">#work</h2>
          <p className="mt-4 max-w-2xl text-neutral-300">
            Case studies and interactive demos are loading soon. I’m curating recent cloud
            migrations, fullstack launches, and automation wins to showcase here.
          </p>
        </section>
      </section>
    </main>
  );
}
