import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {useAuth} from "@/context/AuthContext";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Search, UserCheck, UserX, Shield} from "lucide-react";
import {toast} from "sonner";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import type {Profile} from "@/types/supabase";
import type {Exam} from "@/types/exams.ts";

interface ExamAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: Exam;
}

export function ExamAccessDialog({open, onOpenChange, exam}: ExamAccessDialogProps) {
  const {supabase, user} = useAuth();
  const [searchTerm, setSearchTerm] = React.useState("");

  // Külön tároljuk az összes felhasználót és az aktív kivételeket
  const [allUsers, setAllUsers] = React.useState<Profile[]>([]);
  const [overrides, setOverrides] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Adatok betöltése
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Meglévő kivételek
      const {data: ovData} = await supabase
        .from('exam_overrides')
        .select('*, profile:user_id(full_name, badge_number, avatar_url, faction_rank)')
        .eq('exam_id', exam.id);
      setOverrides(ovData || []);

      // 2. Összes felhasználó (aki nem pending)
      const {data: userData} = await supabase
        .from('profiles')
        .select('*')
        .neq('system_role', 'pending')
        .order('full_name');
      setAllUsers(userData || []);

    } catch (e) {
      console.error(e);
      toast.error("Hiba az adatok betöltésekor.");
    } finally {
      setLoading(false);
    }
  }, [exam.id, supabase]);

  React.useEffect(() => {
    if (open) {
      fetchData();
      setSearchTerm("");
    }
  }, [open, fetchData]);

  // Szűrt lista a kereséshez (kivesszük belőle azokat, akiknek már van beállítása)
  const filteredUsers = React.useMemo(() => {
    const existingIds = overrides.map(o => o.user_id);
    return allUsers.filter(u =>
      !existingIds.includes(u.id) &&
      (u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || u.badge_number.includes(searchTerm))
    );
  }, [allUsers, overrides, searchTerm]);

  const addOverride = async (targetUserId: string, type: 'allow' | 'deny') => {
    try {
      const {error} = await supabase.from('exam_overrides').insert({
        exam_id: exam.id,
        user_id: targetUserId,
        access_type: type,
        created_by: user?.id
      });

      if (error) throw error;

      toast.success(`Felhasználó ${type === 'allow' ? 'engedélyezve' : 'tiltva'}.`);
      fetchData(); // Újratöltés
    } catch (e) {
      toast.error("Hiba történt a mentéskor.");
    }
  };

  const removeOverride = async (id: string) => {
    try {
      await supabase.from('exam_overrides').delete().eq('id', id);
      toast.success("Kivétel törölve.");
      fetchData();
    } catch (e) {
      toast.error("Hiba a törléskor.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-lg h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Hozzáférések Kezelése</DialogTitle>
          <DialogDescription>
            Kivételek kezelése a(z) <span className="text-yellow-500 font-bold">{exam.title}</span> vizsgához.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="add" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 bg-slate-950 border border-slate-800">
            <TabsTrigger value="add">Hozzáadás</TabsTrigger>
            <TabsTrigger value="active">
              Aktív Kivételek
              {overrides.length > 0 &&
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">{overrides.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* HOZZÁADÁS TAB */}
          <TabsContent value="add" className="flex-1 flex flex-col min-h-0 space-y-4 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500"/>
              <Input
                placeholder="Név vagy jelvény keresése..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-700 focus-visible:ring-yellow-500/50"
              />
            </div>

            <div className="flex-1 border border-slate-800 rounded-md bg-slate-950/30 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {loading ? (
                    <p className="text-center text-slate-500 text-xs py-4">Betöltés...</p>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-center text-slate-500 text-xs py-10">Nincs megjeleníthető felhasználó.</p>
                  ) : (
                    filteredUsers.map(u => (
                      <div key={u.id}
                           className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-slate-700">
                            <AvatarImage src={u.avatar_url}/>
                            <AvatarFallback
                              className="bg-slate-900 text-[10px]">{u.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{u.full_name}</p>
                            <p className="text-[10px] text-slate-500">{u.faction_rank} [#{u.badge_number}]</p>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="outline"
                                  className="h-7 text-green-500 border-green-900/30 hover:bg-green-900/20 hover:text-green-400 text-xs"
                                  onClick={() => addOverride(u.id, 'allow')}>
                            <UserCheck className="w-3 h-3 mr-1"/> Engedélyez
                          </Button>
                          <Button size="sm" variant="outline"
                                  className="h-7 text-red-500 border-red-900/30 hover:bg-red-900/20 hover:text-red-400 text-xs"
                                  onClick={() => addOverride(u.id, 'deny')}>
                            <UserX className="w-3 h-3 mr-1"/> Tiltás
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* AKTÍV KIVÉTELEK TAB */}
          <TabsContent value="active"
                       className="flex-1 border border-slate-800 rounded-md bg-slate-950/30 overflow-hidden mt-4">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-2">
                {overrides.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                    <Shield className="w-8 h-8 mb-2 opacity-20"/>
                    <p className="text-xs">Nincsenek beállított kivételek.</p>
                  </div>
                ) : (
                  overrides.map(ov => (
                    <div key={ov.id}
                         className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-slate-700">
                          <AvatarImage src={ov.profile?.avatar_url}/>
                          <AvatarFallback
                            className="bg-slate-950 text-[10px]">{ov.profile?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{ov.profile?.full_name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline"
                                   className={ov.access_type === 'allow' ? "text-green-500 border-green-900/30 bg-green-900/10" : "text-red-500 border-red-900/30 bg-red-900/10"}>
                              {ov.access_type === 'allow' ? 'ENGEDÉLYEZVE' : 'TILTVA'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost"
                              className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-950/20"
                              onClick={() => removeOverride(ov.id)}>
                        <UserX className="w-4 h-4"/>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bezárás</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}