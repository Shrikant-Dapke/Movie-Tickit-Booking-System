import mongoose from "mongoose";
const {Schema,model}=mongoose;
export const User=model("User",new Schema({name:{type:String,required:true},email:{type:String,required:true,unique:true,lowercase:true},password:{type:String,required:true},role:{type:String,enum:["customer","admin"],default:"customer"}},{timestamps:true}));
export const Movie=model("Movie",new Schema({title:String,poster:String,backdrop:String,genre:[String],language:String,duration:Number,rating:Number,certificate:String,description:String,cast:[String],releaseDate:Date,featured:Boolean},{timestamps:true}));
export const Show=model("Show",new Schema({movie:{type:Schema.Types.ObjectId,ref:"Movie",required:true},theatre:String,city:String,screen:String,date:String,time:String,price:Number,seatCount:{type:Number,default:60}},{timestamps:true}));
export const SeatLock=model("SeatLock",new Schema({show:{type:Schema.Types.ObjectId,ref:"Show",required:true},seat:String,user:{type:Schema.Types.ObjectId,ref:"User",required:true},expiresAt:{type:Date,required:true,index:{expires:0}}},{timestamps:true}));
SeatLock.schema.index({show:1,seat:1},{unique:true});
export const Booking=model("Booking",new Schema({user:{type:Schema.Types.ObjectId,ref:"User",required:true},show:{type:Schema.Types.ObjectId,ref:"Show",required:true},seats:[String],amount:Number,status:{type:String,enum:["confirmed","cancelled"],default:"confirmed"},bookingCode:{type:String,unique:true}},{timestamps:true}));
Booking.schema.index({show:1,seats:1});
