class RoomsManager {
    constructor() {
        this.rooms = new Map();
    }

    addUser(roomId, userId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId).add(userId);
    }

    removeUser(roomId, userId) {
        if (this.rooms.has(roomId)) {
            this.rooms.get(roomId).delete(userId);
            if (this.rooms.get(roomId).size === 0) {
                this.rooms.delete(roomId);
            }
        }
    }

    getRoomSize(roomId) {
        return this.rooms.has(roomId) ? this.rooms.get(roomId).size : 0;
    }
}

module.exports = new RoomsManager();