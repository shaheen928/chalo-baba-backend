import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
 
const userSchma = mongoose.Schema({
  name:{type:String,
    required:true
  },
  email:{
    type:String,
    required:true
  },
  password:{
    type:String,
    required:true,
  },
  isVerified:{
    type: Boolean,
    default: false
  },
  isAdmin:{
    type:Boolean,
    required:true,
    default:false
  },
  otp:{type: String},
  otpExpire:{type: Date},
  resetPasswordToken : {type: String},
  resetPasswordExpire : {type: Date}

},{timestamps:true}
)
userSchma.pre('save', async function () {
  if(!this.isModified('password')) return;


  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password,salt)
  })  


   userSchma.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword,this.password)
   }
   
   userSchma.methods.getResetPasswordToken =  function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

 
    this.resetPasswordToken = crypto.createHash('sha256').update(otp).digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    return otp;
   }

   const User = mongoose.model('User',userSchma)
   export default User;