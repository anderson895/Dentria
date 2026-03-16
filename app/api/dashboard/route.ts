import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Patient from '@/models/Patient'
import Appointment from '@/models/Appointment'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await dbConnect()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [totalPatients, todayAppointments, completedToday, upcomingAppointments] = await Promise.all([
      Patient.countDocuments(),
      Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
      Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'completed' }),
      Appointment.find({ date: { $gte: today, $lt: tomorrow }, status: { $in: ['scheduled', 'confirmed'] } })
        .populate('patient', 'firstName lastName avatar')
        .sort({ time: 1 })
        .limit(5),
    ])

    return NextResponse.json({ totalPatients, todayAppointments, completedToday, upcomingAppointments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}