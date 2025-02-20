require("dotenv").config();
const express = require("express");
const cors = require("cors");
const PORT = process.env.PORT || 5001;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mzx0h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const database = client.db("getShitDoneDB");
    const usersCollection = database.collection("users");
    const tasksCollection = database.collection("tasks");



    // -------------------
    // USERS Endpoint
    // -------------------

    // 1. Endpoint to create a new user

    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        //   console.log(user)
        const query = { email: user.email };
        const existingUser = await usersCollection.findOne(query);
        if (existingUser) {
          return res.send({
            message: "user already exists on the DB",
            insertedId: null,
          });
        }
        const result = await usersCollection.insertOne(user);
        res.send(result);
      } catch (err) {
        res.send({ error: "Failed to insert user" });
      }
    });

    // -------------------
    // TASKS Endpoints
    // -------------------

    // 1. Get tasks for the logged-in user
    app.get("/tasks", async (req, res) => {
      try {
        const userId = req.query.userId;
        if (!userId) {
          return res.status(400).send({ error: "Missing userId in query" });
        }

        const tasks = await tasksCollection
          .find({ userId })
          .sort({ order: 1 })
          .toArray();

        res.send(tasks);
      } catch (error) {
        res.status(500).send({ error: "Failed to fetch tasks" });
      }
    });

    // 2. Create a new task
    app.post("/tasks", async (req, res) => {
      try {
        const { title, description, category, userId, order } = req.body;

        if (!userId || !title) {
          return res.status(400).send({ error: "Missing required fields" });
        }

        const newTask = {
          title,
          description: description || "",
          category: category || "To-Do",
          timestamp: new Date(),
          userId,
          order: order ?? Date.now(),
        };

        const result = await tasksCollection.insertOne(newTask);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Failed to create task" });
      }
    });

    //
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
