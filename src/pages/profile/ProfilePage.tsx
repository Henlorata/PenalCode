import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Key, Save, Fingerprint, Loader2 } from "lucide-react";

export function ProfilePage() {
  const { profile, supabase } = useAuth();
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Jelszócsere state
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  if (!profile) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("A jelszavak nem egyeznek!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A jelszónak legalább 6 karakternek kell lennie.");
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdating(false);

    if (error) {
      toast.error("Hiba a jelszó módosításakor", { description: error.message });
    } else {
      toast.success("Jelszó sikeresen módosítva!");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // Színkódok a divíziókhoz
  const getDivisionColor = (div: string) => {
    switch(div) {
      case 'SEB': return 'bg-red-900 text-red-100 border-red-700';
      case 'MCB': return 'bg-blue-900 text-blue-100 border-blue-700';
      default: return 'bg-green-900 text-green-100 border-green-700'; // TSB
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Személyi Dosszié</h1>
          <p className="text-slate-400">Saját adatok és beállítások kezelése.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* --- DIGITÁLIS IGAZOLVÁNY (ID CARD) --- */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-900 border-slate-800 overflow-hidden relative shadow-2xl">
            {/* Háttér minta */}
            <div className="absolute inset-0 bg-[url('/mcb_logo.png')] bg-center bg-no-repeat opacity-5 pointer-events-none grayscale bg-[length:80%]" />

            <CardHeader className="text-center border-b border-slate-800 pb-6">
              <div className="mx-auto w-32 h-32 relative mb-4">
                <Avatar className="w-full h-full border-4 border-slate-800 shadow-lg">
                  <AvatarImage src={profile.avatar_url} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-slate-800 text-slate-500 font-bold">{profile.badge_number}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-slate-950 border border-slate-700 rounded-full p-1.5" title="Aktív szolgálatban">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white">{profile.full_name}</CardTitle>
              <CardDescription className="text-yellow-500 font-medium uppercase tracking-widest text-xs mt-1">
                {profile.faction_rank}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center gap-3 text-slate-400">
                  <Shield className="w-5 h-5" />
                  <span className="text-sm font-medium">Jelvényszám</span>
                </div>
                <span className="font-mono text-white font-bold tracking-wider">#{profile.badge_number}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center gap-3 text-slate-400">
                  <Fingerprint className="w-5 h-5" />
                  <span className="text-sm font-medium">Osztály</span>
                </div>
                <Badge variant="outline" className={`${getDivisionColor(profile.division)}`}>
                  {profile.division}
                </Badge>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs uppercase text-slate-500 font-semibold ml-1">Jogosultságok</span>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-slate-800 hover:bg-slate-700">MDC Hozzáférés</Badge>
                  {profile.system_role === 'admin' && <Badge variant="default" className="bg-red-600 hover:bg-red-700">Adminisztrátor</Badge>}
                  {profile.system_role === 'supervisor' && <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700">Vezetőség</Badge>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-950 py-3 border-t border-slate-800 justify-center">
              <p className="text-xs text-slate-500 font-mono">ID: {profile.id.split('-')[0].toUpperCase()}</p>
            </CardFooter>
          </Card>
        </div>

        {/* --- BEÁLLÍTÁSOK --- */}
        <div className="lg:col-span-2 space-y-6">

          {/* Jelszócsere */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-slate-400" />
                Biztonsági Beállítások
              </CardTitle>
              <CardDescription>A fiókod jelszavának módosítása.</CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordChange}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Új Jelszó</Label>
                    <Input
                      id="new-password"
                      type="password"
                      className="bg-slate-950 border-slate-700"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Új Jelszó Megerősítése</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      className="bg-slate-950 border-slate-700"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-slate-800 pt-4 bg-slate-900/50">
                <Button type="submit" disabled={isUpdating || !newPassword} className="ml-auto bg-yellow-600 hover:bg-yellow-700 text-black">
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Jelszó Mentése
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Statisztikák (Placeholder) */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Szolgálati Statisztikák</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-white">0</div>
                  <div className="text-xs text-slate-500 uppercase mt-1">Lezárt Akta</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-white">0</div>
                  <div className="text-xs text-slate-500 uppercase mt-1">Igénylés</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-white">0</div>
                  <div className="text-xs text-slate-500 uppercase mt-1">Jelentés</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                  <div className="text-2xl font-bold text-green-500">Aktív</div>
                  <div className="text-xs text-slate-500 uppercase mt-1">Státusz</div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}