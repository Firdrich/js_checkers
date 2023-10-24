export {Net};
import {Game} from "./Game.js";
class Net {

    static login(nickname) {
        let data = { action: "_LOGIN", login: nickname};
        $.ajax({
            url: "/",
            data: data,
            type: "POST",
            success: (data) => {
                let reqData = JSON.parse(data);
                if (reqData == "LOGIN_1") {let game = new Game("white", nickname);}
                else if (reqData == "LOGIN_2") {let game = new Game("red", nickname);}
                else alert("A game is already taking place!");
            },
            error: function (xhr, status, error) {
                console.log(xhr);
            }
        })
    }

    static checkPlayer1(callback) {
        let data = { action: "_CHECK1"};
        $.ajax({
            url: "/",
            data: data,
            type: "POST",
            success: (data) => {
                let reqData = JSON.parse(data);
                callback(reqData);
            },
            error: function (xhr, status, error) {
                console.log(xhr);
            }
        });
    }
    
    static checkPlayer2(callback) {
        let data = { action: "_CHECK2"};
        $.ajax({
            url: "/",
            data: data,
            type: "POST",
            success: (data) => {
                let reqData = JSON.parse(data);
                callback(reqData);
            },
            error: function (xhr, status, error) {
                console.log(xhr);
            }
        });
    }

    static fetchMove(callback) {
        let data = {action: "_MOVE_FETCH"};
        $.ajax({
            url: "/",
            data: data,
            type: "POST",
            success: (data) => {
                let reqData = JSON.parse(data);
                callback(reqData);
            },
            error: function (xhr, status, error) {
                console.log(xhr);
            }
        })
    }

    static pushMove(pushMove) {
        let data = {action: "_MOVE_PUSH", move: JSON.stringify(pushMove)};
        $.ajax({
            url: "/",
            data: data,
            type: "POST",
            success: (data) => {
                
            },
            error: function (xhr, status, error) {
                console.log(xhr);
            }
        })
    }
}