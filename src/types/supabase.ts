// FrakHub/src/types/supabase.ts

// --- RANGOK ---
export const FACTION_RANKS = [
  'Commander', 'Deputy Commander',
  'Captain III.', 'Captain II.', 'Captain I.', 'Lieutenant II.', 'Lieutenant I.',
  'Sergeant II.', 'Sergeant I.',
  'Corporal', 'Staff Deputy Sheriff', 'Senior Deputy Sheriff', 'Deputy Sheriff III+.',
  'Deputy Sheriff III.', 'Deputy Sheriff II.', 'Deputy Sheriff I.', 'Deputy Sheriff Trainee'
] as const;

export type FactionRank = typeof FACTION_RANKS[number];
export type DepartmentDivision = 'TSB' | 'SEB' | 'MCB';
export type SystemRole = 'admin' | 'supervisor' | 'user' | 'pending';

// --- PROFIL ---
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  badge_number: string;
  faction_rank: FactionRank;
  division: DepartmentDivision;
  system_role: SystemRole;
  avatar_url?: string;
  created_at: string;
}

// --- LOGISZTIKA ---
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface VehicleRequest {
  id: string;
  user_id: string;
  vehicle_type: string;
  vehicle_plate?: string | null;
  reason: string;
  status: RequestStatus;
  admin_comment?: string | null;
  processed_by?: string | null;
  created_at: string;
  updated_at: string;

  // A lekérdezésnél csatolt adatok (nem az adatbázis része fizikailag)
  profiles?: {
    full_name: string;
    badge_number: string;
    faction_rank: string;
  } | null;
}

// --- KOMPATIBILITÁS (Régi típusok) ---
export interface Case {
  id: string;
  // ... további mezők
  [key: string]: unknown; // Ideiglenes index signature
}

export interface CaseEvidence {
  id: string;
  // ... további mezők
  [key: string]: unknown;
}

// --- PÉNZÜGY ---
export interface BudgetRequest {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  proof_image_path: string; // A fájl elérési útja
  status: RequestStatus;
  admin_comment?: string | null;
  processed_by?: string | null;
  created_at: string;
  updated_at: string;

  // Joinolt adatok
  profiles?: {
    full_name: string;
    badge_number: string;
    faction_rank: string;
  } | null;
}

// --- ADATBÁZIS DEFINÍCIÓ (A Supabase kliensnek) ---
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Profile>;
      };
      vehicle_requests: {
        Row: VehicleRequest;
        Insert: Omit<VehicleRequest, 'id' | 'created_at' | 'updated_at' | 'profiles' | 'status' | 'vehicle_plate' | 'admin_comment' | 'processed_by'> & {
          status?: RequestStatus;
        };
        Update: Partial<VehicleRequest>; // Ez oldja meg az update hibát
      };
      // Placeholder a régi tábláknak, hogy ne legyen hiba
      cases: {
        Row: Record<string, unknown>; // 'any' helyett biztonságosabb
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      case_evidence: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      budget_requests: {
        Row: BudgetRequest;
        Insert: Omit<BudgetRequest, 'id' | 'created_at' | 'updated_at' | 'profiles' | 'status' | 'admin_comment' | 'processed_by'> & {
          status?: RequestStatus;
        };
        Update: Partial<BudgetRequest>;
      };
    };
  };
}