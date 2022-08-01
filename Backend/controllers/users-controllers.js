const HttpError = require('../models/http-error');
const { validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/users');


const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

const crypto = require("crypto");

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    credentials: {
        accessKeyId: "",
        secretAccessKey: "",
    },
    region: "ap-south-1"
});

const sharp = require("sharp");

/* User's Functionalities */


const getUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, '-password');
    } catch (err) {
        return next(new HttpError('Fetching users were unsuccesful', 500));
    }

    res.json({users: users.map(user => user.toObject({ getters: true}))});
};

const signup = async (req, res, next) => {
    
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your data', 422));
    }

    const { name, email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({email: email});
    } catch (err) {
        return next(new HttpError('Something went wrong', 500));
    }
    if(existingUser) {
        return next(new HttpError('User already exist please try again', 422));
    }

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    }
    catch (err) {
        return next(new HttpError('Could not create user, please try again', 500));
    }

    let buffer;
    let imageName;
    let final_img_url;
    
    try {
        buffer = await sharp(req.file.buffer).resize({height: 720, width: 720, fit: "contain"}).toBuffer();
        imageName = randomImageName();
        
        const uploadParams = {
            Bucket: "eshopvikasnannu",
            Body: buffer,
            Key: imageName,
            ContentType: req.file.mimetype,
        }

        const command = new PutObjectCommand(uploadParams);
        await s3.send(command);

        final_img_url = "https://eshopvikasnannu.s3.ap-south-1.amazonaws.com/" + imageName;
        console.log(final_img_url);
    }
    catch (err) {
        return next(new HttpError('Imag not send', 500));
    }
    
    const createdUser = new User({
        name,
        email,
        image: final_img_url,
        password: hashedPassword,
        places: [],
    });

    try {
        await createdUser.save();
    } catch (err) {
        return next(new HttpError('Created user failed', 500));
    }

    let token;
    try {
        token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, 'supersecret_dont_share', {expiresIn: '24h'});
    } catch (err) {
        return next(new HttpError('Signup failed', 500));
    }

    res.status(201).json({userId: createdUser.id, email: createdUser.email, token: token});

};

const login = async (req, res, next) => {
    
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        throw new HttpError('Invalid inputs passed, please check your data', 422);
    }
    
    const { email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({email: email});
    } catch (err) {
        return next(new HttpError('Loggin went wrong', 500));
    }
    if(!existingUser) {
        return next(new HttpError('Invalid credentials', 401));
    }
    
    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        return next(new HttpError('Loggin went wrong', 500));
    }
    if(!isValidPassword) {
        return next(new HttpError('Invalid credentials', 401));
    }

    let token;
    try {
        token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, 'supersecret_dont_share', {expiresIn: '24h'});
    } catch (err) {
        return next(new HttpError('Loggin failed', 500));
    }

    res.json({userId: existingUser.id, email: existingUser.email, token: token});

};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;