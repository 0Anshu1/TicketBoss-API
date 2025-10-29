# TicketBoss API (Node.js/Express)

This is a solution for the Powerplay Backend Intern coding challenge, built with **Node.js** and **Express.js** as required by the project guidelines.

## Setup and Running

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/0Anshu1/TicketBoss-API
    cd TicketBoss-API
    ```

2.  **Install dependencies:**
    This command reads the `package.json` file and installs `express`, `joi`, and `uuid`.
    ```bash
    npm install
    ```

3.  **Run the application:**
    ```bash
    npm start
    ```
    (This assumes you have added the `"start": "node index.js"` script to your `package.json`).

    Alternatively, you can run it directly:
    ```bash
    node index.js
    ```

4.  **Access the API:**
    * **Base URL:** `http://localhost:8000`
    * You can use a tool like Postman or `curl` to test the endpoints.

---

## Technical Decisions & Architecture

* **Framework:** **Node.js + Express.js** was used as specified in the project guidelines ("standard Node.js project structure").
* **Storage:** I used in-memory JavaScript variables (`object` for the event, `Map` for reservations) for simplicity and to avoid external database setup. A `Map` is used for reservations to provide efficient $O(1)$ lookups and deletions by `reservationId`.
* **Validation:** I used the **Joi** library to handle all incoming request body validation.This provides clean and declarative rules (e.g., `seats` must be an integer between 1 and 10) and automatically generates clear error messages.
* **Concurrency Control:** The problem requires preventing over-selling in real-time.
    * Node.js operates on a **single-threaded event loop**. This means that each request handler function (e.g., the code inside `app.post('/reservations/', ...)` runs to completion before the next event is processed.
    * For our in-memory data, this provides an **implicit atomic guarantee**. A request will read `availableSeats`, check it, and write the new value without any other request being able to interrupt it.
    * This fulfills the concurrency requirement without needing explicit locks, as the race condition (two requests trying to grab the last seat at the same time) is prevented by the Node.js architecture itself.

---

## API Documentation

The endpoints are grouped by resource (Event, Reservations, Partners) for clarity.

### Event Endpoints

#### 1. Reset Event (Helper)
Resets the event data to its original state.

* **Endpoint:** `POST /events/reset`
* **Success Response (200 OK):**
    ```json
    {
      "eventId": "node-meetup-2025",
      "name": "Node.js Meet-up",
      "totalSeats": 500,
      "availableSeats": 500,
      "version": 0
    }
    ```

#### 2. Get Event Summary
Retrieves the current status of the event.

* **Endpoint:** `GET /reservations/`
* **Success Response (200 OK):**
    ```json
    {
      "eventId": "node-meetup-2025",
      "name": "Node.js Meet-up",
      "totalSeats": 500,
      "availableSeats": 497,
      "version": 1,
      "reservationCount": 1
    }
    ```

### Reservation Endpoints

#### 3. Reserve Seats
Creates a new reservation.

* **Endpoint:** `POST /reservations/`
* **Request Body:**
    ```json
    {
      "partnerId": "powerplay",
      "seats": 3
    }
    ```
* **Success Response (201 Created):**
    ```json
    {
      "reservationId": "res_a1b2c3d4",
      "partnerId": "powerplay",
      "seats": 3,
      "status": "confirmed"
    }
    ```
* **Error Responses:**
    * `400 Bad Request`: If `seats` is $\le 0$ or $> 10$.
    * `409 Conflict`: If `seats` requested $> availableSeats`.

#### 4. Get Reservation Details (Extra)
Retrieves details for a single reservation.

* **Endpoint:** `GET /reservations/:reservationId`
* **Success Response (200 OK):**
    ```json
    {
      "reservationId": "res_a1b2c3d4",
      "partnerId": "powerplay",
      "seats": 3,
      "status": "confirmed"
    }
    ```
* **Error Responses:**
    * `404 Not Found`: If `reservationId` does not exist.

#### 5. Cancel Reservation
Cancels an existing reservation and returns seats to the pool.

* **Endpoint:** `DELETE /reservations/:reservationId`
* **Success Response:** `204 No Content`
* **Error Responses:**
    * `404 Not Found`: If `reservationId` does not exist.

### Partner Endpoints

#### 6. List Partner Reservations (Extra)
Lists all reservations for a specific partner.

* **Endpoint:** `GET /partners/:partnerId/reservations`
* **Success Response (200 OK):**
    ```json
    [
      {
        "reservationId": "res_a1b2c3d4",
        "partnerId": "powerplay",
        "seats": 3,
        "status": "confirmed"
      }
    ]
    ```
