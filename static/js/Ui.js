import {Net} from "./Net.js";
export {Ui};
class Ui {

    static init() {
        $("#loginButton").on("click", function() {
            let nickname = $("#loginText").val();
            Net.login(nickname);
        })
    }

    static showWaitingScreen() {
        $("#waiting").css("display","block");
    }

    static hideWaitingScreen() {
        $("#waiting").css("display", "none");
    }

    static showUi(color, opponentName) {
        $("#ui").css("display", "block");
        $("#ui1").text(`Grasz ${color} przeciwko ${opponentName}`);
    }

    static updateTurn(playerName) {
        $("#uiTurn").text(`Tura ${playerName}`);
    }

    static resetTimer(prevInterval) {
        if (prevInterval != null) {
            clearInterval(prevInterval);
        }
        $("#timer").text(30);
        let time = 30;
        let timerInterval = setInterval(()=> {
            $("#timer").text(time);
            time--;
            if (time == 0) clearInterval(timerInterval);
        }, 1000)
        return timerInterval;
    }
    


}