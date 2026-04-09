import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import { useState } from 'react';
import RefreshHandler from './RefreshHandler';
import QuizSetup from './pages/quiz/QuizSetup';
import QuizPage from './pages/quiz/QuizPage';
import ResultPage from './pages/quiz/ResultPage';
 
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
 
  const PrivateRoute = ({ element }) => {
    return isAuthenticated ? element : <Navigate to="/login" />;
  };
 
  return (
    <div className="App">
      <RefreshHandler setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<PrivateRoute element={<Home />} />} />
        <Route path="/aptitude" element={<PrivateRoute element={<QuizSetup />} />} />
        <Route path="/aptitude/quiz" element={<PrivateRoute element={<QuizPage />} />} />
        <Route path="/aptitude/result" element={<PrivateRoute element={<ResultPage />} />} />
        {/* <Route path="/coding" element={<PrivateRoute element={<Coding />} />} /> */}
        {/* <Route path="/performance" element={<PrivateRoute element={<Performance />} />} /> */}
        {/* <Route path="/admin" element={<PrivateRoute element={<Admin />} />} /> */}
      </Routes>
    </div>
  );
}
 
export default App;
 