class engine {
    static chessCoordMap = {
        a: 0,
        b: 1,
        c: 2,
        d: 3,
        e: 4,
        f: 5,
        g: 6,
        h: 7,
        0: 'a',
        1: 'b',
        2: 'c',
        3: 'd',
        4: 'e',
        5: 'f',
        6: 'g',
        7: 'h',
    }

    constructor(fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
        this.startGame(fen)
    }

    startGame(fen) {
        this._fen = fen
        this.placing = null
        this.turn = null
        this.castleAvailability = {
            w: {
                K: null,
                Q: null
            },
            b: {
                K: null,
                Q: null
            }
        }
        this.enPassant = null
        this.halfMoves = null
        this.fullMoves = null

        this.winner = null

        this.pastMove = {move: null, promoteTo: null}

        this.currentPGN = ""
        this.tempPGN = ""
        this.PGN = []

        this.nextTurnChecked = false
        
        this.decodeFen(this._fen)

        return this
    }

    move(from, to, opt = {}) {
        if (this.winner) throw "There's already a winner"
        let fromX, fromY, toX, toY
        
        if (typeof from === "string") [fromX, fromY] = engine._chessCoordsToNumber(from)
        else if (typeof from === "object") [fromX, fromY] = from
        else throw "invalid from"
        
        if (typeof to === "string") [toX, toY] = engine._chessCoordsToNumber(to)
        else if (typeof to === "object") [toX, toY] = to
        else throw "invalid destination"

        const piece = this.placing[fromY][fromX]
        const toPiece = this.placing[toY][toX]
        const chessNameFrom = (typeof from === "string") ? from: engine._numberToChessCoords(from)
        const chessNameTo = (typeof to === "string") ? to: engine._numberToChessCoords(to)
        const [file, rank] = chessNameFrom
        const [color, pc] = piece
        let attacking = false
        let enableEnpassant = false
        let moveResult = "normal"

        if (!piece) throw "No piece located"

        const paths = this.getValidPaths(from)
        let promoteTo = null
        //if (this.tempPGN.length > 0) this.tempPGN += " "

        if (color == this.turn) {
            if (this.utils.checkIfContains(paths.path.concat(paths.attack), [toX, toY])) {
                if (this.utils.checkIfContains(paths.attack, [toX, toY])) {
                    moveResult = "attack"
                    attacking = true
                }
                if (pc === "P") {
                    if (Math.abs(toY - fromY) == 2) {
                        this.enPassant = engine._numberToChessCoords([toX, (fromY + toY) / 2])
                        enableEnpassant = true
                    }
                    this.halfMoves = 0
                    if (this.utils.checkIfContains(paths.attack, [toX, toY])) {
                        this.tempPGN += file
                        if (!toPiece) {
                            this._enPassantAttack([toX, fromY])
                            moveResult = "enpassant"
                        }
                    }

                    const pawnPromotion = (color == "w") ? 0: 7
                    if (toY == pawnPromotion) {
                        if (!opt.promoteTo) {
                            if (this.tempPGN.split(" ").length === 2) 
                                this.tempPGN = this.tempPGN.split(" ")[1]
                            else this.tempPGN = ""
                            throw "Pick a promotion"
                        }
                        promoteTo = color + opt.promoteTo
                    }
                }
                else {
                    if (pc === "K") {
                        this.castleAvailability[color].K = false
                        this.castleAvailability[color].Q = false
                    }
                    else if (pc === "R") {
                        let side = (toX == 2) ? "Q": "K"
                        this.castleAvailability[color][side] = false
                    }

                    this.tempPGN += pc

                    if (pc === "R" || pc === "N") {
                        const pgnValidatorResult = this._pgnValidator(
                            [fromX, fromY],[toX, toY], piece)
                        if (pgnValidatorResult) {
                            if (pgnValidatorResult === "sameFile")
                                this.tempPGN += rank
        
                            else this.tempPGN += file
                        }
                    }

                    this.halfMoves++
                }
                if (attacking) 
                    this.tempPGN += "x"
            
                this.tempPGN += chessNameTo
                this.tempPGN += (promoteTo) ? "=" + opt.promoteTo: ""
                this._move([fromX, fromY], [toX, toY], promoteTo)
            }
            else if (this.utils.checkIfContains(paths.castle, [toX, toY])) {
                this.castleAvailability[color].K = false
                this.castleAvailability[color].Q = false

                const fromRookX = (toX == 2) ? 0: 7
                const toRookX = (toX == 2) ? 3: 5
                this.tempPGN += (toX == 2) ? "0-0-0": "0-0"

                this._move([fromX, fromY], [toX, toY])
                this._move([fromRookX, fromY], [toRookX, toY])

                moveResult = "castle"
            }
            else throw "invalid destination"
        } else throw "not current turn"

        this.enPassant = (enableEnpassant) ? this.enPassant: null
        
        if (this.checkIfChecked(this.enemy)) {
            if (this.checkIfMate(this.enemy)) {
                this.winner = this.turn
                this.tempPGN += "#"
            }
            else this.tempPGN += "+"

            this.nextTurnChecked = true
        }else this.nextTurnChecked = false

        if (this.turn === "b") {
            this.PGN[this.PGN.length - 1] += " " + this.tempPGN
        }
        else if (this.turn == "w") {
            this.PGN.push(this.tempPGN)
        }
        this.tempPGN = ""
        this.pastMove.move = `${fromX}${fromY} ${toX}${toY}`
        this.pastMove.promoteTo = opt.promoteTo
        this._nextTurn()

        return moveResult
    }

    getValidPaths(pieceCoord, opt = {}) {
        let x, y
        if (typeof pieceCoord === "object") [x, y] = pieceCoord
        else if (typeof pieceCoord === "string") [x, y] = engine._chessCoordsToNumber(pieceCoord)
        else throw "invalid input"

        const isPGNForm = opt.isPGNForm || false

        const piece = opt.pc || this.placing[y][x]
        const paths = this.pathCalc(x, y, {pc: piece})

        let validPaths = {
            path: [],
            attack: [],
            castle: []
        }

        for (const [key, value] of Object.entries(paths)) {
            for (const path of value) {
                let mockPlacing = JSON.parse(JSON.stringify(this.placing))
                const [pathX, pathY] = path

                mockPlacing[pathY][pathX] = mockPlacing[y][x]
                mockPlacing[y][x] = null

                let form = (isPGNForm) ? engine._numberToChessCoords(path): path
                if (!this.checkIfChecked(piece[0], mockPlacing)) {
                    if (key === "castle") {
                        const shouldBeClearPathX = (pathX === 2) ? 3: 5
                        if (!this.utils.searchArray(validPaths.path, [shouldBeClearPathX, pathY]))
                            continue
                    }
                    validPaths[key].push(form)
                }
            }
        }

        return validPaths
    }

    checkIfMate(color) {
        for (const path of this.utils.searchForPiecesPath(color)) {
            const paths = this.getValidPaths(path)
            for (const [key, value] of Object.entries(paths)) {
                if (value.length > 0) return false
            }
        }

        return true
    }

    checkIfChecked(color, placing = this.placing) {
        const [kingX, kingY] = this.utils.searchForPiecePath(color + "K", placing)
        const itemPathCheck = [color + "B", color + "N", color + "R", color + "P"]
        for (const item of itemPathCheck) {
            const paths = this.pathCalc(kingX, kingY, {placing: placing, pc: item})
            for (const [pathX, pathY] of paths.attack) {
                const pathItem = placing[pathY][pathX][1]
                if (pathItem == item[1] || ((item[1] == "R" || 
                    item[1] == "B") && pathItem == "Q")) 
                return true
            }
        }
        return false
    }

    pathCalc(x, y, opt = {}) {
        const placing = opt.placing || this.placing
        const [color, piece] = (opt.pc) ? opt.pc: placing[y][x]
        const self = this
        
        let paths = {
            path: [],
            attack: [],
            castle: []
        }

        _pathCalc(x, y, piece)

        function filter(pathX, pathY, opt = {}) {
            const pawn = opt.pawn
            const castle = opt.castle

            if (pathX >= 0 && pathX < 8 && pathY >= 0 && pathY < 8) {
                const _piece = placing[pathY][pathX]

                if (_piece) {
                    const [_color, _item] = _piece
                    if (_color != color) {
                        if (!pawn || pawn == "attack") paths.attack.push([pathX, pathY])
                    }
                    return false
                }

                else if (pawn === "enPassant") paths.attack.push([pathX, pathY])

                else {
                    if (castle) paths.castle.push([pathX, pathY])
                    else if (!pawn || pawn === "path") paths.path.push([pathX, pathY])
                }
                
                return true
            }
            else return false
        }

        function _pathCalc(itemX, itemY, _piece) {
            if (_piece === "K") {
                const signs = ["+", "-", "*"]
                for (let i = 0; i < signs.length; i++) {
                    const sign = signs[i];
                    for (let z = 0; z < signs.length; z++) {
                        const sign2 = signs[z];
                        var x_ = eval(`${itemX}${sign}1`)
                        var y_ = eval(`${itemY}${sign2}1`)

                        filter(x_, y_)
                    }
                }

                ["K", "Q"].forEach((side) => {
                    if (self.castleAvailability[color][side]){
                        if (side === "K") {
                            if (!placing[itemY][5] && !placing[itemY][6]) {
                                filter(6, itemY, {castle: true})
                            }
                        }
                        else {
                            if (!placing[itemY][1] && !placing[itemY][2] && !placing[itemY][3]) {
                                filter(2, itemY, {castle: true})
                            }
                        }
                    }
                })
            }
    
            else if (_piece === "Q") {
                _pathCalc(itemX, itemY, "R")
                _pathCalc(itemX, itemY, "B")
            }
    
            else if (_piece === "B") {
                const multiplier = [[1,1],[-1,-1],[1,-1],[-1,1]]
                for (let a = 0; a < 4; a++) {
                    for (let i = 1; i < 8; i++) {
                        const x_ = itemX + i * multiplier[a][0]
                        const y_ = itemY + i * multiplier[a][1]
    
                        if (!filter(x_, y_)) break
                    }
                }
            }
    
            else if (_piece === "N") {
                const multiplier = [1, -1]
                const knight = [1, 2]
                for (let a = 0; a < 2; a++) {
                    for (let b = 0; b < 2; b++) {
                        for (let i = 0; i < 2; i++) {
                            const c = (a == 0) ? 1: 0
                            const d = (i == 0) ? 1: 0
    
                            const x_ = itemX + knight[i] * multiplier[b]
                            const y_ = itemY + knight[d] * multiplier[c]
    
                            filter(x_, y_)
                        }
                    }
                }
            }
    
            else if (_piece === "R") {
                const multiplier = [1, -1]
                const zeroes = [0, 1]
                for (let a = 0; a < 2; a++) {
                    for (let b = 0; b < 2; b++) {
                        for (let i = 1; i < 8 ; i++) {
                            const c = (a == 0) ? 1: 0
                            const x_ = itemX + i * multiplier[b] * zeroes[a]
                            const y_ = itemY + i * multiplier[b] * zeroes[c]
    
                            if (!filter(x_, y_)) break
                        }
                    }
                }
            }
    
            else if (_piece === "P") {
                const sign = (color == "w") ? "-": "+"
                const initPawnY = (color == "w") ? 6: 1
                const thirdRank = (color == "w") ? 2: 5
    
                for (let i = 0; i < 2; i++) {
                    const _y = eval(`${y}${sign}${i + 1}`)
                    if (!filter(itemX, _y, {pawn: "path"})) break
    
                    if (itemY != initPawnY) break
                }
    
                const sign2 = ["+", "-"]
    
                for (let sym of sign2) {
                    const _x = eval(`${itemX}${sym}1`)
                    const _y = eval(`${itemY}${sign}1`)
                    var attackType = (self.enPassant && 
                        engine._numberToChessCoords([_x, _y]) === self.enPassant &&
                        _y == thirdRank) 
                        ? "enPassant": "attack"
                    filter(_x, _y, {pawn: attackType})
                }
            }
        }

        return paths
    }

    utils = {
        searchForPiecePath: (item, placing = this.placing) => {
            for (let y = 0; y < placing.length; y++) {
                const row = placing[y]
                for (let x = 0; x < row.length; x++) {
                    const piece = row[x];
                    if (piece === item) return [x, y]
                }
            }
        },

        searchForPiecesPath: (item, placing = this.placing) => {
            let paths = []
            for (let y = 0; y < placing.length; y++) {
                const row = placing[y]
                for (let x = 0; x < row.length; x++) {
                    const piece = row[x];
                    if (piece && piece.includes(item))
                        paths.push([x, y])
                }
            }

            return paths
        },

        checkIfContains: (arr, search) => {
            for (const item of arr) {
                if (item[0] == search[0] && item[1] == search[1]) return true
            }
            return false
        },

        searchArray(arr, keyword) {
            for (const item of arr) {
                if (item[0] == keyword[0] && item[1] == keyword[1]) return true
            }
            return false
        }
    }

    get enemy() {
        return (this.turn === "w") ? "b": "w"
    }

    get fen() {
        return this.encodeFen()
    }

    _pgnValidator(from, to, pc) {
        const samePCs = this.utils.searchForPiecesPath(pc)
        if (samePCs.length < 2) return false
        const [x, y] = to
        for (const samePC of samePCs) {
            if (!(samePC[0] == from[0] && samePC[1] == from[1])) {
                const paths = this.getValidPaths(samePC)
                for (const item of paths.path.concat(paths.attack)) {
                    const [pcX, pcY] = item
                    //console.log(item);
                    if (x == pcX && y == pcY && this.placing[samePC[0]][samePC[1]][0] == pc[0]) {
                        if (from[0] == samePC[0])
                            return "sameFile"
                        else return "same"
                    } //else return false
                }
            }
        }
    }

    _enPassantAttack(pawnPos) {
        this.placing[pawnPos[1]][pawnPos[0]] = null
    }

    _move(from, to, pawnPromote) {
        let piece = pawnPromote || this.placing[from[1]][from[0]]
        this.placing[to[1]][to[0]] = piece
        this.placing[from[1]][from[0]] = null
    }

    _nextTurn() {
        this.turn = (this.turn === "w") ? "b": "w"
        this.fullMoves++
    }

    decodeFen(fen = this._fen) {
        let [placing, turn, castleAvailability, enPassant, halfMoves, fullMoves] = fen.split(" ")
        
        //placing
        let decodedFen = []
        let rows = placing.split("/")
        rows.forEach((row) => {
            var items = [];
            [...row].forEach((i) => {
                if (!isNaN(i * 1)) {
                    var num = parseInt(i)
                    for (let x = 0; x < num; x++) {
                        items.push(null)
                    }
                }
                else {
                    var char = i.toUpperCase()
                    if (i == char) {
                        items.push(`w${char}`)
                    }
                    else {
                        items.push(`b${char}`)
                    }
                }
            })
            decodedFen.push(items)
        })
        this.placing = decodedFen

        //turn
        this.turn = turn

        //castle availability
        let K, Q, k, q
        K = Q = k = q = false

        if (castleAvailability.includes("K")) K = true
        if (castleAvailability.includes("Q")) Q = true
        if (castleAvailability.includes("k")) k = true
        if (castleAvailability.includes("q")) q = true

        this.castleAvailability.w.K = K
        this.castleAvailability.w.Q = Q
        this.castleAvailability.b.K = k
        this.castleAvailability.b.Q = Q

        //en passant
        this.enPassant = (enPassant == "-") ? null : enPassant

        //half moves
        this.halfMoves = parseInt(halfMoves)

        //full moves
        this.fullMoves = parseInt(fullMoves)

    }

    encodeFen(placing = this.placing, turn = this.turn, 
        castleAvailability = this.castleAvailability, 
        enPassant = this.enPassant, halfMoves = this.halfMoves, 
        fullMoves = this.fullMoves) {
        
        //placing
        var encodedPlacing = ""
        placing.forEach((row) => {
            var numNull = 0
            row.forEach((item) => {
                if (item == null) numNull++
                else {
                    if (numNull != 0) {
                        encodedPlacing += numNull
                        numNull = 0
                    }
                    if (item.includes("w")) encodedPlacing += item[1]
                    else encodedPlacing += item[1].toLowerCase()
                }
            })
            if (numNull != 0) {
                encodedPlacing += numNull
            }
            encodedPlacing += "/"
        })
        encodedPlacing = encodedPlacing.slice(0, encodedPlacing.length - 1)

        //turn ~
        //castle availability
        let castleAble = ""
        if (!castleAvailability.w.K && !castleAvailability.w.Q && 
            !castleAvailability.b.K && !castleAvailability.b.Q)
            {castleAvailability = "-"}
        else {
            if (castleAvailability.w.K) castleAble += "K"
            if (castleAvailability.w.Q) castleAble += "Q"
            if (castleAvailability.b.K) castleAble += "k"
            if (castleAvailability.b.Q) castleAble += "q"
        }

        //en passant
        let _enPassant = enPassant || "-"

        //half move ~
        //full move ~
        return [encodedPlacing, turn, castleAble, _enPassant, halfMoves, fullMoves].join(" ")
    }

    static _chessCoordsToNumber(chessCoord) {
        let [_x, _y] = chessCoord
        
        let x = engine.chessCoordMap[_x]
        let y = Math.abs(parseInt(_y) - 8)

        return [x, y]
    }

    static _numberToChessCoords(numCoord) {
        let [x, y] = numCoord

        let letter = engine.chessCoordMap[x]
        let num = Math.abs(y - 8)

        return letter + num
    }
}

const startChessEngine = (fen) => new engine(fen)

if (typeof module !== "undefined") {
    module.exports = startChessEngine
}