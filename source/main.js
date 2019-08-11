"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var fs = require("fs");
var cli = require("readline-sync");
var Jimp = require("jimp");
require("./types");
var encoder = require("./encoder");
main();
function main() {
    var path = selectImage();
    //const image = await getImage(path);
    //getImage(path)
    Jimp.read(path)
        .then(function (value) {
        console.log("Image: ", value);
        if (checkIfEntryExists(value)) {
            //The structure exists and one can assume that the image contains a hidden message.
            var X = encoder.decodeAsNumber(getStream(0, 20, value));
            var L = encoder.decodeAsNumber(getStream(X + 20, 16, value));
            //Now get L bytes after X+36 as a buffer and decode
            var stream = getStream(X + 36, L, value); // 1L = 2px
            var message = encoder.decode(stream);
        }
        else {
            //No hidden message exists. Ask the user if they want to encode a hidden message
            if (cli.keyInYN("No message has been found. Do you want to create one?")) {
                //TODO
                generateMessage(value).then(function (msg) {
                    var buf = encoder.encode(msg);
                    var messageArray = byteArrayToBoolArray(buf);
                    var messageLength = Math.ceil(messageArray.length / 4);
                    //Message Length as array:
                    var messageLengthArray = intToBoolArray(messageLength, true, 16);
                    //get all message starts that are possile. They have to be picked so 
                    //that the message fits into the image, yet does not get in conflict with the other critial data.
                    var startingIndex = getSuitableMessageStartPosition(value, messageLength);
                    var startpointer = startingIndex - 36;
                    var startIndicationArray = intToBoolArray(startpointer, true, 20);
                    //WriteBuffers is an array of all the data that needs to be written.
                    var writeCommands = [
                        { data: messageArray, offset: startingIndex },
                        { data: messageLengthArray, offset: startingIndex - 16 },
                        { data: startIndicationArray, offset: startpointer },
                        { data: startIndicationArray, offset: 0 } //2nd Pointer
                    ];
                    executeWriteCommands(writeCommands, value).then(function (img) {
                        var timestamp = +new Date();
                        var newPath = path.split(".png").splice(1, 1).join("") + "_" + timestamp + ".png";
                        img.write(newPath, function (err, img) {
                            if (err) {
                                throw err;
                            }
                            console.log("\n\n\n The image has been stored @ \n" + newPath);
                            main();
                        });
                    });
                });
            }
            else {
                console.clear();
                main();
            }
        }
    })["catch"](function (err) { console.log("\n\n\nCould not load image. Do you need elevated priviledges? Or is it locked by another process? \nError message:" + err + " \n\n"); main(); });
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
function checkIfEntryExists(image) {
    //Read first 20px
    var entryIndicator = encoder.decodeAsNumber(getStream(0, 20, image));
    //Read 20px after the X (including X)
    var entry = encoder.decodeAsNumber(getStream(entryIndicator, 20, image));
    return entry === entryIndicator && entry !== 0;
}
// Returns the Pixels from the given range.
function getPixelRange(lower, upper, image) {
    if (isInt(lower) && isInt(upper)) {
        if (lower == upper)
            return getPixelLinearized(upper, image);
        if (upper < lower) {
            var v = lower;
            lower = upper;
            upper = v;
        }
        //An array of indices. These are the indices of the pixels that shall be returned.
        var indicesArray = [];
        for (var i = lower; i < upper; i++) {
            indicesArray.push(i);
        }
        return getPixelLinearized(indicesArray, image);
    }
    else {
        throw new Error("Both upper and lower ranges need to be integers");
    }
}
function getPixelLinearized(index, image) {
    //Check data integrity.
    var dimensions = getImageDimensions(image);
    var pixelCount = dimensions.x * dimensions.y;
    if (!Array.isArray(index)) {
        index = [index]; // make it a one-element long array.
    }
    if (!isEveryValueInt(index))
        throw new TypeError("Given array has values that are not numbers  \nIndices: " + index);
    var returnArray = [];
    for (var i = 0; i < index.length; i++) {
        if (pixelCount < index[i]) {
            throw new Error("The given indices shall not exceed the pixel count. \nIndex in question:" + index[i]);
        }
        returnArray.push(getPixel(get2DCoordinate(index[i])));
    }
    return returnArray;
    function get2DCoordinate(index) {
        return { x: index % dimensions.x, y: Math.floor(index / dimensions.x) };
    }
    function getPixel(position) {
        var color = image.getPixelColor(position.x, position.y);
        var pixel = Jimp.intToRGBA(color);
        return pixel;
    }
}
function getImageDimensions(image) {
    var bitmap = image.bitmap;
    var width = bitmap.width;
    var height = bitmap.height;
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
        if (!isInt(el))
            return false;
    }
    return true;
}
function byteArrayToBoolArray(buf) {
    var boolArray = [];
    for (var i = 0; i < buf.length; i++) {
        var asBoolArray = intToBoolArray(buf[i], true);
        for (var _i = 0, asBoolArray_1 = asBoolArray; _i < asBoolArray_1.length; _i++) {
            var el = asBoolArray_1[_i];
            boolArray.push(el);
        }
    }
    return boolArray;
}
function intToBoolArray(num, isLsbFirst, fixedLength) {
    if (!isInt(num))
        throw new TypeError("First param. needs to be an Integer.");
    var retArr = []; //MSB first
    do {
        if (num % 2 === 0) {
            retArr.push(false);
            num /= 2;
        }
        else {
            retArr.push(true);
            num--;
            num /= 2;
        }
    } while (num > 0);
    if (typeof fixedLength === "number") {
        var numbersToPrepend = fixedLength - retArr.length;
        var dataToUnShift = new Array(numbersToPrepend).fill(false);
        retArr.unshift.apply(retArr, dataToUnShift);
    }
    if (isLsbFirst) {
        return retArr.reverse();
    }
    else {
        return retArr;
    }
}
function getStream(offset, length, image) {
    var array = new Uint8Array(length);
    var pixels = getPixelRange(offset, offset + length, image);
    for (var i = 0; i < Math.floor(length / 2); i++) {
        var p1 = pixels[2 * i];
        var p2 = pixels[2 * i + 1];
        var pixelOctet = [
            p1.r % 2, p1.g % 2, p1.b % 2, p1.a % 2,
            p2.r % 2, p2.g % 2, p2.b % 2, p2.a % 2
        ];
        var number = 0;
        for (var j = 0; j < pixelOctet.length; j++) {
            if (pixelOctet[j] === 1) {
                number += Math.pow(2, j);
            }
        }
        array[i] = number;
    }
    return array;
}
function generateMessage(image) {
    return __awaiter(this, void 0, void 0, function () {
        function getMessage() {
            return cli.question("Your message: ");
        }
        var maxBytes, msg;
        return __generator(this, function (_a) {
            maxBytes = (getImageDimensions(image).x * getImageDimensions(image).y / 2) - 56;
            console.log("Please type in the message. The maximum message length for this image is " + maxBytes + " Bytes. UTF8 uses 1 to 4 Bytes per Character.\n\n\”");
            msg = "";
            do {
                msg = getMessage();
            } while (cli.keyInYN("\n\n\nThe message is: " + msg + "\n Is that correct? If it is not you get to retype the message") === false);
            return [2 /*return*/, msg];
        });
    });
}
function getSuitableMessageStartPosition(img, messageLength) {
    var pixelCount = getImageDimensions(img).x * getImageDimensions(img).y;
    var lowerBound = 56; // 20px for begin, 20px for begin check, 16px for length
    var messageLengthInPx = messageLength / 4; // 1px = 1 nibble; 2px = 1 Byte
    var upperBound = pixelCount - messageLengthInPx - 1;
    //The Starting Position of the Message:
    var msgstart = Math.floor(lowerBound + Math.random() * (upperBound - lowerBound));
    return msgstart;
}
function executeWriteCommands(cmds, image) {
    return __awaiter(this, void 0, void 0, function () {
        function writeCommand(data, offset) {
            return __awaiter(this, void 0, void 0, function () {
                function manipulatePixel(px, pxm) {
                    if ((px.a % 2 === 0 && pxm.a) || (px.a % 2 === 1 && !pxm.a)) {
                        px.a = changeValue(px.a);
                    }
                    if ((px.r % 2 === 0 && pxm.r) || (px.r % 2 === 1 && !pxm.r)) {
                        px.r = changeValue(px.r);
                    }
                    if ((px.g % 2 === 0 && pxm.g) || (px.g % 2 === 1 && !pxm.g)) {
                        px.g = changeValue(px.g);
                    }
                    if ((px.b % 2 === 0 && pxm.b) || (px.b % 2 === 1 && !pxm.b)) {
                        px.b = changeValue(px.b);
                    }
                    return px;
                    function changeValue(x) {
                        if (x === 0) {
                            return 1;
                        }
                        else if (x === 255) {
                            return 254;
                        }
                        else {
                            return x += (Math.fround(Math.random()) * 2) - 1; //returns either 1 or -1
                        }
                    }
                }
                var DataAspixelBits, i, i, pixelIndex, pixel;
                return __generator(this, function (_a) {
                    DataAspixelBits = [];
                    for (i = 0; i < data.length / 4; i++) {
                        DataAspixelBits.push({
                            r: data[i * 4],
                            g: data[i * 4 + 1],
                            b: data[i * 4 + 2],
                            a: data[i * 4 + 3]
                        });
                    }
                    for (i = offset; i < offset + DataAspixelBits.length; i++) {
                        pixelIndex = [i % image.getWidth(), Math.floor(i / image.getWidth())];
                        pixel = image.intToRGBA(image.getPixelColor(pixelIndex[0], pixelIndex[1]));
                        pixel = manipulatePixel(pixel, DataAspixelBits[i]);
                        image.setPixelColor(image.rgbaToInt(pixel.r, pixel.g, pixel.b, pixel.a, null), pixelIndex[0], pixelIndex[1]);
                    }
                    return [2 /*return*/];
                });
            });
        }
        var _i, cmds_1, cmd;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, cmds_1 = cmds;
                    _a.label = 1;
                case 1:
                    if (!(_i < cmds_1.length)) return [3 /*break*/, 4];
                    cmd = cmds_1[_i];
                    return [4 /*yield*/, writeCommand(cmd.data, cmd.offset)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, image];
            }
        });
    });
}
