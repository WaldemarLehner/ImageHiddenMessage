var fs = require("fs");
var cli = require("readline-sync");
var jimp = require("jimp");
beginning: while (true) {
    var path = selectImage();
    var image = getImage(path);
    if (typeof image === "undefined") {
        console.warn("ERR: image is undefined.");
        continue beginning;
    }
    var message = void 0;
    //If correct entry is found, try to decode hidden message
    if (checkIfEntryExists(image)) {
    }
    else {
    }
}
function selectImage() {
    var cliConfig = {
        validate: validateImagePath ? true : "Given path is not a .png or does not exist\n\n\n",
        isFile: true
    };
    var path = cli.questionPath("Please select an image to check. It has to be PNG.", cliConfig);
    return path;
    function validateImagePath(path_) {
        var exists = fs.existsSync(path_);
        var endsWithPng = (/\.png$/i.test(path_));
        return exists && endsWithPng;
    }
}
function getImage(path) {
    jimp.read(path, function (err, data) {
        if (err) {
            cli.question("Error: Could not open given image. Is this a valid .png? Is it locked by another process?");
            return;
        }
        else {
            return data;
        }
    });
}
function checkIfEntryExists(image) {
    //Read first 20px
    var entryIndicator = getValueFromPixelValueArray(decodePixels(getPixelRange(0, 19, image)));
    var entry = getValueFromPixelValueArray(decodePixels(getPixelRange(entryIndicator, entryIndicator + 19, image)));
    return entry === entryIndicator;
}
function getPixelRange(lower, upper, image) {
    if (isInt(lower) && isInt(upper)) {
        if (lower == upper)
            return getPixelLinearized(upper, false, getImageDimensions(image), image);
        if (upper < lower) {
            var v = lower;
            lower = upper;
            upper = v;
        }
        var indicesArray = [];
        for (var i = lower; i < upper; i++) {
            indicesArray.push(i);
        }
        return getPixelLinearized(indicesArray, false, getImageDimensions(image), image);
    }
    else {
        throw new Error("Both upper and lower ranges need to be integers");
    }
}
function getPixelLinearized(index, allowOverflow, dimensions, image) {
    //Check data integrity.
    var pixelCount = dimensions.x * dimensions.y;
    if (Array.isArray(index)) {
        if (!isEveryValueInt(index))
            throw new TypeError("Given array has values that are not numbers");
    }
    else {
        index = [index]; // make it a one-element long array.
    }
    var returnArray = [];
    for (var i = 0; i < index.length; i++) {
        if (pixelCount > index[i]) {
            if (!allowOverflow) {
                throw new Error("The given index shall not exceed the pixel count.");
            }
            index[i] %= pixelCount;
        }
        returnArray.push(getPixel(get2DCoordinate(index[i])));
    }
    return returnArray;
    function get2DCoordinate(index) {
        return { x: index % dimensions.x, y: Math.floor(index / dimensions.x) };
    }
    function getPixel(position) {
        var color = image.getPixelColor(position.x, position.y);
        var pixel = jimp.intToRGBA(color);
        return pixel;
    }
}
function decodePixels(pixels) {
    // Get pairs of two to decode the hidden values
    //get a string of [0-2]+ and convert to Number as base3
    var array = [];
    for (var _i = 0, pixels_1 = pixels; _i < pixels_1.length; _i++) {
        var pixel = pixels_1[_i];
        var pixelvalues = [pixel.r % 3, pixel.g % 3, pixel.g % 3];
        var str = pixelvalues.join("");
        array.push(str);
    }
    return array;
}
function getValueFromPixelValueArray(arr, radix) {
    radix = radix || 3;
    if (!isInt(radix) || radix < 1) {
        throw new TypeError("Given radix has to be a integer > 0");
    }
    var returnValue = 0;
    var i = arr.length - 1;
    var exp = 0;
    while (i) {
        returnValue += arr[i] * (Math.pow(3, exp));
        i--;
        exp++;
    }
    console.log(returnValue);
    return returnValue;
}
function getImageDimensions(image) {
    var width = image.bitmap.width;
    var height = image.bitmap.height;
    if (typeof width === "number" && typeof height === "number") {
        if (isInt(width) && isInt(height)) {
            return { x: width, y: height };
        }
        else {
            throw new TypeError("Either height or width of image is not an integer.  w:" + width + " h:" + height + ".");
        }
    }
    else
        throw new TypeError("Either height or width of image is undefined. w:" + width + " h:" + height + ".");
}
function isInt(val) {
    if (typeof val !== "number") {
        return false;
    }
    return val % 1 === 0;
}
function isEveryValueInt(val) {
    for (var _i = 0, val_1 = val; _i < val_1.length; _i++) {
        var el = val_1[_i];
        if (isInt(el))
            return false;
    }
    return true;
}
