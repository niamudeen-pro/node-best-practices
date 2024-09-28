import "dotenv/config";
import express from "express";
import cors from "cors";
import colors from "colors";
import connectToDatabase from "./config/db.js";
import router from "./router/index.js";
import { errorHandler } from "./utils/helper.js";
import Products from "./models/products.js";
import Orders from "./models/orders.js";

connectToDatabase();

const PORT = process.env.PORT || 7000;

const app = express();

app.use(express.json());
app.use(cors());

// app.use("/", (req, res) => {
//   res.status(200).json({ message: "server is running" });
// });

export const subtractDays = (date, days) => {
  if (!date || !days) return null;

  let result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

export const convertDateIntoStartOfDay = (date) => {
  if (!date) return null;

  const inputDate = new Date(date);

  const startDate = new Date(
    Date.UTC(
      inputDate.getUTCFullYear(),
      inputDate.getUTCMonth(),
      inputDate.getUTCDate(),
      0, // Hours
      0, // Minutes
      0, // Seconds
      0 // Milliseconds
    )
  );
  const startOfDayISO = startDate.toISOString();

  return startOfDayISO;
};

export const convertDateIntoEndOfDay = (date) => {
  if (!date) return null;
  const inputDate = new Date(date);

  const endOfDay = new Date(
    Date.UTC(
      inputDate.getUTCFullYear(),
      inputDate.getUTCMonth(),
      inputDate.getUTCDate(),
      23, // Hours (23:00 or 11:00 PM)
      59, // Minutes
      59, // Seconds
      999 // Milliseconds
    )
  );

  const endOfDayISO = endOfDay.toISOString();
  return endOfDayISO;
};

const test = async () => {
  // Ensure dates are correctly formatted
  const daysOfRestock = 90;
  const shop = "stockrabbit.myshopify.com";

  const start_date = subtractDays(new Date(), 1);
  const end_date = subtractDays(new Date(), daysOfRestock);

  const QUERY = { shop: shop };
  QUERY.title = { $regex: new RegExp("gift", "i") };

  // const result = await Orders.find({
  //   created_at: {
  //     $gte: end_date,
  //     $lte: start_date,
  //   },
  // });
  // console.log("result: ", result);

  const pipeline = [
    {
      $match: QUERY,
    },
    {
      $lookup: {
        from: "stores",
        let: { shopDomain: shop },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$domain", "$$shopDomain"],
              },
            },
          },
          {
            $project: {
              restock_lead_time: 1,
              forecast_period: 1,
            },
          },
        ],
        as: "storeData",
      },
    },
    {
      $unwind: {
        path: "$storeData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "orders",
        let: { productId: "$product_id" },
        pipeline: [
          { $unwind: "$line_items" },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$line_items.product_id", "$$productId"] },
                  { $gte: ["$created_at", end_date] },
                  { $lt: ["$created_at", start_date] },
                ],
              },
            },
          },
          {
            $group: {
              _id: { product_id: "$line_items.product_id" },
              totalSold: { $sum: "$line_items.quantity" }, // Sum the quantities
              revenue: {
                $sum: {
                  $multiply: ["$line_items.quantity", "$line_items.price"],
                },
              },
            },
          },
        ],
        as: "restockData",
      },
    },
    {
      $unwind: {
        path: "$restockData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        sale_count: { $ifNull: ["$restockData.totalSold", 0] },
        revenue: { $ifNull: ["$restockData.revenue", 0] },
        days_of_restock: { $ifNull: ["$storeData.restock_lead_time", 0] },
        average_daily_sales: {
          $cond: {
            if: { $gt: ["$storeData.forecast_period", 0] },
            then: {
              $divide: [
                { $ifNull: ["$restockData.totalSold", 0] },
                "$storeData.forecast_period",
              ],
            },
            else: 0,
          },
        },
      },
    },
    // Calculate restock_date using available_quantity, average_daily_sales, and days_of_restock
    {
      $addFields: {
        stockout_days: {
          $cond: {
            if: { $gt: ["$average_daily_sales", 0] },
            then: { $divide: ["$available_quantity", "$average_daily_sales"] },
            else: null,
          },
        },
        // {
        //   $cond: {
        //     if: { $gt: ["$stockout_days", 0] }, // Check stockout_days instead of available_quantity
        //     then: {
        //       $add: [
        //         new Date(),
        //         { $multiply: ["$stockout_days", 86400000] }, // Convert days to milliseconds
        //       ],
        //     },
        //     else: null,
        //   },
        // },
        restock_date: {
          $cond: {
            if: { $gt: ["$stockoutDays", 0] },
            then: {
              $add: [
                // This assumes you have a `days_of_restock` field
                {
                  $add: [
                    new Date(),
                    { $multiply: ["$stockoutDays", 86400000] },
                  ],
                },
                { $multiply: ["$days_of_restock", 86400000] }, // Restock lead time in milliseconds
              ],
            },
            else: null,
          },
        },
        suggested_restock: {
          $cond: {
            if: { $gt: ["$available_quantity", 0] }, // If available quantity > 0
            then: {
              $ceil: {
                $subtract: [
                  { $multiply: ["$average_daily_sales", "$days_of_restock"] }, // average_daily_sales * days_of_restock
                  "$available_quantity", // Subtract available_quantity
                ],
              },
            },
            else: 0, // If quantity is 0, restock is 0
          },
        },
        average_selling_price: {
          $cond: {
            if: { $gt: ["$sale_count", 0] },
            then: {
              $divide: ["$revenue", "$sale_count"],
            },
            else: 0,
          },
        },
        day_untill_stockout: {
          $cond: {
            if: { $gt: ["$average_daily_sales", 0] },
            then: {
              $divide: ["$available_quantity", "$average_daily_sales"],
            },
            else: null,
          },
        },
        forecast_loss: {
          $cond: {
            if: { $gt: ["$stockoutDays", 0] },
            then: {
              $multiply: [
                "$stockoutDays",
                {
                  $subtract: [
                    "$storeData.forecast_period",
                    "$day_untill_stockout",
                  ],
                },
              ],
            },
            else: 0,
          },
        },
      },
    },
    {
      $project: {
        product_id: 1,
        title: 1,
        image: 1,
        available_quantity: 1,
        sale_count: 1,
        revenue: 1,
        restock_date: 1,
        days_of_restock: 1,
        suggested_restock: 1,
        average_daily_sales: { $round: ["$average_daily_sales", 2] },
        stockout_date: 1,
        stockout_days: 1,
        revenue: 1,
        forecast_loss: 1,
        average_selling_price: 1,
      },
    },
  ];

  const PRODUCT_LIST = await Products.aggregate(pipeline);
  console.log("PRODUCT_LIST: ", PRODUCT_LIST);

  const TOTAL_PRODUCTS = PRODUCT_LIST?.length;
  console.log("TOTAL_PRODUCTS: ", TOTAL_PRODUCTS);
};

test();

// app.use("/api/v1", router);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`server is running at port: ${PORT}`.bgBlue);
});
