'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Grid, MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Avatar, IconButton, Collapse, Divider,
} from '@mui/material'
import {
  ArrowBack, Save, CameraAlt, ExpandMore, ExpandLess,
  LocalHospital, Warning,
} from '@mui/icons-material'
import toast from 'react-hot-toast'

// ── Preset lists ──────────────────────────────────────────────────────────────

const MEDICAL_HISTORY_OPTIONS = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Asthma',
  'Epilepsy',
  'Kidney Disease',
  'Liver Disease',
  'Thyroid Disorder',
  'Blood Disorder',
  'HIV / AIDS',
  'Hepatitis B / C',
  'Osteoporosis',
  'Arthritis',
  'Stroke',
  'Cancer',
  'Pregnancy',
  'Anxiety / Depression',
  'Autoimmune Disease',
]

const ALLERGY_OPTIONS = [
  'Penicillin',
  'Amoxicillin',
  'Aspirin',
  'Ibuprofen',
  'Codeine',
  'Local Anesthesia',
  'General Anesthesia',
  'Latex',
  'Sulfa Drugs',
  'Metronidazole',
  'Erythromycin',
  'Clindamycin',
  'Iodine',
  'Chlorhexidine',
  'Fluoride',
  'Epinephrine',
]

// ── Checkmark SVG ─────────────────────────────────────────────────────────────

function Checkmark({ color }: { color: string }) {
  return (
    <Box component="svg" viewBox="0 0 10 8" sx={{ width: 10, height: 8 }}>
      <path
        d="M1 4L3.5 6.5L9 1"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  )
}

// ── ChecklistSection ──────────────────────────────────────────────────────────

interface ChecklistSectionProps {
  title: string
  subtitle: string
  accentColor: string
  bgColor: string
  borderColor: string
  headerBg: string
  options: string[]
  selected: string[]
  otherItems: string[]
  otherInput: string
  onToggle: (label: string) => void
  onOtherChange: (val: string) => void
  onAddOther: () => void
  onRemoveOther: (item: string) => void
}

function ChecklistSection({
  title, subtitle, accentColor, bgColor, borderColor, headerBg,
  options, selected, otherItems, otherInput,
  onToggle, onOtherChange, onAddOther, onRemoveOther,
}: ChecklistSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const totalSelected = selected.length + otherItems.length

  const half = Math.ceil(options.length / 2)
  const col1 = options.slice(0, half)
  const col2 = options.slice(half)

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: totalSelected > 0 ? borderColor : '#dde1e7',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: totalSelected > 0 ? `0 0 0 1px ${borderColor}` : 'none',
        transition: 'all 0.2s',
      }}
    >
      {/* ── Section header (toggle) ── */}
      <Box
        onClick={() => setExpanded(p => !p)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.5,
          bgcolor: headerBg,
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid' : 'none',
          borderColor: '#e4e7ec',
          '&:hover': { filter: 'brightness(0.97)' },
          transition: 'filter 0.15s',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 32, height: 32,
              borderRadius: 1.5,
              bgcolor: `${accentColor}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: accentColor,
              flexShrink: 0,
            }}
          >
            {title === 'Medical History'
              ? <LocalHospital sx={{ fontSize: 17 }} />
              : <Warning sx={{ fontSize: 17 }} />
            }
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#111827', lineHeight: 1.3 }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>{subtitle}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {totalSelected > 0 && (
            <Box
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                px: 1.25, py: 0.35,
                bgcolor: accentColor,
                color: 'white',
                borderRadius: 1,
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: 0.3,
              }}
            >
              <Checkmark color="white" />
              {totalSelected} selected
            </Box>
          )}
          {expanded
            ? <ExpandLess sx={{ fontSize: 19, color: '#9ca3af' }} />
            : <ExpandMore  sx={{ fontSize: 19, color: '#9ca3af' }} />
          }
        </Box>
      </Box>

      <Collapse in={expanded}>
        {/* ── Checkbox grid ── */}
        <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
          <Grid container columnSpacing={1}>
            {[col1, col2].map((col, ci) => (
              <Grid item xs={12} sm={6} key={ci}>
                {col.map(opt => {
                  const isChecked = selected.includes(opt)
                  return (
                    <Box
                      key={opt}
                      onClick={() => onToggle(opt)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        px: 1.25,
                        py: 0.75,
                        mb: 0.4,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: isChecked ? borderColor : 'transparent',
                        bgcolor: isChecked ? bgColor : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                        '&:hover': {
                          bgcolor: bgColor,
                          borderColor: borderColor,
                        },
                      }}
                    >
                      {/* Custom checkbox box */}
                      <Box
                        sx={{
                          width: 15,
                          height: 15,
                          flexShrink: 0,
                          border: '1.5px solid',
                          borderColor: isChecked ? accentColor : '#d1d5db',
                          borderRadius: '3px',
                          bgcolor: isChecked ? accentColor : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        {isChecked && <Checkmark color="white" />}
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.8125rem',
                          fontWeight: isChecked ? 600 : 400,
                          color: isChecked ? accentColor : '#374151',
                          lineHeight: 1.4,
                          userSelect: 'none',
                          transition: 'color 0.12s',
                        }}
                      >
                        {opt}
                      </Typography>
                    </Box>
                  )
                })}
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ── Custom "Other" items ── */}
        {otherItems.length > 0 && (
          <Box sx={{ px: 2.5, pb: 1 }}>
            <Divider sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#9ca3af',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontSize: '10px',
                }}
              >
                Other / Specified
              </Typography>
            </Divider>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {otherItems.map(item => (
                <Box
                  key={item}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 1.5, py: 0.9,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: borderColor,
                    bgcolor: bgColor,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    {/* Filled checkbox */}
                    <Box
                      sx={{
                        width: 15, height: 15, flexShrink: 0,
                        borderRadius: '3px',
                        bgcolor: accentColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Checkmark color="white" />
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 600, color: accentColor }}>
                      {item}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        px: 0.75, py: 0.15,
                        bgcolor: `${accentColor}18`,
                        color: accentColor,
                        borderRadius: 0.75,
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: 0.4,
                        textTransform: 'uppercase',
                        lineHeight: 1.8,
                      }}
                    >
                      Custom
                    </Typography>
                  </Box>

                  {/* Remove button */}
                  <IconButton
                    size="small"
                    onClick={e => { e.stopPropagation(); onRemoveOther(item) }}
                    sx={{
                      p: 0.4,
                      color: '#d1d5db',
                      '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' },
                    }}
                  >
                    <Box component="svg" viewBox="0 0 12 12" sx={{ width: 12, height: 12 }}>
                      <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </Box>
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* ── "Specify other" input ── */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            mx: 2.5,
            mt: 1.5,
            mb: 2,
            pt: 1.5,
            borderTop: '1px solid #f3f4f6',
          }}
        >
          <TextField
            size="small"
            fullWidth
            label="Specify other"
            placeholder={`Enter other ${title.toLowerCase()} not listed above`}
            value={otherInput}
            onChange={e => onOtherChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddOther() } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                fontSize: '0.8125rem',
                bgcolor: 'white',
                '&:hover fieldset': { borderColor: accentColor },
                '&.Mui-focused fieldset': { borderColor: accentColor },
              },
              '& .MuiInputLabel-root.Mui-focused': { color: accentColor },
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={onAddOther}
            disabled={!otherInput.trim()}
            sx={{
              flexShrink: 0,
              borderRadius: 1.5,
              px: 2.5,
              height: 40,
              fontWeight: 600,
              fontSize: '0.8rem',
              textTransform: 'none',
              bgcolor: accentColor,
              boxShadow: 'none',
              '&:hover': { bgcolor: accentColor, filter: 'brightness(0.9)', boxShadow: 'none' },
              '&:disabled': { opacity: 0.35 },
            }}
          >
            Add
          </Button>
        </Box>

        {/* ── Footer summary ── */}
        {totalSelected > 0 && (
          <Box
            sx={{
              px: 2.5, py: 1.5,
              bgcolor: bgColor,
              borderTop: '1px solid',
              borderColor: borderColor,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: accentColor,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontSize: '10px',
                mb: 0.4,
              }}
            >
              Summary — {totalSelected} {totalSelected === 1 ? 'item' : 'items'} selected
            </Typography>
            <Typography variant="caption" sx={{ color: '#4b5563', lineHeight: 1.7 }}>
              {[...selected, ...otherItems].join(', ')}
            </Typography>
          </Box>
        )}
      </Collapse>
    </Box>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseField(value: string, presets: string[]): { selected: string[]; others: string[] } {
  if (!value) return { selected: [], others: [] }
  const parts = value.split(',').map(s => s.trim()).filter(Boolean)
  return {
    selected: parts.filter(p => presets.includes(p)),
    others:   parts.filter(p => !presets.includes(p)),
  }
}

// ── PatientForm ───────────────────────────────────────────────────────────────

interface PatientFormProps {
  patientId?: string
  initialData?: any
}

export default function PatientForm({ patientId, initialData }: PatientFormProps) {
  const router = useRouter()
  const [loading, setLoading]               = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const parsedMed   = parseField(initialData?.medicalHistory || '', MEDICAL_HISTORY_OPTIONS)
  const parsedAller = parseField(initialData?.allergies || '', ALLERGY_OPTIONS)

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', gender: 'male', address: '',
    avatar: '',
    ...initialData,
  })

  const [medSelected,   setMedSelected]   = useState<string[]>(parsedMed.selected)
  const [medOtherItems, setMedOtherItems] = useState<string[]>(parsedMed.others)
  const [medOtherInput, setMedOtherInput] = useState('')

  const [allerSelected,   setAllerSelected]   = useState<string[]>(parsedAller.selected)
  const [allerOtherItems, setAllerOtherItems] = useState<string[]>(parsedAller.others)
  const [allerOtherInput, setAllerOtherInput] = useState('')

  const handleChange = (field: string) => (e: any) =>
    setForm((prev: any) => ({ ...prev, [field]: e.target.value }))

  const toggleMed   = (l: string): void => setMedSelected((p: string[]) => p.includes(l)   ? p.filter((x: string) => x !== l)   : [...p, l])
  const toggleAller = (l: string): void => setAllerSelected((p: string[]) => p.includes(l) ? p.filter((x: string) => x !== l) : [...p, l])

  const addMedOther = () => {
    const v = medOtherInput.trim()
    if (!v || medOtherItems.includes(v) || medSelected.includes(v)) return
    setMedOtherItems(p => [...p, v]); setMedOtherInput('')
  }
  const addAllerOther = () => {
    const v = allerOtherInput.trim()
    if (!v || allerOtherItems.includes(v) || allerSelected.includes(v)) return
    setAllerOtherItems(p => [...p, v]); setAllerOtherInput('')
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Dentra')
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      setForm((prev: any) => ({ ...prev, avatar: data.secure_url }))
    } catch { toast.error('Failed to upload image') }
    finally { setAvatarUploading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const medicalHistory = [...medSelected, ...medOtherItems].join(', ')
    const allergies      = [...allerSelected, ...allerOtherItems].join(', ')
    try {
      const url    = patientId ? `/api/patients/${patientId}` : '/api/patients'
      const method = patientId ? 'PUT' : 'POST'
      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, medicalHistory, allergies }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(patientId ? 'Patient updated!' : 'Patient created!')
      router.push(patientId ? `/dashboard/patients/${patientId}` : '/dashboard/patients')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save patient')
    } finally { setLoading(false) }
  }

  return (
    <Box>
      {/* Page header */}
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

          {/* Avatar card */}
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
                    <IconButton
                      component="span" size="small" disabled={avatarUploading}
                      sx={{ position: 'absolute', bottom: 16, right: 0, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, width: 32, height: 32 }}
                    >
                      {avatarUploading ? <CircularProgress size={14} color="inherit" /> : <CameraAlt sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </label>
                </Box>
                <Typography variant="caption" color="text.secondary">Upload patient photo (optional)</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Right column */}
          <Grid item xs={12} md={9}>

            {/* Personal info */}
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
                    <TextField
                      fullWidth label="Date of Birth" type="date"
                      value={form.dateOfBirth?.split('T')[0] || ''}
                      onChange={handleChange('dateOfBirth')}
                      InputLabelProps={{ shrink: true }} required
                    />
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

            {/* Medical information */}
            <Card sx={{ mt: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={0.5}>Medical Information</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Check all applicable conditions and allergies. Use the "Specify other" field for entries not on the list.
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <ChecklistSection
                      title="Medical History"
                      subtitle="Pre-existing conditions and illnesses"
                      accentColor="#C62828"
                      bgColor="#FFF5F5"
                      borderColor="#FFCDD2"
                      headerBg="#FFF5F5"
                      options={MEDICAL_HISTORY_OPTIONS}
                      selected={medSelected}
                      otherItems={medOtherItems}
                      otherInput={medOtherInput}
                      onToggle={toggleMed}
                      onOtherChange={setMedOtherInput}
                      onAddOther={addMedOther}
                      onRemoveOther={item => setMedOtherItems(p => p.filter(x => x !== item))}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <ChecklistSection
                      title="Allergies"
                      subtitle="Drug, material and substance allergies"
                      accentColor="#B45309"
                      bgColor="#FFFBEB"
                      borderColor="#FDE68A"
                      headerBg="#FFFBEB"
                      options={ALLERGY_OPTIONS}
                      selected={allerSelected}
                      otherItems={allerOtherItems}
                      otherInput={allerOtherInput}
                      onToggle={toggleAller}
                      onOtherChange={setAllerOtherInput}
                      onAddOther={addAllerOther}
                      onRemoveOther={item => setAllerOtherItems(p => p.filter(x => x !== item))}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button onClick={() => router.back()} variant="outlined" size="large">Cancel</Button>
              <Button
                type="submit" variant="contained" size="large" disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Save />}
                sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)', minWidth: 140 }}
              >
                {loading ? 'Saving...' : patientId ? 'Save Changes' : 'Create Patient'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}