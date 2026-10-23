const jwt = require('jsonwebtoken')

const jwtMiddleware = (req,res,next)=>{
    console.log("Inside jwtMiddleware");
    const token = req.headers['authorization'].split(' ')[1]
    if(token){
        try{
            const jwtResponse = jwt.verify(token,process.env.JWT_SECRET)
            req.payload = jwtResponse.email
            req.role = jwtResponse.role
            next()
        }catch(err){
            res.status(404).json("Authorization failed... Invalid token")
        }
    }else{
        res.status(404).json("Authorization failed... Token is Missing")
    }
    
}

module.exports = jwtMiddleware