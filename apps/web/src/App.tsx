import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { VerifyPage } from "./pages/VerifyPage";
import { EducationLandingPage } from "./pages/EducationLandingPage";
import { EducationAppPage } from "./pages/EducationAppPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/v/:token" element={<VerifyPage />} />
      <Route path="/edu" element={<EducationLandingPage />} />
      <Route path="/edu/app" element={<EducationAppPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
    </Routes>
  );
}
