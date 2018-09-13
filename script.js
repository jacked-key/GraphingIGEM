/*jshint esversion: 6 */
const svgHeight = 800;
const svgWidth = 1300;
var shadow = true;
var arr = [];
var isParsed = false;
var freq = 1;
var path = null;
const datalength = 204;
const datarange = 1;
//svg is the svg container reference svg2 might be animation
/*const svg2 = d3.select("body").append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight); */
const svg = d3.select("body").append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .style("opacity", 0);
//focus is our object that moves
var focus = svg.append("g")
               .attr("class", "focus")
               .style("display", "none");
// svg repositioning using jquery
$("svg").css({top: 50, left: 200, position:'absolute'});
$("rect").css({position:'absolute'});


//creating the graph

const graphHeight = 600;
const graphWidth = 1200;
const offsety = 100; //offset of the svg from border
const offsetx = (svgWidth - graphWidth)/2;
//creating interpolation function for our graph
var xScale = d3.scaleLinear().domain([0,datalength]).range([0, graphWidth]);
var yScale = d3.scaleLinear().domain([0,datarange]).range([graphHeight, 0]);
//Our function to convert Matrix to points on a line
const line = d3.line()
             .curve(d3.curveLinear)
             .x(function(d) {return xScale(d[0]-1);}) //since the first column is 1->data value, this extablished the domain
             .y(function(d) {return yScale(d[freq]);});
createGraph();
createMovingObject();
//Slider
createSlider();
//read data and make graphs
parseData();

//shadow drop
if (shadow) {
  let defs = svg.append("defs");
  let stdDeviation = 3;
  let filter = defs.append("filter")
                   .attr("id", "drop-shadow")
                   .attr("height", "130%")
                   .attr("filterUnits","userSpaceOnUse");
  filter.append("feColorMatrix")
        .attr("result", "offOut")
        .attr("in", "offOut")
        .attr("type", "matrix")
        .attr("values", "1 1 1 1 1 " +
                        "0 0 0 0 0 " +
                        "0 0 0 0 0 " +
                        "0 0 0 1 0");
  filter.append("feGaussianBlur")
          .attr("in", "matrixOut") //SourceAlpha for black shadow
          .attr("stdDeviation", stdDeviation)
          .attr("result", "blur");
  filter.append("feOffset")
        .attr("in", "blur")
        .attr("dx", stdDeviation)
        .attr("dy", stdDeviation)
        .attr("result", "offsetBlur");
  let feMerge = filter.append("feMerge");
  feMerge.append("feMergeNode").attr("in","offsetBlur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");
}

MyTransition();

function parseData() { //asynchronous thing
  //creates an array of arrays with arr[time][data]
  d3.csv("/data.csv", function(data) {
    arr.push(Object.values(data));
    if (arr.length == datalength) {

      console.log(arr);
      isParsed = true;

      path = svg.append("path").attr("d", line(arr))
                        .attr("stroke", "red")
                        .attr("stroke-width", 1)
                        .attr("fill", "none")
                        .style("filter", function() { return shadow ? "url(#drop-shadow)" : "" ;})
                        .attr("transform", "translate("+offsetx+","+ offsety+")");
    }
  });
}
function createGraph() {
  var x_axis = d3.axisBottom().scale(xScale).ticks(20);
  var y_axis = d3.axisLeft().scale(yScale);
  //overlay that determines points
  svg.append("rect")
     .attr("pointer-events", "all")
     .attr("class", "overlay")
     .attr("x", offsetx)
     .attr("y", offsety)
     .attr("width", graphWidth)
     .attr("height", graphHeight)
     .attr("fill", "none")//you can also set color
     .on("mouseover", mouseOver)
     .on("mouseout", mouseOut)
     .on("mousemove", mouseMove);
  for (let i = 1; i<11 ; i++) {
    svg.append("line")
       .style("stroke", "grey")
       .style("stroke-dasharray", "8,8")
       .style("opacity", 0.3)
       .attr("x1", offsetx)
       .attr("y1", yScale(0.1*i)+offsety)
       .attr("x2", graphWidth + offsetx)
       .attr("y2", yScale(0.1*i)+offsety);
  }
  svg.append("g")
     .call(y_axis)
     .attr("transform", "translate(" + offsetx + ","+ offsety +")");
  svg.append("g")
     .call(x_axis)
     .attr("transform", "translate("+offsetx +"," + (graphHeight+offsety) + ")");
}
function createSlider() {
  var slider = d3.sliderHorizontal()
    .min(1)
    .max(58)
    .width(600)
    .ticks(58)
    .default(20)
    .step(1)
    .on("end", val => {
      d3.select("#value").text(val);
      freq = val;
      if (isParsed) {
        path.transition().attr("d", line(arr));
        }
      });
    svg.append("g")
      .attr("transform", "translate(300,750)")
      .call(slider);
}
function createMovingObject() {
  focus.append("line")
       .style("stroke", "blue")
       .attr("x1", 0)
       .attr("y1", offsety)
       .attr("x2", 0)
       .attr("y2", offsety+graphHeight);
  focus.append("circle")
       .attr("r", 5)
       .attr("fill", "blue");
}
function mouseMove() {
  focus.select("line").attr("transform", "translate(" + d3.mouse(this)[0] + ",0)");
  console.log(arr[Math.round(xScale.invert(d3.mouse(this)[0] - offsetx))][freq]);

  let xVAL = xScale.invert(d3.mouse(this)[0] - offsetx);
  let xRound = Math.floor(xVAL);
  let yValue = (yScale(arr[xRound+1][freq]) - yScale(arr[xRound][freq]))*(xVAL-xRound)+offsety+yScale(arr[xRound][freq]);
  //let yVAL = (yScale(arr[Math.round(xScale.invert(d3.mouse(this)[0] - offsetx))][freq])+offsety);

  focus.select("circle").attr("transform", "translate(" + d3.mouse(this)[0] + "," + yValue + ")");
}
function mouseOut() {
  focus.style("display", "none");
}
function mouseOver() {
  focus.style("display", null);
}
function MyTransition() {
  svg.transition().delay(1000).duration(1000).style("opacity", 1);
}
