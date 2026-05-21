import fs from "fs";
import path from "path";

import asyncHandlar from "express-async-handler";
import Product from "../models/productModel.js";

export const getProducts = asyncHandlar(async (req, res) => {
  const pageSize = 12;
  const page = req.query.pageNumber || 1;

  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: "i",
        },
      }
    : {};

  const isSuggestion = req.query.suggest === "true";

  if (isSuggestion) {
    const products = await Product.find({ ...keyword })
      .select("name")
      .limit(5);
    return res.json(products);
  }
  const count = await Product.countDocuments({ ...keyword });

  const products = await Product.find({ ...keyword })
    .sort({createdAt: -1})
    .limit(pageSize)
    .skip(pageSize * (page - 1));
  res.json({
    products,
    page,
    pages: Math.ceil(count / pageSize),
    keyword: req.query.keyword || "",
  });
});

export const getProductById = asyncHandlar(async (req, res) => {
  const productFound = await Product.findById(req.params.id);
  if (productFound) {
    res.json(productFound);
  } else {
    res.status(404);
    throw new Error("product not found");
  }
});

export const getAdminProducts = asyncHandlar(async (req, res) => {
  const adminProducts = await Product.find({});
  res.json(adminProducts);
});

export const createProduct = asyncHandlar(async (req, res) => {
  const product = new Product({
    name: "Sample name",
    price: 0,
    user: req.user._id,
    image: "/images/sample.jpg",
    brand: "Sample brand",
    category: "Sample category",
    countInStock: 0,
    numReviews: 0,
    description: "sample description",
  });
  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

export const updateProduct = asyncHandlar(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock } =
    req.body;
  const product = await Product.findById(req.params.id);
  if (product) {
    if (product.image !== image && product.image.startsWith("/uploads")) {
      const __dirname = path.resolve();
      const oldImagePath = path.join(__dirname, product.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    product.name = name;
    product.price = price;
    product.description = description;
    product.image = image;
    product.brand = brand;
    product.category = category;
    product.countInStock = countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error("product not found");
  }
});

export const deleteProduct = asyncHandlar(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    const __dirname = path.resolve();
    const imageRelativePath = product.image.startsWith("/")
      ? product.image.substring(1)
      : product.image;
    const oldImagePath = path.join(__dirname, imageRelativePath);
    if (fs.existsSync(oldImagePath)) {
      try {
        fs.unlinkSync(oldImagePath);
      } catch (error) {
        console.error("error deleting file ", error);
      }
    }
    await Product.deleteOne({ _id: product._id });
    res.json({ message: "Product has deleted" });
  } else {
    res.status(404);
    throw new Error("product not found");
  }
});




export const createProductReview = asyncHandlar(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString(),
    );
    if (alreadyReviewed) {
      res.status(400);
      throw new Error("product already reviewed");
    }
    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;
    await product.save();
    res.status(201).json({ message: "Review added" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});
