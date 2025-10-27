import Component from '../../Component'
import {Ammo, AmmoHelper, CollisionFilterGroups} from '../../AmmoLib'


export default class AmmoBox extends Component{
    constructor(scene, model, shape, physicsWorld){
        super();
        this.name = 'AmmoBox';
        this.model = model;
        this.shape = shape;
        this.scene = scene;
        this.world = physicsWorld;

        this.quat = new Ammo.btQuaternion();
        this.update = true;
    }

    Initialize(){
        this.player = this.FindEntity('Player');
        this.playerPhysics = this.player.GetComponent('PlayerPhysics');

        // Create trigger for pickup detection
        this.trigger = AmmoHelper.CreateTrigger(this.shape);
        this.world.addCollisionObject(this.trigger, CollisionFilterGroups.SensorTrigger);

        // Create solid collision body to prevent monsters from walking through
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        const pos = this.parent.position;
        transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        const motionState = new Ammo.btDefaultMotionState(transform);

        const localInertia = new Ammo.btVector3(0, 0, 0);
        const bodyInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, this.shape, localInertia); // mass = 0 for static body
        this.collisionBody = new Ammo.btRigidBody(bodyInfo);
        this.collisionBody.setFriction(0.5);
        this.collisionBody.setRestitution(0.1);

        this.world.addRigidBody(this.collisionBody, CollisionFilterGroups.StaticFilter, CollisionFilterGroups.AllFilter & ~CollisionFilterGroups.SensorTrigger);

        this.scene.add(this.model);
    }

    Disable(){
        this.update = false;
        this.scene.remove(this.model);
        this.world.removeCollisionObject(this.trigger);
        if(this.collisionBody){
            this.world.removeRigidBody(this.collisionBody);
        }
    }

    Update(t){
        if(!this.update){
            return;
        }

        const entityPos = this.parent.position;
        const entityRot = this.parent.rotation;

        this.model.position.copy(entityPos);
        this.model.quaternion.copy(entityRot);

        const transform = this.trigger.getWorldTransform();

        this.quat.setValue(entityRot.x, entityRot.y, entityRot.z, entityRot.w);
        transform.setRotation(this.quat);
        transform.getOrigin().setValue(entityPos.x, entityPos.y, entityPos.z);

        if(AmmoHelper.IsTriggerOverlapping(this.trigger, this.playerPhysics.body)){
            // 随机决定效果
            if(Math.random() < 0.5){
                // 回血10%
                const playerHealth = this.player.GetComponent('PlayerHealth');
                if(playerHealth) playerHealth.Heal(); // 直接回血
                console.log('AmmoBox: 直接回血10%');
            }else{
                // 加30发子弹
                this.player.Broadcast({topic: 'AmmoPickup'});
                console.log('AmmoBox: 获得30发子弹');
            }
            this.Disable();
        }
    }

}