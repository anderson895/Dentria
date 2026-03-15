'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip,
  List, ListItem, ListItemAvatar, ListItemText, Divider, Skeleton, Button,
} from '@mui/material'
import {
  People, CalendarMonth, CheckCircle, Schedule,
  TrendingUp, LocalHospital, ArrowForward,
} from '@mui/icons-material'
import Link from 'next/link'
import dayjs from 'dayjs'

interface Stats {
  totalPatients: number
  todayAppointments: number
  completedToday: number
  upcomingAppointments: any[]
}

export default function DashboardHome() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          fetch('/api/patients?limit=1'),
          fetch(`/api/appointments?date=${dayjs().format('YYYY-MM-DD')}`),
        ])
        const pData = await pRes.json()
        const aData = await aRes.json()
        const appts = aData.appointments || []
        setAppointments(appts.slice(0, 5))
        setStats({
          totalPatients: pData.total || 0,
          todayAppointments: appts.length,
          completedToday: appts.filter((a: any) => a.status === 'completed').length,
          upcomingAppointments: appts.filter((a: any) => a.status === 'scheduled' || a.status === 'confirmed'),
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    { label: 'Total Patients', value: stats?.totalPatients ?? 0, icon: <People />, color: '#0A6EBD', bg: '#EBF4FF' },
    { label: "Today's Appointments", value: stats?.todayAppointments ?? 0, icon: <CalendarMonth />, color: '#7B2FBE', bg: '#F5EDFF' },
    { label: 'Completed Today', value: stats?.completedToday ?? 0, icon: <CheckCircle />, color: '#2ECC71', bg: '#EAFAF1' },
    { label: 'Pending', value: (stats?.upcomingAppointments?.length ?? 0), icon: <Schedule />, color: '#F39C12', bg: '#FEF9ED' },
  ]

  const statusColor: Record<string, string> = {
    scheduled: 'info', confirmed: 'success', in_progress: 'warning',
    completed: 'success', cancelled: 'error', no_show: 'default',
  }

  const typeColors: Record<string, string> = {
    checkup: '#0A6EBD', cleaning: '#2ECC71', filling: '#F39C12',
    extraction: '#E74C3C', root_canal: '#9B59B6', crown: '#E67E22',
    consultation: '#3498DB', emergency: '#E74C3C', other: '#95A5A6',
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="text.primary">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
          <Box component="span" color="primary.main">{session?.user?.name?.split(' ')[0]}</Box> 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" mt={0.5}>
          {dayjs().format('dddd, MMMM D, YYYY')} · Here's what's happening today
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, i) => (
          <Grid item xs={12} sm={6} lg={3} key={i}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                {loading ? (
                  <>
                    <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
                    <Skeleton width="60%" height={40} />
                    <Skeleton width="80%" />
                  </>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                        {card.icon}
                      </Box>
                      <TrendingUp sx={{ color: 'success.main', fontSize: 18 }} />
                    </Box>
                    <Typography variant="h3" fontWeight={700} color="text.primary">{card.value}</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>{card.label}</Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Today's Appointments */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Today's Appointments</Typography>
                <Button component={Link} href="/dashboard/appointments" endIcon={<ArrowForward />} size="small">
                  View All
                </Button>
              </Box>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <Box key={i} sx={{ py: 1.5 }}>
                    <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                  </Box>
                ))
              ) : appointments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CalendarMonth sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">No appointments today</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {appointments.map((appt, i) => (
                    <Box key={appt._id}>
                      {i > 0 && <Divider />}
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar src={appt.patient?.avatar} sx={{ bgcolor: typeColors[appt.type] || '#0A6EBD' }}>
                            {appt.patient?.firstName?.[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${appt.patient?.firstName} ${appt.patient?.lastName}`}
                          secondary={`${appt.time} · ${appt.type.replace('_', ' ')}`}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                        <Chip
                          label={appt.status.replace('_', ' ')}
                          color={statusColor[appt.status] as any}
                          size="small" variant="outlined"
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>Quick Actions</Typography>
              <Grid container spacing={1.5}>
                {[
                  { label: 'New Patient', href: '/dashboard/patients/new', icon: <People />, color: '#0A6EBD' },
                  { label: 'New Appointment', href: '/dashboard/appointments/new', icon: <CalendarMonth />, color: '#7B2FBE' },
                  { label: 'Teeth Chart', href: '/dashboard/teeth', icon: <LocalHospital />, color: '#2ECC71' },
                ].map(a => (
                  <Grid item xs={12} key={a.href}>
                    <Button component={Link} href={a.href} fullWidth variant="outlined"
                      startIcon={<Box sx={{ color: a.color }}>{a.icon}</Box>}
                      sx={{ justifyContent: 'flex-start', py: 1.5, borderColor: 'divider', color: 'text.primary', '&:hover': { borderColor: a.color, bgcolor: `${a.color}10` } }}>
                      {a.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ background: 'linear-gradient(135deg, #0A6EBD 0%, #00B4D8 100%)' }}>
            <CardContent sx={{ p: 3 }}>
              <LocalHospital sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 32, mb: 1 }} />
              <Typography variant="h6" fontWeight={700} color="white">Dentra Platform</Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.8)" mt={1}>
                Manage patients, appointments, and dental records all in one place.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
