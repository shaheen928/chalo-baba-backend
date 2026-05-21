import path from 'path'
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
 import connectDB from './config/db.js'
 import productRouter from './router/productRoucts.js'
 import userRouter from './router/userRouter.js'
 import orderRouter from './router/orderRouter.js'
 import uploadRoutes from './router/uploadRoutes.js'
 import contactRouter from './router/contactRouter.js'
  import {notFound,errorHandler} from './middleware/errorMiddleware.js'
import bannerRouter from './router/bannerRouter.js'
 dotenv.config()
const port = process.env.PORT

const app = express()

app.use(cors({origin: 'http://localhost:5173',credentials: true}))

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use("/api/orders",orderRouter)
app.use('/api/users',userRouter)
app.use("/api/products",productRouter)
app.use('/api/upload',uploadRoutes)
app.use('/api/contact',contactRouter)
app.use('/api/banners',bannerRouter)


const __dirname = path.resolve();
app.use('/uploads',express.static(path.join(__dirname,'/uploads')))


app.use(notFound)
app.use(errorHandler)
connectDB().then(()=>{
  app.listen(port,() =>{
    console.log(`server id running on http://localhost:${port}`)
  })
})

