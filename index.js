var express = require("express");
var http = require("http");
var path = require("path");
var bodyParser = require("body-parser");

var child_process = require("child_process");
var shell = require("shelljs");

// Dependencies
if (!shell.which('git')) {
    shell.echo("Please install git.");
    shell.exit(1);
}
if (!shell.which('npm')) {
    shell.echo("Please install npm.");
    shell.exit(1);
}
// Navigate to project path specified in paramter
shell.cd(process.argv[2]);

// Declaration
const port = 3001;
var currentVersion = "v0.0.0";

// Set up server
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const server = http.createServer(app);
server.listen(port, () => {
    shell.echo("listening on *:" + port);
});

// Set up routing
app.get("/", (req, res) => {
    res.sendStatus(401);
});

app.post("/deploy", (req, res) => {
    if (!validateBody(req.body)) {
        shell.echo("Incorrect request.");
        res.sendStatus(400);
        return;
    }
    let semanticVersionUpdate = getVersionLevel(req.body.ref);
    shell.echo(semanticVersionUpdate);

    if (semanticVersionUpdate >= 1) {
        var gitPull = pull();
        if (semanticVersionUpdate >=  2) {
            var npmBuild = build();
        }
        if (semanticVersionUpdate >= 3) {
            serverProcess = getNewServer();
        }
    }

    currentVersion = req.body.ref;
    res.sendStatus(200);
    shell.echo("Done.");
});

function validateBody(body) {
    shell.echo(body);
    shell.echo(body.ref_type);
    shell.echo(body.ref);

    var isTag = body.ref_type === "tag";
    var isRelease = body.ref != undefined && body.ref[0] === "v";

    return isTag && isRelease;
}

function getVersionLevel(newVersion) {
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

    if (major !== oldMajor) {
        return 3;
    }
    if (minor !== oldMinor) {
        return 2;
    }
    if (patch !== oldPatch) {
        return 1;
    }

    return "No changes";
}

function pull() {
    shell.echo("Pulling latest changes... ");
    return shell.exec("git pull");
}

function build() {
    shell.echo("Building... ");
    return shell.exec("npm run build", { silent:true });
}

var serverProcess = getNewServer(true);
function getNewServer(init = false) {
    shell.echo("Restarting server... ");
    if (!init)
        process.kill(-serverProcess.pid);    
    return child_process.spawn("npm", ["run", "server"], { detached: true });
}
serverProcess.on("error", (err) => {
    shell.echo(err);
});
serverProcess.on("close", (code, signal) => {
    shell.echo("close: " + code + " - " + signal);
});
serverProcess.stderr.on("data", (something) => {
    shell.echo("something stderr: " + something);
});
