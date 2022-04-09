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

        const inviteLable = document.getElementById('invite')
        const inviteLink = createElement('a', {
            href: `/chess/join-room?id=${roomID}`,
            rel: 'noopener noreferrer',
            text: 'Invite Link'
        })
        inviteLable.appendChild(inviteLink)

        const loading = document.getElementById('loading')

        socket.on('connect', () => {
            socket.on('init', data => {
                fen = data.fen
                if (data.status === 'ok') {
                    loading.style.visibility = 'hidden'
                    canMove = true
                }
            })

            socket.on('move', data => {
                console.log(data);
            })

            socket.on('opponent-connect', data => {
                loading.style.visibility = 'hidden'
                canMove = true
            })

            socket.on('opponent-disconnect', data => {
                loading.style.visibility = 'visible'
                loading.innerText = data
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
    const engine = _chess = startChessEngine(fen)



})()