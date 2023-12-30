// Stringified version of D3 file
const DataObject = () => {
    return {
        // userElements: [],

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

        // Only required for client implementation
        this.userElements = [];
        
        console.log('Cache initialized');
    }

    get data() {
        return this._data;
    }
}

export default Cache;