export {
    intToBoolArray,
    boolArrayToInt   
}
/**
 * 
 * @param num The integer to convert
 * @param maxlen If set, the booleanArray will have thi length, that means that it will be filled up with zeroes.
 */
function intToBoolArray(num:number,maxlen?:number) : boolean[] {
    if(num % 1 !== 0){
        throw new TypeError("num needs to be an Integer!");
    }
    let binary = num.toString(2).split("");
    let returnArray:boolean[] = new Array( (maxlen) ? maxlen : binary.length ).fill(false);
    const offset = returnArray.length - binary.length;
    for(let i=0;i<binary.length;i++){
        if(binary[i] === "1"){
            returnArray[offset+i] = true;
        }
    }
    return returnArray;


}
/**
 * Returns a number from a given boolArray
 * @param arr 
 */
function boolArrayToInt(arr:boolean[]):number{
    let binary = "";
    for(const val of arr){
        if(val){
            binary += 1;
        }else{
            binary += 0;
        }
    }
    let value = Number.parseInt(binary,2);
    return value;
}