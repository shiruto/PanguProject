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

const diceStatus = {
    Normal: 0,
    Fixed: 1,
    Wild: 2
}

class ItemObj {
    constructor(id) {
    }

    addItemTo(parent) {
        let item = document.createElement("button");
        item.className = "item";
        let nameE = document.createElement('p');
        nameE.className = "itemName";
        nameE.innerText = this.name;
        item.id = this.name;
        let desE = document.createElement('p');
        desE.innerText = this.des;
        desE.className = "itemDes";
        item.appendChild(nameE);
        item.appendChild(desE);
        parent.appendChild(item);
    }
}

class Blueprint extends ItemObj {
    constructor(id) {
        this.name = BlueprintList[id].name;
        this.des = BlueprintList[id].cost + "\n" + BlueprintList[id].effect;
    }
}

class Project extends ItemObj {
    constructor(id) {
        this.name = ProjectList[id].name;
        this.des = ProjectList[id].cost;
    }
}

class Dice {
    constructor(num, Status = diceStatus.Normal) {
        this.num = num;
        this.diceStatus = Status;
    }

    addDiceTo(parent) {
        var dice = document.createElement("button");
        dice.className = "Dice";
        var numE = document.createElement("p");
        numE.className = "DiceNum"
        numE.innerText = "" + this.num;
        numE.appendChild(dice);
        switch (this.diceStatus) {
            case diceStatus.Normal:
                dice.style.backgroundColor = 'white';
                break;
            case diceStatus.Fixed:
                dice.style.backgroundColor = 'grey';
                break;
            case diceStatus.Wild:
                dice.style.backgroundColor = 'yellow';
                break;
        }
        dice.appendChild(parent);
    }
}

const turnManager = document.querySelector('#turnManager');
const ProjectsE = document.querySelector('#Projects');
const ColonyE = document.querySelector('#Colony');
const BlueprintE = document.querySelector('#Blueprint');
const DiceE = document.querySelector('#Dice');
const PreserveE = document.querySelector('#Preserve');
const MODSumE = document.querySelector('#MODleft');
const totalTurn = 10;
var turnPassed;
var ProjectLeft;
var BlueprintLeft;
var ifBuiltThisTurn = false;
var commandCenterChance = 2;

function UpdateTurnInfo() {
    turnManager.innerText = "Turn passed: " + turnPassed + "/" + totalTurn;
}

function InitGame() {
    turnPassed = 0;
    UpdateTurnInfo();
    document.querySelectorAll('ul').forEach(element => {
        if (element.firstChild != null)
            element.removeChild();
    });
    baseColonyList.forEach(element => {
        let child = document.createElement("button");
        let nameE = document.createElement('p');
        let desE = document.createElement('p');
        child.id = "baseColony" + element.id;
        nameE.className = "itemName";
        nameE.innerText = element.name;
        desE.innerText = element.effect;
        desE.className = "itemDes";
        child.appendChild(nameE);
        child.appendChild(desE);
        ColonyE.appendChild(child);
    })
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

function GetSelectedDices() {

}

var turnEndEvents = new Array();
function EndTurn() {
    turnPassed++;
    if (turnPassed == totalTurn) {
        alert("gameOver");
        return;
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
}

InitGame();

