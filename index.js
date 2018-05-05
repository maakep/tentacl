var express = require("express");
var http = require("http");
var path = require("path");
var bodyParser = require("body-parser");

var child_process = require("child_process");
var shell = require("shelljs");
if (!shell.which('git')) {
    shell.echo("Please install git.");
    shell.exit(1);
}
if (!shell.which('npm')) {
    shell.echo("Please install npm.");
    shell.exit(1);
}

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const server = http.createServer(app);

const port = 3001;
var currentVersion = "v0.0.0";

app.get("/", (req, res) => {
    res.sendStatus(401);
});

shell.cd(process.argv[2]);
//var serverProcess = shell.exec("npm run server &", {async: true});
var serverProcess = child_process.spawn("npm", ["run", "server"], { detached: true });
serverProcess.on("error", (err) => {
    shell.echo(err);
});
serverProcess.on("close", (code, signal) => {
    shell.echo("close: " + code + " - " + signal);
});

serverProcess.stderr.on("data", (something) => {
    shell.echo("something stderr: " + something);
});

app.post("/deploy", (req, res) => {
    if (!validateBody(req.body)) {
        shell.echo("Incorrect request.");
        res.sendStatus(400);
        return;
    }
    let semanticVersionUpdate = getVersion(req.body.ref);

    /*var pull = await pull();
    var build = await build();*/

    shell.echo("Shutting down server...");
    process.kill(-serverProcess.pid);
    serverProcess.kill();
    if (shell.exec("git pull").code === 0) {
        if (shell.exec("npm run build", {silent:true}).code === 0) {
            shell.echo("Build done, starting server... ");
            serverProcess = child_process.spawn("npm", ["run", "server"], { detached: true });
            currentVersion = req.body.ref;
            res.sendStatus(200);
            shell.echo("Done.");
            return;
        } else {
            shell.echo("Build failed");
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


function validateBody(body) {
    shell.echo(body);
    shell.echo(body.ref_type);
    shell.echo(body.ref);

    var isTag = body.ref_type === "tag";
    var isRelease = body.ref != undefined && body.ref[0] === "v";

    return isTag && isRelease;
}

function getVersion(newVersion) {
    newVersion = newVersion.substring(1);
    var versions = newVersion.split(".");
    var major = versions[0];
    var minor = versions[1];
    var patch = versions[2];

    var oldVersion = currentVersion.substring(1);
    var oldVersions = oldVersion.split(".");
    var oldMajor = oldVersions[0];
    var oldMinor = oldVersions[1];
    var oldPatch = oldVersions[2];

    if (oldMajor !== major) {
        return "MAJOR";
    }
    if (minor !== oldMinor) {
        return "MINOR";
    }
    if (patch !== oldPatch) {
        return "PATCH";
    }

    return "No changes";
}

async function pull() {
    return shell.exec("git pull");
}

async function build() {
    return shell.exec("npm run build");
}

server.listen(port, () => {
    shell.echo("listening on *:" + port);
});
