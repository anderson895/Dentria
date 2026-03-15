import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Appointment from '@/models/Appointment'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await dbConnect()
    const appointment = await Appointment.findById(params.id)
      .populate('patient', 'firstName lastName email phone avatar')
      .populate('dentist', 'name email')

    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ appointment })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await dbConnect()
    const body = await request.json()
    const appointment = await Appointment.findByIdAndUpdate(params.id, body, { new: true })
      .populate('patient', 'firstName lastName email phone')
      .populate('dentist', 'name email')

    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ appointment })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await dbConnect()
    await Appointment.findByIdAndDelete(params.id)
    return NextResponse.json({ message: 'Appointment deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
