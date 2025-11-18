import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DollarSign, Plus, CheckCircle2, XCircle, Clock, Search, Loader2, Trash2, Eye } from "lucide-react";
import type { BudgetRequest, Database } from "@/types/supabase";
import { NewBudgetRequestDialog } from "./components/NewBudgetRequestDialog";

export function FinancePage() {
  const { supabase, profile, user } = useAuth();
  const [requests, setRequests] = React.useState<BudgetRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isNewOpen, setIsNewOpen] = React.useState(false);

  // Admin Action
  const [selectedRequest, setSelectedRequest] = React.useState<BudgetRequest | null>(null);
  const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);
  const [adminComment, setAdminComment] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Képnézegető
  const [viewImageUrl, setViewImageUrl] = React.useState<string | null>(null);

  // Takarítás state
  const [isCleaning, setIsCleaning] = React.useState(false);

  const fetchRequests = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('budget_requests')
        .select(`
                    *,
                    profiles!budget_requests_user_id_fkey (full_name, badge_number, faction_rank)
                `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data as unknown as BudgetRequest[]) || []);
    } catch (error) {
      console.error(error);
      toast.error("Hiba az adatok betöltésekor");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  // FONTOS: Itt csak a 'admin' a jó, a supervisor nem!
  const isExecutive = profile?.system_role === 'admin';

  const handleAdminAction = async () => {
    if (!selectedRequest || !actionType || !user) return;
    setIsProcessing(true);
    try {
      const updates: any = {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        processed_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (actionType === 'reject' && !adminComment) {
        throw new Error("Elutasításkor kötelező indoklást írni!");
      }
      if (adminComment) updates.admin_comment = adminComment;

      const { error } = await (supabase.from('budget_requests') as any)
        .update(updates)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success("Kérelem feldolgozva!");
      void fetchRequests();
      closeAdminDialog();

    } catch (err) {
      toast.error("Hiba", { description: (err as Error).message });
    } finally {
      setIsProcessing(false);
    }
  };

  // TAKARÍTÁS FUNKCIÓ
  const handleCleanup = async () => {
    if (!confirm("Biztosan törlöd a 40 napnál régebbi, lezárt kérelmeket és a képeiket? Ez nem visszavonható!")) return;

    setIsCleaning(true);
    try {
      const response = await fetch('/api/cron/cleanup-finance', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Hiba");

      toast.success("Takarítás kész!", { description: data.message });
      void fetchRequests(); // Lista frissítése

    } catch (err) {
      toast.error("Hiba a takarítás közben", { description: (err as Error).message });
    } finally {
      setIsCleaning(false);
    }
  };

  // Kép megnyitása URL generálással
  const handleViewImage = async (path: string) => {
    const { data } = await supabase.storage.from('finance_proofs').createSignedUrl(path, 60);
    if (data?.signedUrl) setViewImageUrl(data.signedUrl);
    else toast.error("Nem sikerült betölteni a képet.");
  };

  const closeAdminDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setAdminComment("");
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-3 h-3 mr-1"/> Kifizetve</Badge>;
      case 'rejected': return <Badge className="bg-red-900 hover:bg-red-900 text-red-200"><XCircle className="w-3 h-3 mr-1"/> Elutasítva</Badge>;
      default: return <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/30"><Clock className="w-3 h-3 mr-1"/> Függőben</Badge>;
    }
  };

  if (isLoading && requests.length === 0) {
    return <div className="text-center py-20 text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2"/> Adatok betöltése...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Pénzügy</h1>
          <p className="text-slate-400">Költségtérítések és bírságok kezelése.</p>
        </div>
        <div className="flex gap-2">
          {isExecutive && (
            <Button variant="destructive" onClick={handleCleanup} disabled={isCleaning}>
              {isCleaning ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4 mr-2" />}
              Régi Adatok Törlése
            </Button>
          )}
          <Button onClick={() => setIsNewOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Új Igénylés
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Kérelmek Listája
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Nincs megjeleníthető kérelem.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead>Státusz</TableHead>
                  <TableHead>Igénylő</TableHead>
                  <TableHead>Összeg</TableHead>
                  <TableHead>Indoklás</TableHead>
                  <TableHead>Bizonyíték</TableHead>
                  <TableHead>Dátum</TableHead>
                  {isExecutive && <TableHead className="text-right">Művelet</TableHead>}
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
                    <TableCell className="font-bold text-green-400">
                      ${req.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-slate-300 truncate" title={req.reason}>{req.reason}</p>
                      {req.admin_comment && (
                        <p className="text-xs text-red-400 mt-1 italic">{req.admin_comment}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="h-8" onClick={() => handleViewImage(req.proof_image_path)}>
                        <Eye className="w-3 h-3 mr-1" /> Megtekint
                      </Button>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(req.created_at).toLocaleDateString('hu-HU')}
                    </TableCell>
                    {isExecutive && req.status === 'pending' && (
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="ghost" className="text-green-500 hover:text-green-400 hover:bg-green-950" onClick={() => { setSelectedRequest(req); setActionType('approve'); }}>
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-950" onClick={() => { setSelectedRequest(req); setActionType('reject'); }}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                    {isExecutive && req.status !== 'pending' && <TableCell></TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NewBudgetRequestDialog
        open={isNewOpen}
        onOpenChange={setIsNewOpen}
        onSuccess={fetchRequests}
      />

      {/* Képnézegető Modal */}
      <Dialog open={!!viewImageUrl} onOpenChange={(o) => !o && setViewImageUrl(null)}>
        <DialogContent className="bg-black border-slate-800 text-white max-w-4xl p-0 overflow-hidden">
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            {viewImageUrl && <img src={viewImageUrl} className="max-w-full max-h-full object-contain" alt="Proof"/>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={(o) => !o && closeAdminDialog()}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Kérelem {actionType === 'approve' ? 'Elfogadása' : 'Elutasítása'}</DialogTitle>
            <DialogDescription>Összeg: ${selectedRequest?.amount}</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {actionType === 'reject' && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Elutasítás indoka..."
                  className="bg-slate-950 border-slate-700"
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            {actionType === 'approve' && <p>Biztosan jóváhagyod a kifizetést?</p>}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeAdminDialog}>Mégse</Button>
            <Button
              className={actionType === 'approve' ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
              onClick={handleAdminAction}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
              {actionType === 'approve' ? 'Jóváhagyás' : 'Elutasítás'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}