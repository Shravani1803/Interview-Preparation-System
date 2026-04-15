import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import ResumeAnalysis from "./pages/ResumeAnalysis";
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import { useState } from 'react';
import RefreshHandler from './RefreshHandler';
import QuizSetup from './pages/quiz/QuizSetup';
import QuizPage from './pages/quiz/QuizPage';
import ResultPage from './pages/quiz/ResultPage';
import CodingQuizSetup from './pages/quiz/CodingQuizSetup';
import CodingQuizPage from './pages/quiz/CodingQuizPage';
import CodingQuizResultPage from './pages/quiz/CodingQuizResultPage';
 
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
 
  const PrivateRoute = ({ element }) => {
    return isAuthenticated ? element : <Navigate to="/login" />;
  };
 
  return (
    <div className="App">
      <RefreshHandler setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route path="/landingpage" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<PrivateRoute element={<Home />} />} />
        <Route path="/aptitude" element={<PrivateRoute element={<QuizSetup />} />} />
        <Route path="/aptitude/quiz" element={<PrivateRoute element={<QuizPage />} />} />
        <Route path="/aptitude/result" element={<PrivateRoute element={<ResultPage />} />} />
        <Route path="/coding-quiz" element={<PrivateRoute element={<CodingQuizSetup />} />} />
        <Route path="/coding-quiz/quiz" element={<PrivateRoute element={<CodingQuizPage />} />} />
        <Route path="/coding-quiz/result" element={<PrivateRoute element={<CodingQuizResultPage />} />} />
        <Route path="/resume-analysis" element={<PrivateRoute element={<ResumeAnalysis />} />} />
        {/* <Route path="/performance" element={<PrivateRoute element={<Performance />} />} /> */}
        {/* <Route path="/admin" element={<PrivateRoute element={<Admin />} />} /> */}
      </Routes>
    </div>
  );
}
 
export default App;
 