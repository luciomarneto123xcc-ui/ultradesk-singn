const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const users = {};
const socketToUser = {};
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join', (customId) => {
        const userId = customId || socket.id;
        users[userId] = socket.id;
        socketToUser[socket.id] = userId;
        console.log(`User ${userId} registered with socket ${socket.id}`);
        socket.emit("me", userId);
    });
    socket.on("disconnect", () => {
        const userId = socketToUser[socket.id];
        delete users[userId];
        delete socketToUser[socket.id];
        console.log("User disconnected:", socket.id);
        socket.broadcast.emit("callEnded");
    });
    socket.on("callUser", (data) => {
        const socketIdToCall = users[data.userToCall];
        if (socketIdToCall) {
            io.to(socketIdToCall).emit("callUser", {
                signal: data.signalData,
                from: data.from,
                name: data.name
            });
        }
    });
    socket.on("answerCall", (data) => {
        const socketIdToCall = users[data.to];
        if (socketIdToCall) {
            io.to(socketIdToCall).emit("callAccepted", data.signal);
        }
    });
    socket.on("ice-candidate", (data) => {
        const socketIdToCall = users[data.to];
        if (socketIdToCall) {
            io.to(socketIdToCall).emit("ice-candidate", { 
                candidate: data.candidate, 
                from: data.from 
            });
        }
    });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Signaling server is running on port ${PORT}`);
});
