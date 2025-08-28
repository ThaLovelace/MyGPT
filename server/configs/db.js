import mongoose from "mongoose";

const connectDB = async () =>{
    try {
        mongoose.connection.on('connected', ()=> console.log('MyGPT Database connected!'))
        await mongoose.connect(`${process.env.MONGODB_URI}/MyGPT`)
    } catch (error) {
        console.log(error.message)
    }
}

export default connectDB