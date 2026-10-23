const mongoose = require('mongoose')

const connectionString = process.env.DBCONNECTIONSTRING

mongoose.connect(connectionString).then(res=>{
    console.log("Database connected successfully");
    
}).catch(err=>{
    console.log("Database connection failed");
    console.log(err);
    
})