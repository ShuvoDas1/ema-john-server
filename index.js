const express = require('express')
require('dotenv').config()
const  cors = require('cors');
const fs = require('fs-extra');
const bodyParser= require('body-parser')
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload')




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vktpy.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true,useUnifiedTopology: true  });


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('products'));
app.use(fileUpload());

const port = 4000


client.connect(err => {
  const productsCollection = client.db("emajohnStore").collection("products");
  const ordersCollection = client.db("emajohnStore").collection("orders");


    app.post('/addProduct',(req,res) =>{
        const file = req.files.file;
        const name = req.body.name;
        const stock = req.body.stock;
        const seller = req.body.seller;
        const price = req.body.price;
        const filePath = `${__dirname}/products/${file.name}`;
        
         console.log(seller, stock);
        file.mv(filePath, err => {
            if(err){
              console.log(err);
               res.status(500).send({msg: 'Failed to upload image'})
            }
            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');
            let image = {
              contentType: req.files.file.mimetype,
              size: req.files.file.size,
              img: Buffer.from(encImg, 'base64')
            } 
            productsCollection.insertOne({name, price, seller, stock, image})
            .then(result =>{
                fs.remove(filePath, error =>{
                    console.log(error)
                    res.send(result. insertedCount > 0)
                })
            })          
        })


    })

    app.get('/products',(req,res) =>{
      const search = req.query.search;
      console.log(search);
      productsCollection.find({name: {$regex:search} })
      .toArray((err,documents) =>{
        res.send(documents)
      })

    })

    app.get('/product/:key',(req,res) =>{
      productsCollection.find({key:req.params.key})
      .toArray((err,documents)=>{
        res.send(documents[0])
      })

    })

    app.post('/productsByKeys',(req,res)=>{
      const productKeys = req.body;
      productsCollection.find({key:{$in:productKeys}})
      .toArray((err,documents)=>{
        res.send(documents)
      })
    })

    app.post('/addOrder',(req,res)=>{
      const order = req.body;
      ordersCollection.insertOne(order)
      .then(result =>{
        res.send(result.insertedCount > 0)
      })
    })

});





app.get('/', (req, res) => {
  res.send('Hello ema-john!')
})

app.listen(process.env.PORT || port)
