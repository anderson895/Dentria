'use client'

import { useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, TextField, InputAdornment,
  MenuItem, Select, FormControl, InputLabel, CircularProgress, Autocomplete,
} from '@mui/material'
import { Search, MedicalServices } from '@mui/icons-material'
import TeethChart from '@/components/teeth/TeethChart'

export default function TeethPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/patients?limit=100')
      .then(r => r.json())
      .then(d => setPatients(d.patients || []))
  }, [])

  const handleSelectPatient = async (p: any) => {
    if (!p) { setSelected(null); setPatient(null); return }
    setSelected(p)
    setLoading(true)
    const res = await fetch(`/api/patients/${p._id}`)
    const data = await res.json()
    setPatient(data.patient)
    setLoading(false)
  }

  const handleSave = async (teeth: any[]) => {
    await fetch(`/api/patients/${patient._id}/teeth`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teethRecord: teeth }),
    })
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>Teeth Records</Typography>
        <Typography variant="body2" color="text.secondary">Interactive dental charting for all patients</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>Select Patient</Typography>
          <Autocomplete
            options={patients}
            getOptionLabel={p => `${p.firstName} ${p.lastName} — ${p.email}`}
            value={selected}
            onChange={(_, v) => handleSelectPatient(v)}
            renderInput={params => (
              <TextField {...params} placeholder="Search patient..." fullWidth
                InputProps={{ ...params.InputProps, startAdornment: <><Search sx={{ mr: 1, color: 'action.active' }} />{params.InputProps.startAdornment}</> }} />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{option.firstName} {option.lastName}</Typography>
                  <Typography variant="caption" color="text.secondary">{option.email} · {option.phone}</Typography>
                </Box>
              </Box>
            )}
          />
        </CardContent>
      </Card>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !patient && (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <MedicalServices sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Select a patient to view their dental chart</Typography>
          <Typography variant="body2" color="text.disabled" mt={1}>
            Click on any tooth to add conditions, labels, and upload X-ray images
          </Typography>
        </Card>
      )}

      {!loading && patient && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={0.5}>
              {patient.firstName} {patient.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>{patient.email}</Typography>
            <TeethChart
              patientId={patient._id}
              initialTeeth={patient.teethRecord || []}
              onSave={handleSave}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
