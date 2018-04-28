var express = require("express");
var http = require("http");
var path = require("path");
var bodyParser = require("body-parser");

var shell = require("shelljs");

if (!shell.which('git')) {
    shell.echo("Git is required, please install");
    shell.exit(1);
}
const port = 3001;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = http.createServer(app);

app.get("/", (req, res) => {
    res.sendStatus(401);
});

shell.cd(process.argv[2]);
var processId = shell.exec("npm run server &", {silent: true}).stdout;
console.log(processId);
app.post("/deploy", (req, res) => {
    var notTag = req.body.ref_type !== "tag";
    console.log(req.body.ref_type);
    console.log(req.body.ref);

    if (notTag) {
        res.sendStatus(400);
        return;
    }

    var tagName = req.body.ref;
    if (tagName == undefined || tagName[0] !== 'v') {
        res.sendStatus(400);
        return;
    }

    shell.exec("kill " + processId);
    if (shell.exec("git pull").code === 0) {
        if (shell.exec("npm run build").code === 0) {
            processId = shell.exec("npm run server &").stdout;
            console.log(processId);
            res.sendStatus(200);
            return;
        } else {
            res.sendStatus(500);
            return;
        }
    } else {
        res.sendStatus(503);
        return;
    }
    // res.sendFile(path.join(__dirname, "../../" + req.url));
    // git pull.then() npm run build.then() npm run server
});

server.listen(port, () => {
    console.log("listening on *:" + port);
});
