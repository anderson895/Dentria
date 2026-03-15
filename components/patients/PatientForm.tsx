'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Grid, MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Avatar, IconButton,
} from '@mui/material'
import { ArrowBack, Save, CameraAlt } from '@mui/icons-material'
import toast from 'react-hot-toast'

interface PatientFormProps {
  patientId?: string
  initialData?: any
}

export default function PatientForm({ patientId, initialData }: PatientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', gender: 'male', address: '',
    medicalHistory: '', allergies: '', avatar: '',
    ...initialData,
  })

  const handleChange = (field: string) => (e: any) => {
    setForm((prev: any) => ({ ...prev, [field]: e.target.value }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', 'Dentra')
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      setForm((prev: any) => ({ ...prev, avatar: data.secure_url }))
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = patientId ? `/api/patients/${patientId}` : '/api/patients'
      const method = patientId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(patientId ? 'Patient updated!' : 'Patient created!')
      router.push(patientId ? `/dashboard/patients/${patientId}` : '/dashboard/patients')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.back()} sx={{ bgcolor: 'white', boxShadow: 1 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={700}>{patientId ? 'Edit Patient' : 'New Patient'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {patientId ? 'Update patient information' : 'Register a new patient in the system'}
          </Typography>
        </Box>
      </Box>

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Avatar */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="subtitle2" fontWeight={600} mb={2}>Profile Photo</Typography>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar src={form.avatar} sx={{ width: 120, height: 120, fontSize: '2.5rem', bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                    {form.firstName?.[0]}{form.lastName?.[0]}
                  </Avatar>
                  <label htmlFor="avatar-upload">
                    <input id="avatar-upload" type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
                    <IconButton component="span" size="small"
                      sx={{ position: 'absolute', bottom: 16, right: 0, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, width: 32, height: 32 }}
                      disabled={avatarUploading}>
                      <CameraAlt sx={{ fontSize: 16 }} />
                    </IconButton>
                  </label>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Upload patient photo (optional)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Info */}
          <Grid item xs={12} md={9}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={3}>Personal Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="First Name" value={form.firstName} onChange={handleChange('firstName')} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Last Name" value={form.lastName} onChange={handleChange('lastName')} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Email" type="email" value={form.email} onChange={handleChange('email')} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Phone" value={form.phone} onChange={handleChange('phone')} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Date of Birth" type="date" value={form.dateOfBirth?.split('T')[0] || ''} onChange={handleChange('dateOfBirth')} InputLabelProps={{ shrink: true }} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Gender</InputLabel>
                      <Select value={form.gender} label="Gender" onChange={handleChange('gender')} sx={{ borderRadius: 2.5 }}>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Address" value={form.address} onChange={handleChange('address')} multiline rows={2} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={3}>Medical Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Medical History" value={form.medicalHistory} onChange={handleChange('medicalHistory')} multiline rows={3} placeholder="Diabetes, hypertension, heart conditions..." />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Allergies" value={form.allergies} onChange={handleChange('allergies')} multiline rows={2} placeholder="Penicillin, latex, anesthesia..." />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button onClick={() => router.back()} variant="outlined" size="large">Cancel</Button>
              <Button type="submit" variant="contained" size="large" disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />}
                sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)', minWidth: 140 }}>
                {loading ? 'Saving...' : patientId ? 'Save Changes' : 'Create Patient'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
