const fs = require("fs");
const cli = require("readline-sync");
const jimp = require("jimp");
beginning:
while(true){
    let path = selectImage();
    let image = getImage(path);
    if(typeof image === "undefined"){
        console.warn("ERR: image is undefined.")
        continue beginning;
    }
    let message : string | undefined;
    //If correct entry is found, try to decode hidden message
    if(checkIfEntryExists(image)){

    }else{

    }

}


function selectImage():string {
    const cliConfig = {
        validate: validateImagePath ? true : "Given path is not a .png or does not exist\n\n\n",
        isFile : true
    }
    let path:string =  cli.questionPath("Please select an image to check. It has to be PNG.",cliConfig);
    return path;

    function validateImagePath(path_:string):boolean {
        let exists:boolean = fs.existsSync(path_);
        let endsWithPng:boolean = (/\.png$/i.test(path_));
        return exists && endsWithPng;
    }

}

function getImage(path:string){
    jimp.read(path, (err:boolean,data:any) => {
        if(err){
            cli.question("Error: Could not open given image. Is this a valid .png? Is it locked by another process?");
            return;
        }else{
            return data;
        }
    })
}


interface Pixel {
    r:number,
    g:number,
    b:number,
    a:number
}

interface Dimension {
    x: number,
    y : number
}
interface Coordinate {
    x: number,
    y: number
}


function checkIfEntryExists(image:any):boolean{
    //Read first 20px
    let entryIndicator = getValueFromPixelValueArray( decodePixels(getPixelRange(0,19,image)));
    let entry = getValueFromPixelValueArray(decodePixels(getPixelRange(entryIndicator,entryIndicator+19,image)));

    return entry === entryIndicator;
}


function getPixelRange(lower:number,upper:number,image:any):Pixel[]{
    if(isInt(lower) && isInt(upper)){
        if(lower == upper)
            return getPixelLinearized(upper,false,getImageDimensions(image),image);
        if(upper < lower){
            const v:number = lower;
            lower = upper;
            upper = v;
        }
        let indicesArray = [];
        for(let i = lower; i < upper;i++){
            indicesArray.push(i);
        }
        return getPixelLinearized(indicesArray,false,getImageDimensions(image),image);

    }else{
        throw new Error("Both upper and lower ranges need to be integers")
    }
}


function getPixelLinearized(index:number | number[],allowOverflow: boolean ,dimensions:Dimension,image : any):Pixel[] {
    
    //Check data integrity.
    let pixelCount = dimensions.x * dimensions.y;
    if(Array.isArray(index)){
        if(!isEveryValueInt(index))
            throw new TypeError("Given array has values that are not numbers");
        
    }else{
        index = [index]; // make it a one-element long array.
    }
    let returnArray:Pixel[] = [];
    for(let i = 0; i < index.length; i++){
        if(pixelCount > index[i]){
            if(!allowOverflow){
                throw new Error("The given index shall not exceed the pixel count.");
            }
            index[i] %= pixelCount;
        }
        returnArray.push(getPixel(get2DCoordinate(index[i])));
    }
    return returnArray;


    function get2DCoordinate(index:number):Coordinate{
        return {x: index % dimensions.x,y: Math.floor(index/dimensions.x)}
    }
    function getPixel(position:Coordinate):Pixel{
        let color:number = image.getPixelColor(position.x,position.y);
        let pixel:Pixel = jimp.intToRGBA(color);
        return pixel;
    }
}

function decodePixels(pixels:Pixel[]):number[]{
    // Get pairs of two to decode the hidden values
    //get a string of [0-2]+ and convert to Number as base3
    let array = [];
    for(let pixel of pixels){
        let pixelvalues = [pixel.r%3,pixel.g%3,pixel.g%3];
        let str = pixelvalues.join("");
     
        array.push(str)    
    }
     return array;
}

function getValueFromPixelValueArray(arr:number[],radix?:number):number{
    radix = radix || 3;
    if(!isInt(radix) || radix < 1){
        throw new TypeError("Given radix has to be a integer > 0");
    }
    let returnValue:number = 0;
    let i = arr.length-1;
    let exp = 0;
    while(i){
        returnValue += arr[i] * (3 ** exp);
        i--;
        exp++;
    }
    console.log(returnValue)
    return returnValue;

}


function getImageDimensions(image:any) : Dimension {
    let width = image.bitmap.width;
    let height = image.bitmap.height;
    if (typeof width === "number" && typeof height === "number"){
        if(isInt(width) &&isInt(height)){
            return {x:width,y:height};
        }else{
            throw new TypeError("Either height or width of image is not an integer.  w:"+width+" h:"+height+".");
        }
        
    }
    else throw new TypeError("Either height or width of image is undefined. w:"+width+" h:"+height+".");
}

function isInt(val : number) : boolean{
    if(typeof val !== "number"){
        return false;
    }
    return val%1 === 0
}
function isEveryValueInt(val: any[]):boolean{
    for(let el of val){
        if(isInt(el))
            return false;
    }
    return true;
}