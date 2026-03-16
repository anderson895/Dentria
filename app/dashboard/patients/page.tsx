import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PatientsClient from '@/components/patients/PatientsClient'

export default async function PatientsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return <PatientsClient />
}