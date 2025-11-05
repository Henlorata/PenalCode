import penalCodeData from "../data/penalcode.json";
import type {Kategoria, PenalCodeItem} from "@/types/penalcode";

const WARNING_KEYWORDS = [
  "eltiltható",
  "bevonható",
  "max 30 nap",
  "eltiltani",
];

const checkWarning = (note: string | null | undefined): boolean => {
  if (!note) return false;
  const lowerCaseNote = note.toLowerCase();
  return WARNING_KEYWORDS.some((keyword) => lowerCaseNote.includes(keyword));
};

export const prepareData = (): PenalCodeItem[] => {
  const allItems: PenalCodeItem[] = [];
  let idCounter = 0;

  (penalCodeData as Kategoria[]).forEach((kategoria) => {
    kategoria.tetelek.forEach((tetel) => {
      const foMegjegyzes = tetel.megjegyzes || "";

      if (tetel.alpontok && tetel.alpontok.length > 0) {
        tetel.alpontok.forEach((alpont) => {
          const alpontMegjegyzes = alpont.megjegyzes || "";
          const fullNote = `${foMegjegyzes} ${alpontMegjegyzes}`.trim();

          allItems.push({
            ...alpont,
            id: `item-${idCounter++}`,
            kategoria_nev: kategoria.kategoria_nev,
            fo_tetel_nev: tetel.megnevezes,
            megjegyzes: fullNote,
            isWarning: checkWarning(fullNote),
          });
        });
      } else if (tetel.rovidites) {
        allItems.push({
          id: `item-${idCounter++}`,
          kategoria_nev: kategoria.kategoria_nev,
          paragrafus: tetel.paragrafus,
          megnevezes: tetel.megnevezes,
          min_birsag: tetel.min_birsag,
          max_birsag: tetel.max_birsag,
          min_fegyhaz: tetel.min_fegyhaz,
          max_fegyhaz: tetel.max_fegyhaz,
          rovidites: tetel.rovidites,
          megjegyzes: tetel.megjegyzes || "",
          isWarning: checkWarning(tetel.megjegyzes),
        });
      }
    });
  });
  return allItems;
};

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "---";
  return `$${value.toLocaleString("hu-HU")}`;
};

export const formatJailTime = (
  value: number | string | null | undefined,
): string => {
  if (value === null || value === undefined) return "---";
  if (typeof value === "string") return value;
  return `${value} perc`;
};