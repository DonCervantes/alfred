import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { VerifyPage } from "./pages/VerifyPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/v/:token" element={<VerifyPage />} />
    </Routes>
  );
}
