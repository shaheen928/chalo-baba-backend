import express, { Router } from 'express'
const userRouter = express.Router()
import { registerValidator,loginValidator } from '../middleware/validatorMiddlewear.js'
import { authUser,registerUser,getUserProfile,updateUserProfile, getUsers, deleteUser, getUserById, updateUser, forgotPassword, resetPassword, verifyEmail } from '../controller/userController.js'
import { admin, protect } from '../middleware/authMiddleware.js'

userRouter.post('/forgotpassword',forgotPassword)
userRouter.put('/resetpassword',resetPassword)
userRouter.post('/verify-email',verifyEmail)
userRouter.post('/login',loginValidator,authUser)
userRouter.post('/register',registerValidator,registerUser)

userRouter.route('/profile').get(protect,getUserProfile)
.put(protect,updateUserProfile)


userRouter.route('/').get(protect,admin,getUsers)

userRouter.route('/:id')
.delete(protect,admin,deleteUser)
.get(protect,admin,getUserById)
.put(protect,admin,updateUser)

export default userRouter;