import { Stream } from "stream";

export {
    decode,
    encode,
    decodeAsNumber
};


function decode(buf:Uint8Array) : string {
    return  Buffer.from(buf).toString("utf8");
    
}

function encode(message:string) : Uint8Array{
    let buf = Buffer.from(message,"utf-8");
    return new Uint8Array(buf);
}

function decodeAsNumber(buf:Uint8Array):number{
    //TODO
        let number = 0;
        for(let i = 0; i < buf.length; i++){
            number += buf[i];
            number = number << 8;
        }

        return number >> 8
    }