const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json()); 

//In-Memory DB
let db_event = {};
let db_reservations = new Map();

//Function for resetting event data
function resetEventData() {
  db_event = {
    eventId: "node-meetup-2025",
    name: "Node.js Meet-up",
    totalSeats: 500,
    availableSeats: 500,
    version: 0
  };
  db_reservations.clear();
  console.log("Event data has been reset.");
}

//Endpoints

app.post('/reservations/', (req, res) => {
  const schema = Joi.object({
    partnerId: Joi.string().required(),
    seats: Joi.number().integer().min(1).max(10).required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { partnerId, seats } = value;

  if (db_event.availableSeats < seats) {
    return res.status(409).json({ error: "Not enough seats left" });
  }

  db_event.availableSeats -= seats;
  db_event.version += 1; 

  const newReservation = {
    reservationId: `res_${uuidv4().split('-')[0]}`,
    partnerId: partnerId,
    seats: seats,
    status: "confirmed"
  };

  db_reservations.set(newReservation.reservationId, newReservation);
  return res.status(201).json(newReservation);
});

app.get('/reservations/', (req, res) => {
  const summary = {
    ...db_event,
    reservationCount: db_reservations.size
  };
  return res.status(200).json(summary);
});

app.get('/reservations/:reservationId', (req, res) => {
  const { reservationId } = req.params;
  
  if (!db_reservations.has(reservationId)) {
    return res.status(404).json({ error: "Reservation not found" });
  }
  
  return res.status(200).json(db_reservations.get(reservationId));
});

app.delete('/reservations/:reservationId', (req, res) => {
  const { reservationId } = req.params;

  if (!db_reservations.has(reservationId)) {
    return res.status(404).json({ error: "Not Found if reservationId unknown or already cancelled" });
  }

  const cancelledSeats = db_reservations.get(reservationId).seats;
  db_event.availableSeats += cancelledSeats;
  db_event.version += 1; 
  db_reservations.delete(reservationId);

  return res.status(204).send();
});

app.get('/partners/:partnerId/reservations', (req, res) => {
  const { partnerId } = req.params;
  const partnerReservations = [];

  for (const reservation of db_reservations.values()) {
    if (reservation.partnerId === partnerId) {
      partnerReservations.push(reservation);
    }
  }
  return res.status(200).json(partnerReservations);
});

app.post('/events/reset', (req, res) => {
  resetEventData();
  return res.status(200).json(db_event);
});

//starting server
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  resetEventData(); // Bootstraps event on first start-up
  console.log(`TicketBoss API running on http://localhost:${PORT}`);
});