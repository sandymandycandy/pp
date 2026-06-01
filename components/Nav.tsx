"use client";

import { useEffect, useState } from "react";
import { useGame } from "./GameProvider";

const links = [
  { href: "#about",    label: "About",    section: "about"    },
  { href: "#skills",   label: "Stack",    section: "skills"   },
  { href: "#projects", label: "Missions", section: "projects" },
  { href: "#journey",  label: "Journey",  section: "journey"  },
];

export default function Nav() {
  const { playSfx } = useGame();
  const [scrolled,  setScrolled]  = useState(false);
  const [open,      setOpen]      = useState(false);
  const [activeId,  setActiveId]  = useState("");

  // Track which section is currently in view
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = [...links.map((l) => l.section), "contact", "hero"];

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry that is most visible (highest intersectionRatio)
        let best = "";
        let bestRatio = 0;
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > bestRatio) {
            bestRatio = e.intersectionRatio;
            best = e.target.id;
          }
        });
        if (best) setActiveId(best);
      },
      { threshold: [0.15, 0.4, 0.6] }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const close = () => { setOpen(false); playSfx("click"); };

  const isActive = (section: string) =>
    activeId === section ||
    (section === "about" && activeId === "hero");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[90] flex items-center justify-between px-5 transition-all duration-300 sm:px-10 ${
        scrolled ? "border-b border-line bg-bg/70 py-3.5 backdrop-blur-xl" : "border-b border-transparent py-5"
      }`}
    >
      <a href="#hero" className="flex items-center gap-2.5 font-mono text-[0.92rem] font-bold uppercase tracking-wider">
        <span className="animate-spin-slow text-xl text-accent">◈</span>
        <span>SANDEEP<span className="text-accent">.</span>DEV</span>
      </a>

      {/* Desktop nav */}
      <nav className="hidden items-center gap-8 font-mono text-[0.78rem] uppercase tracking-wider md:flex">
        {links.map((l) => {
          const active = isActive(l.section);
          return (
            <a
              key={l.href}
              href={l.href}
              onClick={() => playSfx("click")}
              className={`group relative transition ${active ? "text-accent" : "text-muted hover:text-ink"}`}
            >
              {active && (
                <span className="absolute -left-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent" />
              )}
              {l.label}
              <span
                className={`absolute -bottom-1.5 left-0 h-px bg-accent transition-all duration-300 ${
                  active ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </a>
          );
        })}

        <a
          href="#contact"
          onClick={() => playSfx("click")}
          className={`rounded-sm border px-5 py-2.5 transition-colors ${
            activeId === "contact"
              ? "border-accent bg-accent/10 text-accent"
              : "border-line text-ink hover:border-accent hover:text-accent"
          }`}
        >
          Contact
        </a>
      </nav>

      {/* Mobile hamburger */}
      <button
        aria-label="Toggle menu"
        onClick={() => setOpen((o) => !o)}
        className="z-[95] flex flex-col gap-[5px] md:hidden"
      >
        <span className={`h-0.5 w-6 bg-ink transition ${open ? "translate-y-[7px] rotate-45" : ""}`} />
        <span className={`h-0.5 w-6 bg-ink transition ${open ? "opacity-0" : ""}`} />
        <span className={`h-0.5 w-6 bg-ink transition ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
      </button>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 flex h-screen flex-col items-center justify-center gap-9 bg-bg/96 text-[1.3rem] backdrop-blur-2xl transition-transform duration-400 md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {[...links, { href: "#contact", label: "Contact", section: "contact" }].map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={close}
            className={`transition ${isActive(l.section) ? "text-accent" : "text-ink hover:text-accent2"}`}
          >
            {l.label}
          </a>
        ))}
      </div>
    </header>
  );
}
