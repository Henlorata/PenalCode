import * as React from "react";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import {
  BlockNoteEditor,
  type PartialBlock,
  filterSuggestionItems,
} from "@blocknote/core";
import { cn } from "@/lib/utils";
import { supabase as supabaseClient } from "@/lib/supabaseClient";
import type { CaseEvidence } from "@/types/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Image as ImageIcon } from "lucide-react";

interface CaseEditorProps {
  initialContent: PartialBlock[] | "loading" | undefined;
  editable: boolean;
  onChange: (content: PartialBlock[]) => void;
  className?: string;
  caseId?: string;
  supabase?: typeof supabaseClient;
}

function EvidencePickerDialog({
                                open,
                                onOpenChange,
                                caseId,
                                supabase,
                                onImageSelect,
                              }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  supabase: typeof supabaseClient;
  onImageSelect: (item: CaseEvidence) => void;
}) {
  const [evidence, setEvidence] = React.useState<CaseEvidence[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (open) {
      setIsLoading(true);
      const fetchEvidence = async () => {
        const { data, error } = await supabase
          .from("case_evidence")
          .select("*")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false });

        if (error) {
          toast.error("Bizonyítékok lekérése sikertelen", {
            description: error.message,
          });
        } else {
          setEvidence(data || []);
        }
        setIsLoading(false);
      };
      fetchEvidence();
    } else {
      setEvidence([]);
    }
  }, [open, caseId, supabase]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bizonyíték Hivatkozása</DialogTitle>
          <DialogDescription>
            Válassz egy képet, hogy hivatkozást illessz be rá az aktába.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 w-full rounded-md border border-slate-700 bg-slate-800 p-4">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : evidence.length === 0 ? (
            <p className="text-center text-slate-400">
              Nincsenek feltöltött bizonyítékok ehhez az aktához.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {evidence.map((item) => {
                const { data: publicUrlData } = supabase.storage
                  .from("case_evidence")
                  .getPublicUrl(item.file_path);

                return (
                  <div
                    key={item.id}
                    className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-600 aspect-video hover:border-blue-500 transition-colors"
                    onClick={() => onImageSelect(item)}
                  >
                    <img
                      src={publicUrlData.publicUrl}
                      alt={item.description || item.file_name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                      <p className="text-xs text-center text-white font-medium">
                        Beillesztés: {item.file_name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function CaseEditor({
                             initialContent,
                             editable,
                             onChange,
                             className,
                             caseId,
                             supabase = supabaseClient,
                           }: CaseEditorProps) {
  const [isEvidencePickerOpen, setIsEvidencePickerOpen] = React.useState(false);

  const insertEvidenceCommand = React.useMemo(
    () => ({
      title: "Bizonyíték (Kép)",
      onItemClick: () => {
        setIsEvidencePickerOpen(true);
      },
      aliases: ["kep", "kép", "bizonyitek", "evidence", "img", "foto"],
      group: "Média",
      icon: <ImageIcon size={18} />,
      subtext: "Hivatkozás beszúrása egy feltöltött bizonyítékra",
    }),
    []
  );

  const editor: BlockNoteEditor | null = useCreateBlockNote({
    initialContent:
      initialContent === "loading" || initialContent === undefined
        ? undefined
        : initialContent,
  });

  const handleEvidenceSelect = (item: CaseEvidence) => {
    if (!editor) return;

    // #evidence-ID formátum
    const evidenceLink = `#evidence-${item.id}`;
    const linkText = `[Bizonyíték: ${item.description || item.file_name}]`;

    editor.insertBlocks(
      [
        {
          type: "paragraph",
          content: [
            {
              type: "link",
              href: evidenceLink,
              content: [
                {
                  type: "text",
                  text: linkText,
                  styles: { bold: true, textColor: "blue" },
                },
              ],
            },
            {
              type: "text",
              text: " ",
              styles: {},
            },
          ],
        },
      ],
      editor.getTextCursorPosition().block,
      "after"
    );

    setIsEvidencePickerOpen(false);
    toast.success("Hivatkozás beillesztve!");
  };

  if (initialContent === "loading") {
    return <div className="p-4 text-slate-400 bg-slate-900">Betöltés...</div>;
  }

  if (!editor) {
    return (
      <div className="p-4 text-slate-400 bg-slate-900">
        Editor inicializálása...
      </div>
    );
  }

  return (
    <>
      {/* CSS: Ha szerkeszthető (editable), akkor a linkekre NEM LEHET KATTINTANI */}
      {editable && (
        <style>{`
          .bn-editor a {
            pointer-events: none !important;
            cursor: text !important;
            opacity: 1; /* Maradjon látható */
          }
        `}</style>
      )}

      <BlockNoteView
        editor={editor}
        editable={editable}
        slashMenu={false}
        onChange={() => {
          if (editor) {
            onChange(editor.topLevelBlocks);
          }
        }}
        theme="dark"
        className={cn(
          "h-full flex flex-col bg-slate-800 text-slate-200 rounded-b-md",
          className
        )}
      >
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query) =>
            filterSuggestionItems(
              editable && caseId
                ? [
                  insertEvidenceCommand,
                  ...getDefaultReactSlashMenuItems(editor),
                ]
                : getDefaultReactSlashMenuItems(editor),
              query
            )
          }
        />
      </BlockNoteView>

      {editable && caseId && (
        <EvidencePickerDialog
          open={isEvidencePickerOpen}
          onOpenChange={setIsEvidencePickerOpen}
          caseId={caseId}
          supabase={supabase}
          onImageSelect={handleEvidenceSelect}
        />
      )}
    </>
  );
}