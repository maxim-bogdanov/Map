$(function() {

  buildMap(); // обертка

  function buildMap() {
    let timePointFade = 0; // сколько времени, чтобы появились все точки
    const timeHoldingPicture = 3000 // сколько времени картинка стоит на месте
    const timeFade = 1500; // длительность появления картинки

    let promise = new Promise(function (resolve, reject) {
      $.getJSON('../json/city.json', function(data) {
        let cities = data.cities.slice();

        timePointFade = cities.length * 400; // какое время займет на отрисовку всех точек

        const citiesHtml = document.getElementById('cities');
        for (let city of cities) { // расставляем города по координатам
          const cityHtml = document.createElement('div');
          cityHtml.className = 'city';

          cityHtml.innerHTML += '<h2 class="name">' + city.name + '</h2>';
          cityHtml.innerHTML += '<div class="point"></div>';

          cityHtml.style.left = city.coordinates.left + "px";
          cityHtml.style.top = city.coordinates.top + "px";

          if (city.name == 'Санкт&#8209Петербруг')
            cityHtml.querySelector('.name').classList.add('name_close');

          if (city.name == 'Гатчина')
            cityHtml.querySelector('.name').classList.add('name_line');

          citiesHtml.insertAdjacentHTML('beforeend', cityHtml.outerHTML);
        }
        resolve();
      });
    });
    promise.then(function() { // анимируем плавное появление точек
      return new Promise(function(resolve, reject) {
        animatePoints();
        resolve();
      });
    })
    .then(function() {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          $.getJSON('../json/zones.json', function(data) {
            let zones = data.zones.slice();
            const zonesHtml = document.getElementById('zones');

            function animatePictures() {
              while (true) {

                let firstPicture = true; // первая загружаемая картинка (первый проход в цикле)
                let visiblePictures = []; // массив всех видимых прогружаемых картинок

                let countVisiblePictures = randomNumber(1, 5); // по тз сказано, что картинок одновременно может быть не больше 5
                let count = 0;

                // выбираем все рандомные картинки, которые не наслаиваются друг на друга и не повторяются
                while (count != countVisiblePictures) {
                  let randomZone = randomNumber(0, zones.length - 1); // индекс случайной зоны
                  let activeZone = zones[randomZone]; // выбираем случайную зону
                  let activePictures = activeZone.pictures; // получаем массив картинок

                  const zoneHtml = document.createElement('div');

                  zoneHtml.className = 'zone';

                  let activePicturesLength = activePictures.length;
                  let randomPictureNumber = randomNumber(0, activePicturesLength - 1); // индекс случайной картинки в этой зоне
                  let activePicture = activePictures[randomPictureNumber]; // выбираем эту картинку

                  zoneHtml.innerHTML += '<img class="picture" src=' + activePicture.src + '>';

                  let coordinatesLength = activeZone.coordinates.length;
                  // у одной зоны (например, Аскольд) две зоны появления картинок. Мы рандомно выбираем одну из них
                  // и уже там отрисовываем картинку
                  let randomCoordinatesNumber = randomNumber(0, coordinatesLength - 1);

                  const widthPicture = 100, heightPicture = 100; // все ширины и высоты картинок одинаковые + отступы

                  // по дефолту у картиники координатой отсчета будет левый верхний угол
                  // нам нужно сделать точку отсчета на нижней средней стороне (где треугольный указатель)
                  // поэтому делаем сдвиг

                  // в zones.json area указана координата левого нижнего и правого верхнего угла каждой области
                  // получается мы берем случайную точку, лежащую в этой области
                  // областей тоже может быть несколько, они также берутся случайно в randomCoordinatesNumber
                  let randomCoordinatesLeft = randomNumber(
                    activeZone.coordinates[randomCoordinatesNumber].area[0].left - widthPicture / 2,
                    activeZone.coordinates[randomCoordinatesNumber].area[1].left - widthPicture / 2
                  );

                  let randomCoordinatesTop = randomNumber(
                    activeZone.coordinates[randomCoordinatesNumber].area[0].top - heightPicture,
                    activeZone.coordinates[randomCoordinatesNumber].area[1].top - heightPicture
                  );

                  zoneHtml.style.left = randomCoordinatesLeft + "px";
                  zoneHtml.style.top = randomCoordinatesTop + "px";

                  // если первый раз прогружается картинка
                  // если текущая картинка не пересекается со всеми остальными
                  if (firstPicture || !crossPicture(visiblePictures, zoneHtml, widthPicture, heightPicture)) {
                    visiblePictures.push(zoneHtml);
                    count++;
                  }

                  firstPicture = false;
                }


                // добавляем в html все картинки
                for (let picture of visiblePictures) {
                  zonesHtml.insertAdjacentElement("beforeend", picture);
                }
          
                // анимация появления картинок
                let promise = new Promise(function (resolve, reject) {
                  for (let picture of visiblePictures) {
                    $(picture).fadeIn(timeFade);
                  }
                  resolve();
                });
                // картинка ждет 3с, и исчезает
                promise.then(function() {
                  return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                      for (let picture of visiblePictures) {
                        $(picture).fadeOut(timeFade);
                      }
                      resolve();
                    }, timeFade + timeHoldingPicture);
                  })
                })
                // когда картинка исчезает, все зоны стираются
                .then(function() {
                  return new Promise(function(resolve, reject) {
                    setTimeout(function() {
                      zonesHtml.innerHTML = '';
                      resolve();
                    }, timeFade);
                  })
                });
  
                // не получилось до конца реализовать плавное исчезновение картинок,
                // возможно запутался с промисами и сеттаймаутами
                // правильно нужно указать setTimeout(animatePictures, timeHoldingPicture + 2 * timeFade); 1.5сек на появление + 3с + 1.5с на исчезновение
                // но правильно отобразится только первый проход, остальные не появятся
                // поэтому выбрал вариант, где показывается верно все, но только без плавного исчезновения
                setTimeout(animatePictures, timeHoldingPicture); // вызывается рекурсивно, как альтернатива setInterval.          
                break;

              }
            };

            animatePictures();
            resolve();

          });
        }, timePointFade);
      });
    })


    const map = document.querySelector('.map');
    // вешаем слушателя на общий родитель, чтобы не создавать кучу событий на каждую точку
    // локально городов 5, а если 205? не оптимально
    // поэтому воспользуемся делегированием событий

    map.addEventListener('mouseover', function() {
      // при наведении на объект смотрим точка это или нет
      if (!event.target.classList.contains('point')) return;

      const name = event.target.closest('.city').querySelector('.name');

      $(name).fadeIn('slow');
    });

    map.addEventListener('mouseout', function() {
      if (!event.target.classList.contains('point')) return;

      const name = event.target.closest('.city').querySelector('.name');

      $(name).fadeOut('slow');
    });


    // функция плавного появления точек 
    function animatePoints() {
      const points = document.querySelectorAll('.point');
    
      $(points).each(function(index) {
        $(this).fadeIn((index + 1) * 400);
      });
    }
    
    // рандомное число
    function randomNumber(min, max) {
      let rand = min - 0.5 + Math.random() * (max - min + 1);
      return Math.round(rand);
    }


    //пересечение картинок 
    function crossPicture(arr, b, width, height) {

      for (let item of arr) {
        if ((Math.abs(parseInt(item.style.left) - parseInt(b.style.left)) < width && Math.abs(parseInt(item.style.top) - parseInt(b.style.top)) < height) //пересечение картинок 
        || ((item.querySelector('.picture').src == b.querySelector('.picture').src))) //такая картинка уже добавлена
        return true; // картинка не подходит и нужно искать другую
      }

      return false;

    }
  }

});
