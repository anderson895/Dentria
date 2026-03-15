'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Box, Typography, Button, Chip, Grid, TextField, Select,
  MenuItem, FormControl, InputLabel, Paper, Divider, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  ToggleButton, ToggleButtonGroup, Tabs, Tab,
} from '@mui/material'
import { Save, RestartAlt, Info, Close, Upload, Visibility } from '@mui/icons-material'
import toast from 'react-hot-toast'

interface ToothRecord {
  toothNumber: number
  label: string
  condition: string
  notes: string
  color: string
  imageUrl?: string
}

interface TeethChartProps {
  patientId: string
  initialTeeth: ToothRecord[]
  onSave: (teeth: ToothRecord[]) => Promise<void>
}

const CONDITIONS = [
  { value: 'healthy', label: 'Healthy', color: '#4CAF50', bg: '#E8F5E9' },
  { value: 'cavity', label: 'Cavity', color: '#F44336', bg: '#FFEBEE' },
  { value: 'filling', label: 'Filling', color: '#FF9800', bg: '#FFF3E0' },
  { value: 'crown', label: 'Crown', color: '#9C27B0', bg: '#F3E5F5' },
  { value: 'root_canal', label: 'Root Canal', color: '#E91E63', bg: '#FCE4EC' },
  { value: 'missing', label: 'Missing', color: '#9E9E9E', bg: '#F5F5F5' },
  { value: 'extraction_needed', label: 'Extraction', color: '#FF5722', bg: '#FBE9E7' },
  { value: 'implant', label: 'Implant', color: '#2196F3', bg: '#E3F2FD' },
]

// Universal Numbering System (1–32)
// Upper: 1–16, Lower: 17–32
const UPPER_TEETH = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]
const LOWER_TEETH = [32,31,30,29,28,27,26,25,24,23,22,21,20,19,18,17]

const TOOTH_NAMES: Record<number, string> = {
  1:'UR3M',2:'UR2M',3:'UR1M',4:'URP',5:'URP2',6:'URC',7:'URI2',8:'URI1',
  9:'ULI1',10:'ULI2',11:'ULC',12:'ULP',13:'ULP2',14:'UL1M',15:'UL2M',16:'UL3M',
  17:'LL3M',18:'LL2M',19:'LL1M',20:'LLP2',21:'LLP',22:'LLC',23:'LLI2',24:'LLI1',
  25:'LRI1',26:'LRI2',27:'LRC',28:'LRP',29:'LRP2',30:'LR1M',31:'LR2M',32:'LR3M',
}

const FULL_NAMES: Record<number, string> = {
  1:'Upper Right 3rd Molar',2:'Upper Right 2nd Molar',3:'Upper Right 1st Molar',
  4:'Upper Right 2nd Premolar',5:'Upper Right 1st Premolar',6:'Upper Right Canine',
  7:'Upper Right Lateral Incisor',8:'Upper Right Central Incisor',
  9:'Upper Left Central Incisor',10:'Upper Left Lateral Incisor',11:'Upper Left Canine',
  12:'Upper Left 1st Premolar',13:'Upper Left 2nd Premolar',14:'Upper Left 1st Molar',
  15:'Upper Left 2nd Molar',16:'Upper Left 3rd Molar',
  17:'Lower Left 3rd Molar',18:'Lower Left 2nd Molar',19:'Lower Left 1st Molar',
  20:'Lower Left 2nd Premolar',21:'Lower Left 1st Premolar',22:'Lower Left Canine',
  23:'Lower Left Lateral Incisor',24:'Lower Left Central Incisor',
  25:'Lower Right Central Incisor',26:'Lower Right Lateral Incisor',27:'Lower Right Canine',
  28:'Lower Right 1st Premolar',29:'Lower Right 2nd Premolar',30:'Lower Right 1st Molar',
  31:'Lower Right 2nd Molar',32:'Lower Right 3rd Molar',
}

function getConditionStyle(condition: string) {
  return CONDITIONS.find(c => c.value === condition) || CONDITIONS[0]
}

// SVG Tooth shapes - different shapes for incisors, canines, premolars, molars
function getToothPath(num: number, isUpper: boolean): string {
  const isIncisor = [7,8,9,10,24,25,26,23].includes(num)
  const isCanine = [6,11,22,27].includes(num)
  const isMolar = [1,2,3,14,15,16,17,18,19,30,31,32].includes(num)
  
  if (isIncisor) {
    return 'M10,4 Q14,2 18,4 L20,28 Q15,32 9,28 Z'
  } else if (isCanine) {
    return 'M8,2 Q14,0 20,2 L22,26 Q14,32 6,26 Z'
  } else if (isMolar) {
    return 'M4,4 Q14,2 24,4 L26,24 Q14,30 2,24 Z'
  } else {
    // premolar
    return 'M6,4 Q14,2 22,4 L24,26 Q14,32 4,26 Z'
  }
}

export default function TeethChart({ patientId, initialTeeth, onSave }: TeethChartProps) {
  const [teeth, setTeeth] = useState<Map<number, ToothRecord>>(() => {
    const map = new Map<number, ToothRecord>()
    initialTeeth.forEach(t => map.set(t.toothNumber, t))
    return map
  })
  const [selected, setSelected] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'2d' | '3d'>('2d')
  const [editDialog, setEditDialog] = useState(false)
  const [editForm, setEditForm] = useState({ label: '', condition: 'healthy', notes: '', color: '#4CAF50', imageUrl: '' })
  const [uploadingImg, setUploadingImg] = useState(false)

  const getTooth = (num: number): ToothRecord => {
    return teeth.get(num) || { toothNumber: num, label: '', condition: 'healthy', notes: '', color: '#4CAF50' }
  }

  const handleToothClick = (num: number) => {
    setSelected(num)
    const t = getTooth(num)
    setEditForm({ label: t.label, condition: t.condition, notes: t.notes || '', color: t.color, imageUrl: t.imageUrl || '' })
    setEditDialog(true)
  }

  const handleSaveEdit = () => {
    if (selected === null) return
    const condStyle = getConditionStyle(editForm.condition)
    const updated = new Map(teeth)
    updated.set(selected, {
      toothNumber: selected,
      label: editForm.label,
      condition: editForm.condition,
      notes: editForm.notes,
      color: condStyle.color,
      imageUrl: editForm.imageUrl,
    })
    setTeeth(updated)
    setEditDialog(false)
    toast.success(`Tooth #${selected} updated`)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', 'Dentra')
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      setEditForm(p => ({ ...p, imageUrl: data.secure_url }))
      toast.success('X-ray uploaded!')
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploadingImg(false)
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await onSave(Array.from(teeth.values()))
      toast.success('Teeth chart saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setTeeth(new Map())
    toast.success('Chart reset')
  }

  const conditionCounts = CONDITIONS.map(c => ({
    ...c,
    count: Array.from(teeth.values()).filter(t => t.condition === c.value).length,
  })).filter(c => c.count > 0)

  const ToothSVG = ({ num, row }: { num: number; row: 'upper' | 'lower' }) => {
    const tooth = getTooth(num)
    const cond = getConditionStyle(tooth.condition)
    const isSelected = selected === num
    const hasData = teeth.has(num)
    const isUpper = row === 'upper'

    return (
      <Tooltip title={`#${num} ${FULL_NAMES[num] || ''} ${tooth.label ? '· ' + tooth.label : ''} · ${cond.label}`} arrow>
        <Box
          onClick={() => handleToothClick(num)}
          sx={{
            display: 'flex',
            flexDirection: isUpper ? 'column-reverse' : 'column',
            alignItems: 'center',
            cursor: 'pointer',
            mx: '1px',
            '&:hover .tooth-body': { transform: isUpper ? 'translateY(-3px)' : 'translateY(3px)', filter: 'brightness(0.9)' },
          }}
        >
          {/* Tooth number */}
          <Typography variant="caption" sx={{ fontSize: '9px', color: 'text.secondary', lineHeight: 1, my: 0.3, fontWeight: hasData ? 700 : 400, color: hasData ? cond.color : 'text.secondary' }}>
            {num}
          </Typography>

          {/* Tooth body */}
          <Box
            className="tooth-body"
            sx={{
              width: 24,
              height: 36,
              transition: 'all 0.15s ease',
              position: 'relative',
            }}
          >
            <svg width="28" height="40" viewBox="0 0 28 40" style={{ display: 'block' }}>
              {/* Root */}
              {isUpper ? (
                <rect x="10" y="28" width="8" height="10" rx="2"
                  fill={hasData ? cond.color : '#D4C5A9'} opacity="0.5" />
              ) : (
                <rect x="10" y="2" width="8" height="10" rx="2"
                  fill={hasData ? cond.color : '#D4C5A9'} opacity="0.5" />
              )}

              {/* Crown */}
              <path
                d={isUpper
                  ? 'M4,6 Q14,2 24,6 L26,28 Q14,34 2,28 Z'
                  : 'M2,10 Q14,4 26,10 L26,30 Q14,36 2,30 Z'}
                fill={hasData ? cond.color : '#F5EFE6'}
                stroke={isSelected ? '#0A6EBD' : (hasData ? cond.color : '#C4B49A')}
                strokeWidth={isSelected ? 2.5 : 1}
                style={{ filter: isSelected ? 'drop-shadow(0 0 4px rgba(10,110,189,0.5))' : 'none' }}
              />

              {/* Tooth surface details */}
              {!['missing'].includes(tooth.condition) && (
                <>
                  <path d="M12,14 Q14,12 16,14 Q14,18 12,14" fill="rgba(0,0,0,0.08)" />
                  <line x1="14" y1="12" x2="14" y2="26" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                </>
              )}

              {/* Missing X */}
              {tooth.condition === 'missing' && (
                <>
                  <line x1="8" y1="12" x2="20" y2="28" stroke="#9E9E9E" strokeWidth="2" />
                  <line x1="20" y1="12" x2="8" y2="28" stroke="#9E9E9E" strokeWidth="2" />
                </>
              )}

              {/* Label dot */}
              {tooth.label && (
                <circle cx="22" cy="8" r="4" fill="#0A6EBD" />
              )}
            </svg>
          </Box>

          {/* Condition indicator */}
          {hasData && (
            <Box sx={{
              width: 6, height: 6, borderRadius: '50%',
              bgcolor: cond.color, my: 0.2,
            }} />
          )}
        </Box>
      </Tooltip>
    )
  }

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Dental Chart</Typography>
          <Typography variant="body2" color="text.secondary">Click any tooth to add label & condition</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RestartAlt />} onClick={handleReset} color="error" size="small">Reset</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveAll} disabled={saving} size="small"
            sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)' }}>
            {saving ? 'Saving...' : 'Save Chart'}
          </Button>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        {CONDITIONS.map(c => (
          <Chip key={c.value} label={c.label} size="small"
            sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, fontSize: '0.7rem',
              border: '1px solid', borderColor: `${c.color}40` }} />
        ))}
      </Box>

      {/* Teeth Grid */}
      <Paper elevation={0} sx={{
        bgcolor: '#F8FAFF',
        border: '2px solid',
        borderColor: 'primary.light',
        borderRadius: 3,
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '"UPPER (Maxillary)"',
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          fontSize: '10px', fontWeight: 700, color: '#0A6EBD', opacity: 0.6,
          letterSpacing: 1.5,
        },
        '&::after': {
          content: '"LOWER (Mandibular)"',
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          fontSize: '10px', fontWeight: 700, color: '#0A6EBD', opacity: 0.6,
          letterSpacing: 1.5,
        },
      }}>
        {/* Right / Left label */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ fontSize: '9px', fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>RIGHT</Typography>
          <Typography variant="caption" sx={{ fontSize: '9px', fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>LEFT</Typography>
        </Box>

        {/* Upper teeth */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5, mt: 1.5 }}>
          {UPPER_TEETH.map(n => <ToothSVG key={n} num={n} row="upper" />)}
        </Box>

        {/* Midline */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
          <Typography variant="caption" sx={{ fontSize: '9px', color: 'text.secondary', fontWeight: 600, letterSpacing: 1 }}>MIDLINE</Typography>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
        </Box>

        {/* Lower teeth */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          {LOWER_TEETH.map(n => <ToothSVG key={n} num={n} row="lower" />)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption" sx={{ fontSize: '9px', fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>RIGHT</Typography>
          <Typography variant="caption" sx={{ fontSize: '9px', fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>LEFT</Typography>
        </Box>
      </Paper>

      {/* Summary */}
      {conditionCounts.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Chart Summary</Typography>
          <Grid container spacing={1}>
            {conditionCounts.map(c => (
              <Grid item key={c.value}>
                <Chip label={`${c.label}: ${c.count}`} size="small"
                  sx={{ bgcolor: c.bg, color: c.color, fontWeight: 600, border: '1px solid', borderColor: `${c.color}40` }} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Tooth Records Table */}
      {teeth.size > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Tooth Records ({teeth.size})</Typography>
          <Box sx={{ maxHeight: 240, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            {Array.from(teeth.values()).sort((a, b) => a.toothNumber - b.toothNumber).map((t, i) => {
              const cond = getConditionStyle(t.condition)
              return (
                <Box key={t.toothNumber} onClick={() => handleToothClick(t.toothNumber)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
                    borderBottom: i < teeth.size - 1 ? '1px solid' : 'none', borderColor: 'divider',
                    cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: cond.bg, border: '1px solid', borderColor: cond.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: cond.color, fontSize: '10px' }}>{t.toothNumber}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{FULL_NAMES[t.toothNumber]}</Typography>
                    {t.label && <Typography variant="caption" color="text.secondary">Label: {t.label}</Typography>}
                  </Box>
                  <Chip label={cond.label} size="small" sx={{ bgcolor: cond.bg, color: cond.color, fontWeight: 600, fontSize: '0.7rem' }} />
                  {t.imageUrl && <Visibility sx={{ fontSize: 16, color: 'text.secondary' }} />}
                </Box>
              )
            })}
          </Box>
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Tooth #{selected}
            </Typography>
            {selected && <Typography variant="body2" color="text.secondary">{FULL_NAMES[selected]}</Typography>}
          </Box>
          <IconButton onClick={() => setEditDialog(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Tooth Label / Note"
                placeholder="e.g. Decay on buccal surface, Crown prep done..."
                value={editForm.label}
                onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))}
                multiline rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select value={editForm.condition} label="Condition"
                  onChange={e => setEditForm(p => ({ ...p, condition: e.target.value }))}
                  sx={{ borderRadius: 2.5 }}>
                  {CONDITIONS.map(c => (
                    <MenuItem key={c.value} value={c.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: c.color }} />
                        {c.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Clinical Notes"
                placeholder="Detailed clinical observations..."
                value={editForm.notes}
                onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
                multiline rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>X-Ray / Image</Typography>
              {editForm.imageUrl ? (
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Box component="img" src={editForm.imageUrl} alt="xray"
                    sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} />
                  <Button size="small" sx={{ mt: 1 }} onClick={() => setEditForm(p => ({ ...p, imageUrl: '' }))}>Remove</Button>
                </Box>
              ) : (
                <label htmlFor="xray-upload">
                  <input id="xray-upload" type="file" accept="image/*" hidden onChange={handleImageUpload} />
                  <Button component="span" variant="outlined" startIcon={<Upload />} disabled={uploadingImg} size="small">
                    {uploadingImg ? 'Uploading...' : 'Upload X-Ray Image'}
                  </Button>
                </label>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditDialog(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained"
            sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
