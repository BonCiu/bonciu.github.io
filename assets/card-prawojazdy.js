var params = new URLSearchParams(window.location.search);

function loadReadyData(result) {
  Object.keys(result).forEach((key) => {
    result[key] = htmlEncode(result[key]);
  });

  const birthdayDate = new Date();

  birthdayDate.setFullYear(result["year"], result["month"] - 1, result["day"]);

  var sex = result["sex"];

  let day = birthdayDate.getDay();
  let month = birthdayDate.getMonth();
  let year = birthdayDate.getFullYear();

  var textSex;
  if (sex === "m") {
    textSex = "Mężczyzna";
  } else if (sex === "k") {
    textSex = "Kobieta";
  }

  var seriesAndNumber = localStorage.getItem("seriesAndNumber");
  if (!seriesAndNumber) {
    seriesAndNumber = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUWXYZ".split("");
    for (var i = 0; i < 4; i++) {
      seriesAndNumber += chars[getRandom(0, chars.length)];
    }
    seriesAndNumber += " ";
    for (var i = 0; i < 5; i++) {
      seriesAndNumber += getRandom(0, 9);
    }
    localStorage.setItem("seriesAndNumber", seriesAndNumber);
  }

  day =
    birthdayDate.getDate() > 9
      ? birthdayDate.getDate()
      : "0" + birthdayDate.getDate();
  month =
    birthdayDate.getMonth() + 1 > 9
      ? birthdayDate.getMonth() + 1
      : "0" + (birthdayDate.getMonth() + 1);

  setData("seriesAndNumber", seriesAndNumber);
  setData("name", result["name"] ? result["name"].toUpperCase() : "");
  setData("surname", result["surname"] ? result["surname"].toUpperCase() : "");
  setData("nationality", result["nationality"] ? result["nationality"].toUpperCase() : "");
  setData("fathersName", result["fathersName"] ? result["fathersName"].toUpperCase() : "WOJCIECH");
  setData("mothersName", result["mothersName"] ? result["mothersName"].toUpperCase() : "AGATA");
  
  // Data urodzenia z miejscem urodzenia
  var birthdayText = day + "." + month + "." + birthdayDate.getFullYear();
  if (result["birthPlace"]) {
    birthdayText += " " + result["birthPlace"].toUpperCase();
  }
  setData("birthday", birthdayText);

  setData("familyName", result["familyName"] ? result["familyName"] : "");
  setData("sex", textSex ? textSex : "");
  setData("fathersFamilyName", result["fathersFamilyName"] ? result["fathersFamilyName"] : "");
  setData("mothersFamilyName", result["mothersFamilyName"] ? result["mothersFamilyName"] : "");
  setData("birthPlace", result["birthPlace"] ? result["birthPlace"] : "");
  setData("countryOfBirth", result["countryOfBirth"] ? result["countryOfBirth"] : "");
  setData(
    "adress",
    result["address1"] && result["address2"] && result["city"]
      ? "ul. " + result["address1"] + "<br>" + result["address2"] + " " + result["city"]
      : ""
  );

  var givenDate = new Date(birthdayDate);
  givenDate.setFullYear(givenDate.getFullYear() + 18);
  setData("givenDate", givenDate.toLocaleDateString("pl-PL", options));

  var expiryDate = new Date(givenDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 10);
  setData("expiryDate", expiryDate.toLocaleDateString("pl-PL", options));

  if (!localStorage.getItem("homeDate")) {
    var homeDay = getRandom(1, 25);
    var homeMonth = getRandom(0, 12);
    var homeYear = getRandom(2012, 2019);

    var homeDate = new Date(homeYear, homeMonth, homeDay);

    localStorage.setItem(
      "homeDate",
      homeDate.toLocaleDateString("pl-PL", options)
    );
  }

  var homeDateElement = document.querySelector(".home_date");
  if (homeDateElement) {
    homeDateElement.innerHTML = localStorage.getItem("homeDate");
  }

  if (parseInt(year) >= 2000) {
    month = 20 + parseInt(month);
  }

  var later;

  if (sex === "m") {
    later = "0295";
  } else {
    later = "0382";
  }

  if (day < 10) {
    day = "0" + day;
  }

  if (month < 10) {
    month = "0" + month;
  }

  var pesel = year.toString().substring(2) + month + day + later + "7";
  setData("pesel", pesel);
}

async function loadData() {
  console.log("loadData called");
  var db = await getDb();
  var data = await getData(db, "data");
  console.log("data from DB:", data);

  if (data) {
    console.log("loading data from DB");
    loadReadyData(data);
  }

  let result = Object.fromEntries(params);
  console.log("result from params:", result);

  result["data"] = "data";
  
  // Jeśli brak danych, użyj domyślnych
  if (!data && (!result.year || !result.month || !result.day)) {
    console.log("No data or date params, using defaults");
    result = {
      year: "1990",
      month: "1", 
      day: "1",
      sex: "m",
      name: "Jan",
      surname: "Kowalski",
      nationality: "Polska",
      birthPlace: "Warszawa",
      address1: "Marszałkowska",
      address2: "1",
      city: "Warszawa",
      data: "data"
    };
  }
  
  if (result !== data) {
    console.log("loading result:", result);
    loadReadyData(result);
    saveData(db, result);
  }
}

async function loadImage() {
  var db = await getDb();
  var image = await getData(db, "image");

  if (image) {
    setImage(image.image);
  }

  if (params.get("image")) {
    setImage(params.get("image"));
    var data = {
      data: "image",
      image: params.get("image"),
    };
    saveData(db, data);
  }
}

function setImage(image) {
  var element = document.querySelector(".id_own_image");
  if (element) {
    element.style.backgroundImage = `url(${image})`;
  }
}

function setData(id, value) {
  var element = document.getElementById(id);
  if (element) {
    element.innerHTML = value;
  } else {
    console.warn("Element with id '" + id + "' not found");
  }
}

function getDb() {
  return new Promise((resolve, reject) => {
    var request = window.indexedDB.open("cwelObywatel", 1);

    request.onerror = (event) => {
      reject(event.target.error);
    };

    var name = "data";

    request.onupgradeneeded = (event) => {
      var db = event.target.result;

      if (!db.objectStoreNames.contains(name)) {
        db.createObjectStore(name, {
          keyPath: name,
        });
      }
    };

    request.onsuccess = (event) => {
      var db = event.target.result;
      resolve(db);
    };
  });
}

function getData(db, name) {
  return new Promise((resolve, reject) => {
    var store = getStore(db);

    var request = store.get(name);

    request.onsuccess = () => {
      var result = request.result;
      if (result) {
        resolve(result);
      } else {
        resolve(null);
      }
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function getStore(db) {
  var name = "data";
  var transaction = db.transaction(name, "readwrite");
  return transaction.objectStore(name);
}

function saveData(db, data) {
  return new Promise((resolve, reject) => {
    var store = getStore(db);

    console.log(data);
    var request = store.put(data);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function htmlEncode(str) {
  if (!str) return "";
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

var options = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};
var optionsTime = { second: "2-digit", minute: "2-digit", hour: "2-digit" };

var time = document.getElementById("time");

if (localStorage.getItem("update") == null) {
  localStorage.setItem("update", "24.12.2024");
}

var date = new Date();

var updateText = document.querySelector(".bottom_update_value");
if (updateText) {
  updateText.innerHTML = localStorage.getItem("update");
}

var update = document.querySelector(".update");
if (update) {
  update.addEventListener("click", () => {
    var newDate = date.toLocaleDateString("pl-PL", options);
    localStorage.setItem("update", newDate);
    if (updateText) {
      updateText.innerHTML = newDate;
    }
    scroll(0, 0);
  });
}

loadData();
loadImage();
setClock();

function setClock() {
  date = new Date();
  if (time) {
    time.innerHTML =
      "Czas: " +
      date.toLocaleTimeString("pl-PL", optionsTime) +
      " " +
      date.toLocaleDateString("pl-PL", options);
  }
  delay(1000).then(() => {
    setClock();
  });
}

var infoHolders = document.querySelectorAll(".info_holder");
infoHolders.forEach(function(holder) {
  holder.addEventListener("click", function() {
    holder.classList.toggle("unfolded");
  });
});
