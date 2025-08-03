let scene = 0;
let data;

const scenes = [
  { title: "Top-Selling Games of All Time", render: scene1 },
  { title: "Genre Trends Over Time", render: scene2 },
  { title: "Regional Preferences", render: scene3 },
  { title: "Explore All Games", render: scene4 }
];

d3.csv("vgsales_cleaned.csv").then(dataset => {
  data = dataset;
  renderScene();
});

function renderScene() {
  d3.select("#scene-title")
  .html(`<h2>${scenes[scene].title}</h2>`);
  d3.select("#vis").html(""); // Clear container
  scenes[scene].render();
}

d3.select("#next").on("click", () => {
  if (scene < scenes.length - 1) scene++;
  renderScene();
});

d3.select("#prev").on("click", () => {
  if (scene > 0) scene--;
  renderScene();
});

// ------------------------
// Scene 1: Top 10 Games
// ------------------------
function scene1() {
  const margin = { top: 40, right: 40, bottom: 40, left: 240 };
  const width = 960 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const topGames = data
    .sort((a, b) => d3.descending(+a.Global_Sales, +b.Global_Sales))
    .slice(0, 10);

  const x = d3.scaleLinear()
    .domain([0, d3.max(topGames, d => +d.Global_Sales)])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(topGames.map(d => d.Name))
    .range([0, height])
    .padding(0.1);

  // Bars
  g.selectAll("rect")
    .data(topGames)
    .enter()
    .append("rect")
    .attr("x", 0)                  // start from 0 inside group (left edge)
    .attr("y", d => y(d.Name))
    .attr("width", d => x(+d.Global_Sales))
    .attr("height", y.bandwidth())
    .attr("fill", "#69b3a2");

  // Labels
  g.selectAll("text")
    .data(topGames)
    .enter()
    .append("text")
    .attr("x", -15)                // position labels *left* of bars, inside margin
    .attr("y", d => y(d.Name) + y.bandwidth() / 2)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .text(d => d.Name);
}


// ------------------------
// Scene 2: Genre Trends
// ------------------------
function scene2() {
  d3.csv("genre_by_year.csv").then(genreData => {
    const svg = d3.select("#vis").append("svg")
      .attr("width", 960)
      .attr("height", 600);

    const margin = { top: 40, right: 100, bottom: 40, left: 60 },
          width = 960 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    genreData.forEach(d => {
      d.Year = +d.Year;
      d.Global_Sales = +d.Global_Sales;
    });

    const genres = Array.from(new Set(genreData.map(d => d.Genre)));

    const x = d3.scaleLinear()
      .domain(d3.extent(genreData, d => d.Year))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(genreData, d => d.Global_Sales)])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(genres)
      .range(d3.schemeTableau10);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    g.append("g").call(d3.axisLeft(y));

    const line = d3.line()
      .x(d => x(d.Year))
      .y(d => y(d.Global_Sales));

    const genreGroups = d3.group(genreData, d => d.Genre);
    genreGroups.forEach((values, key) => {
      g.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", color(key))
        .attr("stroke-width", 2)
        .attr("d", line);
    });

    const legend = svg.append("g")
      .attr("transform", `translate(${width + margin.left + 10},${margin.top})`);

    genres.forEach((genre, i) => {
      const yOffset = i * 20;
      legend.append("rect")
        .attr("x", 0).attr("y", yOffset)
        .attr("width", 10).attr("height", 10)
        .attr("fill", color(genre));
      legend.append("text")
        .attr("x", 15).attr("y", yOffset + 9)
        .text(genre)
        .style("font-size", "12px");
    });
  });
}

// ------------------------
// Scene 3: Genre by Region
// ------------------------
function scene3() {
  d3.csv("genre_by_region.csv").then(regionData => {
    const svg = d3.select("#vis").append("svg")
      .attr("width", 960)
      .attr("height", 600);

    const margin = { top: 40, right: 20, bottom: 60, left: 60 },
          width = 960 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const subgroups = ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"];
    const genres = regionData.map(d => d.Genre);

    const x = d3.scaleBand()
      .domain(genres)
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(regionData, d =>
        subgroups.reduce((sum, key) => sum + +d[key], 0)
      )])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain(subgroups)
      .range(d3.schemeSet2);

    const stackedData = d3.stack().keys(subgroups)(regionData);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");

    g.append("g").call(d3.axisLeft(y));

    g.selectAll("g.layer")
      .data(stackedData)
      .enter().append("g")
      .attr("fill", d => color(d.key))
      .selectAll("rect")
      .data(d => d)
      .enter().append("rect")
      .attr("x", d => x(d.data.Genre))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());

    const legend = svg.append("g")
      .attr("transform", `translate(${width - 100},${margin.top})`);
    subgroups.forEach((region, i) => {
      const yOffset = i * 20;
      legend.append("rect")
        .attr("x", 0).attr("y", yOffset)
        .attr("width", 10).attr("height", 10)
        .attr("fill", color(region));
      legend.append("text")
        .attr("x", 15).attr("y", yOffset + 9)
        .text(region)
        .style("font-size", "12px");
    });
  });
}

// ------------------------
// Scene 4: Exploration
// ------------------------
function scene4() {
  const container = d3.select("#vis");
  
  container.append("label")
    .text("Filter by Genre: ")
    .style("margin-right", "8px");

  const dropdown = container.append("select")
    .attr("id", "genre-filter");

  dropdown.append("option")
    .attr("value", "All")
    .text("All Genres");

  const svg = container.append("svg")
    .attr("width", 960)
    .attr("height", 600);

  const margin = { top: 40, right: 40, bottom: 60, left: 60 },
        width = 960 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  function updateScatter(genre) {
    const filtered = genre === "All" ? data : data.filter(d => d.Genre === genre);

    const x = d3.scaleLinear()
      .domain(d3.extent(filtered, d => +d.Year))
      .range([0, width])
      .nice();

    const y = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => +d.Global_Sales)])
      .range([height, 0])
      .nice();

    g.selectAll("*").remove();

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    g.append("g").call(d3.axisLeft(y));

    const tooltip = container.append("div")
      .style("position", "absolute")
      .style("padding", "6px 10px")
      .style("background", "#eee")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("display", "none");

    g.selectAll("circle")
      .data(filtered)
      .enter()
      .append("circle")
      .attr("cx", d => x(+d.Year))
      .attr("cy", d => y(+d.Global_Sales))
      .attr("r", 4)
      .attr("fill", "#4682b4")
      .on("mouseover", (event, d) => {
        tooltip.style("display", "block")
          .html(`<strong>${d.Name}</strong><br>Year: ${d.Year}<br>Sales: ${d.Global_Sales}M`);
      })
      .on("mousemove", event => {
        tooltip.style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.style("display", "none"));
  }

  const genres = Array.from(new Set(data.map(d => d.Genre))).sort();
  genres.forEach(genre => {
    dropdown.append("option")
      .attr("value", genre)
      .text(genre);
  });

  dropdown.on("change", function() {
    updateScatter(this.value);
  });

  updateScatter("All");
}
