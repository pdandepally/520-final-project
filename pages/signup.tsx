import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { api } from "@/utils/trpc/api";
import { AtSign, Sprout } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function SignUpPage() {
  const apiUtils = api.useUtils();
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"worker" | "employer">("worker");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { mutate: handleNewUser } = api.profiles.handleNewUser.useMutation({
    onSuccess: async () => {
      console.log("Profile created successfully");
      await apiUtils.invalidate();
      const destination = accountType === "employer" ? "/employer/dashboard" : "/worker/dashboard";
      router.push(destination);
    },
    onError: (err) => {
      console.error("Error creating profile:", err);
      setError(`Error al crear perfil: ${err.message}`);
      setLoading(false);
    },
  });

  const signUp = async () => {
    setError("");
    setLoading(true);
    
    // Basic validation
    if (!email || !password || !name || !handle) {
      setError("Por favor completa todos los campos requeridos");
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor ingresa un correo electrónico válido (ej: usuario@ejemplo.com)");
      setLoading(false);
      return;
    }
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/workers`,
          data: {
            display_name: name,
            username: handle,
          }
        }
      });
      
      if (signUpError) {
        // Show the actual error message from Supabase
        if (signUpError.message.includes("invalid")) {
          setError("Supabase está rechazando este correo. Intenta con otro correo o verifica la configuración de Supabase.");
        } else {
          setError(`Error: ${signUpError.message}`);
        }
        setLoading(false);
        return;
      }
      
      if (data.user) {
        console.log("User created in Supabase Auth:", data.user.id);
        console.log("Calling handleNewUser mutation...");
        handleNewUser({ displayName: name, username: handle, accountType });
      } else {
        setError("No se pudo crear el usuario");
        setLoading(false);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Ocurrió un error durante el registro");
      setLoading(false);
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
              <h1 className="text-2xl font-bold text-green-800">{t('auth.signup')}</h1>
              <p className="text-sm font-semibold" style={{ color: '#15803d' }}>{t('common.system')}</p>
              <div className="text-center text-sm font-medium" style={{ color: '#000000' }}>
                {t('auth.alreadyHaveAccount')}{" "}
                <Link href="/login" className="text-green-600 font-semibold hover:underline" style={{ color: '#16a34a' }}>
                  {t('auth.login')}
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
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email')}
                  className="border-green-300 focus:border-green-500"
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-green-800 font-semibold">👤 {t('auth.fullName')}</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('auth.fullName')}
                  className="border-green-300 focus:border-green-500"
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="handle" className="text-green-800 font-semibold">@ {t('auth.username')}</Label>
                <div className="relative">
                  <AtSign className="absolute top-2.5 left-2 h-4 w-4 text-green-600" />
                  <Input
                    className="pl-8 border-green-300 focus:border-green-500 bg-white"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder={t('auth.username')}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accountType" className="text-green-800 font-semibold">{t('account.accountType')}</Label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setAccountType("worker")}
                    disabled={loading}
                    className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                      accountType === "worker"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-300 hover:border-green-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">👷</div>
                      <div className="font-semibold text-green-800">{t('account.worker')}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {t('account.workerDesc')}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("employer")}
                    disabled={loading}
                    className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                      accountType === "employer"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-300 hover:border-green-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🏢</div>
                      <div className="font-semibold text-green-800">{t('account.employer')}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {t('account.employerDesc')}
                      </div>
                    </div>
                  </button>
                </div>
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
                onClick={signUp}
                disabled={loading}
              >
                {loading ? t('auth.signingUp') : t('auth.signup')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
