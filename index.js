const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express()

const port = process.env.PORT || 5000;

const user = process.env.DB_USER
const password = process.env.DB_PASSWORD

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${user}:${password}@cluster0.k6rknfb.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();
    await client.db("admin").command({ ping: 1 });

    const serviceCollection = client.db('carsDoctor').collection('services')
    const orderCollection = client.db('carsDoctor').collection('serviceOrderPending')


    app.post('/jwt', (req, res)=>{
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1hr'})
      res.send({token})
    })

    app.get('/services', async(req, res)=>{
        const cursor = serviceCollection.find()
        const services = await cursor.toArray()
        res.send(services)
    })

    app.get('/services/:id', async(req, res)=>{
        const serviceId = req.params.id
        const query = {_id: new ObjectId(serviceId)}
        const result = await serviceCollection.findOne(query)
        res.send(result)
    })

    app.get('/serviceorder', async(req, res)=>{
      const cursor = orderCollection.find()
      const order = await cursor.toArray()
      res.send(order)
    })

    app.get('/order', async(req, res)=>{
      let query = {}
      if(req.query.email){
        query ={
          email:req.query.email
        }
      }
      const cursor = orderCollection.find(query)
      const orders = await cursor.toArray()
      res.send(orders)
    })

    app.post('/serviceorder', async(req, res)=>{
      const orderData = req.body
      const order = await orderCollection.insertOne(orderData)
      res.send(order)
    })

    app.patch('/serviceorder/:id', async(req, res) => {
      const id = req.params.id
      const order = req.body.status;
      const filterOrder = {_id: new ObjectId(id)}
      // const options = {upsert:true}
      const updateOrder = {
        $set:{
          status:order
        }
      }

      const result = await orderCollection.updateOne(filterOrder, updateOrder)
      res.send(result)
    })

    app.delete('/serviceorder/:id', async(req, res) =>{
      const orderId = req.params.id;
      const query = {_id: new ObjectId(orderId)}
      const order = await orderCollection.deleteOne(query)
      res.send(order)
    })

    app.delete('/serviceorder', async(req, res)=>{
      const orderData = req.body
      const deleteOrder = await orderCollection.deleteMany()
      res.send(deleteOrder)
    })

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/",(req, res)=>{
    res.send("The server is running!!")
})

app.listen(port, ()=>{
    console.log(`The server running on port:${port}`)
})