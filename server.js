let fs = require("fs");
let http = require("http");
let qs = require("querystring");

let loggedUsers = [];
let move = null;

let server = http.createServer(function(req, res) {
    if (req.method == "GET") {
        if (req.url == "/") {
            fs.readFile("static/html/index.html", function (error, data) {
                if (error) {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.write("<h1>błąd 404 - nie ma pliku!<h1>");
                    res.end();
                }

                else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(data);
                    res.end();
                }
            });
        }
        else {
            let urlTab = decodeURI(req.url).split("/");
            let extension = urlTab.pop().split(".")[1];
            //console.log(req.url);
            switch (extension) {
                case "html":
                    fs.readFile(`static/${decodeURI(req.url)}`, function (error, data) {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.write(data);
                            res.end()
                        }
                        
                    })
                    break;
                case "css":
                    fs.readFile(`static/${decodeURI(req.url)}`, function (error, data) {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            res.writeHead(200, { 'Content-Type': 'text/css' });
                            res.write(data);
                            res.end()
                        }
                        
                    })
                    break;
                case "js":
                    fs.readFile(`static/${decodeURI(req.url)}`, function (error, data) {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            res.writeHead(200, { 'Content-Type': 'application/javascript' });
                            res.write(data);
                            res.end()
                        }
                        
                    })
                    break;
                case "jpg":
                    fs.readFile(`static/${decodeURI(req.url)}`, function (error, data) {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            res.writeHead(200, { 'Content-Type': 'image/jpg' });
                            res.write(data);
                            res.end()
                        }
                        
                    })
                    break;
            }
        }    
    }
    else if (req.method == "POST") {
        let reqData = "";

        req.on("data", function (data) {
            reqData += data;
        });

        req.on("end", function () {
            reqData = qs.parse(reqData);
            let resData;
            switch(reqData.action) {
                case "_LOGIN":
                    if (loggedUsers.length == 0) {
                        loggedUsers.push(reqData.login);
                        resData = "LOGIN_1";
                    }
                    else if (loggedUsers.length == 1){
                        loggedUsers.push(reqData.login);
                        resData = "LOGIN_2";
                    }
                    else if (loggedUsers.length == 2) {
                        resData = "LOGIN_MAX";
                    }
                    console.log(reqData.login);
                    break;    
                case "_CHECK1":
                    resData = loggedUsers[0];
                    break;
                case "_CHECK2":
                    if (loggedUsers.length == 2) {
                        resData = loggedUsers[1];
                    }
                    else resData = false;
                    break;
                case "_MOVE_FETCH":
                    resData = move;
                    break;
                case "_MOVE_PUSH":
                    move = JSON.parse(reqData.move);
                    console.log(JSON.parse(reqData.move));
                    break;
            }

            res.end(JSON.stringify(resData));
        })   
    }
})

server.listen(3000, function() {
    console.log("Server running at 3000");
})