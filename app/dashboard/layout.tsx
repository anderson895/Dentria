'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Avatar, Divider, IconButton,
  Tooltip, Badge, AppBar, Toolbar, useMediaQuery, useTheme,
} from '@mui/material'
import {
  Dashboard, People, CalendarMonth, Logout,
  Menu as MenuIcon, LocalHospital, Notifications,
  MedicalServices, ChevronLeft,
} from '@mui/icons-material'

const DRAWER_WIDTH = 260

const navItems = [
  { label: 'Dashboard', icon: <Dashboard />, href: '/dashboard' },
  { label: 'Patients', icon: <People />, href: '/dashboard/patients' },
  { label: 'Appointments', icon: <CalendarMonth />, href: '/dashboard/appointments' },
  { label: 'Teeth Records', icon: <MedicalServices />, href: '/dashboard/teeth' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0A6EBD 0%, #064A80 100%)' }}>
      {/* Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LocalHospital sx={{ color: 'white', fontSize: 22 }} />
        </Box>
        <Typography variant="h6" fontWeight={700} color="white">Dentra</Typography>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)} sx={{ ml: 'auto', color: 'white' }}>
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mx: 2 }} />

      {/* Navigation */}
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link} href={item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: 2.5,
                  color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
                  '&:hover': { background: 'rgba(255,255,255,0.15)', color: 'white' },
                  py: 1.5, px: 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontSize: '0.9rem' }} />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mx: 2 }} />

      {/* User */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2.5, background: 'rgba(255,255,255,0.1)' }}>
          <Avatar src={session?.user?.avatar} sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
            {session?.user?.name?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} color="white" noWrap>{session?.user?.name}</Typography>
            <Typography variant="caption" color="rgba(255,255,255,0.6)" textTransform="capitalize">{session?.user?.role}</Typography>
          </Box>
          <Tooltip title="Sign out">
            <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }} onClick={() => signOut({ callbackUrl: '/login' })}>
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Desktop Drawer */}
      {!isMobile && (
        <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', boxShadow: '4px 0 24px rgba(10,110,189,0.12)' } }}>
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}>
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isMobile && (
          <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Toolbar>
              <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1, color: 'text.primary' }}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" fontWeight={700} color="primary.dark">Dentra</Typography>
              <Box sx={{ flex: 1 }} />
              <IconButton>
                <Badge badgeContent={2} color="error"><Notifications /></Badge>
              </IconButton>
            </Toolbar>
          </AppBar>
        )}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
