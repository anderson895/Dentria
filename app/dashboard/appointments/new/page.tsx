import { Suspense } from 'react'
import AppointmentsClient from '@/components/appointments/AppointmentsClient'

export default function NewAppointmentPage() {
  return (
    <Suspense>
      <AppointmentsClient />
    </Suspense>
  )
}