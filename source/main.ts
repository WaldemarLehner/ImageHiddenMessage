import fs = require("fs");
import cli = require("readline-sync");
import Jimp = require("jimp");
import "./types";
import * as encoder from "./encoder";
import * as convert from "./convert";


main();

function main(){
    let path = selectImage();
    //const image = await getImage(path);
    //getImage(path)
    Jimp.read(path)
    .then( image => {
    
       if( checkIfEntryExists(image)){
           //The structure exists and one can assume that the image contains a hidden message.
            let X = convert.boolArrayToInt( getStream(0,20,image)) ;
            let L = convert.boolArrayToInt( getStream(X+10,32,image));
            //Now get L bytes after X+36 as a buffer and decode
            let stream = getStream(X+36,L,image); // 
            let message = encoder.decode(stream);
            console.log("message >>> ",message)

        }else{
           //No hidden message exists. Ask the user if they want to encode a hidden message
           if(cli.keyInYN("No message has been found. Do you want to create one?")){
                //TODO
                generateMessage(image).then(msg => {
                    //The message encoded as booleanArray
                    const messageArray = encoder.encode(msg);
                    
                    //Message Length as array:
                    const messageLengthArray = convert.intToBoolArray(messageArray.length/4,16*4);
                    console.log("msg len arr:",messageArray.length,messageLengthArray);
                    //Gets a working message start
                    const startingIndex = getSuitableMessageStartPosition(image,messageArray.length/4);    
                    const startpointer = startingIndex-36//X
                    const startIndicationArray = convert.intToBoolArray(startpointer,20*4);

                    console.log("###\n")
                    console.log(startpointer,"<>",startIndicationArray)
                    //WriteBuffers is an array of all the data that needs to be written.
                    const writeCommands : WriteCommand[] = [
                        {data: startIndicationArray, offset:0}   ,
                        {data: startIndicationArray, offset:startpointer},           
                        {data: messageLengthArray, offset: startpointer+20},     
                        {data: messageArray,offset: startpointer+36}          
                    ];
                    executeWriteCommands(writeCommands,image).then(img => {
                        let timestamp = + new Date();
                        console.log("path:",path)
                        let newPath  = path.split(".png")[0] + "_" + timestamp + ".png";
                        img.write(newPath,(err,img)=>{
                            if (err) {
                                throw err;
                            }
                            console.log("\n\n\n The image has been stored @ \n"+newPath);
                            main();
                        })
                    });

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
    let path:string =  cli.questionPath("Please select an image to check. It has to be PNG.\n",cliConfig);
    return path;

    function validateImagePath(path_:string):boolean {
        let exists:boolean = fs.existsSync(path_);
        let endsWithPng:boolean = (/\.png$/i.test(path_));
        return exists && endsWithPng;
    }

}




function checkIfEntryExists(image:Jimp):boolean{
    //Read first 20px
    let entryIndicator =    convert.boolArrayToInt( getStream(0,20,image))              % (image.getWidth() * image.getHeight()) ;
    //Read 20px after the X (including X)
    let entry =             convert.boolArrayToInt( getStream(entryIndicator,20,image)) % (image.getWidth() * image.getHeight()) ;
    console.log(entryIndicator,entry)
    return entry === entryIndicator && entry !== 0 && entry !== 2**80;
}

/**
 * Returns an array of pixels from the lower bounds up to the upper bound
 * @param lower The lower bound
 * @param upper The upper bound
 * @param image The jimp image object
 */
function getPixelRange(lower:number,upper:number,image:Jimp):Pixel[]{
    const maxIndex = getImageDimensions(image).x * getImageDimensions(image).y
    if(lower < 0 || upper < 0 || lower >= maxIndex || upper >= maxIndex){
        throw new Error("Lower and/or Upper are out of bounds!"+lower+" "+upper)
    }

    if(isInt(lower) && isInt(upper)){
        if(lower == upper)
            return getPixelLinearized(upper,image);
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
        return getPixelLinearized(indicesArray,image);

    }else{
        throw new Error("Both upper and lower ranges need to be integers")
    }
}

/**
 * Takes an array of indices and returns the corresponding pixel from the image.
 * @param index The indices of the pixels that shall be returned
 * @param image The jimp image object
 */
function getPixelLinearized(index:number | number[] ,image : Jimp):Pixel[] {
    
    //Check data integrity.
    const dimensions = getImageDimensions(image);
    let pixelCount = dimensions.x * dimensions.y;
    if(!Array.isArray(index)){
        index = [index]; // make it a one-element long array.
    }
    if(!isEveryValueInt(index))
            throw new TypeError("Given array has values that are not numbers  \nIndices: "+index);
    let returnArray:Pixel[] = [];
    
    for(let i = 0; i < index.length; i++){
        if(pixelCount < index[i]){
                throw new Error("The given indices shall not exceed the pixel count. \nIndex in question:"+index[i]);
        }
        returnArray.push(getPixel(get2DCoordinate(index[i])));
    }
    return returnArray;
    

    function get2DCoordinate(index:number):Coordinate{
        index %= (dimensions.x * dimensions.y);
        return {x: index % dimensions.x,y: Math.floor(index/dimensions.x)}
    }
    function getPixel(position:Coordinate):Pixel{
        let color:number = image.getPixelColor(position.x,position.y);
        let pixel:Pixel = Jimp.intToRGBA(color);
        return pixel;
    }
}





/**
 * Returns width and height of image
 * @param image Jimp image object
 */
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
        if(!isInt(el))
            return false;
    }
    return true;
}


/**  
 * Reads the data from the image and stores it in a boolean array
 * @param length in pixels.
*/
function getStream(offset:number,length:number,image:Jimp) : boolean[] {
    let array:boolean[] = []
    const pixels = getPixelRange(offset,offset+2*length,image); 
    for(let i = 0;i<length;i++){
        const px = pixels[i];
        array.push( 
            px.r % 2 !== 0,
            px.g % 2 !== 0,
            px.b % 2 !== 0,
            px.a % 2 !== 0
        );
       
        

    }
    return array;
}
/**
 * A function that asks the user to set a message to be hidden inside the image
 * @param image 
 */
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

/**
 * Tries to find a suitable message start. This will be an index at which the first message pixel is written, followed by other message pixels
 * @param img The jimp image object
 * @param messageLength The length of a message in pixels
 */
function getSuitableMessageStartPosition(img:Jimp,messageLength:number):number{
    const pixelCount = getImageDimensions(img).x * getImageDimensions(img).y;
    const lowerBound = 56 // 20px for begin, 20px for begin check, 16px for length
    const messageLengthInPx = messageLength/4; // 1px = 1 nibble; 2px = 1 Byte
    const upperBound = pixelCount - messageLengthInPx-1;
    //The Starting Position of the Message:
    const msgstart = Math.floor(lowerBound + Math.random() * (upperBound-lowerBound));
    return msgstart;




}


/**
 * 
 * @param cmds An array of writeCommands. These writecommands have an offset(this is where the message begins) as well as the data itself as a boolarray
 * @param image the image that should be written to.
 */
async function executeWriteCommands(cmds: WriteCommand[],image:Jimp) : Promise<Jimp> {
    let i = 0;
    for(const cmd of cmds){
        i++
        await writeCommand(cmd.data,cmd.offset);
        console.log("! Executed command number ",i)

    }
    return image;
    /**
     * 
     * @param data The data that needs to be written
     * @param offset The offset as pixels
     */
    async function writeCommand(data:boolean[],offset:number){
        //Write data as pixelsmask (true and false)
        if(data.length % 4 !== 0){
            throw new Error("data needs to be a multiple of 4 long. Message Length:"+data.length)
        }
        let DataAspixelBits :PixelMask[]= [];
        for(let i = 0; i < (data.length / 4);i++){
            DataAspixelBits.push({
                r: data[i*4] ,
                g: data[i*4+1] ,
                b: data[i*4+2] ,
                a: data[i*4+3] 
            })
        }
        console.log(DataAspixelBits)
        try{
            for(let i = 0; i < DataAspixelBits.length;i++){
                ///STOPPED HERE
               
                const pixelIndex:Coordinate = {x:(i+offset)%image.getWidth(),y:Math.floor((i+offset)/image.getWidth())};
                let pixel :Pixel= Jimp.intToRGBA( image.getPixelColor(pixelIndex.x,pixelIndex.y));
           
                
                pixel = manipulatePixel(pixel,DataAspixelBits[i]);
                const pixelValue = Jimp.rgbaToInt(pixel.r,pixel.g,pixel.b,pixel.a,undefined)
                image.setPixelColor(pixelValue,pixelIndex.x,pixelIndex.y)
            }
        }catch(e){
            console.error("Failed to manipulate image");
            throw e;
        }
        
        return;
       

        function manipulatePixel(px:Pixel,pxm:PixelMask){
            
            if((px.a %2 === 0 && pxm.a) || (px.a %2 === 1 && !pxm.a) ){
                px.a = changeValue(px.a);
            }
            if((px.r %2 === 0 && pxm.r) || (px.r %2 === 1 && !pxm.r) ){
                px.r = changeValue(px.r);
            }
            if((px.g %2 === 0 && pxm.g) || (px.g %2 === 1 && !pxm.g) ){
                px.g = changeValue(px.g);
            }
            if((px.b %2 === 0 && pxm.b) || (px.b %2 === 1 && !pxm.b) ){
                px.b = changeValue(px.b);
            }
            return px;


            /// Change the value % 2 of the pixel. (0 --> 1; 1 --> 0)
            function changeValue(x:number){
                if(x === 0){
                    return 1;
                }else if( x=== 255){
                    return 254;
                }else{                  
                    return x += (Math.round(Math.random())*2)-1 //returns either 1 or -1
                    
                }
            }

        }
    }
}