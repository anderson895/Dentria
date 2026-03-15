import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Patient from '@/models/Patient'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await dbConnect()
    const { teethRecord } = await request.json()

    const patient = await Patient.findByIdAndUpdate(
      params.id,
      { teethRecord },
      { new: true, runValidators: true }
    )

    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

    return NextResponse.json({ patient })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
