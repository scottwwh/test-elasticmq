
class API {
    constructor() {
        console.log('Static class');
    }

    static async getUsers() {
       return await fetch(`/api/users/`)
           .catch(err => console.error(err))
           .then(response => {
               if (!response.ok) {
                   throw Error("URL not found");
               } else {
                   return response.json();
               }
           });
    }

    // Load initial visualization data
    static async getNotifications() {
        return fetch(`/api/notifications/`)
            .catch(err => console.error(err))
            .then(response => {
                if (!response.ok) {
                    throw Error("URL not found");
                } else {
                    return response.json();
                }
            })
    }
}

export default API;