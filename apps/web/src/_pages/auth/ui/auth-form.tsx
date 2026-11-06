"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { API_URL } from "@/shared/api";
import { useAuthSession } from "@/shared/auth";
import { useRouter } from "next/navigation";
import { Button, Eyebrow, Input, Pill } from "@/shared/ui";

const schema = z.object({ email: z.string().email(), password: z.string().min(8, "Use at least 8 characters") });
type Values = z.infer<typeof schema>;
export function AuthForm() {
  const { signIn } = useAuthSession(); const router = useRouter(); const [mode, setMode] = useState<"login"|"register">("login"); const [message,setMessage]=useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm<Values>({ resolver: zodResolver(schema) });
  async function submit(values: Values) { setMessage(""); try { const response = await fetch(`${API_URL}/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(mode === "register" ? { ...values, name: "HomeScope Explorer" } : values) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.message || "Could not sign in"); signIn(payload.data.access_token, payload.data.user); const returnTo = new URLSearchParams(window.location.search).get("returnTo"); router.push(returnTo && /^\/listings\/[a-z0-9-]+$/i.test(returnTo) ? returnTo : "/account"); } catch (error) { setMessage(error instanceof Error ? error.message : "API unavailable. Start Docker Compose to enable accounts."); } }
  function demo() { setValue("email", "demo@homescope.sg"); setValue("password", "DemoPass123!"); }
  return <div className="w-full max-w-[470px] rounded-2xl bg-white p-9 shadow-soft"><Eyebrow>Welcome home</Eyebrow><h1 className="mt-2 mb-3 font-serif text-[2.6rem] font-medium tracking-[-.035em]">{mode === "login" ? "Sign in" : "Create account"}</h1><p className="text-muted-copy">Save homes, keep searches and pick up exactly where you left off.</p><form className="mt-7 grid gap-3.5" onSubmit={handleSubmit(submit)}><label className="grid gap-1.5 text-[.8rem] font-bold">Email<Input className="h-[46px] border-line bg-white" type="email" {...register("email")}/>{errors.email && <small className="text-coral">{errors.email.message}</small>}</label><label className="grid gap-1.5 text-[.8rem] font-bold">Password<Input className="h-[46px] border-line bg-white" type="password" {...register("password")}/>{errors.password && <small className="text-coral">{errors.password.message}</small>}</label><Button type="submit" disabled={isSubmitting} className="h-[46px] rounded-[10px] bg-teal font-bold hover:bg-teal-dark">{isSubmitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</Button><Button variant="outline" className="h-[46px] rounded-[10px] border-line bg-white font-bold" type="button" onClick={demo}>Use demo credentials</Button></form>{message && <Pill className="mt-[18px]">{message}</Pill>}<p className="mt-[22px] text-center text-[.82rem]">{mode === "login" ? "New to HomeScope? " : "Already registered? "}<button className="border-0 bg-transparent font-extrabold text-teal" onClick={()=>setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button></p></div>;
}
