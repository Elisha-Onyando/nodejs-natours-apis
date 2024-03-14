const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utilities/appErrors');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utilities/catchAsyncError');
const factory = require('./handlerFactory');
const { Promise } = require('mongoose');

// PROCESSING MULTIPLE IMAGE UPLOAD
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, callback) => {
    if (file.mimetype.startsWith('image')) {
        callback(null, true)
    } else {
        callback(new AppError('File is not an image! Please upload images only', 400), false)
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {

    if (!req.files.imageCover || !req.files.images) return next();

    //1. Processing the cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`);

    //2. Processing the other images
    req.body.images = [];

    await Promise.all(
        req.files.images.map(async (file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`);

            req.body.images.push(filename);
        })
    );
    next();
});

// 1. ROUTE HANDLERS
// Function to get all tours data
exports.getAllTours = factory.getAllItems(Tour);
// Function to get a single tour using the tour id
exports.getTourById = factory.getItemById(Tour, { path: 'reviews' });
// Function to create a new tour
exports.createTour = factory.createItem(Tour);
// Function to update a tour detail
exports.updateTour = factory.updateItem(Tour);
// Function to delete a single tour using the tour id
exports.deleteTour = factory.deleteItem(Tour);

//Aggregation Pipeline: Matching and Grouping
exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numOfTours: { $sum: 1 },
                numRatings: { $sum: '$ratingAverage' },
                avgRating: { $avg: '$ratingAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        }
    ]);
    res.status(200).json({
        statusCode: "00",
        statusMessage: 'Tour Stats successfully fetched',
        successful: true,
        responseObject: { stats }
    })
});

//Aggregation Pipeline: Unwinding and Projecting
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates',
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numOfStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numOfStarts: -1 }
        }
    ])

    res.status(200).json({
        statusCode: "00",
        statusMessage: 'Tour Monthly Plan successfully fetched',
        successful: true,
        results: plan.length,
        responseObject: { plan }
    })
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    if (!lat || !lng) {
        next(new AppError('Please provide latitude and longitude in the format lat, lng', 400))
    }

    const tours = await Tour.find({
        startLocation: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius]
            }
        }
    });
    res.status(200).json({
        statusCode: '00',
        statusMessage: 'Successful',
        successful: true,
        results: tours.length,
        responseObject: {
            data: tours
        }
    })
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if (!lat || !lng) {
        next(new AppError('Please provide latitude and longitude in the format lat, lng', 400))
    }
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ])

    res.status(200).json({

        results: distances.length,
        responseObject: {
            tours: distances
        },
        statusCode: '00',
        statusMessage: 'Successful',
        successful: true,
    })
});