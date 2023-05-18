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
                console.log(`Unselected No.${this.id} dice`, this);
            }
            else {
                this.dice.classList.add("SelectedDice");
                selectedDices.push(this);
                console.log(`Selected No.${this.id} dice`, this);
            }
        });
        parent.appendChild(this.dice);
        this.UpdateVisual();
    }

    Reroll() {
        let numb = GetRandomNumWithin(1, 6);
        while (numb == this.num) numb = GetRandomNumWithin(1, 6);
        console.log(`Reroll No.${this.id} Dice, it's value equals ${this.num}, new value equals ${numb}`);
        this.num = numb;
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
        this.clickHandler = () => this.buy();
        this.item.addEventListener('click', this.clickHandler);
    }

    buy() {
        if (this.isValid()) {
            console.log("buy " + Object.getPrototypeOf(this).constructor.name);
            this.BuyImplement();
            spendDice();
            this.VisualUpdate();
            this.item.removeEventListener('click', this.clickHandler);
            this.item.addEventListener('click', () => this.Use());
            return true;
        }
        else {
            console.log(`try to buy ${Object.getPrototypeOf(this).constructor.name} but failed`);
            console.log(selectedDices);
            infoEle.innerText = "Incorrect dice to buy this blueprint";
            return false;
        }
    }

    BuyImplement() {

    }

    isValid() { }

    Use() {
        if (this.canUse() && this.canImplement()) {
            console.log("use " + Object.getPrototypeOf(this).constructor.name);
            this.useImplement();
            this.clickChance--;
            this.VisualUpdate();
        }
        else {
            console.log(`try to use ${Object.getPrototypeOf(this).constructor.name} but failed`);
            infoEle.innerText = "Incorrect dice to use this colony";
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
        this.rightClickHandler = (ev) => {
            if (ev.button == 2 && !this.bought) this.discard();
        };
        this.item.addEventListener('mousedown', this.rightClickHandler);
    }

    BuyImplement() {
        super.BuyImplement();
        this.item.removeEventListener('mousedown', this.rightClickHandler);
        ColonyE.append(this.item);
        ifBuiltThisTurn = true;
        Colonies.push(this);
        this.bought = true;
        this.clickChance = this.maxClickChance;
    }

    discard() {
        if (this.bought) return;
        MODSum += MODGetWhenDiscard;
        this.item.remove();
        UpdateMOD();
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

    BuyImplement() {
        super.addItem(ColonyE);
        Colonies.push(this);
        this.bought = true;
        this.clickChance = this.maxClickChance;
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
        this.des += "\ncan use twice each turn";
        this.maxClickChance = 2;
    }

    useImplement() {
        RerollDices();
    }

    canImplement() {
        if (selectedDices.filter((e) => e.diceStatus != diceStatus.Fixed).length > 0) {
            return true;
        }
        else {
            infoEle.innerText = "can't reroll fixed dice";
        }
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

    BuyImplement() {
        super.BuyImplement();
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

    BuyImplement() {
        super.BuyImplement();
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

    BuyImplement() {
        super.BuyImplement();
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

    BuyImplement() {
        super.BuyImplement();
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

    BuyImplement() {
        super.BuyImplement();
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

    BuyImplement() {
        super.BuyImplement();
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

    BuyImplement() {
        super.BuyImplement();
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

    BuyImplement() {
        console.log("prospector's buy implement");
        super.BuyImplement();
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

    BuyImplement() {
        super.BuyImplement();
        MODSum += 2;
        canChangeSixToOne = true;
        UpdateMOD();
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

    BuyImplement() {
        super.BuyImplement();
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
        return isInARow(removeDuplicated(selectedDices));
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

    BuyImplement() {
        super.BuyImplement();
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
        return selectedDices.length == 1 && selectedDices[0].num != 1;
    }

    useImplement() {
        let num1, num2;
        num1 = Math.floor(selectedDices[0].num / 2);
        if (selectedDices[0].num % 2 != 0) num2 = num1 + 1;
        else num2 = num1;
        RollADieAt(DiceE, num1);
        RollADieAt(DiceE, num2);
        spendDice();
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

    BuyImplement() {
        super.BuyImplement();
        turnEndEvents.push(() => {
            console.log(Dices.length);
            if (Dices.length > 1) {
                diceToRoll += 2;
            }
        });
    }

}

class Recycling extends Blueprint {
    constructor() {
        super(16);
        this.maxClickChance = 0;
    }

    isValid() {
        if (selectedDices.length != 3) return false;
        return isOfAKind();
    }

    BuyImplement() {
        super.BuyImplement();
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

    BuyImplement() {
        super.BuyImplement();
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

    BuyImplement() {
        super.BuyImplement();
        turnEndEvents.push(() => {
            if (DiceE.querySelectorAll(".Dice").length == 0) diceToRoll += 2;
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
        if (!selectedDices.some(e => e.num == 6)) return false;
        return isInARow();
    }

    BuyImplement() {
        super.BuyImplement();
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
        if (selectedDices.length != 3) {
            console.log("wrong dice number");
            infoEle.innerText = "wrong dice number";
            return false;
        }
        return isInARow();
    }

    BuyImplement() {
        super.BuyImplement();
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
        else {
            console.log("wrong sum");
            return false;
        }
    }

    canImplement() {
        return selectedDices.length == 1 && selectedDices[0].num != 1 && selectedDices[0].num != 6;
    }

    useImplement() {
        let n = selectedDices[0].num;
        RollADieAt(DiceE, n + 1);
        RollADieAt(DiceE, n - 1);
        spendDice();
    }

}

class Extractor extends Blueprint {
    constructor() {
        super(23);
        this.maxClickChance = 1;
    }

    isValid() {
        if (selectedDices.length != 3) {
            infoEle.innerText = "wrong dice number";
            return false;
        }
        if (!selectedDices.some(e => e.num == 6)) return false;
        return isInARow();
    }

    canImplement() {
        return selectedDices.length == 2 && isPair();
    }

    useImplement() {
        spendDice();
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

    BuyImplement() {
        super.BuyImplement();
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

    BuyImplement() {
        super.BuyImplement();
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
        spendDice();
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

    BuyImplement() {
        super.BuyImplement();
        turnStartEvents.push(() => {
            MODSum++;
            UpdateMOD();
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

    BuyImplement() {
        super.BuyImplement();
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
        n += selectedDices[1].num;
        selectedDices[0].ChangeNum(Math.floor(n / 2));
        if (n % 2 == 0) {
            selectedDices[1].ChangeNum(Math.floor(n / 2));
        }
        else selectedDices[1].ChangeNum(Math.floor(n / 2) + 1);
    }

}

class Project extends ItemObj {
    constructor(id) {
        super();
        let proj = ProjectList.find(e => e.id == id);
        this.name = proj.name;
        this.des = "Cost: " + proj.cost;
        this.item.id = "Project" + id;
        super.addItem(ProjectsE);
    }

    buy() {
        if (super.buy()) {
            this.item.remove();
            console.log("bought a project");
            if (--projectLeft <= 0) {
                Win();
            }
        }
        console.log("cant buy this project");
    }

    isValid() {
        return false;
    }

}

class InariProject extends Project {
    constructor() {
        super(0);
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

    isValid() {
        if (selectedDices.length != 6) {
            infoEle.innerText = "Incorrect dice number";
            return false;
        };
        return isInARow() && cc.clickChance == 2;
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
const ruleBtn = document.getElementById("RulesButton");
const infoEle = document.getElementById("info");
const totalTurn = 10;
var turnPassed = 0;
var ifBuiltThisTurn = false;
var selectedDices = new Array();
var projectLeft = 4;
var MODSum = 0;
var canChangeSixToOne = false;
var Colonies = new Array();
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
    infoEle.innerText = "";
    nextTurnBtn.style.display = "inline-block";
    Dices.length = 0;
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    })
    nextTurnBtn.addEventListener('click', () => EndTurn());
    MODPlusBtn.addEventListener('click', () => {
        if (selectedDices.length != 1) return;
        if (MODSum >= 1 || selectedDices[0].diceStatus == diceStatus.Wild) {
            if (selectedDices[0].num < 6) {
                selectedDices[0].ChangeNum(++selectedDices[0].num);
                console.log(selectedDices[0].num);
                if (selectedDices[0].diceStatus != diceStatus.Wild) MODSum--;
                console.log(`Substraction in No.${selectedDices[0].id} Dice using M.O.D.`);
                UpdateMOD();
            }
            else if (canChangeSixToOne) {
                selectedDices[0].ChangeNum(1);
                console.log(selectedDices[0].num);
                if (selectedDices[0].diceStatus != diceStatus.Wild) MODSum--;
                console.log(`Substraction in No.${selectedDices[0].id} Dice using M.O.D.`);
                UpdateMOD();
            }
        }
        else {
            console.log(`Attempt to add No.${selectedDices[0].id} Dice's value using M.O.D., but failed due to insufficient M.O.D.`);
            infoEle.innerText = "insufficient M.O.D.";
        }
    });
    MODMinusBtn.addEventListener('click', () => {
        if (selectedDices.length != 1) return;
        if (MODSum >= 1 || selectedDices[0].diceStatus == diceStatus.Wild) {
            if (selectedDices[0].num > 1) {
                selectedDices[0].ChangeNum(--selectedDices[0].num);
                console.log(selectedDices[0].num);
                if (selectedDices[0].diceStatus != diceStatus.Wild) MODSum--;
                console.log(`Substraction in No.${selectedDices[0].id} Dice using M.O.D.`);
                UpdateMOD();
            }
            else if (canChangeSixToOne) {
                selectedDices[0].ChangeNum(6);
                console.log(selectedDices[0].num);
                if (selectedDices[0].diceStatus != diceStatus.Wild) MODSum--;
                console.log(`Substraction in No.${selectedDices[0].id} Dice using M.O.D.`);
                UpdateMOD();
            }
        }
        else {
            console.log(`Attempt to substract No.${selectedDices[0].id} Dice's value using M.O.D., but failed due to insufficient M.O.D.`);
            infoEle.innerText = "insufficient M.O.D.";
        }
    });
    ruleBtn.addEventListener('click', () => window.open("./PanguProject.pdf"));
    GetRandomProject();
    for (let i = 0; i < 3; i++) {
        GetRandomBlueprint();
    }
    headquarter = new Headquarter();
    cc = new CommandCenter();
    lab = new Laboratory();
    fo = new Forge();
    headquarter.buy();
    cc.buy();
    lab.buy();
    fo.buy();
    StartTurn();
}

var headquarter = new Headquarter();
var cc = new CommandCenter();
var lab = new Laboratory();
var fo = new Forge();

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
    console.log(`Roll No.${tempDice.id} die at ${tempDice.place.parentElement.id}Element with its num = ${tempDice.num} and status = ${Object.keys(diceStatus).find((e) => diceStatus[e] == tempDice.diceStatus)}`);
    return tempDice;
}

startBtn.addEventListener('click', () => location.reload());

function UpdateMOD() {
    MODSumE.innerText = "" + MODSum;
}

function GetRandomProject() {
    for (let i = 0; i < 4; i++) {
        let num = GetRandomNumWithin(0, ProjectList.length - 1);
        eval(`new ${ProjectList[num].name.replace(/ /g, "")}()`);
        ProjectList.splice(num, 1);
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
    let tempArray = targetA.slice();
    tempArray.sort((a, b) => a.num - b.num);
    console.log("row func ", tempArray.slice());
    for (let i = 0; i < tempArray.length - 1; i++) {
        if (Math.abs(tempArray[i].num - tempArray[i + 1].num) != 1) {
            console.log("not in a row");
            return false;
        }
    }
    return true;
}

function isPair() {
    let tempA = new Array();
    for (let i = 0; i < selectedDices.length; i++) {
        if (tempA.some(e => e == selectedDices[i].num)) {
            tempA.splice(tempA.findIndex(e => e == selectedDices[i].num), 1);
        }
        else {
            tempA.push(selectedDices[i].num);
        }
    }
    if (tempA.length == 0) {
        return true;
    }
    else {
        console.log("not pair");
        return false;
    }
}

function isOfAKind() {
    selectedDices.forEach(e => {
        if (e.num != selectedDices[0].num) {
            console.log("not of a kind");
            return false;
        }
    });
    return true;
}

function removeDuplicated(arr) {
    let tempA = new Array();
    arr.forEach(e => {
        if (!tempA.some(a => a.num == e.num)) tempA.push(e);
    })
    console.log("after remove duplicated element: ", tempA);
    return tempA;
}

function isFullHouse() {
    if (selectedDices.length != 5) {
        console.log("not fullhouse");
        return false;
    }
    let tempA = selectedDices.sort((a, b) => a - b);
    if ((tempA[0].num === tempA[1].num && tempA[1].num === tempA[2].num && tempA[3].num === tempA[4].num) ||
        (tempA[0].num === tempA[1].num && tempA[2].num === tempA[3].num && tempA[3].num === tempA[4].num)) {
        return true;
    } else {
        console.log("not fullhouse");
        return false;
    }
}

var whenSpendDice = new Array();
function spendDice() {
    console.log("Dice Spent: ", selectedDices.slice());
    if (whenSpendDice.length > 0) {
        whenSpendDice.forEach(e => e());
    }
    selectedDices.forEach(e => e.Consume());
    selectedDices.length = 0;
}

var whenReroll = new Array();
var diceToReroll = new Array();
function RerollDices(targetDices = selectedDices.filter(e => e.diceStatus == diceStatus.Normal)) {
    diceToReroll.length = 0;
    diceToReroll = targetDices.slice();
    console.log(targetDices.slice());
    if (whenReroll.length != 0) {
        whenReroll.forEach(e => e());
    }
    targetDices.forEach(e => {
        e.Reroll()
    });
}

var turnEndEvents = new Array();
function EndTurn() {
    turnPassed++;
    selectedDices.length = 0;
    Dices.forEach(e => {
        console.log(e.id, e);
        e.dice.classList.remove("SelectedDice");

    });
    ifBuiltThisTurn = false;
    UpdateTurnInfo();
    infoEle.innerText = "";
    if (turnPassed >= totalTurn) {
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
        e.clickChance = e.maxClickChance;
        if (e.maxClickChance > 0) e.item.classList.add("clickable");
    });
}

function Win() {
    alert("you win");
}

GameStart();