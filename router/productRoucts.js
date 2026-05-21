import express from "express"
import {getProducts,getProductById,getAdminProducts,createProduct, updateProduct, createProductReview, deleteProduct} from "../controller/productController.js"
import{protect,admin} from '../middleware/authMiddleware.js'
const productRouter = express.Router()


productRouter.route("/").get(getProducts)
.post(protect,admin,createProduct)
productRouter.route('/admin').get(getAdminProducts)

productRouter.route("/:id").get(getProductById)
.put(protect,admin,updateProduct)
.delete(protect,admin,deleteProduct)
productRouter.route("/:id/reviews").post(protect,createProductReview)


 




export default productRouter;