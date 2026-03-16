import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

// GET /api/employees/[id]
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    await dbConnect()
    const employee = await User.findById(params.id, { password: 0 }).lean()
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    return NextResponse.json({ employee })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/employees/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    await dbConnect()

    const { name, role, avatar, password } = await request.json()

    const employee = await User.findById(params.id)
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    if (name)              employee.name   = name
    if (role)              employee.role   = role
    if (avatar !== undefined) employee.avatar = avatar
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }
      employee.password = password // pre-save hook hashes it
    }

    await employee.save()

    const { password: _, ...safe } = employee.toObject()
    return NextResponse.json({ employee: safe })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/employees/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    if (session.user.id === params.id) {
      return NextResponse.json({ error: 'You cannot remove your own account' }, { status: 400 })
    }
    await dbConnect()
    const employee = await User.findByIdAndDelete(params.id)
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}