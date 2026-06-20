"use client";

import { useState } from "react";
import Reveal from "../Reveal";
import Secret from "../Secret";
import { socials } from "@/lib/data";
import { useGame } from "../GameProvider";

const fieldClass =
  "peer w-full rounded-sm border border-line bg-bg/60 px-4 pb-2 pt-5 text-base text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent/40";
const labelClass =
  "pointer-events-none absolute left-4 top-4 font-mono text-[0.8rem] uppercase tracking-wider text-muted transition-all peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-accent peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[0.62rem] peer-[:not(:placeholder-shown)]:text-accent";

export default function Contact() {
  const { playSfx } = useGame();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "ok" | "err" | ""; msg: string }>({ type: "", msg: "" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      message: String(fd.get("message") || "").trim(),
    };
    setLoading(true);
    setStatus({ type: "", msg: "" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Transmission failed. Try again.");
      setStatus({ type: "ok", msg: `Transmission received, ${payload.name}. I'll respond at light speed.` });
      playSfx("win");
      form.reset();
    } catch (err) {
      setStatus({ type: "err", msg: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contact" className="relative mx-auto flex max-w-[1180px] justify-center px-5 py-[clamp(80px,12vh,140px)] sm:px-10 md:justify-end">
      <Reveal className="w-full max-w-[680px]">
        <div className="ticks rounded border border-line bg-panel p-[clamp(32px,6vw,60px)] text-center">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-accent2">// Establish Connection</p>
          <h2 className="my-4 text-[clamp(2rem,5vw,3.2rem)] font-extrabold tracking-[-0.03em]">
            Let&apos;s build something <span className="gradient-text">stellar</span>.
          </h2>
          <p className="mb-9 text-muted">Have a mission in mind? Send a transmission and I&apos;ll respond at light speed.</p>

          <form onSubmit={onSubmit} className="mb-8 flex flex-col gap-4 text-left">
            <div className="relative">
              <input name="name" required placeholder=" " className={fieldClass} />
              <label className={labelClass}>Your name</label>
            </div>
            <div className="relative">
              <input name="email" type="email" required placeholder=" " className={fieldClass} />
              <label className={labelClass}>Email address</label>
            </div>
            <div className="relative">
              <textarea name="message" rows={4} required placeholder=" " className={`${fieldClass} resize-y`} />
              <label className={labelClass}>Your message</label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-accent px-7 py-4 font-mono text-[0.82rem] font-bold uppercase tracking-wider text-bg transition-colors hover:bg-[#ff7a45] disabled:opacity-60"
            >
              {loading ? "Transmitting…" : "Send Transmission →"}
            </button>
            {status.msg && (
              <p className={`font-mono text-[0.78rem] ${status.type === "ok" ? "text-accent3" : "text-accent"}`}>
                {status.type === "ok" ? "✓ " : "✕ "}{status.msg}
              </p>
            )}
          </form>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-[0.74rem] uppercase tracking-wider">
            {socials.map((s) => (
              <a key={s.label} href={s.href} className="text-muted transition-colors hover:text-accent">{s.label}</a>
            ))}
          </div>
        </div>
      </Reveal>

      <Secret id={4} style={{ top: "12%", left: "8%" }} />
    </section>
  );
}
