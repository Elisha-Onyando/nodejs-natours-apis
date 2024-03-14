const catchAsync = require('./../utilities/catchAsyncError');
const AppError = require('./../utilities/appErrors');
const APIFeatures = require('./../utilities/apiFeatures');

exports.deleteItem = (Model) => catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
        return next(new AppError(`No document found with that Id`, 400))
    }

    res.status(200).json({
        statusCode: "00",
        statusMessage: `Document with id: ${req.params.id} successfully deleted`,
        successful: true,
        responseObject: null
    })
});

exports.updateItem = (Model) => catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    if (!document) {
        return next(new AppError('No document found with that Id', 400))
    }

    res.status(200).json({
        statusCode: "00",
        statusMessage: 'Document successfully updated',
        successful: true,
        responseObject: {
            data: document
        }
    })
});

exports.createItem = (Model) => catchAsync(async (req, res, next) => {
    const newDocument = await Model.create(req.body);
    res.status(201).json({
        statusCode: "00",
        statusMessage: 'Document is successfully created',
        successful: true,
        responseObject: {
            data: newDocument,
        }
    })
});

exports.getItemById = (Model, populateOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const document = await query.select('-__v');

    if (!document) {
        return next(new AppError('No document found with that Id', 400))
    }

    res.status(200).json({
        statusCode: "00",
        statusMessage: 'Document successfully fetched',
        successful: true,
        responseObject: { data: document }
    })
});

exports.getAllItems = (Model) => catchAsync(async (req, res, next) => {

    //To allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // Execute the query
    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const documents = await features.query;

    //Sending back the query result as response
    res.status(200).json({
        statusCode: "00",
        statusMessage: 'Documents successfully fetched',
        successful: true,
        results: documents.length,
        responseObject: {
            data: documents
        }
    })
});