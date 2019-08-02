const fs = require("fs");
const cli = require("readline-sync");
const jimp = require("jimp");
beginning:
while(true){
    let path = selectImage();
    let image = getImage(path);
    if(typeof image === "undefined"){
        continue beginning;
    }
    let message : string | undefined;
    //If correct entry is found, try to decode hidden message
    if(checkIfEntryExists(image)){

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

function checkIfEntryExists(image:any):boolean{


    
}