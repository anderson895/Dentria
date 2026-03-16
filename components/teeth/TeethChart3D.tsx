'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
// GLTFLoader imported dynamically to support multiple three.js versions
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

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Constants ─────────────────────────────────────────────────────────────────
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

// GLB file per tooth number
// Upper-right teeth (1-8) are mirrored from upper-left models
// Lower-right teeth (25-32) are mirrored from lower-left models
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
  17: { file: '/teeth/md-3rd-molar.glb',        mirrorX: false, isLower: true  },
  18: { file: '/teeth/md-2nd-molar.glb',        mirrorX: false, isLower: true  },
  19: { file: '/teeth/md-1st-molar.glb',        mirrorX: false, isLower: true  },
  20: { file: '/teeth/md-2nd-premolar.glb',     mirrorX: false, isLower: true  },
  21: { file: '/teeth/md-1st-premolar.glb',     mirrorX: false, isLower: true  },
  22: { file: '/teeth/md-canine.glb',           mirrorX: false, isLower: true  },
  23: { file: '/teeth/md-lateral-incisor.glb',  mirrorX: false, isLower: true  },
  24: { file: '/teeth/md-central-incisor.glb',  mirrorX: false, isLower: true  },
  25: { file: '/teeth/md-central-incisor.glb',  mirrorX: true,  isLower: true  },
  26: { file: '/teeth/md-lateral-incisor.glb',  mirrorX: true,  isLower: true  },
  27: { file: '/teeth/md-canine.glb',           mirrorX: true,  isLower: true  },
  28: { file: '/teeth/md-1st-premolar.glb',     mirrorX: true,  isLower: true  },
  29: { file: '/teeth/md-2nd-premolar.glb',     mirrorX: true,  isLower: true  },
  30: { file: '/teeth/md-1st-molar.glb',        mirrorX: true,  isLower: true  },
  31: { file: '/teeth/md-2nd-molar.glb',        mirrorX: true,  isLower: true  },
  32: { file: '/teeth/md-3rd-molar.glb',        mirrorX: true,  isLower: true  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCondStyle(condition: string) {
  return CONDITIONS.find(c => c.value === condition) || CONDITIONS[0]
}

function getToothType(n: number) {
  if ([1,2,3,14,15,16,17,18,19,30,31,32].includes(n)) return 'molar'
  if ([4,5,12,13,20,21,28,29].includes(n)) return 'premolar'
  if ([6,11,22,27].includes(n)) return 'canine'
  return 'incisor'
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TeethChart3D({ patientId, initialTeeth, onSave }: TeethChart3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<{
    applyTint: (num: number, condition: string) => void
    resetAll: () => void
  } | null>(null)

  const [teeth, setTeeth] = useState<Map<number, ToothRecord>>(() => {
    const map = new Map<number, ToothRecord>()
    initialTeeth.forEach(t => map.set(t.toothNumber, t))
    return map
  })
  const [selected, setSelected] = useState<number | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [editForm, setEditForm] = useState({ label: '', condition: 'healthy', notes: '', imageUrl: '' })
  const [uploadingImg, setUploadingImg] = useState(false)
  const [tab, setTab] = useState(0)
  const [loadedCount, setLoadedCount] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isSceneReady, setIsSceneReady] = useState(false)
  const [labelPositions, setLabelPositions] = useState<Array<{
    num: number; x: number; y: number; visible: boolean
  }>>([])

  // ── Build the Three.js scene ─────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 1 || !canvasRef.current) return

    const canvas = canvasRef.current

    // ── Renderer ────────────────────────────────────────────────────────────
    // Dynamically load GLTFLoader to handle any three.js version
    let GLTFLoader: any = null
    const loadGLTF = async () => {
      try {
        // Try new path first (three r152+)
        const mod = await import('three/addons/loaders/GLTFLoader.js' as any)
        GLTFLoader = mod.GLTFLoader
      } catch {
        try {
          // Fallback to old path (three r128-r151)
          const mod = await import('three/examples/jsm/loaders/GLTFLoader' as any)
          GLTFLoader = mod.GLTFLoader
        } catch {
          GLTFLoader = null
        }
      }
    }
    loadGLTF()

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    // Set color space for newer three.js (r152+)
    if ((THREE as any).SRGBColorSpace !== undefined) {
      (renderer as any).outputColorSpace = (THREE as any).SRGBColorSpace
    }

    // ── Scene & Camera ───────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0d1b2e)
    scene.fog = new THREE.FogExp2(0x0d1b2e, 0.022)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 200)
    camera.position.set(0, 5, 20)
    camera.lookAt(0, 0, 5)

    // ── Lights ───────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xfff5e0, 0.6))

    const keyLight = new THREE.DirectionalLight(0xfffaf0, 2.0)
    keyLight.position.set(5, 14, 10)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 60
    keyLight.shadow.camera.left = -15
    keyLight.shadow.camera.right = 15
    keyLight.shadow.camera.top = 15
    keyLight.shadow.camera.bottom = -15
    keyLight.shadow.bias = -0.001
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x6699ff, 0.5)
    rimLight.position.set(-6, 2, -6)
    scene.add(rimLight)

    const fillLight = new THREE.PointLight(0xfff0cc, 0.8, 40)
    fillLight.position.set(0, 8, 8)
    scene.add(fillLight)

    // ── Gum arches ───────────────────────────────────────────────────────────
    const gumMat = new THREE.MeshPhysicalMaterial({
      color: 0xc85070,
      roughness: 0.8,
      metalness: 0,
    })

    const buildGumArch = (arcR: number, yPos: number) => {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 40; i++) {
        const t = i / 40
        const angle = (t - 0.5) * Math.PI * 0.95
        pts.push(new THREE.Vector3(
          arcR * Math.sin(angle),
          0,
          -arcR * Math.cos(angle) + arcR,
        ))
      }
      const curve = new THREE.CatmullRomCurve3(pts)
      const geo = new THREE.TubeGeometry(curve, 60, 0.52, 8, false)
      const mesh = new THREE.Mesh(geo, gumMat.clone())
      mesh.position.y = yPos
      mesh.castShadow = true
      scene.add(mesh)
    }

    buildGumArch(5.0, 0.4)    // upper gum
    buildGumArch(4.6, -0.4)   // lower gum

    // ── Tooth mesh storage ────────────────────────────────────────────────────
    const toothMap: Record<number, {
      group: THREE.Group | THREE.Mesh
      materials: THREE.Material[]
      originalColors: number[][]
    }> = {}
    const clickTargets: THREE.Object3D[] = []
    const glbCache: Record<string, THREE.Group> = {}
    let totalLoaded = 0
    const TOTAL = 32

    // ── Apply condition tint ──────────────────────────────────────────────────
    const applyTint = (num: number, condition: string) => {
      const data = toothMap[num]
      if (!data) return
      const cond = getCondStyle(condition)

      if (condition === 'missing') {
        data.group.visible = false
        return
      }

      data.group.visible = true

      if (condition === 'healthy') {
        // Restore original colors
        data.materials.forEach((mat, i) => {
          const m = mat as THREE.MeshStandardMaterial
          if (data.originalColors[i]) {
            m.color.setRGB(
              data.originalColors[i][0],
              data.originalColors[i][1],
              data.originalColors[i][2],
            )
          }
        })
      } else {
        data.materials.forEach((mat) => {
          const m = mat as THREE.MeshStandardMaterial
          m.color.setRGB(cond.rgb[0], cond.rgb[1], cond.rgb[2])
        })
      }
    }

    // ── Place a single tooth ──────────────────────────────────────────────────
    const placeTooth = (num: number, arcR: number, yBase: number, arcIdx: number) => {
      const { file, mirrorX, isLower } = GLB_MAP[num]
      const condData = teeth.get(num)
      const cond = condData ? getCondStyle(condData.condition) : CONDITIONS[0]

      // Compute position on horseshoe arch
      // arcIdx 0 = rightmost tooth, 15 = leftmost
      const t = arcIdx / 15                          // 0..1
      const angle = (t - 0.5) * Math.PI * 0.88      // -79° to +79°
      const posX = arcR * Math.sin(angle)
      const posZ = arcR - arcR * Math.cos(angle)     // 0 at front, opens toward viewer
      // rotY: tooth faces inward toward center of arch
      const rotY = -angle

      const onLoaded = (gltfScene: THREE.Group) => {
        const group = new THREE.Group()
        const model = gltfScene.clone(true)

        // Step 1: Normalize scale so tallest dimension = 2.2 units
        const box0 = new THREE.Box3().setFromObject(model)
        const size0 = box0.getSize(new THREE.Vector3())
        const maxDim = Math.max(size0.x, size0.y, size0.z)
        const uniformScale = 2.2 / maxDim
        model.scale.setScalar(uniformScale)

        // Step 2: Re-compute bounding box after scale
        box0.setFromObject(model)
        const center0 = box0.getCenter(new THREE.Vector3())
        const min0 = box0.min

        // Step 3: Center X/Z, sit crown base at y=0 (roots hang below)
        model.position.set(
          -center0.x,
          -min0.y,   // crown bottom at y=0, roots go upward in model space
          -center0.z,
        )

        // Step 4: Upper teeth — roots should be UP (away from bite line)
        //         Lower teeth — roots should be DOWN (away from bite line)
        //         Dundee models have crown pointing UP by default,
        //         so lower teeth need 180° flip around X so crown faces down toward bite
        if (isLower) {
          // Flip upside-down: crown faces down, roots face up
          model.rotation.x = Math.PI
          // After flip, re-center so crown tip is at y=0
          const box3 = new THREE.Box3().setFromObject(model)
          model.position.y = -box3.min.y
        }

        // Step 5: Face the tooth toward center of arch
        // Dundee models face +Z by default; rotate so they face the arch center
        model.rotation.y = Math.PI

        // Step 6: Mirror right-side teeth (left/right symmetry)
        if (mirrorX) model.scale.x *= -1

        // Step 5: Collect materials for tinting
        const mats: THREE.Material[] = []
        const origColors: number[][] = []

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true
            mesh.userData.toothNum = num

            const processMat = (m: THREE.Material) => {
              const cloned = m.clone() as THREE.MeshStandardMaterial
              const col = cloned.color || new THREE.Color(1, 1, 1)
              origColors.push([col.r, col.g, col.b])
              mats.push(cloned)
              return cloned
            }

            if (Array.isArray(mesh.material)) {
              mesh.material = mesh.material.map(processMat)
            } else {
              mesh.material = processMat(mesh.material)
            }

            clickTargets.push(mesh)
          }
        })

        group.add(model)
        group.position.set(posX, yBase, posZ)
        group.rotation.y = rotY
        scene.add(group)

        toothMap[num] = { group, materials: mats, originalColors: origColors }

        // Apply initial condition
        if (condData && condData.condition !== 'healthy') {
          applyTint(num, condData.condition)
        }
        if (condData?.condition === 'missing') {
          group.visible = false
        }

        totalLoaded++
        const pct = Math.round((totalLoaded / TOTAL) * 100)
        setLoadedCount(totalLoaded)
        setLoadingProgress(pct)
        if (totalLoaded >= TOTAL) setIsSceneReady(true)
      }

      // Fallback procedural tooth if GLB not available
      const placeFallback = () => {
        const type = getToothType(num)
        const h = type === 'molar' ? 1.5 : type === 'premolar' ? 1.3 : type === 'canine' ? 1.7 : 1.2
        const w = type === 'molar' ? 1.1 : type === 'premolar' ? 0.85 : 0.72
        const geo = new THREE.CylinderGeometry(w * 0.42, w * 0.35, h, 8)
        const mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(cond.rgb[0], cond.rgb[1], cond.rgb[2]),
          roughness: 0.2,
          metalness: 0,
          clearcoat: 0.8,
        })
        const mesh = new THREE.Mesh(geo, mat)
        const yOff = isLower ? -(h / 2) : h / 2
        mesh.position.set(posX, yBase + yOff, posZ)
        mesh.rotation.y = rotY
        mesh.castShadow = true
        mesh.userData.toothNum = num
        scene.add(mesh)
        clickTargets.push(mesh)
        toothMap[num] = { group: mesh as unknown as THREE.Group, materials: [mat], originalColors: [[cond.rgb[0], cond.rgb[1], cond.rgb[2]]] }

        totalLoaded++
        setLoadedCount(totalLoaded)
        setLoadingProgress(Math.round((totalLoaded / TOTAL) * 100))
        if (totalLoaded >= TOTAL) setIsSceneReady(true)
      }

      // Load from cache or fetch
      if (glbCache[file]) {
        onLoaded(glbCache[file])
        return
      }

      if (!GLTFLoader) { placeFallback(); return }
      const loader = new (GLTFLoader as any)()
      loader.load(
        file,
        (gltf: any) => {
          glbCache[file] = gltf.scene
          onLoaded(gltf.scene)
        },
        undefined,
        () => placeFallback(),
      )
    }

    // ── Build both arches ─────────────────────────────────────────────────────
    // Upper jaw: teeth 1–16, arc index 0–15 (right to left)
    UPPER_TEETH.forEach((num, i) => placeTooth(num, 5.0, 1.2, i))

    // Lower jaw: teeth 32,31,...,17 → reversed so same arc index = same position
    const lowerOrdered = [...LOWER_TEETH].reverse() // 17,18,...,32
    lowerOrdered.forEach((num, i) => placeTooth(num, 4.6, -1.2, i))

    // ── Raycaster ─────────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let hoveredNum: number | null = null

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(clickTargets, true)
      const newHovered = hits.length ? (hits[0].object.userData.toothNum as number) : null
      if (newHovered !== hoveredNum) {
        hoveredNum = newHovered
        setHovered(newHovered)
        canvas.style.cursor = newHovered ? 'pointer' : 'default'
      }
    }

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(clickTargets, true)
      if (hits.length) {
        const num = hits[0].object.userData.toothNum as number
        const existing = teeth.get(num)
        setSelected(num)
        setEditForm({
          label: existing?.label || '',
          condition: existing?.condition || 'healthy',
          notes: existing?.notes || '',
          imageUrl: existing?.imageUrl || '',
        })
        setEditDialog(true)
        autoRotate = false
        setTimeout(() => { autoRotate = true }, 5000)
      }
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('click', onClick)

    // ── Orbit drag ────────────────────────────────────────────────────────────
    let isDragging = false
    let lastX = 0
    let lastY = 0
    let rotY = 0
    let rotX = 0.18
    let autoRotate = true
    let zoomDist = 20

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      lastX = e.clientX
      lastY = e.clientY
      autoRotate = false
    }
    const onMouseUp = () => {
      isDragging = false
      setTimeout(() => { autoRotate = true }, 4000)
    }
    const onMouseDrag = (e: MouseEvent) => {
      if (!isDragging) return
      rotY += (e.clientX - lastX) * 0.007
      rotX += (e.clientY - lastY) * 0.004
      rotX = Math.max(-0.55, Math.min(0.55, rotX))
      lastX = e.clientX
      lastY = e.clientY
    }
    const onWheel = (e: WheelEvent) => {
      zoomDist = Math.max(10, Math.min(35, zoomDist + e.deltaY * 0.02))
    }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseDrag)
    canvas.addEventListener('wheel', onWheel, { passive: true })

    // Touch support
    let lastTX = 0
    const onTouchStart = (e: TouchEvent) => { lastTX = e.touches[0].clientX; autoRotate = false }
    const onTouchMove = (e: TouchEvent) => {
      rotY += (e.touches[0].clientX - lastTX) * 0.007
      lastTX = e.touches[0].clientX
      e.preventDefault()
    }
    const onTouchEnd = () => setTimeout(() => { autoRotate = true }, 4000)
    canvas.addEventListener('touchstart', onTouchStart)
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    // ── Resize ────────────────────────────────────────────────────────────────
    const resize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // ── Floating label projection ─────────────────────────────────────────────
    const updateLabels = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const labels: typeof labelPositions = []

      ;[...UPPER_TEETH, ...LOWER_TEETH].forEach(num => {
        const data = toothMap[num]
        if (!data) return

        const worldPos = new THREE.Vector3()
        if ((data.group as THREE.Group).isGroup) {
          data.group.getWorldPosition(worldPos)
        } else {
          worldPos.copy((data.group as unknown as THREE.Mesh).position)
        }

        const projected = worldPos.clone().project(camera)
        const x = (projected.x * 0.5 + 0.5) * w
        const y = (-projected.y * 0.5 + 0.5) * h
        const visible = projected.z < 1 && x > 5 && x < w - 5 && y > 5 && y < h - 5

        if (visible) labels.push({ num, x, y, visible })
      })

      setLabelPositions(labels)
    }

    // ── Expose API ────────────────────────────────────────────────────────────
    sceneRef.current = {
      applyTint,
      resetAll: () => {
        Object.keys(toothMap).forEach(k => applyTint(parseInt(k), 'healthy'))
      },
    }

    // ── Animate ───────────────────────────────────────────────────────────────
    let t = 0
    let animId: number

    const animate = () => {
      animId = requestAnimationFrame(animate)
      t += 0.006
      if (autoRotate) rotY += 0.004
      scene.rotation.y = rotY
      scene.rotation.x = rotX + Math.sin(t * 0.2) * 0.012
      camera.position.z = zoomDist
      renderer.render(scene, camera)
      updateLabels()
    }
    animate()

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // ── Sync tooth edits to 3D scene ──────────────────────────────────────────
  const syncTo3D = useCallback((num: number, condition: string) => {
    sceneRef.current?.applyTint(num, condition)
  }, [])

  // ── Form handlers ─────────────────────────────────────────────────────────
  const openEditDialog = (num: number) => {
    const existing = teeth.get(num)
    setSelected(num)
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
    setTeeth(prev => {
      const next = new Map(prev)
      next.set(selected, {
        toothNumber: selected,
        label: editForm.label,
        condition: editForm.condition,
        notes: editForm.notes,
        color: condStyle.accent,
        imageUrl: editForm.imageUrl,
      })
      return next
    })
    syncTo3D(selected, editForm.condition)
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
        { method: 'POST', body: fd },
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
    sceneRef.current?.resetAll()
    toast.success('Chart reset')
  }

  const conditionCounts = CONDITIONS.map(c => ({
    ...c,
    count: Array.from(teeth.values()).filter(t => t.condition === c.value).length,
  })).filter(c => c.count > 0)

  // ── 2D SVG tooth ──────────────────────────────────────────────────────────
  const ToothSVG = ({ num, row }: { num: number; row: 'upper' | 'lower' }) => {
    const tooth = teeth.get(num)
    const cond = tooth ? getCondStyle(tooth.condition) : CONDITIONS[0]
    const hasData = teeth.has(num)
    const isUpper = row === 'upper'
    const isMissing = tooth?.condition === 'missing'
    const isSelected = selected === num

    return (
      <Box
        onClick={() => openEditDialog(num)}
        title={`#${num} ${FULL_NAMES[num]}${tooth?.label ? ' — ' + tooth.label : ''} · ${cond.label}`}
        sx={{
          display: 'flex',
          flexDirection: isUpper ? 'column-reverse' : 'column',
          alignItems: 'center',
          cursor: 'pointer',
          mx: '1px',
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
        }}>
          {num}
        </Typography>

        <Box className="tbody" sx={{ width: 26, height: 38, transition: 'all 0.15s ease' }}>
          <svg width="28" height="42" viewBox="0 0 28 42" style={{ display: 'block' }}>
            {/* Root */}
            {isUpper
              ? <rect x="10" y="30" width="8" height="10" rx="2" fill={hasData ? cond.accent : '#D4C5A9'} opacity="0.45" />
              : <rect x="10" y="2"  width="8" height="10" rx="2" fill={hasData ? cond.accent : '#D4C5A9'} opacity="0.45" />
            }
            {/* Crown */}
            {isMissing ? (
              <>
                <path
                  d={isUpper ? 'M4,7 Q14,3 24,7 L25,28 Q14,34 3,28 Z' : 'M3,10 Q14,5 25,10 L25,30 Q14,36 3,30 Z'}
                  fill="#e0e0e0" stroke="#bdbdbd" strokeWidth="1" opacity="0.5"
                />
                <line x1="9" y1="13" x2="19" y2="27" stroke="#9E9E9E" strokeWidth="1.8" />
                <line x1="19" y1="13" x2="9"  y2="27" stroke="#9E9E9E" strokeWidth="1.8" />
              </>
            ) : (
              <path
                d={isUpper ? 'M4,7 Q14,3 24,7 L25,28 Q14,34 3,28 Z' : 'M3,10 Q14,5 25,10 L25,30 Q14,36 3,30 Z'}
                fill={hasData ? cond.accent : '#F5EFE6'}
                stroke={hasData ? cond.accent : '#C4B49A'}
                strokeWidth={isSelected ? 2.5 : 1}
                style={{ filter: isSelected ? `drop-shadow(0 0 4px ${cond.accent}88)` : 'none' }}
              />
            )}
            {/* Molar grooves */}
            {!isMissing && getToothType(num) === 'molar' && (
              <>
                <line x1="14" y1="13" x2="14" y2="26" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                <line x1="9"  y1="18" x2="19" y2="18" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
              </>
            )}
            {/* Label dot */}
            {tooth?.label && !isMissing && (
              <circle cx="22" cy="9" r="4" fill="#0A6EBD" />
            )}
          </svg>
        </Box>

        {hasData && !isMissing && (
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cond.accent, my: 0.2 }} />
        )}
      </Box>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ── Toolbar ── */}
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
          <Button variant="outlined" startIcon={<RestartAlt />} onClick={handleReset} color="error" size="small">
            Reset
          </Button>
          <Button
            variant="contained" startIcon={<Save />} onClick={handleSaveAll} disabled={saving} size="small"
            sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)' }}
          >
            {saving ? 'Saving...' : 'Save Chart'}
          </Button>
        </Box>
      </Box>

      {/* ── Tabs ── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="2D Chart"      icon={<GridOn       sx={{ fontSize: 18 }} />} iconPosition="start" />
        <Tab label="3D Full Jaw"   icon={<ThreeDRotation sx={{ fontSize: 18 }} />} iconPosition="start" />
      </Tabs>

      {/* ══════════════════════════════════════════════════════════ TAB 0: 2D */}
      {tab === 0 && (
        <>
          {/* Legend */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
            {CONDITIONS.map(c => (
              <Chip key={c.value} label={c.label} size="small"
                sx={{ bgcolor: c.bg, color: c.accent, fontWeight: 600, fontSize: '0.7rem',
                  border: '1px solid', borderColor: `${c.accent}40` }} />
            ))}
          </Box>

          {/* Teeth grid */}
          <Paper elevation={0} sx={{
            bgcolor: '#F8FAFF', border: '2px solid', borderColor: 'primary.light',
            borderRadius: 3, p: 3, position: 'relative', overflow: 'hidden',
            '&::before': {
              content: '"UPPER (Maxillary)"', position: 'absolute',
              top: 8, left: '50%', transform: 'translateX(-50%)',
              fontSize: '10px', fontWeight: 700, color: '#0A6EBD', opacity: 0.6, letterSpacing: 1.5,
            },
            '&::after': {
              content: '"LOWER (Mandibular)"', position: 'absolute',
              bottom: 8, left: '50%', transform: 'translateX(-50%)',
              fontSize: '10px', fontWeight: 700, color: '#0A6EBD', opacity: 0.6, letterSpacing: 1.5,
            },
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

          {/* Summary */}
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

      {/* ══════════════════════════════════════════════════════════ TAB 1: 3D */}
      {tab === 1 && (
        <Box>
          {/* Loading bar */}
          {!isSceneReady && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Loading tooth models… {loadedCount}/{32}
                </Typography>
                <Typography variant="caption" color="primary.main" fontWeight={700}>
                  {loadingProgress}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={loadingProgress} sx={{ borderRadius: 1, height: 6 }} />
            </Box>
          )}

          {/* Canvas + floating labels */}
          <Box sx={{
            position: 'relative', borderRadius: 3, overflow: 'hidden',
            border: '2px solid', borderColor: isSceneReady ? 'success.light' : 'primary.light',
          }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '480px', display: 'block' }} />

            {/* Floating tooth labels overlay */}
            <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              {isSceneReady && labelPositions.map(({ num, x, y }) => {
                const tooth = teeth.get(num)
                const cond = tooth ? getCondStyle(tooth.condition) : null
                const hasData = !!tooth
                return (
                  <Box
                    key={num}
                    sx={{
                      position: 'absolute',
                      left: x, top: y,
                      transform: 'translate(-50%, -110%)',
                      pointerEvents: 'none',
                    }}
                  >
                    <Box sx={{
                      bgcolor: hasData ? cond!.accent : 'rgba(0,0,0,0.6)',
                      color: 'white',
                      borderRadius: 0.8,
                      px: 0.6, py: 0.15,
                      fontSize: '9px',
                      fontWeight: 700,
                      lineHeight: 1.4,
                      whiteSpace: 'nowrap',
                      border: hasData ? `1px solid ${cond!.accent}` : '1px solid rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(2px)',
                      textAlign: 'center',
                    }}>
                      #{num}
                      {tooth?.label && (
                        <Box component="span" sx={{ display: 'block', fontSize: '8px', opacity: 0.9, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tooth.label.slice(0, 8)}
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ width: '1px', height: '5px', bgcolor: hasData ? cond!.accent : 'rgba(255,255,255,0.4)', mx: 'auto' }} />
                  </Box>
                )
              })}
            </Box>

            {/* Loading overlay */}
            {!isSceneReady && (
              <Box sx={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                bgcolor: 'rgba(13,27,46,0.88)', zIndex: 5,
              }}>
                <CircularProgress sx={{ color: '#00B4D8', mb: 2 }} size={40} />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                  Loading {loadedCount}/32 tooth models…
                </Typography>
              </Box>
            )}

            {/* HUD labels */}
            <Box sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 1.5, px: 1.5, py: 0.75 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', letterSpacing: 1 }}>UPPER</Typography>
            </Box>
            <Box sx={{ position: 'absolute', bottom: 12, left: 12, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 1.5, px: 1.5, py: 0.75 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', letterSpacing: 1 }}>LOWER</Typography>
            </Box>
            <Box sx={{ position: 'absolute', bottom: 12, right: 12, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 1.5, px: 1.5, py: 0.75 }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>
                Drag · Scroll · Click tooth
              </Typography>
            </Box>
            {isSceneReady && (
              <Box sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(0,0,0,0.5)', borderRadius: 1.5, px: 1.5, py: 0.75 }}>
                <Typography sx={{ color: '#4CAF50', fontSize: '10px', fontWeight: 700 }}>
                  32 teeth loaded ✓
                </Typography>
              </Box>
            )}
          </Box>

          {/* Legend */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1.5 }}>
            {CONDITIONS.map(c => (
              <Chip key={c.value} label={c.label} size="small"
                sx={{ bgcolor: c.bg, color: c.accent, fontWeight: 600, fontSize: '0.7rem',
                  border: '1px solid', borderColor: `${c.accent}40` }} />
            ))}
          </Box>

          {/* Attribution */}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, opacity: 0.55 }}>
            3D models: University of Dundee, School of Dentistry (@DundeeDental) · CC Attribution
          </Typography>
        </Box>
      )}

      {/* ── Tooth Records ── */}
      {teeth.size > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1}>
            Tooth Records ({teeth.size})
          </Typography>
          <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            {Array.from(teeth.values()).sort((a, b) => a.toothNumber - b.toothNumber).map((t, i) => {
              const cond = getCondStyle(t.condition)
              return (
                <Box
                  key={t.toothNumber}
                  onClick={() => openEditDialog(t.toothNumber)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
                    borderBottom: i < teeth.size - 1 ? '1px solid' : 'none', borderColor: 'divider',
                    cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{
                    width: 28, height: 28, borderRadius: 1,
                    bgcolor: cond.bg, border: '1px solid', borderColor: cond.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: cond.accent, fontSize: '10px' }}>
                      {t.toothNumber}
                    </Typography>
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

      {/* ── Edit Dialog ── */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Tooth #{selected}</Typography>
            {selected && (
              <Typography variant="body2" color="text.secondary">{FULL_NAMES[selected]}</Typography>
            )}
          </Box>
          <IconButton onClick={() => setEditDialog(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth label="Label / Note" multiline rows={2}
                placeholder="e.g. Decay on buccal surface, Crown prep done…"
                value={editForm.label}
                onChange={e => setEditForm(p => ({ ...p, label: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={editForm.condition} label="Condition"
                  onChange={e => setEditForm(p => ({ ...p, condition: e.target.value }))}
                  sx={{ borderRadius: 2.5 }}
                >
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
              <TextField
                fullWidth label="Clinical Notes" multiline rows={3}
                placeholder="Detailed clinical observations…"
                value={editForm.notes}
                onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>X-Ray / Image</Typography>
              {editForm.imageUrl ? (
                <Box>
                  <Box
                    component="img" src={editForm.imageUrl} alt="xray"
                    sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
                  />
                  <Button size="small" sx={{ mt: 1 }} onClick={() => setEditForm(p => ({ ...p, imageUrl: '' }))}>
                    Remove
                  </Button>
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
          <Button onClick={handleSaveEdit} variant="contained"
            sx={{ background: 'linear-gradient(135deg, #0A6EBD, #00B4D8)' }}>
            Save & Apply to 3D
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}