import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IToothRecord {
  toothNumber: number
  label: string
  condition: 'healthy' | 'cavity' | 'missing' | 'crown' | 'filling' | 'root_canal' | 'extraction_needed' | 'implant'
  notes?: string
  color?: string
  imageUrl?: string
  updatedAt?: Date
}

export interface IPatient extends Document {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: Date
  gender: 'male' | 'female' | 'other'
  address?: string
  medicalHistory?: string
  allergies?: string
  teethRecord: IToothRecord[]
  xrayImages: string[]
  avatar?: string
  createdBy: mongoose.Types.ObjectId
}

const ToothRecordSchema = new Schema<IToothRecord>({
  toothNumber: { type: Number, required: true },
  label: { type: String, default: '' },
  condition: {
    type: String,
    enum: ['healthy', 'cavity', 'missing', 'crown', 'filling', 'root_canal', 'extraction_needed', 'implant'],
    default: 'healthy',
  },
  notes: { type: String },
  color: { type: String, default: '#ffffff' },
  imageUrl: { type: String },
  updatedAt: { type: Date, default: Date.now },
})

const PatientSchema = new Schema<IPatient>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    address: { type: String },
    medicalHistory: { type: String },
    allergies: { type: String },
    teethRecord: { type: [ToothRecordSchema], default: [] },
    xrayImages: [{ type: String }],
    avatar: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

const Patient: Model<IPatient> = mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema)
export default Patient
