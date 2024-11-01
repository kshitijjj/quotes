const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
mongoose.connect("mongodb://localhost:27017/UserDB").then(()=>console.log("db connected successfully"));


/* USER CREDENTIALS SCHEMA */
const serverUserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    }
})

const userInfoSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required:true
    },
    likedQuotes:{
        type:Array
    },
    savedQuotes:{
        type:Array
    }
})

const userQuotesSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required:true
    },
    quotes:[{
        quotesName:{
            type:String,
            required:true
        },
        avatar:{
            type:String
        },
        date:{
            type:String,
            required:true
        },
        likes:{
            type:Number
        }
    }]
})


serverUserSchema.pre('save',async function(next){
    const user=this;

    if(!user.isModified('password'))return next();
    try {
        const salt=await bcrypt.genSalt(10);
        const hashPassword=await bcrypt.hash(user.password,salt);
        user.password=hashPassword;
        next();
    } catch (error) {
        console.log(error); 
    }
})

serverUserSchema.methods.comparePassword=async function(userPass){
    try {
        const isPass=await bcrypt.compare(userPass,this.password);
        return isPass;
    } catch (error) {
        console.log(error);
    }
}

const Users=mongoose.model("Users",serverUserSchema)
const UserInfo=mongoose.model("UserInfo",userInfoSchema)
const UserQuotes=mongoose.model("UserQuotes",userQuotesSchema);

module.exports={Users,UserInfo,UserQuotes};