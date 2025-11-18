import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import {AuthProvider} from "@/context/AuthContext";
import {Toaster} from "@/components/ui/sonner";

// Layout
import {AppLayout} from "@/layouts/AppLayout";

// Oldalak
import {LoginPage} from "@/pages/auth/LoginPage";
import {RegisterPage} from "@/pages/auth/RegisterPage";
import {DashboardPage} from "@/pages/dashboard/DashboardPage";
import {HrPage} from "@/pages/hr/HrPage"; // <-- ÚJ

// Régi MCB (később majd ezt is szépítjük)
import {McbDashboard} from "@/pages/mcb/McbDashboard";
import {CaseDetailPage} from "@/pages/mcb/CaseDetailPage";
import {ProfilePage} from "@/pages/profile/ProfilePage.tsx";
import {LogisticsPage} from "@/pages/logistics/LogisticsPage.tsx";
import {FinancePage} from "@/pages/logistics/FinancePage.tsx";
import {ResourcesPage} from "@/pages/resources/ResourcesPage.tsx";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
          <Routes>

            {/* Publikus (Auth nélkül) */}
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>

            {/* Védett Rendszer (AppLayout keretben) */}
            <Route element={<AppLayout/>}>
              <Route path="/dashboard" element={<DashboardPage/>}/>
              <Route path="/hr" element={<HrPage/>}/>

              {/* MCB Al-rendszer (Ideiglenesen itt, később saját layoutja lehet vagy almenü) */}
              <Route path="/mcb" element={<McbDashboard/>}/>
              <Route path="/mcb/case/:caseId" element={<CaseDetailPage/>}/>

              {/* További placeholder route-ok */}
              <Route path="/logistics" element={<LogisticsPage/>}/>
              <Route path="/finance" element={<FinancePage/>}/>
              <Route path="/resources" element={<ResourcesPage/>}/>
              <Route path="/profile" element={<ProfilePage/>}/>
            </Route>

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace/>}/>

          </Routes>
          <Toaster position="top-right" theme="dark"/>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;