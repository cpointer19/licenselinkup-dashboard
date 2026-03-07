"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Lock, Sparkles } from "lucide-react";

export function LoginClient() {
  const [password, setPassword]   = useState("");
  const [show, setShow]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [shake, setShake]         = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);
  const router                    = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Incorrect password.");
      setPassword("");
      setLoading(false);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#2E3946] via-[#1a2533] to-[#2E3946] px-4">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-[#5375FF] opacity-10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-violet-600 opacity-10 blur-3xl" />

      <div
        className={`relative w-full max-w-sm transition-all ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo + badge */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <Image
              src="/ll-logo.svg"
              alt="LicenseLinkUp"
              width={64}
              height={64}
              className="rounded-2xl shadow-lg"
            />
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">LicenseLinkUp</h1>
              <p className="text-sm text-blue-300/80">Intelligence Dashboard</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <Lock className="h-3 w-3 text-slate-400" />
              <span className="text-xs text-slate-400">Private access</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter password…"
                  className={`w-full rounded-xl border bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-2 ${
                    error
                      ? "border-red-500/60 focus:ring-red-500/30"
                      : "border-white/10 focus:border-[#5375FF]/60 focus:ring-[#5375FF]/20"
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                  <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!password.trim() || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5375FF] to-[#6B8AFF] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5375FF]/20 transition-all hover:from-[#6B8AFF] hover:to-[#5375FF] hover:shadow-[#5375FF]/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-600">
            <Sparkles className="h-3 w-3" />
            <span>Powered by ActiveCampaign + Claude</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-8px); }
          30%       { transform: translateX(8px); }
          45%       { transform: translateX(-6px); }
          60%       { transform: translateX(6px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 0.55s ease-in-out; }
      `}</style>
    </div>
  );
}
