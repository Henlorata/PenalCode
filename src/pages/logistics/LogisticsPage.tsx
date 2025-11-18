import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Truck, Plus, CheckCircle2, XCircle, Clock, Search, Loader2 } from "lucide-react";
import type { VehicleRequest } from "@/types/supabase";
import { NewVehicleRequestDialog } from "./components/NewVehicleRequestDialog";

export function LogisticsPage() {
  const { supabase, profile, user } = useAuth();
  const [requests, setRequests] = React.useState<VehicleRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isNewOpen, setIsNewOpen] = React.useState(false);

  // Admin Action State
  const [selectedRequest, setSelectedRequest] = React.useState<VehicleRequest | null>(null);
  const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);
  const [adminPlate, setAdminPlate] = React.useState("");
  const [adminComment, setAdminComment] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  const fetchRequests = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_requests')
        .select(`
                    *,
                    profiles!vehicle_requests_user_id_fkey (full_name, badge_number, faction_rank)
                `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests((data as unknown as VehicleRequest[]) || []);

    } catch (err) { // Error 'err' használata az ESLint miatt
      console.error(err);
      toast.error("Hiba az igénylések betöltésekor");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const isAdmin = profile?.system_role === 'admin' || profile?.system_role === 'supervisor';

  const handleAdminAction = async () => {
    if (!selectedRequest || !actionType || !user) return;

    setIsProcessing(true);
    try {
      // JAVÍTÁS: 'any' használata a TS ellenőrzés kikapcsolására
      const updates: any = {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        processed_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (actionType === 'approve') {
        if (!adminPlate) throw new Error("Rendszám megadása kötelező elfogadáskor!");
        updates.vehicle_plate = adminPlate;
      } else {
        if (!adminComment) throw new Error("Indoklás megadása kötelező elutasításkor!");
        updates.admin_comment = adminComment;
      }

      // JAVÍTÁS: (supabase.from(...) as any).update(...) a 'never' hiba ellen
      const { error } = await (supabase.from('vehicle_requests') as any)
        .update(updates)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success(actionType === 'approve' ? "Igénylés elfogadva!" : "Igénylés elutasítva.");
      void fetchRequests();
      closeAdminDialog();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ismeretlen hiba";
      toast.error("Hiba történt", { description: errorMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  const closeAdminDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setAdminPlate("");
    setAdminComment("");
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-3 h-3 mr-1"/> Elfogadva</Badge>;
      case 'rejected': return <Badge className="bg-red-900 hover:bg-red-900 text-red-200"><XCircle className="w-3 h-3 mr-1"/> Elutasítva</Badge>;
      default: return <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/30"><Clock className="w-3 h-3 mr-1"/> Függőben</Badge>;
    }
  };

  if (isLoading && requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
        <p className="text-slate-400">Logisztikai adatok lekérése...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Logisztika</h1>
          <p className="text-slate-400">Járműigénylések és flotta kezelés.</p>
        </div>
        <Button onClick={() => setIsNewOpen(true)} className="bg-yellow-600 hover:bg-yellow-700 text-black">
          <Plus className="w-4 h-4 mr-2" /> Új Igénylés
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-slate-400" />
            Igénylések Listája
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center text-slate-500">
              <Search className="w-12 h-12 mb-2 opacity-20" />
              <p>Nincs megjeleníthető igénylés.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead>Státusz</TableHead>
                  <TableHead>Igénylő</TableHead>
                  <TableHead>Jármű</TableHead>
                  <TableHead>Indoklás / Megjegyzés</TableHead>
                  <TableHead>Dátum</TableHead>
                  {isAdmin && <TableHead className="text-right">Művelet</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>
                      <div className="font-medium text-white">{req.profiles?.full_name}</div>
                      <div className="text-xs text-slate-500 font-mono">#{req.profiles?.badge_number}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-white">{req.vehicle_type}</div>
                      {req.vehicle_plate && <Badge variant="outline" className="mt-1 font-mono border-slate-600 uppercase">{req.vehicle_plate}</Badge>}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-slate-300 truncate" title={req.reason}>{req.reason}</p>
                      {req.admin_comment && (
                        <p className="text-xs text-red-400 mt-1 italic">Elutasítva: {req.admin_comment}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(req.created_at).toLocaleDateString('hu-HU')}
                    </TableCell>
                    {isAdmin && req.status === 'pending' && (
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="ghost" className="text-green-500 hover:text-green-400 hover:bg-green-950" onClick={() => { setSelectedRequest(req); setActionType('approve'); }}>
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-950" onClick={() => { setSelectedRequest(req); setActionType('reject'); }}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                    {isAdmin && req.status !== 'pending' && <TableCell></TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewVehicleRequestDialog
        open={isNewOpen}
        onOpenChange={setIsNewOpen}
        onSuccess={fetchRequests}
      />

      <Dialog open={!!selectedRequest} onOpenChange={(o) => !o && closeAdminDialog()}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Igénylés {actionType === 'approve' ? 'Elfogadása' : 'Elutasítása'}</DialogTitle>
            <DialogDescription>
              Igénylő: {selectedRequest?.profiles?.full_name} (#{selectedRequest?.profiles?.badge_number})<br/>
              Jármű: {selectedRequest?.vehicle_type}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {actionType === 'approve' ? (
              <div className="space-y-2">
                <Label>Kiosztott Rendszám</Label>
                <Input
                  placeholder="Pl. SFSD-01"
                  className="bg-slate-950 border-slate-700 font-mono uppercase"
                  value={adminPlate}
                  onChange={(e) => setAdminPlate(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-slate-500">Add meg a jármű rendszámát, amit átadtál a kérelmezőnek.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Elutasítás Indoka</Label>
                <Textarea
                  placeholder="Pl. Nincs szabad gépjármű / Nem indokolt."
                  className="bg-slate-950 border-slate-700"
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeAdminDialog}>Mégse</Button>
            <Button
              className={actionType === 'approve' ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              onClick={handleAdminAction}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
              {actionType === 'approve' ? 'Kiosztás és Elfogadás' : 'Elutasítás'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}