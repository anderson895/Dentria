import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAppointment extends Document {
  patient: mongoose.Types.ObjectId
  dentist: mongoose.Types.ObjectId
  date: Date
  time: string
  duration: number
  type: 'checkup' | 'cleaning' | 'filling' | 'extraction' | 'root_canal' | 'crown' | 'consultation' | 'emergency' | 'other'
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  teethInvolved?: number[]
  fee?: number
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    dentist: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    duration: { type: Number, default: 30 },
    type: {
      type: String,
      enum: ['checkup', 'cleaning', 'filling', 'extraction', 'root_canal', 'crown', 'consultation', 'emergency', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
    },
    notes: { type: String },
    teethInvolved: [{ type: Number }],
    fee: { type: Number },
  },
  { timestamps: true }
)

const Appointment: Model<IAppointment> = mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema)
export default Appointment
