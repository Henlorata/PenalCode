import * as React from "react";
import {useAuth} from "@/context/AuthContext";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {toast} from "sonner";
import {
  Plus,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  Car,
  User,
  Truck,
  Ship,
  Plane,
  AlertTriangle,
  ShieldCheck,
  Clock,
  CheckSquare
} from "lucide-react";
import type {VehicleRequest} from "@/types/supabase";
import {NewVehicleRequestDialog} from "./components/NewVehicleRequestDialog";
import {isSupervisory, isHighCommand} from "@/lib/utils";

// Ikon választó helper
const getVehicleIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('maverick') || t.includes('helikopter')) return <Plane className="w-5 h-5"/>;
  if (t.includes('predator') || t.includes('hajó')) return <Ship className="w-5 h-5"/>;
  if (t.includes('vontató') || t.includes('arocs') || t.includes('teher')) return <Truck className="w-5 h-5"/>;
  return <Car className="w-5 h-5"/>;
};

export function LogisticsPage() {
  const {supabase, profile, user} = useAuth();
  const [requests, setRequests] = React.useState<VehicleRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isNewOpen, setIsNewOpen] = React.useState(false);
  const [filter, setFilter] = React.useState("all");

  const [selectedRequest, setSelectedRequest] = React.useState<VehicleRequest | null>(null);
  const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);
  const [adminPlate, setAdminPlate] = React.useState("");
  const [adminComment, setAdminComment] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  const fetchRequests = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const {data, error} = await supabase
        .from('vehicle_requests')
        .select(`*, profiles!vehicle_requests_user_id_fkey (full_name, badge_number, faction_rank)`)
        .order('created_at', {ascending: false});
      if (error) throw error;
      setRequests((data as unknown as VehicleRequest[]) || []);
    } catch (err) {
      toast.error("Hiba az igénylések betöltésekor");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  // Statisztikák számítása
  const stats = React.useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };
  }, [requests]);

  // Lista szűrése
  const filteredRequests = React.useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter(r => r.status === filter);
  }, [requests, filter]);

  const canManageRequests = profile?.system_role === 'admin' || isSupervisory(profile) || isHighCommand(profile);

  const handleAdminAction = async () => {
    if (!selectedRequest || !actionType || !user) return;
    setIsProcessing(true);
    try {
      const updates: any = {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        processed_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (actionType === 'approve') {
        if (!adminPlate) throw new Error("Rendszám megadása kötelező!");
        updates.vehicle_plate = adminPlate;
      } else {
        if (!adminComment) throw new Error("Indoklás megadása kötelező!");
        updates.admin_comment = adminComment;
      }

      const {error} = await (supabase.from('vehicle_requests') as any).update(updates).eq('id', selectedRequest.id);
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: selectedRequest.user_id,
        title: 'Járműigénylés Frissítés',
        message: `A(z) ${selectedRequest.vehicle_type} igénylésedet ${actionType === 'approve' ? 'elfogadták' : 'elutasították'}.`,
        type: actionType === 'approve' ? 'success' : 'alert',
        link: '/logistics'
      });

      toast.success("Igénylés frissítve!");
      void fetchRequests();
      closeAdminDialog();
    } catch (err) {
      toast.error("Hiba", {description: (err as Error).message});
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

  if (isLoading && requests.length === 0) return <div className="flex h-screen items-center justify-center"><Loader2
    className="w-10 h-10 text-yellow-500 animate-spin"/></div>;

  return (
    <div
      className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10 h-[calc(100vh-6rem)] flex flex-col">
      {/* FEJLÉC */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg text-blue-500"><Truck className="w-6 h-6"/></div>
            Logisztika
          </h1>
          <p className="text-slate-400 mt-1 ml-1">Flottamenedzsment és járműigénylési központ.</p>
        </div>
        <Button onClick={() => setIsNewOpen(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold shadow-lg shadow-yellow-900/20 transition-all active:scale-95">
          <Plus className="w-4 h-4 mr-2"/> Új Igénylés
        </Button>
      </div>

      {/* STATISZTIKA KÁRTYÁK (ÚJ) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <Card className="bg-slate-900 border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div
              className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
              <Clock className="w-8 h-8"/>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Függőben</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div
              className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
              <CheckSquare className="w-8 h-8"/>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Elfogadva</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div
              className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Car className="w-8 h-8"/>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Összes Igénylés</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SZŰRŐ TABS ÉS LISTA */}
      <Tabs value={filter} onValueChange={setFilter} className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="all">Összes</TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:text-yellow-500">Függőben</TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:text-green-500">Elfogadva</TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:text-red-500">Elutasítva</TabsTrigger>
          </TabsList>
        </div>

        {filteredRequests.length === 0 ? (
          <div
            className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800 border-dashed animate-in fade-in slide-in-from-bottom-2">
            <Search className="w-12 h-12 mb-2 opacity-20 mx-auto"/>
            <p>Nincs a szűrésnek megfelelő igénylés.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mr-4 pr-4">
            <div
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {filteredRequests.map((req) => (
                <Card key={req.id}
                      className="bg-slate-900 border-slate-800 hover:border-slate-600 transition-all duration-300 flex flex-col group overflow-hidden shadow-lg">
                  <div
                    className={`h-1 w-full ${req.status === 'approved' ? 'bg-green-500' : req.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}/>

                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg border ${req.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-500' : req.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}>
                        {getVehicleIcon(req.vehicle_type)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white leading-tight">{req.vehicle_type}</div>
                        <div
                          className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date(req.created_at).toLocaleDateString('hu-HU')}</div>
                      </div>
                    </div>
                    {req.status === 'approved' ? (
                      <Badge
                        className="bg-green-900/30 text-green-400 border-green-900/50 font-mono px-2 py-1">{req.vehicle_plate}</Badge>
                    ) : req.status === 'rejected' ? (
                      <Badge variant="destructive"
                             className="bg-red-900/30 text-red-400 border-red-900/50">ELUTASÍTVA</Badge>
                    ) : (
                      <Badge variant="secondary"
                             className="bg-yellow-900/30 text-yellow-500 border-yellow-900/50 animate-pulse">FÜGGŐBEN</Badge>
                    )}
                  </div>

                  <div className="p-4 flex-1 space-y-4 min-w-0 flex flex-col">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 border border-slate-800/50">
                      <div
                        className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 shrink-0">
                        <User className="w-4 h-4"/>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white truncate">{req.profiles?.full_name}</div>
                        <div
                          className="text-xs text-slate-500 truncate">{req.profiles?.faction_rank} [#{req.profiles?.badge_number}]
                        </div>
                      </div>
                    </div>

                    <div
                      className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 w-full overflow-hidden flex-1 min-w-0">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3"/> Indoklás
                      </p>
                      <p className="text-sm text-slate-300 italic break-all whitespace-pre-wrap leading-relaxed w-full">
                        "{req.reason}"
                      </p>
                    </div>

                    {req.admin_comment && (
                      <div
                        className="text-xs text-red-400 mt-2 break-all whitespace-pre-wrap bg-red-950/20 p-2 rounded border border-red-900/20 w-full overflow-hidden">
                        <div className="flex items-center gap-1 font-bold mb-1"><AlertTriangle
                          className="w-3 h-3"/> Elutasítás oka:
                        </div>
                        {req.admin_comment}
                      </div>
                    )}
                  </div>

                  {canManageRequests && req.status === 'pending' && (
                    <div className="p-3 border-t border-slate-800 grid grid-cols-2 gap-3 bg-slate-950/30">
                      <Button size="sm" variant="outline"
                              className="border-green-900/50 text-green-500 hover:bg-green-900/20 hover:text-green-400 hover:border-green-800 transition-all"
                              onClick={() => {
                                setSelectedRequest(req);
                                setActionType('approve');
                              }}>
                        <CheckCircle2 className="w-4 h-4 mr-2"/> Elfogadás
                      </Button>
                      <Button size="sm" variant="outline"
                              className="border-red-900/50 text-red-500 hover:bg-red-900/20 hover:text-red-400 hover:border-red-800 transition-all"
                              onClick={() => {
                                setSelectedRequest(req);
                                setActionType('reject');
                              }}>
                        <XCircle className="w-4 h-4 mr-2"/> Elutasítás
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </Tabs>

      <NewVehicleRequestDialog open={isNewOpen} onOpenChange={setIsNewOpen} onSuccess={fetchRequests}/>

      {/* ADMIN DIALOG */}
      <Dialog open={!!selectedRequest} onOpenChange={(o) => !o && closeAdminDialog()}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Igénylés {actionType === 'approve' ? 'Elfogadása' : 'Elutasítása'}</DialogTitle>
            <DialogDescription>Igénylő: {selectedRequest?.profiles?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {actionType === 'approve' ? (
              <div className="space-y-2">
                <Label>Kiosztott Rendszám</Label>
                <Input placeholder="Pl. SFSD-01"
                       className="bg-slate-950 border-slate-700 font-mono uppercase text-lg tracking-widest"
                       value={adminPlate} onChange={(e) => setAdminPlate(e.target.value)} autoFocus/>
                <p className="text-xs text-slate-500">Add meg a jármű rendszámát.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Elutasítás Indoka</Label>
                {/* JAVÍTOTT TEXTAREA: break-all és resize-none */}
                <Textarea
                  placeholder="Indoklás..."
                  className="bg-slate-950 border-slate-700 resize-none h-24 break-all"
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
              onClick={handleAdminAction} disabled={isProcessing}>
              {isProcessing &&
                <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}{actionType === 'approve' ? 'Elfogadás' : 'Elutasítás'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}