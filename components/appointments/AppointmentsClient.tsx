'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, Avatar,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Autocomplete,
  Divider, List, ListItem, ListItemAvatar, ListItemText, Skeleton, Tooltip,
  CircularProgress,
} from '@mui/material'
import { Add, Edit, Delete, CalendarMonth, Schedule, Person, Close, ChevronLeft, ChevronRight, Lock } from '@mui/icons-material'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const APPOINTMENT_TYPES = ['checkup','cleaning','filling','extraction','root_canal','crown','consultation','emergency','other']
const STATUS_OPTIONS = ['scheduled','confirmed','in_progress','completed','cancelled','no_show']
const TIME_SLOTS = Array.from({length: 20}, (_, i) => {
  const h = Math.floor(i/2) + 8
  const m = i%2 === 0 ? '00' : '30'
  return `${h.toString().padStart(2,'0')}:${m}`
})

const STATUS_COLORS: Record<string, any> = {
  scheduled: 'info', confirmed: 'success', in_progress: 'warning',
  completed: 'success', cancelled: 'error', no_show: 'default',
}

const TYPE_COLORS: Record<string, string> = {
  checkup: '#0A6EBD', cleaning: '#2ECC71', filling: '#F39C12',
  extraction: '#E74C3C', root_canal: '#9B59B6', crown: '#E67E22',
  consultation: '#3498DB', emergency: '#E74C3C', other: '#95A5A6',
}

export default function AppointmentsClient() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const lockedPatientId = searchParams.get('patientId')
  const [lockedPatient, setLockedPatient] = useState<any>(null)
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    patient: null as any,
    date: dayjs().format('YYYY-MM-DD'),
    time: '09:00',
    duration: 30,
    type: 'checkup',
    status: 'scheduled',
    notes: '',
    fee: '',
  })

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/appointments?date=${currentDate.format('YYYY-MM-DD')}`)
      const data = await res.json()
      setAppointments(data.appointments || [])
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  useEffect(() => {
    fetch('/api/patients?limit=200').then(r => r.json()).then(d => setPatients(d.patients || []))
  }, [])

  useEffect(() => {
    if (!lockedPatientId) return
    fetch(`/api/patients/${lockedPatientId}`)
      .then(r => r.json())
      .then(d => {
        if (d.patient) {
          setLockedPatient(d.patient)
          setForm(prev => ({ ...prev, patient: d.patient }))
          setDialogOpen(true)
        }
      })
  }, [lockedPatientId])

  const openNew = () => {
    setEditingId(null)
    setForm({ patient: null, date: currentDate.format('YYYY-MM-DD'), time: '09:00', duration: 30, type: 'checkup', status: 'scheduled', notes: '', fee: '' })
    setDialogOpen(true)
  }

  const openEdit = (a: any) => {
    setEditingId(a._id)
    setForm({
      patient: a.patient,
      date: dayjs(a.date).format('YYYY-MM-DD'),
      time: a.time,
      duration: a.duration,
      type: a.type,
      status: a.status,
      notes: a.notes || '',
      fee: a.fee?.toString() || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.patient || !form.date || !form.time) {
      toast.error('Please fill all required fields')
      return
    }
    setSaving(true)
    try {
      const body = { patient: form.patient._id || form.patient, date: form.date, time: form.time, duration: form.duration, type: form.type, status: form.status, notes: form.notes, fee: form.fee ? Number(form.fee) : undefined }
      const url = editingId ? `/api/appointments/${editingId}` : '/api/appointments'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed to save')
      toast.success(editingId ? 'Appointment updated!' : 'Appointment booked!')
      setDialogOpen(false)
      fetchAppointments()
    } catch {
      toast.error('Failed to save appointment')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this appointment?')) return
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
    toast.success('Appointment deleted')
    fetchAppointments()
  }

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchAppointments()
  }

  const weekDays = Array.from({length:7}, (_, i) => currentDate.startOf('week').add(i, 'day'))

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Appointments</Typography>
          <Typography variant="body2" color="text.secondary">{currentDate.format('MMMM YYYY')}</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openNew}
          sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)' }}>
          New Appointment
        </Button>
      </Box>

      {/* Week nav */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setCurrentDate(d => d.subtract(1, 'day'))}><ChevronLeft /></IconButton>
            <Box sx={{ display: 'flex', flex: 1, overflow: 'auto', gap: 0.5 }}>
              {weekDays.map(day => {
                const isToday = day.isSame(dayjs(), 'day')
                const isSelected = day.isSame(currentDate, 'day')
                return (
                  <Box key={day.toString()}
                    onClick={() => setCurrentDate(day)}
                    sx={{
                      flex: 1, textAlign: 'center', p: 1.5, borderRadius: 2.5, cursor: 'pointer',
                      bgcolor: isSelected ? 'primary.main' : isToday ? 'primary.light' : 'transparent',
                      color: isSelected ? 'white' : isToday ? 'white' : 'text.primary',
                      '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'action.hover' },
                      minWidth: 52,
                    }}>
                    <Typography variant="caption" display="block" sx={{ opacity: 0.8, fontWeight: 600 }}>
                      {day.format('ddd')}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={700}>{day.format('D')}</Typography>
                  </Box>
                )
              })}
            </Box>
            <IconButton onClick={() => setCurrentDate(d => d.add(1, 'day'))}><ChevronRight /></IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Appointments for selected day */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {currentDate.format('dddd, MMMM D')}
          <Chip label={`${appointments.length} appointments`} size="small" sx={{ ml: 1.5, fontWeight: 600 }} />
        </Typography>
      </Box>

      {loading ? (
        Array(3).fill(0).map((_, i) => (
          <Card key={i} sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Skeleton variant="rectangular" height={80} />
            </CardContent>
          </Card>
        ))
      ) : appointments.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CalendarMonth sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No appointments for this day</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={openNew} sx={{ mt: 2, background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)' }}>
            Book Appointment
          </Button>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {appointments.sort((a,b) => a.time.localeCompare(b.time)).map(appt => (
            <Grid item xs={12} md={6} key={appt._id}>
              <Card sx={{ border: '2px solid', borderColor: `${TYPE_COLORS[appt.type]}30`, '&:hover': { borderColor: TYPE_COLORS[appt.type], boxShadow: `0 4px 20px ${TYPE_COLORS[appt.type]}20` }, transition: 'all 0.2s' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={appt.patient?.avatar} sx={{ bgcolor: TYPE_COLORS[appt.type], width: 44, height: 44 }}>
                        {appt.patient?.firstName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight={700}>{appt.patient?.firstName} {appt.patient?.lastName}</Typography>
                        <Typography variant="caption" color="text.secondary">{appt.patient?.phone}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(appt)}><Edit fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(appt._id)}><Delete fontSize="small" /></IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip icon={<Schedule sx={{ fontSize: 14 }} />} label={`${appt.time} · ${appt.duration}min`} size="small" variant="outlined" />
                    <Chip label={appt.type.replace('_',' ')} size="small" sx={{ bgcolor: `${TYPE_COLORS[appt.type]}15`, color: TYPE_COLORS[appt.type], fontWeight: 600, textTransform: 'capitalize' }} />
                    {appt.fee && <Chip label={`₱${appt.fee}`} size="small" color="success" variant="outlined" />}
                  </Box>

                  {appt.notes && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, fontStyle: 'italic' }}>
                      "{appt.notes}"
                    </Typography>
                  )}

                  <FormControl size="small" fullWidth>
                    <Select value={appt.status} onChange={e => handleStatusChange(appt._id, e.target.value)}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                      renderValue={v => (
                        <Chip label={v.replace('_',' ')} color={STATUS_COLORS[v]} size="small" sx={{ textTransform: 'capitalize', fontWeight: 700 }} />
                      )}>
                      {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_',' ')}</MenuItem>)}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>{editingId ? 'Edit Appointment' : 'New Appointment'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {lockedPatient ? (
                <TextField
                  fullWidth
                  label="Patient"
                  value={`${lockedPatient.firstName} ${lockedPatient.lastName}`}
                  disabled
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <Lock sx={{ fontSize: 16 }} />
                      </Box>
                    ),
                  }}
                  helperText="Patient is pre-selected from their profile"
                />
              ) : (
                <Autocomplete
                  options={patients}
                  getOptionLabel={p => `${p.firstName} ${p.lastName}`}
                  value={form.patient}
                  onChange={(_, v) => setForm(p => ({ ...p, patient: v }))}
                  renderInput={params => <TextField {...params} label="Patient *" placeholder="Search patient..." />}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{option.firstName} {option.lastName}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                      </Box>
                    </Box>
                  )}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Date *" type="date" value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Time *</InputLabel>
                <Select value={form.time} label="Time *" onChange={e => setForm(p => ({ ...p, time: e.target.value }))} sx={{ borderRadius: 2.5 }}>
                  {TIME_SLOTS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type *</InputLabel>
                <Select value={form.type} label="Type *" onChange={e => setForm(p => ({ ...p, type: e.target.value }))} sx={{ borderRadius: 2.5 }}>
                  {APPOINTMENT_TYPES.map(t => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t.replace('_',' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Duration</InputLabel>
                <Select value={form.duration} label="Duration" onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))} sx={{ borderRadius: 2.5 }}>
                  {[15,30,45,60,90,120].map(d => <MenuItem key={d} value={d}>{d} min</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status" onChange={e => setForm(p => ({ ...p, status: e.target.value }))} sx={{ borderRadius: 2.5 }}>
                  {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_',' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Fee (₱)" type="number" value={form.fee}
                onChange={e => setForm(p => ({ ...p, fee: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={3} value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes about this appointment..." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)', minWidth: 120 }}>
            {saving ? 'Saving...' : editingId ? 'Update' : 'Book Appointment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}