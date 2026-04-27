const params = new URLSearchParams(window.location.search);

function loadReadyData(result) {
  if (result.seriesAndNumber) {
    setData("seriesAndNumber", result.seriesAndNumber);
  }
  if (result.name) {
    setData("name", result.name);
  }
  if (result.surname) {
    setData("surname", result.surname);
  }
  if (result.nationality) {
    setData("nationality", result.nationality);
  }
  if (result.birthday) {
    setData("birthday", result.birthday);
  }
  if (result.pesel) {
    setData("pesel", result.pesel);
  }
  if (result.expiryDate) {
    setData("expiryDate", result.expiryDate);
  }
  if (result.givenDate) {
    setData("givenDate", result.givenDate);
  }
  if (result.fathersName) {
    setData("fathersName", result.fathersName);
  }
  if (result.mothersName) {
    setData("mothersName", result.mothersName);
  }
  if (result.familyName) {
    setData("familyName", result.familyName);
  }
  if (result.sex) {
    setData("sex", result.sex);
  }
  if (result.categories) {
    setData("categories", result.categories);
  }
  if (result.fathersFamilyName) {
    setData("fathersFamilyName", result.fathersFamilyName);
  }
  if (result.mothersFamilyName) {
    setData("mothersFamilyName", result.mothersFamilyName);
  }
  if (result.birthPlace) {
    setData("birthPlace", result.birthPlace);
  }
  if (result.countryOfBirth) {
    setData("countryOfBirth", result.countryOfBirth);
  }
  if (result.adress) {
    setData("adress", result.adress);
  }
}

async function loadData() {
  var db = await getDb();
  var data = await getData(db, "data");

  if (data) {
    loadReadyData(data);
  }

  let result = Object.fromEntries(params);

  result["data"] = "data";
  if (result !== data) {
    loadReadyData(result);
    saveData(db, result);
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
