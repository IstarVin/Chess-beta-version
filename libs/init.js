const cookieParser = require('cookie-parser')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)

const chessIO = io.of('/chess')

module.exports = {
    cookieParser,
    express,
    app,
    io,
    server,
    chessIO
}