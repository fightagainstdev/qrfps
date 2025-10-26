// 敌人管理器：定时生成敌人、统计数量、处理死亡加分
import * as THREE from 'three';

class EnemyManager {
    constructor(scene, entityManager, enemyPrefab, uiManager) {
        this.scene = scene;
        this.entityManager = entityManager;
        this.enemyPrefab = enemyPrefab; // 用于克隆敌人属性
        this.uiManager = uiManager;
        this.enemies = [];
        this.spawnInterval = 15; // 秒
        this.spawnTimer = 0;
        this.score = 0;
    }

    update(delta) {
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }
    }

    spawnEnemy() {
        // 生成地面随机位置
        const position = this.getRandomGroundPosition();
        // 克隆敌人属性
        const enemy = this.enemyPrefab.clone();
        enemy.SetPosition(position);
        this.entityManager.Add(enemy);
        this.enemies.push(enemy);
        this.updateEnemyCount();
    }

    getRandomGroundPosition() {
        // 假设地面为XZ平面，范围可根据实际地图调整
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        const y = 0; // 地面高度
        return new THREE.Vector3(x, y, z);
    }

    onEnemyKilled(enemy) {
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) this.enemies.splice(idx, 1);
        this.score += 1;
        this.updateEnemyCount();
        this.updateScore();
    }

    updateEnemyCount() {
        if (this.uiManager && this.uiManager.SetEnemyCount) {
            this.uiManager.SetEnemyCount(this.enemies.length);
        }
    }

    updateScore() {
        if (this.uiManager && this.uiManager.SetScore) {
            this.uiManager.SetScore(this.score);
        }
    }
}

export default EnemyManager;
