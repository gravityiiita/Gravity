"use client";

import type React from "react";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { useState } from "react";
import {
  Mail,
  MessageSquare,
  CheckCircle,
  Loader2,
  Send,
  XCircle,
  User,
  AtSign,
  AlignLeft,
  Github,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";
import MagicButton from "@/components/magic-button";

type StageKey = "processing" | "validating" | "moderating" | "checkingEmail" | "sending";

const stageOrder: Record<StageKey, number> = {
  processing: 0,
  validating: 1,
  moderating: 2,
  checkingEmail: 3,
  sending: 4,
};

const MIN_STEP_MS = 450;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  type Step = "idle" | StageKey | "done" | "error";
  const [step, setStep] = useState<Step>("idle");
  const [failedStep, setFailedStep] = useState<StageKey | null>(null);

  const stages: { key: StageKey; label: string }[] = [
    { key: "processing", label: "Processing your request" },
    { key: "validating", label: "Verifying your message details" },
    { key: "moderating", label: "Checking with reviewer for appropriateness" },
    { key: "checkingEmail", label: "Verifying email deliverability" },
    { key: "sending", label: "Sending email" },
  ];

  const stageState = (target: StageKey) => {
    if (step === "idle") return "pending";
    if (failedStep) {
      const failIdx = stageOrder[failedStep];
      const idx = stageOrder[target];
      if (idx < failIdx) return "done";
      if (idx === failIdx) return "error";
      return "pending";
    }
    if (step === "done") return "done";
    if (step === "error") return "pending";
    const current = stageOrder[step];
    const idx = stageOrder[target];
    if (current > idx) return "done";
    if (current === idx) return "active";
    return "pending";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setError(null);
    setFailedStep(null);
    setSubmitted(false);
    setSending(true);
    setStep("processing");

    let shownAt = Date.now();
    let failure: StageKey | null = null;

    const showStep = async (next: StageKey | "done") => {
      const elapsed = Date.now() - shownAt;
      if (elapsed < MIN_STEP_MS) await wait(MIN_STEP_MS - elapsed);
      setStep(next);
      shownAt = Date.now();
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        failure = "processing";
        throw new Error(data?.error || "Failed to send message");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      const handleEvent = async (event: {
        step?: StageKey | "done";
        status?: "active" | "error" | "done";
        ok?: boolean;
        error?: string;
      }) => {
        if (event.status === "active" && event.step && event.step !== "done") {
          await showStep(event.step);
          return;
        }
        if (event.status === "error") {
          const failed = event.step && event.step !== "done" ? event.step : "sending";
          failure = failed;
          setFailedStep(failed);
          setStep("error");
          throw new Error(event.error || "Failed to send message");
        }
        if (event.ok || event.step === "done") {
          await showStep("done");
          finished = true;
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          await handleEvent(JSON.parse(trimmed));
        }
      }

      if (buffer.trim()) await handleEvent(JSON.parse(buffer.trim()));
      if (!finished) throw new Error("Connection closed before the message was sent");

      await wait(600);
      setSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
      setStep("idle");
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err: any) {
      if (!failure) setFailedStep((current) => current ?? "processing");
      setError(err?.message || "Network error");
      setStep("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen mt-10 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Header */}
          <div className="text-center mb-16 slide-in-up">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-purple-400/80 mb-4">
              Contact Us
            </span>
            <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-4">
              Get In Touch
            </h1>
            <p className="text-lg text-foreground/60 max-w-md mx-auto">
              Have a question, idea, or just want to say hi? We&apos;d love to
              hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Left column */}
            <div className="flex flex-col gap-5 slide-in-up">
              {/* Email card */}
              <div
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14] p-5 flex items-center gap-4"
                style={{ boxShadow: "0 0 30px rgba(139,92,246,0.07)" }}
              >
                <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-purple-300" />
                </div>
                <a className="cursor-pointer"   href="mailto:gravity@iiita.ac.in">
                  <p className="text-xs font-semibold tracking-widest uppercase text-foreground/40 mb-0.5">
                    Email
                  </p>
                  <p className="text-sm font-medium text-foreground/90">
                    gravity@iiita.ac.in
                  </p>
                </a>
              </div>

              {/* Discord card */}
              <div
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14] p-5 flex items-center gap-4"
                style={{ boxShadow: "0 0 30px rgba(139,92,246,0.07)" }}
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
                  <MessageSquare size={18} className="text-indigo-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-foreground/40 mb-0.5">
                    Discord
                  </p>
                  <p className="text-sm font-medium text-foreground/90">
                    Join our community server
                  </p>
                </div>
              </div>

              {/* Visual filler â€” social links + ambient glow */}
              <div
                className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#0d0d14] flex-1 min-h-56"
                style={{ boxShadow: "0 0 40px rgba(139,92,246,0.06)" }}
              >
                {/* Floating orbs */}
                <div
                  className="absolute w-44 h-44 rounded-full -top-10 -left-10 opacity-30 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(139,92,246,0.55) 0%, transparent 70%)",
                    filter: "blur(32px)",
                  }}
                />
                <div
                  className="absolute w-36 h-36 rounded-full bottom-4 right-4 opacity-20 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(99,102,241,0.65) 0%, transparent 70%)",
                    filter: "blur(28px)",
                  }}
                />
                <div
                  className="absolute w-24 h-24 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(168,85,247,0.7) 0%, transparent 70%)",
                    filter: "blur(20px)",
                  }}
                />

                {/* Dot-grid */}
                <div
                  className="absolute inset-0 opacity-[0.035] pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                  }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full gap-5 py-10 px-6 text-center">
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-purple-400/70">
                    Find us on
                  </p>
                  <div className="flex items-center gap-3">
                    {[
                      { icon: Github, label: "GitHub", href: "#" },
                      { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/company/gravity-iiit-allahabad/" },
                      { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/gravityiiita/" },
                    ].map(({ icon: Icon, label, href }) => (
                      <a
                        key={label}
                        href={href}
                        aria-label={label}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-foreground/50 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all duration-200"
                      >
                        <Icon size={16} />
                      </a>
                    ))}
                  </div>
                  <p className="text-xs text-foreground/30 max-w-xs leading-relaxed">
                    Follow along for updates, events, and community highlights
                    from Gravity.
                  </p>
                </div>
              </div>
            </div>

            {/* Right column â€” Form */}
            <div
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14] p-7 slide-in-up"
              style={{
                animationDelay: "0.1s",
                boxShadow:
                  "0 0 60px rgba(139,92,246,0.10), 0 20px 40px rgba(0,0,0,0.5)",
              }}
            >
              {/* Gradient wash */}
              <div
                className="absolute top-0 left-0 right-0 h-32 opacity-30 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(139,92,246,0.12) 0%, transparent 100%)",
                }}
              />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Send size={15} className="text-purple-300" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base text-white">
                      Send a Message
                    </h2>
                    <p className="text-xs text-foreground/40 mt-0.5">
                      We&apos;ll reply as soon as possible
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground/70">
                      <User size={12} className="text-purple-400" /> Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-foreground/30 focus:outline-none focus:border-purple-500/60 transition-all duration-200"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground/70">
                      <AtSign size={12} className="text-purple-400" /> Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-foreground/30 focus:outline-none focus:border-purple-500/60 transition-all duration-200"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground/70">
                      <AlignLeft size={12} className="text-purple-400" />{" "}
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Your message..."
                      rows={5}
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-foreground/30 focus:outline-none focus:border-purple-500/60 transition-all duration-200 resize-none"
                    />
                  </div>

                  <MagicButton
                    type="submit"
                    className="w-full"
                    heightClass="h-12"
                    disabled={sending}
                  >
                    {sending
                      ? "Sending\u2026"
                      : submitted
                        ? "Message Sent!"
                        : "Send Message"}
                  </MagicButton>

                  {/* Progress stages */}
                  {(sending || step === "error") && (
                    <div className="p-4 rounded-xl bg-white/4 border border-white/8 text-sm">
                      <div className="space-y-1.5">
                        {stages.map((s) => {
                          const state = stageState(s.key);
                          return (
                            <div
                              key={s.key}
                              className="flex items-center gap-2 text-xs"
                            >
                              {state === "done" ? (
                                <CheckCircle
                                  size={13}
                                  className="text-green-400 shrink-0"
                                />
                              ) : state === "error" ? (
                                <XCircle
                                  size={13}
                                  className="text-red-400 shrink-0"
                                />
                              ) : state === "active" ? (
                                <Loader2
                                  size={13}
                                  className="animate-spin text-purple-400 shrink-0"
                                />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-white/15 shrink-0" />
                              )}
                              <span
                                className={
                                  state === "active"
                                    ? "text-foreground/90"
                                    : state === "error"
                                      ? "text-red-300"
                                      : state === "done"
                                        ? "text-foreground/50"
                                        : "text-foreground/30"
                                }
                              >
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Success */}
                  {submitted && (
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/25 text-green-300 text-sm flex items-center gap-2">
                      <CheckCircle size={15} />
                      Thank you! We&apos;ll get back to you soon.
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
