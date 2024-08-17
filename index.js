const express = require("express");
const app = express();
var cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
var cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;

// shoeVault
// 1fjNCWdOWSN4eW3Q

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

      const skip = (page - 1) * limit;

      // Normalize search query
      const normalizedQuery = searchQuery.replace(/\s+/g, "").toLowerCase();

      // Create a filter for product name search
      const filter = searchQuery
        ? { productName: { $regex: normalizedQuery, $options: "i" } } // Case-insensitive search
        : {};

      // Fetch total count of documents
      const total = await productsCollection.countDocuments(filter);

      // Fetch the products with pagination
      const result = await productsCollection
        .find(filter)
        .skip(skip)
        .limit(limit)
        .toArray();

      // console.log('Search Result', result)

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
