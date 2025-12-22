import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Home from './pages/Home';
import TrendAnalysis from './pages/TrendAnalysis';
import InsightsView from './pages/InsightsView';
import CalendarView from './pages/CalendarView';
import ReportView from './pages/ReportView';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter basename="/Radar-IA-app">          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trends" element={<TrendAnalysis />} />
            <Route path="/insights" element={<InsightsView />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/report" element={<ReportView />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
