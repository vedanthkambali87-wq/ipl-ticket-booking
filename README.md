# Ticket Booking Demo

A browser-only ticket-booking demo. Bookings and the latest form selection are stored in `localStorage`; the in-progress form selection is also stored in `sessionStorage` so it returns after reloading the same tab.

## Run

From this folder, run:

```text
npm start
```

Open [http://127.0.0.1:3001](http://127.0.0.1:3001). Use the same browser and address to see saved bookings; browser storage is specific to the site's origin.

## Debug browser state

Open Developer Tools with **F12** or **Ctrl+Shift+I**.

- **Application → Local Storage → `http://127.0.0.1:3001`**: inspect `ticket-booking:bookings:v1`.
- **Application → Local Storage → `http://127.0.0.1:3001`**: inspect `ticket-booking:selection:v1` for the latest form values.
- **Application → Session Storage → `http://127.0.0.1:3001`**: inspect `ticket-booking:draft:v1`. The in-progress selection is also kept in this tab's session storage.
- **Console**: check for storage and JSON parsing errors. The app also shows a message if saved data cannot be read or written.
- **Network**: reload the page to check that the document loads. Creating a booking does not send an API request; it stays in browser storage.

If a booking is missing, first confirm the page uses the same host and port, then check whether the local-storage key exists and contains valid JSON. Avoid clearing site data unless you intend to delete saved bookings.
