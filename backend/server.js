const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const colors = require('colors');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const mongoose = require('mongoose');
const {notFound, errorHandler} = require('./middleware/errorMiddleware');

const app = express();

dotenv.config();


app.use((req,res,next)=> {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, OPTIONS, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type, Authorization');
    next();
})

app.use(bodyParser.json());

// app.get('/',(req,res)=> {
//     res.json({name:'anurag'});
// })

// app.get('/',(req,res,next)=> {
//     res.send("API is Running!");
//     next();
// })

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.set('strictQuery', true);

mongoose.connect(MONGO_URI).then(result=> {
     console.log('database connected!'.green.bold);
     const server = app.listen(8080, console.log(`server is running! ${PORT}`.yellow.underline));
     const io = require("socket.io")(server,{
        pingTimeout: 60000,
        cors: {
            origin: "http://localhost:3000"
        }
     }) 
     io.on("connection",(socket) => {
       console.log("conneted to socket.io");

       socket.on('setup', (userData) => {
         socket.join(userData._id);
         socket.emit("connected")
       })

       socket.on('join chat', (room) => {
         socket.join(room);
         console.log("User joined room: "+ room)
       })

       socket.on('typing', (room) => socket.in(room).emit("typing"))
       socket.on('stop typing', (room) => socket.in(room).emit("stop typing"))

       socket.on('new message', (newMessageRecieved) => {
         var chat = newMessageRecieved.chat;
        
         console.log(chat);

         if(!chat.users){
            return console.log('chat.user not defined!');
         }

         chat.users.forEach(user => {
           if(user._id == newMessageRecieved.sender._id)
           return;
           socket.in(user._id).emit("message received", newMessageRecieved);
         })
       })

       socket.off("setup", ()=> {
        console.log("user disconnected");
        socket.leave(userData._id);
       })
     })
    }
).catch(err=> {
    console.log(`Error: ${err.message}`.red.bold);
})