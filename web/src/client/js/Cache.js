// Stringified version of D3 file
const DataObject = () => {
    return {
        // Drives card elements
        users: [],

        // Tracks "unread" history
        notifications: [],
    
        // Same as users?
        //
        // { id, name, weight }
        nodes: [],
    
        // Same as notifications?
        //
        // { source, target, weight }
        links: [],
    }
};

class Cache {
    constructor() {
        this._data = DataObject();
        
        console.log('Cache initialized');
    }

    get data() {
        return this._data;
    }
}

export default Cache;