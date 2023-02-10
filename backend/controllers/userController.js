const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const generateToken = require('../../generateToken');

exports.registerUser = asyncHandler(async(req, res, next) => {
    const { name, email, password, pic } = req.body;
    
    if(!name || !email || !password) {
        res.status(400);
        throw new Error("Please Enter all the Fields");
    }

    const userExists = await User.findOne({email: email});
    if(userExists) {
        res.status(400);
        throw new Error("User already exists!");
    }

    const user = await User.create({name,email,password,pic});

    if(user){
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken(user._id)
        })
    }else {
        res.status(400);
        throw new Error("Failed to create user!");
    }
});

exports.authUser = asyncHandler(async(req,res,next)=> {
   const {email, password} = req.body;

   const user = await User.findOne({email});

   if(user && user.matchPassword(password)){
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email, 
        pic: user.pic,
        token: generateToken(user._id)
      })
   }
})


exports.allUsers = asyncHandler(async(req ,res ,next) => {
const keyword = req.query.search ? {
  $or: [
    {name: { $regex: req.query.search, $options: "i" } },
    {email: { $regex: req.query.search, $options: "i" } }
  ]
}: {};
 
const users = await User.find(keyword).find({_id: {$ne: req.user._id }});
res.send(users);
})