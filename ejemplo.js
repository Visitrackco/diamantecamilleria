try {
    moment.locale("es");
    google.charts.load("45", {
      packages: ["corechart"],
      language: "es",
    });
    google.charts.setOnLoadCallback(drawChart);
  
    const spanTipoProveedor = document.querySelector(
      '[data-api="PROVEEDOR_ACTIVO"]'
    );

    console.log(spanTipoProveedor, 'valor 1')
  
    if (spanTipoProveedor) {
      const apiValue = spanTipoProveedor.getAttribute("data-api");
      const currentValue = spanTipoProveedor.textContent.trim();
  
      if (currentValue === "SI") {
        spanTipoProveedor.textContent = "PROVEEDOR NUEVO";
        spanTipoProveedor.classList.add("text-value");
      } else if (currentValue === "NO") {
        spanTipoProveedor.textContent = "PROVEEDOR ACTIVO";
        spanTipoProveedor.classList.add("text-value");
      } else {
        spanTipoProveedor.textContent = "";
      }
    }
  
    let segPhotosMd = [];
  
    function processTable(tableApi, categoryName) {
      try {
        const table = document.querySelector(`table[data-api="${tableApi}"]`);
  
        const tbody = table.querySelector("tbody");
  
        const rows = tbody.querySelectorAll("tr");
        const data = [];
        let totalScore = 0;
        let countValidScores = 0;
  
        let countYesQualify = 0;
        let countNoQualify = 0;
  
        rows.forEach((row) => {
          const cols = row.querySelectorAll("td[data-col]");
          if (cols.length > 0) {
            const entry = {};
  
            cols.forEach((col) => {
              const key = col.getAttribute("data-col");
              let value = col.textContent.trim();
  
              if (key === "PUNTAJE") {
                if (value === "" || isNaN(value)) {
                  value = "N/A";
                } else {
                  value = parseFloat(value);
                }
  
                if (value !== "N/A" && value >= 0 && value <= 5) {
                  totalScore += value;
                  countValidScores++;
                }
              }
              if (key === "DESEA_CALIFICAR") {
                if (value === "SI") {
                  countYesQualify++;
                } else if (value === "NO") {
                  countNoQualify++;
                }
              }
  
              entry[key] = value;
            });
  
            data.push(entry);
          }
        });
  
        tbody.innerHTML = "";
  
        data.forEach((item, index) => {
          const tr = document.createElement("tr");
  
          if (index === 0) {
            const tdCategory = document.createElement("td");
            tdCategory.rowSpan = data.length;
            tdCategory.className = "text-center";
            tdCategory.innerHTML = `<b>${categoryName}</b>`;
            tdCategory.style.maxWidth = "160px";
            tdCategory.style.minWidth = "160px";
            tr.appendChild(tdCategory);
          }
  
          Object.keys(item).forEach((key) => {
            const td = document.createElement("td");
            td.textContent = item[key];
            td.setAttribute("data-col", key);
            td.style.textAlign = "center";
            td.style.fontSize = "12px";
  
            if (key === "Name") {
              td.style.textAlign = "start";
              td.style.maxWidth = "210px";
              td.style.minWidth = "210px";
            }
  
            if (key === "PUNTAJE") {
              td.style.textAlign = "center";
              td.style.width = "70px";
              td.style.color = "#ffffff";
  
              if (item[key] === "N/A") {
                td.style.backgroundColor = "#00b0f0";
              } else if (item[key] === 5) {
                td.style.backgroundColor = "#01b150";
              } else if (item[key] === 4) {
                td.style.backgroundColor = "#93d051";
              } else if (item[key] === 3) {
                td.style.backgroundColor = "#fec001";
              } else if (item[key] === 2) {
                td.style.backgroundColor = "#fe0001";
              } else if (item[key] === 1) {
                td.style.backgroundColor = "#c10001";
              } else if (item[key] === 0) {
                td.style.backgroundColor = "#585958";
              }
            }
  
            if (key === "DESCRIPCION_MEDIDA_CORRECTIVA") {
              td.style.maxWidth = "210px";
              td.style.minWidth = "210px";
            }
  
            if (key === "INFORMACION_ADICIONAL") {
              td.style.maxWidth = "210px";
              td.style.minWidth = "210px";
            }
  
            if (key === "DESEA_CALIFICAR") {
              td.style.display = "none";
            }
  
            if (key === "SEGUIMIENTO") {
              if (item[key] === "") {
                console.log('NOOOOOO')
                td.textContent = "NO";
              } else {

                console.log('SIIIII')
                let segCurrentMd = item['MD_SEGUIMIENTO'];
                segPhotosMd.push(segCurrentMd);
              }
            }
  
            if (key === "FECHA_SEGUIMIENTO") {
              td.style.maxWidth = "70px";
              td.style.minWidth = "70px";
  
              if (item["SEGUIMIENTO"] === "" || item["SEGUIMIENTO"] === "NO") {
                td.textContent = "";
              }
            }
  
            if (key === "MD_SEGUIMIENTO") {
              // td.style.display = "none";
            }
  
            tr.appendChild(td);
          });
  
          tbody.appendChild(tr);
        });
  
        const maxScore = countValidScores * 5;
        const percentage =
          maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(0) : 0;
  
        const totalRow = document.createElement("tr");
        const totalCell = document.createElement("td");
        totalCell.colSpan = 2;
        totalCell.textContent = `PUNTAJE:`;
        totalCell.style.fontSize = "12px";
        totalRow.appendChild(totalCell);
  
        const totalValueCell = document.createElement("td");
        totalValueCell.textContent = totalScore;
        totalValueCell.style.textAlign = "center";
        totalValueCell.classList.add("text-medium");
  
        totalRow.appendChild(totalValueCell);
  
        tbody.appendChild(totalRow);
  
        const percentageRow = document.createElement("tr");
        const percentageCell = document.createElement("td");
        percentageCell.colSpan = 2;
        percentageCell.textContent = "PORCENTAJE:";
        percentageCell.style.fontSize = "12px";
  
        percentageRow.appendChild(percentageCell);
  
        const percentageValueCell = document.createElement("td");
        percentageValueCell.textContent = `${percentage}%`;
        percentageValueCell.style.textAlign = "center";
        percentageValueCell.classList.add("text-medium");
        percentageRow.appendChild(percentageValueCell);
  
        tbody.appendChild(percentageRow);
  
        return { totalScore, percentage, countYesQualify, countNoQualify };
      } catch (error) {
        console.error(error);
        return {
          totalScore: 0,
          percentage: 0,
          countYesQualify: 0,
          countNoQualify: 0,
        };
      }
    }
  
    const results = [];
    results.push(processTable("MD_ADMINISTRACION", "ADMINISTRACIÓN"));
    results.push(processTable("MD_TIEMPO_ENTREGA", "TIEMPO DE ENTREGA"));
    results.push(processTable("MD_CALIDAD_PRODUCTO", "CALIDAD DEL PRODUCTO"));
    results.push(processTable("MD_ALCANCE", "ALCANCE"));
    results.push(processTable("MD_CRITERIOS_PERSONAL", "PERSONAL"));
    results.push(processTable("MD_CRITERIOS_COMUNICACIONES", "COMUNICACIONES"));
    results.push(processTable("MD_CRITERIOS_CRONOGRAMA", "CRONOGRAMA"));
    results.push(
      processTable("MD_CRITERIOS_SALUD_SEGURIDAD", "SALUD Y SEGURIDAD")
    );

    console.log(results, 'resultados')
  
    // Sumamos todos los puntajes totales (ya está en tu código)
    const totalScore = results.reduce((acc, curr) => acc + curr.totalScore, 0);
  
    // Sumar todos los porcentajes (ya está en tu código)
    const totalPercentage = results.reduce(
      (acc, curr) => acc + parseFloat(curr.percentage),
      0
    );
  
    // Calcular el promedio de los porcentajes (ya está en tu código)
    const averagePercentage = totalPercentage / results.length;
  
    // Limitar el porcentaje al 100% si es necesario (ya está en tu código)
    const finalPercentage = Math.min(averagePercentage, 100);
  
    // Mostrar el total en los elementos correspondientes (ya está en tu código)

    const globalPuntageValue = document.getElementById("global-puntage");
    globalPuntageValue.textContent = `${totalScore}`;

    console.log(globalPuntageValue, 'globalPuntageValue')
  
    const globalPorcentageValue = document.getElementById("global-porcentage");
    globalPorcentageValue.textContent = `${finalPercentage.toFixed(0)}%`;

    console.log(globalPorcentageValue, 'globalPorcentageValue')
  
    // tabla antes de grafica
    const herehere = document.getElementById("herehere");
    // herehere.textContent = `${JSON.stringify(segPhotosMd)}`;
  
    const tableResume = document.querySelector('[data-api="table-resume"]');
  
    const rows = tableResume.querySelectorAll("tbody tr");
  
    rows.forEach((row, index) => {
      const categoryData = results[index]; // Obtener el objeto correspondiente de results
      const cells = row.querySelectorAll("td");

      console.log(cells[0].textContent, 'celdas', categoryData)

      if (cells.length > 1 && categoryData) {
           // Asignar los valores a las celdas correspondientes
      cells[1].textContent = categoryData.countYesQualify; // A
      cells[2].textContent = categoryData.countNoQualify; // N/A
      cells[3].textContent = categoryData.totalScore; // PUNTAJE
      cells[4].textContent = `${categoryData.percentage}%`; // %
      }
  
   
    });
  
    // Aquí es donde vamos a modificar la gráfica para mostrar los porcentajes individuales de cada categoría
    function drawChart() {
      // Datos de la gráfica
      var grafico = [
        ["ITEM", "PORCENTAJE", { role: "annotation" }],
        [
          "ADMINISTRACIÓN",
          parseInt(results[0].percentage),
          `${results[0].percentage}%`,
        ], // Asegúrate de que los índices coincidan
        [
          "TIEMPO DE ENTREGA",
          parseInt(results[1].percentage),
          `${parseInt(results[1].percentage)}%`,
        ],
        [
          "CALIDAD DEL PRODUCTO",
          parseInt(results[2].percentage),
          `${parseInt(results[2].percentage)}%`,
        ],
        [
          "ALCANCE",
          parseInt(results[3].percentage),
          `${parseInt(results[3].percentage)}%`,
        ],
        [
          "PERSONAL",
          parseInt(results[4].percentage),
          `${parseInt(results[4].percentage)}%`,
        ],
        [
          "COMUNICACIONES",
          parseInt(results[5].percentage),
          `${parseInt(results[5].percentage)}%`,
        ],
        [
          "CRONOGRAMA",
          parseInt(results[6].percentage),
          `${parseInt(results[6].percentage)}%`,
        ],
        [
          "SALUD Y SEGURIDAD",
          parseInt(results[7].percentage),
          `${parseInt(results[7].percentage)}%`,
        ],
      ];
  
      var dataGraf = google.visualization.arrayToDataTable(grafico);
  
      var optionsGraf = {
        legend: "bottom",
        height: 400,
        title: "GRAFICA PORCENTAJES",
        pieHole: 0,
        colors: ["#4B4DFE", "#7F81FF", "#FE7E7E"],
      };
  
      // Dibujar la gráfica
      var chart3 = new google.visualization.ColumnChart(
        document.getElementById("grafica")
      );
      chart3.draw(dataGraf, optionsGraf);
    }
  
    // Llamamos a la función para dibujar la gráfica
    google.charts.load("current", {
      packages: ["corechart", "bar"],
    });
    google.charts.setOnLoadCallback(drawChart);
  } catch (error) {
    console.log(error, 'errores');
  }
  