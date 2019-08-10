import fs = require("fs");
import cli = require("readline-sync");
import Jimp = require("jimp");
import "./types";
import * as encoder from "./encoder";


main();

function main(){
    let path = selectImage();
    //const image = await getImage(path);
    //getImage(path)
    Jimp.read(path)
    .then( value => {
       if( checkIfEntryExists(value)){
           //The structure exists and one can assume that the image contains a hidden message.
            let X = encoder.decodeAsNumber( getStream(0,20,value));
            let L = encoder.decodeAsNumber( getStream(X+20,16,value));
            //Now get L bytes after X+36 as a buffer and decode
            let stream = getStream(X+36,L,value); // 1L = 2px
            let message = encoder.decode(stream);


        }else{
           //No hidden message exists. Ask the user if they want to encode a hidden message
           if(cli.keyInYN("No message has been found. Do you want to create one?")){
                //TODO
                generateMessage(value).then(value => {
                    let buf = encoder.encode(value);
                })
           }else{
               console.clear();
               main();
           }
       }
    }).catch(err=> {console.log("\n\n\nCould not load image. Do you need elevated priviledges? Or is it locked by another process? \nError message:"+err+" \n\n"); main();});
    

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




function checkIfEntryExists(image:Jimp):boolean{
    //Read first 20px
    let entryIndicator = encoder.decodeAsNumber( getStream(0,20,image));
    //Read 20px after the X (including X)
    let entry = encoder.decodeAsNumber( getStream(entryIndicator,20,image));

    return entry === entryIndicator && entry !== 0;
}

// Returns the Pixels from the given range.
function getPixelRange(lower:number,upper:number,image:Jimp):Pixel[]{
    if(isInt(lower) && isInt(upper)){
        if(lower == upper)
            return getPixelLinearized(upper,false,image);
        if(upper < lower){
            const v:number = lower;
            lower = upper;
            upper = v;
        }
        //An array of indices. These are the indices of the pixels that shall be returned.
        let indicesArray : number[] = [];
        for(let i = lower; i < upper;i++){
            indicesArray.push(i);
        }
        return getPixelLinearized(indicesArray,false,image);

    }else{
        throw new Error("Both upper and lower ranges need to be integers")
    }
}


function getPixelLinearized(index:number | number[],allowOverflow: boolean ,image : Jimp):Pixel[] {
    
    //Check data integrity.
    const dimensions = getImageDimensions(image);
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
        let pixel:Pixel = Jimp.intToRGBA(color);
        return pixel;
    }
}






function getImageDimensions(image:Jimp) : Dimension {
    let bitmap = image.bitmap;

    let width = bitmap.width
    let height = bitmap.height
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
function byteArrayToBoolArray(buf:Uint8Array) : boolean[] {
    let boolArray :boolean[] = [];
    for(let i = 0;i<buf.length;i++){
        let asBoolArray = intToBoolArray(buf[i],true);
        for(let el of asBoolArray){
            boolArray.push(el);
        }
    }
    return boolArray;


    function intToBoolArray(num:number,isLsbFirst? : boolean):boolean[]{
        if(!isInt(num))
            throw new TypeError("First param. needs to be an Integer.")
        let retArr : boolean[] = []; //MSB first
        
        do{
            if(num%2 === 0){
                retArr.push(false);
                num /= 2;
            }else{
                retArr.push(true);
                num--;
                num /= 2;
            }

            
        }while(num > 0);
        if(isLsbFirst){
            return retArr.reverse();
        }else{
            return retArr;
        }

    }
}

function getStream(offset:number,length:number,image:Jimp) : Uint8Array {
    let array = new Uint8Array(length)
    const pixels = getPixelRange(offset,offset+length,image);
    for(let i = 0;i<length;i++){
        const p1 = pixels[2*i];
        const p2 = pixels[2*i+1];
        const pixelOctet = [ //First value is "LSB"
            p1.r %2, p1.g %2,p1.b%2,p1.a%2,
            p2.r %2, p2.g %2,p2.b%2,p2.a%2
        ];
        let number = 0;
        for(let j = 0; j < pixelOctet.length;j++){
            if(pixelOctet[j] === 1){
                number += 2**j;
            }
        }
        array[i] = number;

    }
    return array;
}

async function generateMessage(image:Jimp) : Promise<string> {
    let maxBytes = (getImageDimensions(image).x * getImageDimensions(image).y / 2) - 56
    console.log("Please type in the message. The maximum message length for this image is "+maxBytes+" Bytes. UTF8 uses 1 to 4 Bytes per Character.\n\n\”")
    let msg = ""
    do {
        msg = getMessage();
    }while(cli.keyInYN("\n\n\nThe message is: "+msg+"\n Is that correct? If it is not you get to retype the message") === false);
    return msg;
    function getMessage() : string {
        return cli.question("Your message: ");
    }

 
}
