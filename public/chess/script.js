let _socket, _chess
(function () {
    let _color = 'w'
    let canMove = true
    let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

    const roomID = getRoomID()
    if (roomID) {
        const cookie = parseCookie().key
        _color = cookie.at(-1)
        canMove = false
        const socket = _socket = io('/chess', { query: { key: cookie, id: roomID } })

        socket.on('connect', () => {
            socket.on('init', data => {
                fen = data.fen
                console.log(fen);
            })

            socket.on('move', data => {
                console.log(data);
            })

            socket.on('opponent-connect', data => {
                canMove = true
            })

            socket.on('opponent-disconnect', data => {
                console.log(data);
            })

            socket.on('room-deleted', () => {
                //room deleted
                window.location.href = '/'
            })

            socket.on('error', code => {
                if (code === 'invalidId') {
                    window.location.href = '/'
                }
            })
        })
    }
    const engine = startChessEngine()

})()