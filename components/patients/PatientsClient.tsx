'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Button, TextField, InputAdornment,
  Card, CardContent, Grid, Avatar, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Skeleton, Tooltip, Pagination,
} from '@mui/material'
import { Search, Add, Edit, Delete, Visibility, People, Phone, Email } from '@mui/icons-material'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

export default function PatientsClient() {
  const router = useRouter()
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const LIMIT = 10

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/patients?search=${search}&page=${page}&limit=${LIMIT}`)
      const data = await res.json()
      setPatients(data.patients || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => { fetchPatients() }, [fetchPatients])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this patient?')) return
    try {
      await fetch(`/api/patients/${id}`, { method: 'DELETE' })
      toast.success('Patient deleted')
      fetchPatients()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const genderColor: Record<string, string> = { male: '#0A6EBD', female: '#E91E8C', other: '#9C27B0' }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Patients</Typography>
          <Typography variant="body2" color="text.secondary">{total} total patients</Typography>
        </Box>
        <Button component={Link} href="/dashboard/patients/new" variant="contained" startIcon={<Add />}
          sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)' }}>
          New Patient
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <TextField
            fullWidth placeholder="Search by name, email, or phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }}
            size="small"
          />
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', bgcolor: '#F8FAFF', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5 } }}>
                <TableCell>Patient</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Date of Birth</TableCell>
                <TableCell>Registered</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(6).fill(0).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <People sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">No patients found</Typography>
                    <Button component={Link} href="/dashboard/patients/new" variant="contained" sx={{ mt: 2 }} startIcon={<Add />}>
                      Add First Patient
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                patients.map(p => (
                  <TableRow key={p._id} hover sx={{ cursor: 'pointer' }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={p.avatar} sx={{ bgcolor: genderColor[p.gender] || '#0A6EBD', width: 36, height: 36, fontSize: '0.875rem' }}>
                          {p.firstName[0]}{p.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{p.firstName} {p.lastName}</Typography>
                          <Typography variant="caption" color="text.secondary">{p.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{p.phone}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={p.gender} size="small"
                        sx={{ bgcolor: `${genderColor[p.gender]}15`, color: genderColor[p.gender], fontWeight: 600, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{dayjs(p.dateOfBirth).format('MMM D, YYYY')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Age {dayjs().diff(dayjs(p.dateOfBirth), 'year')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{dayjs(p.createdAt).format('MMM D, YYYY')}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => router.push(`/dashboard/patients/${p._id}`)} color="primary">
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => router.push(`/dashboard/patients/${p._id}?edit=true`)} color="info">
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(p._id)} color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {pages > 1 && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination count={pages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
          </Box>
        )}
      </Card>
    </Box>
  )
}
