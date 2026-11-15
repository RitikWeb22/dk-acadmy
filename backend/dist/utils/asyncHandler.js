/**
 * Higher-order async handler wrapper.
 * Catches unhandled Promise rejections and passes them directly to Express next(err)
 * for centralized error handling without repetitive try/catch boilerplate.
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
