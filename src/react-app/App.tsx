import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import BirthdaysPage from "@/react-app/pages/Birthdays";
import TaskInsights from "@/react-app/pages/TaskInsights";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/birthdays" element={<BirthdaysPage />} />
        <Route path="/stats" element={<TaskInsights />} />
      </Routes>
    </Router>
  );
}
