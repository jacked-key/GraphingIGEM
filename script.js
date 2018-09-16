/*jshint esversion: 6 */
const svgHeight = 800; //svg is container containing everything
const svgWidth = 800;
var shadow = true; //shadow determines the drop shadow, not sure if implementing yet
var GFParr = [];
var hrpRarr = [];
var hrpSarr = [];
var isParsed = true; //whether the data is parsed or not
var freq = 1; //freq is current frequency
var GFPpath = null;
var hrpRpath = null;
var hrpSpath = null;
const datalength = 8; //length of data aka how many frequencies .
const datarange = 1; //how wide the data spreads
var hrpR = null; //these contain the circles that shows the data
var hrpS = null;
var GFP = null;
var focus = null;
var movable = true;
//svg is the svg container reference svg2 might be animation
/*const svg2 = d3.select("body").append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight); */
const svg = d3.select("body").append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .style("opacity", 0);

// svg repositioning using jquery
$("svg").css({top: 50, left: 200, position:'absolute'});
$("rect").css({position:'absolute'});
//creating the graph

const graphHeight = 300;
const graphWidth = 600;
const offsety = 100; //offset of the svg from border
const offsetx = (svgWidth - graphWidth)/2;
//creating interpolation function for our graph
var xScale = d3.scaleLinear().domain([0,datalength]).range([0, graphWidth]);
var yScale = d3.scaleLinear().domain([0,datarange]).range([graphHeight, 0]);
//Our function to convert Matrix to points on a line
const line = d3.line()
             .curve(d3.curveLinear)
             .x(function(d) {return xScale(d[0]-1);}) //since the first column is 1->data value, this extablished the domain first column basically 1,2,3,4...
             .y(function(d) {return yScale(d[freq]);});
createMovingObject();
createGraph();
createSlider(); //Slider
parseData(); //read data and make graphs
makeShadow(); //drop shadow
MyTransition();



//all functions
function parseData() { //asynchronous thing
  //creates an array of arrays with arr[time][data]
  d3.csv("/Data/GFP.csv", function(data) {
    GFParr.push(Object.values(data));
    if (GFParr.length == datalength+1) {
      //console.log(arr); testing
      GFPpath = svg.append("path").attr("d", line(GFParr))
                        .attr("stroke", "red")
                        .attr("stroke-width", 1)
                        .attr("fill", "none")
                        .style("filter", function() { return shadow ? "url(#drop-shadow)" : "" ;})
                        .attr("transform", "translate("+offsetx+","+ offsety+")");
    }
  });
  d3.csv("/Data/hrpS.csv", function(data) {
    hrpSarr.push(Object.values(data));
    if (hrpSarr.length == datalength+1) {
      //console.log(arr); testing
      hrpSpath = svg.append("path").attr("d", line(hrpSarr))
                        .attr("stroke", "blue")
                        .attr("stroke-width", 1)
                        .attr("fill", "none")
                        .style("filter", function() { return shadow ? "url(#drop-shadow)" : "" ;})
                        .attr("transform", "translate("+offsetx+","+ offsety+")");
    }
  });
  d3.csv("/Data/hrpR.csv", function(data) {
    hrpRarr.push(Object.values(data));
    if (hrpRarr.length == datalength+1) {
      //console.log(arr); testing
      hrpRpath = svg.append("path").attr("d", line(hrpRarr))
                        .attr("stroke", "green")
                        .attr("stroke-width", 1)
                        .attr("fill", "none")
                        .style("filter", function() { return shadow ? "url(#drop-shadow)" : "" ;})
                        .attr("transform", "translate("+offsetx+","+ offsety+")");
    }
  });
}
function createGraph() { //creates the shape of the graph
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
     .on("click", mouseClick)
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
    .max(datalength)
    .width(600)
    .ticks(5)
    .default(1)
    //.step(1) need this for step slider
    .on("end", val => {
      d3.select("#value").text(val);
      movable = true;
      mouseOut(); 
      freq = Math.round(val); //I used round istead of floor because the simple slider uses round on axis
      //if (isParsed) {
        GFPpath.transition().attr("d", line(GFParr));
        hrpSpath.transition().attr("d", line(hrpSarr));
        hrpRpath.transition().attr("d", line(hrpRarr));
      //  }
      });
    svg.append("g")
      .attr("transform", "translate("+ (offsetx)+","+ (graphHeight + offsety + 50) +")")
      .call(slider);
}
function createMovingObject() {
  focus = svg.append("g") //focus is our object that moves
                 .attr("class", "focus")
                 .raise()
                 .style("display", "none");
  focus.append("line")
       .style("stroke", "black")
       .attr("x1", 0)
       .attr("y1", offsety)
       .attr("x2", 0)
       .attr("y2", offsety+graphHeight);
  GFP = focus.append("circle")
       .attr("r", 5)
       .attr("fill", "red")
       .attr("stroke", "white");
  hrpR = focus.append("circle")
       .attr("r", 5)
       .attr("fill", "green")
       .attr("stroke", "white");
  hrpS = focus.append("circle")
       .attr("r", 5)
       .attr("fill", "blue")
       .attr("stroke", "white");
}
function mouseClick() {
  movable = !movable;
}
function mouseMove() {
  if (movable) {
    focus.select("line").attr("transform", "translate(" + d3.mouse(this)[0] + ",0)");
    console.log(GFParr[Math.round(xScale.invert(d3.mouse(this)[0] - offsetx))][freq]);

    let xVAL = xScale.invert(d3.mouse(this)[0] - offsetx);
    let xRound = Math.floor(xVAL);
    let GFPyValue = (yScale(GFParr[xRound+1][freq]) - yScale(GFParr[xRound][freq]))*(xVAL-xRound)+offsety+yScale(GFParr[xRound][freq]);
    let hrpSyValue = (yScale(hrpSarr[xRound+1][freq]) - yScale(hrpSarr[xRound][freq]))*(xVAL-xRound)+offsety+yScale(hrpSarr[xRound][freq]);
    let hrpRyValue = (yScale(hrpRarr[xRound+1][freq]) - yScale(hrpRarr[xRound][freq]))*(xVAL-xRound)+offsety+yScale(hrpRarr[xRound][freq]);
    //let yVAL = (yScale(arr[Math.round(xScale.invert(d3.mouse(this)[0] - offsetx))][freq])+offsety);
    d3.select("#value").text("GFP = " + GFPyValue + ", hrpS = " + hrpSyValue + ", hrpR = " + hrpRyValue);

    GFP.attr("transform", "translate(" + d3.mouse(this)[0] + "," + GFPyValue + ")");
    hrpS.attr("transform", "translate(" + d3.mouse(this)[0] + "," + hrpSyValue + ")");
    hrpR.attr("transform", "translate(" + d3.mouse(this)[0] + "," + hrpRyValue + ")");
  }

  //focus.select("rect").attr("transform", "translate(" + d3.mouse(this)[0] + "," + GFPyValue + ")"); originally wanted moving rect.
}
function mouseOut() {
  if (movable) {
    focus.style("display", "none");
  }

}
function mouseOver() {
  if (movable) {
    focus.style("display", null);
  }
}
function MyTransition() {
  svg.transition().delay(1000).duration(1000).style("opacity", 1);
}
function makeShadow() {
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
            .attr("in", "SourceGraphic") //SourceAlpha for black shadow/ matrixOut for color / graphic for its own color
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
}
