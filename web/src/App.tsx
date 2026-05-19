import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Daily from "./pages/Daily";
import CardBrowser from "./pages/CardBrowser";
import Lexicon from "./pages/Lexicon";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Daily />} />
        <Route path="browse" element={<CardBrowser />} />
        <Route path="lexicon" element={<Lexicon />} />
      </Route>
    </Routes>
  );
}
