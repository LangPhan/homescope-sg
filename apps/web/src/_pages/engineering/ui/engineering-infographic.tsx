"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity, ArrowDown, ArrowRight, Bot, Boxes, Braces, Check, CircleGauge, Cloud, Code2,
  Database, Eye, FileCode2, Gauge, GitBranch, Globe2, HardDrive, KeyRound, Layers3,
  LockKeyhole, Map, Network, Radio, RefreshCw, Route, Search, Server, ShieldCheck,
  Sparkles, SquareTerminal, Waypoints, Zap,
} from "lucide-react";
import { Eyebrow } from "@/shared/ui";
import styles from "./engineering-infographic.module.css";

const container = "mx-auto w-[min(1200px,calc(100%-40px))] max-[620px]:w-[min(1200px,calc(100%-28px))]";

const navigation = [
  ["overview", "Overview"], ["request", "Request flow"], ["search", "Search engine"],
  ["ai", "AI safety"], ["signals", "Observability"], ["delivery", "Delivery"],
];

const requestStages = [
  {
    number: "01", title: "The browser owns intent", icon: Globe2,
    description: "Next.js App Router server-renders the entry point. Search filters live in the URL, so every result is bookmarkable, shareable and restorable after opening a listing.",
    detail: "React 19 · App Router · TanStack Query · Zod",
  },
  {
    number: "02", title: "The edge establishes trust", icon: Route,
    description: "Nginx keeps the public surface small, preserves or creates a request ID and routes API and AI streams without exposing internal metrics or service ports.",
    detail: "Nginx · same-origin BFF · origin secret · SSE",
  },
  {
    number: "03", title: "The API applies policy", icon: ShieldCheck,
    description: "Slim middleware validates input, authenticates short-lived JWTs and enforces Redis-backed rate limits before controllers can reach business services.",
    detail: "PHP 8.3 · Slim 4 · DI · JWT · Argon2id",
  },
  {
    number: "04", title: "The data layer does less work", icon: Database,
    description: "Repositories execute explicit prepared SQL. Spatial and composite indexes narrow candidates first; cursor pagination avoids the increasing cost of deep OFFSET scans.",
    detail: "MySQL 8.4 · PDO · POINT SRID 4326 · Redis 7",
  },
  {
    number: "05", title: "Every result is measurable", icon: Activity,
    description: "The response carries the same request ID back to the browser while bounded metrics and redacted JSON logs describe the path without collecting personal content.",
    detail: "Prometheus · Loki · Alloy · Grafana",
  },
];

const architectureNodes = [
  { label: "Vercel", meta: "Next.js UI + BFF", icon: Cloud, tone: "coral" },
  { label: "Tailscale Funnel", meta: "Encrypted origin", icon: Network, tone: "mint" },
  { label: "Nginx", meta: "Routing + request ID", icon: Route, tone: "mint" },
  { label: "Slim API", meta: "Business rules", icon: Server, tone: "teal" },
  { label: "MySQL", meta: "Source of truth", icon: Database, tone: "teal" },
  { label: "Redis", meta: "Cache + quotas", icon: Zap, tone: "coral" },
];

const toolchain = [
  ["Experience", "Next.js 16, React 19, TypeScript, Tailwind CSS, GSAP, TanStack Query"],
  ["API", "PHP 8.3, Slim 4, PDO, Monolog, OpenAPI, PHPUnit"],
  ["Data", "MySQL 8.4, spatial indexes, Redis 7, raw parameterised SQL"],
  ["AI", "TanStack AI, 9Router, OpenAI-compatible SSE, Zod tool contracts"],
  ["Quality", "Vitest, Testing Library, Playwright, PHPStan, Lighthouse"],
  ["Platform", "Docker Compose, Nginx, Vercel, Tailscale, GitHub Actions"],
];

const searchQuery = `SELECT slug, price, bedrooms, location
FROM listings
WHERE MBRContains(
  ST_GeomFromText(:viewport, 4326),
  location
)
  AND status = 'published'
  AND price BETWEEN :min AND :max
  AND (listed_at, id) < (:date, :id)
ORDER BY listed_at DESC, id DESC
LIMIT :limit_plus_one;`;

const signalCards = [
  { icon: CircleGauge, title: "Metrics", copy: "Rates, latency histograms, cache outcomes, quotas and dependency health.", retention: "15 days", color: "#7ed3ca" },
  { icon: Eye, title: "Logs", copy: "Redacted JSON events joined across Nginx, Next.js and PHP by request_id.", retention: "7 days", color: "#f09a7f" },
  { icon: Radio, title: "Alerts", copy: "SLO-aware rules for errors, p95 latency, providers, resources and restarts.", retention: "Telegram", color: "#f2cd78" },
];

const deliverySteps = [
  ["01", "Commit", "Feature-sized history keeps design and infrastructure decisions reviewable.", GitBranch],
  ["02", "Verify", "Typecheck, unit, integration, browser and configuration checks gate the build.", Check],
  ["03", "Package", "Pinned Docker images make PHP, Nginx, databases and telemetry reproducible.", Boxes],
  ["04", "Release", "Vercel serves the frontend; the private origin is exposed only through Tailscale Funnel.", Cloud],
  ["05", "Observe", "Readiness smoke tests and live signals close the deployment feedback loop.", Activity],
] as const;

export function EngineeringInfographic() {
  const root = useRef<HTMLDivElement>(null);
  const [activeStage, setActiveStage] = useState(0);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    let context: { revert: () => void } | undefined;
    let disposed = false;

    async function setupAnimations() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (disposed || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      context = gsap.context(() => {
        if (!reduceMotion) {
          gsap.from("[data-hero-word]", { yPercent: 115, rotate: 2, opacity: 0, duration: 1, stagger: .08, ease: "power4.out" });
          gsap.from("[data-hero-copy], [data-hero-action]", { y: 20, opacity: 0, duration: .8, stagger: .12, delay: .45, ease: "power3.out" });
          gsap.from("[data-system-node]", { scale: .86, opacity: 0, duration: .65, stagger: .09, delay: .25, ease: "back.out(1.5)" });
          gsap.to("[data-packet]", {
            x: () => {
              const packet = root.current?.querySelector<HTMLElement>("[data-packet]");
              return Math.max(0, (packet?.parentElement?.clientWidth ?? 0) - 7);
            },
            duration: 4.8,
            repeat: -1,
            ease: "none",
          });
          gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
            gsap.from(element, { y: 44, opacity: 0, duration: .85, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 88%", once: true } });
          });
          gsap.utils.toArray<HTMLElement>("[data-stagger-group]").forEach((group) => {
            gsap.from(group.children, { y: 28, opacity: 0, duration: .65, stagger: .09, ease: "power3.out", scrollTrigger: { trigger: group, start: "top 84%", once: true } });
          });
          gsap.to("[data-scroll-progress]", { scaleX: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: .3 } });
          gsap.to("[data-search-pulse]", {
            x: () => {
              const pulse = root.current?.querySelector<HTMLElement>("[data-search-pulse]");
              return Math.max(0, (pulse?.parentElement?.clientWidth ?? 0) * .8);
            },
            duration: 2.8,
            repeat: -1,
            ease: "power1.inOut",
          });
        }

        requestStages.forEach((_, index) => {
          const trigger = root.current?.querySelector(`[data-stage-card="${index}"]`);
          if (trigger) ScrollTrigger.create({ trigger, start: "top 55%", end: "bottom 45%", onEnter: () => setActiveStage(index), onEnterBack: () => setActiveStage(index) });
        });
        navigation.forEach(([id]) => {
          const section = document.getElementById(id);
          if (section) ScrollTrigger.create({ trigger: section, start: "top 45%", end: "bottom 45%", onEnter: () => setActiveSection(id), onEnterBack: () => setActiveSection(id) });
        });
      }, root);
      ScrollTrigger.refresh();
    }

    setupAnimations();
    return () => { disposed = true; context?.revert(); };
  }, []);

  return (
    <div ref={root} className={styles.root}>
      <div className={styles.scrollProgress} data-scroll-progress aria-hidden="true" />
      <section id="overview" className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={`${container} ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <div data-hero-copy className={styles.caseLabel}><span className={styles.liveDot} /> Engineering case study · v1.0</div>
            <h1 className={styles.heroTitle} aria-label="One home search. An entire system in motion.">
              <span className={styles.wordMask}><span data-hero-word>One home search.</span></span>
              <span className={styles.wordMask}><span data-hero-word>An entire system</span></span>
              <span className={`${styles.wordMask} ${styles.accentLine}`}><span data-hero-word>in motion.</span></span>
            </h1>
            <p data-hero-copy className={styles.heroDescription}>Follow a request from a renter&apos;s first filter to indexed SQL, guarded AI, correlated logs and a production release. This is the architecture behind HomeScope SG—made visible.</p>
            <div data-hero-action className={styles.heroActions}>
              <a href="#system-map" className={styles.primaryAction}>Explore the system <ArrowDown size={17} /></a>
              <Link href="/search" className={styles.secondaryAction}>Try the product <ArrowRight size={17} /></Link>
            </div>
          </div>
          <div className={styles.heroVisual} aria-label="Animated overview of the HomeScope request flow">
            <div className={styles.orbit} /><div className={styles.orbitSecondary} />
            <div className={styles.flowRail}><span data-packet className={styles.packet} /></div>
            {[
              ["Browser", "Next.js", Globe2, styles.nodeBrowser], ["Edge", "Nginx", Route, styles.nodeEdge],
              ["API", "Slim", Braces, styles.nodeApi], ["Data", "MySQL", Database, styles.nodeData],
              ["Cache", "Redis", Zap, styles.nodeCache],
            ].map(([label, sublabel, Icon, className]) => (
              <div data-system-node className={`${styles.heroNode} ${className}`} key={String(label)}><Icon size={19} /><strong>{String(label)}</strong><span>{String(sublabel)}</span></div>
            ))}
            <div className={styles.heroCore} data-system-node><Activity size={23} /><span>request_id</span><strong>hs_7f2a9c</strong></div>
            <div className={`${styles.signalTag} ${styles.signalFast}`}><Gauge size={14} /> p95 &lt; 300ms</div>
            <div className={`${styles.signalTag} ${styles.signalSafe}`}><ShieldCheck size={14} /> guarded</div>
          </div>
        </div>
        <div className={`${container} ${styles.heroStats}`} data-stagger-group>
          {[["300+", "synthetic homes"], ["6", "runtimes & stores"], ["15 days", "metric history"], ["1 ID", "end-to-end traceability"]].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
      </section>

      <nav className={styles.chapterNav} aria-label="Engineering chapters"><div className={container}>
        <span className={styles.navLabel}>System tour</span><div className={styles.navLinks}>
          {navigation.map(([id, label], index) => <a key={id} href={`#${id}`} className={activeSection === id ? styles.navActive : ""}><span>0{index + 1}</span>{label}</a>)}
        </div>
      </div></nav>

      <section id="system-map" className={styles.systemSection}><div className={container}>
        <div className={styles.sectionIntro} data-reveal><div><Eyebrow>01 · System overview</Eyebrow><h2>Purposefully small surface.<br /><em>Production-shaped</em> underneath.</h2></div><p>The product is split by responsibility, not fashion. The browser gets fast rendering and resilient cache; PHP owns domain rules; MySQL owns truth; Redis absorbs temporary work; telemetry stays private.</p></div>
        <div className={styles.architectureMap} data-reveal>
          <div className={styles.architectureLabel}><Network size={17} /> Hybrid production topology</div>
          <div className={styles.architectureFlow} data-stagger-group>
            {architectureNodes.map(({ label, meta, icon: Icon, tone }, index) => <div className={styles.architectureStep} key={label}>
              <div className={`${styles.architectureNode} ${styles[`tone${tone}`]}`}><span><Icon size={21} /></span><strong>{label}</strong><small>{meta}</small></div>
              {index < architectureNodes.length - 1 && <div className={styles.connector}><i /><Chevron /></div>}
            </div>)}
          </div>
          <div className={styles.architectureNotes}><span><LockKeyhole size={15} /> Shared origin secret</span><span><RefreshCw size={15} /> Cache invalidation after sync</span><span><Activity size={15} /> Correlated JSON logs</span></div>
        </div>
        <div className={styles.techGrid} data-stagger-group>{toolchain.map(([label, stack]) => <div key={label} className={styles.techRow}><span>{label}</span><p>{stack}</p></div>)}</div>
      </div></section>

      <section id="request" className={styles.requestSection}><div className={`${container} ${styles.requestLayout}`}>
        <div className={styles.requestSticky}>
          <Eyebrow className="text-[#7ed3ca]">02 · One request, end to end</Eyebrow><h2>The path is layered.<br />The experience is one.</h2><p>Scroll through the five boundaries a search request crosses. Each layer adds one kind of certainty.</p>
          <div className={styles.stageVisualizer}><div className={styles.stageRail} />{requestStages.map(({ title, icon: Icon }, index) => <div className={`${styles.stageNode} ${activeStage >= index ? styles.stageNodePassed : ""} ${activeStage === index ? styles.stageNodeActive : ""}`} key={title}><span><Icon size={18} /></span><small>{title.split(" ")[1]}</small></div>)}</div>
          <div className={styles.stageReadout}><span>Active boundary</span><strong>{requestStages[activeStage].number} / 05</strong></div>
        </div>
        <div className={styles.requestCards}>{requestStages.map(({ number, title, description, detail, icon: Icon }, index) => <article data-stage-card={index} className={`${styles.requestCard} ${activeStage === index ? styles.requestCardActive : ""}`} key={title}><div className={styles.requestCardTop}><span>{number}</span><Icon size={24} /></div><h3>{title}</h3><p>{description}</p><small>{detail}</small></article>)}</div>
      </div></section>

      <section id="search" className={styles.searchSection}><div className={container}>
        <div className={styles.sectionIntro} data-reveal><div><Eyebrow>03 · Spatial search engine</Eyebrow><h2>Search the viewport,<br /><em>not the whole island.</em></h2></div><p>Map movement becomes bounded intent. The API validates it, the database prunes geography first and the client merges pages without losing scroll position.</p></div>
        <div className={styles.searchPipeline} data-reveal><span data-search-pulse className={styles.searchPulse} />
          {[[Map, "Map settles", "bbox + filters"], [ShieldCheck, "Zod validates", "bounded input"], [Database, "Index prunes", "spatial first"], [Zap, "Redis serves", "30s warm cache"], [Layers3, "Query merges", "infinite results"]].map(([Icon, title, copy], index) => <div className={styles.searchStep} key={String(title)}><span>{index + 1}</span><Icon size={22} /><strong>{String(title)}</strong><small>{String(copy)}</small></div>)}
        </div>
        <div className={styles.queryGrid}>
          <div className={styles.codePanel} data-reveal><div className={styles.codeHeader}><span><i /><i /><i /></span><small>ListingRepository.php · prepared SQL</small><FileCode2 size={16} /></div><pre><code>{searchQuery}</code></pre></div>
          <div className={styles.explainPanel} data-reveal><div className={styles.explainHeader}><SquareTerminal size={18} /><span>EXPLAIN ANALYZE</span><strong>measured</strong></div>
            {[["Spatial candidate scan", "POINT SRID 4326", "34 rows"], ["Composite filter", "status · price · beds", "18 rows"], ["Cursor boundary", "listed_at · id", "13 rows"], ["Response window", "limit + 1", "9 rows"]].map(([title, detail, result], index) => <div className={styles.explainRow} key={title}><span>0{index + 1}</span><div><strong>{title}</strong><small>{detail}</small></div><em>{result}</em></div>)}
            <div className={styles.latencyMeter}><div><span>Warm API target</span><strong>&lt; 300 ms p95</strong></div><i><b /></i></div>
          </div>
        </div>
        <div className={styles.searchPrinciples} data-stagger-group><div><Waypoints /><strong>Cursor, not offset</strong><p>Stable page cost as the result set grows.</p></div><div><RefreshCw /><strong>URL is state</strong><p>Back navigation restores filters, cache and position.</p></div><div><HardDrive /><strong>Explicit SQL</strong><p>Query plans stay visible, explainable and tunable.</p></div></div>
      </div></section>

      <section id="ai" className={styles.aiSection}>
        <div className={`${container} ${styles.aiLayout}`}>
          <div className={styles.aiCopy} data-reveal><Eyebrow className="text-[#7ed3ca]">04 · AI property advisor</Eyebrow><h2>Helpful by design.<br /><em>Bounded by default.</em></h2><p>The assistant cannot browse, execute code or invent inventory. Authentication happens before inference; classification happens before advice; read-only tools are the only path to listing data.</p><div className={styles.aiGuarantees}><span><Check size={15} /> Authenticated users only</span><span><Check size={15} /> Fail-closed classifier</span><span><Check size={15} /> Validated read-only tools</span><span><Check size={15} /> No chat content in logs</span></div></div>
          <div className={styles.aiTerminal} data-reveal><div className={styles.aiTerminalHeader}><div><Bot size={18} /><strong>Advisor gateway</strong></div><span>STREAMING</span></div><div className={styles.promptBubble}>Find me a 2-bedroom condo near an MRT below S$1.8m.</div>
            <div className={styles.guardPipeline}>{[[KeyRound, "Authorize", "JWT + quota", "pass"], [ShieldCheck, "Classify", "property_search", "allow"], [Search, "Tool call", "search_listings", "read-only"], [Sparkles, "Respond", "grounded cards", "stream"]].map(([Icon, title, copy, state], index) => <div className={styles.guardStep} key={String(title)}><span><Icon size={17} /></span><div><small>0{index + 1} · {String(state)}</small><strong>{String(title)}</strong><p>{String(copy)}</p></div></div>)}</div>
            <div className={styles.blockedPrompt}><LockKeyhole size={17} /><div><strong>Prompt injection</strong><span>Blocked before advisor or tool execution</span></div><b>DENY</b></div>
          </div>
        </div>
        <div className={`${container} ${styles.aiBoundary}`} data-stagger-group>{[["Input", "2,000", "character limit"], ["Context", "20", "message maximum"], ["Tools", "2", "both read-only"], ["Output", "≤ 5", "grounded listings"], ["Quota", "10/min", "per authenticated user"]].map(([label, value, copy]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>{copy}</small></div>)}</div>
      </section>

      <section id="signals" className={styles.signalSection}><div className={container}>
        <div className={styles.sectionIntro} data-reveal><div><Eyebrow>05 · Observability</Eyebrow><h2>When something fails,<br /><em>follow one identifier.</em></h2></div><p>A request ID connects a browser error to the exact edge and application events. Metrics answer “how often”; logs answer “why”—without storing identity or conversation content.</p></div>
        <div className={styles.traceDemo} data-reveal><div className={styles.traceHeader}><span><Activity size={16} /> Live request trace</span><code>request_id = hs_7f2a9c</code><b>200 OK</b></div><div className={styles.traceTimeline}>{[["Nginx", "request.accepted", "0 ms"], ["Next.js", "bff.forwarded", "8 ms"], ["PHP", "listing.search", "23 ms"], ["Redis", "cache.hit", "27 ms"], ["Nginx", "response.completed", "31 ms"]].map(([service, event, time], index) => <div className={styles.traceEvent} key={`${service}-${event}`}><i className={index === 4 ? styles.traceDone : ""} /><strong>{service}</strong><span>{event}</span><code>{time}</code></div>)}</div></div>
        <div className={styles.signalGrid} data-stagger-group>{signalCards.map(({ icon: Icon, title, copy, retention, color }) => <article key={title} style={{ "--signal-color": color } as React.CSSProperties}><div><Icon size={23} /><span>{retention}</span></div><h3>{title}</h3><p>{copy}</p></article>)}</div>
        <div className={styles.sloStrip} data-reveal>{[["Availability objective", "99.9%"], ["API latency alert", "p95 > 500ms"], ["Error-rate alert", "5xx > 5%"], ["Private access", "SSH tunnel"]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      </div></section>

      <section id="delivery" className={styles.deliverySection}><div className={container}>
        <div className={styles.deliveryHeading} data-reveal><Eyebrow>06 · Delivery loop</Eyebrow><h2>From commit to signal,<br />then back to a better commit.</h2></div>
        <div className={styles.deliveryFlow} data-stagger-group>{deliverySteps.map(([number, title, copy, Icon], index) => <div className={styles.deliveryStep} key={title}><div className={styles.deliveryNumber}>{number}</div><span className={styles.deliveryIcon}><Icon size={21} /></span><h3>{title}</h3><p>{copy}</p>{index < deliverySteps.length - 1 && <ArrowRight className={styles.deliveryArrow} />}</div>)}</div>
        <div className={styles.tradeoffGrid}><div data-reveal><Eyebrow>Decisions, not defaults</Eyebrow><h3>Deliberate trade-offs</h3><p>A portfolio system should show judgment—not pretend every choice is universally correct.</p></div><div className={styles.tradeoffList} data-stagger-group>
          {[["Raw SQL over an ORM", "More control and explainable plans", "More repository code to maintain"], ["Hybrid hosting", "Fast global UI and private self-hosted data", "Two deployment surfaces"], ["Short search cache", "Fast repeats without stale inventory", "Lower maximum hit ratio"], ["Session-only AI history", "Privacy and zero chat persistence", "No cross-device continuity"]].map(([choice, gain, cost]) => <div key={choice}><strong>{choice}</strong><span><Check size={14} /> {gain}</span><small>Trade-off · {cost}</small></div>)}
        </div></div>
        <div className={styles.finalCta} data-reveal><div><span>That is the system.</span><h2>Now experience the product it supports.</h2></div><div><Link href="/search">Explore homes <ArrowRight size={18} /></Link><a href="https://github.com/LangPhan/homescope-sg" target="_blank" rel="noreferrer">Read the source <Code2 size={18} /></a></div></div>
      </div></section>
    </div>
  );
}

function Chevron() {
  return <svg viewBox="0 0 12 12" aria-hidden="true"><path d="m3.5 2 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>;
}
