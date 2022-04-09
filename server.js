const {
    cookieParser,
    express,
    app,
    io,
    server,
} = require('./libs/init')

const PORT = process.env.PORT || 1234

const chessRouter = require('./routers/chess-router')

app.set('view engine', 'pug')
app.use('/chess-engine.js', express.static('./libs/chess-engine.js'))
app.use('/public', express.static('./public'))
app.use('/chess', chessRouter)
app.use(cookieParser())

app.get('/', (req, res) => {
    res.render('index')
})

server.listen(PORT, () => {
    console.log(`Chess server running on port ${PORT}`)
})