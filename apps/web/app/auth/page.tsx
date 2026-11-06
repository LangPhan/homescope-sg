import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Sign in" };
export default function AuthPage(){ return <main className="grid min-h-[calc(100vh-72px)] place-items-center bg-cream px-5 py-[60px]"><AuthForm/></main>; }
