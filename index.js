const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
const app = express();
const port = process.env.PORT || 7000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5mrxq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
//console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        console.log('Database connected');
        const database = client.db('mic_drop');
        const programCollection = database.collection('programs');
        const userCollection = database.collection('users');
        const eventCollection = database.collection('events');
        const reviewCollection = database.collection('reviews');

        //GET Programs API
        app.get('/programs', async (req, res) => {
            const cursor = programCollection.find({});
            const programs = await cursor.toArray();
            res.send(programs);
        });

        //GET Events API
        app.get('/events', async (req, res) => {
            const cursor = eventCollection.find({});
            const events = await cursor.toArray();
            res.send(events);
        });

        //Add Reviews 

        //Get all reviews added by users and show on the home page


        //POST Users data
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.json(result);
        });

        //Check if user is Admin
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        //Upsert users data
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const update = { $set: user };
            const result = await userCollection.updateOne(filter, update, options);
            res.json(result);
        });

        //Set role to admin
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            console.log('put', user)
            const filter = { email: user.email };
            const update = { $set: { role: 'admin' } };
            const result = await userCollection.updateOne(filter, update);
            res.json(result);
        });

    }
    finally {
        //await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello Mic Drop World!')
})

app.listen(port, () => {
    console.log(`Listening at ${port}`)
})