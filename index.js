require('dotenv').config();
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const path = require("path");
const { Server } = require("socket.io");
const mongoose=require("mongoose");
const CodeShare=require("./models/model");
const fs=require("fs");

mongoose.connect(process.env.MONGODB_URI).then(()=>console.log("connected")).catch(()=>console.log("Error"));

app.set("view engine","ejs");
app.set("views",path.resolve("./views"));

app.use(express.static(path.resolve("./public")));


app.get("/", (req, res) => {
    return res.sendFile(path.resolve("./public/index.html"));
});

app.get("/downloadcode",async (req,res)=>{
    let ext = req.query.ext;
    if(!ext)ext="txt";
    const fileContent = req.query.editor;
    const fileName = `sample.${ext}`;

    try {
        fs.writeFileSync(fileName, fileContent);
        res.download(fileName, (err) => {
            if (err) {
                res.status(500).send("Error downloading the file.");
            }
            else {
                fs.unlink(fileName, (unlinkErr) => {
                    if (unlinkErr) {
                        console.log("Error deleting the file: " + unlinkErr);
                    } else {
                        console.log(`File ${fileName} deleted successfully.`);
                    }
                });
            }
        });
    } 
    catch (error) {
        res.status(500).send("Error creating the file.");
    }
});

app.get("/:id", async (req, res) => {
    const roomId = req.params.id;
    const content=await CodeShare.findOne({roomId:roomId});
    return res.render("room",{content:content?.roomContent??""});
});

const io = new Server(server);
let saveTimeout;

io.on("connection", (socket) => {
    socket.on("joinRoom", (data) => {
        const { room, username } = data;
        socket.join(room);
        socket.username = username;
        io.to(room).emit("userJoined", `${username} has joined ${room}`);
    });

    socket.on("disconnecting", () => {
        const rooms = Array.from(socket.rooms).filter(room=>room!==socket.id);
        rooms.forEach(room => {
            socket.to(room).emit("userLeft", `${socket.username} has left ${room}`);
        });
    });
    
    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });    

    socket.on("txtmsg", async (data) => {
        const { room, message } = data;
        socket.to(room).emit("txtmsgres", message);
        clearTimeout(saveTimeout);
        saveTimeout=setTimeout(async()=>{
            try {
                const existingRoom = await CodeShare.findOne({ roomId: room });
                if (existingRoom) {
                    existingRoom.roomContent = message;
                    await existingRoom.save();
                } else {
                    const newRoom = await CodeShare.create({
                        roomId: room,
                        roomContent: message,
                    });
                }
                if(!message){
                    if(existingRoom){
                       await existingRoom.deleteOne();
                    }
                }
            } catch (error) {
                console.error("Error saving content:", error);
            }
        },3000);
    });
});

server.listen(PORT, () => {
    console.log("Server Started");
});
