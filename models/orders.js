import mongoose from "mongoose";

const orders = new mongoose.Schema({});

const Orders = new mongoose.model("orders", orders);
export default Orders;
