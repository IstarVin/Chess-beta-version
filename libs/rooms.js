const { maxRooms, timeOutTime } = require("./../configs")
const startChessEngine = require('./chess-engine')

const rooms = {}

function createRoom() {
    const chars = "abcdefghijklmnopqrstuvwxyz"
    let generatedID = ""

    if (Object.keys(rooms).length > maxRooms) return "max rooms"

    while (true) {
        for (let i = 0; i < 10; i++) {
            generatedID += chars.charAt(Math.floor(Math.random() * chars.length))
        }

        if (!rooms[generatedID]) {
            rooms[generatedID] = {
                chess: startChessEngine(),
                players: { w, b },

            }
            return generatedID
        } else generatedID = ""
    }
}

function verifyID(req, res, next, id) {
    if (id) {
        req.id = id.replace(/\W/g, "")
        if (!rooms[req.id]) res.send("<script>setTimeout(() => {window.location.href = '/'}, 3000)</script>invalid code")
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
    return id.replace(/\W/g, " ").toLowerCase()
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
        console.log("room " + roomID + " deleted");
        deleteRoom(roomID)
    }, timeOutTime)
}

function deleteRoom(roomID) {
    delete rooms[roomID]
}

module.exports = {
    createRoom,
    verifyID,
    cleanID,
    addDashes,
    resetRoomTimeout,
    setRoomTimeout,
    deleteRoom,
    rooms
}