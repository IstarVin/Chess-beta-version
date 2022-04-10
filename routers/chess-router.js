const e = require('express')
const express = require('express')
const { keyLength } = require('../configs')
const { chessIO, cookieParser } = require('../libs/init')
const { 
    rooms,
    createRoom,
    verifyID,
    cleanID,
    addDashes,
    resetRoomTimeout,
    setRoomTimeout,
    deleteRoom,
    generateKey,
    checkAvailableColor,
    checkIfRoomExist,
    findRoomWithKey,
    joinRoom,
    verifyKey,
    findColorWithKey,
} = require('./../libs/rooms')
const chessRouter = express.Router()

chessRouter.use(cookieParser())
chessRouter.param('id', verifyID)

chessRouter.get('/', (req, res) => {
    res.render('chess')
})

chessRouter.get('/create-room', (req, res) => {
    const id = createRoom()
    const key = generateKey()
    const color = req.query.color
    if (id === 'max rooms') res.send(id)
    else if (!(color === 'b' || color === 'w')) res.send('invalid color')
    else {
        rooms[id].players[color] = key
        res.cookie('key', `${key}-${color}`).redirect(`./${addDashes(id)}`)
    }
})

chessRouter.get('/join-room', (req, res) => {
    const undashedId = cleanID(req.query.id)
    const cookieKey = (req.cookies.key) ? req.cookies.key.substring(0, keyLength): null
    if (undashedId) {
        if (checkIfRoomExist(undashedId)) {
            const foundRoomId = (cookieKey) ? findRoomWithKey(cookieKey): null
            if (foundRoomId) {
                res.redirect(`./${addDashes(foundRoomId)}`)
            }
            else {
                res.clearCookie('key')
                const availableColor = checkAvailableColor(undashedId)
                const key = generateKey()
                if (availableColor) {
                    joinRoom(undashedId, availableColor, key)
                    res.cookie('key', `${key}-${availableColor}`)
                }
                else {
                    res.cookie('key', 'spectator')
                }
                res.redirect(`./${addDashes(req.query.id)}`)
            }
        } else res.send('room does not exist')
    } else res.send('no id found')
})

chessRouter.get('/dev', (req, res) => {
    console.log(rooms);
    res.sendStatus(200)
})

chessRouter.get('/:id', (req, res) => {
    const dashedID = addDashes(req.params.id)
    const cookieKey = (req.cookies.key) ? req.cookies.key.substring(0, keyLength): null
    const foundRoomId = (cookieKey && cookieKey !== 'spectator') ? findRoomWithKey(cookieKey): null
    if (dashedID !== req.params.id) res.redirect(`./${dashedID}`)
    else if (!req.cookies.key || (!foundRoomId && !req.cookies.key.includes('spectator'))) res.redirect(`./join-room?id=${addDashes(req.id)}`)
    else {
        res.render('chess')
    }
})

chessRouter.get('/:id/init', (req, res) => {
    const room = checkIfRoomExist(cleanID(req.params.id))
    if (room) {
        res.json({
            fen: room.chess.fen, 
            status: (Object.keys(room.players).length === 2) ? 'ok': 'empty'
        })
    }
    else res.sendStatus(404)
})

chessIO.on('connection', socket => {
    console.log('A user has connected')

    const queryKey = socket.request._query.key
    const id = (socket.request._query.id) ? cleanID(socket.request._query.id): null
    if (queryKey && id) {
        const key = queryKey.substring(0, keyLength)
        const color = queryKey.at(keyLength + 1)
        const room = checkIfRoomExist(id)
        if (room) {
            socket.join(id)
            socket.emit('init', { 
                fen: room.chess.fen, 
                status: (Object.keys(room.players).length === 2) ? 'ok': 'empty'
            })
            
            if (color) socket.to(id).emit('opponent-connect', true)
            else socket.io(id).emit('spectator-connect', true)

            socket.on('move', data => {
                if (verifyKey(key, id)) {
                    resetRoomTimeout(id)
                    if (data.color === room.chess.turn) {
                        let [[fX, fY], [tX, tY]] = data.move.split(" ")
                        fX = parseInt(fX)
                        fY = parseInt(fY)
                        tX = parseInt(tX)
                        tY = parseInt(tY)
                        // console.log(room.chess.fen);
                        room.chess.move([fX, fY], [tX, tY], { promoteTo: data.promoteTo })
                        // console.log(room.chess.fen);
                        socket.to(id).emit('move', data)
                    }
                    else {
                        socket.emit('unscync', 'reload')
                    }
                }
            })
            socket.on('disconnect', reason => {
                delete room.players[color]
                if (color) {
                    socket.to(id).emit('opponent-disconnect', 
                    `${color === 'w' ? 'White': 'Black'} player disconnected. Reason: ${reason}`)

                    if (Object.keys(room.players).length === 0 && rooms[id]) {
                        if (room.chess.winner) {
                            deleteRoom(id)
                        }
                        else {
                            resetRoomTimeout(id)
                        }
                    }
                }
                else {
                    socket.to(id).emit('spectator-disconnect')
                }
            })
        } 
        else {
            socket.emit('error', 'invalidId')
        }
    }

    socket.on('dev', data => {
        console.log(rooms)
    })
    
    socket.on('disconnect' , reason => {
        console.log(`A user has disconnected: ${reason}`)
    })
})

module.exports = chessRouter