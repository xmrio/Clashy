function curry(fn, args) {
    if (args && args.length === fn.length + 1) {
        fn.apply(fn, args)
    }
    return function() {
        const argsInArray = Array.prototype.slice.call(arguments, 0)
        return curry(fn, argsInArray.concat(args))
    }
}

module.exports = {
    curry
}