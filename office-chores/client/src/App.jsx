import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import CalendarView from './components/CalendarView';
import SettingsPanel from './components/SettingsPanel';
import HistoryView from './components/HistoryView';

export default function App() {
  const [view, setView] = useState('calendar'); // 'calendar' | 'history'
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <AppProvider>
      <div className="app">
        <header className="app-header">
          <div className="header-left">
            <h1>Office Chores</h1>
          </div>
          <nav className="header-nav">
            <button
              className={`nav-btn ${view === 'calendar' ? 'active' : ''}`}
              onClick={() => setView('calendar')}
            >
              Calendar
            </button>
            <button
              className={`nav-btn ${view === 'history' ? 'active' : ''}`}
              onClick={() => setView('history')}
            >
              History
            </button>
          </nav>
          <div className="header-right">
            <button className="btn-settings" onClick={() => setSettingsOpen(true)}>
              Team Members
            </button>
          </div>
        </header>

        <main className="app-main">
          {view === 'calendar' && <CalendarView />}
          {view === 'history' && <HistoryView />}
        </main>

        {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      </div>
    </AppProvider>
  );
}
