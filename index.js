const express = require("express");
const app = express();
var cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
var cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
  // optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

const uri =
  "mongodb+srv://shoeVault:1fjNCWdOWSN4eW3Q@cluster0.5kgqkgx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const productsCollection = client.db("shoeVaultDB").collection("products");

    app.get("/products", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const searchQuery = req.query.search ? req.query.search.trim() : "";
      const brand = req.query.brand ? req.query.brand.trim() : "";
      const category = req.query.category ? req.query.category.trim() : "";
      const minPrice = parseFloat(req.query.minPrice) || 0;
      const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
      const sortBy = req.query.sortBy || "dateAdded";

      const skip = (page - 1) * limit;

      // Normalize search query
      const normalizedQuery = searchQuery.replace(/\s+/g, "").toLowerCase();

      // Create a filter
      const filter = {
        productName: { $regex: normalizedQuery, $options: "i" },
        brand: brand ? brand : { $exists: true },
        category: category ? category : { $exists: true },
        price: { $gte: minPrice || 0, $lte: maxPrice || Infinity },
      };

      // Remove filters if not specified
      for (let key in filter) {
        if (filter[key] === "") {
          delete filter[key];
        }
      }

      // Define sorting
      const sort = {};
      if (sortBy === "priceAsc") {
        sort.price = 1;
      } else if (sortBy === "priceDesc") {
        sort.price = -1;
      } else if (sortBy === "dateAdded") {
        sort.dateAdded = -1; // Newest first
      }

      console.log("Filter:", filter);
      console.log("Sort:", sort);

      // Fetch total count of documents
      const total = await productsCollection.countDocuments(filter);

      // Fetch the products with pagination
      const result = await productsCollection
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .toArray();

      console.log("Search Result:", result);

      // Send paginated results along with pagination metadata
      res.send({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        products: result,
      });
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("ShoeVault is Running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
