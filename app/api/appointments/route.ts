import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import Appointment from '@/models/Appointment'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await dbConnect()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const patientId = searchParams.get('patientId')

    const query: any = {}
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0)
      const end = new Date(date); end.setHours(23, 59, 59, 999)
      query.date = { $gte: start, $lte: end }
    }
    if (status) query.status = status
    if (patientId) query.patient = patientId

    const appointments = await Appointment.find(query)
      .populate('patient', 'firstName lastName email phone avatar')
      .populate('dentist', 'name email')
      .sort({ date: 1, time: 1 })

    return NextResponse.json({ appointments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await dbConnect()
    const body = await request.json()
    const appointment = await Appointment.create({ ...body, dentist: session.user.id })

    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'firstName lastName email phone')
      .populate('dentist', 'name email')

    return NextResponse.json({ appointment: populated }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}