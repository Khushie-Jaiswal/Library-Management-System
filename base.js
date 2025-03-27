const express = require("express")
const path = require("path")
const bcrypt = require("bcrypt")
const saltRounds = 10;
const bodyparser = require('body-parser');
const mongoose = require("mongoose");
const { type } = require("os");
const { Schema } = mongoose;
const { availableMemory } = require("process");
const app = express()
const port = 8000;
const { log } = require("console");
const router = express.Router();
const db1 = require("./loginDB")
const db2 = require("./booksDB")

app.use('/static', express.static('static'))
app.use(express.static(__dirname))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(router);

router.get("/bid", async (req, res) => {
    try {
        const existingBook = await db2.Books.findOne({ bid: req.query.bid });
        if (existingBook) {
            return res.json({ exists: true });
        }
        else {
            return res.json({ exists: false });
        }
    }
    catch (error) {
        console.log("Error checking bid: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

module.exports = router;

app.post("/addBtn", async (req, res) => {
    try {
        const newBook = new db2.Books({
            bid: req.body.bid,
            name: req.body.name,
            author: req.body.author,
            publisher: req.body.publisher,
            genre: req.body.genre,
            availability: req.body.availability,
            total_copies: req.body.total_copies
        })
        await newBook.save();
        res.send("Added successfully!");
    }
    catch (error) {
        res.status(500).send("Error adding")
    }
})

app.post("/editBtn", async (req, res) => {
    try {
        let updateFields = {};
        if (req.body.name) updateFields.name = req.body.name;
        if (req.body.author) updateFields.author = req.body.author;
        if (req.body.publisher) updateFields.publisher = req.body.publisher;
        if (req.body.genre) updateFields.genre = req.body.genre;
        if (req.body.availability) updateFields.availability = req.body.availability;
        if (req.body.total_copies) updateFields.total_copies = req.body.total_copies;

        const updateBook = await db2.Books.findOneAndUpdate(
            { bid: req.body.bid },
            { $set: updateFields },
            { new: true }
        )
        if (updateBook) res.send("Updated successfully")
        else res.send("Book not found")
    }
    catch (error) {
        res.status(500).send("Error editing")
    }
})

app.delete("/deleteBtn", async (req, res) => {
    try {
        const deleteBook = await db2.Books.findOneAndDelete({ bid: req.body.bid })
        if (deleteBook) res.send("Deleted successfully")
        else res.send("Book not found")
    }
    catch (error) {
        res.status(500).send("Error deleting")
    }
})

app.get('/books', async (req, res) => {
    try {
        const books = await db2.Books.find();
        res.json({ books })
    }
    catch (error) {
        res.status(500).json({ message: "Error retrieving" });
    }
})

app.get('/', (req, res) => {
    const params = {}
    res.sendFile(path.join(__dirname, 'login.html'))
})

async function insert() {
    try {
        const count = await db1.Logins.countDocuments();

        if (count === 0) {
            const passwords = ["HelloWorld", "Gelly_poff", "admin@123", "GuavaJuice", "code789"]

            for (let pwd of passwords) {
                const hash = await bcrypt.hash(pwd, saltRounds);
                const pass = await db1.Logins.create({ Password: hash });
                pass.save();
            }
        }
    }
    catch (error) {
        console.error(error);
    }
}

insert();

app.post('/login', async (req, res) => {
    var logPass = req.body.password;
    try {
        const total = await db1.Logins.find();
        for (let i of total) {
            const equal = await bcrypt.compare(logPass, i.Password);
            if (equal) {
                return res.sendFile(path.join(__dirname, "books.html"))
            }
        }
        return res.status(401).send(`<script>alert("Login Failed");window.location.href='/';</script>`);
    }
    catch (error) {
        console.error(error);
        return res.send("Server error occurred");
    }
});

app.listen(port, () => {
    console.log(`Application started successfully on port ${port}`)
})