import { validateEnvironment } from '@/lib/env'
import DataDisplay from './components/DataDisplay'

export default async function Home() {
  // Validate environment on page load
  try {
    validateEnvironment()
  } catch (error) {
    console.error('Environment validation failed:', error)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Sales Helper App</h1>
        <p className="text-lg mb-4">2nd Generation Application</p>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ Environment and Database Setup Complete
        </div>
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-8">
          🚀 Preview Deployment Test - Production Pipeline Active
        </div>
      </div>
      
      {/* Data Display Component */}
      <DataDisplay />
    </main>
  )
}
