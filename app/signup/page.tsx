'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress,
  Divider, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material'
import { Email, Lock, Visibility, VisibilityOff, Person, LocalHospital, Badge } from '@mui/icons-material'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'dentist' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      toast.success('Account created! Please sign in.')
      router.push('/login')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #064A80 0%, #0A6EBD 50%, #00B4D8 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
        position: 'relative', overflow: 'hidden',
        '&::before': {
          content: '""', position: 'absolute', width: '500px', height: '500px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: '-150px', left: '-150px',
        },
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 480, zIndex: 1 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2, boxShadow: '0 8px 24px rgba(10,110,189,0.3)',
            }}>
              <LocalHospital sx={{ fontSize: 36, color: 'white' }} />
            </Box>
            <Typography variant="h4" fontWeight={700} color="primary.dark">Dentra</Typography>
          </Box>

          <Typography variant="h6" fontWeight={600} mb={0.5}>Create Account</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Join the Dentra platform</Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Full Name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }}
              sx={{ mb: 2 }} required
            />
            <TextField
              fullWidth label="Email Address" type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
              sx={{ mb: 2 }} required
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select value={form.role} label="Role" onChange={e => setForm({ ...form, role: e.target.value })}
                startAdornment={<InputAdornment position="start"><Badge color="action" /></InputAdornment>}
                sx={{ borderRadius: 2.5 }}>
                <MenuItem value="dentist">Dentist</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="receptionist">Receptionist</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth label="Password" type={showPassword ? 'text' : 'password'}
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }} required
            />
            <TextField
              fullWidth label="Confirm Password" type="password"
              value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment> }}
              sx={{ mb: 3 }} required
            />
            <Button
              type="submit" fullWidth variant="contained" size="large" disabled={loading}
              sx={{ py: 1.5, fontSize: '1rem', background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" textAlign="center" color="text.secondary">
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#0A6EBD', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
