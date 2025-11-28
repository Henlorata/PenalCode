import {useEffect, useState} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {supabase} from "@/lib/supabaseClient";
import {ExamRunner} from "./ExamRunner";
import {Loader2, AlertTriangle, Clock, ShieldAlert, FileX, ArrowLeft, Lock} from "lucide-react";
import type {Exam} from "@/types/exams";
import {Card, CardContent} from "@/components/ui/card";
import {formatDistanceToNow} from "date-fns";
import {hu} from "date-fns/locale";
import {Button} from "@/components/ui/button";

export function PublicExamPage() {
  const {examId} = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const {user, loading: authLoading} = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<string | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) return;

      try {
        const {data, error} = await supabase
          .from('exams')
          .select(`*, exam_questions (*, exam_options (id, option_text, question_id))`)
          .eq('id', examId)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          setError("A vizsga nem található, vagy privát.");
          setLoading(false);
          return;
        }

        // Ha van user, megnézzük a cooldown-t
        if (user) {
          const {data: lastSub, error: subError} = await supabase
            .from('exam_submissions')
            .select('retry_allowed_at, status')
            .eq('exam_id', examId)
            .eq('user_id', user.id)
            .order('start_time', {ascending: false})
            .limit(1)
            .maybeSingle();

          if (subError && subError.code !== 'PGRST116') console.error(subError);

          if (lastSub && lastSub.status === 'failed' && lastSub.retry_allowed_at) {
            const retryTime = new Date(lastSub.retry_allowed_at);
            if (retryTime > new Date()) {
              setIsBlocked(true);
              setBlockedUntil(lastSub.retry_allowed_at);
              setLoading(false);
              setExam(data as any);
              return;
            }
          }
        }

        if (data.exam_questions) {
          data.exam_questions.sort((a: any, b: any) => a.order_index - b.order_index);
        }
        setExam(data as any);

      } catch (err: any) {
        console.error("Exam fetch error:", err);
        setError("Technikai hiba történt a vizsga betöltésekor.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchExam();
    }
  }, [examId, user, authLoading]);

  // --- LOADING ---
  if (loading || authLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black z-0"/>
      <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-500">
        <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]"/>
        <p className="text-slate-400 font-mono tracking-widest text-sm animate-pulse">VIZSGA BETÖLTÉSE...</p>
      </div>
    </div>
  );

  // --- BLOKKOLT (Cooldown) ---
  if (isBlocked && blockedUntil) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-950/20 via-slate-950 to-black z-0"/>
      <Card
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border-red-900/30 shadow-2xl relative z-10 animate-in slide-in-from-bottom-10 fade-in duration-700">
        <CardContent className="p-8 text-center space-y-6">
          <div
            className="w-24 h-24 bg-red-900/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <Clock className="w-12 h-12 text-red-500 animate-pulse"/>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Pihenőidő</h1>
            <p className="text-slate-400 leading-relaxed">A legutóbbi vizsgád sikertelen volt. A rendszer biztonsági
              okokból várakozási időt írt elő.</p>
          </div>

          <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800/50">
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-2">Hátralévő idő</p>
            <div className="text-2xl font-mono font-bold text-yellow-500 flex justify-center items-center gap-2">
              {formatDistanceToNow(new Date(blockedUntil), {locale: hu})}
            </div>
            <p
              className="text-xs text-slate-600 mt-2 font-mono">{new Date(blockedUntil).toLocaleTimeString('hu-HU')} után
              próbálhatod újra.</p>
          </div>

          <Button variant="ghost" onClick={() => navigate('/exams')}
                  className="text-slate-400 hover:text-white hover:bg-slate-800">
            <ArrowLeft className="w-4 h-4 mr-2"/> Vissza a központba
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // --- HIBA / NEM TALÁLHATÓ ---
  if (error || !exam) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-black z-0"/>

      <Card
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border-slate-800/50 shadow-2xl relative z-10 animate-in zoom-in-95 fade-in duration-500">
        <div
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent opacity-50"/>
        <CardContent className="p-10 text-center space-y-6">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse"/>
            <div
              className="relative bg-slate-950 border border-slate-800 w-full h-full rounded-full flex items-center justify-center">
              <Lock className="w-10 h-10 text-slate-500"/>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-2 border border-slate-800">
              <FileX className="w-6 h-6 text-red-500"/>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Hozzáférés Megtagadva</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              {error || "A kért vizsga nem található, vagy nincs megfelelő jogosultságod a megtekintéséhez."}
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-bold shadow-lg shadow-yellow-900/20"
              onClick={() => navigate('/login')}>
              Bejelentkezés
            </Button>
            <Button variant="outline"
                    className="w-full border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                    onClick={() => window.history.back()}>
              Vissza az előző oldalra
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // --- INAKTÍV VIZSGA ---
  if (!exam.is_active) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-950/10 via-slate-950 to-black z-0"/>
      <Card
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl border-orange-900/30 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <CardContent className="p-8 text-center">
          <div
            className="w-20 h-20 bg-orange-900/10 rounded-full flex items-center justify-center mx-auto border border-orange-500/20 mb-6">
            <AlertTriangle className="w-10 h-10 text-orange-500"/>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Vizsga Lezárva</h1>
          <p className="text-slate-400 mb-8">Ez a vizsga jelenleg nem fogad kitöltéseket. Kérlek érdeklődj a
            vezetőségnél.</p>
          <Button variant="secondary" onClick={() => navigate('/exams')}>Vissza a listához</Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 md:px-8 relative">
      {/* Háttér textúra */}
      <div className="fixed inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }}></div>
      <ExamRunner exam={exam}/>
    </div>
  );
}