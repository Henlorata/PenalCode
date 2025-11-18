import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {LogOut, FileText, Truck, ShieldAlert, DollarSign} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Fejléc */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-yellow-500">Irányítópult</h1>
            <p className="text-slate-400">Üdvözöljük, {profile?.faction_rank} {profile?.full_name}!</p>
          </div>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2"/> Kijelentkezés
          </Button>
        </div>

        {/* Modulok Helye */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* MCB Modul */}
          <Card className="bg-slate-900 border-slate-800 hover:border-yellow-600/50 transition-colors cursor-pointer group" onClick={() => navigate('/mcb')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-200 group-hover:text-yellow-500">
                <ShieldAlert className="w-6 h-6"/> Nyomozó Iroda (MCB)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Akták kezelése, bizonyítékok, nyomozati anyagok.</p>
            </CardContent>
          </Card>

          {/* Logisztika */}
          <Card className="bg-slate-900 border-slate-800 hover:border-yellow-600/50 transition-colors cursor-pointer group" onClick={() => navigate('/logistics')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-200 group-hover:text-yellow-500">
                <Truck className="w-6 h-6"/> Logisztika
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Szolgálati gépjárművek igénylése és flottakezelés.</p>
            </CardContent>
          </Card>

          {/* ÚJ: Pénzügy Kártya */}
          <Card className="bg-slate-900 border-slate-800 hover:border-green-600/50 transition-colors cursor-pointer group" onClick={() => navigate('/finance')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-200 group-hover:text-green-500">
                {/* Ide importálni kell a DollarSign vagy Banknote ikont a lucide-react-ból */}
                <DollarSign className="w-6 h-6"/> Pénzügy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Költségtérítések igénylése és bírságok elszámolása.</p>
            </CardContent>
          </Card>

          {/* Dokumentáció */}
          <Card className="bg-slate-900 border-slate-800 opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-slate-200">
                <FileText className="w-6 h-6"/> Dokumentáció
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">Penal Code, Szabályzatok, Oktatóanyagok. (Fejlesztés alatt)</p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}