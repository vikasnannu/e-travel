const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

const usersController = require("../controllers/users-controllers");
const multer = require("multer");


router.get('/', usersController.getUsers);

router.post('/signup', multer().single('image') , [check('name').not().isEmpty(), check('email').normalizeEmail().isEmail(), check('password').isLength({min: 6}),] , usersController.signup);

router.post('/login', usersController.login);


module.exports = router;
