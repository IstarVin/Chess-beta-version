const { maxRooms, timeOutTime, keyLength } = require("./../configs")
const startChessEngine = require('./chess-engine')
const { chessIO } = require("./init")

const chars = "abcdefghijklmnopqrstuvwxyz"

//const rooms = {}
const rooms = {
    abcdefghij: {
        chess: startChessEngine(),
        players: { w: 'abcdefghij-w', b: 'abcdefghij-b' }
    }
}

function generateKey(length = keyLength) {
    let key = ''
    for (let i = 0; i < length; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return key
}

function createRoom() {
    let generatedID = ""

    if (Object.keys(rooms).length > maxRooms) return "max rooms"

    while (true) {
        generatedID = generateKey(10)

        if (!rooms[generatedID]) {
            rooms[generatedID] = {
                chess: startChessEngine(),
                players: {},
                timeOutId: null,
            }
            return generatedID
        } else generatedID = ""
    }
}

function verifyID(req, res, next, id) {
    if (id) {
        req.id = id.replace(/\W/g, "")
        if (!checkIfRoomExist(req.id)) res.send("<script>setTimeout(() => {window.location.href = '/'}, 3000)</script>invalid code")
        else {
            req.chess = rooms[req.id].session
            resetRoomTimeout(req.id)
            next()
        }
    } else {
        console.log("asda");
        res.sendStatus(500)
    }
}

function cleanID(id) {
    return id.replace(/\W/g, "").toLowerCase()
}

function addDashes(id) {
    id = cleanID(id)
    return (id.substring(0, 3) + "-" + id.substring(3, 7) + "-" + id.substring(7, 10))
}

function resetRoomTimeout(roomID) {
    clearTimeout(rooms[roomID].timeOutId)
    setRoomTimeout(roomID)
}

function setRoomTimeout (roomID) {
    rooms[roomID].timeOutId = setTimeout(() => {
        deleteRoom(roomID)
        console.log(rooms[roomID]);
        console.log("room " + roomID + " deleted");
        chessIO.to(roomID).emit('room-deleted', true)
    }, timeOutTime)
}

function deleteRoom(roomID) {
    delete rooms[roomID]
}

// function getRoom(roomID) {
//     return rooms[roomID]
// }
function findWithKey(key) {
    for (const [roomID, roomValue] of Object.entries(rooms)) {
        for (const  [color, _key] of Object.entries(roomValue.players)) {
            if (_key === key) {
                return { roomID, color }
            }
        }
    }
    return {}
}

function findRoomWithKey(key) {
    return findWithKey(key)
}

function findColorWithKey(key) {
    return findWithKey(key).color
}

function verifyKey(key, roomID) {
    return roomID === findRoomWithKey(key)
}

function checkAvailableColor(roomID) {
    if (!rooms[roomID].players.w) return 'w'
    else if (!rooms[roomID].players.b) return 'b'
}

function checkIfRoomExist(roomID) {
    return rooms[roomID]
}

function joinRoom(roomID, color, key) {
    rooms[roomID].players[color] = key
}

function name(params) {
    
}

module.exports = {
    rooms,
    createRoom,
    verifyID,
    cleanID,
    addDashes,
    resetRoomTimeout,
    setRoomTimeout,
    deleteRoom,
    // getRoom,
    generateKey,
    checkAvailableColor,
    checkIfRoomExist,
    findRoomWithKey,
    findColorWithKey,
    joinRoom,
    verifyKey,
}