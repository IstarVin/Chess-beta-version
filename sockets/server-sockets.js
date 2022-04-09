module.exports = function socketInit(server) {
    const { Server } = require('socket.io')
    const io = new Server(server)

    const chessIO = io.of("/chess")
    return {
        io,
        chessIO
    }
}