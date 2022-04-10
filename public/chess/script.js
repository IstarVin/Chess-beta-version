let _socket, _chess, _canMove
(function () {
    let _color = 'w'
    let canMove = true
    let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

    let socket

    const roomID = getRoomID()
    if (roomID) {
        const cookie = parseCookie().key
        _color = cookie.at(-1)
        canMove = _canMove = false
        socket = _socket = io('/chess', { query: { key: cookie, id: roomID } })

        const inviteLable = document.getElementById('invite')
        const inviteLink = createElement('a', {
            href: `/chess/join-room?id=${roomID}`,
            rel: 'noopener noreferrer',
            text: 'Invite Link'
        })
        inviteLable.appendChild(inviteLink)

        const loading = document.getElementById('loading')

        const http = new XMLHttpRequest()
        http.open('GET', `./${roomID}/init`, false)
        http.send()
        const data = JSON.parse(http.response)
        fen = data.fen
        if (data.status === 'ok') {
            loading.style.visibility = 'hidden'
            canMove = true
        }

        socket.on('connect', () => {
            socket.on('move', data => {
                if (data.color === chess.turn) {
                    let [[fX, fY], [tX, tY]] = data.move.split(" ")
                    fX = parseInt(fX)
                    fY = parseInt(fY)
                    tX = parseInt(tX)
                    tY = parseInt(tY)
                    move([fX, fY], [tX, tY], data.piece, { promoteTo: data.promoteTo })
                }
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

            socket.on('unsyc', () => {
                window.location.reload()
            })

            socket.on('error', code => {
                if (code === 'invalidId') {
                    window.location.href = '/'
                }
            })
        })
    }
    const chess = _chess = startChessEngine(fen)

    const board = createElement('div', {
        id: 'board'
    })
    const turnLabel = createElement('div', {
        id: 'label'
    })
    const chessElement =  document.getElementById('chess')
    chessElement.appendChild(board)
    chessElement.appendChild(turnLabel)

    const pgnContainer = document.getElementById('pgn')

    const createBoard = () => {
        let i = 0
        const labelContainer = createElement('div', {
            id: 'labelContainer'
        })
        console.log(labelContainer);
        for (let y = 0; y < 8; y++) {
            let num = Math.abs(y - 8)
            for (let x = 0; x < 8; x++) {
                let letter = engine.chessCoordMap[x]

                let evenOdd = (i % 2 == 0) ? "even": "odd"
                const square = createElement("div", {
                    id: `${letter}${num}`,
                    class: "square", 
                    properties: [evenOdd],
                })
                board.appendChild(square)
                if (num === 1) {
                    const label = createElement("a", {
                        class: "label letter", 
                        text: letter, 
                        properties: [evenOdd],
                    })
                    label.style.top = y * gridSize + 'px'
                    label.style.left = x * gridSize + 'px'
                    labelContainer.appendChild(label)
                }
    
                if (letter === "a") {
                    const label = createElement("a", {
                        class: "label num", 
                        text: num,
                        properties: [evenOdd],
                    })
                    label.style.top = y * gridSize + 'px'
                    label.style.left = x * gridSize + 'px'
                    labelContainer.appendChild(label)
                } 
                
                i++
            } i++
        }
        board.appendChild(labelContainer)
    }

    const addPieces = () => {
        let pieces = {}
        for (let y = 0; y < chess.placing.length; y++) {
            const row = chess.placing[y]
            for (let x = 0; x < row.length; x++) {
                const item = row[x]
                if (item) {
                    let num = 1
                    while (pieces[item + num]) num++
                    let index = item + num

                    pieces[item + num] = " "

                    const pieceImgElement = createElement("img", {
                        id: index,
                        class: "piece",
                        src: `/public/res/pieces/${item}.png`,
                    })

                    board.append(pieceImgElement)
                    
                    pieceImgElement.addEventListener('click', (e) => {
                        let x = parseInt(e.target.style.left.replace("px", "")) / gridSize
                        let y = parseInt(e.target.style.top.replace("px", "")) / gridSize

                        const pickedElement = document.querySelector('[picked]')
                        let pickedID
                        if (pickedElement) { 
                            pickedElement.removeAttribute('picked')
                            pickedID = pickedElement.getAttribute('id')
                        }

                        const targetID = e.currentTarget.getAttribute("id")

                        const pathElements = document.querySelectorAll(".path")
                        if (pathElements) pathElements.forEach(element => element.remove())

                        if (pickedID === targetID) return

                        e.currentTarget.setAttribute("picked", "")

                        if (!canMove) return

                        if (targetID[0] !== chess.turn || (_color && _color !== chess.turn)) return
                    
                        const paths = chess.getValidPaths([x, y])

                        for (const [key, value] of Object.entries(paths)) {
                            for (const path of value) {
                                const pathElement = createElement("div", {
                                    class: "path",
                                    path: key
                                })
                                board.appendChild(pathElement).addEventListener("click", (event) => {
                                    move([x, y], path, targetID)

                                })
                                pathElement.style.top = path[1] * gridSize + "px"
                                pathElement.style.left = path[0] * gridSize + "px"
                            }
                        }
                    })
                    pieceImgElement.style.top = y * gridSize + "px"
                    pieceImgElement.style.left = x * gridSize + "px"
                }
            }
        }
    }

    const move = async (from, to, piece, opt = {}) => {
        let promoteTo = opt.promoteTo
        if (piece[1] === "P" && !promoteTo) {
            const promotionY = (piece[0] === "w") ? 0: 7
            if (to[1] === promotionY) {
                let promote = new Promise(resolve => {
                    const promotionOptionElement = createElement('div', {
                        id: 'promoteOpt',
                        class: chess.turn
                    })
                    promotionOptionElement.style.top = to[1] * gridSize + 'px'
                    promotionOptionElement.style.left = to[0] * gridSize + 'px'

                    for (const item of ["Q", "R", "N", "B"]) {
                        const element = createElement('img', {
                            id: item,
                            class: "opt" + (_color === "b"? " blackPerspective": ""),
                            src: `/chess/res/pieces/${chess.turn}${item}.png`
                        })
                        element.addEventListener('click', () => {
                            resolve(e.currentTarget.getAttribute("id"))
                        })
                        promotionOptionElement.appendChild(element)
                    }
                    const cancelOption = createElement("div", {
                        id: "cancelPromote",
                        class: "opt",
                        text: "X"
                    })
                    cancelOption.addEventListener('click', () => {
                        resolve("cancel")
                    })
                    promotionOptionElement.appendChild(cancelOption)
                    board.append(promotionOptionElement)
                })
                promoteTo = await promote
                document.getElementById('promoteOpt').remove()
                if (promoteTo === "cancel") return
            }
        }

        const origPiece = piece.slice()

        if (promoteTo) {
            piece = piece[0] + promoteTo + (parseInt(piece[2]) + 1)
            const origPieceElement = document.getElementById(origPiece)
            origPieceElement.setAttribute('id', piece)
            origPieceElement.setAttribute('src', `/chess/res/pieces/${chess.turn}${promoteTo}.png`)
        }

        const moveResult = chess.move(from, to, { promoteTo })
        if (moveResult === "attack") {
            filterPiece(to[0], to[1]).remove()
        }
        else if (moveResult === "enpassant") {
            
            filterPiece(to[0], from[1]).remove()
        }
        else if (moveResult === "castle") {
            let rookX = (to[0] === 2) ? 0: 7
            let toRookX = (to[0] === 2) ? 3: 5
            movePieceInBoard(filterPiece(rookX, to[1]), toRookX,  to[1])
        }

        movePieceInBoard(piece, to[0], to[1])

        document.querySelectorAll('.path').forEach(element => element.remove())

        // printPGN()
        const checkedKing = document.getElementById(chess.turn + "K1")
        checkedKing.removeAttribute('checked')

        if (chess.nextTurnChecked){
            if (chess.winner) {
                document.getElementById('winnerText').innerText = "Winner: " + (chess.enemy === "w"? "White": "Black")
                const winnerWindowElement = document.getElementById('winnerWindow')
                if (_color) {
                    const whatAreYou = chess.enemy === _color? "win": "lose"
                    winnerWindowElement.setAttribute(whatAreYou, "")
                    document.getElementById('winner').innerText = "You " + whatAreYou
                }
                winnerWindowElement.style.visibility = 'visible'
                //turnLabel.text("Winner: " + (chess.enemy))
            }

            checkedKing.setAttribute("checked", "")
        }
        
        if (roomID && piece[0] === _color){
            socket.emit(`move`, { 
                color: _color, 
                move: `${from[0]}${from[1]} ${to[0]}${to[1]}`, 
                promoteTo, 
                piece: origPiece 
            })
        }
    }

    createBoard()
    addPieces()

    if (_color === "b") {
        board.classList.add("blackPerspective")
        document.querySelectorAll('.piece').forEach(element => element.classList.add('blackPerspective'))
        document.getElementById('labelContainer').classList.add('blackPerspective')
    }
})()