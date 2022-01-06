const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET);
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
        const purchaseCollection = database.collection('purchases');
        const userCollection = database.collection('users');
        const eventCollection = database.collection('events');
        const reviewCollection = database.collection('reviews');

        //GET Programs API
        app.get('/programs', async (req, res) => {
            const cursor = programCollection.find({});
            const programs = await cursor.toArray();
            res.send(programs);
        });

        //POST purchase programs
        app.post('/purchases', async (req, res) => {
            const purchase = req.body;
            const result = await purchaseCollection.insertOne(purchase);
            console.log(result);
            res.json(result);
        });

        //GET purchase data by filtering with user email
        app.get('/purchases', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            console.log(query);
            const cursor = purchaseCollection.find(query);
            const purchases = await cursor.toArray();
            res.send(purchases);
        });

        //GET purchase id to pay for the program
        app.get('/purchases/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await purchaseCollection.findOne(query);
            res.json(result);
        });

        //POST payment process
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                payment_method_types: ['card']
            });
            res.json({ clientSecret: paymentIntent.client_secret })
        });

        //GET Events API
        app.get('/events', async (req, res) => {
            const cursor = eventCollection.find({});
            const events = await cursor.toArray();
            res.send(events);
        });

        //Add Reviews 
        app.post('/addReviews', async (req, res) => {
            const result = await reviewCollection.insertOne(req.body);
            console.log(result);
            res.send(result);
        });

        //Get all reviews added by users and show on the home page
        app.get('/allReviews', async (req, res) => {
            const result = await reviewCollection.find({}).toArray();
            res.send(result);
        });

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