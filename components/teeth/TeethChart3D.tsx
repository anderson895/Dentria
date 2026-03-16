'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import {
  Box, Typography, Button, Chip, Grid, TextField, Select,
  MenuItem, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Divider, Tabs, Tab,
  Paper, LinearProgress, CircularProgress,
} from '@mui/material'
import {
  Save, RestartAlt, Close, Upload, Visibility,
  ThreeDRotation, GridOn,
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

const CONDITIONS = [
  { value: 'healthy',           label: 'Healthy',    accent: '#4CAF50', bg: '#E8F5E9', rgb: [0.96, 0.94, 0.90] as [number,number,number] },
  { value: 'cavity',            label: 'Cavity',     accent: '#F44336', bg: '#FFEBEE', rgb: [0.80, 0.13, 0.13] as [number,number,number] },
  { value: 'filling',           label: 'Filling',    accent: '#9E9E9E', bg: '#F5F5F5', rgb: [0.75, 0.75, 0.75] as [number,number,number] },
  { value: 'crown',             label: 'Crown',      accent: '#FFC107', bg: '#FFF8E1', rgb: [1.00, 0.76, 0.03] as [number,number,number] },
  { value: 'root_canal',        label: 'Root Canal', accent: '#E91E63', bg: '#FCE4EC', rgb: [0.91, 0.12, 0.39] as [number,number,number] },
  { value: 'missing',           label: 'Missing',    accent: '#9E9E9E', bg: '#F5F5F5', rgb: [0.30, 0.30, 0.30] as [number,number,number] },
  { value: 'extraction_needed', label: 'Extraction', accent: '#FF5722', bg: '#FBE9E7', rgb: [1.00, 0.34, 0.13] as [number,number,number] },
  { value: 'implant',           label: 'Implant',    accent: '#2196F3', bg: '#E3F2FD', rgb: [0.13, 0.59, 0.95] as [number,number,number] },
]

const FULL_NAMES: Record<number, string> = {
  1:'UR 3rd Molar',    2:'UR 2nd Molar',    3:'UR 1st Molar',
  4:'UR 2nd Premolar', 5:'UR 1st Premolar', 6:'UR Canine',
  7:'UR Lat. Incisor', 8:'UR Cen. Incisor',
  9:'UL Cen. Incisor', 10:'UL Lat. Incisor', 11:'UL Canine',
  12:'UL 1st Premolar', 13:'UL 2nd Premolar', 14:'UL 1st Molar',
  15:'UL 2nd Molar',   16:'UL 3rd Molar',
  17:'LL 3rd Molar',   18:'LL 2nd Molar',   19:'LL 1st Molar',
  20:'LL 2nd Premolar', 21:'LL 1st Premolar', 22:'LL Canine',
  23:'LL Lat. Incisor', 24:'LL Cen. Incisor',
  25:'LR Cen. Incisor', 26:'LR Lat. Incisor', 27:'LR Canine',
  28:'LR 1st Premolar', 29:'LR 2nd Premolar', 30:'LR 1st Molar',
  31:'LR 2nd Molar',   32:'LR 3rd Molar',
}

const UPPER_TEETH = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]
const LOWER_TEETH = [32,31,30,29,28,27,26,25,24,23,22,21,20,19,18,17]

const GLB_MAP: Record<number, { file: string; mirrorX: boolean; isLower: boolean }> = {
  1:  { file: '/teeth/mx-3rd-molar.glb',       mirrorX: true,  isLower: false },
  2:  { file: '/teeth/mx-2nd-molar.glb',        mirrorX: true,  isLower: false },
  3:  { file: '/teeth/mx-1st-molar.glb',        mirrorX: true,  isLower: false },
  4:  { file: '/teeth/mx-2nd-premolar.glb',     mirrorX: true,  isLower: false },
  5:  { file: '/teeth/mx-1st-premolar.glb',     mirrorX: true,  isLower: false },
  6:  { file: '/teeth/mx-canine.glb',           mirrorX: true,  isLower: false },
  7:  { file: '/teeth/mx-lateral-incisor.glb',  mirrorX: true,  isLower: false },
  8:  { file: '/teeth/mx-central-incisor.glb',  mirrorX: true,  isLower: false },
  9:  { file: '/teeth/mx-central-incisor.glb',  mirrorX: false, isLower: false },
  10: { file: '/teeth/mx-lateral-incisor.glb',  mirrorX: false, isLower: false },
  11: { file: '/teeth/mx-canine.glb',           mirrorX: false, isLower: false },
  12: { file: '/teeth/mx-1st-premolar.glb',     mirrorX: false, isLower: false },
  13: { file: '/teeth/mx-2nd-premolar.glb',     mirrorX: false, isLower: false },
  14: { file: '/teeth/mx-1st-molar.glb',        mirrorX: false, isLower: false },
  15: { file: '/teeth/mx-2nd-molar.glb',        mirrorX: false, isLower: false },
  16: { file: '/teeth/mx-3rd-molar.glb',        mirrorX: false, isLower: false },
  17: { file: '/teeth/md-3rd-molar.glb',        mirrorX: true,  isLower: true  },
  18: { file: '/teeth/md-2nd-molar.glb',        mirrorX: true,  isLower: true  },
  19: { file: '/teeth/md-1st-molar.glb',        mirrorX: true,  isLower: true  },
  20: { file: '/teeth/md-2nd-premolar.glb',     mirrorX: true,  isLower: true  },
  21: { file: '/teeth/md-1st-premolar.glb',     mirrorX: true,  isLower: true  },
  22: { file: '/teeth/md-canine.glb',           mirrorX: true,  isLower: true  },
  23: { file: '/teeth/md-lateral-incisor.glb',  mirrorX: true,  isLower: true  },
  24: { file: '/teeth/md-central-incisor.glb',  mirrorX: true,  isLower: true  },
  25: { file: '/teeth/md-central-incisor.glb',  mirrorX: false, isLower: true  },
  26: { file: '/teeth/md-lateral-incisor.glb',  mirrorX: false, isLower: true  },
  27: { file: '/teeth/md-canine.glb',           mirrorX: false, isLower: true  },
  28: { file: '/teeth/md-1st-premolar.glb',     mirrorX: false, isLower: true  },
  29: { file: '/teeth/md-2nd-premolar.glb',     mirrorX: false, isLower: true  },
  30: { file: '/teeth/md-1st-molar.glb',        mirrorX: false, isLower: true  },
  31: { file: '/teeth/md-2nd-molar.glb',        mirrorX: false, isLower: true  },
  32: { file: '/teeth/md-3rd-molar.glb',        mirrorX: false, isLower: true  },
}

function getCondStyle(condition: string) {
  return CONDITIONS.find(c => c.value === condition) || CONDITIONS[0]
}

function getToothType(n: number) {
  if ([1,2,3,14,15,16,17,18,19,30,31,32].includes(n)) return 'molar'
  if ([4,5,12,13,20,21,28,29].includes(n)) return 'premolar'
  if ([6,11,22,27].includes(n)) return 'canine'
  return 'incisor'
}

async function loadGLTFLoaderClass(): Promise<any> {
  try { const m = await import('three/addons/loaders/GLTFLoader.js' as any); if (m.GLTFLoader) return m.GLTFLoader } catch {}
  try { const m = await import('three/examples/jsm/loaders/GLTFLoader' as any); if (m.GLTFLoader) return m.GLTFLoader } catch {}
  return null
}

export default function TeethChart3D({ patientId, initialTeeth, onSave }: TeethChart3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef  = useRef<{ applyTint: (n: number, c: string) => void; resetAll: () => void } | null>(null)

  // All live 3D params — read by animate loop, updated by GUI sliders
  const ctrlRef = useRef({
    jawOffset:  1.2,
    crownLen:   1.0,
    gumZBack:   0.8,
    gumRadius:  0.52,
    upperRotX:  0.0,
    upperRotZ:  0.0,
    lowerRotX:  0.0,
    lowerRotZ:  0.0,
    flipUpper:  false,
    flipLower:  true,
    showGums:   true,  // toggle gum visibility
  })
  const zoomRef = useRef(18)  // separate ref so zoom buttons work without re-render
  const [ctrl, setCtrl] = useState({ ...ctrlRef.current })

  // Three.js object refs
  const upperGroupRef     = useRef<THREE.Group | null>(null)
  const lowerGroupRef     = useRef<THREE.Group | null>(null)
  const upperGumRef       = useRef<THREE.Mesh  | null>(null)
  const lowerGumRef       = useRef<THREE.Mesh  | null>(null)
  const upperTeethFlipRef = useRef<THREE.Group | null>(null) // teeth only, not gum
  const lowerTeethFlipRef = useRef<THREE.Group | null>(null)

  const [teeth, setTeeth] = useState<Map<number, ToothRecord>>(() => {
    const m = new Map<number, ToothRecord>()
    initialTeeth.forEach(t => m.set(t.toothNumber, t))
    return m
  })
  const [selected,         setSelected]         = useState<number | null>(null)
  const [hovered,          setHovered]           = useState<number | null>(null)
  const [saving,           setSaving]            = useState(false)
  const [editDialog,       setEditDialog]        = useState(false)
  const [editForm,         setEditForm]          = useState({ label: '', condition: 'healthy', notes: '', imageUrl: '' })
  const [uploadingImg,     setUploadingImg]      = useState(false)
  const [tab,              setTab]               = useState(0)
  const [loadedCount,      setLoadedCount]       = useState(0)
  const [loadingProgress,  setLoadingProgress]   = useState(0)
  const [isSceneReady,     setIsSceneReady]      = useState(false)
  const [labelPositions,   setLabelPositions]    = useState<Array<{ num: number; x: number; y: number; visible: boolean }>>([])

  useEffect(() => {
    if (tab !== 1 || !canvasRef.current) return
    const canvas = canvasRef.current
    let cancelled = false

    ;(async () => {
      const GLTFLoaderClass = await loadGLTFLoaderClass()
      if (cancelled) return

      // ── Renderer ────────────────────────────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.3
      try { ;(renderer as any).outputColorSpace = 'srgb' } catch {}

      // ── Scene & Camera ───────────────────────────────────────────────────────
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0d1b2e)
      scene.fog = new THREE.FogExp2(0x0d1b2e, 0.022)

      const camera = new THREE.PerspectiveCamera(44, 1, 0.01, 200)
      camera.position.set(0, 6, 18)
      camera.lookAt(0, 0, 4)

      // ── Lights ───────────────────────────────────────────────────────────────
      scene.add(new THREE.AmbientLight(0xfff5e0, 0.6))
      const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.0)
      keyLight.position.set(5, 14, 10)
      keyLight.castShadow = true
      keyLight.shadow.mapSize.width = 2048
      keyLight.shadow.mapSize.height = 2048
      keyLight.shadow.camera.near = 0.5
      keyLight.shadow.camera.far = 60
      keyLight.shadow.camera.left = -15; keyLight.shadow.camera.right = 15
      keyLight.shadow.camera.top = 15;   keyLight.shadow.camera.bottom = -15
      keyLight.shadow.bias = -0.001
      scene.add(keyLight)
      const rimLight = new THREE.DirectionalLight(0x6699ff, 0.5)
      rimLight.position.set(-6, 2, -6)
      scene.add(rimLight)
      const fillLight = new THREE.PointLight(0xfff0cc, 0.8, 40)
      fillLight.position.set(0, 8, 8)
      scene.add(fillLight)

      // ── Jaw groups ───────────────────────────────────────────────────────────
      // Structure:
      //   upperGroup         ← jaw rotation applied here
      //     ├─ upperGum      ← gum mesh, NOT inside flip group
      //     └─ upperTeethFlip← scale.y flip applied here (teeth only)
      //          └─ posGroups (teeth)
      const upperGroup = new THREE.Group()
      const lowerGroup = new THREE.Group()
      scene.add(upperGroup)
      scene.add(lowerGroup)
      upperGroupRef.current = upperGroup
      lowerGroupRef.current = lowerGroup

      const upperTeethFlip = new THREE.Group()
      const lowerTeethFlip = new THREE.Group()
      upperGroup.add(upperTeethFlip)
      lowerGroup.add(lowerTeethFlip)
      upperTeethFlipRef.current = upperTeethFlip
      lowerTeethFlipRef.current = lowerTeethFlip

      // ── Gum arches — exactly 2, simple like original ─────────────────────────
      const gumMat = new THREE.MeshPhysicalMaterial({ color: 0xc85070, roughness: 0.8, metalness: 0 })

      function makeGumMesh(yPos: number): THREE.Mesh {
        const c = ctrlRef.current
        const pts: THREE.Vector3[] = []
        for (let i = 0; i <= 40; i++) {
          const angle = (i / 40 - 0.5) * Math.PI * 0.95
          pts.push(new THREE.Vector3(
            5.0 * Math.sin(angle),
            0,
            -5.0 * Math.cos(angle) + 5.0 + c.gumZBack,
          ))
        }
        const geo  = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, c.gumRadius, 8, false)
        const mesh = new THREE.Mesh(geo, gumMat.clone())
        mesh.position.y = yPos
        mesh.castShadow = true
        return mesh
      }

      const c0     = ctrlRef.current
      const JAW_Y  = c0.jawOffset
      const GUM_UP =  c0.jawOffset + c0.crownLen
      const GUM_LO = -(c0.jawOffset + c0.crownLen)

      // Add gum directly to jaw group (not to flip group)
      const ugMesh = makeGumMesh(GUM_UP)
      const lgMesh = makeGumMesh(GUM_LO)
      upperGroup.add(ugMesh)
      lowerGroup.add(lgMesh)
      upperGumRef.current = ugMesh
      lowerGumRef.current = lgMesh

      // Rebuild gum geometry when slider changes (just the 2 meshes)
      function rebuildGums() {
        const c  = ctrlRef.current
        const gu =  c.jawOffset + c.crownLen
        const gl = -(c.jawOffset + c.crownLen)
        ;[upperGumRef.current, lowerGumRef.current].forEach((m, i) => {
          if (!m) return
          m.geometry.dispose()
          const pts: THREE.Vector3[] = []
          for (let j = 0; j <= 40; j++) {
            const angle = (j / 40 - 0.5) * Math.PI * 0.95
            pts.push(new THREE.Vector3(5.0 * Math.sin(angle), 0, -5.0 * Math.cos(angle) + 5.0 + c.gumZBack))
          }
          m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, c.gumRadius, 8, false)
          m.position.y = i === 0 ? gu : gl
        })
      }
      ;(sceneRef as any)._rebuildGums = rebuildGums

      // ── Tooth storage ────────────────────────────────────────────────────────
      const toothMap: Record<number, { group: THREE.Group; materials: THREE.MeshStandardMaterial[]; originalColors: number[][] }> = {}
      const clickTargets: THREE.Object3D[] = []
      const glbCache: Record<string, THREE.Group> = {}
      let totalLoaded = 0
      const TOTAL = 32

      function applyTint(num: number, condition: string) {
        const data = toothMap[num]
        if (!data) return
        const cond = getCondStyle(condition)
        if (condition === 'missing') { data.group.visible = false; return }
        data.group.visible = true
        if (condition === 'healthy') {
          data.materials.forEach((mat, i) => {
            if (data.originalColors[i]) mat.color.setRGB(data.originalColors[i][0], data.originalColors[i][1], data.originalColors[i][2])
          })
        } else {
          data.materials.forEach(mat => mat.color.setRGB(cond.rgb[0], cond.rgb[1], cond.rgb[2]))
        }
      }

      function registerTooth(num: number, group: THREE.Group, materials: THREE.MeshStandardMaterial[], originalColors: number[][]) {
        toothMap[num] = { group, materials, originalColors }
        group.traverse(child => { if ((child as THREE.Mesh).isMesh) { child.userData.toothNum = num; clickTargets.push(child) } })
        const existing = teeth.get(num)
        if (existing) applyTint(num, existing.condition)
        if (existing?.condition === 'missing') group.visible = false
        totalLoaded++
        if (!cancelled) {
          setLoadedCount(totalLoaded)
          setLoadingProgress(Math.round(totalLoaded / TOTAL * 100))
          if (totalLoaded >= TOTAL) setIsSceneReady(true)
        }
      }

      // ── Procedural fallback ──────────────────────────────────────────────────
      function placeFallback(num: number, posX: number, yBase: number, posZ: number, rotY: number, isLower: boolean) {
        const dims: Record<string, [number, number]> = { molar:[1.1,1.6], premolar:[0.85,1.4], canine:[0.72,1.8], incisor:[0.65,1.3] }
        const [w, h] = dims[getToothType(num)] || dims.incisor
        const r = w * 0.42, crownH = h * 0.55, rootH = h * 0.45

        const mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.96, 0.94, 0.90), roughness: 0.18, metalness: 0, clearcoat: 0.85, side: THREE.DoubleSide }) as unknown as THREE.MeshStandardMaterial
        const rootMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.80, 0.70, 0.55), roughness: 0.55, metalness: 0, side: THREE.DoubleSide }) as unknown as THREE.MeshStandardMaterial

        const crownMesh = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r * 0.75, crownH, 10), mat)
        crownMesh.castShadow = true; crownMesh.receiveShadow = true; crownMesh.userData.toothNum = num
        const rootMesh = new THREE.Mesh(new THREE.ConeGeometry(r * 0.48, rootH, 8), rootMat)
        rootMesh.castShadow = true; rootMesh.userData.toothNum = num

        // Dundee space: crown at -Y, roots at +Y
        crownMesh.position.y = -crownH / 2
        rootMesh.position.y  =  rootH  / 2

        const model = new THREE.Group()
        model.add(crownMesh); model.add(rootMesh)
        if (isLower) model.scale.y = -1
        model.position.y = isLower ? -crownH : crownH

        const faceGroup = new THREE.Group()
        faceGroup.add(model)
        faceGroup.rotation.y = Math.PI

        const posGroup = new THREE.Group()
        posGroup.add(faceGroup)
        posGroup.position.set(posX, yBase, posZ)
        posGroup.rotation.y = rotY
        if (isLower) { lowerTeethFlip.add(posGroup) } else { upperTeethFlip.add(posGroup) }

        registerTooth(num, posGroup, [mat, rootMat], [
          [(mat as any).color.r, (mat as any).color.g, (mat as any).color.b],
          [(rootMat as any).color.r, (rootMat as any).color.g, (rootMat as any).color.b],
        ])
      }

      // ── Place tooth from GLB ─────────────────────────────────────────────────
      function placeTooth(num: number, rx: number, rz: number, yBase: number, arcIdx: number) {
        const { file, mirrorX, isLower } = GLB_MAP[num]
        const angle = (arcIdx / 15 - 0.5) * Math.PI * 0.9
        const posX  = rx * Math.sin(angle)
        const posZ  = -rz * Math.cos(angle) + rz
        const rotY  = -angle

        function buildFromGltfScene(gltfScene: THREE.Group) {
          const model = gltfScene.clone(true)

          // Scale to 2.2 units on longest axis
          model.updateMatrixWorld(true)
          const box0 = new THREE.Box3().setFromObject(model)
          const size0 = box0.getSize(new THREE.Vector3())
          const maxDim = Math.max(size0.x, size0.y, size0.z)
          if (maxDim === 0) { placeFallback(num, posX, yBase, posZ, rotY, isLower); return }
          model.scale.setScalar(2.2 / maxDim)

          // Bake crown direction into scale.y BEFORE measuring bounding box
          // Dundee: crown at -Y (min.y), roots at +Y (max.y)
          // UPPER: no flip — crown stays at min.y → points downward (toward bite) ✓
          // LOWER: scale.y *= -1 — crown flips from -Y to +Y → points upward (toward bite) ✓
          if (isLower) model.scale.y *= -1

          model.updateMatrixWorld(true)
          const box1    = new THREE.Box3().setFromObject(model)
          const center1 = box1.getCenter(new THREE.Vector3())
          // Shift crown tip to local y=0
          const crownY  = isLower ? box1.max.y : box1.min.y
          model.position.set(-center1.x, -crownY, -center1.z)

          // Face arch center (single rotation, no conflict)
          const faceGroup = new THREE.Group()
          faceGroup.add(model)
          faceGroup.rotation.y = Math.PI

          const pivot = new THREE.Group()
          pivot.add(faceGroup)
          if (mirrorX) pivot.scale.x = -1

          // Clone materials with DoubleSide
          const mats: THREE.MeshStandardMaterial[] = []
          const origColors: number[][] = []
          model.traverse(child => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              mesh.castShadow = true; mesh.receiveShadow = true
              const cloneMat = (m: THREE.Material): THREE.MeshStandardMaterial => {
                const cl = m.clone() as THREE.MeshStandardMaterial
                cl.side = THREE.DoubleSide
                const col = cl.color ?? new THREE.Color(1, 1, 1)
                origColors.push([col.r, col.g, col.b]); mats.push(cl); return cl
              }
              if (Array.isArray(mesh.material)) { mesh.material = mesh.material.map(cloneMat) }
              else { mesh.material = cloneMat(mesh.material) }
            }
          })

          const posGroup = new THREE.Group()
          posGroup.add(pivot)
          posGroup.position.set(posX, yBase, posZ)
          posGroup.rotation.y = rotY
          // Route into teeth-only flip group (NOT directly into jaw group)
          if (isLower) { lowerTeethFlip.add(posGroup) } else { upperTeethFlip.add(posGroup) }

          registerTooth(num, posGroup, mats, origColors)
        }

        if (glbCache[file]) { buildFromGltfScene(glbCache[file]); return }
        if (!GLTFLoaderClass) { placeFallback(num, posX, yBase, posZ, rotY, isLower); return }
        const loader = new GLTFLoaderClass()
        loader.load(
          file,
          (gltf: any) => { if (!cancelled) { glbCache[file] = gltf.scene; buildFromGltfScene(gltf.scene) } },
          undefined,
          () => { if (!cancelled) placeFallback(num, posX, yBase, posZ, rotY, isLower) },
        )
      }

      // Place all 32 teeth
      UPPER_TEETH.forEach((num, i) => placeTooth(num, 5.0, 3.8,  JAW_Y, i))
      ;[...LOWER_TEETH].reverse().forEach((num, i) => placeTooth(num, 5.0, 3.8, -JAW_Y, i))

      sceneRef.current = {
        applyTint,
        resetAll: () => Object.keys(toothMap).forEach(k => applyTint(parseInt(k), 'healthy')),
      }

      // ── Raycaster ────────────────────────────────────────────────────────────
      const raycaster = new THREE.Raycaster()
      const mouse = new THREE.Vector2()
      let hoveredNum: number | null = null
      let dragMoved = false

      const onMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect()
        mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1
        mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
        raycaster.setFromCamera(mouse, camera)
        const hits = raycaster.intersectObjects(clickTargets, true)
        const n = hits.length ? (hits[0].object.userData.toothNum as number) : null
        if (n !== hoveredNum) { hoveredNum = n; if (!cancelled) setHovered(n); canvas.style.cursor = n ? 'pointer' : 'default' }
      }

      const onClick = (e: MouseEvent) => {
        if (dragMoved) return
        const rect = canvas.getBoundingClientRect()
        mouse.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1
        mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1
        raycaster.setFromCamera(mouse, camera)
        const hits = raycaster.intersectObjects(clickTargets, true)
        if (hits.length) {
          const num = hits[0].object.userData.toothNum as number
          const existing = teeth.get(num)
          setSelected(num)
          setEditForm({ label: existing?.label || '', condition: existing?.condition || 'healthy', notes: existing?.notes || '', imageUrl: existing?.imageUrl || '' })
          setEditDialog(true)
          autoRotate = false; setTimeout(() => { autoRotate = true }, 5000)
        }
      }

      canvas.addEventListener('mousemove', onMouseMove)
      canvas.addEventListener('click', onClick)

      // ── Orbit drag ───────────────────────────────────────────────────────────
      let isDragging = false
      let lastX = 0, lastY = 0
      let rotY = 0, rotX = 0.28
      let autoRotate = true
      let zoomDist = 18

      const onMouseDown  = (e: MouseEvent) => { isDragging = true; dragMoved = false; lastX = e.clientX; lastY = e.clientY; autoRotate = false }
      const onMouseUp    = () => { isDragging = false; setTimeout(() => { autoRotate = true }, 4000) }
      const onMouseDrag  = (e: MouseEvent) => {
        if (!isDragging) return
        const dx = e.clientX - lastX, dy = e.clientY - lastY
        if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true
        rotY += dx * 0.007; rotX = Math.max(-0.55, Math.min(0.55, rotX + dy * 0.004))
        lastX = e.clientX; lastY = e.clientY
      }
      const onWheel = (e: WheelEvent) => { zoomDist = Math.max(8, Math.min(40, zoomDist + e.deltaY * 0.02)); zoomRef.current = zoomDist }
      canvas.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mouseup', onMouseUp)
      window.addEventListener('mousemove', onMouseDrag)
      canvas.addEventListener('wheel', onWheel, { passive: true })

      let lastTX = 0
      const onTouchStart = (e: TouchEvent) => { lastTX = e.touches[0].clientX; autoRotate = false }
      const onTouchMove  = (e: TouchEvent) => { rotY += (e.touches[0].clientX - lastTX) * 0.007; lastTX = e.touches[0].clientX; e.preventDefault() }
      const onTouchEnd   = () => setTimeout(() => { autoRotate = true }, 4000)
      canvas.addEventListener('touchstart', onTouchStart)
      canvas.addEventListener('touchmove', onTouchMove, { passive: false })
      canvas.addEventListener('touchend', onTouchEnd)

      // ── Resize ───────────────────────────────────────────────────────────────
      const resize = () => {
        const w = canvas.clientWidth, h = canvas.clientHeight
        renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix()
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(canvas)

      // ── Label projection ─────────────────────────────────────────────────────
      const updateLabels = () => {
        const w = canvas.clientWidth, h = canvas.clientHeight
        const labels: typeof labelPositions = []
        ;[...UPPER_TEETH, ...LOWER_TEETH].forEach(num => {
          const data = toothMap[num]; if (!data) return
          const wp = new THREE.Vector3(); data.group.getWorldPosition(wp)
          const pr = wp.clone().project(camera)
          const x = (pr.x * 0.5 + 0.5) * w, y = (-pr.y * 0.5 + 0.5) * h
          if (pr.z < 1 && x > 5 && x < w - 5 && y > 5 && y < h - 5) labels.push({ num, x, y, visible: true })
        })
        if (!cancelled) setLabelPositions(labels)
      }

      // ── Animate ──────────────────────────────────────────────────────────────
      let tt = 0, animId: number
      const animate = () => {
        animId = requestAnimationFrame(animate)
        tt += 0.006
        if (autoRotate) rotY += 0.004
        scene.rotation.y = rotY
        scene.rotation.x = rotX + Math.sin(tt * 0.2) * 0.012
        // Sync zoom from zoomRef (buttons) or local zoomDist (wheel)
        zoomDist = zoomRef.current
        camera.position.z = zoomDist
        // Gum visibility
        if (upperGumRef.current) upperGumRef.current.visible = ctrlRef.current.showGums
        if (lowerGumRef.current) lowerGumRef.current.visible = ctrlRef.current.showGums

        const c = ctrlRef.current

        // Jaw rotation (pitch + roll)
        if (upperGroupRef.current) { upperGroupRef.current.rotation.x = c.upperRotX; upperGroupRef.current.rotation.z = c.upperRotZ }
        if (lowerGroupRef.current) { lowerGroupRef.current.rotation.x = c.lowerRotX; lowerGroupRef.current.rotation.z = c.lowerRotZ }

        // Jaw Y offset from jawOffset slider
        if (upperGroupRef.current) upperGroupRef.current.position.y =  c.jawOffset - 1.2
        if (lowerGroupRef.current) lowerGroupRef.current.position.y  = -(c.jawOffset - 1.2)

        // Crown flip on teeth-only groups
        // When scale.y=-1, all posGroups (at ±JAW_Y) mirror to ∓JAW_Y.
        // Compensate with position.y = ±2*JAW_Y so they stay in place.
        if (upperTeethFlipRef.current) {
          upperTeethFlipRef.current.scale.y    = c.flipUpper ? -1 : 1
          upperTeethFlipRef.current.position.y = c.flipUpper ?  2 * c.jawOffset : 0
        }
        if (lowerTeethFlipRef.current) {
          lowerTeethFlipRef.current.scale.y    = c.flipLower ? -1 : 1
          lowerTeethFlipRef.current.position.y = c.flipLower ? -2 * c.jawOffset : 0
        }

        renderer.render(scene, camera)
        updateLabels()
      }
      animate()

      // ── Cleanup ──────────────────────────────────────────────────────────────
      ;(canvas as any).__cleanup3D = () => {
        cancelled = true
        cancelAnimationFrame(animId)
        canvas.removeEventListener('mousemove', onMouseMove)
        canvas.removeEventListener('click', onClick)
        canvas.removeEventListener('mousedown', onMouseDown)
        canvas.removeEventListener('wheel', onWheel)
        canvas.removeEventListener('touchstart', onTouchStart)
        canvas.removeEventListener('touchmove', onTouchMove)
        canvas.removeEventListener('touchend', onTouchEnd)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('mousemove', onMouseDrag)
        ro.disconnect()
        renderer.dispose()
        sceneRef.current = null
      }
    })()

    return () => { cancelled = true; const c = (canvas as any).__cleanup3D; if (c) c() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const syncTo3D = useCallback((num: number, condition: string) => { sceneRef.current?.applyTint(num, condition) }, [])

  const openEditDialog = (num: number) => {
    const existing = teeth.get(num)
    setSelected(num)
    setEditForm({ label: existing?.label || '', condition: existing?.condition || 'healthy', notes: existing?.notes || '', imageUrl: existing?.imageUrl || '' })
    setEditDialog(true)
  }

  const handleSaveEdit = () => {
    if (selected === null) return
    const condStyle = getCondStyle(editForm.condition)
    setTeeth(prev => { const next = new Map(prev); next.set(selected, { toothNumber: selected, label: editForm.label, condition: editForm.condition, notes: editForm.notes, color: condStyle.accent, imageUrl: editForm.imageUrl }); return next })
    syncTo3D(selected, editForm.condition)
    setEditDialog(false)
    toast.success(`Tooth #${selected} updated`)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingImg(true)
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) { toast.error(data.error.message); return }
      setEditForm(p => ({ ...p, imageUrl: data.secure_url })); toast.success('X-ray uploaded!')
    } catch { toast.error('Upload failed') } finally { setUploadingImg(false) }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try { await onSave(Array.from(teeth.values())); toast.success('Teeth chart saved!') }
    catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  const handleReset = () => { setTeeth(new Map()); sceneRef.current?.resetAll(); toast.success('Chart reset') }

  const conditionCounts = CONDITIONS.map(c => ({ ...c, count: Array.from(teeth.values()).filter(t => t.condition === c.value).length })).filter(c => c.count > 0)

  const ToothSVG = ({ num, row }: { num: number; row: 'upper' | 'lower' }) => {
    const tooth = teeth.get(num); const cond = tooth ? getCondStyle(tooth.condition) : CONDITIONS[0]
    const hasData = teeth.has(num), isUpper = row === 'upper', isMissing = tooth?.condition === 'missing', isSelected = selected === num
    return (
      <Box onClick={() => openEditDialog(num)} title={`#${num} ${FULL_NAMES[num]}`}
        sx={{ display: 'flex', flexDirection: isUpper ? 'column-reverse' : 'column', alignItems: 'center', cursor: 'pointer', mx: '1px',
          '&:hover .tbody': { transform: isUpper ? 'translateY(-4px)' : 'translateY(4px)', filter: 'brightness(0.88)' } }}>
        <Typography sx={{ fontSize: '9px', lineHeight: 1, my: 0.3, fontWeight: hasData ? 700 : 400, color: hasData ? cond.accent : 'text.secondary' }}>{num}</Typography>
        <Box className="tbody" sx={{ width: 26, height: 38, transition: 'all 0.15s ease' }}>
          <svg width="28" height="42" viewBox="0 0 28 42" style={{ display: 'block' }}>
            {isUpper ? <rect x="10" y="30" width="8" height="10" rx="2" fill={hasData ? cond.accent : '#D4C5A9'} opacity="0.45" />
                     : <rect x="10" y="2"  width="8" height="10" rx="2" fill={hasData ? cond.accent : '#D4C5A9'} opacity="0.45" />}
            {isMissing ? (<>
              <path d={isUpper ? 'M4,7 Q14,3 24,7 L25,28 Q14,34 3,28 Z' : 'M3,10 Q14,5 25,10 L25,30 Q14,36 3,30 Z'} fill="#e0e0e0" stroke="#bdbdbd" strokeWidth="1" opacity="0.5" />
              <line x1="9" y1="13" x2="19" y2="27" stroke="#9E9E9E" strokeWidth="1.8" /><line x1="19" y1="13" x2="9" y2="27" stroke="#9E9E9E" strokeWidth="1.8" />
            </>) : (
              <path d={isUpper ? 'M4,7 Q14,3 24,7 L25,28 Q14,34 3,28 Z' : 'M3,10 Q14,5 25,10 L25,30 Q14,36 3,30 Z'}
                fill={hasData ? cond.accent : '#F5EFE6'} stroke={hasData ? cond.accent : '#C4B49A'}
                strokeWidth={isSelected ? 2.5 : 1} style={{ filter: isSelected ? `drop-shadow(0 0 4px ${cond.accent}88)` : 'none' }} />
            )}
            {!isMissing && getToothType(num) === 'molar' && (<>
              <line x1="14" y1="13" x2="14" y2="26" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
              <line x1="9"  y1="18" x2="19" y2="18" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
            </>)}
            {tooth?.label && !isMissing && <circle cx="22" cy="9" r="4" fill="#0A6EBD" />}
          </svg>
        </Box>
        {hasData && !isMissing && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cond.accent, my: 0.2 }} />}
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
              {hovered ? `#${hovered} — ${FULL_NAMES[hovered]}` : '2D chart + 3D jaw with real tooth models'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RestartAlt />} onClick={handleReset} color="error" size="small">Reset</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveAll} disabled={saving} size="small" sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)' }}>
            {saving ? 'Saving...' : 'Save Chart'}
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="2D Chart"    icon={<GridOn sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="3D Full Jaw" icon={<ThreeDRotation sx={{ fontSize: 18 }} />} iconPosition="start" />
      </Tabs>

      {/* ── TAB 0 ── */}
      {tab === 0 && (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
            {CONDITIONS.map(c => <Chip key={c.value} label={c.label} size="small" sx={{ bgcolor: c.bg, color: c.accent, fontWeight: 600, fontSize: '0.7rem', border: '1px solid', borderColor: `${c.accent}40` }} />)}
          </Box>
          <Paper elevation={0} sx={{ bgcolor: '#F8FAFF', border: '2px solid', borderColor: 'primary.light', borderRadius: 3, p: 3, position: 'relative', overflow: 'hidden',
            '&::before': { content: '"UPPER (Maxillary)"', position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 700, color: '#0A6EBD', opacity: 0.6, letterSpacing: 1.5 },
            '&::after':  { content: '"LOWER (Mandibular)"', position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 700, color: '#0A6EBD', opacity: 0.6, letterSpacing: 1.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '9px', fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>RIGHT</Typography>
              <Typography sx={{ fontSize: '9px', fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>LEFT</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5, mt: 1.5 }}>{UPPER_TEETH.map(n => <ToothSVG key={n} num={n} row="upper" />)}</Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
              <Typography sx={{ fontSize: '9px', color: 'text.secondary', fontWeight: 600, letterSpacing: 1 }}>MIDLINE</Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>{LOWER_TEETH.map(n => <ToothSVG key={n} num={n} row="lower" />)}</Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography sx={{ fontSize: '9px', fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>RIGHT</Typography>
              <Typography sx={{ fontSize: '9px', fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>LEFT</Typography>
            </Box>
          </Paper>
          {conditionCounts.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>Chart Summary</Typography>
              <Grid container spacing={1}>{conditionCounts.map(c => <Grid item key={c.value}><Chip label={`${c.label}: ${c.count}`} size="small" sx={{ bgcolor: c.bg, color: c.accent, fontWeight: 600, border: '1px solid', borderColor: `${c.accent}40` }} /></Grid>)}</Grid>
            </Box>
          )}
        </>
      )}

      {/* ── TAB 1 ── */}
      {tab === 1 && (
        <Box>
          {!isSceneReady && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Loading tooth models… {loadedCount}/32</Typography>
                <Typography variant="caption" color="primary.main" fontWeight={700}>{loadingProgress}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={loadingProgress} sx={{ borderRadius: 1, height: 6 }} />
            </Box>
          )}

          {/* ── Adjustment Panel ── */}
          <Box sx={{ mb: 1.5, p: 2, bgcolor: '#0d1b2e', border: '1px solid rgba(100,160,255,0.15)', borderRadius: 2, userSelect: 'none' }}>

            {/* Header row: title + zoom buttons + show gums toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Typography sx={{ color: '#00d4ff', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                3D Adjustment Panel
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                {/* Zoom buttons */}
                {[{ label: '−', delta: 2 }, { label: '+', delta: -2 }].map(({ label, delta }) => (
                  <Box key={label} component="button"
                    onClick={() => { zoomRef.current = Math.max(8, Math.min(40, zoomRef.current + delta)) }}
                    sx={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: 'transparent', border: '1px solid rgba(100,160,255,0.25)', borderRadius: 1,
                      color: '#00d4ff', fontSize: '16px', fontFamily: 'monospace', cursor: 'pointer', lineHeight: 1,
                      '&:hover': { bgcolor: 'rgba(0,212,255,0.1)', borderColor: '#00d4ff' } }}>
                    {label}
                  </Box>
                ))}
                <Typography sx={{ color: '#4a6080', fontSize: '10px', fontFamily: 'monospace', mx: 0.5 }}>zoom</Typography>

                {/* Show/Hide Gums toggle */}
                <Box component="button"
                  onClick={() => {
                    ctrlRef.current = { ...ctrlRef.current, showGums: !ctrlRef.current.showGums }
                    setCtrl({ ...ctrlRef.current })
                  }}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.4,
                    bgcolor: ctrl.showGums ? 'rgba(200,80,112,0.15)' : 'transparent',
                    border: '1px solid', borderColor: ctrl.showGums ? 'rgba(200,80,112,0.5)' : 'rgba(100,160,255,0.2)',
                    borderRadius: 1, cursor: 'pointer', transition: 'all 0.15s',
                    '&:hover': { bgcolor: 'rgba(200,80,112,0.1)' } }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ctrl.showGums ? '#c85070' : '#4a6080', flexShrink: 0 }} />
                  <Typography sx={{ color: ctrl.showGums ? '#c85070' : '#4a6080', fontSize: '10px', fontFamily: 'monospace' }}>
                    {ctrl.showGums ? 'Gums ON' : 'Gums OFF'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>

              {/* Gum controls — only shown when gums are visible */}
              <Box sx={{ opacity: ctrl.showGums ? 1 : 0.3, pointerEvents: ctrl.showGums ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                <Typography sx={{ color: '#c85070', fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.08em', mb: 1, textTransform: 'uppercase' }}>Gum Controls</Typography>
                {([
                  { key: 'jawOffset', label: 'Jaw Gap',       min: 0,   max: 3,   step: 0.05 },
                  { key: 'crownLen',  label: 'Gum Height',    min: 0.2, max: 2.5, step: 0.05 },
                  { key: 'gumZBack',  label: 'Gum Depth',     min: -1,  max: 2.5, step: 0.05 },
                  { key: 'gumRadius', label: 'Gum Thickness', min: 0.1, max: 1.2, step: 0.05 },
                ] as const).map(({ key, label, min, max, step }) => (
                  <Box key={key} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                      <Typography sx={{ color: '#8ba0bf', fontSize: '10px', fontFamily: 'monospace' }}>{label}</Typography>
                      <Typography sx={{ color: '#00d4ff', fontSize: '10px', fontFamily: 'monospace', minWidth: 32, textAlign: 'right' }}>
                        {(ctrl[key] as number).toFixed(2)}
                      </Typography>
                    </Box>
                    <input type="range" min={min} max={max} step={step} value={ctrl[key] as number}
                      style={{ width: '100%', accentColor: '#c85070', cursor: 'pointer', height: 4 }}
                      onChange={e => {
                        ctrlRef.current = { ...ctrlRef.current, [key]: parseFloat(e.target.value) }
                        setCtrl({ ...ctrlRef.current })
                        ;(sceneRef as any)._rebuildGums?.()
                      }} />
                  </Box>
                ))}
              </Box>

              {/* Jaw rotation + crown flip */}
              <Box>
                <Typography sx={{ color: '#3b8eff', fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.08em', mb: 1, textTransform: 'uppercase' }}>Jaw Rotation</Typography>
                {([
                  { key: 'upperRotX', label: 'Upper Pitch', color: '#3b8eff' },
                  { key: 'upperRotZ', label: 'Upper Roll',  color: '#3b8eff' },
                  { key: 'lowerRotX', label: 'Lower Pitch', color: '#00e5c0' },
                  { key: 'lowerRotZ', label: 'Lower Roll',  color: '#00e5c0' },
                ] as const).map(({ key, label, color }) => (
                  <Box key={key} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                      <Typography sx={{ color: '#8ba0bf', fontSize: '10px', fontFamily: 'monospace' }}>{label}</Typography>
                      <Typography sx={{ color, fontSize: '10px', fontFamily: 'monospace', minWidth: 42, textAlign: 'right' }}>
                        {((ctrl[key] as number) * 180 / Math.PI).toFixed(1)}°
                      </Typography>
                    </Box>
                    <input type="range" min={-0.5} max={0.5} step={0.01} value={ctrl[key] as number}
                      style={{ width: '100%', accentColor: color, cursor: 'pointer', height: 4 }}
                      onChange={e => { ctrlRef.current = { ...ctrlRef.current, [key]: parseFloat(e.target.value) }; setCtrl({ ...ctrlRef.current }) }} />
                  </Box>
                ))}
                <Box component="button"
                  onClick={() => { ctrlRef.current = { ...ctrlRef.current, upperRotX: 0, upperRotZ: 0, lowerRotX: 0, lowerRotZ: 0 }; setCtrl({ ...ctrlRef.current }) }}
                  sx={{ mt: 0.5, width: '100%', py: 0.5, bgcolor: 'transparent', border: '1px solid rgba(100,160,255,0.2)', borderRadius: 1, color: '#8ba0bf', fontSize: '10px', fontFamily: 'monospace', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(100,160,255,0.08)', color: '#fff' } }}>
                  Reset Rotations
                </Box>
                <Typography sx={{ color: '#ffb340', fontSize: '10px', fontFamily: 'monospace', letterSpacing: '0.08em', mt: 1.5, mb: 0.8, textTransform: 'uppercase' }}>Crown Direction</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                  {([
                    { key: 'flipUpper', jaw: 'Upper (1–16)' },
                    { key: 'flipLower', jaw: 'Lower (17–32)' },
                  ] as const).map(({ key, jaw }) => {
                    const isFlipped = ctrl[key] as boolean
                    return (
                      <Box key={key} component="button"
                        onClick={() => { ctrlRef.current = { ...ctrlRef.current, [key]: !isFlipped }; setCtrl({ ...ctrlRef.current }) }}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.2, py: 0.6,
                          bgcolor: isFlipped ? 'rgba(255,179,64,0.15)' : 'transparent',
                          border: '1px solid', borderColor: isFlipped ? 'rgba(255,179,64,0.5)' : 'rgba(100,160,255,0.2)',
                          borderRadius: 1, cursor: 'pointer', transition: 'all 0.15s',
                          '&:hover': { bgcolor: 'rgba(255,179,64,0.1)' } }}>
                        <Typography sx={{ color: isFlipped ? '#ffb340' : '#8ba0bf', fontSize: '10px', fontFamily: 'monospace' }}>{jaw}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography sx={{ color: isFlipped ? '#ffb340' : '#4a6080', fontSize: '9px', fontFamily: 'monospace' }}>
                            {isFlipped ? 'FLIPPED ↕' : 'NORMAL ↑↓'}
                          </Typography>
                          <Box sx={{ width: 28, height: 14, borderRadius: 7, bgcolor: isFlipped ? '#ffb340' : 'rgba(100,160,255,0.15)', border: '1px solid', borderColor: isFlipped ? '#ffb340' : 'rgba(100,160,255,0.3)', position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}>
                            <Box sx={{ position: 'absolute', top: 2, left: isFlipped ? 14 : 2, width: 8, height: 8, borderRadius: '50%', bgcolor: isFlipped ? '#0d1b2e' : '#4a6080', transition: 'left 0.2s' }} />
                          </Box>
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Canvas */}
          <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', border: '2px solid', borderColor: isSceneReady ? 'success.light' : 'primary.light' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '480px', display: 'block' }} />

            {/* Floating tooth labels */}
            <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              {isSceneReady && labelPositions.map(({ num, x, y }) => {
                const tooth = teeth.get(num); const cond = tooth ? getCondStyle(tooth.condition) : null; const hasData = !!tooth
                return (
                  <Box key={num} sx={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -110%)', pointerEvents: 'none' }}>
                    <Box sx={{ bgcolor: hasData ? cond!.accent : 'rgba(0,0,0,0.6)', color: 'white', borderRadius: 0.8, px: 0.6, py: 0.15, fontSize: '9px', fontWeight: 700, lineHeight: 1.4, whiteSpace: 'nowrap', textAlign: 'center', border: hasData ? `1px solid ${cond!.accent}` : '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(2px)' }}>
                      #{num}
                      {tooth?.label && <Box component="span" sx={{ display: 'block', fontSize: '8px', opacity: 0.9, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tooth.label.slice(0, 8)}</Box>}
                    </Box>
                    <Box sx={{ width: '1px', height: '5px', bgcolor: hasData ? cond!.accent : 'rgba(255,255,255,0.4)', mx: 'auto' }} />
                  </Box>
                )
              })}
            </Box>

            {/* Loading overlay */}
            {!isSceneReady && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(13,27,46,0.88)', zIndex: 5 }}>
                <CircularProgress sx={{ color: '#00B4D8', mb: 2 }} size={40} />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Loading {loadedCount}/32 tooth models…</Typography>
              </Box>
            )}

            <Box sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 1.5, px: 1.5, py: 0.75 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', letterSpacing: 1 }}>UPPER</Typography>
            </Box>
            <Box sx={{ position: 'absolute', bottom: 12, left: 12, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 1.5, px: 1.5, py: 0.75 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', letterSpacing: 1 }}>LOWER</Typography>
            </Box>
            <Box sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 1.5, px: 1.5, py: 0.75 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>Drag · Scroll · Click tooth</Typography>
            </Box>
            {isSceneReady && (
              <Box sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 1.5, px: 1.5, py: 0.75 }}>
                <Typography sx={{ color: '#4CAF50', fontSize: '10px', fontWeight: 700 }}>32 teeth loaded ✓</Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1.5 }}>
            {CONDITIONS.map(c => <Chip key={c.value} label={c.label} size="small" sx={{ bgcolor: c.bg, color: c.accent, fontWeight: 600, fontSize: '0.7rem', border: '1px solid', borderColor: `${c.accent}40` }} />)}
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, opacity: 0.55 }}>
            3D models: University of Dundee, School of Dentistry (@DundeeDental) · CC Attribution
          </Typography>
        </Box>
      )}

      {/* Tooth Records */}
      {teeth.size > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1}>Tooth Records ({teeth.size})</Typography>
          <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            {Array.from(teeth.values()).sort((a, b) => a.toothNumber - b.toothNumber).map((t, i) => {
              const cond = getCondStyle(t.condition)
              return (
                <Box key={t.toothNumber} onClick={() => openEditDialog(t.toothNumber)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5, borderBottom: i < teeth.size - 1 ? '1px solid' : 'none', borderColor: 'divider', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: cond.bg, border: '1px solid', borderColor: cond.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: cond.accent, fontSize: '10px' }}>{t.toothNumber}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{FULL_NAMES[t.toothNumber]}</Typography>
                    {t.label && <Typography variant="caption" color="text.secondary">{t.label}</Typography>}
                  </Box>
                  <Chip label={cond.label} size="small" sx={{ bgcolor: cond.bg, color: cond.accent, fontWeight: 600, fontSize: '0.7rem' }} />
                  {t.imageUrl && <Visibility sx={{ fontSize: 16, color: 'text.secondary' }} />}
                </Box>
              )
            })}
          </Box>
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Tooth #{selected}</Typography>
            {selected && <Typography variant="body2" color="text.secondary">{FULL_NAMES[selected]}</Typography>}
          </Box>
          <IconButton onClick={() => setEditDialog(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Label / Note" multiline rows={2} placeholder="e.g. Decay on buccal surface…" value={editForm.label} onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select value={editForm.condition} label="Condition" onChange={e => setEditForm(p => ({ ...p, condition: e.target.value }))} sx={{ borderRadius: 2.5 }}>
                  {CONDITIONS.map(c => (
                    <MenuItem key={c.value} value={c.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: c.accent }} />{c.label}</Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Clinical Notes" multiline rows={3} placeholder="Detailed clinical observations…" value={editForm.notes} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>X-Ray / Image</Typography>
              {editForm.imageUrl ? (
                <Box>
                  <Box component="img" src={editForm.imageUrl} alt="xray" sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} />
                  <Button size="small" sx={{ mt: 1 }} onClick={() => setEditForm(p => ({ ...p, imageUrl: '' }))}>Remove</Button>
                </Box>
              ) : (
                <label htmlFor="xray-upload-3d">
                  <input id="xray-upload-3d" type="file" accept="image/*" hidden onChange={handleImageUpload} />
                  <Button component="span" variant="outlined" startIcon={<Upload />} disabled={uploadingImg} size="small">
                    {uploadingImg ? 'Uploading…' : 'Upload X-Ray Image'}
                  </Button>
                </label>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditDialog(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)' }}>
            Save & Apply to 3D
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}