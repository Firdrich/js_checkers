export {Game};
import {textures} from "./textures.js";
import {Ui} from "./Ui.js";
import {Net} from "./Net.js";

class Game {
    constructor(player, playerName) {
        //before game setup
        if (player == "white"){
            Ui.showWaitingScreen();
            let player2Interval = setInterval(() => {
                let fetchedPlayer = null;
                Net.checkPlayer2((player2) => {
                    console.log(player2);
                    fetchedPlayer = player2;
                    if(fetchedPlayer) {
                        this.redPlayerName = fetchedPlayer;
                        clearInterval(player2Interval);
                        Ui.hideWaitingScreen();
                        Ui.showUi("białymi",this.redPlayerName);
                    }
                });
                
            }, 1000)
        }
        if (player == "red") {
            Net.checkPlayer1((player1) => {
                console.log(player1);
                let fetchedPlayer = player1;
                if(fetchedPlayer) {
                    this.whitePlayerName = fetchedPlayer;
                    Ui.showUi("czerwonymi",this.whitePlayerName);
                }
            });
            let moveInterval = setInterval(() => {
                Net.fetchMove((move) => {
                    if(move != null) {
                        for (let object of this.scene.children) {
                            if (object.userData.id == move.id) {
                                object.position.x = move.newPosition.x;
                                object.position.z = move.newPosition.z;
                                this.nextTurn();
                                clearInterval(moveInterval);
                                break;
                            }
                        }
                    }   
                    });
            }, 500);
        }
        this.turn = "white";

        
        this.player = player;
        if (this.player == "white") {
            this.whitePlayerName = playerName;
        }
        else {
            this.redPlayerName = playerName;
        }
        this.selectedChecker = null;
        this.previousMove = null;
        this.prevTimerInterval = null;
        this.board = [
            [0,2,0,2,0,2,0,2],
            [2,0,2,0,2,0,2,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,1,0,1,0,1,0,1],
            [1,0,1,0,1,0,1,0]
        ]

        //three setup
        $("#root").empty();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
        //this.camera.position.set(1750, 1250, 2250)
        if (this.player == "white") {
            this.camera.position.set(350,1000,1400);
            this.camera.lookAt(350,-100,100);
        }
        else if (this.player == "red") {
            this.camera.position.set(350,1000,-750);
            this.camera.lookAt(350,-100,650);
        }
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0xFFFFFF);
        this.raycaster = new THREE.Raycaster();
        $("#root").append(this.renderer.domElement);

        /*let orbitControl = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        orbitControl.addEventListener('change', () => {
            this.renderer.render(this.scene, this.camera)
        });*/

        let axes = new THREE.AxesHelper(2000);
        this.scene.add(axes);

        this.render();
        this.generateBoard();

        $(window).on("resize", () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        })

        //checkers move
        $("#root").on("mousedown", ()=> {
            let clickVector = new THREE.Vector2((event.clientX / $(window).width()) * 2 - 1, -(event.clientY / $(window).height()) * 2 + 1);
            this.raycaster.setFromCamera(clickVector, this.camera);
            let intersects = this.raycaster.intersectObjects(this.scene.children);
            //anything selected AND valid turn
            if ((intersects.length > 0) && (this.turn == this.player)) {
                //checker selected
                if ((this.player == "white" && intersects[0].object.name == "checkerWhite") || (this.player == "red" && intersects[0].object.name == "checkerRed")) {
                    this.selectedChecker = intersects[0].object;
                    //checking valid fields for this checker
                    this.findValidFields();
                }
                //selected field with previously selected checker
                else if (this.selectedChecker){
                    let field = intersects[0].object;
                    console.log(field);
                    //if valid field selected
                    if (field.userData.valid){
                        console.log("moving");
                        let prevX = this.selectedChecker.position.x;
                        let prevZ = this.selectedChecker.position.z;
                        this.removeChecker(field.position.x, prevX, prevZ);
                        //updating position
                        this.selectedChecker.position.x = field.position.x;
                        this.selectedChecker.position.z = field.position.z;
                        this.selectedChecker.userData.position.x = field.position.x / 100;
                        this.selectedChecker.userData.position.z = field.position.z / 100;
                        //updating board
                        if (this.player == "white") {
                            this.board[field.position.z / 100][field.position.x / 100] = 1;
                        }
                        else {
                            this.board[field.position.z / 100][field.position.x / 100] = 2;
                        }
                        this.board[prevZ/100][prevX/100] = 0;
                        console.log(this.board);
                        //sending move to server
                        let id = this.selectedChecker.userData.id;
                        let newPosition = {x: field.position.x, z: field.position.z};
                        let move = {id: id, newPosition: newPosition};
                        this.previousMove = move;
                        Net.pushMove(move);
                        this.nextTurn();
                    }
                    //clearing valid markers
                    this.selectedChecker = null;
                    for (let object of this.scene.children) {
                        if (object.name == "fieldBlack" && object.userData.valid) {
                            object.userData.valid = false;
                            object.material.color.setHex(0xffffff);
                        }
                    }
                }
            }
            //nothing selected / opponent's turn, unchecking checker
            else {
                this.selectedChecker = null;
            }
        })
    }

    generateBoard() {
        //setup fields
        let idCounter = 0;
        for (let i=0; i<8; i++) {
            for (let j=0; j<8; j++) {
                let field = new Field(((j % 2) + (i % 2)) % 2);
                field.position.x = j*100;
                field.position.z = i*100;
                field.userData.position = {x: j, z: i};
                this.scene.add(field);
            }
        }

        //first row red
        for (let j = 1; j < 8; j+=2) {
            let checker = new Checker(1);
            checker.position.x = j*100;
            checker.position.z = 0;
            checker.userData.position = {x: j, z: 0};
            checker.userData.id = idCounter;
            idCounter++;
            this.scene.add(checker);
        }
        //second row red
        for (let j = 0; j < 8; j+=2) {
            let checker = new Checker(1);
            checker.position.x = j*100;
            checker.position.z = 100;
            checker.userData.position = {x: j, z: 1};
            checker.userData.id = idCounter;
            idCounter++;
            this.scene.add(checker);
        }
        //first row white
        for (let j = 1; j < 8; j+=2) {
            let checker = new Checker(0);
            checker.position.x = j*100;
            checker.position.z = 600;
            checker.userData.position = {x: j, z: 6};
            checker.userData.id = idCounter;
            idCounter++;
            this.scene.add(checker);
        }
        //second row white
        for (let j = 0; j < 8; j+=2) {
            let checker = new Checker(0);
            checker.position.x = j*100;
            checker.position.z = 700;
            checker.userData.position = {x: j, z: 7};
            checker.userData.id = idCounter;
            idCounter++;
            this.scene.add(checker);
        }

    }

    nextTurn() {
        if (this.turn == "white") {
            this.turn = "red";
            Ui.updateTurn(this.redPlayerName);
        }
        else if (this.turn == "red") {
            this.turn = "white";
            Ui.updateTurn(this.whitePlayerName);
        }
        console.log("Player: ", this.player);
        console.log("Turn: ", this.turn);
        if (!(this.turn == this.player)) {
            var moveInterval = setInterval(() => {this.moveListener()}, 500);
        }
        else {
            clearInterval(moveInterval);
        }
        this.prevTimerInterval = Ui.resetTimer(this.prevTimerInterval);
    }

    moveListener() {
        Net.fetchMove((move) => {
            if (move.id != this.previousMove.id && move != null) {
                for (let object of this.scene.children) {
                    if (object.userData.id == move.id) {
                        this.board[object.position.z/100][object.position.x/100] = 0;
                        this.removeChecker(move.newPosition.x,object.position.x, object.position.z);
                        object.position.x = move.newPosition.x;
                        object.position.z = move.newPosition.z;
                        if (this.player == "white") {
                            this.board[object.position.z / 100][object.position.x / 100] = 2;
                        }
                        else {
                            this.board[object.position.z / 100][object.position.x / 100] = 1;
                        }
                        this.nextTurn();
                        this.previousMove = move;
                        break;
                    }
                }
            }
            
        })
    }

    findValidFields() {
        let x = this.selectedChecker.userData.position.x;
        let z = this.selectedChecker.userData.position.z;
        if (this.player == "white") {
            /*
            if (this.board[z-1][x-1] == 2){
                this.validFields.push({x: x - 2, z: z - 2})
            }
            else if (this.board[z-1][x-1] == 0) {
                this.validFields.push({x: x - 1, z: z - 1})
            }
            if (this.board[z-1][x+1] == 2){
                this.validFields.push({x: x + 2, z: z - 2})
            }
            else if (this.board[z-1][x+1] == 0) {
                this.validFields.push({x: x + 1, z: z - 1})
            }*/
            for (let object of this.scene.children) {
                if (object.name == "fieldBlack") {
                    if ((this.board[z-1][x-1] == 2 && this.board[z-2][x-2] == 0 && object.userData.position.x == x-2 && object.userData.position.z == z-2) || 
                        (this.board[z-1][x-1] == 0 && object.userData.position.x == x-1 && object.userData.position.z == z-1) ||
                        (this.board[z-1][x+1] == 0 && object.userData.position.x == x+1 && object.userData.position.z == z-1) ||
                        (this.board[z-1][x+1] == 2 && this.board[z-2][x+2] == 0 && object.userData.position.x == x+2 && object.userData.position.z == z-2)) {
                            object.userData.valid = true;
                            object.material.color = new THREE.Color(0,180,0);
                        }
                    else {
                        object.userData.valid = false;
                        object.material.color.setHex(0xffffff);
                    }
                }
            }
        }
        else {
            /*if (this.board[z+1][x-1] == 1){
                this.validFields.push({x: x - 2, z: z + 2})
            }
            else if (this.board[z+1][x-1] == 0) {
                this.validFields.push({x: x - 1, z: z + 1})
            }
            if (this.board[z+1][x+1] == 1){
                this.validFields.push({x: x + 2, z: z + 2})
            }
            else if (this.board[z+1][x+1] == 0) {
                this.validFields.push({x: x + 1, z: z + 1})
            }*/
            for (let object of this.scene.children) {
                if (object.name == "fieldBlack") {
                    try {
                        if ((this.board[z+1][x-1] == 1 && this.board[z+2][x-2] == 0 && object.userData.position.x == x-2 && object.userData.position.z == z+2) || 
                        (this.board[z+1][x-1] == 0 && object.userData.position.x == x-1 && object.userData.position.z == z+1) ||
                        (this.board[z+1][x+1] == 0 && object.userData.position.x == x+1 && object.userData.position.z == z+1) ||
                        (this.board[z+1][x+1] == 1 && this.board[z+2][x+2] == 0 && object.userData.position.x == x+2 && object.userData.position.z == z+2)) {
                            object.userData.valid = true;
                            object.material.color = new THREE.Color(0,180,0);
                        }
                        else {
                            object.userData.valid = false;
                            object.material.color.setHex(0xffffff);
                        }
                    }
                    catch {}
                }
            }
        }
        
        console.log(this.selectedChecker);
    }

    removeChecker(posX, prevX, prevZ) {
        let removeX = null;
        let removeZ = null;
        //checking if another checker to be removed
        if (Math.abs(posX - prevX) == 200 || Math.abs(posX - prevX == 100)) { //if distance equals 2 then there must be jump over other checker
            if (this.turn == "white") {
                removeZ = prevZ - 100; 
            }
            else {
                removeZ = prevZ + 100;
            }

            if (posX - prevX > 0) { //right
                removeX = prevX + 100;
            } 
            else {
                removeX = prevX - 100;
            }
        }
        //removing checker if necessary
        if (removeX && removeZ) {
            this.board[removeZ/100][removeX/100] = 0;
            for (let object of this.scene.children) {
                if (object.name == "checkerWhite" || object.name == "checkerRed") {
                    if(object.position.x == removeX  && object.position.z == removeZ) {
                        this.scene.remove(object);
                        break;
                    }
                }
            }
        }
    }

    render() {
        requestAnimationFrame(this.render.bind(this));
        this.renderer.render(this.scene, this.camera);
    }
}

class Field extends THREE.Mesh{
    constructor(color) {
        let geometry = new THREE.BoxGeometry(100,50,100);
        let material;
        switch (color) {
            case 0:
                material = new THREE.MeshBasicMaterial({map: textures.fieldWhite});
                super(geometry, material);
                this.name = "fieldWhite";
                break;
            case 1:
                material = new THREE.MeshBasicMaterial({map: textures.fieldBlack});
                super(geometry, material);
                this.name = "fieldBlack";
                break;
        }
        this.userData.valid = false;
        
    }
}

class Checker extends THREE.Mesh{
    constructor(color) {
        let geometry = new THREE.CylinderGeometry(40,40,40,32);
        let material;
        switch (color) {
            case 0:
                material = new THREE.MeshBasicMaterial({map: textures.checkerWhite, color: 0xfafafa});
                super(geometry, material);
                this.name = "checkerWhite";
                break;
            case 1:
                material = new THREE.MeshBasicMaterial({map: textures.checkerRed});
                super(geometry, material);
                this.name = "checkerRed";
                break;
        }
        
        this.position.y += 50;
    }
}