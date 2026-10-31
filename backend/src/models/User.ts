import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  studentId?: string;
  teacherId?: string;
  role: 'STUDENT' | 'TEACHER' | 'COUNSELOR' | 'LEAD_MANAGER' | 'CMS_MANAGER' | 'ADMIN' | 'SUPER_ADMIN';
  targetExam?: string;
  targetClass?: string;
  targetYear?: string;
  avatarUrl?: string;
  designation?: string;
  department?: string;
  dob?: string;
  preferredLanguage?: string;
  city?: string;
  state?: string;
  parentName?: string;
  parentPhone?: string;
  schoolName?: string;
  board?: string;
  googleId?: string;
  authProvider?: 'local' | 'google';
  enrolledCourses?: any[];
  comparePassword(enteredPassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide student/staff name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide email address'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: function (this: any) {
        return !this.googleId;
      },
      minlength: 6,
      select: false
    },
    googleId: {
      type: String,
      sparse: true,
      index: true
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    phone: {
      type: String,
      trim: true
    },
    studentId: {
      type: String,
      sparse: true,
      index: true
    },
    teacherId: {
      type: String,
      sparse: true,
      index: true
    },
    role: {
      type: String,
      enum: ['STUDENT', 'TEACHER', 'COUNSELOR', 'LEAD_MANAGER', 'CMS_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
      default: 'STUDENT'
    },
    targetExam: {
      type: String,
      default: 'JEE Main & Advanced 2027'
    },
    targetClass: {
      type: String,
      default: 'Class 11th'
    },
    targetYear: {
      type: String,
      default: '2028'
    },
    avatarUrl: {
      type: String
    },
    designation: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    dob: {
      type: String
    },
    preferredLanguage: {
      type: String,
      default: 'Hinglish'
    },
    city: {
      type: String
    },
    state: {
      type: String
    },
    parentName: {
      type: String
    },
    parentPhone: {
      type: String
    },
    schoolName: {
      type: String
    },
    board: {
      type: String,
      default: 'CBSE'
    },
    enrolledCourses: [
      {
        type: Schema.Types.Mixed
      }
    ]
  },
  {
    timestamps: true
  }
);

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ phone: 1 }, { sparse: true });
userSchema.index({ enrolledCourses: 1 });
userSchema.index({ targetExam: 1, targetClass: 1 });
userSchema.index({ name: 'text', email: 'text', phone: 'text' });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password || '');
};

export const User = mongoose.model<IUser>('User', userSchema);
