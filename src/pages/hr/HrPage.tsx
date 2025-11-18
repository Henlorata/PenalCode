import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle2, Shield, Loader2, UserPlus } from "lucide-react";
import type { Profile } from "@/types/supabase";

export function HrPage() {
  const { supabase } = useAuth();
  const [users, setUsers] = React.useState<Profile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Hiba a felhasználók betöltésekor");
    } else {
      setUsers(data || []);
    }
    setIsLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusChange = async (userId: string, action: 'approve' | 'reject') => {
    setProcessingId(userId);
    try {
      if (action === 'approve') {
        const response = await fetch('/api/admin/update-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, system_role: 'user' }),
        });
        if (!response.ok) throw new Error("API hiba");
        toast.success("Felhasználó jóváhagyva!");
      } else {
        const response = await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        if (!response.ok) throw new Error("API hiba");
        toast.warning("Felhasználó elutasítva és törölve.");
      }
      fetchUsers();
    } catch (error) {
      toast.error("Hiba történt a művelet során.");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingUsers = users.filter(u => u.system_role === 'pending');
  const activeUsers = users.filter(u => u.system_role !== 'pending');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mr-2" /> HR Adatok betöltése...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Személyügy (HR)</h1>
          <p className="text-slate-400">Állomány kezelése és jogosultságok.</p>
        </div>
      </div>

      {/* VÁRAKOZÓ KÉRELMEK */}
      <Card className="bg-slate-900 border-yellow-600/50 shadow-[0_0_20px_rgba(202,138,4,0.1)]">
        <CardHeader>
          <CardTitle className="text-yellow-500 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Jóváhagyásra Vár ({pendingUsers.length})
          </CardTitle>
          <CardDescription>Ezek a felhasználók regisztráltak, de még nem léphetnek be.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <p className="text-slate-500 italic text-center py-4">Nincs függőben lévő regisztráció.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Jelvény</TableHead>
                  <TableHead className="text-slate-400">Név</TableHead>
                  <TableHead className="text-slate-400">Rang</TableHead>
                  <TableHead className="text-slate-400">Osztály</TableHead>
                  <TableHead className="text-right text-slate-400">Műveletek</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id} className="border-slate-800">
                    <TableCell className="font-mono text-yellow-500 font-bold">#{user.badge_number}</TableCell>
                    <TableCell className="font-medium text-white">{user.full_name}</TableCell>
                    <TableCell>{user.faction_rank}</TableCell>
                    <TableCell><Badge variant="outline">{user.division}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-950 text-red-400 hover:bg-red-900 border border-red-900"
                        onClick={() => handleStatusChange(user.id, 'reject')}
                        disabled={!!processingId}
                      >
                        Elutasít
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleStatusChange(user.id, 'approve')}
                        disabled={!!processingId}
                      >
                        {processingId === user.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle2 className="h-4 w-4 mr-2"/>}
                        Jóváhagy
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* AKTÍV ÁLLOMÁNY */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Aktív Állomány
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead>Jelvény</TableHead>
                <TableHead>Név</TableHead>
                <TableHead>Rang</TableHead>
                <TableHead>Jogosultság</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeUsers.map((user) => (
                <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-mono text-slate-400">#{user.badge_number}</TableCell>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.faction_rank}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={user.system_role === 'admin' ? 'bg-red-900 text-red-200' : ''}>
                      {user.system_role}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}