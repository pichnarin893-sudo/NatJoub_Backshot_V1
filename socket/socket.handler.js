const bookingEvents = require('./events/booking.events');
const roomEvents = require('./events/room.events');
const connectionEvents = require('./events/connection.events');

module.exports = (io, socket) => {
    connectionEvents(io, socket);
    roomEvents(io, socket);
    bookingEvents(io, socket);
};