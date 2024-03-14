const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./../models/userModel');
const catchAsync = require('./../utilities/catchAsyncError');
const AppError = require('./../utilities/appErrors');
const Email = require('./../utilities/email');
const { url } = require('inspector');



// Function to generate login token
const signToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: '3600s',
    });
};

//Function to send token to client
const sendToken = (user, statusCode, statusMessage, res) => {
    //Generate token for the new user
    const token = signToken(user._id);

    const cookieOptions = {
        maxAge: process.env.COOKIE_EXPIRES_IN,
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'prod') cookieOptions.secure = true;

    // Sending the token via cookie
    res.cookie('jwt', token, cookieOptions)

    // Send back the sign up response to the client
    res.status(statusCode).json({
        statusCode: '00',
        statusMessage: statusMessage,
        successful: true,
        responseObject: {
            token: token,
        }
    })
};

// Sign up handler/controller
exports.signUp = catchAsync(async (req, res, next) => {

    //1. Create the new user in the DB
    const newUser = (await User.create(req.body));

    // const newUser = await User.create({
    //     name: req.body.name,
    //     email: req.body.email,
    //     password: req.body.password,
    //     passwordConfirm: req.body.passwordConfirm
    // });
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();

    //2. If everything is ok, send token to client
    const token = signToken(newUser._id);

    const cookieOptions = {
        maxAge: process.env.COOKIE_EXPIRES_IN,
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'prod') cookieOptions.secure = true;

    // Sending the token via cookie
    res.cookie('jwt', token, cookieOptions);

    //Remove password from the response
    newUser.password = undefined;

    // Send back the sign up response to the client
    res.status(201).json({
        statusCode: '00',
        statusMessage: 'User created successfully',
        successful: true,
        responseObject: {
            user: newUser,
            token: token,
        }
    })

});

// Login handler/controller
exports.login = catchAsync(async (req, res, next) => {
    //1. Get the email and password from the request body
    const { email, password } = req.body;

    //2. Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    };

    //3. Check if the user with that email exist
    const user = await User.findOne({ email }).select('+password');

    //4. If the user does not exist, send back an error to the client
    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('Incorrect email or password', 401));
    };
    const statusMessage = "Token successfully generated"

    //4. If everything is ok, send token to client
    sendToken(user, 200, statusMessage, res);

});

// Middleware function to log out the user
exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10000),
        httpOnly: true
    })
    res.status(200).json({
        statusCode: '00',
        statusMessage: `You're successfully logged out!`,
        successful: true
    })
};

// Function to protect the various endpoints
exports.protectRoute = catchAsync(async (req, res, next) => {
    //1. Get token from the request headers
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {

        token = req.cookies.jwt;

    }
    //2. Check if the token is there
    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }
    //3. Verify if the token is valid
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //4. Check if the user who owns the token still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exist', 401));
    }
    //5. Check if user changed password after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again', 401));
    }
    //6. Grant Access to the protected route if all conditions are passed
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

// Middleware Function to check whether user is logged in on the UI
exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            //1. Verify the token in the cookie
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

            //2. Check if the user who owns the token still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            //3. Check if user changed password after token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }
            //4. There is a logged in user
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

// Implementing Authorization
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403))
        }
        next();
    }
};

// Function to handle the forgot password case
exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1. Get User based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with that email address', 404))
    }
    //2. Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
        //3. Send the reset token to the user's email
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;

        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            statusCode: '00',
            statusMessage: 'Token successful sent to your email!',
            successful: true
        })
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('There was an error sending the mail. Please try again later!', 500));
    }
});

// Function to handle the password reset feature
exports.resetPassword = catchAsync(async (req, res, next) => {
    //1. Get user based on the reset token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });
    //2. If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError('Token is invalid or has already expired', 400))
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const statusMessage = "Token successfully generated"

    //4. If everything is ok, send token to client
    sendToken(user, 200, statusMessage, res);

});

exports.updatePassword = catchAsync(async (req, res, next) => {
    //1. Get the user from the collection
    const user = await User.findById(req.user.id).select('+password');

    //2. Check if POSTED current password is correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
        return next(new AppError('Your current password is wrong!', 400));
    }

    //3. If the current passowd is correct, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    const statusMessage = "Password successfully changed!"

    //4. If everything is ok, send token to client
    sendToken(user, 200, statusMessage, res);
});