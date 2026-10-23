const multer = require('multer')

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./uploads')
    },
    filename:(req,file,cb)=>{
        cb(null,`Image-${Date.now()}-${file.originalname}`)
    }
})

const fileFilter = (req,file,cb)=>{
    if(file.mimetype.startsWith("image/")){
        cb(null, true)
    }else{
        cb(null, false)
    }
}
const multerMiddleware = multer({
    storage, fileFilter
})

module.exports = multerMiddleware