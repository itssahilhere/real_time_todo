import mongoose from "mongoose";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import Task from "./task.schema.js";

const app = express();
app.use(cors());

export const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});

io.on("connection", (socket) => {
    console.log("User connected");

    // Fetch and send previous tasks
    Task.find({})
        .sort({ timestamp: 1 })
        .limit(50)
        .then((tasks) => {
            io.emit("previousMessages", tasks);
        })
        .catch((err) => {
            console.log(err);
        });

    // Handle adding a new task
    socket.on("add-task", (task) => {
        const newTask = new Task({ text: task });
        newTask
            .save()
            .then((savedTask) => {
                io.emit("task-added", savedTask);
            })
            .catch((err) => {
                console.log(err);
            });
    });

    // Handle updating a task
    socket.on("update-task", ({ id, text }) => {
        Task.findByIdAndUpdate(id, { text }, { new: true })
            .then((updatedTask) => {
                if (updatedTask) {
                    io.emit("task-updated", updatedTask);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    });

    // Handle deleting a task
    socket.on("delete-task", (id) => {
        Task.findByIdAndDelete(id)
            .then((deletedTask) => {
                if (deletedTask) {
                    io.emit("task-deleted", id);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    });

    socket.on("disconnect", () => {
        console.log("Connection disconnected.");
    });
});
