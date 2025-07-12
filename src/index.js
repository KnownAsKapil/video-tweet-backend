
import dotenv from "dotenv";
import connectDB from "./db/index.js";
dotenv.config();
import {app} from "./app.js"

connectDB()
.then(() =>{
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server listening at ${process.env.PORT}`)})
})
.catch((err) => {
    console.log("MongoDB connected failed!!!", err)
})
















/*const app = express()
;(async () =>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(error) =>{
            console.log("Error:", error)
            throw new error
        })

        app.listen(process.env.PORT, () =>{
            console.log(`Server is listening on ${process.env.PORT}`)
        })
    }
    catch(error){
        console.error("ERROR: ",error)
    }
})()*/
    

