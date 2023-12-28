
// TODO: Detect and adapt to available block size
// const w = client.screenWidth - ( margin.left + margin.right );

/**
 * Reference: https://d3-graph-gallery.com/graph/arc_highlight.html
 */

// set the dimensions and margins of the graph
var margin = {top: 20, right: 30, bottom: 20, left: 30},
  width = 1000 - margin.left - margin.right,
  height = 550 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");


function update(data) {

  // console.log(data);

  // List of node names
  var allNodes = data.nodes.map(function(d){return d.name})

  // A linear scale to position the nodes on the X axis
  var x = d3.scalePoint()
    .range([0, width])
    .domain(allNodes)

  
  // Add the circle for the nodes
  var nodes = svg
    .selectAll("circle")

  nodes
    .data(data.nodes)
    .enter().append("circle")
      .attr("cx", width)
      .attr("cy", height - 30)
      .attr("r", 8)
      .style("fill", "#ccc")
    // Applies to both links and links.enter()
    .merge(nodes)
      .transition()
      .attr("cx", function(d){ return(x(d.name))})

  
  // TODO: Combine with nodes
  //
  // ..and give them a label
  var labels = svg
    .selectAll("text")
    .data(data.nodes)

  labels
    .enter().append(function(d) {
        const names = d.name.split(' ');      
        const elText = document.createElementNS(d3.namespaces.svg, 'text');
        elText.setAttribute("font-size", "0.7rem");
        elText.setAttribute("style", "text-anchor: middle");
        elText.setAttribute("transform", `translate(${x(d.name)} ${height})`);

        const elFirst = document.createElementNS(d3.namespaces.svg, 'tspan');
        elFirst.textContent = names[0];

        const elSecond = document.createElementNS(d3.namespaces.svg, 'tspan');
        elSecond.setAttribute("x", 0);
        elSecond.setAttribute("y", 12);
        elSecond.textContent = names[1];

        elText.appendChild(elFirst);
        elText.appendChild(elSecond);

        return elText;
      })
    .merge(labels)
      .transition()
      .attr("transform", function(d) { return `translate(${x(d.name)} ${height})` });

  labels.exit().remove();


  // Add hash map between IDs and their nodes
  var idToNode = {};
  data.nodes.forEach(function (n) {
    idToNode[n.id] = n;
  });


  // Add the links
  var links = svg
    .selectAll('path')
    .data(data.links);

  links
    .enter().append('path')
      .attr("fill", "none")
      .attr("stroke", "#f00")
      .attr("stroke-width", 0)

    // Applies to both links and links.enter()
    .merge(links)
      .transition()
      .attr("stroke", "#ccc")
      .attr("stroke-width", function(d) { return d.weight })
      .attr('d', function (d) {
        let start = x(idToNode[d.source].name)      // X position of start node on the X axis
        let end = x(idToNode[d.target].name)        // X position of end node
        return ['M', start, height-30,              // the arc starts at the coordinate x=start, y=height-30 (where the starting node is)
          'A',                                      // This means we're gonna build an elliptical arc
          (start - end)/2, ',',                     // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
          (start - end)/2, 0, 0, ',',
          start < end ? 1 : 0, end, ',', height-30] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
          .join(' ');
      })      

  links.exit().remove();


  // DEBUG
  //
  /*
  // TODO: Get all children appended to SVG
  // const foo = svg.selectAll('mylinks');
  const g = svg._groups[0][0];
  console.log('Nodes:', g.children.length);
  */




    // Add the highlighting functionality
    nodes
      .on('mouseover', function (d) {

        // Highlight the nodes
        nodes.attr('fill', "#ccc");

        d3.select(this).style('fill', 'orange')

        // Highlight the connections
        links
          .style('stroke', function (link_d) {
            if (link_d.source === d.id || link_d.target === d.id) {
              return 'orange'
            } else {
              return '#ccc';
            }
          })
      })
      .on('mouseout', function (d) {
        nodes.style('fill', "#ccc")
        links.style('stroke', '#ccc')
      })
}

export {
    update
};
