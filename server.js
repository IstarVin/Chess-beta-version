const cookieParser = require('cookie-parser')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)

const chessIO = io.of("/chess")

const chessRouter = require('./routers/chess-router')
const PORT = process.env.PORT || 1234

app.set('view engine', 'pug')
app.use('/chess-engine.js', express.static('./libs/chess-engine.js'))
app.use('/public', express.static('./public'))
app.use('/chess', chessRouter)
app.use(cookieParser())

app.get('/', (req, res) => {
    res.render('index')
})

chessIO.on('connection', socket => {
    
})

server.listen(PORT, () => {
    console.log(`Chess server running on port ${PORT}`)
})