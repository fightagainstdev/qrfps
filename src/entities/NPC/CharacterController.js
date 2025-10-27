import * as THREE from 'three'
import Component from '../../Component'
import {Ammo, AmmoHelper, CollisionFilterGroups} from '../../AmmoLib'
import CharacterFSM from './CharacterFSM'

import DebugShapes from '../../DebugShapes'


export default class CharacterController extends Component{
    constructor(model, clips, scene, physicsWorld){
        super();
        this.name = 'CharacterController';
        this.physicsWorld = physicsWorld;
        this.scene = scene;
        this.mixer = null;
        this.clips = clips;
        this.animations = {};
        this.model = model;
        this.dir = new THREE.Vector3();
        this.forwardVec = new THREE.Vector3(0,0,1);
        this.pathDebug = new DebugShapes(scene);
        this.path = [];
        this.tempRot = new THREE.Quaternion();

        this.aggroRadius = 12.0; // 感知半径，单位米
        this.viewAngle = Math.cos(Math.PI / 4.0);
        this.maxViewDistance = 20.0 * 20.0;
        this.tempVec = new THREE.Vector3();
        this.attackDistance = 2.2;

        this.canMove = true;
        this.health = 100;
        this.maxHealth = 100;
        this.speedMultiplier = 1.0; // Speed reduction based on damage
        this.isChasingPlayer = false; // Track if enemy is actively chasing player
    }

    SetAnim(name, clip){
        const action = this.mixer.clipAction(clip);
        this.animations[name] = {clip, action};
    }

    SetupAnimations(){
        Object.keys(this.clips).forEach(key=>{this.SetAnim(key, this.clips[key])});
    }

    Initialize(){
        this.stateMachine = new CharacterFSM(this);
        this.navmesh = this.FindEntity('Level').GetComponent('Navmesh');
        this.hitbox = this.GetComponent('AttackTrigger');
        this.player = this.FindEntity("Player");

        this.parent.RegisterEventHandler(this.TakeHit, 'hit');

        const scene = this.model;

        scene.scale.setScalar(0.01);
        scene.position.copy(this.parent.position);
        
        this.mixer = new THREE.AnimationMixer( scene );

        scene.traverse(child => {
            if ( !child.isSkinnedMesh  ) {
                return;
            }

            child.frustumCulled = false;
            child.castShadow = true;
            child.receiveShadow = true;
            this.skinnedmesh = child;
            this.rootBone = child.skeleton.bones.find(bone => bone.name == 'MutantHips');
            this.rootBone.refPos = this.rootBone.position.clone();
            this.lastPos = this.rootBone.position.clone();
        });

        this.SetupAnimations();

        this.scene.add(scene);
        this.stateMachine.SetState('idle');
    }

    UpdateDirection(){
        this.dir.copy(this.forwardVec);
        this.dir.applyQuaternion(this.parent.rotation);
    }

    CanSeeThePlayer(){
        // 玩家在怪物感知圆内就追击
        const playerPos = this.player.Position.clone();
        const modelPos = this.model.position.clone();
        modelPos.y += 1.35;
        const charToPlayer = playerPos.sub(modelPos);
        if(charToPlayer.lengthSq() <= this.aggroRadius * this.aggroRadius){
            return true;
        }
        // 保留原视野锥逻辑作为补充
        if(charToPlayer.lengthSq() > this.maxViewDistance){
            return false;
        }
        charToPlayer.normalize();
        const angle = charToPlayer.dot(this.dir);
        if(angle < this.viewAngle){
            return false;
        }
        // 射线检测
        const rayInfo = {};
        const collisionMask = CollisionFilterGroups.AllFilter & ~CollisionFilterGroups.SensorTrigger;
        if(AmmoHelper.CastRay(this.physicsWorld, modelPos, this.player.Position, rayInfo, collisionMask)){
            const body = Ammo.castObject( rayInfo.collisionObject, Ammo.btRigidBody );
            if(body == this.player.GetComponent('PlayerPhysics').body){
                return true;
            }
        }
        return false;
    }

    NavigateToRandomPoint(){
        let node;
        let attempts = 0;
        const maxAttempts = 20;

        // Try to find a random point that's within bounds and not blocked
        do {
            node = this.navmesh.GetRandomNode(this.model.position, 50);
            attempts++;
        } while ((!this.IsPointInBounds(node) || this.IsPointNearObstacle(node)) && attempts < maxAttempts);

        if(attempts >= maxAttempts){
            // If we can't find a valid point, stay in place
            this.path = [];
            return;
        }

        this.path = this.navmesh.FindPath(this.model.position, node);
    }

    IsPointInBounds(point){
        if(!point) return false;

        // Define map boundaries (adjust these values based on your level)
        const minX = -20, maxX = 40;
        const minZ = -20, maxZ = 50;

        return point.x >= minX && point.x <= maxX && point.z >= minZ && point.z <= maxZ;
    }

    IsPointNearObstacle(point){
        if(!point) return true;

        // 这里定义大箱子/障碍物区域，需与实际地图一致
        const obstacleAreas = [
            {center: new THREE.Vector3(14.37, 0, 10.45), radius: 3.5}, // 大箱子1
            {center: new THREE.Vector3(32.77, 0, 33.84), radius: 3.5}, // 大箱子2
            // 可继续添加其它障碍物
        ];

        return obstacleAreas.some(obstacle => {
            return point.distanceTo(obstacle.center) < obstacle.radius;
        });
    }

    IsPointNearAmmoBox(point){
        const ammoBoxes = this.FindEntity('EntityManager').entities.filter(entity =>
            entity.Name && entity.Name.startsWith('AmmoBox')
        );

        return ammoBoxes.some(box => {
            if(box.Position && point){
                return box.Position.distanceTo(point) < 3.0; // Keep 3 units away from boxes
            }
            return false;
        });
    }

    NavigateToPlayer(){
        this.tempVec.copy(this.player.Position);
        this.tempVec.y = 0.5;

        let targetPos = this.tempVec.clone();
        let foundValidPath = false;

        // Try direct path first
        this.path = this.navmesh.FindPath(this.model.position, targetPos);
        if(this.path && this.path.length > 0 && this.IsPathValid(this.path)){
            foundValidPath = true;
        }

        // If direct path fails, find alternative positions
        if(!foundValidPath){
            // Find a position near player but within bounds
            const alternatives = [];
            for(let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6){ // More angles for better coverage
                const offset = new THREE.Vector3(Math.cos(angle) * 4, 0, Math.sin(angle) * 4);
                const altPos = this.tempVec.clone().add(offset);
                if(this.IsPointInBounds(altPos)){
                    alternatives.push(altPos);
                }
            }

            // Try alternative positions
            for(const altPos of alternatives){
                this.path = this.navmesh.FindPath(this.model.position, altPos);
                if(this.path && this.path.length > 0 && this.IsPathValid(this.path)){
                    targetPos = altPos;
                    foundValidPath = true;
                    break;
                }
            }
        }

        // If still no valid path, clear path to stop movement
        if(!foundValidPath){
            this.path = [];
        }

        /*
        if(this.path){
            this.pathDebug.Clear();
            for(const point of this.path){
                this.pathDebug.AddPoint(point, "blue");
            }
        }
        */
    }

    IsPathValid(path){
        if(!path || path.length === 0) return false;

        // Check if all points in the path are within bounds
        return path.every(point => this.IsPointInBounds(point));
    }

    IsPlayerNearAmmoBox(){
        const ammoBoxes = this.FindEntity('EntityManager').entities.filter(entity =>
            entity.Name && entity.Name.startsWith('AmmoBox')
        );

        return ammoBoxes.some(box => {
            if(box.Position){
                return box.Position.distanceTo(this.player.Position) < 2.0;
            }
            return false;
        });
    }

    FacePlayer(t, rate = 3.0){
        this.tempVec.copy(this.player.Position).sub(this.model.position);
        this.tempVec.y = 0.0;
        this.tempVec.normalize();

        this.tempRot.setFromUnitVectors(this.forwardVec, this.tempVec);
        this.model.quaternion.rotateTowards(this.tempRot, rate * t);
    }

    get IsCloseToPlayer(){
        this.tempVec.copy(this.player.Position).sub(this.model.position);

        if(this.tempVec.lengthSq() <= this.attackDistance * this.attackDistance){
            return true;
        }

        return false;
    }

    get IsPlayerInHitbox(){
        return this.hitbox.overlapping;
    }

    HitPlayer(){
        this.player.Broadcast({topic: 'hit'});
    }

    TakeHit = msg => {
        console.log('Enemy taking hit, current health:', this.health, 'damage:', msg.amount);
        this.health = Math.max(0, this.health - msg.amount);

        if(this.health == 0){
            this.stateMachine.SetState('dead');
            if(window._APP && typeof window._APP.OnEnemyDied === 'function'){
                window._APP.OnEnemyDied();
            }
        }else{
            // First time being hit - switch to chase mode
            if(!this.isChasingPlayer){
                this.isChasingPlayer = true;
                this.stateMachine.SetState('chase');
            }
            // Reduce speed by 10% per hit (minimum 30% of original speed)
            this.speedMultiplier = Math.max(0.3, this.speedMultiplier - 0.1);
        }
    }

    MoveAlongPath(t){
        if(!this.path?.length) return;

        const target = this.path[0].clone().sub( this.model.position );
        target.y = 0.0;
       
        if (target.lengthSq() > 0.1 * 0.1) {
            target.normalize();
            this.tempRot.setFromUnitVectors(this.forwardVec, target);
            this.model.quaternion.slerp(this.tempRot,4.0 * t);
        } else {
            // Remove node from the path we calculated
            this.path.shift();

            if(this.path.length===0){
                this.Broadcast({topic: 'nav.end', agent: this});
            }
        }
    }

    ClearPath(){
        if(this.path){
            this.path.length = 0;
        }
    }

    ApplyRootMotion(){
        if(this.canMove && this.rootBone && this.lastPos){
            const vel = this.rootBone.position.clone();
            vel.sub(this.lastPos).multiplyScalar(0.01 * this.speedMultiplier);
            vel.y = 0;

            vel.applyQuaternion(this.model.quaternion);

            if(vel.lengthSq() < 0.1 * 0.1){
                this.model.position.add(vel);
            }
        }

        //Reset the root bone horizontal position
        if(this.rootBone && this.rootBone.refPos){
            this.lastPos.copy(this.rootBone.position);
            this.rootBone.position.z = this.rootBone.refPos.z;
            this.rootBone.position.x = this.rootBone.refPos.x;
        }
   }

    RemoveFromScene() {
        if (this.model && this.scene) {
            this.scene.remove(this.model);
        }
    }

    Update(t){
        if(!this.stateMachine || !this.stateMachine.currentState){
            return;
        }

        this.mixer && this.mixer.update(t);
        this.ApplyRootMotion();

        this.UpdateDirection();
        this.MoveAlongPath(t);
        this.stateMachine.Update(t);

        this.parent.SetRotation(this.model.quaternion);
        this.parent.SetPosition(this.model.position);
    }
}