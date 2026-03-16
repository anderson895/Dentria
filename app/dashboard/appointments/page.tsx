import { Suspense } from 'react'
import AppointmentsClient from '@/components/appointments/AppointmentsClient'

export default function AppointmentsPage() {
  return (
    <Suspense>
      <AppointmentsClient />
    </Suspense>
  )
}