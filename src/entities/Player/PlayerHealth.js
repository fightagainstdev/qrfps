import Component from "../../Component";

export default class PlayerHealth extends Component{
    constructor(){
        super();

        this.health = 100;
        this.maxHealth = 100;
        this.healCharges = 0; // Number of heal charges available
        this._gameOverFired = false; // Ensure game over event is fired only once
    }

    TakeHit = e =>{
        console.log('Player taking hit, current health:', this.health, 'damage: 10');
        this.health = Math.max(0, this.health - 10);
        this.uimanager.SetHealth(this.health);

        if(this.health <= 0 && !this._gameOverFired){
            console.log('Player health reached 0, triggering game over directly');
            this._gameOverFired = true;
            // Call OnGameOver directly instead of broadcasting
            if(window._APP && typeof window._APP.OnGameOver === 'function'){
                window._APP.OnGameOver();
            }
        }
    }

    ShowGameOver(){
        // Create game over overlay
        const overlay = document.createElement('div');
        overlay.id = 'game_over_overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            color: white;
            font-family: Arial, sans-serif;
        `;

        overlay.innerHTML = `
            <h1 style="font-size: 4em; margin-bottom: 1em;">游戏结束</h1>
            <p style="font-size: 2em; margin-bottom: 2em;">最终积分: ${window._APP ? window._APP.score : 0}</p>
            <button id="restart_btn" style="
                font-size: 2em;
                padding: 0.5em 2em;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">重新开始</button>
        `;

        document.body.appendChild(overlay);

        // Add restart functionality
        document.getElementById('restart_btn').onclick = () => {
            window.location.reload();
        };

        console.log('Game over screen displayed');
    }

    Heal(){
        console.log('Heal called, healCharges:', this.healCharges, 'current health:', this.health);
        if(this.healCharges > 0 && this.health < this.maxHealth){
            const healAmount = this.maxHealth * 0.1; // 10% of max health
            this.health = Math.min(this.maxHealth, this.health + healAmount);
            this.healCharges--;
            this.uimanager.SetHealth(this.health);
            this.UpdateHealButton();
            console.log('Healed! new health:', this.health, 'remaining healCharges:', this.healCharges);
            return true;
        }
        console.log('Cannot heal: no charges or already at full health');
        return false;
    }

    AddHealCharge(){
        this.healCharges++;
        console.log('AddHealCharge, healCharges:', this.healCharges);
        this.UpdateHealButton();
    }

    UpdateHealButton(){
        const button = document.getElementById('heal_button');
        console.log('UpdateHealButton, healCharges:', this.healCharges, 'button:', button);
        if(button){
            button.disabled = this.healCharges <= 0;
        }
    }

    Initialize(){
        this.uimanager = this.FindEntity("UIManager").GetComponent("UIManager");
        this.parent.RegisterEventHandler(this.TakeHit, "hit");
        this.uimanager.SetHealth(this.health);
        this.UpdateHealButton();
    }
}