

export {
    decode,
    encode
};
import * as convert from "./convert";


function decode(boolArr:boolean[]):string{
    //First check that the input is a multiple of 8
    if(boolArr.length % 8 !== 0){
        throw new Error("the input's length needs to be a multiple of 8, as 8 bits represent one char");
    }
    //Split up into blocks of 8
    let boolBlocks : Array<boolean[]> = [];
    for(let i = 0; i < boolArr.length / 8;i++){
        boolBlocks.push([
            boolArr[8*i+0],boolArr[8*i+1],boolArr[8*i+2],boolArr[8*i+3],boolArr[8*i+4],boolArr[8*i+5],boolArr[8*i+6],boolArr[8*i+7]
        ])
    }
    //Get the values from the blocks
    let charCodeArray :number[] = [];
    for(let bools of boolBlocks){
        const value = convert.boolArrayToInt(bools)
        charCodeArray.push(value)
    }
    //Generate a String out of the charcodes.
    let returnString : string = "";
    const backslashindex = charset.indexOf("\\");
    for(let i = 0; i < charCodeArray.length; i++){
        const charcode = charCodeArray[i];
        if(charcode===backslashindex){ // \
            i++;
            if(charCodeArray[i] === backslashindex){
                // we have a \\ -> escaped \
                returnString += "\\";
            }else{ // \number
                let numberString = "";
                while(charCodeArray[i] !== backslashindex){
                    numberString += charset[charCodeArray[i++]];
                }
                // \number\
                if(Number(numberString) === NaN){
                    console.log("[WARN] Failed to parse one of the characters. Skipping character.");
                }else{
                    returnString += String.fromCharCode(Number.parseInt(numberString,10));
                }

            }
        }else{
            if(charcode >= charset.length){
                console.log("[WARN] Failed to parse one of the characters. Skipping character.");
            }else{
                returnString += charset[charcode];
            }
        }
    }
    return returnString;



}



/**
 * returns the booleanarray that represents the message. Characters that are not in the charset
 * are stored as "\charcode\", if a \ should be encoded it is escaped like "\\"
 */ 

function encode(msg:string):boolean[]{
    let indexArray : number[] = []; //CharArray
    for(const char of msg.split("")){
        let index = charset.indexOf(char);
        if(index === -1){
            // The char is not part of the charset. Use \charcode\ instead to encode
            let charcode = char.charCodeAt(0).toString().split("");
            const backslashindex = charset.indexOf("\\");
            indexArray.push(backslashindex);
            for(const decimal of charcode){
                indexArray.push(charset.indexOf(decimal));
            }
            indexArray.push(backslashindex);
        }else{
            indexArray.push(index);
        }
    }
    let returnArray : boolean[] = [];
    //Now generate the BoolArray from the Chararray.
    for(const index of indexArray){
        //Each char takes 8 bits. So each char takes 8 bools in the return array.
        if(index > 255){
            throw new Error("CharCode cannot be greater than 255.")
        }
        let indexAsBoolArr:boolean[] = [];
        indexAsBoolArr.push(...convert.intToBoolArray(index,8))
       
        returnArray.push(...indexAsBoolArr);
    }
    return returnArray;

}


const charset = " 0123456789abcdefghijklmnopqrstuvwABCDEFGHIJKLMNOPQRSTUVWXYZ,.;:-_!\"§$%&/()=?#'<>@€*+öäüÖÄÜ^[]{}|~´`âêîôûáéíóúàèìòùÂÊÎÔÛÁÉÍÓÚÀÈÌÒÙ\\".split("");