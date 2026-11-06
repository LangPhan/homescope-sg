"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { API_URL } from "@/lib/api";
import { useAuthSession } from "@/components/auth-session";
import { useRouter } from "next/navigation";

const schema = z.object({ email: z.string().email(), password: z.string().min(8, "Use at least 8 characters") });
type Values = z.infer<typeof schema>;

export function AuthForm() {
  const { signIn } = useAuthSession();
  const router = useRouter();
  const [mode, setMode] = useState<"login"|"register">("login"); const [message,setMessage]=useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<Values>({ resolver: zodResolver(schema) });
  async function submit(values: Values) {
    setMessage("");
    try { const response = await fetch(`${API_URL}/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(mode === "register" ? { ...values, name: "HomeScope Explorer" } : values) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.message || "Could not sign in"); signIn(payload.data.access_token, payload.data.user); setMessage("Signed in. Your saved homes are ready."); router.push("/account"); } catch (error) { setMessage(error instanceof Error ? error.message : "API unavailable. Start Docker Compose to enable accounts."); }
  }
  function demo() { setValue("email", "demo@homescope.sg"); setValue("password", "DemoPass123!"); }
  return <div className="auth-card"><div className="eyebrow">Welcome home</div><h1 className="serif">{mode === "login" ? "Sign in" : "Create account"}</h1><p className="muted">Save homes, keep searches and pick up exactly where you left off.</p><form className="form-stack" onSubmit={handleSubmit(submit)}><label>Email<input className="field" type="email" {...register("email")}/>{errors.email && <small style={{color:"var(--coral)"}}>{errors.email.message}</small>}</label><label>Password<input className="field" type="password" {...register("password")}/>{errors.password && <small style={{color:"var(--coral)"}}>{errors.password.message}</small>}</label><button className="button button-primary" disabled={isSubmitting}>{isSubmitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button><button className="button button-ghost" type="button" onClick={demo}>Use demo credentials</button></form>{message && <p role="status" className="pill" style={{marginTop:18}}>{message}</p>}<p style={{textAlign:"center",fontSize:".82rem",marginTop:22}}>{mode === "login" ? "New to HomeScope? " : "Already registered? "}<button style={{border:0,background:"none",color:"var(--teal)",fontWeight:800}} onClick={()=>setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button></p></div>;
}
