import Component from '../../Component'

export default class UIManager extends Component{
    constructor(){
        super();
        this.name = 'UIManager';
    }

    SetAmmo(mag, rest){
        document.getElementById("current_ammo").innerText = mag;
        document.getElementById("max_ammo").innerText = rest;
    }

    SetHealth(health, maxHealth = 100){
        const percent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
        document.getElementById("health_progress").style.width = `${percent}%`;
    }

    SetScore(score){
        const el = document.getElementById("score");
        console.log('SetScore called with:', score, 'element:', el);
        if(el) el.innerText = score;
        else console.warn('score element not found!');
    }

    SetEnemyCount(count){
        document.getElementById("enemy_count").innerText = count;
    }

    Initialize(){
        document.getElementById("game_hud").style.visibility = 'visible';
        document.getElementById("score_container").style.visibility = 'visible';
        document.getElementById("enemy_count_container").style.visibility = 'visible';
    }
}