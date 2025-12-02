import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { Sprout } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const logIn = async () => {
    setError("");
    setLoading(true);
    
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (loginError) {
      setError(loginError.message);
      setLoading(false);
    } else if (data.user) {
      // Get user profile to redirect to correct dashboard
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", data.user.id)
        .single();
      
      const destination = profile?.account_type === "employer" ? "/employer/dashboard" : "/worker/dashboard";
      router.push(destination);
    }
  };

  return (
    <div className="bg-gradient-to-b from-green-50 to-green-100 flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white">
                <Sprout className="size-8" />
              </div>
              <h1 className="text-2xl font-bold text-green-800">{t('auth.login')}</h1>
              <p className="text-sm font-semibold" style={{ color: '#15803d' }}>{t('common.system')}</p>
              <div className="text-center text-sm font-medium" style={{ color: '#000000' }}>
                {t('auth.noAccount')}{" "}
                <Link href="/signup" className="text-green-600 font-semibold hover:underline" style={{ color: '#16a34a' }}>
                  {t('auth.signup')}
                </Link>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-green-800 font-semibold">📧 {t('auth.email')}</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email').toLowerCase()}
                  className="border-green-300 focus:border-green-500"
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-green-800 font-semibold">🔒 {t('auth.password')}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-green-300 focus:border-green-500"
                  required
                  disabled={loading}
                />
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold" 
                onClick={logIn}
                disabled={loading}
              >
                {loading ? t('auth.loggingIn') : t('auth.login')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
