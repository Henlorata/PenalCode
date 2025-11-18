import { useState } from "react";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Truck,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight, Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppLayout() {
  const { profile, signOut, loading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) return <LoadingScreen />;

  // Ha nincs profil vagy pending, ne engedjük be a belső felületre
  // (Kivéve ha épp a dashboardon vagyunk, ott megjelenhet egy "Várakozás" üzenet, de inkább kezeljük szigorúan)
  if (!profile) return <Navigate to="/login" replace />;

  // Menü elemek definíciója
  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Irányítópult",
      path: "/dashboard",
      show: true
    },
    {
      icon: Users,
      label: "HR / Személyügy",
      path: "/hr",
      show: profile.system_role === 'admin' || profile.system_role === 'supervisor'
    },
    {
      icon: ShieldAlert,
      label: "Nyomozó Iroda (MCB)",
      path: "/mcb",
      show: profile.system_role === 'admin' || profile.division === 'MCB'
    },
    {
      icon: Truck,
      label: "Logisztika",
      path: "/logistics",
      show: true // Mindenki láthatja (járműigénylés)
    },
    {
      icon: Banknote,
      label: "Pénzügy",
      path: "/finance",
      show: true // Mindenki láthatja (leadás), de csak admin kezeli
    },
    {
      icon: FileText,
      label: "Dokumentáció",
      path: "/resources",
      show: true
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">

      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-800 bg-slate-900/50 fixed h-full z-20 backdrop-blur-xl">
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <ShieldAlert className="h-8 w-8 text-yellow-500 mr-3" />
          <span className="font-bold text-lg tracking-wider text-white">SFSD <span className="text-yellow-500">INTRA</span></span>
        </div>

        {/* Navigáció */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => item.show && (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative overflow-hidden",
                location.pathname.startsWith(item.path)
                  ? "bg-yellow-600/10 text-yellow-500"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              )}
            >
              {location.pathname.startsWith(item.path) && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-r-full" />
              )}
              <item.icon className={cn("h-5 w-5 mr-3 transition-colors", location.pathname.startsWith(item.path) ? "text-yellow-500" : "text-slate-500 group-hover:text-slate-300")} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <Link to="/profile" className="flex items-center gap-3 mb-3 hover:bg-slate-800 p-2 rounded-md transition-colors cursor-pointer group">
            <Avatar className="h-9 w-9 border border-slate-700 group-hover:border-yellow-600/50 transition-colors">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-slate-800 text-slate-300 font-bold">{profile.badge_number}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate group-hover:text-yellow-500 transition-colors">{profile.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{profile.faction_rank}</p>
            </div>
          </Link>
          <Button variant="outline" size="sm" className="w-full border-slate-700 hover:bg-red-950 hover:text-red-500 hover:border-red-900 transition-colors" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Kijelentkezés
          </Button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">

        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center">
            <ShieldAlert className="h-6 w-6 text-yellow-500 mr-2" />
            <span className="font-bold text-white">SFSD</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-20 bg-slate-950/95 pt-20 px-4 space-y-2">
            {menuItems.map((item) => item.show && (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center px-4 py-4 rounded-xl text-base font-medium border border-transparent",
                  location.pathname.startsWith(item.path)
                    ? "bg-slate-900 text-yellow-500 border-yellow-600/20"
                    : "text-slate-400 hover:bg-slate-900"
                )}
              >
                <item.icon className="h-6 w-6 mr-4" />
                {item.label}
                <ChevronRight className="ml-auto h-5 w-5 opacity-50" />
              </Link>
            ))}
            <Button variant="destructive" className="w-full mt-8 py-6 text-lg" onClick={signOut}>
              <LogOut className="h-6 w-6 mr-2" /> Kijelentkezés
            </Button>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 lg:p-10 overflow-x-hidden">
          <Outlet />
        </div>

      </main>
    </div>
  );
}