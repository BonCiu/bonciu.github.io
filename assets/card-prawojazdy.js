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
  setData("name", result["name"].toUpperCase());
  setData("surname", result["surname"].toUpperCase());
  setData("nationality", result["nationality"].toUpperCase());
  // setData("fathersName", result["fathersName"].toUpperCase());
  setData("fathersName", "WOJCIECH");
  // setData("mothersName", result["mothersName"].toUpperCase());
  setData("mothersName", "AGATA");
  const birthdayValue = getBirthdayValue(result);
  if (birthdayValue) {
    const birthPlace = result.birthPlace
      ? result.birthPlace.toUpperCase()
      : null;
    setData(
      "birthday",
      birthPlace ? `${birthdayValue} ${birthPlace}` : birthdayValue,
    );
  }
  setData("familyName", result["familyName"]);
  setData("sex", textSex);
  setData("fathersFamilyName", result["fathersFamilyName"]);
  setData("mothersFamilyName", result["mothersFamilyName"]);
  setData("birthPlace", result["birthPlace"]);
  setData("countryOfBirth", result["countryOfBirth"]);
  setData(
    "adress",
    "ul. " +
      result["address1"] +
      "<br>" +
      result["address2"] +
      " " +
      result["city"],
  );

  var givenDate = birthdayDate;
  givenDate.setFullYear(givenDate.getFullYear() + 18);
  setData("givenDate", givenDate.toLocaleDateString("pl-PL", options));

  var expiryDate = givenDate;
  expiryDate.setFullYear(expiryDate.getFullYear() + 10);
  setData("expiryDate", expiryDate.toLocaleDateString("pl-PL", options));

  if (!localStorage.getItem("homeDate")) {
    var homeDay = getRandom(1, 25);
    var homeMonth = getRandom(0, 12);
    var homeYear = getRandom(2012, 2019);

    var homeDate = new Date();
    homeDate.setDate(homeDay);
    homeDate.setMonth(homeMonth);
    homeDate.setFullYear(homeYear);

    localStorage.setItem(
      "homeDate",
      homeDate.toLocaleDateString("pl-PL", options),
    );
  }

  document.querySelector(".home_date").innerHTML =
    localStorage.getItem("homeDate");

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

function getBirthdayValue(result) {
  if (result.birthday) {
    return result.birthday;
  }

  const year = parseInt(result.year, 10);
  const month = parseInt(result.month, 10);
  const day = parseInt(result.day, 10);

  if (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    year > 0 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  ) {
    const monthText = month < 10 ? "0" + month : month;
    const dayText = day < 10 ? "0" + day : day;
    return `${dayText}.${monthText}.${year}`;
  }

  return null;
}

async function loadData() {
  var db = await getDb();
  var data = await getData(db, "data");

  if (data) {
    loadReadyData(data);
  }

  let paramsData = Object.fromEntries(params);
  const filteredParams = Object.fromEntries(
    Object.entries(paramsData).filter(
      ([key, value]) => key !== "image" && value !== "",
    ),
  );

  if (Object.keys(filteredParams).length > 0) {
    filteredParams["data"] = "data";

    const mergedData = Object.assign({}, data || {}, filteredParams);
    loadReadyData(mergedData);
    saveData(db, mergedData);
  }
}

loadData();
loadImage();
async function loadImage() {
  var db = await getDb();
  var image = await getData(db, "image");

  if (image) {
    setImage(image.image);
  }

  console.log(params.get("image"));
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
  document.querySelector(".id_own_image").style.backgroundImage =
    `url(${image})`;
}

function setData(id, value) {
  document.getElementById(id).innerHTML = value;
}

var infoHolder = document.querySelector(".info_holder");
if (infoHolder) {
  infoHolder.addEventListener("click", () => {
    infoHolder.classList.toggle("unfolded");
  });
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
