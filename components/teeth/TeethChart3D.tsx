'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Box, Typography, Button, Chip, Grid, TextField, Select,
  MenuItem, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Divider, Tabs, Tab,
  Paper, Alert, CircularProgress, Tooltip,
} from '@mui/material'
import {
  Save, RestartAlt, Close, Upload, Visibility,
  ThreeDRotation, GridOn, Info, CameraAlt,
} from '@mui/icons-material'
import toast from 'react-hot-toast'

interface ToothRecord {
  toothNumber: number
  label: string
  condition: string
  notes: string
  color: string
  imageUrl?: string
}

interface TeethChart3DProps {
  patientId: string
  initialTeeth: ToothRecord[]
  onSave: (teeth: ToothRecord[]) => Promise<void>
}

// ── Sketchfab Model ID from University of Dundee ─────────────
// Replace with your own model ID if needed
const SKETCHFAB_MODEL_ID = 'e719a474ef7e4bd7abec508f85f1e984'

const CONDITIONS = [
  { value: 'healthy',           label: 'Healthy',     accent: '#4CAF50', bg: '#E8F5E9', rgb: [0.96, 0.94, 0.90] },
  { value: 'cavity',            label: 'Cavity',      accent: '#F44336', bg: '#FFEBEE', rgb: [0.80, 0.13, 0.13] },
  { value: 'filling',           label: 'Filling',     accent: '#9E9E9E', bg: '#F5F5F5', rgb: [0.78, 0.78, 0.78] },
  { value: 'crown',             label: 'Crown',       accent: '#FFC107', bg: '#FFF8E1', rgb: [1.00, 0.76, 0.03] },
  { value: 'root_canal',        label: 'Root Canal',  accent: '#E91E63', bg: '#FCE4EC', rgb: [0.91, 0.12, 0.39] },
  { value: 'missing',           label: 'Missing',     accent: '#9E9E9E', bg: '#F5F5F5', rgb: [0.30, 0.30, 0.30] },
  { value: 'extraction_needed', label: 'Extraction',  accent: '#FF5722', bg: '#FBE9E7', rgb: [1.00, 0.34, 0.13] },
  { value: 'implant',           label: 'Implant',     accent: '#2196F3', bg: '#E3F2FD', rgb: [0.13, 0.59, 0.95] },
]

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

const UPPER_TEETH = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]
const LOWER_TEETH = [32,31,30,29,28,27,26,25,24,23,22,21,20,19,18,17]

function getCondStyle(condition: string) {
  return CONDITIONS.find(c => c.value === condition) || CONDITIONS[0]
}

function getToothType(n: number) {
  if ([1,2,3,14,15,16,17,18,19,30,31,32].includes(n)) return 'molar'
  if ([4,5,12,13,20,21,28,29].includes(n)) return 'premolar'
  if ([6,11,22,27].includes(n)) return 'canine'
  return 'incisor'
}

export default function TeethChart3D({ patientId, initialTeeth, onSave }: TeethChart3DProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const apiRef = useRef<any>(null)

  const [teeth, setTeeth] = useState<Map<number, ToothRecord>>(() => {
    const map = new Map<number, ToothRecord>()
    initialTeeth.forEach(t => map.set(t.toothNumber, t))
    return map
  })
  const [selected, setSelected] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [editForm, setEditForm] = useState({ label: '', condition: 'healthy', notes: '', imageUrl: '' })
  const [uploadingImg, setUploadingImg] = useState(false)
  const [tab, setTab] = useState(0)
  const [viewerReady, setViewerReady] = useState(false)
  const [viewerLoading, setViewerLoading] = useState(true)
  const [materials, setMaterials] = useState<any[]>([])
  const [nodes, setNodes] = useState<any[]>([])

  // ── Init Sketchfab Viewer API ─────────────────────────────
  useEffect(() => {
    if (tab !== 1) return

    // Load Sketchfab API script
    const existingScript = document.getElementById('sketchfab-api')
    if (!existingScript) {
      const script = document.createElement('script')
      script.id = 'sketchfab-api'
      script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js'
      script.onload = () => initViewer()
      document.head.appendChild(script)
    } else {
      initViewer()
    }
  }, [tab])

  const initViewer = useCallback(() => {
    const Sketchfab = (window as any).Sketchfab
    if (!Sketchfab || !iframeRef.current) return

    setViewerLoading(true)
    setViewerReady(false)

    const client = new Sketchfab(iframeRef.current)
    client.init(SKETCHFAB_MODEL_ID, {
      success: (api: any) => {
        apiRef.current = api
        api.start()
        api.addEventListener('viewerready', () => {
          setViewerReady(true)
          setViewerLoading(false)

          // Get all materials in the model
          api.getMaterialList((err: any, mats: any[]) => {
            if (!err) {
              setMaterials(mats)
              console.log('Materials:', mats.map(m => m.name))
            }
          })

          // Get all nodes/objects in the model
          api.getNodeMap((err: any, nodeMap: any) => {
            if (!err) {
              const nodeList = Object.values(nodeMap)
              setNodes(nodeList)
              console.log('Nodes:', nodeList.map((n: any) => n.name))
            }
          })

          // Apply existing teeth conditions to 3D model
          teeth.forEach((tooth) => {
            if (tooth.condition !== 'healthy') {
              applyConditionToModel(api, tooth.toothNumber, tooth.condition)
            }
          })

          toast.success('3D model loaded!')
        })
      },
      error: () => {
        setViewerLoading(false)
        toast.error('Failed to load 3D model')
      },
      // Viewer options
      ui_stop: 0,
      ui_infos: 0,
      ui_inspector: 0,
      ui_watermark: 0,
      ui_ar: 0,
      ui_help: 0,
      ui_settings: 0,
      ui_vr: 0,
      ui_fullscreen: 1,
      ui_annotations: 1,
      autostart: 1,
      transparent: 0,
      camera: 0,
    })
  }, [teeth])

  // ── Apply condition color to 3D model material ────────────
  const applyConditionToModel = useCallback((api: any, toothNum: number, condition: string) => {
    if (!api) return
    const cond = getCondStyle(condition)

    api.getMaterialList((err: any, mats: any[]) => {
      if (err || !mats.length) return

      // Try to find material matching tooth number or tooth name
      const toothName = FULL_NAMES[toothNum]?.toLowerCase() || ''
      const type = getToothType(toothNum)

      // Find best matching material
      let targetMat = mats.find(m =>
        m.name.toLowerCase().includes(`tooth_${toothNum}`) ||
        m.name.toLowerCase().includes(`#${toothNum}`) ||
        m.name.toLowerCase() === toothName
      )

      // Fallback: match by tooth type
      if (!targetMat) {
        targetMat = mats.find(m => m.name.toLowerCase().includes(type))
      }

      // Fallback: use first enamel/tooth material
      if (!targetMat) {
        targetMat = mats.find(m =>
          m.name.toLowerCase().includes('enamel') ||
          m.name.toLowerCase().includes('tooth') ||
          m.name.toLowerCase().includes('crown')
        ) || mats[0]
      }

      if (!targetMat) return

      // Clone and modify material color
      const mat = JSON.parse(JSON.stringify(targetMat))

      if (condition === 'missing') {
        // Hide the node if possible
        api.getNodeMap((err2: any, nodeMap: any) => {
          if (err2) return
          Object.values(nodeMap).forEach((node: any) => {
            if (node.name?.toLowerCase().includes(`${toothNum}`) ||
                node.name?.toLowerCase().includes(type)) {
              api.hide(node.instanceID)
            }
          })
        })
        return
      }

      // Apply color to albedo channel
      if (mat.channels?.AlbedoPBR) {
        mat.channels.AlbedoPBR.color = cond.rgb
        mat.channels.AlbedoPBR.factor = 1
      }
      if (mat.channels?.DiffuseColor) {
        mat.channels.DiffuseColor.color = cond.rgb
      }

      api.setMaterial(mat, () => {
        console.log(`Applied ${condition} color to tooth #${toothNum}`)
      })
    })
  }, [])

  // ── Add annotation for labeled tooth ─────────────────────
  const addAnnotation = useCallback((toothNum: number, label: string) => {
    const api = apiRef.current
    if (!api || !label) return

    // Remove existing annotation for this tooth first
    api.getAnnotationList((err: any, annotations: any[]) => {
      if (err) return
      const existing = annotations.findIndex(a =>
        a.name?.includes(`#${toothNum}`) || a.content?.raw?.includes(`#${toothNum}`)
      )
      if (existing >= 0) api.removeAnnotation(existing)
    })
  }, [])

  // ── Sync teeth changes to 3D ─────────────────────────────
  const syncToothTo3D = useCallback((toothNum: number, condition: string, label: string) => {
    const api = apiRef.current
    if (!api || !viewerReady) return
    applyConditionToModel(api, toothNum, condition)
    if (label) addAnnotation(toothNum, label)
  }, [viewerReady, applyConditionToModel, addAnnotation])

  // ── Camera presets ────────────────────────────────────────
  const setCameraView = (view: 'front' | 'top' | 'upper' | 'lower') => {
    const api = apiRef.current
    if (!api) return

    const views: Record<string, any> = {
      front:  { eye: [0, 0, 25], target: [0, 0, 0], up: [0, 1, 0] },
      top:    { eye: [0, 25, 0], target: [0, 0, 0], up: [0, 0, -1] },
      upper:  { eye: [0, 15, 15], target: [0, 2, 0], up: [0, 1, 0] },
      lower:  { eye: [0, -15, 15], target: [0, -2, 0], up: [0, 1, 0] },
    }

    const v = views[view]
    api.setCameraLookAt(v.eye, v.target, 1.5)
  }

  // ── Handlers ─────────────────────────────────────────────
  const handleToothClick = (num: number) => {
    setSelected(num)
    const existing = teeth.get(num)
    setEditForm({
      label: existing?.label || '',
      condition: existing?.condition || 'healthy',
      notes: existing?.notes || '',
      imageUrl: existing?.imageUrl || '',
    })
    setEditDialog(true)
  }

  const handleSaveEdit = () => {
    if (selected === null) return
    const condStyle = getCondStyle(editForm.condition)
    const updated = new Map(teeth)
    updated.set(selected, {
      toothNumber: selected,
      label: editForm.label,
      condition: editForm.condition,
      notes: editForm.notes,
      color: condStyle.accent,
      imageUrl: editForm.imageUrl,
    })
    setTeeth(updated)

    // Sync to 3D viewer if open
    syncToothTo3D(selected, editForm.condition, editForm.label)

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
      fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd }
      )
      const data = await res.json()
      if (data.error) { toast.error(data.error.message); return }
      setEditForm(p => ({ ...p, imageUrl: data.secure_url }))
      toast.success('X-ray uploaded!')
    } catch { toast.error('Upload failed') }
    finally { setUploadingImg(false) }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await onSave(Array.from(teeth.values()))
      toast.success('Teeth chart saved!')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const handleReset = () => {
    setTeeth(new Map())
    // Reset all material colors in 3D
    const api = apiRef.current
    if (api && viewerReady) {
      api.getMaterialList((err: any, mats: any[]) => {
        if (err) return
        mats.forEach(mat => {
          const m = JSON.parse(JSON.stringify(mat))
          if (m.channels?.AlbedoPBR) {
            m.channels.AlbedoPBR.color = [0.96, 0.94, 0.90]
          }
          api.setMaterial(m)
        })
      })
    }
    toast.success('Chart reset')
  }

  const conditionCounts = CONDITIONS.map(c => ({
    ...c, count: Array.from(teeth.values()).filter(t => t.condition === c.value).length,
  })).filter(c => c.count > 0)

  // ── 2D SVG Tooth Component ────────────────────────────────
  const ToothSVG = ({ num, row }: { num: number; row: 'upper' | 'lower' }) => {
    const tooth = teeth.get(num)
    const cond = tooth ? getCondStyle(tooth.condition) : CONDITIONS[0]
    const hasData = teeth.has(num)
    const isUpper = row === 'upper'
    const isMissing = tooth?.condition === 'missing'

    return (
      <Box
        onClick={() => handleToothClick(num)}
        title={`#${num} ${FULL_NAMES[num]}${tooth?.label ? ' — ' + tooth.label : ''}`}
        sx={{
          display: 'flex', flexDirection: isUpper ? 'column-reverse' : 'column',
          alignItems: 'center', cursor: 'pointer', mx: '1px',
          '&:hover .tbody': {
            transform: isUpper ? 'translateY(-4px)' : 'translateY(4px)',
            filter: 'brightness(0.88)',
          },
        }}
      >
        <Typography sx={{
          fontSize: '9px', lineHeight: 1, my: 0.3,
          fontWeight: hasData ? 700 : 400,
          color: hasData ? cond.accent : 'text.secondary',
        }}>{num}</Typography>

        <Box className="tbody" sx={{ width: 26, height: 38, transition: 'all 0.15s ease' }}>
          <svg width="28" height="42" viewBox="0 0 28 42" style={{ display: 'block' }}>
            {isUpper
              ? <rect x="10" y="30" width="8" height="10" rx="2" fill={hasData ? cond.accent : '#D4C5A9'} opacity="0.45" />
              : <rect x="10" y="2" width="8" height="10" rx="2" fill={hasData ? cond.accent : '#D4C5A9'} opacity="0.45" />
            }
            {isMissing ? (
              <>
                <path d={isUpper ? 'M4,7 Q14,3 24,7 L25,28 Q14,34 3,28 Z' : 'M3,10 Q14,5 25,10 L25,30 Q14,36 3,30 Z'}
                  fill="#e0e0e0" stroke="#bdbdbd" strokeWidth="1" opacity="0.5" />
                <line x1="9" y1="13" x2="19" y2="27" stroke="#9E9E9E" strokeWidth="1.8" />
                <line x1="19" y1="13" x2="9" y2="27" stroke="#9E9E9E" strokeWidth="1.8" />
              </>
            ) : (
              <path
                d={isUpper ? 'M4,7 Q14,3 24,7 L25,28 Q14,34 3,28 Z' : 'M3,10 Q14,5 25,10 L25,30 Q14,36 3,30 Z'}
                fill={hasData ? cond.accent : '#F5EFE6'}
                stroke={hasData ? cond.accent : '#C4B49A'}
                strokeWidth={selected === num ? 2.5 : 1}
                style={{ filter: selected === num ? `drop-shadow(0 0 4px ${cond.accent}80)` : 'none' }}
              />
            )}
            {!isMissing && getToothType(num) === 'molar' && (
              <>
                <line x1="14" y1="13" x2="14" y2="26" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                <line x1="9" y1="18" x2="19" y2="18" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
              </>
            )}
            {tooth?.label && !isMissing && <circle cx="22" cy="9" r="4" fill="#0A6EBD" />}
          </svg>
        </Box>

        {hasData && !isMissing && (
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cond.accent, my: 0.2 }} />
        )}
      </Box>
    )
  }

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ThreeDRotation sx={{ color: 'primary.main', fontSize: 26 }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>Dental Chart</Typography>
            <Typography variant="body2" color="text.secondary">
              Interactive 2D chart + live 3D model manipulation
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RestartAlt />} onClick={handleReset} color="error" size="small">Reset</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveAll} disabled={saving} size="small"
            sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)' }}>
            {saving ? 'Saving...' : 'Save Chart'}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="2D Chart" icon={<GridOn sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="3D Model Viewer" icon={<ThreeDRotation sx={{ fontSize: 18 }} />} iconPosition="start" />
      </Tabs>

      {/* ── TAB 0: 2D Interactive Chart ── */}
      {tab === 0 && (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
            {CONDITIONS.map(c => (
              <Chip key={c.value} label={c.label} size="small"
                sx={{ bgcolor: c.bg, color: c.accent, fontWeight: 600, fontSize: '0.7rem',
                  border: '1px solid', borderColor: `${c.accent}40` }} />
            ))}
          </Box>

          <Paper elevation={0} sx={{
            bgcolor: '#F8FAFF', border: '2px solid', borderColor: 'primary.light',
            borderRadius: 3, p: 3, position: 'relative', overflow: 'hidden',
            '&::before': { content: '"UPPER (Maxillary)"', position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 700, color: '#0A6EBD', opacity: 0.6, letterSpacing: 1.5 },
            '&::after': { content: '"LOWER (Mandibular)"', position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 700, color: '#0A6EBD', opacity: 0.6, letterSpacing: 1.5 },
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '9px', fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>RIGHT</Typography>
              <Typography sx={{ fontSize: '9px', fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>LEFT</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5, mt: 1.5 }}>
              {UPPER_TEETH.map(n => <ToothSVG key={n} num={n} row="upper" />)}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
              <Typography sx={{ fontSize: '9px', color: 'text.secondary', fontWeight: 600, letterSpacing: 1 }}>MIDLINE</Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
              {LOWER_TEETH.map(n => <ToothSVG key={n} num={n} row="lower" />)}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography sx={{ fontSize: '9px', fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>RIGHT</Typography>
              <Typography sx={{ fontSize: '9px', fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>LEFT</Typography>
            </Box>
          </Paper>

          {conditionCounts.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>Chart Summary</Typography>
              <Grid container spacing={1}>
                {conditionCounts.map(c => (
                  <Grid item key={c.value}>
                    <Chip label={`${c.label}: ${c.count}`} size="small"
                      sx={{ bgcolor: c.bg, color: c.accent, fontWeight: 600, border: '1px solid', borderColor: `${c.accent}40` }} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* ── TAB 1: Sketchfab 3D Viewer with API ── */}
      {tab === 1 && (
        <Box>
          {/* Attribution */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#EBF4FF', border: '1px solid', borderColor: '#90CAF9' }}>
            <Info sx={{ fontSize: 16, color: 'primary.main' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" fontWeight={700} color="primary.dark">
                University of Dundee — School of Dentistry · @DundeeDental
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                3D model powered by Sketchfab Viewer API · CC Attribution License
              </Typography>
            </Box>
            {viewerReady && (
              <Chip label="Live API" size="small" color="success" sx={{ fontWeight: 700, fontSize: '11px' }} />
            )}
          </Box>

          {/* Camera Controls */}
          {viewerReady && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Camera:</Typography>
              {(['front', 'top', 'upper', 'lower'] as const).map(v => (
                <Button key={v} size="small" variant="outlined" onClick={() => setCameraView(v)}
                  startIcon={<CameraAlt sx={{ fontSize: 14 }} />}
                  sx={{ fontSize: '11px', py: 0.5, textTransform: 'capitalize' }}>
                  {v}
                </Button>
              ))}
            </Box>
          )}

          {/* Conditions applied summary */}
          {viewerReady && teeth.size > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>Applied to 3D:</Typography>
              {Array.from(teeth.values()).filter(t => t.condition !== 'healthy').map(t => {
                const cond = getCondStyle(t.condition)
                return (
                  <Chip key={t.toothNumber}
                    label={`#${t.toothNumber} ${cond.label}`}
                    size="small"
                    onClick={() => handleToothClick(t.toothNumber)}
                    sx={{ bgcolor: cond.bg, color: cond.accent, fontWeight: 600,
                      border: `1px solid ${cond.accent}50`, fontSize: '11px', cursor: 'pointer' }} />
                )
              })}
            </Box>
          )}

          {/* Sketchfab iframe with API */}
          <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', border: '2px solid', borderColor: viewerReady ? 'success.light' : 'primary.light' }}>
            {viewerLoading && (
              <Box sx={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', bgcolor: '#0d1b2e', zIndex: 10,
              }}>
                <CircularProgress sx={{ color: '#00B4D8', mb: 2 }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  Loading 3D model...
                </Typography>
              </Box>
            )}

            <iframe
              ref={iframeRef}
              id="sketchfab-api-frame"
              title="3D Teeth — University of Dundee"
              frameBorder="0"
              allow="autoplay; fullscreen; xr-spatial-tracking"
              allowFullScreen
              style={{ width: '100%', height: '460px', display: 'block' }}
            />
          </Box>

          {/* API Status */}
          {viewerReady && (
            <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2 }}>
              3D Viewer API ready — tooth conditions are applied to the model in real-time when you edit them in the 2D chart.
            </Alert>
          )}

          {/* Instructions */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {[
              'Drag to rotate',
              'Scroll to zoom',
              'Right-click to pan',
              'Edit tooth in 2D chart → syncs to 3D',
            ].map(tip => (
              <Chip key={tip} label={tip} size="small" variant="outlined" sx={{ fontSize: '11px' }} />
            ))}
          </Box>
        </Box>
      )}

      {/* Records list */}
      {teeth.size > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1}>Tooth Records ({teeth.size})</Typography>
          <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            {Array.from(teeth.values()).sort((a, b) => a.toothNumber - b.toothNumber).map((t, i) => {
              const cond = getCondStyle(t.condition)
              return (
                <Box key={t.toothNumber}
                  onClick={() => { setSelected(t.toothNumber); setEditForm({ label: t.label, condition: t.condition, notes: t.notes || '', imageUrl: t.imageUrl || '' }); setEditDialog(true) }}
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
                    borderBottom: i < teeth.size - 1 ? '1px solid' : 'none', borderColor: 'divider',
                    cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: cond.bg, border: '1px solid', borderColor: cond.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: cond.accent, fontSize: '10px' }}>{t.toothNumber}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{FULL_NAMES[t.toothNumber]}</Typography>
                    {t.label && <Typography variant="caption" color="text.secondary">{t.label}</Typography>}
                  </Box>
                  <Chip label={cond.label} size="small"
                    sx={{ bgcolor: cond.bg, color: cond.accent, fontWeight: 600, fontSize: '0.7rem' }} />
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
            <Typography variant="h6" fontWeight={700}>Tooth #{selected}</Typography>
            {selected && <Typography variant="body2" color="text.secondary">{FULL_NAMES[selected]}</Typography>}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selected && viewerReady && (
              <Chip label="Sync to 3D" size="small" icon={<ThreeDRotation sx={{ fontSize: 14 }} />}
                color="primary" variant="outlined" sx={{ fontSize: '11px' }} />
            )}
            <IconButton onClick={() => setEditDialog(false)} size="small"><Close /></IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Label / Note" multiline rows={2}
                placeholder="e.g. Decay on buccal surface, Crown prep done..."
                value={editForm.label}
                onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))} />
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
                        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: c.accent }} />
                        {c.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Clinical Notes" multiline rows={3}
                placeholder="Detailed clinical observations..."
                value={editForm.notes}
                onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>X-Ray / Image</Typography>
              {editForm.imageUrl ? (
                <Box>
                  <Box component="img" src={editForm.imageUrl} alt="xray"
                    sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} />
                  <Button size="small" sx={{ mt: 1 }} onClick={() => setEditForm(p => ({ ...p, imageUrl: '' }))}>Remove</Button>
                </Box>
              ) : (
                <label htmlFor="xray-upload-3d">
                  <input id="xray-upload-3d" type="file" accept="image/*" hidden onChange={handleImageUpload} />
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
            {viewerReady ? 'Save & Sync to 3D' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}