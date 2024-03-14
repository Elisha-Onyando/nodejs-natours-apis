const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

//Creating the user router
const router = express.Router();

//Applicable to both Normal User and Administrator
router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

//Applicable to both Normal User and Administrator
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

//Protecting all the routes after this middleware
router.use(authController.protectRoute);

//Applicable to both Normal User and Administrator
router.patch('/change-my-password', authController.updatePassword);
router.get('/my-details', userController.getMyDetails, userController.getUserById);
router.patch('/update-my-details', userController.uploadUserPhoto,
    userController.resizeUserPhoto, userController.updateMyDetails);
router.delete('/delete-my-account', userController.deleteMyAccount);

//Applicable to Administrator Role Only
router.use(authController.restrictTo('admin'))

router.route('/')
    .get(userController.getAllUsers);

router.route('/:id')
    .get(userController.getUserById)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;