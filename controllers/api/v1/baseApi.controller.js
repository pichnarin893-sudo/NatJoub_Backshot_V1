exports.successResponse = (res, data, message) => {
    const response = {
        status: 'success',
        data: data,
        message: message,
    };
    return res.status(200).json(response);
};

exports.errorResponse = (res, message, statusCode = 400) => {
    const response = {
        status: 'error',
        message: message,
    };
    return res.status(statusCode).json(response);
};