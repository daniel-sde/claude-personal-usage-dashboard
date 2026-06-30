import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Overview from './pages/Overview';
import Sessions from './pages/Sessions';
import Models from './pages/Models';
import Heatmap from './pages/Heatmap';
import Live from './pages/Live';

function App() {
  return (
    <BrowserRouter>
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ marginLeft: '14rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/models" element={<Models />} />
            <Route path="/heatmap" element={<Heatmap />} />
            <Route path="/live" element={<Live />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App
