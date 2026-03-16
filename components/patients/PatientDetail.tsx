'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Button,
  Chip, Divider, Tab, Tabs, IconButton, CircularProgress, useMediaQuery, useTheme,
} from '@mui/material'
import { ArrowBack, Edit, CalendarMonth, MedicalServices, Phone, Email, Cake } from '@mui/icons-material'
import dayjs from 'dayjs'
import PatientForm from './PatientForm'
import TeethChart3D from '../teeth/TeethChart3D'

interface PatientDetailProps { patientId: string }

export default function PatientDetail({ patientId }: PatientDetailProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEditing = searchParams.get('edit') === 'true'
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

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

  if (isEditing) return <PatientForm patientId={patientId} initialData={{ ...patient, dateOfBirth: patient.dateOfBirth?.split('T')[0] }} />

  const genderColor: Record<string, string> = { male: '#0A6EBD', female: '#E91E8C', other: '#9C27B0' }

  return (
    <Box sx={{ px: { xs: 1, sm: 2, md: 0 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 4 }, flexWrap: 'wrap' }}>
        <IconButton
          onClick={() => router.back()}
          sx={{ bgcolor: 'white', boxShadow: 1, flexShrink: 0 }}
        >
          <ArrowBack />
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            fontWeight={700}
            noWrap={!isMobile}
            sx={{ wordBreak: isMobile ? 'break-word' : 'normal' }}
          >
            {patient.firstName.charAt(0).toUpperCase() + patient.firstName.slice(1)}{" "}
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
            {isMobile ? 'Edit' : 'Edit'}
          </Button>
          <Button
            variant="contained"
            startIcon={<CalendarMonth />}
            component="a"
            href="/dashboard/appointments/new"
            size={isMobile ? 'small' : 'medium'}
            sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)', whiteSpace: 'nowrap' }}
          >
            {isMobile ? 'Book' : 'Book Appointment'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
              <Avatar
                src={patient.avatar}
                sx={{
                  width: { xs: 72, sm: 96 },
                  height: { xs: 72, sm: 96 },
                  mx: 'auto',
                  mb: 2,
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

              {/* Contact info — stacked on mobile, normal on larger */}
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
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      mb: 1.5,
                      color: 'text.secondary',
                    }}
                  >
                    <Box sx={{ flexShrink: 0, mt: '2px' }}>{item.icon}</Box>
                    <Typography
                      variant="body2"
                      sx={{ wordBreak: 'break-word', lineHeight: 1.4 }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {(patient.medicalHistory || patient.allergies) && (
            <Card sx={{ mt: 2 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Medical Info</Typography>
                {patient.medicalHistory && (
                  <>
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>
                      Medical History
                    </Typography>
                    <Typography variant="body2" mt={0.5} mb={2}>{patient.medicalHistory}</Typography>
                  </>
                )}
                {patient.allergies && (
                  <>
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>
                      Allergies
                    </Typography>
                    <Typography variant="body2" mt={0.5} color="error.main">{patient.allergies}</Typography>
                  </>
                )}
              </CardContent>
            </Card>
          )}
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
              <Tab
                label="Teeth Chart"
                icon={<MedicalServices sx={{ fontSize: 18 }} />}
                iconPosition="start"
              />
              <Tab
                label="Appointments"
                icon={<CalendarMonth sx={{ fontSize: 18 }} />}
                iconPosition="start"
              />
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
    scheduled: 'info',
    confirmed: 'success',
    completed: 'success',
    cancelled: 'error',
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