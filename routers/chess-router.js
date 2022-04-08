const e = require('express')
const express = require('express')
const { 
    createRoom,
    verifyID,
    cleanID,
    addDashes,
    resetRoomTimeout,
    setRoomTimeout,
    deleteRoom,
} = require('./../libs/rooms')
const chessRouter = express.Router()

chessRouter.param('id', verifyID)

chessRouter.get('/', (req, res) => {
    res.render("index")
})

chessRouter.get('/create-room', (req, res) => {
    const id = createRoom()
    if (id === 'max rooms') res.send(id)
    else {
        res.cookie("roomID", id).render("chess")
    }
})

chessRouter.get('/join-room', (req, res) => {
    if (req.query.id) {
        const id = addDashes(req.query.id)
        res.redirect(`./${id}`)
    } else res.send("no id found")
})

chessRouter.get('/:id', (req, res) => {
    res.send(req.params.id)
})

module.exports = chessRouter