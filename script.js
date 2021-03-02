"use strict";
///////////////////////////////////////////////////////////////
// * Events at top in case leaflet fails to load.
const openNav = document.getElementById("open-btn");
const closeNav = document.getElementById("cancel-btn");
const infoNav = document.getElementById("info-btn");
const nav = document.querySelectorAll(".nav");
const toasts = document.getElementById("toasts");
let flag = false;

// Generate toast message
function createToast() {
  const notif = document.createElement("div");
  notif.classList.add("toast");
  notif.innerText = "Click 🗺 to add. Click 🍔 to view.";
  toasts.appendChild(notif);
  setTimeout(() => {
    notif.remove();
  }, 3000);
}

infoNav.addEventListener("click", () => createToast());

// Open nav listener
openNav.addEventListener("click", () => {
  flag = true;
  nav.forEach((nav_el) => nav_el.classList.add("visible"));
});

// Close nav listener
closeNav.addEventListener("click", () => {
  nav.forEach((nav_el) => nav_el.classList.remove("visible"));
});

// Reset event listener.
document.getElementById("reset").addEventListener("click", () => {
  app.reset();
});
///////////////////////////////////////////////////////////////

// * Data storage class
class Workout {
  // Get current date
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(coords, distance, duration, cadence) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
    this.cadence = cadence; // in steps per min
  }

  // Get the rate of movement
  calcPace() {
    this.pace = this.distance / this.duration;
    return this.pace;
  }

  // Get aggregate of calories burnt, value used is sample and not accurate.
  // Credit: verywellfit.com
  // met = metabolic equivalent for task
  // Formula = time * ((met)*3.5* weight in kg)/200
  calcRunCalories() {
    this.calories = (this.duration * (9.965156794425087 * 3.5 * 82)) / 200;
    return this.calories;
  }
  calcJogCalories() {
    this.calories = (this.duration * (8.965156794425087 * 3.5 * 82)) / 200;
    return this.calories;
  }

  // Set the description of event and corresponding date
  _setDescription() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // format for HMTL description event
    this.description = `${
      months[this.date.getMonth()]
    } ${this.date.getDate()} - ${this.type[0].toUpperCase()}${this.type.slice(
      1
    )}`;
  }
}
///////////////////////////////////////////////////////////////

//* Running class inherits workout
class Running extends Workout {
  //Unique type for class
  type = "running";
  //Constructor
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration, cadence);
    this.calcPace();
    this.calcRunCalories();
    this._setDescription();
  }
}
// Running class inherits workout

//* Jogging class inherits workout
class Jogging extends Workout {
  //Unique type for class
  type = "jogging";
  //Constructor
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration, cadence);
    this.calcPace();
    this.calcJogCalories();
    this._setDescription();
  }
  //FIXME add weight and height input for calorie burned calculation
}
// Jogging class inherits workout
///////////////////////////////////////////////////////////////

//* App mechanism
//Variables for html elements
const form = document.querySelector(".form");
const submitBtn = document.getElementById("form__submit");
const cancelBtn = document.getElementById("form__cancel");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");

//* Leaflet custom marker
const orangeIcon = new L.Icon({
  iconUrl: "./img/marker-icon-orange.png",
  shadowUrl: "./img/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

//* Leaflet custom marker
const blueIcon = new L.Icon({
  iconUrl: "./img/marker-icon-blue.png",
  shadowUrl: "./img/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
///////////////////////////////////////////////////////////////

//* Mechanism Class
class App {
  #map;
  #mapZoomLevel = 14;
  #mapEvent;
  #workouts = [];

  constructor() {
    //User's position
    this._getPosition();

    //Local storage data fetch
    this._getLocalStorage();

    //For submit
    submitBtn.addEventListener("click", this._newWorkout.bind(this));
    //For cancel
    cancelBtn.addEventListener("click", this._hideForm.bind(this));
    //For display
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }

  //Function to get user's location
  _getPosition() {
    //Check for approval
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Location access was denied. Please reload and try again.");
        }
      );
  }

  // Display map tiles using leaflet library
  _loadMap(position) {
    infoNav.click();
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map", {
      minZoom: 11,
      maxZoom: 16,
    }).setView(coords, this.#mapZoomLevel);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on("click", this._showForm.bind(this));

    // Render each workout
    this.#workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  // Function For new entry
  // ! Dirty cheat logic. Update to double click toggle and add new function for modularity
  _showForm(mapE) {
    if (flag) {
      flag = false;
      this._showFormHelper(mapE).bind(this);
    } else {
      flag = true;
      if (nav[0].classList.contains("visible")) {
        cancelBtn.click();
        closeNav.click();
        return;
      } else {
        openNav.click();
        this._showFormHelper(mapE).bind(this);
      }
    }
  }

  _showFormHelper(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  // To hide the form
  _hideForm() {
    // Empty inputs
    inputDistance.value = inputDuration.value = inputCadence.value = "";
    // Remove from display
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  // Method for new workout addition
  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    // Prevent default
    e.preventDefault();

    //Fetch data
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // Check if data is valid
    if (
      !validInputs(distance, duration, cadence) ||
      !allPositive(distance, duration, cadence)
    )
      return alert("Must be positive numbers.");

    // Create running object
    if (type === "running") {
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // Create jogging object
    if (type === "jogging") {
      workout = new Jogging([lat, lng], distance, duration, cadence);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  // Render the workout markers in map tiles
  _renderWorkoutMarker(workout) {
    let myIcon = blueIcon;
    if (workout.type === "jogging") myIcon = orangeIcon;
    L.marker(workout.coords, { icon: myIcon })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚶‍♂️"} ${workout.description}`
      )
      .openPopup();
  }

  // Display the workout entries into the sidebar
  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">⌚</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🐾</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">💪</span>
          <span class="workout__value">${workout.calories.toFixed(0)}</span>
          <span class="workout__unit">cal</span>
        </div>
        <div class="workout__details">
        <span class="workout__icon">💨</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">km/min</span>
      </div>
    </li>
    `;
    // Attach it to the html tag
    form.insertAdjacentHTML("afterend", html);
  }

  // Method to Toggle
  _moveToPopup(e) {
    if (!this.#map) return;

    const workoutEl = e.target.closest(".workout");

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // Store entries in local storage
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  // Fetch from local storage
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    // Guard clause
    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  // Delete everything from local storage and reload the page
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}
// Mechanism class
///////////////////////////////////////

// Invoke and create the mechanism class
const app = new App();
