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
  d3.select("#scene-title").text(scenes[scene].title);
  d3.select("#vis").html(""); // Clear SVG
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

function scene1() {
  const svg = d3.select("#vis").append("svg")
      .attr("width", 960)
      .attr("height", 600);

  const topGames = data
    .sort((a, b) => d3.descending(+a.Global_Sales, +b.Global_Sales))
    .slice(0, 10);

  const x = d3.scaleLinear()
    .domain([0, d3.max(topGames, d => +d.Global_Sales)])
    .range([0, 800]);

  const y = d3.scaleBand()
    .domain(topGames.map(d => d.Name))
    .range([0, 500])
    .padding(0.1);

  svg.selectAll("rect")
    .data(topGames)
    .enter()
    .append("rect")
    .attr("x", 100)
    .attr("y", d => y(d.Name))
    .attr("width", d => x(+d.Global_Sales))
    .attr("height", y.bandwidth())
    .attr("fill", "#69b3a2");

  svg.selectAll("text")
    .data(topGames)
    .enter()
    .append("text")
    .attr("x", 95)
    .attr("y", d => y(d.Name) + y.bandwidth() / 2)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "middle")
    .text(d => d.Name);
}

function scene2() {
  d3.select("#vis").append("p").text("Scene 2: Genre trends will go here.");
}

function scene3() {
  d3.select("#vis").append("p").text("Scene 3: Regional breakdown goes here.");
}

function scene4() {
  d3.select("#vis").append("p").text("Scene 4: Exploration mode with filters goes here.");
}
