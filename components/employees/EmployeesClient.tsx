'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Button, TextField, InputAdornment,
  Card, CardContent, Avatar, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Skeleton, Tooltip, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from '@mui/material'
import { Search, Add, Edit, Delete, ManageAccounts, Email } from '@mui/icons-material'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin:        { label: 'Admin',        color: '#7C3AED' },
  dentist:      { label: 'Dentist',      color: '#0A6EBD' },
  receptionist: { label: 'Receptionist', color: '#059669' },
}

export default function EmployeesClient() {
  const router = useRouter()
  const [employees, setEmployees]       = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [roleFilter, setRoleFilter]     = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleting, setDeleting]         = useState(false)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/employees')
      const data = await res.json()
      setEmployees(data.employees || [])
    } catch {
      toast.error('Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/employees/${deleteTarget._id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to remove'); return }
      toast.success('Employee removed')
      setEmployees(prev => prev.filter(e => e._id !== deleteTarget._id))
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to remove employee')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.email.toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter === 'all' || e.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Employees</Typography>
          <Typography variant="body2" color="text.secondary">{employees.length} total employees</Typography>
        </Box>
        <Button
          component={Link}
          href="/dashboard/employees/new"
          variant="contained"
          startIcon={<Add />}
          sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)' }}
        >
          Add Employee
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              sx={{ flex: 1, minWidth: 220 }}
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment> }}
              size="small"
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Role</InputLabel>
              <Select value={roleFilter} label="Role" onChange={e => setRoleFilter(e.target.value)}>
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="dentist">Dentist</MenuItem>
                <MenuItem value="receptionist">Receptionist</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', bgcolor: '#F8FAFF', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5 } }}>
                <TableCell>Employee</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Date Added</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(5).fill(0).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <ManageAccounts sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">
                      {search || roleFilter !== 'all' ? 'No employees match your filters' : 'No employees yet'}
                    </Typography>
                    {!search && roleFilter === 'all' && (
                      <Button
                        component={Link}
                        href="/dashboard/employees/new"
                        variant="contained"
                        sx={{ mt: 2, background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)' }}
                        startIcon={<Add />}
                      >
                        Add First Employee
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(emp => {
                  const rc = ROLE_CONFIG[emp.role] || ROLE_CONFIG.dentist
                  return (
                    <TableRow key={emp._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={emp.avatar}
                            sx={{ bgcolor: `${rc.color}20`, color: rc.color, width: 36, height: 36, fontSize: '0.875rem', fontWeight: 700 }}
                          >
                            {emp.name?.[0]?.toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{emp.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">{emp.email}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rc.label}
                          size="small"
                          sx={{ bgcolor: `${rc.color}15`, color: rc.color, fontWeight: 600, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {dayjs(emp.createdAt).format('MMM D, YYYY')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/dashboard/employees/${emp._id}/edit`)}
                            color="info"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteTarget(emp)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle>Remove Employee</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to remove <strong>{deleteTarget?.name}</strong>? This will revoke their access to the system.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} variant="outlined">Cancel</Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <Delete />}
          >
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}