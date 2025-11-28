import {useState, useEffect} from "react";
import {useAuth} from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {toast} from "sonner";
import {Search, UserCheck, Loader2, RefreshCw} from "lucide-react";
import {Badge} from "@/components/ui/badge";

interface AdminExamAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminExamAssignDialog({open, onOpenChange}: AdminExamAssignDialogProps) {
  const {supabase} = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [orphanExams, setOrphanExams] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Adatok betöltése
  const fetchData = async (query = "") => {
    setIsLoading(true);
    try {
      // 1. Dátum számítás (3 nap) a vizsgákhoz
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // --- VIZSGÁK LEKÉRÉSE (Gazdátlanok) ---
      let examQuery = supabase
        .from('exam_submissions')
        .select('id, applicant_name, start_time, status, exams(title)')
        .is('user_id', null); // Csak ami nincs hozzárendelve

      if (query) {
        examQuery = examQuery.ilike('applicant_name', `%${query}%`);
      } else {
        examQuery = examQuery.gte('start_time', threeDaysAgo.toISOString());
      }

      const {data: exams, error: examError} = await examQuery.order('start_time', {ascending: false}).limit(20);
      if (examError) throw examError;

      setOrphanExams(exams || []);

      // --- FELHASZNÁLÓK LEKÉRÉSE (Akiknek MÉG NINCS vizsgájuk) ---

      // A. Lekérjük azokat a user ID-kat, akiknek már van bármilyen vizsgájuk
      // (Ez azért kell, hogy kizárjuk őket a listából)
      const {data: existingSubmissions} = await supabase
        .from('exam_submissions')
        .select('user_id')
        .not('user_id', 'is', null);

      const excludedUserIds = existingSubmissions?.map(s => s.user_id) || [];

      // B. Lekérjük a Trainee-ket, kizárva a fenti ID-kat
      let userQuery = supabase
        .from('profiles')
        .select('id, full_name, badge_number')
        .eq('faction_rank', 'Deputy Sheriff Trainee');

      // Ha van kit kizárni, akkor alkalmazzuk a szűrőt
      if (excludedUserIds.length > 0) {
        userQuery = userQuery.not('id', 'in', `(${excludedUserIds.join(',')})`);
      }

      if (query) {
        userQuery = userQuery.ilike('full_name', `%${query}%`);
      }

      const {data: users, error: userError} = await userQuery.order('full_name').limit(20);
      if (userError) throw userError;

      setTrainees(users || []);

    } catch (e: any) {
      toast.error("Hiba az adatok betöltésekor: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Amikor megnyílik a dialógus, betöltjük az adatokat
  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setSelectedExamId(null);
      setSelectedUserId(null);
      fetchData();
    }
  }, [open]);

  const handleAssign = async () => {
    if (!selectedExamId || !selectedUserId) return;
    setIsLoading(true);
    try {
      const {error} = await supabase.rpc('admin_assign_exam', {
        _submission_id: selectedExamId,
        _target_user_id: selectedUserId
      });

      if (error) throw error;

      toast.success("Sikeres hozzárendelés!");

      // Frissítjük a listát -> Ekkor el kell tűnnie a felhasználónak is,
      // mert már bekerül az excludedUserIds-be a következő lekérdezésnél
      await fetchData(searchTerm);

      setSelectedExamId(null);
      setSelectedUserId(null);

    } catch (e: any) {
      toast.error("Hiba: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vizsga Kézi Hozzárendelése</DialogTitle>
          <DialogDescription>
            Bal oldalt a gazdátlan vizsgák (elmúlt 3 nap), jobb oldalt a vizsga nélküli Trainee-k.
            Válassz egyet mindkét listából a párosításhoz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 flex-1 flex flex-col min-h-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500"/>
              <Input
                placeholder="Keresés név alapján..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchData(searchTerm)}
                className="bg-slate-950 border-slate-700 pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => fetchData(searchTerm)} disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin"/> : <Search className="w-4 h-4"/>}
            </Button>
            <Button variant="ghost" onClick={() => {
              setSearchTerm("");
              fetchData("");
            }} title="Frissítés / Szűrő törlése">
              <RefreshCw className="w-4 h-4"/>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            {/* 1. VIZSGÁK LISTÁJA */}
            <div className="flex flex-col min-h-0 border border-slate-800 rounded-md bg-slate-950/30">
              <div
                className="p-2 border-b border-slate-800 bg-slate-900/50 font-bold text-xs text-slate-400 uppercase tracking-wider sticky top-0">
                1. Gazdátlan Vizsgák
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {orphanExams.map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => setSelectedExamId(ex.id)}
                    className={`p-3 rounded-lg cursor-pointer text-sm border transition-all flex flex-col gap-1
                                            ${selectedExamId === ex.id
                      ? 'bg-yellow-600/20 border-yellow-500/50 text-yellow-500'
                      : 'border-transparent hover:bg-slate-800 text-slate-300'}`}
                  >
                    <div className="font-bold flex justify-between items-center">
                      {ex.applicant_name}
                      {ex.status === 'passed' &&
                        <Badge className="bg-green-900/50 text-green-400 h-5 text-[10px]">Sikeres</Badge>}
                      {ex.status === 'failed' &&
                        <Badge className="bg-red-900/50 text-red-400 h-5 text-[10px]">Bukott</Badge>}
                      {ex.status === 'pending' &&
                        <Badge className="bg-yellow-900/50 text-yellow-400 h-5 text-[10px]">Javítás</Badge>}
                    </div>
                    <div className="text-xs opacity-70 truncate">{ex.exams?.title}</div>
                    <div className="text-[10px] opacity-50 font-mono">
                      {new Date(ex.start_time).toLocaleString('hu-HU')}
                    </div>
                  </div>
                ))}
                {orphanExams.length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    Nincs megjeleníthető vizsga.<br/>(Csak az elmúlt 3 nap látszik alapból)
                  </div>
                )}
              </div>
            </div>

            {/* 2. EMBEREK LISTÁJA */}
            <div className="flex flex-col min-h-0 border border-slate-800 rounded-md bg-slate-950/30">
              <div
                className="p-2 border-b border-slate-800 bg-slate-900/50 font-bold text-xs text-slate-400 uppercase tracking-wider sticky top-0">
                2. Célpont (Vizsga nélküli)
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {trainees.map(u => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`p-3 rounded-lg cursor-pointer text-sm border transition-all flex justify-between items-center
                                            ${selectedUserId === u.id
                      ? 'bg-green-600/20 border-green-500/50 text-green-400'
                      : 'border-transparent hover:bg-slate-800 text-slate-300'}`}
                  >
                    <span className="font-bold">{u.full_name}</span>
                    <span
                      className="text-xs font-mono opacity-50 bg-slate-900 px-1.5 py-0.5 rounded">{u.badge_number}</span>
                  </div>
                ))}
                {trainees.length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    Nincs találat (vagy mindenkinek van vizsgája).
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <div className="text-xs text-slate-500">
            {selectedExamId && selectedUserId ? "Készen áll a párosításra." : "Válassz mindkét listából!"}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Mégse</Button>
            <Button onClick={handleAssign} disabled={!selectedExamId || !selectedUserId || isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold">
              {isLoading ? <Loader2 className="animate-spin mr-2"/> : <UserCheck className="w-4 h-4 mr-2"/>}
              Hozzárendelés
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}