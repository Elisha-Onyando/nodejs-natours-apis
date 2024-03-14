const AppError = require("../utilities/appErrors");

// Function to handle CastErrors in Prod
const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

// Function to handle DuplicateFieldsErrors in Prod
const handleDuplicateFieldsError = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another tour name`;
    return new AppError(message, 400);
};

// Function to handle ValidationErros in Prod
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

// Function to handle InvalidTokenErrors in Prod
const handleJWTError = (err) => {
    return new AppError('Invalid Token. Please log in and try again!', 401);
};

// Function to handle ExpiredTokenErrors in Prod
const handleTokenExpiredError = (err) => {
    return new AppError('Your token has expired! Please log in and try again!', 401);
};

// Function to handle MongoServerError in Prod
const handleMongoServerError = (err) => {
    const dupName = err.keyValue.name;
    const message = `The name ${dupName} has already been taken! Please change the name and try again`
    return new AppError(message, 400);
};

// Function to send back errors to the client in dev
const sendErrorDev = (err, req, res) => {
    // API RESPONSE
    if (req.originalUrl.startsWith('/api')) {
        res.status(err.statusCode).json({
            statusCode: err.status,
            statusMessage: err.message,
            successful: false,
            responseObject: {
                stack: err.stack,
                error: err
            }
        })
    } else {
        // UI RESPONSE
        console.error('ERROR HAPPENED', err);

        res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        })
    }
};

// Function to send back errors to the client in prod
const sendErrorProd = (err, req, res) => {
    //API RESPONSE IN PROD
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            res.status(err.statusCode).json({
                statusCode: err.status,
                statusMessage: err.message,
                successful: false,
            })
        } else {
            console.error('ERROR HAPPENED', err);

            res.status(500).json({
                status: 'error occurred',
                message: 'Something went wrong! We are looking at it'
            })
        }
    } else {
        // UI RESPONSE IN PROD
        if (err.isOperational) {
            res.status(err.statusCode).render('error', {
                title: 'Something went wrong!',
                msg: err.message
            })
        } else {
            console.error('ERROR HAPPENED', err);

            res.status(err.statusCode).render('error', {
                title: 'Something went wrong!',
                msg: 'Something went wrong, Please try again later'
            })
        }
    }

};

module.exports = (err, req, res, next) => {

    err.statusCode = err.statusCode || 400;
    err.status = err.status || '99';

    if (process.env.NODE_ENV === 'dev') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'prod') {
        if (err.name === 'CastError') err = handleCastError(err);
        if (err.code === 11000) err = handleDuplicateFieldsError(err);
        if (err.name === 'ValidationError') err = handleValidationError(err);
        if (err.name === 'JsonWebTokenError') err = handleJWTError(err);
        if (err.name === 'TokenExpiredError') err = handleTokenExpiredError(err);
        //if (err.code === 11000) err = handleMongoServerError(err);
        sendErrorProd(err, req, res);
    }
};