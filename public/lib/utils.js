function parseCookie() {
    let parsed
    document.cookie
    .split(';')
    .map(v => v.split('='))
    .reduce((acc, v) => {
        acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
        parsed = acc;
    }, {})
    return parsed
}

function getRoomID() {
    const roomID = document.location.href.match(/\w\w\w-\w\w\w\w-\w\w\w/)
    return roomID ? roomID.at(0): null
}

function createElement(name, options = {}) {
    const element = document.createElement(name)
    for (const [attr, value] of Object.entries(options)) {
        if (attr === 'text') element.innerText = value
        else if (attr === 'properties') {
            element.setAttribute(value, '')
        }
        else element.setAttribute(attr, value)
    }
    return element
}

const movePieceInBoard = (piece, x, y) => {
    const pieceElement = document.getElementById(piece)
    pieceElement.style.top = y * gridSize + 'px'
    pieceElement.style.left = x * gridSize + 'px'
}

const printPGN = () => {
    if ($("#PGN" + chess.PGN.length).length === 0){
        pgnContainer.append($(createElement("div", {
            id: "PGN" + chess.PGN.length,
            class: "pgnItems",
        })))
    }

    if ($("#PGN" + chess.PGN.length + "> .itemNumber").length === 0){
        $("#PGN" + chess.PGN.length).append($(createElement("span", {
            class: "itemNumber"
        })).text(chess.PGN.length + ". "))

        $("#PGN" + chess.PGN.length).append($(createElement("span", {
            class: "item"
        })))
    }
    $("#PGN" + chess.PGN.length + "> .item").text(`${chess.PGN[chess.PGN.length - 1]}`)
}

const filterPiece = (x, y) => {
    let foundElement
    document.querySelectorAll('.piece').forEach(element => {
        const style = getComputedStyle(element)
        if (style.top === y * gridSize + "px" && style.left === x * gridSize + "px") {
            foundElement = element
            return
        }
    })
    return foundElement
}