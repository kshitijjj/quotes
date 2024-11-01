const express = require('express');
const app = express();
const fs = require('fs');
const cors = require('cors');
const { Users } = require('./db.js');
const { jwtAuthMiddleware, generateToken } = require('./jwt.js');
const { UserInfo } = require("./db.js");
const { UserQuotes } = require("./db.js")
const { userInfo } = require('os');
const { json } = require('body-parser');

app.use(cors());
console.log(UserQuotes)
app.use(express.json());



const data = fs.readFileSync('quotes.json', 'utf-8');
const quotes = JSON.parse(data);

app.get("/search", (req, res) => {
    const category = req.query.query;
    const isquote = quotes.filter((q) =>
        q.tags.some((tag) => tag.toLowerCase().includes(category.toLowerCase()))
    );

    console.log(isquote)

    if (isquote.length === 0) {
        return res.status(400).json({ message: "No results found" });
    } else {
        return res.status(200).json({
            message: "Quotes Found Successfully",
            filterQuotes: isquote
        });
    }
});

app.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    console.log({ name, email, password });

    try {
        const isuser = await Users.findOne({ email });
        if (isuser) {
            return res.status(400).json({ message: "User already exists!" });
        }

        const newuser = new Users({ name, email, password });
        await newuser.save();

        const token = generateToken({ id: newuser._id, email: newuser.email });

        res.status(200).json({
            message: "User Signup Successfully",
            userDetails: { token, name: newuser.name, email: newuser.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const isemail = await Users.findOne({ email });
        if (!isemail) {
            return res.status(404).json({ message: "Email ID not found! User doesn't exist" });
        }

        const isPasswordMatch = await isemail.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const token = generateToken({ id: isemail._id, email: isemail.email });
        res.status(200).json({
            message: "User Login Successfully",
            UserLoginDetails: { token, name: isemail.name, email: isemail.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/user', jwtAuthMiddleware, async (req, res) => {
    try {
        const { name } = req.query;
        const user = await Users.findById(req.user.id).select('-password'); // Exclude password from response

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the name parameter is provided
        if (name) {
            if (user.name !== name) {
                // If the username does not match, return a 401 status
                return res.status(401).json({ message: "User with name not found" });
            }
        }

        // Respond with user information
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post("/quotes/like", jwtAuthMiddleware, async (req, res) => {
    try {
        const { qid } = req.body;
        const quote = quotes[qid]
        const isuser = await UserInfo.findOne({ userId: req.user.id })

        if (!isuser) {
            console.log("User nhi h")
            const likedb = new UserInfo({ userId: req.user.id, likedQuotes: [quote.quotes] })
            await likedb.save()
            res.status(200).json({ message: "Quotes liked Successfully" })
        }

        else {
            const isQuoteLiked = isuser.likedQuotes.includes(quote.quotes);

            if (!isQuoteLiked) {
                await UserInfo.findOneAndUpdate(
                    { userId: req.user.id },
                    {
                        $push: { likedQuotes: quote.quotes },
                    })
                res.status(200).json({ message: "Another Quotes liked Successfully" })
            }
            else {
                await UserInfo.findOneAndUpdate(
                    { userId: req.user.id },
                    { $pull: { likedQuotes: quote.quotes } }
                )
                res.status(200).json({ message: "Quotes Unliked Successfully" })
            }
        }
    }

    catch (error) {
        console.log(error)
        res.status(401), json({ message: "Error" })
    }
})

app.post("/quotes/save", jwtAuthMiddleware, async (req, res) => {
    try {
        const { qid } = req.body;
        const quote = quotes[qid]
        const isuser = await UserInfo.findOne({ userId: req.user.id })

        if (!isuser) {
            console.log("User nhi h")
            const savedb = new UserInfo({ userId: req.user.id, savedQuotes: [quote.quotes] })
            await savedb.save()
            res.status(200).json({ message: "Quotes saved Successfully" })
        }

        else {
            const isQuoteSaved = isuser.savedQuotes.includes(quote.quotes);

            if (!isQuoteSaved) {
                await UserInfo.findOneAndUpdate(
                    { userId: req.user.id },
                    {
                        $push: { savedQuotes: quote.quotes },
                    })
                res.status(200).json({ message: "Another Quotes saved Successfully" })
            }
            else {
                await UserInfo.findOneAndUpdate(
                    { userId: req.user.id },
                    { $pull: { savedQuotes: quote.quotes } }
                )
                res.status(200).json({ message: "Quotes unsaved Successfully" })
            }
        }
    }

    catch (error) {
        console.log(error)
        res.status(401), json({ message: "Error" })
    }
})


app.post("/write/quotes", jwtAuthMiddleware, async (req, res) => {
    try {
        const data = req.body;
        const user=await Users.findById(req.user.id)
        console.log(user.name)

        // Write the JSON data to a file
        let fileData = [];
        if (fs.existsSync('userq.json')) {
            const existingData = fs.readFileSync('userq.json', 'utf-8');
            fileData = existingData ? JSON.parse(existingData) : [];
        }

        // Append the new data to the existing data
        fileData.push(...data);

        // Write the updated data back to userq.json
        fs.writeFileSync('userq.json', JSON.stringify(fileData, null, 2), 'utf-8');
        console.log(typeof data); // Should log 'object' if data is an object

        // Check if a UserQuotes document already exists for this user
        const userquoteId = await UserQuotes.findOne({ userId: req.user.id });

        if (!userquoteId) {
            const quotesArray = data.map((item) => ({
                quotesName: item.quote,
                avatar: item.avatar,
                date: item.date,
                likes: 0
            }));

            // Create a new UserQuotes document with userId and quotes array
            const newuser = new UserQuotes({
                userId: req.user.id,
                quotes: quotesArray
            });

            // Save the new document to the database
            await newuser.save();
            res.status(200).json({username:user.name})

        }

        else if(userquoteId){
            const quotesArray1 = data.map((item) => ({
                quotesName: item.quote,
                avatar: item.avatar,
                date: item.date,
                likes: 0
            }));

            await UserQuotes.findOneAndUpdate(
                {userId:req.user.id},
                {$push:{quotes:quotesArray1}}
            )
        }
        res.status(200).json({ message: "Quotes processed successfully" });
    } catch (error) {
        console.error("Error in /write/quotes:", error);
        res.status(500).json({ error: "An error occurred while processing quotes" });
    }
});



app.listen(3001, () => {
    console.log("Server connected successfully");
});
