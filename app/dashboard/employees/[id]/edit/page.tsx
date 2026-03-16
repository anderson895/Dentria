'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Box, CircularProgress, Typography } from '@mui/material'
import EmployeeForm from '@/components/employees/EmployeeForm'

export default function EditEmployeePage() {
  const params = useParams()
  const id = params.id as string
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/employees/${id}`)
      .then(r => r.json())
      .then(d => setEmployee(d.employee))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  )
  if (!employee) return <Typography>Employee not found</Typography>

  return (
    <EmployeeForm
      employeeId={id}
      initialData={{
        name:   employee.name,
        email:  employee.email,
        role:   employee.role,
        avatar: employee.avatar || '',
      }}
    />
  )
}