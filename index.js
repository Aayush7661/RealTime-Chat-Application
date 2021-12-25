const express = require('express');
const app = express();
const http = require('http').createServer(app);
const routes = require('./routes');
const path = require('path');

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get("/", routes);
app.post("/register", routes);
app.get('/login', routes);
app.post('/login', routes);
app.get('/success', routes);
app.get('/logout', routes);

const PORT = process.env.PORT || 5000;
http.listen(PORT, () => console.log(`server started At port ${PORT}`));

//socket

const io = require('socket.io')(http);

io.on('connection', (socket) => {
    console.log('connected...')
    socket.on('message', (msg) => {
        socket.broadcast.emit('message', msg)
    })
})