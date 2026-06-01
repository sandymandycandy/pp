export const stats = [
  { num: 40, label: "Projects Launched" },
  { num: 5, label: "Years In Orbit" },
  { num: 99, label: "% Uptime" },
];

export const skills = [
  { icon: "frontend", code: "SYS-01", title: "Frontend", blurb: "Interfaces that feel weightless and respond instantly.", chips: ["React", "Next.js", "TypeScript", "Tailwind", "Framer Motion"] },
  { icon: "backend", code: "SYS-02", title: "Backend", blurb: "APIs and services built to survive any payload.", chips: ["Node.js", "Express", "FastAPI", "Go", "GraphQL"] },
  { icon: "data", code: "SYS-03", title: "Data", blurb: "Storage layers tuned for speed and scale.", chips: ["PostgreSQL", "MongoDB", "Redis", "Prisma"] },
  { icon: "devops", code: "SYS-04", title: "DevOps", blurb: "Ship to orbit with confidence and zero downtime.", chips: ["Docker", "Vercel", "AWS", "CI/CD", "Git"] },
];

export const projects = [
  {
    n: "01", tag: "SAAS · FULL-STACK", title: "Nebula Analytics",
    blurb: "Real-time analytics dashboard processing millions of events with sub-second queries and live charts.",
    chips: ["Next.js", "TypeScript", "Postgres", "WebSockets"],
    gradient: "linear-gradient(140deg, #181520, #0e0d13)",
    image: "/images/projects/nebula.png",
    live: "#", code: "#",
  },
  {
    n: "02", tag: "E-COMMERCE", title: "Orbit Market",
    blurb: "A headless commerce platform with a buttery checkout, Stripe payments, and edge-cached product pages.",
    chips: ["React", "Node.js", "Stripe", "Redis"],
    gradient: "linear-gradient(140deg, #121820, #0c0e12)",
    image: "/images/projects/orbit.png",
    live: "#", code: "#",
  },
  {
    n: "03", tag: "AI · TOOLING", title: "Cosmo AI",
    blurb: "An AI assistant that turns plain language into deployable code, streaming responses with the Vercel AI SDK.",
    chips: ["Next.js", "AI SDK", "FastAPI", "Vector DB"],
    gradient: "linear-gradient(140deg, #1c1611, #100d0b)",
    image: "/images/projects/cosmo.png",
    live: "#", code: "#",
  },
];

export const timeline = [
  { year: "2024 — NOW", role: "Senior Full-Stack Engineer", blurb: "Leading product engineering, mentoring crew, and architecting scalable systems end to end." },
  { year: "2022 — 2024", role: "Full-Stack Developer", blurb: "Built and shipped customer-facing features across the stack for a fast-growing startup." },
  { year: "2020 — 2022", role: "Frontend Engineer", blurb: "Crafted polished interfaces and design systems, obsessing over performance and UX." },
];

export const socials = [
  { label: "GitHub", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "X / Twitter", href: "#" },
  { label: "Email", href: "mailto:sandysandeepkur05@gmail.com" },
];

export const TOTAL_SECRETS = 5;
