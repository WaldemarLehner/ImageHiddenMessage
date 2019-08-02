var fs = require("fs");
var cli = require("readline-sync");
selectImage();
function selectImage() {
    var cliConfig = {
        validate: validateImagePath ? true : "Given path is not a .png or does not exist",
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
