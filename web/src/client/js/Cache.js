// Stringified version of D3 file
const DataObject = () => {
    return {
        // List of user IDs which drives card elements
        userIds: [],

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