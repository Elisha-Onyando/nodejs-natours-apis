const Booking = require('../models/bookingModel');
const AppError = require('../utilities/appErrors');
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utilities/catchAsyncError');

exports.getOverview = catchAsync(async (req, res, next) => {
    //1. Get all our tour data from the db
    const tours = await Tour.find();
    //2. Build our template with the data from the db
    //3. Render that built template on the UI
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

exports.getTourDetails = catchAsync(async (req, res, next) => {
    //1. Get the data for the requested tour [including reviews and guides]
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'reviews rating user'
    })

    if (!tour) {
        return next(new AppError('There is not tour with that name!', 404))
    }
    //2. Build the template
    //3. Render to the User Interface
    res.status(200).set(
        'Content-Security-Policy',
        "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    ).render('tour', {
        title: `${tour.name} Tour`,
        tour
    });
});

exports.getLoginForm = (req, res) => {
    res.status(200).set(
        'Content-Security-Policy',
        "connect-src 'self' https://cdnjs.cloudflare.com",

    ).render('login', {
        title: 'Log into your account'
    })
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    })
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    //1. Find all user bookings
    const bookings = await Booking.find({ user: req.user.id });

    //2. Find tours with the returned Ids
    const tourIds = bookings.map(booking => booking.tour);
    const tours = await Tour.find({ _id: { $in: tourIds } });

    res.status(200).render('overview', {
        title: 'My Tours',
        tours
    })
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id,
        {
            name: req.body.name,
            email: req.body.email
        },
        {
            new: true,
            runValidators: true

        }
    )
    res.status(200).render('account', {
        title: 'Your account',
        user: updatedUser
    })
});