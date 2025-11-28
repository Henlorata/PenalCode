import * as React from "react";
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
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {toast} from "sonner";
import {Loader2, Car, Lock} from "lucide-react";
import {FACTION_RANKS, type FactionRank, type Qualification} from "@/types/supabase";

// Jármű definíciók rang és képesítés követelményekkel
interface VehicleDef {
  name: string;
  minRank?: FactionRank; // Minimum rang
  requiredQual?: Qualification; // Képesítés (ha van)
  isSupervisorOnly?: boolean; // Csak Supervisor+ (Mercedes Vito)
}

// Lista a kérés alapján
const VEHICLES: VehicleDef[] = [
  {name: "Ford Crown Victoria", minRank: "Deputy Sheriff I."},
  {name: "Ford Taurus", minRank: "Deputy Sheriff I."},
  {name: "Ford Explorer", minRank: "Deputy Sheriff I."},
  {name: "Dodge Charger SRT 2006", minRank: "Deputy Sheriff II."},
  {name: "Dodge Charger SRT 2012", minRank: "Deputy Sheriff II."},
  {name: "Dodge Charger SRT 2015", minRank: "Deputy Sheriff II."},
  {name: "Ford F-150 Vontató", minRank: "Deputy Sheriff II."},
  {name: "Mercedes Arocs", minRank: "Deputy Sheriff II."},
  {name: "Predator (hajó)", minRank: "Staff Deputy Sheriff"},
  {name: "Mercedes-Benz Vito", minRank: "Sergeant I."},
  {name: "Ford Raptor 2022", requiredQual: "GW"},
  {name: "Police Maverick", requiredQual: "AB"},
  {name: "SAHP Dodge Demon SRT", requiredQual: "SAHP"},
  {name: "Egyéb / Speciális"} // Mindig elérhető, de indoklás kell
];

// Rang index segéd: Minél kisebb az index, annál magasabb a rang
const getRankIndex = (rank: FactionRank) => FACTION_RANKS.indexOf(rank);

interface NewVehicleRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewVehicleRequestDialog({open, onOpenChange, onSuccess}: NewVehicleRequestDialogProps) {
  const {supabase, user, profile} = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const [vehicleType, setVehicleType] = React.useState("");
  const [customType, setCustomType] = React.useState("");
  const [reason, setReason] = React.useState("");

  // Ellenőrizzük, hogy a felhasználó jogosult-e a járműre
  const checkAvailability = (veh: VehicleDef) => {
    if (!profile) return {visible: false, disabled: true};

    // Bureau Manager mindent lát és kérhet
    if (profile.is_bureau_manager) return {visible: true, disabled: false};

    // Speciális képesítés alapú szűrés (Osztály)
    // Ha nincs meg a képesítés, nem is látja (visible: false)
    if (veh.requiredQual) {
      const hasQual = profile.qualifications?.includes(veh.requiredQual);
      if (!hasQual) return {visible: false, disabled: true};
    }

    // Rang alapú szűrés (Látható, de disabled)
    if (veh.minRank) {
      const userRankIdx = getRankIndex(profile.faction_rank);
      const reqRankIdx = getRankIndex(veh.minRank);
      // Fontos: A tömbben az index 0 a legmagasabb (Commander).
      // Tehát ha userRankIdx <= reqRankIdx, akkor a user rangja magasabb vagy egyenlő.
      if (userRankIdx > reqRankIdx) {
        return {visible: true, disabled: true, reason: `Min. ${veh.minRank}`};
      }
    }

    return {visible: true, disabled: false};
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const finalType = vehicleType === "Egyéb / Speciális" ? customType : vehicleType;

    if (!finalType || !reason) {
      toast.error("Kérjük, tölts ki minden mezőt!");
      return;
    }

    setIsLoading(true);

    try {
      const insertData: any = {
        user_id: user.id,
        vehicle_type: finalType,
        reason: reason,
        status: 'pending'
      };

      const {error} = await (supabase.from('vehicle_requests') as any).insert(insertData);

      if (error) throw error;

      toast.success("Igénylés sikeresen elküldve!");
      setReason("");
      setVehicleType("");
      setCustomType("");
      onSuccess();
      onOpenChange(false);

    } catch (error) {
      toast.error("Hiba történt az igénylés során", {description: (error as Error).message});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-yellow-500"/>
            Új Járműigénylés
          </DialogTitle>
          <DialogDescription>
            Szolgálati gépjármű igénylése tartós használatra.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Jármű Típusa</Label>
            <div
              className="grid gap-2 max-h-[200px] overflow-y-auto pr-2 border border-slate-800 rounded-md p-2 bg-slate-950/50">
              {VEHICLES.map(veh => {
                const status = checkAvailability(veh);
                if (!status.visible) return null;

                return (
                  <div
                    key={veh.name}
                    onClick={() => !status.disabled && setVehicleType(veh.name)}
                    className={`
                      flex items-center justify-between p-2 rounded cursor-pointer text-sm border transition-all
                      ${status.disabled ? 'opacity-50 cursor-not-allowed bg-slate-900 border-transparent' :
                      vehicleType === veh.name ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-200' : 'bg-slate-900/50 border-transparent hover:bg-slate-800'}
                    `}
                  >
                    <span className="font-medium">{veh.name}</span>
                    {status.disabled && <span className="text-[10px] text-red-400 flex items-center gap-1"><Lock
                      className="w-3 h-3"/> {status.reason}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {vehicleType === "Egyéb / Speciális" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label>Pontos Típus</Label>
              <Input
                placeholder="Pl. Enus Stafford"
                className="bg-slate-950 border-slate-700"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Igénylés Indoklása</Label>
            <Textarea
              placeholder="Miért van szükséged erre a járműre? (Pl. Beosztás, feladatkör)"
              className="bg-slate-950 border-slate-700 min-h-[100px] break-all"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Mégse</Button>
            <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-black"
                    disabled={isLoading || !vehicleType}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Igénylés Leadása"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}