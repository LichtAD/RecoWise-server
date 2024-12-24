const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xy3cn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const database = client.db("queryDB");
        const queryCollection = database.collection("queries");
        const recommendationCollection = database.collection("recommendation");

        // ! add query
        app.post('/queries', async (req, res) => {
            const newQuery = req.body;
            console.log(newQuery);

            const result = await queryCollection.insertOne(newQuery);
            res.send(result);
        })

        // ! show all queries: now filter with email
        app.get('/queries', async (req, res) => {
            const email = req.query.email;
            let query = {};
            if (email) {
                query = { email: email }
            }
            const cursor = queryCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // ! search by id query
        app.get('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await queryCollection.findOne(query);
            res.send(result);
        })


        // ! recommendation api

        // ! show all recommendation
        app.get('/recommendations', async (req, res) => {
            const cursor = recommendationCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // ! add recommendation
        app.post('/recommendations', async (req, res) => {
            const recommendation = req.body;
            const result = await recommendationCollection.insertOne(recommendation);

            // ----------------------------------------------------------------------

            // count how many were recommended
            // Not the best way (use aggregate) 
            // skip --> it

            // const id = application.job_id;
            // const query = { _id: new ObjectId(id) }
            // const job = await jobsCollection.findOne(query);

            // let newCount = 0;
            // if (job.applicationCount) {
            //     newCount = job.applicationCount + 1;
            // }
            // else {
            //     newCount = 1;
            // }

            // // now update the job info
            // const filter = { _id: new ObjectId(id) };
            // const updatedDoc = {
            //     $set: {
            //         applicationCount: newCount   // fieldname: value
            //     }
            // }

            // const updateResult = await jobsCollection.updateOne(filter, updatedDoc);

            // -----------------------------------------------------------------------

            res.send(result);
        });

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('product recommendation server is running');
});

app.listen(port, () => {
    console.log(`server running on port ${port}`);
})