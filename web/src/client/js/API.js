
class API {
    constructor() {
        console.log('Static class');
    }

    static async getHealth() {
       return await fetch(`/api/health`)
           .catch(err => console.error(err))
           .then(response => {
               if (!response.ok) {
                   throw Error("URL not found");
               } else {
                   return response.json();
               }
           });
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

    static getUser(id) {
        return fetch(`/api/users/${id}`)
            .catch(err => console.error(err))
            .then(response => {
                if (!response.ok) {
                    throw Error("URL not found");
                } else {
                    return response.json();
                }
            })
            .then(data => {            
                return data;
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

    static async deleteNotifications(ids) {
        return fetch(`/api/notifications/${ids}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
        .catch(err => console.error(err))
        .then(response => {
            if (!response.ok) {
                throw Error("URL not found");
            } else {
                return response.json();
            }
        })
        .then(data => {
            return data;
        });        
    }
}

export default API;