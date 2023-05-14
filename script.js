'use strict'

let jsonData;

let xhr = new XMLHttpRequest();
xhr.open('GET', './data.json', false);
xhr.send();

if (xhr.status === 200) {
    jsonData = JSON.parse(xhr.responseText);
} else {
    console.error('Failed to load JSON file');
}

var ProjectList = jsonData.projects;
var BlueprintList = jsonData.blueprints;
var baseColonyList = jsonData.baseColony;

class ItemObj {
    constructor() {
        this.item = document.createElement("button");
        this.nameE = document.createElement('p');
        this.desE = document.createElement('p');
        this.item.className = "item";
        this.nameE.className = "itemName";
        this.desE.className = "itemDes";

    }

    buy() {
        if (this.isValid()) {
            this.BuyImplement();
        }
    }

    BuyImplement() {

    }

    isValid() { }

    addItemTo(parent) {
        this.nameE.innerText = this.name;
        this.desE.innerText = this.des;
        this.item.appendChild(this.nameE);
        this.item.appendChild(this.desE);
        parent.appendChild(this.item);
    }
}

class Blueprint extends ItemObj {
    constructor(id) {
        this.name = BlueprintList[id].name;
        this.des = BlueprintList[id].cost + "\n" + BlueprintList[id].effect;
        super();
        this.item.id = "Blueprint" + id;
        this.clickable = true;
        this.clickChance = 1;
    }

    addBlueprintTo() {
        super.addItemTo(BlueprintE);
    }

    buy() {
        if (super.buy()) {
            var ele = document.getElementById("Blueprint" + id);
            ColonyE.append(ele.cloneNode());
            ele.remove();
            document.querySelectorAll(".SelectedDices").forEach(e => e.remove());
        }
    }

    dismiss() {
        if (this.bought) return;
        MODSum++;
        document.querySelector("#Blueprint" + this.id).remove();
    }
}

class Headquarter extends ItemObj {
    constructor() {
        super();
        this.name = "Headquarter";
        this.des = "Start of turn: Roll 4 Basic dices";
        this.item.id = "baseColony1";
        this.clickable = true;
        this.clickChance = 2;
    }

    BuyImplement() {
        turnStartEvents.push(() => {
            for (let i = 0; i < 4; i++) {
                RollADieAt(dicePlace.Normal);
            }
        });
        this.addItemTo();
    }

    isValid() {
        return true;
    }

    addItemTo() {
        super.addItemTo(ColonyE);
    }

}

class MinorSettlement extends Blueprint {
    constructor() {
        super(1);
        this.clickChance = 1;
        this.bought = false;
    }

    buy() {
        super.buy();
        this.bought = true;
    }

}

class Project extends ItemObj {
    constructor(id) {
        this.name = ProjectList[id].name;
        this.des = ProjectList[id].cost;
        super();
        this.item.id = "Project" + id;
    }

    addProjectTo(parent) {
        super.addItemTo(parent);
    }

    buy() {
        if (super.buy()) {
            document.getElementById("Project" + id).remove();
            document.querySelectorAll(".SelectedDices").forEach(e => e.remove());
            if (--projectLeft <= 0) {
                Win();
            }
        }
    }

    isValid() {
        return false;
    }

}

class InariProject extends Project {
    constructor() {
        super(0);
    }

    buy() {
        super.buy();
    }

    isValid() {
        if (selectedDices.length != 6) return false;
        selectedDices.forEach(e => {
            if (e != 1) return false;
        });
        return true;
    }
}

class DazbogProject extends Project {
    constructor() {
        super(1);
    }

    buy() {
        super.buy();
    }

    isValid() {
        if (selectedDices.length != 7) return false;
        selectedDices.forEach(e => {
            if (e.num != selectedDices[0]) return false;
        });
        return true;
    }
}

class PanguProject extends Project {
    constructor() {
        super(2);
    }

    buy() {
        super.buy();
    }

    isValid() {
        let sum = 0;
        selectedDices.forEach(e => {
            sum += e.num;
        });
        if (sum != 40) return false
        else return true;
    }
}

class VestaProject extends Project {
    constructor() {
        super(3);
    }

    buy() {
        super.buy();
    }

    isValid() {
        let sum1 = 0;
        let sum2 = 0;
        let num1 = 0, num2 = 0;
        if (!ifBuiltThisTurn) return false;
        if (selectedDices.length != 6) return false;
        selectedDices.forEach(e => {
            if (sum1 > 3 || sum2 > 3) return false;
            if (num1 == e.num) sum1++;
            if (num2 == e.num) sum2++;
            if (num1 == 0) {
                sum1 = 1;
                num1 = e.num;
            }
            if (e.num != num1 && num2 == 0) {
                sum2 = 1;
                num2 = e.num;
            }
            if (num1 != 0 && num2 != 0 && Math.abs(num1 - num2) > 1) return false;
            if (e.num != num1 && e.num != num2) return false;
        });
        return true;
    }
}

class TeKoreProject extends Project {
    constructor() {
        super(4);
    }

    buy() {
        super.buy();
    }

    isValid() {
        let sum1 = 0;
        let sum2 = 0;
        let num1 = 0, num2 = 0;
        if (selectedDices.length != 8) return false;
        selectedDices.forEach(e => {
            if (sum1 > 4 || sum2 > 4) return false;
            if (num1 == 0) {
                num1 = e.num;
                sum1 = 1;
            }
            if (num1 != e.num && num2 == 0) {
                num2 = e.num;
                sum2 = 1;
            }
            if (num1 != e.num && num2 != e.num) return false;
        });
        return true;
    }
}

class VinshuProject extends Project {
    constructor() {
        super(5);
    }

    buy() {
        super.buy();
    }

    isValid() {
        if (selectedDices.length != 6) return false;
        selectedDices.forEach(e => {
            if (e.num != 6) return false;
        });
        return true;
    }
}

class FreyaProject extends Project {
    constructor() {
        super(6);
    }

    buy() {
        super.buy();
    }

    isValid() {
        if (selectedDices.length != 8) return false;
        let sum = new Array();
        let num = new Array();
        selectedDices.forEach(e => {
            if (sum.some(n => n > 2)) return false;
            if (num.length > 4) return false;
            if (num.some(n => n == e.num)) {
                sum[num.indexOf(num.find(n => n == e))]++;
            }
            else num.push(e.num);
            if (num.some(n => n == 1) && (num.some(n => n == 5) || num.some(n => 6))) return false;
            if (num.some(n => n == 2) && num.some(n => 6)) return false;
        });
        return true;
    }
}

class QuetzalcoatlProject extends Project {
    constructor() {
        super(7);
    }

    buy() {
        super.buy();
    }

    isValid() {
        let count = 0;
        selectedDices.forEach(e => {
            if (e.num % 2 != 0) {
                if (e.palce == dicePlace.Preserve) count += 2;
                else count++;
            }
        });
        if (count == 10) return true;
        else return false;
    }
}

class AthenaProject extends Project {
    constructor() {
        super(8);
    }

    buy() {
        super.buy();
    }

    isValid() {
        let count = 0;
        selectedDices.forEach(e => {
            if (e.Status != diceStatus.Wild) {
                count++;
            }
        });
        if (count == 4) return true;
        else return false;
    }
}

class HerusProject extends Project {
    constructor() {
        super(9);
    }

    buy() {
        super.buy();
    }

    isValid() {
        if (selectedDices.length != 6) return false;
        let nums = {};
        selectedDices.forEach(e => {
            if (nums.some(n => e == n)) return false;
            nums.push(e);
        });
        return false;
    }
}

const turnManager = document.querySelector('#turnManager');
const ProjectsE = document.querySelector('#Projects>ul');
const ColonyE = document.querySelector('#Colony>ul');
const BlueprintE = document.querySelector('#Blueprint>ul');
const DiceE = document.querySelector('#Dice>ul');
const PreserveE = document.querySelector('#Preserve>ul');
const MODSumE = document.querySelector('#MODleft');
const startBtn = document.querySelector("#NewGameButton");
const nextTurnBtn = document.getElementById("NextTurnBtn");
const MODPlusBtn = document.getElementById("MODPlusBtn");
const MODMinusBtn = document.getElementById("MODMinusBtn");
const totalTurn = 10;
var HeadquarterUseChance = 2;
var turnPassed = 0;
var ProjectLeft;
var BlueprintLeft;
var ifBuiltThisTurn = false;
var commandCenterChance = 2;
var selectedDices = new Array();
var projectLeft = 4;
var MODSum = 0;
var canChangeSixToOne = false;
var Colonies = new Array();
var Projects = new Array();
var Blueprints = new Array();

function UpdateTurnInfo() {
    turnManager.innerText = "Turn passed: " + turnPassed + "/" + totalTurn;
}

function GameStart() {
    turnPassed = 0;
    UpdateTurnInfo();
    document.querySelectorAll('ul').forEach(element => {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    });
    // baseColonyList.forEach(element => {
    //     let child = document.createElement("button");
    //     let nameE = document.createElement('p');
    //     let desE = document.createElement('p');
    //     child.id = "baseColony" + element.id;
    //     child.className = "item";
    //     nameE.className = "itemName";
    //     nameE.innerText = element.name;
    //     desE.innerText = element.effect;
    //     desE.className = "itemDes";
    //     child.appendChild(nameE);
    //     child.appendChild(desE);
    //     ColonyE.appendChild(child);
    // })
    nextTurnBtn.style.display = "inline-block";
    Dices.length = 0;
    nextTurnBtn.addEventListener('click', () => EndTurn());
    MODPlusBtn.addEventListener('click', () => {
        if (selectedDices.length != 1) return;
        if (MODSum >= 1 && (selectedDices[0].num != 6 || canChangeSixToOne)) {
            selectedDices[0].ChangeNum(++selectedDices[0].num);
            if (selectedDices[0].Status != diceStatus.Wild) MODSum--;
            UpdateMOD();
        }

    });
    MODMinusBtn.addEventListener('click', () => {
        if (selectedDices.length != 1) return;
        if (MODSum >= 1 && (selectedDices[0].num != 1 || canChangeSixToOne)) {
            selectedDices[0].ChangeNum(--selectedDices[0].num);;
            if (selectedDices[0].Status != diceStatus.Wild) MODSum--;
            UpdateMOD();
        }
    });
    var headquarter = new Headquarter();
    headquarter.buy();
    // Headquarter.addEventListener('click', () => {
    //     if (HeadquarterUseChance != 0)
    //         selectedDices.forEach(e => e.Reroll());
    // });
    StartTurn();
}

function RollADieAt(Place, num = 0) {
    let p;
    switch (Place) {
        case dicePlace.Normal:
            p = DiceE;
            break;
        case dicePlace.Preserve:
            p = PreserveE;
            break;
    }
    let tempDice = new Dice();
    if (num == 0) tempDice.Reroll();
    else tempDice.ChangeNum(num);
    return tempDice;
}

startBtn.addEventListener('click', () => GameStart());

function UpdateMOD() {
    MODSumE.innerText = "" + MODSum;
}

function GetRandomProject() {
    if (ProjectLeft == 0) {
        alert("no more project");
        return;
    }

}

function GetRandomBlueprint() {
    if (BlueprintLeft == 0) {
        alert("no more project");
        return;
    }

}

function GetRandomNumWithin(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var turnEndEvents = new Array();
function EndTurn() {
    turnPassed++;
    UpdateTurnInfo();
    if (turnPassed == totalTurn) {
        alert("gameOver");
        return;
    }
    while (DiceE.firstChild) {
        DiceE.removeChild(DiceE.firstChild);
    }
    if (turnEndEvents.length != 0) {
        turnEndEvents.forEach(element => {
            if (typeof element != 'function') {
                alert("wrong turn end event type");
                return;
            }
            element();
        });
    }
    StartTurn();
}

var turnStartEvents = new Array();
function StartTurn() {
    if (turnStartEvents.length != 0) {
        turnStartEvents.forEach(element => {
            if (typeof element != 'function') {
                alert("wrong turn start event type");
                return;
            }
            element();
        });
    }
    Colonies.forEach(e => {
        if (e.clickable) e.classList.add("clickable");
    });
}

function Win() {
    alert("you win");
}

var diceID = 0;
var Dices = new Array();
function GetDiceID() {
    return diceID++;
}

const diceStatus = {
    Normal: 'white',
    Fixed: 'grey',
    Wild: 'yellow'
}

const dicePlace = {
    Normal: DiceE,
    Preserve: PreserveE
}

class Dice {
    constructor(num = 1, Status = diceStatus.Normal, Place = dicePlace.Normal) {
        this.num = num;
        this.diceStatus = Status;
        this.id = GetDiceID();
        this.place = Place;
        Dices.push(this);
        if (this.place == dicePlace.Normal) {
            this.addDiceTo(DiceE);
        }
        else this.addDiceTo(PreserveE);
    }

    addDiceTo(parent) {
        this.dice = document.createElement("button");
        this.dice.className = "Dice";
        this.dice.id = "Dice" + this.id;
        var numE = document.createElement("p");
        numE.className = "DiceNum"
        numE.innerText = "" + this.num;
        this.dice.appendChild(numE);
        this.dice.addEventListener('click', () => {
            if (this.dice.classList.contains("SelectedDice")) {
                this.dice.classList.remove("SelectedDice");
                selectedDices.splice(selectedDices.indexOf(this), 1);
            }
            else {
                this.dice.classList.add("SelectedDice");
                selectedDices.push(this);
            }
        });
        parent.appendChild(this.dice);
        this.UpdateVisual();
    }

    Reroll() {
        this.num = GetRandomNumWithin(1, 6);
        this.UpdateVisual();
    }

    ChangeNum(targetNum) {
        this.num = targetNum;
        this.UpdateVisual();
    }

    UpdateVisual() {
        this.dice.firstChild.innerText = "" + this.num;
        this.dice.style.backgroundColor = this.diceStatus;
        if (this.dice.parentElement != this.place) {
            this.place.appendChild(this.dice);
        }
    }
}

GameStart();
var d = new Dice(1);
d.diceStatus = diceStatus.Fixed;
d.Reroll();
MODSum = 10;