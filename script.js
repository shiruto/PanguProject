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

var ProjectList = jsonData.projects.slice();
var BlueprintList = jsonData.blueprints.slice();
var baseColonyList = jsonData.baseColony.slice();

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

    Consume() {
        this.dice.remove();
        Dices.splice(Dices.indexOf(this), 1);
    }

    UpdateVisual() {
        this.dice.firstChild.innerText = "" + this.num;
        this.dice.style.backgroundColor = this.diceStatus;
        if (this.dice.parentElement != this.place) {
            this.place.appendChild(this.dice);
        }
    }

}


class ItemObj {
    constructor() {
        this.item = document.createElement("button");
        this.nameE = document.createElement('p');
        this.desE = document.createElement('p');
        this.item.className = "item";
        this.nameE.className = "itemName";
        this.desE.className = "itemDes";
        this.bought = false;
        this.item.addEventListener('click', () => this.buy());
    }

    buy() {
        if (this.isValid()) {
            this.BuyImplement();
            this.bought = true;
            this.clickChance = this.maxClickChance;
            spendDice();
            this.VisualUpdate();
            this.item.removeEventListener('click', () => this.buy());
            this.item.addEventListener('click', () => this.Use());
        }
    }

    BuyImplement() {

    }

    isValid() { }

    Use() {
        if (this.canUse() && this.canImplement()) {
            this.useImplement();
            this.clickChance--;
            this.VisualUpdate();
        }
    }

    useImplement() {

    }

    canUse() {
        return this.clickChance > 0;
    }

    canImplement() {
        return true;
    }

    addItem(parent) {
        this.nameE.innerText = this.name;
        this.desE.innerText = this.des;
        this.item.appendChild(this.nameE);
        this.item.appendChild(this.desE);
        parent.appendChild(this.item);
        this.VisualUpdate();
    }

    VisualUpdate() {
        if (this.bought && this.canUse()) {
            this.item.classList.add("clickable");
        }
        else this.item.classList.remove("clickable");
    }

}

class Blueprint extends ItemObj {
    constructor(id) {
        super();
        let bp = BlueprintList.find(e => e.id == id);
        this.name = bp.name;
        this.des = "Cost: " + bp.cost + "\n" + bp.effect;
        this.item.id = "Blueprint" + id;
        this.clickChance = 1;
        super.addItem(BlueprintE);
        this.bought = false;
    }

    BuyImplement() {
        ColonyE.append(this.item);
    }

    discard() {
        if (this.bought) return;
        MODSum += MODGetWhenDiscard;
        this.item.remove();
    }

    addItem() {
        super.addItem(BlueprintE);
    }
}

class baseColony extends ItemObj {
    constructor(id) {
        super();
        this.name = baseColonyList[id].name;
        this.des = baseColonyList[id].effect;
        this.item.id = "baseColony" + id;
    }

    addItem() {
        super.addItem(ColonyE);
    }

    BuyImplement() {
        this.addItem();
    }

    isValid() {
        return true;
    }
}

class Headquarter extends baseColony {
    constructor() {
        super(0);
        this.maxClickChance = 0;
    }

    BuyImplement() {
        super.BuyImplement();
        turnStartEvents.push(() => {
            for (let i = 0; i < 4; i++) {
                RollADieAt(dicePlace.Normal);
            }
        });
    }

}

class CommandCenter extends baseColony {
    constructor() {
        super(1);
        this.maxClickChance = 2;
    }

    useImplement() {
        RerollDices();
    }

    canImplement() {
        return selectedDices.filter((e) => e.diceStatus != diceStatus.Fixed).length > 0;
    }

}

class Laboratory extends baseColony {
    constructor() {
        super(2);
        this.maxClickChance = 1;
    }

    canImplement() {
        return (selectedDices.length == 2) && (selectedDices[0].num == selectedDices[1].num);
    }

    useImplement() {
        GetRandomBlueprint();
        spendDice();
    }

}

class Forge extends baseColony {
    constructor() {
        super(3);
        this.maxClickChance = 1;
    }

    canImplement() {
        return (selectedDices.length == 3) && isInARow();
    }

    useImplement() {
        RollADieAt(PreserveE, 1, diceStatus.Wild);
        spendDice();
    }

}

class MinorSettlement extends Blueprint {
    constructor() {
        super(0);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        return isInARow();
    }

    BuyImplement() {
        super.BuyImplement();
        turnStartEvents.push(() => {
            if (turnPassed % 2 == 0) RollADieAt();
        })
    }

}

class CloneMachine extends Blueprint {
    constructor() {
        super(1);
        this.maxClickChance = 1;
    }

    isValid() {
        if (selectedDices.length != 5) return false;
        return isInARow();
    }

    canImplement() {
        return selectedDices.length == 1;
    }

    useImplement() {
        RollADieAt(DiceE, selectedDices[0].num, diceStatus.Fixed);
    }

}

class Drone6 extends Blueprint {
    constructor() {
        super(2);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        if (selectedDices[0].num != 6) return false;
        return isOfAKind();
    }

    buyImplement() {
        turnStartEvents.push(() => RollADieAt(DiceE, 6, diceStatus.Fixed));
    }

}

class Drone5 extends Blueprint {
    constructor() {
        super(3);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        if (selectedDices[0].num != 5) return false;
        return isOfAKind();
    }

    buyImplement() {
        turnStartEvents.push(() => RollADieAt(DiceE, 5, diceStatus.Fixed));
    }

}

class Drone4 extends Blueprint {
    constructor() {
        super(4);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        if (selectedDices[0].num != 4) return false;
        return isOfAKind();
    }

    buyImplement() {
        turnStartEvents.push(() => RollADieAt(DiceE, 4, diceStatus.Fixed));
    }

}

class Drone3 extends Blueprint {
    constructor() {
        super(5);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        if (selectedDices[0].num != 3) return false;
        return isOfAKind();
    }

    buyImplement() {
        turnStartEvents.push(() => RollADieAt(DiceE, 3, diceStatus.Fixed));
    }

}

class Drone2 extends Blueprint {
    constructor() {
        super(6);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        if (selectedDices[0].num != 2) return false;
        return isOfAKind();
    }

    buyImplement() {
        turnStartEvents.push(() => RollADieAt(DiceE, 2, diceStatus.Fixed));
    }

}

class Drone1 extends Blueprint {
    constructor() {
        super(7);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        if (selectedDices[0].num != 1) return false;
        return isOfAKind();
    }

    buyImplement() {
        turnStartEvents.push(() => RollADieAt(DiceE, 1, diceStatus.Fixed));
    }

}

class Dome extends Blueprint {
    constructor() {
        super(8);
        this.maxClickChance = 0;
    }

    isValid() {
        return isFullHouse();
    }

    buyImplement() {
        turnStartEvents.push(() => RollADieAt(PreserveE));
    }

}

class Prospector extends Blueprint {
    constructor() {
        super(9);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 4) return false;
        return isOfAKind();
    }

    buyImplement() {
        turnStartEvents.push(() => RollADieAt(PreserveE, 0, diceStatus.Fixed));
    }

}

class Shuttle extends Blueprint {
    constructor() {
        super(10);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        return isOfAKind();
    }

    buyImplement() {
        MODSum += 2;
        canChangeSixToOne = true;
    }

}

class ReplicantRobot extends Blueprint {
    constructor() {
        super(11);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 2) return false;
        selectedDices.forEach(e => {
            if (e.diceStatus != diceStatus.Wild) return false;
        });
        return true;
    }

    buyImplement() {
        turnStartEvents.push(() => RollADieAt(DiceE, 1, diceStatus.Wild));
    }

}

class QuantumComputer extends Blueprint {
    constructor() {
        super(12);
        this.maxClickChance = 1;
    }

    isValid() {
        if (selectedDices.length != 4) return false;
        if (!isPair()) return false;
        return isInARow(selectedDices.removeDuplicated())
    }

    canImplement() {
        return selectedDices.filter(e => e.diceStatus == diceStatus.Normal).length > 0;
    }

    useImplement() {
        RerollDices();
    }

}

class Monopole extends Blueprint {
    constructor() {
        super(13);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        Dices.forEach(e => {
            if (e.num % 2 != 1) return false;
        });
        return true;
    }

    buyImplement() {
        turnStartEvents.push(() => RollADieAt(DiceE, GetRandomOddNum(), diceStatus.Wild));
    }

}

class Reactor20 extends Blueprint {
    constructor() {
        super(14);
        this.maxClickChance = 1;
    }

    isValid() {
        let sum = 0;
        selectedDices.forEach(e => sum += e.num);
        if (sum == 20) return true;
        else return false;
    }

    canImplement() {
        return selectedDices.length == 1;
    }

    useImplement() {
        let num1, num2;
        num1 = selectedDices[0] / 2;
        if (selectedDices[0] % 2 != 0) num2 = selectedDices[0] / 2 + 1;
        else num2 = num1;
        RollADieAt(DiceE, num1);
        RollADieAt(DiceE, num2);
    }

}

class EnergySaver extends Blueprint {
    constructor() {
        super(15);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 4) return false;
        return isOfAKind();
    }

    buyImplement() {
        turnEndEvents.push(() => {
            if (document.querySelectorAll(".Dice").length > 1) {
                RollADieAt(DiceE, GetRandomOddNum(), diceStatus.Wild);
            }
        });
    }

}

class Recycing extends Blueprint {
    constructor() {
        super(16);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        return isOfAKind();
    }

    buyImplement() {
        whenSpendDice.push(() => {
            selectedDices.forEach(e => {
                if (e.diceStatus == diceStatus.Wild) {
                    diceToRoll++;
                }
            })
        });
    }

}

class TouristAttraction extends Blueprint {
    constructor() {
        super(17);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        if (!selectedDices.some(e => e.num == 1)) return false;
        return isInARow();
    }

    buyImplement() {
        turnStartEvents.push(() => {
            for (let i = 0; i < 4 - projectLeft; i++) {
                RollADieAt(DiceE);
            }
        });
    }

}

class SelfrepairMaterial extends Blueprint {
    constructor() {
        super(18);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 4) return false;
        return isOfAKind();
    }

    buyImplement() {
        turnEndEvents.push(() => {
            if (PreserveE.querySelectorAll(".Dice").length == 0) diceToRoll += 2;
        });
    }

}

class Observatory extends Blueprint {
    constructor() {
        super(19);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        if (selectedDices.some(e => e.num == 6)) return false;
        return isInARow();
    }

    buyImplement() {
        GetRandomBlueprint();
        MODGetWhenDiscard++;
    }

}

class DormantChamber extends Blueprint {
    constructor() {
        super(20);
        this.maxClickChance = 1;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        if (selectedDices.some(e => e.num == 3) && selectedDices.some(e => e.num == 1) && selectedDices.some(e => e.num == 5)) return true;
        else return false;
    }

    canImplement() {
        return selectedDices.length == 1;
    }

    useImplement() {
        selectedDices[0].diceStatus = diceStatus.Fixed;
        selectedDices[0].place = PreserveE;
        selectedDices[0].UpdateVisual();
    }

}

class Prototype extends Blueprint {
    constructor() {
        super(21);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        return isInARow();
    }

    buyImplement() {
        turnStartEvents.push(() => RollADieAt(DiceE, 0, diceStatus.Fixed));
    }

}

class Reactor25 extends Blueprint {
    constructor() {
        super(22);
        this.maxClickChance = 1;
    }

    isValid() {
        let sum = 0;
        selectedDices.forEach(e => sum += e.num);
        if (sum == 25) return true;
        else return false;
    }

    canImplement() {
        return selectedDices.length == 1 && selectedDices[0].num != 1 && selectedDices[0].num != 6;
    }

    useImplement() {
        let n = selectedDices[0].num;
        RollADieAt(DiceE, n + 1);
        RollADieAt(DiceE, n - 1);
    }

}

class Extractor extends Blueprint {
    constructor() {
        super(23);
        this.maxClickChance = 1;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        if (selectedDices.some(e => e.num == 6)) return false;
        return isInARow();
    }

    canImplement() {
        return selectedDices.length == 2 && isPair();
    }

    useImplement() {
        RollADieAt(PreserveE, 1, diceStatus.Wild);
    }

}

class Settlement extends Blueprint {
    constructor() {
        super(24);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 4) return false;
        return isInARow();
    }

    buyImplement() {
        turnStartEvents.push(() => RollADieAt());
    }

}

class BionicRobot extends Blueprint {
    constructor() {
        super(25);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 4) return false;
        return isOfAKind();
    }

    buyImplement() {
        whenReroll.push(() => {
            if (diceToReroll.length == 1) {
                RollADieAt();
            }
        });
    }

}

class ThreeDPrinter extends Blueprint {
    constructor() {
        super(26);
        this.maxClickChance = 1;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        if (!selectedDices.some(e => e.num == 1)) return false;
        return isInARow();
    }

    canImplement() {
        return selectedDices.length == 1 && selectedDices[0].num == 1;
    }

    useImplement() {
        RollADieAt(DiceE, 1, diceStatus.Wild);
    }

}

class Transporter extends Blueprint {
    constructor() {
        super(27);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        if (selectedDices.some(e => e.num == 2) && selectedDices.some(e => e.num == 4) && selectedDices.some(e => e.num == 6)) {
            return true;
        }
        else return false;
    }

    buyImplement() {
        turnStartEvents.push(() => {
            MODSum++;
        });
    }

}

class OMNI extends Blueprint {
    constructor() {
        super(28);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 5) return false;
        return isOfAKind();
    }

    buyImplement() {
        turnStartEvents.push(() => {
            RollADieAt(PreserveE, 1, diceStatus.Wild);
        });
    }

}

class Reactor16 extends Blueprint {
    constructor() {
        super(29);
        this.maxClickChance = 1;
    }

    isValid() {
        let sum = 0;
        selectedDices.forEach(e => sum += e.num);
        if (sum == 16) return true;
        else return false;
    }

    canImplement() {
        return selectedDices.length == 2;
    }

    useImplement() {
        let n = selectedDices[0].num;
        RollADieAt(DiceE, n + 1);
        RollADieAt(DiceE, n - 1);
    }

}

class Project extends ItemObj {
    constructor(id) {
        super();
        let proj = ProjectList.find(e => e.id == id);
        console.log(proj.name);
        this.name = proj.name;
        this.des = "Cost: " + proj.cost;
        this.item.id = "Project" + id;
        super.addItem(ProjectsE);
    }

    buy() {
        if (super.buy()) {
            document.getElementById("Project" + id).remove();
            spendDice();
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

class VishnuProject extends Project {
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
var ifBuiltThisTurn = false; // TODO:
var selectedDices = new Array();
var projectLeft = 4;
var MODSum = 0;
var canChangeSixToOne = false;
var Colonies = new Array();
var Projects = new Array();
var Blueprints = new Array();
var MODGetWhenDiscard = 1;

const dicePlace = {
    Normal: DiceE,
    Preserve: PreserveE
}

function UpdateTurnInfo() {
    turnManager.innerText = "Turn passed: " + turnPassed + "/" + totalTurn;
}

function GameStart() {
    ProjectList = jsonData.projects.slice();
    BlueprintList = jsonData.blueprints.slice();
    baseColonyList = jsonData.baseColony.slice();
    turnPassed = 0;
    UpdateTurnInfo();
    document.querySelectorAll('ul').forEach(element => {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    });
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
            selectedDices[0].ChangeNum(--selectedDices[0].num);
            if (selectedDices[0].Status != diceStatus.Wild) MODSum--;
            UpdateMOD();
        }
    });
    GetRandomProject();
    for (let i = 0; i < 3; i++) {
        GetRandomBlueprint();
    }
    var headquarter = new Headquarter();
    headquarter.buy();
    var cc = new CommandCenter();
    cc.buy();
    var lab = new Laboratory();
    lab.buy();
    var fo = new Forge();
    fo.buy();
    StartTurn();
}

function RollADieAt(Place = DiceE, num = 0, Status = diceStatus.Normal) {
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
    tempDice.diceStatus = Status;
    tempDice.place = p;
    if (num == 0) tempDice.Reroll();
    else tempDice.ChangeNum(num);
    p.appendChild(tempDice.dice);
    return tempDice;
}

startBtn.addEventListener('click', () => location.reload());

function UpdateMOD() {
    MODSumE.innerText = "" + MODSum;
}

function GetRandomProject() {
    for (let i = 0; i < 4; i++) {
        let num = GetRandomNumWithin(0, ProjectList.length - 1);
        console.log(num);
        console.log(ProjectList.slice());
        eval(`new ${ProjectList[num].name.replace(/ /g, "")}()`);
        ProjectList.splice(num, 1);
        console.log(ProjectList.slice());
    }
}

function GetRandomBlueprint() {
    if (BlueprintList.length == 0) {
        alert("no more project");
        return;
    }
    let bpID = GetRandomNumWithin(0, BlueprintList.length - 1);
    eval(`new ${BlueprintList[bpID].name.replace(/ /g, "")}()`);
    BlueprintList.splice(bpID, 1);
}

function GetRandomNumWithin(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function GetRandomOddNum() {
    let num = GetRandomNumWithin(1, 6);
    if (num % 2 == 0) num -= 1;
    return num;
}

function GetRandomEvenNum() {
    let num = GetRandomNumWithin(1, 6);
    if (num % 2 != 0) num += 1;
    return num;
}

function isInARow(targetA = selectedDices) {
    let tempArray = Array.from(targetA);
    tempArray.sort((a, b) => a.num - b.num);
    for (let i = 0; i < tempArray.length - 1; i++) {
        if (Math.abs(tempArray[i].num - tempArray[i + 1].num) != 1) return false;
    }
    return true;
}

function isPair() {
    let tempA = new Array();
    for (let i = 0; i < selectedDices.length; i++) {
        if (tempA.some(e => e == selectedDices[i].num)) {
            tempA.splice(tempA.indexOf(this), 1);
        }
        else tempA.push(selectedDices[i].num);
    }
    return tempA.length == 0;
}

function isOfAKind() {
    selectedDices.forEach(e => {
        if (e.num != selectedDices[0].num) return false;
    });
    return true;
}

function removeDuplicated() {
    return arr.filter((item, index) => arr.indexOf(item) === index);
}

function isFullHouse() {
    if (selectedDices.length != 5) return false;
    let tempA = selectedDices.sort((a, b) => a - b);
    if ((tempA[0].num === tempA[1].num && tempA[1].num === tempA[2].num && tempA[3].num === tempA[4].num) ||
        (tempA[0].num === tempA[1].num && tempA[2].num === tempA[3].num && tempA[3].num === tempA[4].num)) {
        return true;
    } else {
        return false;
    }
}

var whenSpendDice = new Array();
function spendDice() {
    if (whenSpendDice.length > 0) {
        whenSpendDice.forEach(e => e());
    }
    selectedDices.forEach(e => e.Consume());
}

var whenReroll = new Array();
var diceToReroll = new Array();
function RerollDices(targetDices = selectedDices.filter(e => e.diceStatus == diceStatus.Normal)) {
    diceToReroll.length = 0;
    diceToReroll = targetDices;
    if (whenReroll.length != 0) {
        whenReroll.forEach(e => e());
    }
    targetDices.forEach(e => e.Reroll());
}

var turnEndEvents = new Array();
function EndTurn() {
    turnPassed++;
    UpdateTurnInfo();
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
    while (DiceE.firstChild) {
        DiceE.removeChild(DiceE.firstChild);
    }
    StartTurn();
}

var turnStartEvents = new Array();
var diceToRoll = 0;
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
    for (let i = 0; i < diceToRoll; i++) {
        RollADieAt(DiceE);
    }
    GetRandomBlueprint();
    diceToRoll = 0;
    Colonies.forEach(e => {
        if (e.maxClickChance > 0) e.classList.add("clickable");
    });
}

function Win() {
    alert("you win");
}

GameStart();
MODSum = 10;