"use strict";

(() => {
  const BOOKINGS_KEY = "ticket-booking:bookings:v1";
  const DRAFT_KEY = "ticket-booking:draft:v1";
  const SELECTION_KEY = "ticket-booking:selection:v1";
  const storageStatus = document.querySelector("#storage-status");
  const historyStatus = document.querySelector("#history-status");

  function showStorageError(message) {
    if (!storageStatus) {
      return;
    }
    storageStatus.dataset.error = "true";
    storageStatus.textContent = message;
  }

  function isBooking(value) {
    return value !== null &&
      typeof value === "object" &&
      typeof value.id === "string" &&
      typeof value.event === "string" &&
      typeof value.date === "string" &&
      typeof value.ticketType === "string" &&
      Number.isInteger(value.quantity) &&
      typeof value.createdAt === "string";
  }

  function loadBookings() {
    try {
      const saved = localStorage.getItem(BOOKINGS_KEY);
      if (saved === null) {
        return [];
      }

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || !parsed.every(isBooking)) {
        throw new Error("Saved booking data has an unexpected format.");
      }
      return parsed;
    } catch (error) {
      console.error("Could not load matchday bookings from localStorage.", error);
      showStorageError("Saved bookings could not be loaded. Check browser storage before continuing.");
      return null;
    }
  }

  function formatPrice(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  }

  function displayDate(date) {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  let bookings = loadBookings();

  function updateNavigationCount() {
    const count = document.querySelector("#booking-count");
    if (count) {
      count.textContent = bookings === null ? "—" : String(bookings.length);
    }
  }

  function renderHistory() {
    const body = document.querySelector("#bookings-body");
    if (!body) {
      return;
    }

    body.replaceChildren();
    if (bookings === null || bookings.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 8;
      cell.className = "empty-state";
      cell.textContent = bookings === null
        ? "Bookings could not be loaded. See the storage message above."
        : "No bookings yet. Choose a match to create your first demo booking.";
      row.append(cell);
      body.append(row);
    } else {
      bookings.forEach((booking) => {
        const row = document.createElement("tr");
        const reference = document.createElement("td");
        reference.textContent = booking.id.slice(0, 8).toUpperCase();
        row.append(reference);

        const total = typeof booking.total === "number" && Number.isFinite(booking.total)
          ? formatPrice(booking.total)
          : "—";
        [
          booking.event,
          displayDate(booking.date),
          booking.venue || "—",
          booking.ticketType,
          String(booking.quantity),
          total
        ].forEach((value) => {
          const cell = document.createElement("td");
          cell.textContent = value;
          row.append(cell);
        });

        const actionCell = document.createElement("td");
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "button button--remove";
        removeButton.dataset.removeBooking = booking.id;
        removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", `Remove booking ${reference.textContent}`);
        actionCell.append(removeButton);
        row.append(actionCell);
        body.append(row);
      });
    }

    const bookingCount = document.querySelector("#history-booking-count");
    const ticketCount = document.querySelector("#history-ticket-count");
    const historyTotal = document.querySelector("#history-total");
    if (bookingCount) {
      bookingCount.textContent = bookings === null ? "—" : String(bookings.length);
    }
    if (ticketCount) {
      ticketCount.textContent = bookings === null
        ? "—"
        : String(bookings.reduce((count, booking) => count + booking.quantity, 0));
    }
    if (historyTotal) {
      const hasUnknownTotal = bookings !== null &&
        bookings.some((booking) => typeof booking.total !== "number" || !Number.isFinite(booking.total));
      const total = bookings === null || hasUnknownTotal
        ? null
        : bookings.reduce((amount, booking) => amount + booking.total, 0);
      historyTotal.textContent = total === null ? "—" : formatPrice(total);
    }
  }

  function initBookingForm() {
    const form = document.querySelector("#booking-form");
    if (!form) {
      return;
    }

    const fields = Array.from(form.querySelectorAll("input, select"));
    const stadiumField = form.elements.stadium;
    const eventField = form.elements.event;
    const matchOptions = Array.from(eventField.options);
    const dateField = form.elements.date;
    const ticketTypeField = form.elements.ticketType;
    const quantityField = form.elements.quantity;
    const submitButton = document.querySelector("#submit-booking");
    const formStatus = document.querySelector("#form-status");
    const draftStatus = document.querySelector("#draft-status");
    const pricePerTicket = document.querySelector("#price-per-ticket");
    const bookingTotal = document.querySelector("#booking-total");

    function selectedMatch() {
      return eventField.selectedOptions[0];
    }

    function filterMatchesByStadium() {
      const selectedVenue = stadiumField.value;
      matchOptions.forEach((match) => {
        match.hidden = selectedVenue !== "all" && match.dataset.venue !== selectedVenue;
      });

      const selectedMatchIsVisible = matchOptions.some((match) => (
        match.value === eventField.value && !match.hidden
      ));
      if (!selectedMatchIsVisible) {
        const firstVisibleMatch = matchOptions.find((match) => !match.hidden);
        eventField.value = firstVisibleMatch ? firstVisibleMatch.value : "";
      }

      updateFixtureDetails();
    }

    function updateFixtureDetails() {
      const match = selectedMatch();
      if (!match || !match.dataset.date) {
        return;
      }

      const [home, away] = match.value.split(" vs ");
      const venue = match.dataset.venue;
      dateField.value = match.dataset.date;
      document.querySelector("#home-crest").textContent = match.dataset.home;
      document.querySelector("#away-crest").textContent = match.dataset.away;
      document.querySelector("#home-team").textContent = home;
      document.querySelector("#away-team").textContent = away;
      document.querySelector("#featured-date").textContent = displayDate(match.dataset.date);
      document.querySelector("#featured-venue").textContent = venue.split(",").pop().trim();
      document.querySelector("#match-date").textContent = displayDate(match.dataset.date);
      document.querySelector("#match-venue").textContent = venue;
      document.querySelector("#fixture-round").textContent =
        `SAMPLE FIXTURE ${String(eventField.selectedIndex + 1).padStart(2, "0")}`;
    }

    function updatePriceSummary() {
      const selectedTicket = ticketTypeField.selectedOptions[0];
      const unitPrice = Number(selectedTicket.dataset.price);
      const quantity = Number(quantityField.value) || 0;
      pricePerTicket.textContent = formatPrice(unitPrice);
      bookingTotal.textContent = formatPrice(unitPrice * quantity);
    }

    function saveDraft() {
      try {
        const draft = Object.fromEntries(fields.map((field) => [field.name, field.value]));
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        localStorage.setItem(SELECTION_KEY, JSON.stringify(draft));
        draftStatus.textContent = "Your selection is saved and will return after reload.";
        delete draftStatus.dataset.error;
      } catch (error) {
        console.error("Could not save the current match selection to browser storage.", error);
        draftStatus.dataset.error = "true";
        draftStatus.textContent = "The current selection could not be saved. Check browser storage.";
      }
    }

    function restoreDraft() {
      try {
        const savedSelection = localStorage.getItem(SELECTION_KEY);
        const saved = savedSelection === null
          ? sessionStorage.getItem(DRAFT_KEY)
          : savedSelection;
        if (saved === null) {
          return;
        }

        const draft = JSON.parse(saved);
        if (draft === null || typeof draft !== "object" || Array.isArray(draft)) {
          throw new Error("The saved selection has an unexpected format.");
        }

        fields.forEach((field) => {
          if (typeof draft[field.name] === "string") {
            field.value = draft[field.name];
          }
        });
        draftStatus.textContent = "Your last selection has been restored.";
      } catch (error) {
        console.error("Could not restore the saved match selection from browser storage.", error);
        draftStatus.dataset.error = "true";
        draftStatus.textContent = "The saved selection could not be restored. Your bookings are unaffected.";
      }
    }

    eventField.addEventListener("change", () => {
      eventField.setCustomValidity("");
    });

    fields.forEach((field) => {
      const updateSelection = () => {
        if (field === stadiumField) {
          filterMatchesByStadium();
        }
        if (field === eventField) {
          eventField.setCustomValidity("");
          updateFixtureDetails();
        }
        if (field === ticketTypeField || field === quantityField) {
          updatePriceSummary();
        }
        saveDraft();
      };
      field.addEventListener("input", updateSelection);
      field.addEventListener("change", updateSelection);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      formStatus.textContent = "";
      delete formStatus.dataset.error;
      eventField.setCustomValidity(
        eventField.value && dateField.value ? "" : "Choose an IPL matchup."
      );
      if (!form.reportValidity()) {
        return;
      }

      if (bookings === null) {
        formStatus.dataset.error = "true";
        formStatus.textContent = "Booking is unavailable until saved browser data can be read.";
        return;
      }

      const match = selectedMatch();
      const selectedTicket = ticketTypeField.selectedOptions[0];
      const unitPrice = Number(selectedTicket.dataset.price);
      if (!match || !match.dataset.venue || !Number.isFinite(unitPrice) || unitPrice <= 0) {
        formStatus.dataset.error = "true";
        formStatus.textContent = "The selected match or stand is unavailable. Please choose another option.";
        return;
      }

      const quantity = Number(quantityField.value);
      const booking = {
        id: crypto.randomUUID(),
        event: eventField.value,
        date: dateField.value,
        venue: match.dataset.venue,
        ticketType: ticketTypeField.value,
        quantity,
        unitPrice,
        total: unitPrice * quantity,
        createdAt: new Date().toISOString()
      };
      const nextBookings = [booking, ...bookings];

      try {
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(nextBookings));
      } catch (error) {
        console.error("Could not save the matchday booking to browser storage.", error);
        formStatus.dataset.error = "true";
        formStatus.textContent = "The booking could not be saved. Check browser storage and try again.";
        return;
      }

      bookings = nextBookings;
      updateNavigationCount();
      formStatus.textContent = `Matchday booking saved. Reference: ${booking.id.slice(0, 8).toUpperCase()}`;
      saveDraft();
    });

    filterMatchesByStadium();
    updatePriceSummary();
    restoreDraft();
    filterMatchesByStadium();
    updatePriceSummary();
    submitButton.disabled = bookings === null;
  }

  updateNavigationCount();
  renderHistory();
  initBookingForm();

  const bookingsBody = document.querySelector("#bookings-body");
  if (bookingsBody) {
    bookingsBody.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }
      const removeButton = event.target.closest("[data-remove-booking]");
      if (!removeButton || bookings === null) {
        return;
      }

      const bookingId = removeButton.dataset.removeBooking;
      const booking = bookings.find((item) => item.id === bookingId);
      if (!booking) {
        if (historyStatus) {
          historyStatus.dataset.error = "true";
          historyStatus.textContent = "That booking is no longer available. Refresh the history and try again.";
        }
        return;
      }

      const reference = booking.id.slice(0, 8).toUpperCase();
      if (!window.confirm(`Remove booking ${reference} from your history? This cannot be undone.`)) {
        return;
      }

      const nextBookings = bookings.filter((item) => item.id !== bookingId);
      try {
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(nextBookings));
      } catch (error) {
        console.error("Could not remove the matchday booking from browser storage.", error);
        if (historyStatus) {
          historyStatus.dataset.error = "true";
          historyStatus.textContent = "The booking could not be removed. Check browser storage and try again.";
        }
        return;
      }

      bookings = nextBookings;
      updateNavigationCount();
      renderHistory();
      if (historyStatus) {
        historyStatus.textContent = "Booking removed from your history.";
        delete historyStatus.dataset.error;
      }
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== BOOKINGS_KEY && event.key !== null) {
      return;
    }

    if (event.newValue === null) {
      bookings = [];
    } else {
      try {
        const parsed = JSON.parse(event.newValue);
        if (!Array.isArray(parsed) || !parsed.every(isBooking)) {
          throw new Error("Updated booking data has an unexpected format.");
        }
        bookings = parsed;
        if (storageStatus) {
          storageStatus.textContent = "";
          delete storageStatus.dataset.error;
        }
        if (historyStatus) {
          historyStatus.textContent = "";
          delete historyStatus.dataset.error;
        }
      } catch (error) {
        console.error("Could not update matchday bookings from another tab.", error);
        bookings = null;
        showStorageError("Bookings changed in another tab but could not be read. Check browser storage.");
      }
    }

    updateNavigationCount();
    renderHistory();
    const submitButton = document.querySelector("#submit-booking");
    if (submitButton) {
      submitButton.disabled = bookings === null;
    }
  });
})();
