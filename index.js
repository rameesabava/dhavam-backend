require('dotenv').config()
require('./config/db')
const express = require('express')
const cors = require('cors')
const routes = require('./routes/allRoutes')

const server = express()

server.use(cors())
server.use(express.json())
server.use(routes)
server.use('/uploads',express.static('./uploads'))
const PORT = process.env.PORT

server.listen(PORT,()=>{
    console.log("Server started... Waiting for client request!!!");  
})

server.get('/',(req,res)=>{
    res.status(200).send(`<h1>Server started!!!</h1>`)
})

server.use((err,req,res,next)=>{
    res.status(500).json(err.message)
})
