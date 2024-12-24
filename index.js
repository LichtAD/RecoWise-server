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
            // console.log(newQuery);

            const result = await queryCollection.insertOne(newQuery);
            res.send(result);
        })

        // ! show all queries: now filter with email to search with email
        app.get('/queries', async (req, res) => {

            const email = req.query.email;
            let query = {};
            if (email) {
                query = { email: email }
            }

            // const cursor = queryCollection.find(query);   // for normal api
            const cursor = queryCollection.find(query).sort({ time: -1 }); // for sorted api

            const result = await cursor.toArray();
            res.send(result);
        })

        // ! read - first 6 data send to client (already sorted by descending)
        app.get('/queries-six', async (req, res) => {
            const cursor = queryCollection.find().limit(6).sort({ time: -1 });
            const result = await cursor.toArray();
            res.send(result);
        })

        // ! search by id query to get specific query
        app.get('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await queryCollection.findOne(query);
            res.send(result);
        })

        // ! update - update specific query data
        app.put('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const updatedQuery = req.body;              // body thk info paisi
            // console.log('updated Query', updatedQuery);

            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedQueryDoc = {                 // info gula ekta updated variable e set krsi
                $set: {
                    product_name: updatedQuery.product_name,
                    product_brand: updatedQuery.product_brand,
                    product_image: updatedQuery.product_image,
                    query_title: updatedQuery.query_title,
                    reason: updatedQuery.reason,
                    lastUpdatedAt: updatedQuery.current_time,
                }
            }

            const result = await queryCollection.updateOne(filter, updatedQueryDoc, options);       // filter kore oita update krsi
            res.send(result);
        })


        // ! delete my query
        app.delete('/queries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await queryCollection.deleteOne(query);
            res.send(result);
        })


        // ! recommendation api

        // ! show all recommendation: now filter with email to search with email : we will also filter with queryId
        app.get('/recommendations', async (req, res) => {

            const email = req.query.recommenderEmail;
            let recommendation = {};
            if (email) {
                recommendation = { recommenderEmail: email }
            }

            const queryId = req.query.queryId;
            if (queryId) {
                recommendation = { queryId: queryId }
            }

            const cursor = recommendationCollection.find(recommendation);
            const result = await cursor.toArray();
            res.send(result);
        })

        // ! search by recommendation id to get specific recommendation
        app.get('/recommendations/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await recommendationCollection.findOne(query);
            res.send(result);
        })

        // ! add recommendation
        app.post('/recommendations', async (req, res) => {
            const recommendation = req.body;

            // console.log(recommendation.queryId);                // fanta r id - queries e - jkhane count ase

            const result = await recommendationCollection.insertOne(recommendation);

            // count recommendation
            const query = { _id: new ObjectId(recommendation.queryId) };
            const updateDoc = {
                $inc: { count: 1 },
                // $set: { lastUpdatedAt: new Date() }
            };
            await queryCollection.updateOne(query, updateDoc);    // adding to /queries as we added to queryCollection

            res.send(result);
        });

        // ! delete recommendation: as we need two thing from this api, we will use post instead of delete
        app.post('/recommendations/:id', async (req, res) => {
            const id = req.params.id;
            // console.log('plz delete', id);           // recommendation id in recommendation

            // ! decrease the count
            const recommendation = req.body;

            // console.log('recommendation', req.body);
            // console.log('recommendation.queryId', recommendation.query_id);

            const query2 = { _id: new ObjectId(recommendation.query_id) };

            const updateDoc = {
                $inc: { count: -1 },
            }
            const updateResult = await queryCollection.updateOne(query2, updateDoc);
            // console.log('Update result:', updateResult);

            // ! age count decrease kore delete krtisi
            const query = { _id: new ObjectId(id) };
            const result = await recommendationCollection.deleteOne(query);

            res.send(result);
        })

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