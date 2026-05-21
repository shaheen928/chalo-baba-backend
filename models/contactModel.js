import { timeStamp } from "console";
import mongoose from "mongoose";

const contactScheema = mongoose.Schema({
  name:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },},
  { timestamps: true }
)
   

  const Contact = mongoose.model('Contact',contactScheema);

  export default Contact;