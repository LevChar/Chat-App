const http = require('http')
const express = require('express')                                  //Import express module
const hbs = require('hbs')                                          //Import hbs module
const path = require('path');                                       //Import path module
const socketio = require('socket.io')                               //Import socket module   
const Filter = require('bad-words')                                 //Import bad-words module
const { generateMsg, generateLocationMsg } = require('./utils/msgs')
const { addUser, getUser, removeUser, getUsersInRoom } = require('./utils/users')


const app = express()                                               //Creates an Express application. 
const server = http.createServer(app)                               //initialize new server with our express app
const io = socketio(server)                                         //configure web sockets to work with our server
//socketio() expects to get raw http server, express makes one behind the scene, so we don't have access to it and cant call socketio() with it
//so we had to uses http module to create http server explicitly and pass it to socketio()

const port = process.env.PORT || 3000                               //set the port, if used with Heroku will be asigned to PORT env variable
//and if used locally will be 3000

app.set('view engine', 'hbs')                                       //Setup hbs(Handlebars) engine

const partialsPath = path.join(__dirname, '../templates/partials')  //Set the partials path
hbs.registerPartials(partialsPath)

const viewsPath = path.join(__dirname, '../templates/views')        //Set different views dir than the default
app.set('views', viewsPath)

app.use(express.static(path.join(__dirname, '../public')))          //Setup 'public' as default static dir to serve

io.on('connection', (socket) => {

    socket.on('Join', (options, ack) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return ack(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMsg('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMsg('Admin', `${user.username} has joined!`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        ack()
    })

    socket.on('sendMessage', (msg, msgAck) => {
        filter = new Filter();
        if (filter.isProfane(msg)) {
            return msgAck('Profanity is not allowed!!!')
        }

        const currUser = getUser(socket.id)
        io.to(currUser.room).emit('message', generateMsg(currUser.username, msg))
        msgAck()
    })

    socket.on('sendLocation', (location, locationAck) => {
        const currUser = getUser(socket.id)
        io.to(currUser.room).emit('locationMessage', generateLocationMsg(currUser.username, location))
        locationAck()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMsg(`${user.username} has left the chat!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

app.get('', (req, res) => {
    res.render('index', {
        title: 'Chat App',
        name: 'Arie Charfnadel'
    })
})

app.get('/chat.html', (req, res) => {
    res.render('chat', {
        title: 'Chat App',
        name: 'Arie Charfnadel'
    })
})

server.listen(port, () => {                                            //Start-Up the server
    console.log('Server is up on port' + port + '.')
})