const mongoose=require("mongoose");
const codeShareSchema=new mongoose.Schema({
    roomId:{
        type:String,
        required:true
    },
    roomContent:{
        type:String,
    }

},{timestamps:true});

const CodeShare=mongoose.model("codes",codeShareSchema);

module.exports=CodeShare;
