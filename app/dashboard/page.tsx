import dynamic from 'next/dynamic'

// Dynamic import with no SSR to prevent hydration issues
const DashboardContent = dynamic(() => import('@/components/DashboardContent'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-white animate-pulse"></div>
})

export default function Dashboard() {
  return <DashboardContent />
}