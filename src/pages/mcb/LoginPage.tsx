import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-center">MCB Bejelentkezés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email">Email</label>
            <Input id="email" type="email" placeholder="nyomozo@sfsd.gov" className="text-base" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password">Jelszó</label>
            <Input id="password" type="password" className="text-base" />
          </div>
          <Button className="w-full text-base">Bejelentkezés</Button>
          <p className="text-center text-sm text-slate-400">
            Nincs még fiókod?{" "}
            <a href="/mcb/register" className="text-blue-400 hover:underline">
              Regisztráció
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}