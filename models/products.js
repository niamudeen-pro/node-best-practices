import mongoose from "mongoose";

const products = new mongoose.Schema({});

const Products = new mongoose.model("product", products);
export default Products;
