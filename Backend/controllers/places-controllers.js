const HttpError = require('../models/http-error');
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/location");
const mongoose = require("mongoose");
const Place = require('../models/places');
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

/* Admin Functionalities */

// "C" => Create
const createPlace = async (req, res, next) => {
    
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your data', 422));
    }
    
    const { title, description, address } = req.body;

    let APIcoordinates;
    try {
        APIcoordinates = await getCoordsForAddress(address);
    }
    catch (err) {
        return next(new HttpError('Api Coordinates not made', 500));
    }

    let buffer;
    let imageName;
    let final_img_url;
    
    try {
        buffer = await sharp(req.file.buffer).resize({height: 1080, width: 1920, fit: "contain"}).toBuffer();
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

    const createdPlace = new Place({
        title,
        description,
        address,
        location: APIcoordinates,
        image: final_img_url,
        creator: req.userData.userId
    });

    let existingUser;
    try {
        existingUser = await User.findById(req.userData.userId);
    }
    catch (error) {
        return next(new HttpError('Id search is not working', 500));
    }
    if(!existingUser) {
        return next(new HttpError('We could not find existing user', 404));
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({session: sess});
        existingUser.places.push(createdPlace);
        await existingUser.save({ session: sess});
        await sess.commitTransaction();

    } catch (err) {
        return next(new HttpError('created palce failed', 500));
    }
    
    console.log(createdPlace);
    res.status(201).json({place: createdPlace});
};

// "R" => Read A
const getPlaceById =  async (req, res, next) => {
    
    const placeId = req.params.pid;
    
    let place;

    try {
       place = await Place.findById(placeId);
    }
    catch (err) {
        const error = new HttpError('Sometthing went wrong could not find a place', 501);
        return next(error);
    }
    
    if(!place) {
        const error = new HttpError('Could not find a place for the provided ID', 404);
        return next(error);
    }
    
    console.log(place);
    res.json({ place: place.toObject( {getters: true}) });
};

// "R" => Read B
const getPlacesByUserId =  async (req, res, next) => {
    
    const userId = req.params.uid;

    let userPlaces;
    try {
        userPlaces = await User.findById(userId).populate('places');
    }
    catch (err) {
        return next(new HttpError('Could not find places', 500));
    }
    
    if(!userPlaces || userPlaces.places.length === 0) {
        return next(new HttpError('Could not find places for the provided user ID', 404));
    }

    res.json({places: userPlaces.places.map(place => place.toObject({getters: true}))});
};

// "U" => Update
const updatePlace = async (req, res, next) => {
    
    const errors = validationResult(req);
    
    if(!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your data', 422));
    }
    
    const { title, description } = req.body;
    const placeId = req.params.pid;

    let place;

    try {
        place = await Place.findById(placeId);
    } catch (err) {
        return next(new HttpError('Something went wrong', 500));
    }

    if(place.creator.toString() !== req.userData.userId) {
        return next(new HttpError('You are not allowed to edit this place', 401));
    }

    place.title = title;
    place.description = description;
    
    try {
        await place.save();
    } catch (err) {
        return next(new HttpError('Product saving failed', 500));
    }

    res.status(200).json({place: place.toObject({getters: true})});

};

// "D" => Delete 
const deletePlace = async (req, res, next) => {
    
    const placeId = req.params.pid;
    
    let place;
    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (err) {
        return next(new HttpError('Something went wrong', 500));
    }

    if(!place) {
        return next(new HttpError('Place not found', 404));
    }

    if(place.creator.id !== req.userData.userId) {
        return next(new HttpError('You are not allowed to delete this place', 401));
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.remove({session: sess});
        place.creator.places.pull(place);
        await place.creator.save({session: sess});
        await sess.commitTransaction();
    } catch {
        return next(new HttpError('Something went wrong', 500));
    }

    res.status(200).json({message: "Deleted Place"});

    
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;


