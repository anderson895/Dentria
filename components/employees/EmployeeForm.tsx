'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Grid, MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Avatar, IconButton, InputAdornment, Alert,
} from '@mui/material'
import { ArrowBack, Save, CameraAlt, Person, Email, Lock, Visibility, VisibilityOff, Badge } from '@mui/icons-material'
import toast from 'react-hot-toast'

interface EmployeeFormProps {
  employeeId?: string
  initialData?: any
}

export default function EmployeeForm({ employeeId, initialData }: EmployeeFormProps) {
  const router  = useRouter()
  const isEdit  = !!employeeId

  const [loading, setLoading]               = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [showPassword, setShowPassword]     = useState(false)
  const [showConfirm, setShowConfirm]       = useState(false)
  const [error, setError]                   = useState('')

  const [form, setForm] = useState({
    name:            '',
    email:           '',
    password:        '',
    confirmPassword: '',
    role:            'dentist',
    avatar:          '',
    ...initialData,
  })

  const handleChange = (field: string) => (e: any) =>
    setForm((prev: any) => ({ ...prev, [field]: e.target.value }))

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Dentra')
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      setForm((prev: any) => ({ ...prev, avatar: data.secure_url }))
      toast.success('Photo uploaded')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isEdit) {
      if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
      if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    } else if (form.password && form.password !== form.confirmPassword) {
      setError('Passwords do not match'); return
    }

    setLoading(true)
    try {
      const payload: any = { name: form.name, email: form.email, role: form.role, avatar: form.avatar }
      if (form.password) payload.password = form.password

      const url    = isEdit ? `/api/employees/${employeeId}` : '/api/employees'
      const method = isEdit ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save'); return }

      toast.success(isEdit ? 'Employee updated!' : 'Employee added!')
      router.push('/dashboard/employees')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => router.back()} sx={{ bgcolor: 'white', boxShadow: 1 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={700}>{isEdit ? 'Edit Employee' : 'New Employee'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isEdit ? 'Update employee information' : 'Create a new staff account'}
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
                  <Avatar
                    src={form.avatar}
                    sx={{ width: 120, height: 120, fontSize: '2.5rem', bgcolor: 'primary.main', mx: 'auto', mb: 2 }}
                  >
                    {form.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <label htmlFor="employee-avatar-upload">
                    <input id="employee-avatar-upload" type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
                    <IconButton
                      component="span"
                      size="small"
                      disabled={avatarUploading}
                      sx={{ position: 'absolute', bottom: 16, right: 0, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, width: 32, height: 32 }}
                    >
                      {avatarUploading ? <CircularProgress size={14} color="inherit" /> : <CameraAlt sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </label>
                </Box>
                <Typography variant="caption" color="text.secondary">Upload staff photo (optional)</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Form fields */}
          <Grid item xs={12} md={9}>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

            {/* Account info */}
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={3}>Account Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Full Name" value={form.name}
                      onChange={handleChange('name')} required
                      InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth label="Email Address" type="email" value={form.email}
                      onChange={handleChange('email')} required
                      disabled={isEdit}
                      helperText={isEdit ? 'Email cannot be changed' : ''}
                      InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={form.role}
                        label="Role"
                        onChange={handleChange('role')}
                        startAdornment={<InputAdornment position="start"><Badge color="action" /></InputAdornment>}
                        sx={{ borderRadius: 2.5 }}
                      >
                        <MenuItem value="dentist">Dentist</MenuItem>
                        <MenuItem value="receptionist">Receptionist</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Password */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={0.5}>
                  {isEdit ? 'Change Password' : 'Set Password'}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  {isEdit ? 'Leave blank to keep the current password' : 'Minimum 6 characters'}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={isEdit ? 'New Password' : 'Password'}
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange('password')}
                      required={!isEdit}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPassword(p => !p)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={handleChange('confirmPassword')}
                      required={!isEdit}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowConfirm(p => !p)} edge="end">
                              {showConfirm ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={() => router.back()} variant="outlined" size="large">Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />}
                sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)', minWidth: 140 }}
              >
                {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Employee'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}