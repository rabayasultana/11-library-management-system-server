require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// const corsOptions = {
//     origin: ['http://localhost:5173', 'http://localhost:5174'],
//     credentials: true,
//     optionSuccessStatus: 200,
// }
// app.use(cors(corsOptions))

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mwqipy1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const categoriesCollection = client.db("library").collection("categories");
    const booksCollection = client.db("library").collection("books");
    const borrowedBooksCollection = client
      .db("library")
      .collection("borrowedBooks");
      const reviewsCollection = client
      .db("library")
      .collection("reviews");

    // Get all categories data from DB
    app.get("/categories", async (req, res) => {
      const result = await categoriesCollection.find().toArray();

      res.send(result);
    });

    // Get all books data from the db
    app.get("/books", async (req, res) => {
      const result = await booksCollection.find().toArray();

      res.send(result);
    });

    // Get single book data from db by using book id
    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });



   

    //  save book data in database
    app.post("/books", async (req, res) => {
      const newBook = req.body;
      // console.log(newBook);
      const result = await booksCollection.insertOne(newBook);
      res.send(result);
    });

    // update books in database
    app.put("/books/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedBook = req.body;
    
      let book; // Define variable for update operation
    
      if (updatedBook.hasOwnProperty("updateType")) {
        if (updatedBook.updateType === "update") {
          book = {
            $set: {
              name: updatedBook.bookName,
              author: updatedBook.authorName,
              category: updatedBook.category,
              rating: updatedBook.rating,
              image: updatedBook.photo,
            },
          };
        } 
        else if (updatedBook.updateType === "quantity") {
          book = {
            $inc: { quantity: -1 },
          };
        } 
        // else if (updatedBook.updateType === "quantityIncrease") {
        //   book = {
        //     $inc: { quantity: +1 },
        //   };
        // } 
        else {
          return res.status(400).send({ message: "Invalid update type" }); // Handle invalid updateType
        }
      } else {
        return res.status(400).send({ message: "Missing update type" }); // Handle missing updateType
      }
        const result = await booksCollection.updateOne(filter, book, options);
        res.send(result);
      
    });
    
    app.put("/books", async (req, res) => {
      const {search} = req.query;
      console.log('name',search);
      const options = { upsert: true };
      const updatedBook = req.body;
      const query = {
        name: {$regex: search, $options: 'i'}
    } 
    const book = {
      $inc: { quantity: +1 },
    };
    // const result = await booksCollection.findOne(query);
    const result = await booksCollection.updateOne(query, book, options);
    res.json(result);
    })


    //  save borrowed book data in database
    app.post("/borrowedBooks", async (req, res) => {
      const borrowedBook = req.body;
      // console.log(borrowedBook);
      const result = await borrowedBooksCollection.insertOne(borrowedBook);
      res.send(result);
    });

    // Get borrowed books data by email from the db

    app.get("/borrowedBooks/:email", async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      const query = { email: email };

      const result = await borrowedBooksCollection.find(query).toArray();

      res.send(result);
    });

    // delete borrowed books
    app.delete("/borrowedBooks/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowedBooksCollection.deleteOne(query);
      // console.log(result);
      res.send(result);
    });


    // add reviews
    app.post("/review", async (req, res) => {
      const newReview = req.body;
      // console.log(newReview);
      const result = await reviewsCollection.insertOne(newReview);
      res.send(result);
    });

    // get reviews
        // Get all books data from the db
        app.get("/review", async (req, res) => {
          const result = await reviewsCollection.find().toArray();
    
          res.send(result);
        });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from Library management server....");
});

app.listen(port, () => console.log(`Server running on port ${port}`));
