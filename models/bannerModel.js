import mongoose from "mongoose";


const bannerSchema= new mongoose.Schema({
  title:{
   type:String,
   required:true
  },
  subtitle:{
    type:String,
   required:true
  },
  image:{
    type: String,
    required: true
  },
  link:{type:String}
},{timestamps:true})

const Banner = mongoose.model('Banner',bannerSchema);
export default Banner;