export default class EntityManager{
    constructor(){
        this.ids = 0;
        this.entities = [];
        this.eventHandlers = {};
    }

    Get(name){
        return this.entities.find(el=>el.Name===name);
    }

    Add(entity){
        if(!entity.Name){
            entity.SetName(this.ids);
        }
        entity.id = this.ids;
        this.ids++;
        entity.SetParent(this);
        this.entities.push(entity);
    }

    EndSetup(){
        for(const ent of this.entities){
            for(const key in ent.components){
                ent.components[key].Initialize();
            }
        }
    }

    PhysicsUpdate(world, timeStep){
        for (const entity of this.entities) {
            entity.PhysicsUpdate(world, timeStep);
        }
    }

    RegisterEventHandler(handler, topic){
        if(!this.eventHandlers[topic]){
            this.eventHandlers[topic] = [];
        }
        this.eventHandlers[topic].push(handler);
    }

    Broadcast(msg){
        const handlers = this.eventHandlers[msg.topic];
        if(handlers){
            handlers.forEach(handler => handler(msg));
        }
    }

    Update(timeElapsed){
        for (const entity of this.entities) {
            entity.Update(timeElapsed);
        }
    }
}