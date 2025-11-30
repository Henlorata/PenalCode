import {useEffect, useState, useMemo, useRef} from "react";
import {type PartialBlock, BlockNoteSchema, defaultBlockSpecs} from "@blocknote/core";
import {BlockNoteView} from "@blocknote/mantine";
import {useCreateBlockNote} from "@blocknote/react";
import {SuggestionMenuController, getDefaultReactSlashMenuItems} from "@blocknote/react";
import "@blocknote/mantine/style.css";
import {useAuth} from "@/context/AuthContext";
import {toast} from "sonner";
import {Save, Loader2, ImagePlus} from "lucide-react";
import {Button} from "@/components/ui/button";
import type {CaseEvidence} from "@/types/supabase";
import {CaseEditorProvider} from "./CaseEditorContext";
import {EvidenceBlock} from "./EvidenceBlock";
import {cn} from "@/lib/utils";

interface CaseEditorProps {
  caseId: string;
  initialContent: any;
  readOnly?: boolean;
  evidenceList: CaseEvidence[];
  theme?: string;
}

const filterItems = (items: any[], query: string) => {
  return items.filter((item: any) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    (item.aliases && item.aliases.some((alias: string) => alias.toLowerCase().includes(query.toLowerCase())))
  );
};

const schema = BlockNoteSchema.create({blockSpecs: {...defaultBlockSpecs, evidence: EvidenceBlock()}});

export function CaseEditor({
                             caseId,
                             initialContent,
                             readOnly = false,
                             evidenceList,
                             theme = 'default'
                           }: CaseEditorProps) {
  const {supabase} = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // REF: Ez segít elkerülni a felesleges re-rendereket írás közben
  const hasChangesRef = useRef(false);

  const safeContent = useMemo(() => {
    if (Array.isArray(initialContent) && initialContent.length > 0) return initialContent as PartialBlock[];
    return undefined;
  }, [initialContent]);

  const editor = useCreateBlockNote({initialContent: safeContent, schema: schema});

  const getCustomSlashMenuItems = (editor: any) => [
    {
      title: "Bizonyíték Csatolása",
      onItemClick: () => {
        editor.insertBlocks([{
          type: "evidence",
          props: {evidenceId: ""}
        }], editor.getTextCursorPosition().block, "after");
      },
      aliases: ["evidence", "kép", "bizonyíték", "fotó"],
      group: "Média",
      icon: <ImagePlus size={18}/>,
      subtext: "Feltöltött bizonyíték beillesztése a szövegbe."
    },
    ...getDefaultReactSlashMenuItems(editor),
  ];

  useEffect(() => {
    // OPTIMALIZÁCIÓ: Csak akkor frissítünk state-et, ha még nem volt változás
    const unsubscribe = editor.onChange(() => {
      if (!hasChangesRef.current) {
        hasChangesRef.current = true;
        setHasChanges(true);
      }
    });
    return unsubscribe;
  }, [editor]);

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    const content = editor.document;
    try {
      const {error} = await (supabase.from('cases' as any) as any).update({
        body: content,
        updated_at: new Date().toISOString()
      }).eq('id', caseId);
      if (error) throw error;
      toast.success("Mentve.");

      // Reset state és ref
      setHasChanges(false);
      hasChangesRef.current = false;
    } catch (error) {
      toast.error("Hiba a mentés során.");
    } finally {
      setIsSaving(false);
    }
  };

  // Téma konfiguráció
  const getThemeAttributes = () => {
    const baseClasses = "min-h-full break-words whitespace-pre-wrap";
    switch (theme) {
      case 'paper':
        return {
          className: `${baseClasses} bg-[#f5f0e6] text-[#3d342b] font-serif`,
          editorTheme: "light" as const,
          cssVars: {
            "--bn-colors-editor-background": "#f5f0e6",
            "--bn-colors-editor-text": "#3d342b",
          }
        };
      case 'terminal':
        return {
          className: `${baseClasses} bg-[#0c0c0c] text-[#00ff00] font-mono selection:bg-green-900 selection:text-white`,
          editorTheme: "dark" as const,
          cssVars: {
            "--bn-colors-editor-background": "#0c0c0c",
            "--bn-colors-editor-text": "#00ff00",
            "--bn-colors-menu-background": "#1a1a1a",
            "--bn-colors-menu-text": "#00ff00",
          }
        };
      case 'amber': // ÚJ: Retro Amber CRT
        return {
          className: `${baseClasses} bg-[#1a1200] text-[#ffb000] font-mono selection:bg-orange-900 selection:text-white`,
          editorTheme: "dark" as const,
          cssVars: {
            "--bn-colors-editor-background": "#1a1200",
            "--bn-colors-editor-text": "#ffb000",
            "--bn-colors-menu-background": "#2e2000",
            "--bn-colors-menu-text": "#ffb000",
          }
        };
      case 'blue': // ÚJ: Rendőrségi Navy kék
        return {
          className: `${baseClasses} bg-[#0f172a] text-[#bfdbfe] font-sans selection:bg-blue-900 selection:text-white`,
          editorTheme: "dark" as const,
          cssVars: {
            "--bn-colors-editor-background": "#0f172a",
            "--bn-colors-editor-text": "#bfdbfe",
            "--bn-colors-menu-background": "#1e293b",
            "--bn-colors-menu-text": "#bfdbfe",
          }
        };
      case 'classic': // ÚJ: Tiszta fehér, mint egy Word doksi
        return {
          className: `${baseClasses} bg-white text-slate-900 font-sans border-x border-slate-200 shadow-sm max-w-[800px] mx-auto my-4`, // Word-szerű layout
          editorTheme: "light" as const,
          cssVars: {
            "--bn-colors-editor-background": "#ffffff",
            "--bn-colors-editor-text": "#0f172a",
          }
        };
      default:
        return {
          className: `${baseClasses} bg-[#0b1221] text-slate-200`,
          editorTheme: "dark" as const,
          cssVars: {}
        };
    }
  };

  const themeConfig = getThemeAttributes();

  return (
    <CaseEditorProvider evidenceList={evidenceList} readOnly={readOnly}>
      <div
        className={cn(
          "flex flex-col h-full overflow-hidden relative group transition-colors duration-300 w-full",
          themeConfig.className
        )}
        style={{
          ...themeConfig.cssVars as React.CSSProperties,
          // Extra biztonság: minden gyermek elemre kényszerítjük a tördelést
          wordBreak: 'break-word',
          overflowWrap: 'anywhere'
        }}
      >

        {/* Háttér Rács (csak default témánál) */}
        {theme === 'default' && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
        )}

        {/* Papír textúra (csak paper témánál) */}
        {theme === 'paper' && (
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>
        )}

        <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar relative z-10 w-full">
          <BlockNoteView
            editor={editor}
            editable={!readOnly}
            theme={themeConfig.editorTheme}
            slashMenu={false}
            className="min-h-[500px] w-full"
          >
            <SuggestionMenuController
              triggerCharacter={"/"}
              getItems={async (query) => filterItems(getCustomSlashMenuItems(editor), query)}
            />
          </BlockNoteView>
        </div>

        {/* Floating Save Button */}
        {!readOnly && hasChanges && (
          <div className="absolute bottom-6 right-6 animate-in fade-in slide-in-from-bottom-4 z-50">
            <Button onClick={handleSave} disabled={isSaving}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all hover:scale-105 border border-yellow-600">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
              VÁLTOZÁSOK MENTÉSE
            </Button>
          </div>
        )}
      </div>
    </CaseEditorProvider>
  );
}