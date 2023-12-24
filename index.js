const express = require('express');
const jwt = require("jsonwebtoken");
const fs = require('fs');
const mongoose = require("mongoose");

const secretkey = "Pushpdeep@123";


const app = express();
const PORT = 5028;

//COONECTION with mongoDB

mongoose.connect("mongodb://127.0.0.1:27017/Blog_spot")
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log("Mongo err",err));

//Schema
const userSchema =  new mongoose.Schema({
    firstName: {
        type:String,
        required: true
    },
    lastName: {
        type:String,
        required: false
    },
    email: {
        type: String,
        required: true,
        unique:true
    },
    location: {
        type: String,
        required:true
    },
    
    
}, {timestamps:true} );

const User = mongoose.model("user",userSchema);

//Middleware - pluggin
app.use(express.urlencoded({extended: false}));

app.use((req,res,next)=>{
    fs.appendFile("log.txt",`\n${Date.now()}:{req.ip} ${req.method} ${req.path}\n`,(err,data)=>{
        next();
    });
});


//Routes
app.get("/users", async (req,res) => {
    const allDbUsers = await User.find({});
    const html = `
    <ul>
       ${allDbUsers.map((user)=> `<li>${user.firstName} - ${user.email}</li>`).join("")}
    </ul>
    `;
    res.send(html);
});

//Rest API
app.get("/api/users", async (req, res)=>{
    const allDbUsers = await User.find({});
    return res.json(allDbUsers);
})

app.get("/api/users/:id", async(req,res) => {
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({error: "user not found"});
    return res.json(user);
});

app.post("/api/users", async (req,res)=>{
    const body = req.body;
    if(
        !body.first_name ||
        !body.last_name || 
        !body.email ||
        !body.location
    ) {
        return res.status(400).json({ msg: "All fields are req..."});
    }
    
    const result = await User.create({
        firstName: body.first_name,
        lastName: body.last_name,
        email: body.email,
        location: body.location,
    });


    return res.status(201).json({msg: "success"});
});

app.patch("/api/users:id",async (req,res)=>{
    await User.findByIdAndUpdate(req.params.id,{ lastName: "changed" });
    return res.json({status:"Success"});
});

app.delete("/api/users:id",async (req,res)=>{
    await User.findByIdAndDelete(req.params.id);
    return res.json({status:"Success"});
});

app.post("/login",(req,res)=>{
    const user = {
        id: req.params.id,
        email: req.params.email
    }

    jwt.sign({user},secretkey,{expiresIn: '300s'},(err,token)=>{
        res.json({
            token
        })
    })
});

app.post("/profile",verifyToken,(req,res)=>{
    jwt.verify(req.token,secretkey,(err,authData)=>{
        if(err){
            res.send({result:"Invalid token"});
        }
        else{
            res.json({
                message: "profile accessed",
                authData
            })
        }

        })
    })

function verifyToken(req,res,next){
    const header = req.headers['authorization'];
    if(typeof header !== 'undefined')
    {
        const bearer = header.split(" ");
        const token = bearer[1];
        req.token = token;
        next();
    }
    else{
        res.send({
            result:"Token not valid"
        })
    }
}

app.listen(PORT, ()=> console.log('Server Started ar PORT:${PORT}'))