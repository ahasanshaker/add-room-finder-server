const express = require('express');

const { ObjectId } = require('mongodb');

const cors = require('cors');
const app = express();
const port = 3000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.byszxkc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const roomsCollection = client.db('roomDb').collection('rooms');
    const usersCollection = client.db('roomDb').collection('users'); // user info collection

    // -----------------------------
    // Save or update user profile
    // -----------------------------
    app.post('/users', async (req, res) => {
      try {
        const { name, email, photoURL } = req.body;

        if (!name || !email) {
          return res.status(400).send({ message: 'Name and email are required' });
        }

        // Upsert: insert if not exist, update if exist
        const result = await usersCollection.updateOne(
          { email }, // filter by email
          { $set: { name, email, photoURL } }, // set/update fields
          { upsert: true } // insert if not exists
        );

        res.status(200).send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Server error' });
      }
    });

    // Get user by email
    app.get('/users', async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) return res.status(400).send({ message: 'Email is required' });

        const user = await usersCollection.find({ email }).toArray();
        res.send(user);
      } catch (error) {
        res.status(500).send({ message: 'Server error' });
      }
    });


   app.delete('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await roomsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: 'Room not found', deletedCount: 0 });
    }

    res.send({ message: 'Room deleted successfully', deletedCount: result.deletedCount });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Server error', deletedCount: 0 });
  }
});


    // -----------------------------
    // Rooms routes
    // -----------------------------
    app.get('/rooms', async (req, res) => {
      const result = await roomsCollection.find().toArray();
      res.send(result);
    });

    app.get('/rooms/home', async (req, res) => {
      const result = await roomsCollection.find().limit(6).toArray();
      res.send(result);
    });
     app.get('/rooms/user', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).send({ message: 'Email is required' });

    const userRooms = await roomsCollection.find({ userEmail: email }).toArray();
    res.send(userRooms);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Server error' });
  }
});
    app.put('/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRoom = req.body;

    const { ObjectId } = require('mongodb');
    const result = await roomsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedRoom }
    );

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Server error' });
  }
});

    app.post('/rooms', async(req,res) => {
      const newRoom = req.body;
      console.log(newRoom);
      const result = await roomsCollection.insertOne(newRoom);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('room finder server is running');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
