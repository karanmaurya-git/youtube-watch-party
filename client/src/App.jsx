import './App.css'

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-400">
          🎬 YouTube Watch Party
        </h1>
        <p className="text-text-secondary text-lg">
          Phase 1 setup complete — Tailwind CSS is working!
        </p>
        <div className="flex gap-3 justify-center">
          <span className="px-3 py-1 rounded-md bg-role-host/20 text-role-host text-sm font-medium">HOST</span>
          <span className="px-3 py-1 rounded-md bg-role-moderator/20 text-role-moderator text-sm font-medium">MODERATOR</span>
          <span className="px-3 py-1 rounded-md bg-role-participant/20 text-role-participant text-sm font-medium">PARTICIPANT</span>
        </div>
      </div>
    </div>
  )
}

export default App
