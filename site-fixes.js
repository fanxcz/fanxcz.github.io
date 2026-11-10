/*
  ПОЛИТ-КОМПАС
  FINAL BUTTON FIX
*/

(function(){

  "use strict";

  function cleanStorage(){
    try{
      localStorage.clear();
    }catch(e){}

    try{
      sessionStorage.clear();
    }catch(e){}
  }

  function restartTest(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    cleanStorage();

    /*
      Убираем координаты из URL.
      Например:
      /?e=3&s=1
      превращается в:
      /
    */
    try{
      const url = new URL(window.location.href);

      url.searchParams.delete("e");
      url.searchParams.delete("s");

      /*
        Убираем возможные служебные параметры
      */
      url.searchParams.delete("result");
      url.searchParams.delete("restart");
      url.searchParams.delete("v");

      /*
        Полностью заменяем текущую страницу
      */
      window.location.replace(
        url.pathname + url.search + url.hash
      );

    }catch(e){

      /*
        Резервный вариант
      */
      window.location.href = "/";
    }
  }

  /*
    Ищем кнопку "Заново" независимо от её старого ID.
  */
  document.addEventListener("click", function(event){

    const button = event.target.closest("button, a");

    if(!button) return;

    const text = (button.textContent || "")
      .replace(/\s+/g," ")
      .trim()
      .toLowerCase();

    /*
      Заново
    */
    if(
      text === "заново" ||
      text === "начать заново" ||
      text === "пройти заново" ||
      text === "начать тест заново"
    ){
      restartTest(event);
      return;
    }

  }, true);


  /*
    После загрузки страницы:
    делаем кнопки type="button", чтобы они
    случайно не отправляли форму.
  */
  document.addEventListener("DOMContentLoaded", function(){

    document.querySelectorAll("button").forEach(function(button){

      /*
        Если type не указан, браузер может считать
        кнопку submit.
      */
      if(!button.getAttribute("type")){
        button.setAttribute("type","button");
      }

    });

    /*
      Находим "Заново" и дополнительно привязываем
      прямой обработчик.
    */
    document.querySelectorAll("button, a").forEach(function(button){

      const text = (button.textContent || "")
        .replace(/\s+/g," ")
        .trim()
        .toLowerCase();

      if(
        text === "заново" ||
        text === "начать заново" ||
        text === "пройти заново" ||
        text === "начать тест заново"
      ){

        button.setAttribute("type","button");

        button.addEventListener("click", restartTest, {
          capture:true
        });

      }

    });

  });


  /*
    ================================
    СРАВНЕНИЕ
    ================================
  */

  function get(id){
    return document.getElementById(id);
  }

  function numberFromInput(id){

    const element = get(id);

    if(!element) return null;

    const raw = String(element.value || "").trim();

    if(raw === "") return null;

    const value = Number(raw);

    if(!Number.isFinite(value)) return null;

    if(value < -10 || value > 10) return null;

    return value;
  }


  /*
    Кнопка "Мои координаты"
  */
  document.addEventListener("DOMContentLoaded",function(){

    const myButton = get("compareMyBtn");

    if(myButton){

      myButton.type = "button";

      myButton.onclick = function(event){

        event.preventDefault();

        /*
          Берём координаты из текущего результата.
        */
        let eco = null;
        let soc = null;

        try{

          const params =
            new URLSearchParams(window.location.search);

          if(params.has("e"))
            eco = Number(params.get("e"));

          if(params.has("s"))
            soc = Number(params.get("s"));

        }catch(e){}

        /*
          Если URL не содержит координаты,
          ищем глобальный result.
        */
        if(
          (!Number.isFinite(eco) ||
           !Number.isFinite(soc))
          &&
          typeof window.result !== "undefined"
        ){

          eco = Number(window.result.eco);
          soc = Number(window.result.soc);

        }

        /*
          Ищем отображаемые координаты на странице.
        */
        if(!Number.isFinite(eco)){
          const element = document.getElementById("ecoValue");
          if(element)
            eco = Number(
              String(element.textContent)
                .replace(",",".")
                .replace(/[^\d.+-]/g,"")
            );
        }

        if(!Number.isFinite(soc)){
          const element = document.getElementById("socValue");
          if(element)
            soc = Number(
              String(element.textContent)
                .replace(",",".")
                .replace(/[^\d.+-]/g,"")
            );
        }

        const ecoInput = get("compareEco");
        const socInput = get("compareSoc");

        if(
          ecoInput &&
          socInput &&
          Number.isFinite(eco) &&
          Number.isFinite(soc)
        ){

          ecoInput.value = eco;
          socInput.value = soc;

          ecoInput.dispatchEvent(
            new Event("input",{bubbles:true})
          );

          socInput.dispatchEvent(
            new Event("input",{bubbles:true})
          );

        }

      };

    }


    /*
      Очистить сравнение
    */
    const clearButton = get("clearCompareBtn");

    if(clearButton){

      clearButton.type = "button";

      clearButton.onclick = function(event){

        event.preventDefault();

        const eco = get("compareEco");
        const soc = get("compareSoc");
        const output = get("compareOutput");
        const canvas = get("compareCanvas");

        if(eco) eco.value = "";
        if(soc) soc.value = "";

        if(output)
          output.textContent = "";

        if(canvas){

          const ctx = canvas.getContext("2d");

          if(ctx){
            ctx.clearRect(
              0,
              0,
              canvas.width,
              canvas.height
            );
          }

        }

      };

    }


    /*
      Сравнить
    */
    const compareButton = get("compareBtn");

    if(compareButton){

      compareButton.type = "button";

      compareButton.onclick = function(event){

        event.preventDefault();

        const eco = numberFromInput("compareEco");
        const soc = numberFromInput("compareSoc");

        const output = get("compareOutput");

        if(eco === null || soc === null){

          if(output){

            output.textContent =
              "Введите обе координаты от −10 до +10.";

          }

          return;
        }

        let myEco = null;
        let mySoc = null;

        try{

          const params =
            new URLSearchParams(window.location.search);

          myEco = Number(params.get("e"));
          mySoc = Number(params.get("s"));

        }catch(e){}

        if(
          !Number.isFinite(myEco) ||
          !Number.isFinite(mySoc)
        ){

          const ecoElement =
            get("ecoValue");

          const socElement =
            get("socValue");

          if(ecoElement)
            myEco = Number(
              String(ecoElement.textContent)
                .replace(",",".")
                .replace(/[^\d.+-]/g,"")
            );

          if(socElement)
            mySoc = Number(
              String(socElement.textContent)
                .replace(",",".")
                .replace(/[^\d.+-]/g,"")
            );

        }

        if(
          !Number.isFinite(myEco) ||
          !Number.isFinite(mySoc)
        ){

          if(output)
            output.textContent =
              "Сначала получите свой результат.";

          return;
        }

        const dx = eco - myEco;
        const dy = soc - mySoc;

        const distance =
          Math.sqrt(
            dx * dx +
            dy * dy
          );

        if(output){

          output.innerHTML =
            "<strong>Сравнение</strong><br>" +
            "Ваша точка: " +
            formatNumber(myEco) +
            ", " +
            formatNumber(mySoc) +
            "<br>" +
            "Вторая точка: " +
            formatNumber(eco) +
            ", " +
            formatNumber(soc) +
            "<br>" +
            "Разница по Economic: " +
            formatNumber(Math.abs(dx)) +
            "<br>" +
            "Разница по Social: " +
            formatNumber(Math.abs(dy)) +
            "<br>" +
            "<strong>Расстояние: " +
            distance.toFixed(2) +
            "</strong>";

        }

      };

    }

  });


  function formatNumber(value){

    const n = Number(value);

    if(!Number.isFinite(n))
      return "—";

    return n > 0 ? "+" + n : String(n);

  }

})();
