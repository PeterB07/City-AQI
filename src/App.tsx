import { useState } from 'react'
import { EnvironmentalAnalytics } from './components/EnvironmentalAnalytics'

function App() {
  const [city, setCity] = useState('mumbai')

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Environmental Analytics</h1>
          <div className="mt-4">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-card border border-border rounded-lg px-4 py-2 text-foreground"
            >
              <option value="mumbai">Mumbai</option>
              <option value="delhi">Delhi</option>
              <option value="bangalore">Bangalore</option>
              <option value="chennai">Chennai</option>
              <option value="kolkata">Kolkata</option>
            </select>
          </div>
        </header>
        <main>
          <EnvironmentalAnalytics city={city} />
        </main>
      </div>
    </div>
  )
}

export default App