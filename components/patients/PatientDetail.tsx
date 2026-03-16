'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Button,
  Chip, Divider, Tab, Tabs, IconButton, CircularProgress, useMediaQuery, useTheme,
} from '@mui/material'
import { ArrowBack, Edit, CalendarMonth, MedicalServices, Phone, Email, Cake, LocalHospital, Warning } from '@mui/icons-material'
import dayjs from 'dayjs'
import PatientForm from './PatientForm'
import TeethChart3D from '../teeth/TeethChart3D'

// ── Shared design tokens (keep in sync with TeethChart3D) ───────────────────
const P = {
  primary:     '#0A6EBD',
  primaryDark: '#085A9E',
  secondary:   '#00B4D8',
  gradientBtn: 'linear-gradient(135deg, #0A6EBD, #00B4D8)',
  medAccent:   '#C62828',
  medBg:       '#FFF5F5',
  medBorder:   '#FFCDD2',
  allerAccent: '#B45309',
  allerBg:     '#FFFBEB',
  allerBorder: '#FDE68A',
  grey400:     '#9ca3af',
  grey600:     '#4b5563',
  grey900:     '#111827',
}



interface PatientDetailProps { patientId: string }

// ── Same preset lists as PatientForm ─────────────────────────────────────────

const MEDICAL_HISTORY_OPTIONS = [
  'Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Epilepsy',
  'Kidney Disease', 'Liver Disease', 'Thyroid Disorder', 'Blood Disorder',
  'HIV / AIDS', 'Hepatitis B / C', 'Osteoporosis', 'Arthritis', 'Stroke',
  'Cancer', 'Pregnancy', 'Anxiety / Depression', 'Autoimmune Disease',
]

const ALLERGY_OPTIONS = [
  'Penicillin', 'Amoxicillin', 'Aspirin', 'Ibuprofen', 'Codeine',
  'Local Anesthesia', 'General Anesthesia', 'Latex', 'Sulfa Drugs',
  'Metronidazole', 'Erythromycin', 'Clindamycin', 'Iodine',
  'Chlorhexidine', 'Fluoride', 'Epinephrine',
]

function parseItems(value: string): string[] {
  if (!value) return []
  return value.split(',').map((s: string) => s.trim()).filter(Boolean)
}

// ── Read-only checklist display ───────────────────────────────────────────────

interface MedicalChecklistProps {
  title: string
  subtitle: string
  accentColor: string
  bgColor: string
  checkedBg: string
  borderColor: string
  presets: string[]
  savedValue: string
}

function MedicalChecklist({
  title, subtitle, accentColor, bgColor, checkedBg, borderColor, presets, savedValue,
}: MedicalChecklistProps) {
  const [expanded, setExpanded] = useState(true)
  const saved = parseItems(savedValue)
  const checkedCount = saved.length

  const half = Math.ceil(presets.length / 2)
  const col1 = presets.slice(0, half)
  const col2 = presets.slice(half)
  const customItems = saved.filter((s: string) => !presets.includes(s))

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: checkedCount > 0 ? borderColor : '#e5e7eb',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header / toggle */}
      <Box
        onClick={() => setExpanded((p: boolean) => !p)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2, py: 1.25,
          bgcolor: checkedCount > 0 ? bgColor : '#fafafa',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid' : 'none',
          borderColor: '#e8e8e8',
          '&:hover': { filter: 'brightness(0.97)' },
          transition: 'all 0.15s',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 28, height: 28, borderRadius: 1.25, flexShrink: 0,
              bgcolor: checkedCount > 0 ? `${accentColor}18` : '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: checkedCount > 0 ? accentColor : '#9ca3af',
            }}
          >
            {title === 'Medical History'
              ? <LocalHospital sx={{ fontSize: 15 }} />
              : <Warning sx={{ fontSize: 15 }} />
            }
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: P.grey900, fontSize: '0.8rem', lineHeight: 1.2 }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: P.grey400, fontSize: '0.7rem' }}>{subtitle}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {checkedCount > 0 ? (
            <Box
              sx={{
                px: 1, py: 0.2,
                bgcolor: accentColor, color: 'white',
                borderRadius: 0.75, fontSize: '11px', fontWeight: 700, lineHeight: 1.6,
              }}
            >
              {checkedCount} noted
            </Box>
          ) : (
            <Typography sx={{ fontSize: '10px', color: P.grey400, fontStyle: 'italic' }}>
              None recorded
            </Typography>
          )}
          {/* Chevron */}
          <Box
            component="svg" viewBox="0 0 12 12"
            sx={{
              width: 12, height: 12, color: P.grey400, flexShrink: 0,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Box>
        </Box>
      </Box>

      {/* Expanded body */}
      {expanded && (
        <Box sx={{ px: 2, pt: 1.5, pb: 1.5, bgcolor: 'white' }}>
          <Grid container columnSpacing={1}>
            {[col1, col2].map((col: string[], ci: number) => (
              <Grid item xs={12} sm={6} key={ci}>
                {col.map((opt: string) => {
                  const isChecked = saved.includes(opt)
                  return (
                    <Box
                      key={opt}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        px: 1, py: 0.55, mb: 0.3, borderRadius: 0.75,
                        border: '1px solid',
                        borderColor: isChecked ? borderColor : 'transparent',
                        bgcolor: isChecked ? checkedBg : 'transparent',
                      }}
                    >
                      {/* Checkbox indicator (read-only) */}
                      <Box
                        sx={{
                          width: 14, height: 14, flexShrink: 0,
                          border: '1.5px solid',
                          borderColor: isChecked ? accentColor : '#d1d5db',
                          borderRadius: '3px',
                          bgcolor: isChecked ? accentColor : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {isChecked && (
                          <Box component="svg" viewBox="0 0 10 8" sx={{ width: 9, height: 7 }}>
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                          </Box>
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.78rem',
                          fontWeight: isChecked ? 600 : 400,
                          color: isChecked ? accentColor : '#9ca3af',
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

          {/* Custom / other items */}
          {customItems.length > 0 && (
            <>
              <Divider sx={{ my: 1.25 }}>
                <Typography sx={{ fontSize: '10px', color: P.grey400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Other / Specified
                </Typography>
              </Divider>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                {customItems.map((item: string) => (
                  <Box
                    key={item}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      px: 1, py: 0.55, borderRadius: 0.75,
                      border: '1px solid', borderColor: borderColor, bgcolor: checkedBg,
                    }}
                  >
                    <Box
                      sx={{
                        width: 14, height: 14, flexShrink: 0,
                        borderRadius: '3px', bgcolor: accentColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Box component="svg" viewBox="0 0 10 8" sx={{ width: 9, height: 7 }}>
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: accentColor }}>{item}</Typography>
                    <Typography
                      sx={{
                        fontSize: '10px', fontWeight: 700, letterSpacing: 0.4,
                        textTransform: 'uppercase', color: accentColor,
                        px: 0.6, py: 0.1, bgcolor: `${accentColor}18`, borderRadius: 0.5, lineHeight: 1.8,
                      }}
                    >
                      Custom
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  )
}

// ── PatientDetail ─────────────────────────────────────────────────────────────

export default function PatientDetail({ patientId }: PatientDetailProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditing = searchParams.get('edit') === 'true'
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    fetch(`/api/patients/${patientId}`)
      .then(r => r.json())
      .then(d => setPatient(d.patient))
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  )
  if (!patient) return <Typography>Patient not found</Typography>

  if (isEditing) return (
    <PatientForm
      patientId={patientId}
      initialData={{ ...patient, dateOfBirth: patient.dateOfBirth?.split('T')[0] }}
    />
  )

  const genderColor: Record<string, string> = { male: '#0A6EBD', female: '#E91E8C', other: '#9C27B0' }

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 0 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 4 }, flexWrap: 'wrap' }}>
        <IconButton onClick={() => router.back()} sx={{ bgcolor: 'white', boxShadow: 1, flexShrink: 0 }}>
          <ArrowBack />
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            fontWeight={700}
            noWrap={!isMobile}
            sx={{ wordBreak: isMobile ? 'break-word' : 'normal' }}
          >
            {patient.firstName.charAt(0).toUpperCase() + patient.firstName.slice(1)}{' '}
            {patient.lastName.charAt(0).toUpperCase() + patient.lastName.slice(1)}
          </Typography>
          <Typography variant="body2" color="text.secondary">Patient Profile</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => router.push(`/dashboard/patients/${patientId}?edit=true`)}
            size={isMobile ? 'small' : 'medium'}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            startIcon={<CalendarMonth />}
            component="a"
            href="/dashboard/appointments/new"
            size={isMobile ? 'small' : 'medium'}
            sx={{ background: P.gradientBtn, whiteSpace: 'nowrap' }}
          >
            {isMobile ? 'Book' : 'Book Appointment'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Profile card */}
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
              <Avatar
                src={patient.avatar}
                sx={{
                  width: { xs: 72, sm: 96 }, height: { xs: 72, sm: 96 },
                  mx: 'auto', mb: 2,
                  bgcolor: genderColor[patient.gender],
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                }}
              >
                {patient.firstName[0]}{patient.lastName[0]}
              </Avatar>

              <Typography variant="h6" fontWeight={700}>
                {patient.firstName} {patient.lastName}
              </Typography>
              <Chip
                label={patient.gender}
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: `${genderColor[patient.gender]}15`,
                  color: genderColor[patient.gender],
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              />

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'left' }}>
                {[
                  { icon: <Email sx={{ fontSize: 16 }} />, label: patient.email },
                  { icon: <Phone sx={{ fontSize: 16 }} />, label: patient.phone },
                  {
                    icon: <Cake sx={{ fontSize: 16 }} />,
                    label: `${dayjs(patient.dateOfBirth).format('MMM D, YYYY')} (Age ${dayjs().diff(dayjs(patient.dateOfBirth), 'year')})`,
                  },
                ].map((item, i) => (
                  <Box
                    key={i}
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5, color: 'text.secondary' }}
                  >
                    <Box sx={{ flexShrink: 0, mt: '2px' }}>{item.icon}</Box>
                    <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.4 }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Medical Information — always visible */}
          <Card sx={{ mt: 2 }}>
            <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalHospital sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="subtitle2" fontWeight={700}>Medical Information</Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <MedicalChecklist
                  title="Medical History"
                  subtitle="Pre-existing conditions"
                  accentColor={P.medAccent}
                  bgColor={P.medBg}
                  checkedBg={P.medBg}
                  borderColor={P.medBorder}
                  presets={MEDICAL_HISTORY_OPTIONS}
                  savedValue={patient.medicalHistory || ''}
                />

                <MedicalChecklist
                  title="Allergies"
                  subtitle="Drug and substance allergies"
                  accentColor={P.allerAccent}
                  bgColor={P.allerBg}
                  checkedBg={P.allerBg}
                  borderColor={P.allerBorder}
                  presets={ALLERGY_OPTIONS}
                  savedValue={patient.allergies || ''}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Main content */}
        <Grid item xs={12} md={8}>
          <Card>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                px: { xs: 1, sm: 2 },
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  minWidth: { xs: 'auto', sm: 160 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 },
                },
              }}
            >
              <Tab label="Teeth Chart"  icon={<MedicalServices sx={{ fontSize: 18 }} />} iconPosition="start" />
              <Tab label="Appointments" icon={<CalendarMonth   sx={{ fontSize: 18 }} />} iconPosition="start" />
            </Tabs>

            <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
              {tab === 0 && (
                <TeethChart3D
                  patientId={patientId}
                  initialTeeth={patient.teethRecord || []}
                  onSave={async (teeth) => {
                    await fetch(`/api/patients/${patientId}/teeth`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ teethRecord: teeth }),
                    })
                  }}
                />
              )}
              {tab === 1 && <AppointmentHistory patientId={patientId} />}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

// ── AppointmentHistory ────────────────────────────────────────────────────────

function AppointmentHistory({ patientId }: { patientId: string }) {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    fetch(`/api/appointments?patientId=${patientId}`)
      .then(r => r.json())
      .then(d => setAppointments(d.appointments || []))
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) return <CircularProgress />
  if (appointments.length === 0) return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CalendarMonth sx={{ fontSize: 48, color: 'text.disabled' }} />
      <Typography color="text.secondary" mt={1}>No appointments yet</Typography>
    </Box>
  )

  const statusColor: Record<string, any> = {
    scheduled: 'info', confirmed: 'success', completed: 'success', cancelled: 'error',
  }

  return (
    <Box>
      {appointments.map((a, i) => (
        <Box
          key={a._id}
          sx={{
            py: 2,
            borderBottom: i < appointments.length - 1 ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 1 : 0,
          }}>
            <Box>
              <Typography variant="body2" fontWeight={600} textTransform="capitalize">
                {a.type.replace('_', ' ')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dayjs(a.date).format('MMM D, YYYY')} at {a.time}
              </Typography>
            </Box>
            <Chip
              label={a.status}
              color={statusColor[a.status] || 'default'}
              size="small"
              sx={{ alignSelf: isMobile ? 'flex-start' : 'center' }}
            />
          </Box>
          {a.notes && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              {a.notes}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  )
}