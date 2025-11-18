import * as React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Shield, CheckCircle2, BadgeAlert, User, Mail, Lock } from "lucide-react";
import { FACTION_RANKS, type DepartmentDivision } from "@/types/supabase";

export function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [badgeNumber, setBadgeNumber] = React.useState("");
  const [selectedRank, setSelectedRank] = React.useState<string>(FACTION_RANKS[FACTION_RANKS.length - 1]);
  const [selectedDivision, setSelectedDivision] = React.useState<DepartmentDivision>("TSB");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (badgeNumber.length !== 4 || isNaN(Number(badgeNumber))) {
      setError("A jelvényszámnak pontosan 4 számjegyűnek kell lennie!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          badge_number: badgeNumber,
          faction_rank: selectedRank,
          division: selectedDivision
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Hiba történt');
      }

      toast.success("Fiók létrehozva", {
        description: "A regisztráció sikeres. A fiókod jóváhagyásra vár.",
        duration: 5000,
      });

      navigate('/login');

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex">

      {/* BAL OLDAL - DEKORÁCIÓ (Csak nagy képernyőn) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden border-r border-slate-800">
        {/* Háttérkép helye (most egy gradiens helyettesíti) */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-yellow-950/20" />
        <div className="absolute inset-0 bg-[url('/sfsd_bg.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay" />

        <div className="relative z-10 max-w-md text-center px-8">
          <div className="mb-8 flex justify-center">
            <div className="h-32 w-32 bg-gradient-to-b from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.3)] p-1">
              <div className="h-full w-full bg-slate-900 rounded-full flex items-center justify-center border border-yellow-600/50">
                <Shield className="h-16 w-16 text-yellow-500" />
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">San Fierro Sheriff's Dept.</h2>
          <p className="text-lg text-slate-400 mb-8">
            "A Community Dedicated to Service, Protection, and Integrity."
          </p>
          <div className="space-y-4 text-left bg-slate-950/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Hivatalos MDC hozzáférés</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Bizonyíték raktár kezelése</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span>Logisztikai igénylések</span>
            </div>
          </div>
        </div>
      </div>

      {/* JOBB OLDAL - ŰRLAP */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">

          {/* Mobilon is látható fejléc */}
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-4">
              <Shield className="h-12 w-12 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Fiók Létrehozása</h1>
            <p className="text-slate-400 mt-2">Add meg a szolgálati adataidat a regisztrációhoz.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400 text-sm">
              <BadgeAlert className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">

            <div className="space-y-5">
              {/* IC Név & Jelvény */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Teljes Név (IC)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      required
                      placeholder="John Doe"
                      className="pl-9 bg-slate-900 border-slate-800 focus:border-yellow-600 focus:ring-yellow-600/20 h-10"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Jelvény</label>
                  <Input
                    required
                    placeholder="1192"
                    maxLength={4}
                    className="bg-slate-900 border-slate-800 focus:border-yellow-600 focus:ring-yellow-600/20 h-10 font-mono text-center tracking-widest"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Rang és Osztály */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Főosztály</label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-600/20"
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value as DepartmentDivision)}
                  >
                    <option value="TSB">TSB (Járőr)</option>
                    <option value="SEB">SEB (Taktikai)</option>
                    <option value="MCB">MCB (Nyomozó)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Rendfokozat</label>
                  <select
                    className="w-full h-10 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-yellow-600 focus:ring-2 focus:ring-yellow-600/20"
                    value={selectedRank}
                    onChange={(e) => setSelectedRank(e.target.value)}
                  >
                    {FACTION_RANKS.map((rank) => (
                      <option key={rank} value={rank}>{rank}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Login Adatok */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Email Cím</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      required
                      type="email"
                      placeholder="badge@sfsd.gov"
                      className="pl-9 bg-slate-900 border-slate-800 focus:border-yellow-600 focus:ring-yellow-600/20"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Jelszó</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                      required
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 bg-slate-900 border-slate-800 focus:border-yellow-600 focus:ring-yellow-600/20"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold h-11 transition-all" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Regisztráció
              </Button>

              <p className="text-center mt-4 text-sm text-slate-500">
                Már rendelkezel hozzáféréssel?{' '}
                <Link to="/login" className="text-yellow-500 hover:text-yellow-400 font-medium hover:underline underline-offset-4">
                  Belépés
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}