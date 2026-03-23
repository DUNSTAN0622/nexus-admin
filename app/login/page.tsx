"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_AUTH_REDIRECT,
  getSafeRedirectPath,
} from "@/utils/auth-redirect";
import { createClient } from "@/utils/supabase/client";

type AuthMode = "login" | "register";
type AuthStep = "credentials" | "otp";
type FeedbackTone = "info" | "success";

type ModeCopy = {
  eyebrow: string;
  heading: string;
  description: string;
  submitLabel: string;
  switchLabel: string;
  switchAction: string;
};

const modeCopy: Record<AuthMode, ModeCopy> = {
  login: {
    eyebrow: "Secure Access",
    heading: "登入工作台",
    description: "使用公司帳號登入，快速進入物料、庫存與人員管理流程。",
    submitLabel: "驗證帳密",
    switchLabel: "還沒有帳號？",
    switchAction: "立即註冊",
  },
  register: {
    eyebrow: "Account Enrollment",
    heading: "建立員工帳號",
    description: "完成註冊後，系統將保留基本資料並等待管理員核配角色與部門權限。",
    submitLabel: "建立帳號",
    switchLabel: "已經有帳號？",
    switchAction: "返回登入",
  },
};

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(createClient);
  const [mode, setMode] = useState<AuthMode>("login");
  const [step, setStep] = useState<AuthStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: FeedbackTone;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOtpStep = mode === "login" && step === "otp";
  const copy = modeCopy[mode];
  const redirectTarget =
    getSafeRedirectPath(searchParams.get("next")) ?? DEFAULT_AUTH_REDIRECT;
  const heading = isOtpStep ? "輸入信箱驗證碼" : copy.heading;
  const description = isOtpStep
    ? `我們已將 6 位數驗證碼寄送到 ${email}，請完成驗證後再進入系統。`
    : copy.description;
  const submitLabel = isOtpStep ? "驗證並登入" : copy.submitLabel;
  const eyebrow = isOtpStep ? "Email Verification" : copy.eyebrow;

  function clearAlerts() {
    setErrorMessage("");
    setFeedback(null);
  }

  function resetOtpStep() {
    setStep("credentials");
    setOtp("");
  }

  function handleModeChange(nextMode: AuthMode) {
    if (isSubmitting || nextMode === mode) return;

    setMode(nextMode);
    resetOtpStep();
    setPassword("");
    clearAlerts();
  }

  async function handleRegister() {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data.session) {
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setErrorMessage(signOutError.message);
        return;
      }
    }

    setPassword("");
    setFullName("");
    resetOtpStep();
    setMode("login");
    setFeedback({
      tone: "success",
      message: "註冊申請已送出，請前往信箱完成帳號驗證。",
    });
  }

  async function handleCredentialLogin() {
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (passwordError) {
      setErrorMessage(passwordError.message);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setErrorMessage(signOutError.message);
      return;
    }

    const { error: otpSendError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (otpSendError) {
      setErrorMessage(otpSendError.message);
      return;
    }

    setPassword("");
    setOtp("");
    setStep("otp");
    setFeedback({
      tone: "success",
      message: "驗證碼已發送至您的信箱，請輸入 6 位數驗證碼。",
    });
  }

  async function handleOtpVerification() {
    if (otp.length !== 6) {
      setErrorMessage("請輸入 6 位數驗證碼。");
      return;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (!data.session) {
        setErrorMessage("驗證成功但尚未建立登入狀態，請重新登入。");
        return;
      }

      router.refresh();
      setTimeout(() => {
        router.push(redirectTarget);
      }, 500);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "驗證碼確認失敗，請稍後再試。",
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    clearAlerts();
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await handleRegister();
      } else if (step === "credentials") {
        await handleCredentialLogin();
      } else {
        await handleOtpVerification();
      }
    } catch {
      setErrorMessage("系統目前無法完成驗證，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 font-[family:var(--font-geist-sans)] text-slate-100 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.24),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)]" />
      <div className="absolute left-10 top-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <section className="relative flex w-full max-w-6xl flex-col-reverse gap-8 overflow-hidden rounded-[32px] border border-white/10 bg-white/6 shadow-[0_24px_80px_rgba(15,23,42,0.55)] backdrop-blur-xl lg:flex-row lg:gap-0">
        <div className="w-full space-y-8 border-t border-white/10 bg-slate-950/65 p-6 sm:p-8 lg:flex lg:w-[55%] lg:flex-col lg:justify-between lg:space-y-0 lg:border-t-0 lg:border-r lg:p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-blue-100 uppercase">
              NexusAdmin
            </div>
            <div className="space-y-4">
              <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">
                NexusAdmin 廠辦管理系統
              </h1>
              <p className="max-w-lg text-sm leading-7 text-slate-300">
                以企業內控為核心的物料管理入口，集中處理員工登入、庫存維護、採購追蹤與日常營運資料。
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-white">兩階段登入驗證</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                帳密通過後仍需完成信箱驗證，降低帳號外洩後的登入風險。
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-white">帳號審核流程</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                完成註冊後，系統會保留員工基本資訊，供後續角色核配與部門維護使用。
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-center bg-slate-950/35 p-5 sm:p-8 lg:w-[45%] lg:p-10">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/40 sm:p-8">
            <div className="mb-8 space-y-4">
              <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => handleModeChange("login")}
                  disabled={isSubmitting}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    mode === "login"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  登入
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("register")}
                  disabled={isSubmitting}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    mode === "register"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  註冊
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                  {eyebrow}
                </p>
                <p className="text-sm font-medium text-slate-400">
                  NexusAdmin 廠辦管理系統
                </p>
                <h2 className="text-2xl font-semibold text-white">{heading}</h2>
                <p className="text-sm leading-6 text-slate-400">{description}</p>
                {isOtpStep ? (
                  <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
                    驗證信箱：{email}
                  </div>
                ) : null}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {feedback ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    feedback.tone === "success"
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                      : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-100"
                  }`}
                >
                  {feedback.message}
                </div>
              ) : null}

              {errorMessage ? (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                >
                  {errorMessage}
                </div>
              ) : null}

              {mode === "register" ? (
                <div className="space-y-2">
                  <label
                    htmlFor="fullName"
                    className="text-sm font-medium text-slate-200"
                  >
                    員工姓名
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="請輸入員工姓名"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>
              ) : null}

              {!isOtpStep ? (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-slate-200"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-slate-200"
                    >
                      密碼
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                      placeholder={
                        mode === "login" ? "輸入登入密碼" : "至少 6 碼以上密碼"
                      }
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      disabled={isSubmitting}
                      className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <label
                    htmlFor="otp"
                    className="text-sm font-medium text-slate-200"
                  >
                    Email 驗證碼
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="請輸入 6 位數驗證碼"
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm tracking-[0.35em] text-white outline-none transition placeholder:tracking-normal placeholder:text-slate-500 focus:border-cyan-300 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/30 disabled:cursor-not-allowed disabled:bg-cyan-400/60"
              >
                {isSubmitting ? "處理中..." : submitLabel}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
              <p>
                {copy.switchLabel}
                <button
                  type="button"
                  onClick={() =>
                    handleModeChange(mode === "login" ? "register" : "login")
                  }
                  disabled={isSubmitting}
                  className="ml-2 font-medium text-cyan-300 transition hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {copy.switchAction}
                </button>
              </p>

              {isOtpStep ? (
                <button
                  type="button"
                  onClick={() => {
                    resetOtpStep();
                    clearAlerts();
                  }}
                  disabled={isSubmitting}
                  className="font-medium text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  返回帳密輸入
                </button>
              ) : (
                <span className="text-xs uppercase tracking-[0.22em] text-slate-500">
                  內部帳號流程
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
          <p className="text-sm text-slate-400">載入登入頁面中...</p>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
